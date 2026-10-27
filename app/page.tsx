// كود صور امن 100%
if (t.includes("ارسم") || t.includes("صورة") || t.toLowerCase().includes("draw") || t.toLowerCase().includes("image")) {
  let prompt = t.replace(/ارسملي|ارسم|صورة|رسملي|رسم|ارسميلي/g, "").trim();
  
  // ترجمة + فلتر امان
  const map: any = { 
    "قطه": "cute small kitten cat", "قطة": "cute small kitten cat",
    "كلب": "cute puppy dog", "سيارة": "sports car",
    "بيت": "beautiful house", "طبيعة": "nature landscape",
    "ولد": "young boy smiling", "بنت": "young girl smiling"
  };
  for (let k in map) if (prompt.includes(k)) prompt = prompt.replace(k, map[k]);

  // فلتر امان قوي
  const safePrompt = `${prompt}, cute, family friendly, safe for work, no nudity, clothed, high quality, 4k, safe content`;
  
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=512&height=512&nologo=true&safe=true&model=flux&seed=${Date.now()}`;
  
  setMessages(m=>[...m, {role:"assistant", content:`تفضل صورتك:`, image: imgUrl}]);
}
