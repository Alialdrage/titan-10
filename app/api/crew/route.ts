export const runtime = "nodejs";

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
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
