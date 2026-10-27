"use client";
import { useState, useRef, useEffect } from "react";
export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("جاري التشغيل...");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages]);
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA'; u.rate = 0.9;
      u.onend = () => setTimeout(()=> startListening(), 800);
      window.speechSynthesis.speak(u);
    }
  };
  const sendMessage = async (text: string) => {
    setMessages(prev=>[...prev, {role:"user", content: text}]);
    setStatus("تيتان يفكر...");
    const res = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({messages:[...messages, {role:"user", content: text}]})});
    const data = await res.json();
    setMessages(prev=>[...prev, {role:"assistant", content: data.reply}]);
    setStatus("🔴 يسمعك... احجي");
    speak(data.reply);
  };
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("استخدم Chrome"); return; }
    const r = new SR(); r.lang = 'ar-SA'; r.continuous = false;
    r.onstart = () => setStatus("🔴 يسمعك... احجي");
    r.onend = () => { if (status !== "تيتان يفكر...") setTimeout(()=> startListening(), 500); };
    r.onresult = (e:any) => sendMessage(e.results[0][0].transcript);
    r.onerror = () => setTimeout(()=> startListening(), 1000);
    try { r.start(); } catch {}
  };
  useEffect(()=>{ setTimeout(()=> startListening(), 1000); }, []);
  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:20, textAlign:"center"}}>
      <h1>تيتان 1.0 بدون ضغط 🎤</h1>
      <p style={{color:"red", fontWeight:"bold"}}>{status}</p>
      <div style={{border:"1px solid #ddd", borderRadius:12, height:400, overflowY:"auto", padding:15, background:"#fafafa", textAlign:"right"}}>
        {messages.map((m,i)=><div key={i} style={{marginBottom:10}}><b>{m.role==="user"?"انت:":"تيتان:"}</b> {m.content}</div>)}
        <div ref={endRef}/>
      </div>
    </main>
  );
}
