export async function POST(req: Request) {
  const { messages } = await req.json();
  const last = messages[messages.length - 1]?.content || "";
  const key = process.env.OPENROUTER_API_KEY;
  
  if (key) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify({
          model: "nousresearch/hermes-3-llama-3.1-405b:free",
          messages: [{ role: "system", content: "انت تيتان مساعد عراقي" }, ...messages],
          max_tokens: 500
        })
      });
      const d = await r.json();
      if (d.choices) return Response.json({ reply: d.choices[0].message.content });
    } catch {}
  }
  
  return Response.json({ reply: "هلا! كتبت: " + last.slice(0, 60) });
}
