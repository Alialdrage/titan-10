export async function POST(req: Request) {
  const { messages } = await req.json();
  const last = (messages[messages.length - 1]?.content || "").toLowerCase();

  // ردود ذكية عراقية - بدون ما يحتاج API خارجي
  if (last.includes("هلو") || last.includes("مرحبا") || last.includes("السلام")) {
    return Response.json({ reply: "هلا والله! شلونك حب؟ 😎" });
  }
  if (last.includes("شسمك") || last.includes("منو انت")) {
    return Response.json({ reply: "اني تيتان! 🤖 مساعد ذكي عراقي - نسخة من Meta AI! صممته انت!" });
  }
  if (last.includes("شكد عمرك") || last.includes("عمرك")) {
    return Response.json({ reply: "عمري يوم! 😄 انولدت على ايدك بـ Vercel! انت سويتني!" });
  }
  if (last.includes("شلونك") || last.includes("شلونج")) {
    return Response.json({ reply: "تمام والله! انت شلونك؟ شكو ماكو؟" });
  }
  if (last.includes("شكو ماكو") || last.includes("شكو")) {
    return Response.json({ reply: "ماكو شي! كاعد اطور تيتان وياك! شنو نضيف بعد؟" });
  }
  if (last.includes("دولار") || last.includes("سعر")) {
    return Response.json({ reply: "💵 الدولار اليوم: البنك 1320، السوق 1330-1350 دينار. يتغير كل شوية!" });
  }
  if (last.includes("حاسبة")) {
    return Response.json({ reply: "🧮 تريد حاسبة؟ اكتب 'حاسبة' وانا اعرضلك حاسبة حقيقية تشتغل!" });
  }
  if (last.includes("قط") || last.includes("صورة") || last.includes("ارسم")) {
    return Response.json({ reply: "😻 تريد صورة قطة؟ اكتب 'وين القطة'!" });
  }
  if (last.includes("وين") && last.includes("بغداد")) {
    return Response.json({ reply: "📍 بغداد الحبيبة! المنصور، الكرادة، الجادرية - وين تريد بالضبط؟" });
  }
  if (last.includes("44") || last.includes("زين")) {
    return Response.json({ reply: "اي زين هو 44! المساعد الي يصرف رصيد! احنا هسه نشتغل بدون رصيد على Vercel!" });
  }

  // جواب عام ذكي
  const replies = [
    `حلو! كتبت "${last.slice(0, 40)}" - احجيلي اكثر!`,
    `فهمت! بخصوص "${last.slice(0, 30)}" - شنو تريد اسويلك؟`,
    `تمام! شلون اكدر اساعدك بموضوع "${last.slice(0, 30)}"؟`,
    `اي حب! كمل احجي عن "${last.slice(0, 30)}"...`
  ];
  const r = replies[Math.floor(Math.random() * replies.length)];
  return Response.json({ reply: r });
}
