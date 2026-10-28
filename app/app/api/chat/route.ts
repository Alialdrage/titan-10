export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ reply: "❌ روح Vercel → Settings → Environment Variables → ضيف OPENROUTER_API_KEY" });
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "HTTP-Referer": "https://titan-10.vercel.app" },
      body: JSON.stringify({
        model: "nousresearch/hermes-3-llama-3.1-405b:free",
        messages: [{ role: "system", content: "انت تيتان، مساعد عراقي ذكي، تحجي عراقي، تجاوب على كلشي، تحجي نكت عراقية، تبرمج، تشرح." }, ...messages],
        max_tokens: 800
      })
    });
    const d = await r.json();
    if (d.error) return Response.json({ reply: `❌ ${d.error.message}` });
    return Response.json({ reply: d.choices[0].message.content });
  } catch (e: any) {
    return Response.json({ reply: `❌ ${e.message}` });
  }
}
