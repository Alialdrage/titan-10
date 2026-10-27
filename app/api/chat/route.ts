import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-chat:free",
  "nousresearch/hermes-2-pro-llama-3-8b:free",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  for (const model of MODELS) {
    try {
      console.log("Trying:", model);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "انت تيتان، ولد عراقي تحجي عراقي طبيعي وقصير" },
            ...messages
          ],
          max_tokens: 300,
          temperature: 0.7
        }),
      });

      // اذا رصيد نافذ او خطأ -> جرب الي بعده
      if (!res.ok) {
        console.log(model, "failed:", res.status);
        continue; // <-- هذا يحول للمجاني الي بعده!
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;

      if (reply) {
        return NextResponse.json({ reply }, { headers: corsHeaders });
      }
    } catch (e) {
      console.log("Error with", model, e);
      continue; // جرب الي بعده
    }
  }

  return NextResponse.json({ reply: "كل المحركات مشغولة حب، حاول بعد شوية" }, { headers: corsHeaders });
}
