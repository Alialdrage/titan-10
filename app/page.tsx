"use client";
import { useState } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "صار خطأ حاول مرة ثانية" }]);
    }
    setLoading(false);
  };

  const voice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return alert("استخدم متصفح كروم");
    const r = new SR();
    r.lang = "ar-SA";
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput(t);
    };
    r.start();
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif", height: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ textAlign: "center" }}>تيتان 1.0 🤖</h1>
      
      <div style={{ flex: 1, border: "1px solid #ddd", overflowY: "auto", padding: 10, borderRadius: 12, background: "#fafafa" }}>
        {messages.length === 0 && <p style={{ textAlign: "center", color: "#999", marginTop: 80 }}>هلا انا تيتان، شلون اساعدك؟</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: 6, padding: "10px 14px", background: m.role === "user" ? "#007aff" : "#e9e9eb", color: m.role === "user" ? "#fff" : "#000", borderRadius: 16, textAlign: "right", maxWidth: "85%", marginLeft: m.role === "user" ? "auto" : "0" }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: "#999" }}>تيتان يكتب...</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="اكتب رسالتك..." style={{ flex: 1, padding: "12px 16px", borderRadius: 25, border: "1px solid #ccc", outline: "none" }} />
        <button onClick={voice} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "#34c759", color: "#fff", fontSize: 18, cursor: "pointer" }}>🎤</button>
        <button onClick={send} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff", fontSize: 18, cursor: "pointer" }}>↑</button>
      </div>
    </main>
  );
}
