export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;
  const lastRaw = messages[messages.length - 1]?.content || "";
  const last = lastRaw.toLowerCase().replace(/ة/g, "ه").replace(/ى/g, "ي");
  
  // 1- توليد وتصميم الصور - يشتغل مباشر بدون ما نسأل الموديل
  if (last.includes("صوره") || last.includes("ارسم") || last.includes("صمم") || last.includes("لوجو") || last.includes("تصميم") || last.includes("ولد")) {
    const prompt = encodeURIComponent(lastRaw + " high quality, professional");
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    return Response.json({ reply: `__IMAGE__${url}__` });
  }

  // 2- البحث والتحليل - نجيب من ويكيبيديا
  let webContext = "";
  try {
    if (last.includes("ابحث") || last.includes("بحث") || last.includes("ما هي") || last.includes("شنو") || lastRaw.length > 15) {
      const q = encodeURIComponent(lastRaw.slice(0, 60));
      const wikiRes = await fetch(`https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&origin=*&srlimit=2`);
      const wikiData = await wikiRes.json();
      if (wikiData.query?.search?.[0]) {
        const snippet = wikiData.query.search[0].snippet.replace(/<[^>]*>/g, "");
        webContext = `معلومات من الانترنت: ${snippet}`;
      }
    }
  } catch {}

  const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: `انت تيتان، ذكاء خارق عراقي. الوقت: ${now}. ${webContext}. 
ممنوع تخلط لغات - عربي فقط.
ممنوع تعيد نفس الجملة.
جاوب بتحليل عميق: تعريف + كيف يعمل + انواع + مميزات + ارقام. لا تكون سطحي.` },
          ...messages
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.8,
        repetition_penalty: 1.4
      })
    });
    const d = await r.json();
    if (d.error) return Response.json({ reply: "❌ " + d.error.message });
    return Response.json({ reply: d.choices[0].message.content });
  } catch (e: any) {
    return Response.json({ reply: "❌ " + e.message });
  }
}
