"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("اضغط لتشغيل تيتان 🎤");
  const [isOn, setIsOn] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages]);

  const speak = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA'; u.rate = 0.9; u.volume = 1;
      u.onstart = () => setStatus("🔊 تيتان يحجي...");
      u.onend = () => {
        setStatus("🔴 نايم - كول هلو تيتان");
        setTimeout(()=> startListening(), 500);
      };
      u.onerror = () => {
        setStatus("🔴 نايم - كول هلو تيتان");
        setTimeout(()=> startListening(), 500);
      };
      window.speechSynthesis.speak(u);
      // احتياط اذا ما اشتغل الصوت
      setTimeout(()=> {
        if (!window.speechSynthesis.speaking) {
          setStatus("🔴 نايم - كول هلو تيتان");
          startListening();
        }
      }, 2000);
    } catch {
      setTimeout(()=> startListening(), 500);
    }
  };

  const sendMessage = async (text: string) => {
    stopListening();
    setMessages(prev=>[...prev, {role:"user", content: text}]);
    setStatus("🧠 تيتان يفكر...");
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({messages:[...messages, {role:"user", content: text}]})
      });
      const data = await res.json();
      setMessages(prev=>[...prev, {role:"assistant", content: data.reply}]);
      speak(data.reply);
    } catch {
      setStatus("❌ خطأ - اضغط تشغيل");
      setIsOn(false);
    }
  };

  const stopListening = () => {
    if (recogRef.current) {
      try { recogRef.current.onend = null; recogRef.current.stop(); } catch {}
      recogRef.current = null;
    }
  };

  const startListening = () => {
    if (!isOn) return;
    stopListening();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("استخدم Chrome"); return; }
    const r = new SR();
    r.lang = 'ar-SA';
    r.continuous = false;
    r.interimResults = false;
    recogRef.current = r;
    
    r.onstart = () => setStatus("🎤 اسمعك - كول هلو تيتان");
    r.onresult = (e:any) => {
      const text = e.results[0][0].transcript.trim();
      const lower = text.toLowerCase();
      const hasWake = lower.includes("هلو تيتان") || lower.includes("هلا تيتان") || lower.includes("تيتان") || lower.includes("titan");
      
      if (hasWake) {
        let clean = text.replace(/هلو تيتان|هلا تيتان|يا تيتان|تيتان|titan/gi, "").trim();
        if (clean.length < 2) {
          setStatus("✅ نعم؟");
          speak("هلو حبيبي شتريد");
          return;
        }
        sendMessage(clean);
      } else {
        setStatus(`🔴 تجاهل (${text.slice(0,12)}...) - كول هلو تيتان`);
        setTimeout(()=> { if (isOn) startListening(); }, 800);
      }
    };
    r.onend = () => {
      if (isOn && !status.includes("يفكر") && !status.includes("يحجي")) {
        setTimeout(()=> startListening(), 600);
      }
    };
    r.onerror = (e:any) => {
      console.log("error", e.error);
      if (isOn) setTimeout(()=> startListening(), 1000);
    };
    try { r.start(); } catch { if (isOn) setTimeout(()=> startListening(), 800); }
  };

  const toggleOn = () => {
    if (isOn) {
      setIsOn(false);
      stopListening();
      window.speechSynthesis.cancel();
      setStatus("⏸️ واقف - اضغط لتشغيل");
    } else {
      setIsOn(true);
      // صوت تشغيلي
      try {
        const u = new SpeechSynthesisUtterance("تم تشغيل تيتان");
        u.lang = 'ar-SA';
        u.onend = () => startListening();
        window.speechSynthesis.speak(u);
      } catch {
        startListening();
      }
      setStatus("🎤 اسمعك - كول هلو تيتان");
    }
  };

  useEffect(()=>{ return ()=> stopListening(); }, []);

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, textAlign:"center", fontFamily:"sans-serif"}}>
      <h1 style={{fontSize:22}}>تيتان 1.0 🎤 هلو تيتان</h1>
      
      <button onClick={toggleOn} style={{
        background: isOn ? "#e53935" : "#43a047",
        color:"white", border:"none", padding:"18px 40px",
        borderRadius:50, fontSize:20, fontWeight:"bold",
        margin:"15px 0", cursor:"pointer", width:"80%"
      }}>
        {isOn ? "⏹️ اطفاء" : "▶️ شغل تيتان"}
      </button>

      <p style={{color: isOn ? "green" : "red", fontWeight:"bold", fontSize:13}}>{status}</p>
      
      <div style={{border:"1px solid #ddd", borderRadius:12, height:340, overflowY:"auto", padding:12, background:"#fafafa", textAlign:"right", marginBottom:10}}>
        {messages.length===0 && <p style={{color:"#999", fontSize:12}}>1. اضغط شغل<br/>2. كول "هلو تيتان شلونك"<br/>3. راح يجاوب وما يسكت</p>}
        {messages.map((m,i)=><div key={i} style={{marginBottom:8, fontSize:14}}><b>{m.role==="user"?"انت:":"تيتان:"}</b> {m.content}</div>)}
        <div ref={endRef}/>
      </div>

      <div style={{fontSize:10, color:"#888"}}>
        اذا سكت - اضغط شغل مرة ثانية (مشكلة المتصفح)
      </div>
    </main>
  );
}
