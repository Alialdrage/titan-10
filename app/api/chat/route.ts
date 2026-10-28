export async function POST(req: Request) {
  const { query } = await req.json();
  
  // بحث مجاني من DuckDuckGo
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`);
    const data = await res.json();
    let answer = data.AbstractText || data.RelatedTopics?.[0]?.Text || "";
    if (!answer) {
      // fallback - بحث ويكيبيديا
      const wiki = await fetch(`https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      const w = await wiki.json();
      answer = w.extract || "";
    }
    return Response.json({ result: answer || "ما لگيت نتيجة دقيقة، بس تيتان يجاوب من معلوماته" });
  } catch {
    return Response.json({ result: "" });
  }
}
