export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://titan-10.vercel.app"
      },
      body: JSON.stringify({
        model: "nousresearch/hermes-3-llama-3.1-405b:free",
        messages: [{ role: "system", content: "انت تيتان، مساعد عراقي ذكي عام." }, ...messages],
        max_tokens: 800
      })
    });
    const data = await res.json();
    return Response.json({ reply: data.choices[0].message.content });
  } catch {
    return Response.json({ reply: "هلا والله! تأكد من المفتاح" });
  }
}
