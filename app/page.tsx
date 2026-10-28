"use client";
import { useState, useEffect, useRef } from "react";

function RealCalculator() {
  const [d, setD] = useState("0"); const [h, setH] = useState("");
  const press = (v: string) => {
    if (v === "C") { setD("0"); setH(""); return; }
    if (v === "⌫") { setD(d.slice(0, -1) || "0"); return; }
    if (v === "=") { try { const r = eval(d.replace(/×/g, "*").replace(/÷/g, "/")); setH(d + " ="); setD(String(r).slice(0, 12)); } catch { setD("خطأ"); } return; }
    setD(d === "0" && v !== "." ? v : d + v);
  };
  const rows = [["C", "⌫", "%", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "-"], ["1", "2", "3", "+"], ["0", ".", "="]];
  return (
    <div style={{ background: "#111", borderRadius: 20, padding: 15, maxWidth: 300, margin: "10px auto" }}>
      <div style={{ background: "#222", borderRadius: 12, padding: 12, textAlign: "right" }}><div style={{ color: "#888", fontSize: 12 }}>{h}</div><div style={{ color: "#fff", fontSize: 28 }}>{d}</div></div>
      {rows.map((r, i) => (<div key={i} style={{ display: "flex", gap: 8, marginTop: 8 }}>{r.map((b) => (<button key={b} onClick={() => press(b)} style={{ flex: b === "0" ? 2 : 1, height: 50, borderRadius: 12, border: "none", background: b === "=" ? "#007aff" : ["÷", "×", "-", "+"].includes(b) ? "#333" : "#222", color: "#fff" }}>{b}</button>))}</div>))}
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<any>(null);
  const fileRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("titan_chat");
    if (saved && (saved.includes("التصميم") || saved.includes(".calculator"))) {
      localStorage.removeItem("titan_chat");
    }
    const s = localStorage.getItem("titan_chat");
    if (s) { try { setMessages(JSON.parse(s)); return; } catch {} }
    setMessages([{ role: "assistant", content: "هلا والله! انا تيتان بالصوت! 🎤 دوس المايك واحجي وياي عراقي!" }]);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); if (messages.length > 0) localStorage.setItem("titan_chat", JSON.stringify(messages)); }, [messages]);

  const copy = (t: string) => navigator.clipboard.writeText(t);
  
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) { alert("المتصفح ما يدعم الصوت"); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ar-SA"; utter.rate = 0.9; utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("المتصفح ما يدعم المايك - استخدم كروم"); return; }
    const rec = new SR();
    rec.lang = "ar-SA"; rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setTimeout(() => { setMessages((m:any) => [...m, {role:"user", content:text}]); handleSend(text); }, 200);
    };
    rec.start();
  };

  const handleSend = async (textOverride?: string) => {
    const t = textOverride || input;
    if (!t.trim()) return;
    if (!textOverride) { setInput(""); setMessages((m:any) => [...m, {role:"user", content:t}]); }

    if (t.toLowerCase().includes("حاسبة") || t.toLowerCase().includes("calculator")) {
      setMessages((m:any) => [...m, {role:"assistant", content:"تفضل حاسبة:", showCalc:true}]); return;
    }
    if (t.includes("قط") || t.includes("صورة") || t.toLowerCase().includes("cat")) {
      const img = `https://cataas.com/cat/cute?width=512&height=512&time=${Date.now()}`;
      setMessages((m:any) => [...m, {role:"assistant", content:"تفضل قطتك 😻:", image: img}]); return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({messages:[...messages, {role:"user", content:t}]})});
      const data = await res.json();
      setMessages((m:any) => [...m, {role:"assistant", content:data.reply}]);
    } catch { setMessages((m:any) => [...m, {role:"assistant", content:"حاول مرة ثانية"}]); }
    setLoading(false);
  };

  const send = () => handleSend();

  const handleFile = (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMessages((m:any) => [...m, {role:"user", content:`📎 ${file.name}`, image: file.type.startsWith("image/") ? ev.target?.result : undefined}]);
    if (file.type.startsWith("image/")) reader.readAsDataURL(file); else reader.readAsText(file);
  };

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 15, height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <h2 style={{ textAlign: "center", margin: 0 }}>تيتان 🎤 يحجي عراقي - مثل Meta AI</h2>
      <div style={{ flex: 1, border: "1px solid #eee", overflowY: "auto", padding: 12, borderRadius: 16, background: "#fafafa", marginTop: 10 }}>
        {messages.map((m: any, i: number) => (
          <div key={i} style={{ margin: "10px 0", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 18, background: m.role === "user" ? "#007aff" : "#fff", color: m.role === "user" ? "#fff" : "#000", border: m.role === "user" ? "none" : "1px solid #eee", textAlign: "right" }}>
              {m.content}
              {m.image && <img src={m.image} style={{ width: "100%", marginTop: 8, borderRadius: 12, maxHeight: 350 }} alt="" />}
              {m.showCalc && <RealCalculator />}
              {m.role === "assistant" && !m.showCalc && (
                <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                  <button onClick={() => copy(m.content)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, border: "1px solid #ddd" }}>📋</button>
                  <button onClick={() => speak(m.content)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, border: "1px solid #ddd" }}>🔊 اسمع</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: "#999" }}>يكتب...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <input ref={fileRef} type="file" onChange={handleFile} accept="image/*,.txt,.pdf" style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #ddd", background: "#fff" }}>📎</button>
        <button onClick={startListening} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: listening ? "#ff3b30" : "#34c759", color: "#fff", fontSize: 20 }}>{listening ? "⏹️" : "🎤"}</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={listening ? "اسمعك..." : "اكتب او دوس مايك..."} style={{ flex: 1, padding: 12, borderRadius: 25, border: listening ? "2px solid #ff3b30" : "1px solid #ccc" }} />
        <button onClick={send} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff" }}>↑</button>
      </div>
      <p style={{ fontSize: 10, color: "#888", textAlign: "center" }}>🎤 دوس المايك واحجي عراقي | 🔊 اسمع الجواب | مثل Meta AI</p>
    </main>
  );
}
