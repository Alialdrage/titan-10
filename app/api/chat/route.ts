import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const key = process.env.OPENROUTER_API_KEY;
    
    if (!key) {
      return NextResponse.json({ error: "مفتاح OpenRouter غير موجود." }, { status: 500 });
    }

    const raw = messages[messages.length - 1]?.content || "";
    const t = raw.toLowerCase().replace(/ة/g, "ه");

    // التحقق من طلبات الصور وتوليدها كـ JSON مباشر
    if (t.includes("صوره") || t.includes("ارسم") || t.includes("صمم") || t.includes("لوجو") || t.includes("ولد") || t.includes("image")) {
      
      const translateRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [
            { 
              role: "system", 
              content: "You are an expert prompt engineer. Translate the user's image request into a detailed, high-quality English image prompt. Output ONLY the English prompt, nothing else." 
            },
            { role: "user", content: raw }
          ],
          max_tokens: 100
        })
      });

      const translateData = await translateRes.json();
      const englishPrompt = translateData.choices?.[0]?.message?.content?.trim() || raw;
      
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      
      // إرسال استجابة JSON خاصة بالصورة مع الهيدر الصحيح
      return NextResponse.json({ 
        type: "image", 
        url: url 
      });
    }

    const now = new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

    // الردود النصية عبر الـ Stream
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://alialdrage.vercel.app", // استبدل بـ رابط موقعك على فيرستل
        "X-Title": "Titan AI"
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
        max_tokens: 1800,
        temperature: 0.3,
        repetition_penalty: 1.4,
        stream: true
      })
    });

    if (!r.ok) {
      const errorData = await r.text();
      return NextResponse.json({ error: `خطأ من الخادم الخارجي: ${errorData}` }, { status: r.status });
    }

    return new Response(r.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع." }, { status: 500 });
  }
}
