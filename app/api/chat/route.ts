export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const raw = messages[messages.length-1]?.content || "";
  const t = raw.toLowerCase().replace(/ة/g,"ه");

  if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("ولد")) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(raw)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__IMAGE__${url}__` });
  }

  if (t.includes("فيديو") || t.includes("video")) {
    const vUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(raw)}?width=512&height=512&model=video&seed=${Date.now()}`;
    return Response.json({ reply: `__VIDEO__${vUrl}__` });
  }

  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

  // جرب هيرميس المدفوع (يطلب رصيد قليل) واذا فشل جرب ديب سيك المجاني
  const models = [
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat:free",
    "deepseek/deepseek-r1:free"
  ];

  for (const model of models) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: `انت تيتان هيرميس 3.3، الوقت: ${now}. عربي عراقي عميق فقط.` },
            ...messages
          ],
          max_tokens: 2000,
          temperature: 0.4
        })
      });
      const d = await r.json();
      if (d.choices?.[0]?.message?.content) {
        return Response.json({ reply: d.choices[0].message.content });
      }
    } catch {}
  }

  return Response.json({ reply: "❌ كل الموديلات فشلت - تأكد من الرصيد بـ OpenRouter" });
}
