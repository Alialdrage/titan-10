export async function POST(req: Request) {
  const { query } = await req.json();
  const results: any[] = [];

  // 1- بحث DuckDuckGo حقيقي
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`);
    const data = await res.json();
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL,
        source: "DuckDuckGo"
      });
    }
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 3).forEach((t: any) => {
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.slice(0, 60), snippet: t.Text, url: t.FirstURL, source: "DuckDuckGo" });
        }
      });
    }
  } catch {}

  // 2- بحث ويكيبيديا عربي حقيقي
  try {
    const res = await fetch(`https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`);
    const data = await res.json();
    (data.query?.search || []).forEach((s: any) => {
      results.push({
        title: s.title,
        snippet: s.snippet.replace(/<[^>]*>/g, ""),
        url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(s.title)}`,
        source: "Wikipedia"
      });
    });
  } catch {}

  // 3- لو ماكو نتيجة، رابط Google حقيقي
  if (results.length === 0) {
    results.push({
      title: `بحث Google عن ${query}`,
      snippet: `اضغط لفتح نتائج Google الحقيقية`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar`,
      source: "Google"
    });
  }

  return Response.json({ results, query });
}
