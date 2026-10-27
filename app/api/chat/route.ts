export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const engines = [
      "nousresearch/hermes-3-llama-3.1-405b",
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free"
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
              { role: "system", content: "You are Titan, a friendly Iraqi assistant." },
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
