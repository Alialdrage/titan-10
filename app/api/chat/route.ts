import { NextRequest, NextResponse } from "next/server";
const MODELS = ["nousresearch/hermes-3-llama-3.1-405b","google/gemini-2.0-flash-exp:free","qwen/qwen-2.5-72b-instruct:free"];

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method:"POST",
        headers:{ "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type":"application/json", "HTTP-Referer":"https://titan-10.vercel.app" },
        body: JSON.stringify({
          model,
          messages:[
            {role:"system", content:`انت تيتان، ولد عراقي. جاوب باختصار شديد جدا، سطر واحد بس، 10-15 كلمة بالكثير. لا تشرح هواي. مثال: شلونك؟ -> هلا حب بخير انت شلونك؟ شكرا -> تدلل حبي. احجي عراقي عامي قصير.`},
            ...messages.slice(-2)
          ],
          temperature: 0.8,
          max_tokens: 60,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return NextResponse.json({reply: data.choices[0].message.content.slice(0,150).replace(/بيكفيديا|بكيفيدا/gi,"تيتان")});
      }
    } catch {}
  }
  return NextResponse.json({reply:"ها حب؟"});
}
