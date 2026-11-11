export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message, results: [] }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("صيغة طلب البحث غير صحيحة.", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("query" in body) ||
    typeof (body as { query: unknown }).query !== "string"
  ) {
    return jsonError("يرجى إرسال عبارة بحث نصية.", 400);
  }

  const query = (body as { query: string }).query.trim();
  if (!query) {
    return jsonError("عبارة البحث فارغة.", 400);
  }

  if (query.length > 500) {
    return jsonError("عبارة البحث طويلة جداً.", 400);
  }

  // لا نعيد نتائج وهمية أو روابط Google على أنها نتائج بحث فعلية.
  // يُفعّل هذا المسار بعد ربط مزود بحث موثوق وإعداد مفتاحه في الخادم.
  return jsonError("البحث المباشر غير مهيأ حالياً؛ لم يتم ربط مزود بحث فعلي بعد.", 501);
}
