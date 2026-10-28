export async function POST(req: Request) {
  const { query } = await req.json();
  const results: any[] = [];

  // بحث حقيقي من DuckDuckGo + Wikipedia - مجاني بدون مفتاح
  try {
    const ddg = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }).then(r => r.json());

    if (ddg.AbstractText) {
      results.push({
        title: ddg.Heading || query,
        snippet: ddg.AbstractText,
        url: ddg.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        source: "DuckDuckGo"
      });
    }
    if (ddg.RelatedTopics) {
      for (let t of ddg.RelatedTopics.slice(0, 4)) {
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.substring(0, 70), snippet: t.Text, url: t.FirstURL, source: "DuckDuckGo" });
        }
      }
    }
  } catch {}

  // بحث ثاني من ويكيبيديا العربية - حقيقي
  try {
    const wiki = await fetch(
      `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`
    ).then(r => r.json());
    
    for (let s of wiki.query?.search || []) {
      results.push({
        title: s.title,
        snippet: s.snippet.replace(/<[^>]*>/g, ""),
        url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(s.title)}`,
        source: "Wikipedia"
      });
    }
  } catch {}

  // اذا ماكو نتيجة، رجع رابط بحث مباشر
  if (results.length === 0) {
    results.push({
      title: `بحث عن "${query}"`,
      snippet: `اضغط لفتح نتائج البحث الحقيقية من Google`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar`,
      source: "Google"
    });
  }

  return Response.json({ results, query });
}
