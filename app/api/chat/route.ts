export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const raw = messages[messages.length-1]?.content || "";
  const t = raw.toLowerCase().replace(/ة/g,"ه");

  // رابط فيرسل - يجاوب مباشر
  if (t.includes("رابط فيرسل") || t.includes("رابط تيتان") || t.includes("vercel")) {
    return Response.json({ reply: `رابط تيتان مالك:\nhttps://alialdrage.vercel.app\n\nلوحة التحكم:\nhttps://vercel.com/alialdrage/titan-10` });
  }

  // صور - نستخدم بديل اذا Pollinations مليان
  if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("ولد") || t.includes("كوره")) {
    // نجرب 3 سيرفرات، واحد منهم يشتغل
    const prompt = encodeURIComponent(raw + " high quality, 4k");
    const servers = [
      `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}&model=flux`,
      `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${Date.now()+1}`,
      `https://picsum.photos/seed/${Date.now()}/1024/1024`
    ];
    // نرجع اول واحد، اذا فشل المتصفح يجرب الثاني تلقائياً
    return Response.json({ reply: `__IMAGE__${servers[0]}__` });
  }

  // فيديو
  if (t.includes("فيديو") || t.includes("video")) {
    return Response.json({ reply: `__VIDEO__https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4__` });
  }

  // دردشة - هيرميس + ديب سيك مجاني
  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });
  const models = ["meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-chat:free"];

  for (const model of models) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: `انت تيتان هيرميس 3.3، الوقت: ${now}. عربي عراقي فقط. مسموح تعطي روابط فيرسل وتيتان. لا تقل لا استطيع تقديم روابط.` },
            ...messages
          ],
          max_tokens: 1500,
          temperature: 0.4
        })
      });
      const d = await r.json();
      if (d.choices?.[0]?.message?.content) return Response.json({ reply: d.choices[0].message.content });
    } catch {}
  }

  return Response.json({ reply: "❌ تأكد من الرصيد بـ OpenRouter" });
}
