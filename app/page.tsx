"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userText = text.trim();
    setInput("");
    setMessages(prev=>[...prev, {role:"user", content: userText}]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({messages:[...messages, {role:"user", content: userText}]})
      });
      const data = await res.json();
      setMessages(prev=>[...prev, {role:"assistant", content: data.reply}]);
      speak(data.reply);
    } catch {
      setMessages(prev=>[...prev, {role:"assistant", content: "صار خطأ، حاول مرة ثانية"}]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("استخدم Chrome"); return; }
    const r = new SR();
    r.lang = 'ar-SA';
    r.continuous = false;
    setListening(true);
    r.onresult = (e:any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setListening(false);
      send(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, fontFamily:"sans-serif", display:"flex", flexDirection:"column", height:"100vh"}}>
      <h1 style={{textAlign:"center", fontSize:22, margin:"10px 0"}}>تيتان 1.0 🤖</h1>
      
      <div style={{flex:1, border:"1px solid #ddd", borderRadius:12, overflowY:"auto", padding:12, background:"#fafafa"}}>
        {messages.length===0 && <p style={{color:"#999", textAlign:"center", marginTop:50}}>هلا! انا تيتان، شلون اساعدك؟</p>}
        {messages.map((m,i)=>
          <div key={i} style={{
            marginBottom:10, padding:"10px 14px", borderRadius:12,
            background: m.role==="user" ? "#007aff" : "#e9e9eb",
            color: m.role==="user" ? "white" : "black",
            alignSelf: m.role==="user" ? "flex-end" : "flex-start",
            textAlign:"right", maxWidth:"85%", marginLeft: m.role==="user" ? "auto" : "0"
          }}>
            {m.content}
          </div>
        )}
        {loading && <div style={{color:"#999", fontSize:12}}>تيتان يكتب...</div>}
        <div ref={endRef}/>
      </div>

      <div style={{display:"flex", gap:8, marginTop:12, paddingBottom:10}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=> e.key==="Enter" && send(input)}
          placeholder="اكتب رسالتك..."
          style={{flex:1, padding:"12px 16px", borderRadius:25, border:"1px solid #ccc", outline:"none"}}
        />
        <button onClick={()=> send(input)} disabled={loading} style={{
          background:"#007aff", color:"white", border:"none", borderRadius:"50%",
          width:48, height:48, cursor:"pointer", fontSize:20
        }}>↑</button>
        <button onClick={startVoice} style={{
          background: listening ? "#e53935" : "#34c759",
          color:"white", border:"none", borderRadius:"50%",
          width:48, height:48, cursor:"pointer", fontSize:20
        }}>
          {listening ? "●" : "🎤"}
        </button>
      </div>
    </main>
  );
}
