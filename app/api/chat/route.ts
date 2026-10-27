const rateLimit = new Map<string, {count: number, reset: number}>();
function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
}

// محركات شغالة 100% - ما بيها ملغي
const ENGINES = [
  "nousresearch/hermes-3-llama-3.1-405b", // القوي ابو الفلوس - شغال
  "meta-llama/llama-3.3-70b-instruct:free", // مجاني قوي
  "google/gemini-2.0-flash-exp:free", // مجاني ممتاز بالعربي
  "qwen/qwen-2.5-72b-instruct:free" // مجاني ملك العربي
];

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    const now = Date.now();
    const lim = rateLimit.get(ip);
    if (lim && now < lim.reset && lim.count >= 15) {
      return Response.json({ reply: "وصلت 15 رسالة، حاول بعد شوية" });
    }
    if (!lim || now >= lim.reset) rateLimit.set(ip, {count: 0, reset: now + 3600000});
    rateLimit.get(ip)!.count++;

    const { messages } = await req.json();

    for (const model of ENGINES) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://titan-10.vercel.app",
            "X-Title": "Titan 1.0"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "انت تيتان، مساعد عراقي ذكي، ترد بشكل طبيعي على طبيعة الي يحجي وياك، تحترم القران، كلامك واضح بدون كلمة بيكفيديا." },
              ...messages
            ],
            temperature: 0.6
          })
        });
        const data = await res.json();
        // اذا الموديل ملغي او خطأ، جرب الي بعده
        if (data.error) continue;
        if (data.choices?.[0]?.message?.content) {
          let reply = data.choices[0].message.content;
          reply = reply.replace(/بيكفيديا|بكيفيدا/gi, "");
          return Response.json({ reply });
        }
      } catch {}
    }

    // اخر حل مجاني بدون مفتاح
    const fb = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama", messages })
    });
    const fbData = await fb.json();
    return Response.json({ reply: fbData.choices?.[0]?.message?.content || "جرب مرة ثانية" });

  } catch (e: any) {
    return Response.json({ reply: "خطأ: " + e.message });
  }
}
