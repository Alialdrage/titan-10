export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://titan-10.vercel.app",
        "X-Title": "Titan 1.0"
      },
      body: JSON.stringify({
        model: "nousresearch/hermes-3-llama-3.1-405b:free",
        messages: [
          {
            role: "system", 
            content: "انت تيتان - وكيل هرميس الذكي، ترد باللهجة العراقية، ذكي جداً، سريع، ومفيد. تساعد بحل مشاكل البرمجة وفيرسل."
          }, 
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await res.json();
    
    if (data.error) {
      return Response.json({reply: "خطأ من OpenRouter: " + data.error.message});
    }
    
    return Response.json({
      reply: data.choices?.[0]?.message?.content || "ما وصل رد من هرمس"
    });
    
  } catch (e: any) {
    return Response.json({reply: "فشل الاتصال: " + e.message});
  }
}
