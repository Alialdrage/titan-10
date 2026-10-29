export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const raw = messages[messages.length-1]?.content || "";
  const t = raw.toLowerCase().replace(/ة/g,"ه");

  // رابط فيرسل
  if (t.includes("رابط فيرسل") || t.includes("vercel")) {
    return Response.json({ reply: "رابط تيتان:\nhttps://alialdrage.vercel.app" });
  }

  // وكيل توليد الصور - مع حل مشكلة At its limit
  if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("كوره") || t.includes("ولد") || t.includes("احمر")) {
    const prompt = encodeURIComponent(raw + " high quality, 4k, detailed");
    // نستخدم flux model - ما ينملي مثل العادي
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__IMAGE__${url}__` });
  }

  // وكيل توليد الفيديو
  if (t.includes("فيديو") || t.includes("video")) {
    const vPrompt = encodeURIComponent(raw);
    const vUrl = `https://image.pollinations.ai/prompt/${vPrompt}?width=512&height=512&model=video&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__VIDEO__${vUrl}__` });
  }

  // وكيل هيرميس + ديب سيك مجاني
  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });
  
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat:free",
        messages: [
          { role: "system", content: `انت تيتان، 3 وكلاء: صور، فيديو، تحليل. الوقت ${now}. عربي عراقي فقط.` },
          ...messages
        ],
        max_tokens: 2000,
        temperature: 0.4
      })
    });
    const d = await r.json();
    return Response.json({ reply: d.choices?.[0]?.message?.content || "❌ " + JSON.stringify(d).slice(0,200) });
  } catch (e:any) {
    return Response.json({ reply: "❌ " + e.message });
  }
}
