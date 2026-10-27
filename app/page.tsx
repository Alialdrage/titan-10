import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "nousresearch/hermes-3-llama-3.1-405b",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { messages } = await req.json();
  
  const lastMessage = messages[messages.length-1]?.content || "";
  if (!lastMessage.trim()) {
    return NextResponse.json({reply:"هلا حبيبي، شتريد؟"});
  }

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
            {
              role:"system", 
              content:`انت تيتان - ذكاء اصطناعي عراقي ذكي ومتعلم.
قواعد مهمة:
1. جاوب بذكاء وشرح مفصل ومفيد
2. اذا سألك بالعراقي جاوب عراقي، اذا فصحى جاوب فصحى، اذا انكليزي جاوب انكليزي
3. لا تكرر نفسك ولا تتوقف بنص الجواب - كمل الجواب للاخير
4. لا تكتب "بيكفيديا" او "بكيفيدا" ابدا
5. انت تيتان من تطوير عدنان، مو ChatGPT`
            },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1500,
        })
      });
      
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        let reply = data.choices[0].message.content;
        reply = reply.replace(/بيكفيديا|بكيفيدا|بكي فيديا/gi, "تيتان");
        return NextResponse.json({reply});
      }
    } catch {}
  }
  
  return NextResponse.json({reply:"حبيبي صار ضغط على المحركات، حاول مرة ثانية"});
}
