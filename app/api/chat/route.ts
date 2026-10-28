export async function POST(req: Request) {
  const { messages } = await req.json();
  const last = messages[messages.length - 1]?.content || "";
  return Response.json({ reply: "هلا! كتبت: " + last.slice(0, 50) });
}
