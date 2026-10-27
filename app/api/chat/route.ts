import { NextResponse } from "next/server";

const MODELS = [
  "nousresearch/hermes-3-llama-3.1-8b:free",
  "nousresearch/hermes-2-pro-llama-3-8b:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free"
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // جرب هيرميس والمجانيات
  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "انت تيتان ولد عراقي تحجي عراقي طبيعي قصير وبشري" },
            ...messages
          ],
          max_tokens: 300,
          temperature: 0.8
        })
      });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) {
        return NextResponse.json({ reply }, { headers: cors });
      }
    } catch {
      continue;
    }
  }

  // اذا كلشي فشل - محرك احتياطي مجاني بدون مفتاح
  try {
    const last = messages[messages.length-1]?.content || "هلا";
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(`انت تيتان عراقي: ${last}`)}`);
    const text = await res.text();
    return NextResponse.json({ reply: text.slice(0,500) || "هلا حب شلونك؟" }, { headers: cors });
  } catch {
    return NextResponse.json({ reply: "هلا والله حب شلونك؟" }, { headers: cors });
  }
}
