export async function POST(req: Request) {
  const { messages } = await req.json();
  const last = messages[messages.length - 1]?.content || "";
  if (last.toLowerCase().includes("دولار")) {
    return Response.json({ reply: "💵 الدولار اليوم 1320-1350 دينار عراقي" });
  }
  return Response.json({ reply: `هلا والله! كتبت "${last.slice(0, 50)}" - شلون اساعدك؟` });
}
