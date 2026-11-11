import { readJsonBody } from "@/lib/server/security";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ error: message, results: [] }, { status });
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.response;

  const body = parsed.body;
  if (
    typeof body !== "object" ||
    body === null ||
    !("query" in body) ||
    typeof (body as { query: unknown }).query !== "string" ||
    Object.keys(body).some((key) => key !== "query")
  ) {
    return jsonError("يرجى إرسال عبارة بحث نصية فقط.", 400);
  }

  const query = (body as { query: string }).query.trim();
  if (!query) return jsonError("عبارة البحث فارغة.", 400);
  if (query.length > 500) return jsonError("عبارة البحث طويلة جداً.", 400);

  // لا نعيد نتائج وهمية أو روابط Google على أنها نتائج بحث فعلية.
  // يبقى المسار مغلقاً حتى ربط مزود بحث موثوق ومصادق عليه.
  return jsonError("البحث المباشر غير مهيأ حالياً؛ لم يتم ربط مزود بحث فعلي بعد.", 501);
}
