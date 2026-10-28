export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ reply: "❌ ماكو مفتاح OPENROUTER_API_KEY" });

  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: `انت تيتان، مساعد عراقي ذكي وعميق. الوقت: ${now}` },
          ...messages
        ],
        max_tokens: 2000
      })
    });
    const d = await r.json();
    return Response.json({ reply: d.choices?.[0]?.message?.content || d.error?.message });
  } catch (e: any) {
    return Response.json({ reply: "❌ " + e.message });
  }
}
