export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const raw = messages[messages.length-1]?.content || "";
  const t = raw.toLowerCase().replace(/ة/g,"ه");

  // وكيل 1: الصور والتصميم (Magic Media)
  if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("لوجو") || t.includes("ولد")) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(raw)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__IMAGE__${url}__` });
  }

  // وكيل 2: الفيديو
  if (t.includes("فيديو") || t.includes("video") || t.includes("مقطع")) {
    const vUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(raw + " video cinematic")}?width=512&height=512&model=video&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__VIDEO__${vUrl}__` });
  }

  // وكيل 3: هيرميس 3.3 المجاني + تحليل عميق
  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });
  
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: `انت تيتان هيرميس 3.3 المجاني، 3 وكلاء بداخلك: صور، فيديو، تحليل عميق. الوقت: ${now}. تتكلم عربي عراقي فقط، ممنوع تخلط لغات، ممنوع تعيد الجمل، جاوب بتحليل عميق: تعريف + انواع + ارقام + استخدامات.` },
          ...messages
        ],
        max_tokens: 2500,
        temperature: 0.4,
        repetition_penalty: 1.4
      })
    });
    const d = await r.json();
    
    // اذا المجاني فشل، جرب ديب سيك المجاني
    if (d.error) {
      const r2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat:free",
          messages: [
            { role: "system", content: `انت تيتان هيرميس 3.3، الوقت: ${now}. عربي عراقي عميق.` },
            ...messages
          ],
          max_tokens: 2000
        })
      });
      const d2 = await r2.json();
      return Response.json({ reply: d2.choices?.[0]?.message?.content || "❌ " + d.error.message });
    }
    
    return Response.json({ reply: d.choices[0].message.content });
  } catch (e: any) {
    return Response.json({ reply: "❌ " + e.message });
  }
}
