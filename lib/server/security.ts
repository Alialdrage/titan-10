import { Redis } from "@upstash/redis";
import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

const RATE_LIMIT_SCRIPT = [
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  "return count",
].join("\n");

type Scope = "chat" | "crew";
type Limits = { perMinute: number; perDay: number };
type AccessResult =
  | { ok: true; uid: string }
  | { ok: false; response: Response };

type BodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: Response };

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<BodyResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return { ok: false, response: errorResponse("ترويسة حجم الطلب غير صالحة.", 400) };
    }
    if (declaredLength > maxBytes) {
      return { ok: false, response: errorResponse("حجم الطلب أكبر من المسموح.", 413) };
    }
  }

  if (!request.body) {
    return { ok: false, response: errorResponse("جسم الطلب مطلوب.", 400) };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, response: errorResponse("حجم الطلب أكبر من المسموح.", 413) };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, response: errorResponse("تعذر قراءة جسم الطلب.", 400) };
  }

  if (totalBytes === 0) {
    return { ok: false, response: errorResponse("جسم الطلب فارغ.", 400) };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return { ok: true, body };
  } catch {
    return { ok: false, response: errorResponse("صيغة JSON غير صحيحة.", 400) };
  }
}

async function verifyFirebaseUser(request: Request): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: Response }
> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return {
      ok: false,
      response: errorResponse("مصادقة Titan غير مهيأة على الخادم.", 503),
    };
  }

  const authorization = request.headers.get("authorization") || "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match) {
    return {
      ok: false,
      response: errorResponse("يلزم تسجيل الدخول للمتابعة.", 401),
    };
  }

  try {
    const { payload } = await jwtVerify(match[1], FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return {
        ok: false,
        response: errorResponse("رمز المصادقة غير صالح.", 401),
      };
    }

    return { ok: true, uid: payload.sub };
  } catch {
    return {
      ok: false,
      response: errorResponse("انتهت جلسة الدخول أو أن رمز المصادقة غير صالح.", 401),
    };
  }
}

async function incrementWindow(
  redis: Redis,
  key: string,
  windowSeconds: number,
): Promise<number> {
  const result = await redis.eval<number>(
    RATE_LIMIT_SCRIPT,
    [key],
    [String(windowSeconds)],
  );
  return Number(result);
}

export async function authorizeAiRequest(
  request: Request,
  scope: Scope,
  limits: Limits,
): Promise<AccessResult> {
  const auth = await verifyFirebaseUser(request);
  if (!auth.ok) return auth;

  const redis = getRedis();
  if (!redis) {
    return {
      ok: false,
      response: errorResponse("حماية الاستخدام غير مهيأة؛ تم إيقاف طلبات الذكاء الاصطناعي.", 503),
    };
  }

  const minuteKey = `titan:quota:${scope}:minute:${auth.uid}`;
  const day = new Date().toISOString().slice(0, 10);
  const dayKey = `titan:quota:${scope}:day:${day}:${auth.uid}`;

  try {
    const minuteCount = await incrementWindow(redis, minuteKey, 60);
    if (minuteCount > limits.perMinute) {
      return {
        ok: false,
        response: errorResponse(
          "تم تجاوز الحد المؤقت للطلبات. حاول بعد دقيقة.",
          429,
          { "Retry-After": "60" },
        ),
      };
    }

    const dayCount = await incrementWindow(redis, dayKey, 86_400);
    if (dayCount > limits.perDay) {
      const nextUtcMidnight = Date.parse(`${day}T00:00:00.000Z`) + 86_400_000;
      const secondsUntilUtcReset = Math.max(
        1,
        Math.ceil((nextUtcMidnight - Date.now()) / 1000),
      );
      return {
        ok: false,
        response: errorResponse(
          "وصلت إلى الحد اليومي المسموح لهذه الخدمة.",
          429,
          { "Retry-After": String(secondsUntilUtcReset) },
        ),
      };
    }

    return { ok: true, uid: auth.uid };
  } catch {
    // Fail closed: never fall back to per-instance limits for billable AI routes.
    return {
      ok: false,
      response: errorResponse("تعذر التحقق من حصة الاستخدام؛ أُوقف الطلب لحماية الحساب.", 503),
    };
  }
}
