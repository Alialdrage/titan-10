import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "nousresearch/hermes-3-llama-3.1-405b",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  
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
            {role:"system", content:`انت تيتان ولد عراقي تحجي عراقي بسيط وطبيعي، اشرح النظريات بطريقة سهلة`},
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 400,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        let reply = data.choices[0].message.content.replace(/بيكفيديا|بكيفيدا/gi,"تيتان");
        return NextResponse.json({reply}, {headers: corsHeaders()});
      }
    } catch {}
  }
  return NextResponse.json({reply:"حاول مرة ثانية حب"}, {headers: corsHeaders()});
}
