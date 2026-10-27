"use client";
import { useState, useRef, useEffect } from "react";
export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages]);
  const send = async (txt: string) => {
    if (!txt.trim()) return;
    setInput(""); setMessages(m=>[...m, {role:"user", content:txt}]); setLoading(true);
    const res = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({messages:[...messages, {role:"user", content:txt}]})});
    const data = await res.json();
    setMessages(m=>[...m, {role:"assistant", content:data.reply}]); setLoading(false);
  };
  const voice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const r = new SR(); r.lang='ar-SA'; r.onresult=(e:any)=> send(e.results[0][0].transcript); r.start();
  };
  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, height:"100vh", display:"flex", flexDirection:"column"}}>
      <h1 style={{textAlign:"center"}}>تيتان 1.0</h1>
      <div style={{flex:1, border:"1px solid #ddd", borderRadius:12, padding:12, overflowY:"auto", background:"#fafafa"}}>
        {messages.map((m,i)=><div key={i} style={{margin:8, padding:10, borderRadius:10, background: m.role==="user" ? "#007aff" : "#eee", color: m.role==="user" ? "#fff" : "#000", textAlign:"right"}}>{m.content}</div>)}
        {loading && <div>يكتب...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex", gap:8, marginTop:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && send(input)} placeholder="اكتب..." style={{flex:1, padding:12, borderRadius:25, border:"1px solid #ccc"}} />
        <button onClick={()=>send(input)} style={{width:48, height:48, borderRadius:"50%", border:"none", background:"#007aff", color:"#fff"}}>↑</button>
        <button onClick={voice} style={{width:48, height:48, borderRadius:"50%", border:"none", background:"#34c759", color:"#fff"}}>🎤</button>
      </div>
    </main>
  );
}
