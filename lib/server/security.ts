import { Redis } from "@upstash/redis";
import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

const QUOTA_SCRIPT = [
  "local minuteCount = tonumber(redis.call('GET', KEYS[1]) or '0')",
  "local dayCount = tonumber(redis.call('GET', KEYS[2]) or '0')",
  "if minuteCount >= tonumber(ARGV[1]) then",
  "  return {0, redis.call('TTL', KEYS[1])}",
  "end",
  "if dayCount >= tonumber(ARGV[2]) then",
  "  return {1, redis.call('TTL', KEYS[2])}",
  "end",
  "local nextMinute = redis.call('INCR', KEYS[1])",
  "if nextMinute == 1 then redis.call('EXPIRE', KEYS[1], 60) end",
  "local nextDay = redis.call('INCR', KEYS[2])",
  "if nextDay == 1 then redis.call('EXPIRE', KEYS[2], 86400) end",
  "return {2, 0}",
].join("\n");

type Scope = "chat" | "crew";
type Limits = { perMinute: number; perDay: number };
type AccessResult =
  | { ok: true; uid: string }
  | { ok: false; response: Response };

type BodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: Response };

type QuotaResult =
  | { allowed: true }
  | { allowed: false; window: "minute" | "day"; retryAfter: number };

let redisClient: Redis | null | undefined;

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
      redisClient = null;
      return redisClient;
    }
    redisClient = new Redis({ url: parsedUrl.toString(), token });
    return redisClient;
  } catch {
    redisClient = null;
    return redisClient;
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<BodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    return { ok: false, response: errorResponse("إعداد حد حجم الطلب غير صالح.", 500) };
  }

  const contentType = request.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { ok: false, response: errorResponse("يجب إرسال الطلب بصيغة JSON.", 415) };
  }

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
        try { await reader.cancel(); } catch { /* The body is already rejected. */ }
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
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return { ok: true, body };
  } catch {
    return { ok: false, response: errorResponse("صيغة JSON أو ترميز UTF-8 غير صحيح.", 400) };
  }
}

async function verifyFirebaseUser(request: Request): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: Response }
> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !publicProjectId || projectId !== publicProjectId) {
    return {
      ok: false,
      response: errorResponse("إعداد مشروع Firebase غير مكتمل أو غير متطابق بين الواجهة والخادم.", 503),
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

    const now = Math.floor(Date.now() / 1000);
    const firebaseClaim = payload.firebase;
    if (
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      payload.sub.length > 128 ||
      typeof payload.iat !== "number" ||
      !Number.isInteger(payload.iat) ||
      typeof payload.exp !== "number" ||
      !Number.isInteger(payload.exp) ||
      typeof payload.auth_time !== "number" ||
      !Number.isInteger(payload.auth_time) ||
      payload.auth_time > now + 60 ||
      typeof firebaseClaim !== "object" ||
      firebaseClaim === null ||
      typeof (firebaseClaim as Record<string, unknown>).sign_in_provider !== "string"
    ) {
      return {
        ok: false,
        response: errorResponse("رمز المصادقة لا يحتوي على مطالبات Firebase المطلوبة.", 401),
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

async function consumeQuota(
  redis: Redis,
  uid: string,
  scope: Scope,
  limits: Limits,
): Promise<QuotaResult> {
  if (
    !Number.isSafeInteger(limits.perMinute) ||
    limits.perMinute < 1 ||
    !Number.isSafeInteger(limits.perDay) ||
    limits.perDay < 1
  ) {
    throw new Error("Invalid quota configuration");
  }

  const minuteKey = `titan:quota:${scope}:minute:${uid}`;
  const day = new Date().toISOString().slice(0, 10);
  const dayKey = `titan:quota:${scope}:day:${day}:${uid}`;
  const raw = await redis.eval(
    QUOTA_SCRIPT,
    [minuteKey, dayKey],
    [String(limits.perMinute), String(limits.perDay)],
  );

  if (
    !Array.isArray(raw) ||
    raw.length < 2 ||
    !Number.isInteger(Number(raw[0])) ||
    !Number.isFinite(Number(raw[1]))
  ) {
    throw new Error("Invalid quota response");
  }

  const status = Number(raw[0]);
  const ttl = Math.max(1, Math.ceil(Number(raw[1])));
  if (status === 2) return { allowed: true };
  if (status === 0) return { allowed: false, window: "minute", retryAfter: ttl };
  if (status === 1) {
    const nextUtcMidnight = Date.parse(`${day}T00:00:00.000Z`) + 86_400_000;
    return {
      allowed: false,
      window: "day",
      retryAfter: Math.max(1, Math.ceil((nextUtcMidnight - Date.now()) / 1000)),
    };
  }

  throw new Error("Unknown quota response");
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

  try {
    const quota = await consumeQuota(redis, auth.uid, scope, limits);
    if (!quota.allowed) {
      return {
        ok: false,
        response: errorResponse(
          quota.window === "minute"
            ? "تم تجاوز الحد المؤقت للطلبات. حاول بعد قليل."
            : "وصلت إلى الحد اليومي المسموح لهذه الخدمة.",
          429,
          { "Retry-After": String(quota.retryAfter) },
        ),
      };
    }

    return { ok: true, uid: auth.uid };
  } catch {
    // Fail closed: never fall back to per-instance counters for billable AI routes.
    return {
      ok: false,
      response: errorResponse("تعذر التحقق من حصة الاستخدام؛ أُوقف الطلب لحماية الحساب.", 503),
    };
  }
}
