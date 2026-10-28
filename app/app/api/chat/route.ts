export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ reply: "❌ ماكو مفتاح بـ Vercel! ضيف OPENROUTER_API_KEY" });
  
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [{ role: "system", content: "انت تيتان عراقي" }, ...messages],
        max_tokens: 500
      })
    });
    const data = await res.json();
    if (data.error) return Response.json({ reply: `❌ خطأ: ${data.error.message}` });
    return Response.json({ reply: data.choices[0].message.content });
  } catch (e: any) {
    return Response.json({ reply: `❌ فشل: ${e.message}` });
  }
}
