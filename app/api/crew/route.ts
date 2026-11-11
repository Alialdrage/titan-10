import { authorizeAiRequest, readJsonBody } from "@/lib/server/security";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;
const MAX_UPSTREAM_BYTES = 24 * 1024;
const CREW_LIMITS = { perMinute: 1, perDay: 3 };

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

async function readBoundedJson(response: Response, maxBytes: number): Promise<unknown | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try { await reader.cancel(); } catch { /* Response is rejected. */ }
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (process.env.CREW_API_ENABLED !== "true") {
    return errorResponse("خدمة الوكلاء معطّلة حتى تهيئة مصادقة المستخدمين والحصص المشتركة.", 503);
  }

  const serviceUrl = process.env.CREW_SERVICE_URL;
  const serviceToken = process.env.CREW_API_TOKEN;
  if (!serviceUrl || !serviceToken || serviceToken.length < 32) {
    return errorResponse("خدمة الوكلاء غير مهيأة بأمان؛ يلزم عنوان صالح ورمز خدمة قوي.", 503);
  }

  let endpoint: URL;
  try {
    const base = new URL(serviceUrl);
    if (
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      (base.protocol !== "https:" &&
        !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname)))
    ) {
      return errorResponse("يجب أن يكون عنوان خدمة الوكلاء HTTPS ومن دون بيانات اعتماد مضمنة.", 503);
    }
    endpoint = new URL("/crew", base);
  } catch {
    return errorResponse("إعداد عنوان خدمة الوكلاء غير صالح.", 503);
  }

  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.response;

  if (
    typeof parsed.body !== "object" ||
    parsed.body === null ||
    !("topic" in parsed.body) ||
    typeof (parsed.body as { topic: unknown }).topic !== "string" ||
    Object.keys(parsed.body).some((key) => key !== "topic")
  ) {
    return errorResponse("يرجى إرسال موضوع نصي فقط للبحث والتحليل.", 400);
  }

  const topic = (parsed.body as { topic: string }).topic.trim();
  if (topic.length < 3 || topic.length > 500) {
    return errorResponse("يجب أن يكون الموضوع بين 3 و500 حرف.", 400);
  }

  const access = await authorizeAiRequest(request, "crew", CREW_LIMITS);
  if (!access.ok) return access.response;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
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
            ? "خدمة الوكلاء غير مهيأة؛ تحقق من إعداداتها."
            : "فشلت خدمة الوكلاء في تنفيذ المهمة.",
        upstream.status === 503 ? 503 : 502,
      );
    }

    const data = await readBoundedJson(upstream, MAX_UPSTREAM_BYTES);
    if (
      typeof data !== "object" ||
      data === null ||
      !("result" in data) ||
      typeof (data as { result: unknown }).result !== "string" ||
      (data as { result: string }).result.length > 20_000
    ) {
      return errorResponse("وصل رد غير صالح أو أكبر من المسموح من خدمة الوكلاء.", 502);
    }

    return Response.json({ result: (data as { result: string }).result });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return errorResponse("استغرقت مهمة الوكلاء وقتاً أطول من المسموح.", 504);
    }
    return errorResponse("تعذر الاتصال بخدمة الوكلاء.", 502);
  }
}
