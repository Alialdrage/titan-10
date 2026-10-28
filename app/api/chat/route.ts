export async function POST(req: Request) {
  const { messages } = await req.json();
  const last = messages[messages.length - 1]?.content || "";
  const low = last.toLowerCase();

  // 1- سعر الدولار - يجيب من مصدر مجاني حقيقي
  if (low.includes("دولار") || low.includes("dollar")) {
    try {
      const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const d = await r.json();
      const iqd = d.rates?.IQD || 1320;
      return Response.json({ 
        reply: `💵 سعر الدولار اليوم:\n\n1 دولار = ${Math.round(iqd)} دينار عراقي تقريباً\n\nالمصدر: exchangerate-api (مباشر)\n\nاذا تريد سعر السوق السوداء، يختلف شوية حسب المنطقة.` 
      });
    } catch {
      return Response.json({ reply: `💵 سعر الدولار اليوم تقريباً:\n\n1 دولار = 1320 - 1340 دينار عراقي\n\n(سعر البنك المركزي 1320، السوق الموازي يزيد شوية)` });
    }
  }

  // 2- توليد لوجو / تصميم - من مصدر مجاني بدون مفتاح
  if (low.includes("لوجو") || low.includes("logo") || low.includes("تصميم") || low.includes("صمم")) {
    const prompt = encodeURIComponent(last + " logo, minimal, professional, vector");
    const imgUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;
    return Response.json({ 
      reply: `🎨 تفضل تصميمك:`,
      image: imgUrl
    });
  }

  // 3- شات عادي - بدون اي API خارجي - يجاوب عراقي
  const answers: any = {
    "هلو": "هلا والله حب! شلونك؟ 😎",
    "شلونك": "تمام والله! انت شلونك؟",
    "شكو ماكو": "ماكو شي حب، انت شكو؟",
    "منو انت": "اني تيتان - مساعد ذكي عراقي مثل Meta AI! 🤖",
    "شنو": "اسألني اي شي حب!"
  };

  for (let k in answers) {
    if (low.includes(k)) {
      return Response.json({ reply: answers[k] });
    }
  }

  // جواب افتراضي ذكي عراقي
  const fallbacks = [
    `حلو! كتبت "${last.slice(0, 50)}" - شلون اكدر اساعدك اكثر؟`,
    `تمام فهمت: "${last.slice(0, 50)}" - احجيلي اكثر`,
    `هلا والله! بخصوص "${last.slice(0, 30)}" - شنو تريد تعرف بالضبط؟`,
    `اي حب، سمعتك! "${last.slice(0, 40)}" - كمل!`
  ];
  
  const random = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return Response.json({ reply: random });
}
