"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<{role:string, content:string}[]>([]);
  const [input, setInput] = useState("");
  const [memory, setMemory] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("titan_memory");
    if (saved) setMemory(saved);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-IQ';
      utter.rate = 0.9;
      speechSynthesis.speak(utter);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("المتصفح ما يدعم الصوت");
    const recog = new SpeechRecognition();
    recog.lang = 'ar-IQ';
    recog.onstart = () => setIsListening(true);
    recog.onend = () => setIsListening(false);
    recog.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
    };
    recog.start();
  };

  const learn = (text: string) => {
    if (text.includes("تذكر") || text.includes("احفظ")) {
      const newMem = memory + "\n" + text;
      setMemory(newMem);
      localStorage.setItem("titan_memory", newMem);
      return true;
    }
    return false;
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    
    if (learn(input)) {
      setMessages([...messages, userMsg, { role: "assistant", content: "تم! حفظت المعلومة وراح اتذكرها بعدين ✅" }]);
      setInput("");
      return;
    }

    setMessages([...messages, userMsg]);
    const currentInput = input;
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: [...messages, userMsg, ...(memory ? [{role: "system", content: `معلومات تتذكرها عن المستخدم: ${memory}`}] : [])] 
      })
    });
    const data = await res.json();
    const botMsg = { role: "assistant", content: data.reply };
    setMessages(prev => [...prev, botMsg]);
    speak(data.reply);
  };

  return (
    <main style={{maxWidth: 700, margin: "0 auto", padding: 20, fontFamily: "sans-serif"}}>
      <h1 style={{textAlign: "center"}}>تيتان - Titan 2.0 🤖🎤</h1>
      <p style={{textAlign: "center", fontSize: 12, color: "#666"}}>{memory ? `يتذكر: ${memory.slice(0,50)}...` : "يكدر يتعلم! كله تذكر اني..."}</p>
      
      <div style={{border: "1px solid #ddd", borderRadius: 12, height: 400, overflowY: "auto", padding: 15, marginBottom: 15, background: "#fafafa"}}>
        {messages.map((m, i) => (
          <div key={i} style={{marginBottom: 12, textAlign: m.role==="user" ? "right" : "left"}}>
            <b>{m.role==="user" ? "انت:" : "تيتان:"}</b> {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{display: "flex", gap: 8}}>
        <input 
          value={input} 
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && send()}
          placeholder="اكتب رسالتك... او كول تذكر اني احب..."
          style={{flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ccc"}}
        />
        <button onClick={startListening} style={{padding: "12px", borderRadius: 8, border: "1px solid #ccc", background: isListening ? "red" : "#eee"}}>
          {isListening ? "🔴" : "🎤"}
        </button>
        <button onClick={send} style={{padding: "12px 20px", borderRadius: 8, background: "black", color: "white", border: "none"}}>
          ارسال
        </button>
      </div>
      
      <div style={{marginTop: 15, fontSize: 12, color: "#888", textAlign: "center"}}>
        💡 جرب: "تذكر اني اسمع قران" - "احجي بصوت" - اضغط 🎤 واحجي
      </div>
    </main>
  );
}
