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
    const res = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({messages:[...messages, {role:"user", content: text}]})
    });
    const data = await res.json();
    setMessages(prev=>[...prev, {role:"assistant", content: data.reply}]);
    setStatus("🔴 واقف - كول يا تيتان حتى اسمعك");
    speak(data.reply);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("استخدم Chrome"); return; }
    const r = new SR();
    r.lang = 'ar-SA';
    r.continuous = true; // يسمع باستمرار
    r.interimResults = false;
    
    r.onstart = () => setStatus("🔴 واقف - كول يا تيتان حتى اسمعك");
    
    r.onresult = (e:any) => {
      const last = e.results.length - 1;
      const text = e.results[last][0].transcript.toLowerCase().trim();
      
      console.log("سمع:", text); // للفحص
      
      // تنظيم: بس اذا بيه كلمة "تيتان" او "يا تيتان"
      if (text.includes("تيتان") || text.includes("تايتن") || text.includes("titan")) {
        // شيل كلمة تيتان من النص
        const cleanText = text.replace(/يا تيتان|تيتان|تايتن|titan/gi, "").trim();
        if (cleanText.length > 2) {
          setStatus("✅ سمعت يا تيتان!");
          sendMessage(cleanText);
        } else {
          setStatus("✅ نعم؟ احجي");
          speak("نعم حبيبي، شتريد؟");
        }
        r.stop();
      } else {
        // سمع كلام ثاني من تلفزيون او مجموعة - يتجاهله
        setStatus("🔴 واقف - كول يا تيتان... (تجاهل: " + text.slice(0,20) + ")");
      }
    };
    
    r.onend = () => {
      setTimeout(()=> {
        try { r.start(); } catch {}
      }, 500);
    };
    
    r.onerror = () => setTimeout(()=> { try { r.start(); } catch {} }, 1000);
    
    try { r.start(); } catch {}
  };

  useEffect(()=>{ setTimeout(()=> startListening(), 1000); }, []);

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:20, textAlign:"center", fontFamily:"sans-serif"}}>
      <h1>تيتان 1.0 🎤 منظم</h1>
      <p style={{color: status.includes("✅") ? "green" : "red", fontWeight:"bold", fontSize:14}}>{status}</p>
      <p style={{fontSize:12, color:"#666"}}>كول <b>"يا تيتان"</b> قبله حتى يسمعك - يتجاهل التلفزيون والمجموعة</p>
      
      <div style={{border:"1px solid #ddd", borderRadius:12, height:350, overflowY:"auto", padding:15, background:"#fafafa", textAlign:"right", marginBottom:15}}>
        {messages.map((m,i)=><div key={i} style={{marginBottom:10}}><b>{m.role==="user"?"انت:":"تيتان:"}</b> {m.content}</div>)}
        <div ref={endRef}/>
      </div>

      <div style={{background:"#eef", padding:10, borderRadius:8, fontSize:12, textAlign:"right"}}>
        <b>التنظيم الجديد:</b><br/>
        ✅ تكول "يا تيتان شلونك" → يجاوب<br/>
        ❌ تلفزيون يحجي او مجموعة تحجي → يتجاهلهم<br/>
        ❌ ما يرد ترحيب عشوائي
      </div>
    </main>
  );
}
