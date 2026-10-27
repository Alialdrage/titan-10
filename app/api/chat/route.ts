const rateLimit = new Map<string, {count: number, reset: number}>();
function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
}

const ENGINES = [
  "nousresearch/hermes-3-llama-3.1-405b",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nousresearch/hermes-2-pro-llama-3-8b:free",
  "google/gemma-2-9b-it:free"
];

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    const now = Date.now();
    const userLimit = rateLimit.get(ip);
    if (userLimit && now < userLimit.reset && userLimit.count >= 15) {
      const mins = Math.ceil((userLimit.reset - now) / 60000);
      return Response.json({ reply: `⚠️ 15 رسالة بالساعة، حاول بعد ${mins} دقيقة.` });
    }
    if (!userLimit || now >= userLimit.reset) rateLimit.set(ip, {count: 0, reset: now + 3600000});
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
              { role: "system", content: "انت تيتان - اقوى وكيل هرمس 405B، ترد باللهجة العراقية" },
              ...messages
            ]
          })
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          return Response.json({ reply: data.choices[0].message.content });
        }
      } catch {}
    }

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
