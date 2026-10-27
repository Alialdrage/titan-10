import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "nousresearch/hermes-3-llama-3.1-405b",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const last = messages[messages.length-1]?.content || "";
  if (!last.trim()) return NextResponse.json({reply:"هلا حبيبي شتريد؟"});

  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method:"POST",
        headers:{
          "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":"application/json",
          "HTTP-Referer":"https://titan-10.vercel.app",
        },
        body: JSON.stringify({
          model,
          messages:[
            {role:"system", content:`انت تيتان - ذكاء اصطناعي عراقي ذكي. جاوب بذكاء ومفصل، كمل الجواب للاخير ولا تتوقف، اذا عراقي جاوب عراقي. لا تكتب بيكفيديا ابدا. انت تيتان من تطوير عدنان`},
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1500,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        let reply = data.choices[0].message.content.replace(/بيكفيديا|بكيفيدا/gi, "تيتان");
        return NextResponse.json({reply});
      }
    } catch {}
  }
  return NextResponse.json({reply:"حاول مرة ثانية"});
}
