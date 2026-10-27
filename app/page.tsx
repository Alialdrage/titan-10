"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>(()=>{
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("titan_chat");
      return s ? JSON.parse(s) : [{role:"assistant", content:"هلا والله! انا تيتان - شكو ماكو؟"}];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); localStorage.setItem("titan_chat", JSON.stringify(messages)); }, [messages]);

  const copy = (t:string) => navigator.clipboard.writeText(t);

  const send = async () => {
    if (!input.trim()) return;
    const t = input; setInput(""); setMessages(m=>[...m, {role:"user", content:t}]); setLoading(true);

    if (t.includes("ارسم") || t.toLowerCase().includes("draw") || t.includes("صورة") || t.includes("قطه") || t.includes("قطة")) {
      let p = t.replace(/ارسملي|ارسم|صورة|لي/g, "").trim() || "cute cat";
      const map: any = {"قطه":"cute kitten", "قطة":"cute kitten", "كلب":"cute puppy"};
      for (let k in map) if (p.includes(k)) p = p.replace(k, map[k]);
      const safe = `${p}, cute, safe for work, family friendly, clothed`;
      const img = `https://image.pollinations.ai/prompt/${encodeURIComponent(safe)}?width=512&height=512&nologo=true&safe=true&model=flux`;
      setMessages(m=>[...m, {role:"assistant", content:"تفضل حب:", image: img}]);
      setLoading(false); return;
    }

    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({messages:[...messages, {role:"user", content:t}]})
      });
      const data = await res.json();
      setMessages(m=>[...m, {role:"assistant", content:data.reply}]);
    } catch { setMessages(m=>[...m, {role:"assistant", content:"صار خلل حب، جرب مرة ثانية"}]); }
    setLoading(false);
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, height:"100vh", display:"flex", flexDirection:"column", fontFamily:"sans-serif", background:"#fff"}}>
      <div style={{flex:1, overflowY:"auto", padding:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{margin:"12px 0", display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start"}}>
            <div style={{maxWidth:"75%", padding:"10px 14px", borderRadius:18, background: m.role==="user" ? "#007aff" : "#f0f0f0", color: m.role==="user" ? "#fff" : "#000", textAlign:"right"}}>
              {m.content}
              {m.image && <img src={m.image} style={{width:"100%", marginTop:8, borderRadius:12}} />}
              {m.role==="assistant" && <div style={{marginTop:6, display:"flex", gap:8}}><button onClick={()=> copy(m.content)} style={{fontSize:10, border:"1px solid #ddd", borderRadius:10, padding:"2px 6px"}}>📋 نسخ</button></div>}
            </div>
          </div>
        ))}
        {loading && <div style={{fontSize:12, color:"#999"}}>يكتب...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex", gap:8, paddingTop:10, borderTop:"1px solid #eee"}}>
        <input value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && send()} placeholder="اكتب... او ارسملي قطه" style={{flex:1, padding:12, borderRadius:25, border:"1px solid #ccc"}} />
        <button onClick={send} style={{width:48, height:48, borderRadius:"50%", border:"none", background:"#007aff", color:"#fff", fontSize:18}}>↑</button>
      </div>
    </main>
  );
}
