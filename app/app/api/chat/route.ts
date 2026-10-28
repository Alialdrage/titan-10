export async function POST(req: Request) {
  const { messages } = await req.json();
  const key = process.env.OPENROUTER_API_KEY;

  // اذا اكو مفتاح - هيرميس العام
  if (key) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://titan-10.vercel.app",
          "X-Title": "Titan AI"
        },
        body: JSON.stringify({
          model: "nousresearch/hermes-3-llama-3.1-405b:free",
          messages: [
            { role: "system", content: "انت تيتان، مساعد عراقي ذكي عام، تجاوب باللهجة العراقية، تساعد بكلشي: برمجة، شرح، كتابة، ترجمة، حل مسائل. اذا طلب منك تسوي حاسبة او موقع او لعبة، اكتب كود React كامل يشتغل." },
            ...messages
          ],
          max_tokens: 1000,
          temperature: 0.8
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return Response.json({ reply });
    } catch (e) {
      console.error(e);
    }
  }

  // fallback اذا ماكو مفتاح - حتى يبقى اخضر
  const last = messages[messages.length - 1]?.content || "";
  return Response.json({ reply: `هيرميس ما مربوط! ضيف مفتاح OpenRouter بـ Vercel حتى اصير عام! كتبت: "${last.slice(0, 30)}"` });
}
