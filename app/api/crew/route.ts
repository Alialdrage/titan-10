export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_BODY_BYTES = 8_192;

// Per-instance protection only. Use a shared rate-limit store before scaling
// this endpoint across multiple serverless instances.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
let cleanupCounter = 0;

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

function isRateLimited(request: Request): { limited: boolean; retryAfter: number } {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = request.headers.get("x-real-ip")?.trim() || forwardedFor || "unknown";
  const now = Date.now();

  cleanupCounter += 1;
  if (cleanupCounter % 128 === 0) {
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  if (rateLimitStore.size > 10_000) {
    const oldestKey = rateLimitStore.keys().next().value;
    if (oldestKey) rateLimitStore.delete(oldestKey);
  }

  const current = rateLimitStore.get(clientIp);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { limited: false, retryAfter: 0 };
}

export async function POST(request: Request) {
  const limit = isRateLimited(request);
  if (limit.limited) {
    return errorResponse(
      "تم تجاوز الحد المؤقت لطلبات الوكلاء. حاول بعد قليل.",
      429,
      { "Retry-After": String(limit.retryAfter) },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("حجم الطلب أكبر من المسموح.", 413);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse("حجم الطلب أكبر من المسموح.", 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("صيغة الطلب غير صحيحة.", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("topic" in body) ||
    typeof (body as { topic: unknown }).topic !== "string"
  ) {
    return errorResponse("يرجى إرسال موضوع نصي للبحث والتحليل.", 400);
  }

  const topic = (body as { topic: string }).topic.trim();
  if (topic.length < 3 || topic.length > 500) {
    return errorResponse("يجب أن يكون الموضوع بين 3 و500 حرف.", 400);
  }

  const serviceUrl = process.env.CREW_SERVICE_URL;
  const serviceToken = process.env.CREW_API_TOKEN;
  if (!serviceUrl || !serviceToken) {
    return errorResponse("خدمة الوكلاء غير مربوطة أو غير مهيأة حالياً.", 503);
  }

  let endpoint: URL;
  try {
    endpoint = new URL("/crew", serviceUrl);
  } catch {
    return errorResponse("إعداد عنوان خدمة الوكلاء غير صالح.", 503);
  }

  if (
    endpoint.protocol !== "https:" &&
    !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname))
  ) {
    return errorResponse("يجب أن تستخدم خدمة الوكلاء اتصال HTTPS.", 503);
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({ topic }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!upstream.ok) {
      return errorResponse(
        upstream.status === 401
          ? "تعذر التحقق من اتصال خدمة الوكلاء."
          : upstream.status === 503
            ? "خدمة الوكلاء غير مهيأة؛ تحقق من مفاتيحها وإعداداتها."
            : "فشلت خدمة الوكلاء في تنفيذ المهمة.",
        upstream.status === 503 ? 503 : 502,
      );
    }

    const data: unknown = await upstream.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !("result" in data) ||
      typeof (data as { result: unknown }).result !== "string"
    ) {
      return errorResponse("وصل رد غير صالح من خدمة الوكلاء.", 502);
    }

    return Response.json({ result: (data as { result: string }).result });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return errorResponse("استغرقت مهمة الوكلاء وقتاً أطول من المسموح.", 504);
    }
    return errorResponse("تعذر الاتصال بخدمة الوكلاء.", 502);
  }
}
