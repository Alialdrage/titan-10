"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>(()=>{
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("titan_chat");
      return saved ? JSON.parse(saved) : [{role:"assistant", content:"هلا والله حب! انا تيتان 2.0 مثل Meta AI، اكدر ارسملك صور واحفظ المحادثات! شتريد؟"}];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); localStorage.setItem("titan_chat", JSON.stringify(messages)); }, [messages]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); alert("تم النسخ ✅"); };
  const saveImage = (url: string) => { const a=document.createElement("a"); a.href=url; a.download="titan-image.png"; a.click(); };
  const clearChat = () => { if(confirm("تمسح المحادثة؟")){ setMessages([{role:"assistant", content:"هلا حب!"}]); localStorage.removeItem("titan_chat"); } };
  const downloadChat = () => {
    const text = messages.map(m=> `${m.role}: ${m.content}`).join("\n");
    const blob = new Blob([text], {type:"text/plain"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="titan-chat.txt"; a.click();
  };

  const send = async () => {
    if (!input.trim()) return;
    const t = input; setInput(""); setMessages(m=>[...m, {role:"user", content:t}]); setLoading(true);

    try {
      // اذا طلب صورة
      if (t.includes("ارسم") || t.includes("صورة") || t.includes("رسم") || t.toLowerCase().includes("image") || t.toLowerCase().includes("draw")) {
        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(t)}?width=512&height=512&nologo=true`;
        setMessages(m=>[...m, {role:"assistant", content:`تفضل صورتك:`, image: imgUrl}]);
      } else {
        const res = await fetch("/api/chat", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({messages:[...messages, {role:"user", content:t}]})
        });
        const data = await res.json();
        setMessages(m=>[...m, {role:"assistant", content:data.reply}]);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, height:"100vh", display:"flex", flexDirection:"column", fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h1>تيتان 2.0 🤖 مثل Meta AI</h1>
        <div style={{display:"flex", gap:6}}>
          <button onClick={downloadChat} style={{padding:"6px 10px", borderRadius:8, border:"1px solid #ccc", background:"#fff"}}>💾 حفظ</button>
          <button onClick={clearChat} style={{padding:"6px 10px", borderRadius:8, border:"1px solid #ccc", background:"#fff"}}>🗑️ مسح</button>
        </div>
      </div>

      <div style={{flex:1, border:"1px solid #ddd", overflowY:"auto", padding:12, borderRadius:12, background:"#fafafa"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{margin:8}}>
            <div style={{padding:"10px 14px", background: m.role==="user" ? "#007aff" : "#fff", color: m.role==="user" ? "#fff" : "#000", border:"1px solid #eee", borderRadius:16, textAlign:"right"}}>
              {m.content}
              {m.image && (
                <div style={{marginTop:10}}>
                  <img src={m.image} style={{width:"100%", borderRadius:12, border:"1px solid #ddd"}} />
                  <div style={{display:"flex", gap:6, marginTop:6}}>
                    <button onClick={()=> copy(m.image)} style={{fontSize:12, padding:"4px 8px", borderRadius:10, border:"1px solid #ccc"}}>📋 نسخ الرابط</button>
                    <button onClick={()=> saveImage(m.image)} style={{fontSize:12, padding:"4px 8px", borderRadius:10, border:"1px solid #ccc"}}>💾 حفظ الصورة</button>
                  </div>
                </div>
              )}
            </div>
            {m.role==="assistant" && !m.image && (
              <div style={{display:"flex", gap:6, marginTop:6, justifyContent:"flex-end"}}>
                <button onClick={()=> copy(m.content)} style={{fontSize:11, padding:"4px 10px", borderRadius:15, border:"1px solid #ddd", background:"#fff"}}>📋 نسخ</button>
              </div>
            )}
          </div>
        ))}
        {loading && <div style={{fontSize:12, color:"#999"}}>تيتان يفكر...</div>}
        <div ref={endRef}/>
      </div>

      <div style={{display:"flex", gap:8, marginTop:10}}>
        <input value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && send()} placeholder="اكتب... او كول ارسملي صورة قطة" style={{flex:1, padding:12, borderRadius:25, border:"1px solid #ccc"}} />
        <button onClick={()=> send()} style={{width:48, height:48, borderRadius:"50%", border:"none", background:"#007aff", color:"#fff"}}>↑</button>
      </div>

      <p style={{fontSize:10, color:"#888", textAlign:"center", marginTop:6}}>
        💾 يحفظ تلقائياً | 📋 نسخ | 🖼️ ارسم صور | 🗑️ مسح | مثل Meta AI
      </p>
    </main>
  );
}
