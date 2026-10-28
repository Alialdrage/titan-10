export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const last = messages[messages.length-1]?.content || "";
  const norm = last.toLowerCase().replace(/ة/g,"ه").replace(/ى/g,"ي"); // تطبيع

  if (norm.includes("صوره") || norm.includes("ارسم") || norm.includes("صور") || norm.includes("ولد")) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(last)}?width=1024&height=1024&seed=${Date.now()}`;
    return Response.json({ reply: `__IMAGE__${url}__` });
  }

  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "system", content: `انت تيتان، عراقي. الوقت: ${now}. جاوب بعمق بدون تكرار.` }, ...messages],
      max_tokens: 1500,
      temperature: 0.4,
      repetition_penalty: 1.3
    })
  });
  const d = await r.json();
  return Response.json({ reply: d.choices?.[0]?.message?.content || "خطأ" });
}
