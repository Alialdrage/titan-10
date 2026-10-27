"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>(()=>{
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("titan_chat");
      return s ? JSON.parse(s) : [{role:"assistant", content:"هلا والله حب! انا تيتان 2.0 - هيرميس مجاني + صور + حفظ!"}];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); localStorage.setItem("titan_chat", JSON.stringify(messages)); }, [messages]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); };
  
  const send = async () => {
    if (!input.trim()) return;
    const t = input; setInput(""); setMessages(m=>[...m, {role:"user", content:t}]); setLoading(true);

    // اذا طلب صورة - فلتر امان قوي
    if (t.includes("ارسم") || t.toLowerCase().includes("draw") || t.toLowerCase().includes("image") || t.includes("صورة")) {
      let p = t.replace(/ارسملي|ارسم|صورة|رسم/g, "").trim();
      const map: any = {"قطه":"cute kitten cat", "قطة":"cute kitten cat", "كلب":"cute puppy", "سيارة":"sports car", "بيت":"house"};
      for (let k in map) if (p.includes(k)) p = p.replace(k, map[k]);
      const safe = `${p}, cute, family friendly, safe for work, no nudity, clothed, high quality`;
      const img = `https://image.pollinations.ai/prompt/${encodeURIComponent(safe)}?width=512&height=512&nologo=true&safe=true&model=flux&seed=${Date.now()}`;
      setMessages(m=>[...m, {role:"assistant", content:"تفضل:", image: img}]);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({messages:[...messages, {role:"user", content:t}]})
    });
    const data = await res.json();
    setMessages(m=>[...m, {role:"assistant", content:data.reply}]);
    setLoading(false);
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, height:"100vh", display:"flex", flexDirection:"column"}}>
      <h1 style={{textAlign:"center"}}>تيتان 2.0 - هيرميس مجاني 🤖</h1>
      <div style={{flex:1, border:"1px solid #ddd", overflowY:"auto", padding:12, borderRadius:12, background:"#fafafa"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{margin:8}}>
            <div style={{padding:10, borderRadius:10, background: m.role==="user" ? "#007aff" : "#fff", color: m.role==="user" ? "#fff" : "#000", textAlign:"right", border:"1px solid #eee"}}>
              {m.content}
              {m.image && <img src={m.image} style={{width:"100%", marginTop:8, borderRadius:12}} />}
            </div>
            <button onClick={()=> copy(m.content)} style={{fontSize:11, marginTop:4, padding:"4px 8px", borderRadius:10, border:"1px solid #ddd"}}>📋 نسخ</button>
          </div>
        ))}
        {loading && <div>يكتب...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex", gap:8, marginTop:10}}>
        <input value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && send()} placeholder="اكتب... او ارسملي قطه" style={{flex:1, padding:12, borderRadius:25, border:"1px solid #ccc"}} />
        <button onClick={send} style={{width:48, height:48, borderRadius:"50%", border:"none", background:"#007aff", color:"#fff"}}>↑</button>
      </div>
    </main>
  );
}
