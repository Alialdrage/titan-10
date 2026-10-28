  // بحث حقيقي بالنت
  if (low.includes("ابحث") || low.includes("اخبار") || low.includes("بحث عن")) {
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: t })
      });
      const data = await res.json();
      let html = `🔍 نتائج البحث الحقيقي عن "${data.query}":\n\n`;
      data.results.forEach((r: any, i: number) => {
        html += `${i+1}. ${r.title}\n${r.snippet.slice(0,120)}...\n🔗 ${r.url}\n\n`;
      });
      setMessages((m:any) => [...m, { 
        role:"assistant", 
        content: html,
        searchResults: data.results // راح نعرضها كروابط
      }]);
    } catch {
      setMessages((m:any) => [...m, {role:"assistant", content: `🔍 افتح البحث الحقيقي: https://www.google.com/search?q=${encodeURIComponent(t)}`}]);
    }
    setLoading(false);
    return;
  }
