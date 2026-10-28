export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const raw = messages[messages.length-1]?.content || "";
  const t = raw.toLowerCase().replace(/ة/g,"ه");

  if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("لوجو") || t.includes("ولد")) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(raw)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__IMAGE__${url}__` });
  }

  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });
  
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: `انت تيتان، عراقي، الوقت: ${now}. عربي فقط، ممنوع لغات ثانية، لا تكرر، جاوب بعمق.` },
        ...messages
      ],
      max_tokens: 1800,
      temperature: 0.3,
      repetition_penalty: 1.4
    })
  });
  const d = await r.json();
  return Response.json({ reply: d.choices?.[0]?.message?.content || "خطأ" });
}
