export async function POST(req: Request) {
  const b = await req.json();
  const q = b.query || "";
  return Response.json({
    results: [{ title: "Google: " + q, url: "https://www.google.com/search?q=" + encodeURIComponent(q), snippet: "بحث", source: "Google" }]
  });
}
