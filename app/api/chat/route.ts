export async function POST(req: Request) {
  const { messages } = await req.json();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{role:"system", content:"انت تيتان مساعد عراقي"} , ...messages]
    })
  });
  const data = await res.json();
  return Response.json({reply: data.choices?.[0]?.message?.content || "خطأ: "+JSON.stringify(data)});
}
