"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("جاري التشغيل...");
  const endRef = useRef<HTMLDivElement>(null);
  const listeningRef = useRef<any>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA'; u.rate = 0.9;
      u.onend = () => setTimeout(()=> startListening(), 1000);
      window.speechSynthesis.speak(u);
    }
  };

  const sendMessage = async (text: string) => {
    setMessages(prev=>[...prev, {role:"user", content: text}]);
    setStatus("تيتان يفكر...");
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({messages:[...messages, {role:"user", content: text}]})
      });
      const data = await res.json();
      setMessages(prev=>[...prev, {role:"assistant", content: data.reply}]);
      setStatus("🔴 نايم - كول هلو تيتان");
      speak(data.reply);
    } catch {
      setStatus("🔴 نايم - كول هلو تيتان");
      setTimeout(()=> startListening(), 1000);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("استخدم Chrome"); return; }
    
    if (listeningRef.current) try { listeningRef.current.stop(); } catch {}

    const r = new SR();
    r.lang = 'ar-SA';
    r.continuous = false;
    r.interimResults = false;
    listeningRef.current = r;
    
    r.onstart = () => setStatus("🔴 نايم - كول هلو تيتان");
    
    r.onresult = (e:any) => {
      const text = e.results[0][0].transcript.trim();
      const lower = text.toLowerCase();
      
      // هسه كلمة السر: هلو تيتان
      const hasWakeWord = lower.includes("هلو تيتان") || lower.includes("هلا تيتان") || lower.includes("هلو تايتن") || lower.includes("hello titan") || lower.includes("يا تيتان") || lower.includes("تيتان");
      
      if (hasWakeWord) {
        let clean = text.replace(/هلو تيتان|هلا تيتان|هلو تايتن|يا تيتان|تيتان|تايتن|hello titan|titan/gi, "").trim();
        if (clean.length < 2) {
          setStatus("✅ هلو! شتريد؟");
          speak("هلو حبيبي، شتريد؟");
          setTimeout(()=> startListening(), 1500);
          return;
        }
        setStatus("✅ سمعتك!");
        sendMessage(clean);
      } else {
        setStatus(`🔴 تجاهل (${text.slice(0,15)}...) - كول هلو تيتان`);
        setTimeout(()=> startListening(), 1000);
      }
    };
    
    r.onend = () => setTimeout(()=> startListening(), 800);
    r.onerror = () => setTimeout(()=> startListening(), 1500);
    try { r.start(); } catch {}
  };

  useEffect(()=>{ 
    setTimeout(()=> startListening(), 1000);
    return ()=> { if (listeningRef.current) try { listeningRef.current.stop(); } catch {} };
  }, []);

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, textAlign:"center", fontFamily:"sans-serif"}}>
      <h1 style={{fontSize:22}}>تيتان 1.0 🎤 هلو تيتان</h1>
      <p style={{color: status.includes("✅") ? "green" : status.includes("تجاهل") ? "#999" : "red", fontWeight:"bold", fontSize:13}}>{status}</p>
      <p style={{fontSize:11, color:"#666", marginBottom:10}}>كول <b>"هلو تيتان"</b> حتى يسمعك</p>
      
      <div style={{border:"1px solid #ddd", borderRadius:12, height:360, overflowY:"auto", padding:12, background:"#fafafa", textAlign:"right", marginBottom:10}}>
        {messages.length===0 && <p style={{color:"#999", fontSize:12}}>جرب كول: "هلو تيتان شلونك"</p>}
        {messages.map((m,i)=><div key={i} style={{marginBottom:8, fontSize:14}}><b>{m.role==="user"?"انت:":"تيتان:"}</b> {m.content}</div>)}
        <div ref={endRef}/>
      </div>

      <div style={{background:"#e8f5e9", padding:8, borderRadius:8, fontSize:11, textAlign:"right"}}>
        ✅ "هلو تيتان شلونك" → يجاوب<br/>
        ❌ "هلو" لحالها → يتجاهل
      </div>
    </main>
  );
}
