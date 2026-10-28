export async function POST(req: Request) {
  const { query } = await req.json();
  const q = query.replace(/ابحث عن|بحث عن|بحث/g, "").trim() || query;
  const results: any[] = [];
  try {
    const res = await fetch(`https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=3`);
    const data = await res.json();
    (data.query?.search || []).forEach((s: any) => results.push({ 
      title: s.title, 
      snippet: s.snippet.replace(/<[^>]*>/g, "").slice(0, 100), 
      url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(s.title)}`, 
      source: "Wikipedia" 
    }));
  } catch {}
  if (results.length === 0) results.push({ 
    title: `Google: ${q}`, 
    snippet: `بحث عن ${q}`, 
    url: `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=ar`, 
    source: "Google" 
  });
  return Response.json({ results });
}
