import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const key = process.env.OPENROUTER_API_KEY;
    
    if (!key) {
      return NextResponse.json({ reply: "خطأ: مفتاح OpenRouter غير موجود في متغيرات البيئة." }, { status: 500 });
    }

    const raw = messages[messages.length - 1]?.content || "";
    const t = raw.toLowerCase().replace(/ة/g, "ه");

    // 1. إذا كان طلب صورة، نولد رابط Pollinations مباشرة بدون ترجمة معقدة تتأخر
    if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("لوجو") || t.includes("ولد") || t.includes("image")) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(raw)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      return NextResponse.json({ reply: `__IMAGE__${url}__` });
    }

    const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

    // 2. الطلبات النصية العادية (بدون Streaming لتجنب مشاكل الواجهة)
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${key}` 
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { 
            role: "system", 
            content: `انت تيتان، مساعد ذكي عراقي أصيل. الوقت الحالي: ${now}. التزم باللغة العربية حصراً، لا تستخدم لغات أخرى، تجنب التكرار، وكن عميقاً ومفيداً بإجاباتك.` 
          },
          ...messages
        ],
        max_tokens: 1500,
        temperature: 0.3,
        repetition_penalty: 1.4
      })
    });

    const d = await r.json();
    
    if (d.error) {
      return NextResponse.json({ reply: `خطأ من OpenRouter: ${d.error.message || 'غير معروف'}` });
    }

    const replyText = d.choices?.[0]?.message?.content || "ما قدرت أفتهم الطلب، عذراً!";
    return NextResponse.json({ reply: replyText });

  } async (error) {
    console.error("API Error:", error);
    return NextResponse.json({ reply: "حدث خطأ غير متوقع بالسيرفر." }, { status: 500 });
  }
}
