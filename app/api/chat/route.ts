export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // كلنا جميعا - كل المحركات بتايتن
    const engines = [
      "nousresearch/hermes-3-llama-3.1-405b", // 1- القوي 405B ابو الفلوس
      "google/gemini-2.0-flash-exp:free", // 2- ملك العربي مجاني
      "qwen/qwen-2.5-72b-instruct:free", // 3- قوي عربي 72B مجاني
      "meta-llama/llama-3.3-70b-instruct:free", // 4- قوي 70B مجاني
      "deepseek/deepseek-chat:free", // 5- ملك البرمجة مجاني
      "nousresearch/hermes-2-pro-llama-3-8b:free" // 6- هرمس صغير مجاني
    ];

    for (const model of engines) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "You are Titan, friendly assistant. Reply naturally matching user language." },
              ...messages
            ]
          })
        });
        const data = await res.json();
        if (data.error) continue;
        if (data.choices?.[0]?.message?.content) {
          return Response.json({ reply: data.choices[0].message.content });
        }
      } catch {}
    }
    return Response.json({ reply: "جرب مرة ثانية" });
  } catch (e: any) {
    return Response.json({ reply: "خطأ: " + e.message });
  }
}
