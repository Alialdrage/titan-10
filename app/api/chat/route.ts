"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const listen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("افتح الموقع بـ Chrome حتى يشتغل المايك");
    const r = new SR();
    r.lang = 'ar-SA';
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onresult = (e:any) => setInput(e.results[0][0].transcript);
    r.start();
  };

  const send = async () => {
    if (!input.trim()) return;
    const user = {role:"user", content: input};
    setMessages([...messages, user]);
    const txt = input;
    setInput("");
    const res = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({messages:[...messages, user]})
    });
    const data = await res.json();
    const bot = {role:"assistant", content: data.reply};
    setMessages(prev=>[...prev, bot]);
    speak(data.reply);
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:20}}>
      <h1 style={{textAlign:"center"}}>تيتان - Titan 1.0 🎤🔊</h1>
      <div style={{border:"1px solid #ddd", borderRadius:12, height:400, overflowY:"auto", padding:15, background:"#fafafa", marginBottom:12}}>
        {messages.map((m,i)=><div key={i} style={{marginBottom:10, textAlign: m.role==="user"?"right":"left"}}><b>{m.role==="user"?"انت:":"تيتان:"}</b> {m.content}</div>)}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex", gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="اكتب او اضغط 🎤 واحجي" style={{flex:1, padding:12, borderRadius:8, border:"1px solid #ccc"}}/>
        <button onClick={listen} style={{padding:12, borderRadius:8, background: isListening?"#ff4444":"#eee", border:"1px solid #ccc"}}>{isListening?"🔴":"🎤"}</button>
        <button onClick={send} style={{padding:"12px 20px", borderRadius:8, background:"black", color:"white"}}>ارسال</button>
      </div>
    </main>
  );
}
