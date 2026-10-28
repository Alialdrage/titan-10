export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ reply: "❌ ماكو مفتاح!" });
  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct",
        messages: [
          { role: "system", content: `انت تيتان، خبير عراقي عبقري. الوقت: ${now}. ممنوع تجاوب سطحي! لازم تجاوب بعمق: شرح مفصل، امثلة، خطوات، اسباب، مقارنات. اذا سألك شي اشرحه كأنك تشرح لدكتور. لا تختصر. استخدم لهجة عراقية ذكية وعميقة.` },
          ...messages
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });
    const d = await r.json();
    if (d.error) return Response.json({ reply: "❌ " + d.error.message });
    return Response.json({ reply: d.choices[0].message.content });
  } catch (e: any) {
    return Response.json({ reply: "❌ " + e.message });
  }
}
