"use client";
import { useState } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const stopSpeak = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 1.0;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const send = async () => {
    if (!input.trim()) return;
    const t = input;
    setInput("");
    stopSpeak();
    setMessages((m) => [...m, { role: "user", content: t }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: t }] }),
      });
      const data = await res.json();
      const reply = data.reply;
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);

      // اذا الجواب قصير = صوت تلقائي، اذا طويل = لا
      if (reply.length < 150) {
        speak(reply);
      }
    } catch {
      setLoading(false);
    }
  };

  const voice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return alert("استخدم كروم");
    const r = new SR();
    r.lang = "ar-SA";
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.start();
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 15, height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>تيتان 1.0 🤖</h1>
      
      {speaking && (
        <button onClick={stopSpeak} style={{ background: "#e53935", color: "#fff", border: "none", padding: "8px", borderRadius: 20, marginBottom: 8, cursor: "pointer" }}>
          ⏹️ وكف الصوت
        </button>
      )}

      <div style={{ flex: 1, border: "1px solid #ddd", overflowY: "auto", padding: 10, borderRadius: 12, background: "#fafafa" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: 8 }}>
            <div style={{ padding: "10px 14px", background: m.role === "user" ? "#007aff" : "#fff", color: m.role === "user" ? "#fff" : "#000", border: "1px solid #eee", borderRadius: 16, textAlign: "right" }}>
              {m.content}
            </div>
            {/* اذا جواب طويل - خيار صوت */}
            {m.role === "assistant" && m.content.length > 150 && (
              <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={() => speak(m.content)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 15, border: "1px solid #34c759", background: "#e8f5e9", cursor: "pointer" }}>
                  🔊 اسمعه صوت
                </button>
                <span style={{ fontSize: 10, color: "#888" }}>📄 او اقراه كتابة</span>
              </div>
            )}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: "#999" }}>تيتان يكتب...</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="اكتب..." style={{ flex: 1, padding: "12px 16px", borderRadius: 25, border: "1px solid #ccc", outline: "none" }} />
        <button onClick={voice} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "#34c759", color: "#fff", fontSize: 18, cursor: "pointer" }}>🎤</button>
        <button onClick={send} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff", fontSize: 18, cursor: "pointer" }}>↑</button>
      </div>

      <p style={{ fontSize: 10, color: "#888", textAlign: "center", marginTop: 6 }}>
        سؤال قصير = صوت تلقائي 🔊 | جواب طويل = انت تختار 📄 او 🔊
      </p>
    </main>
  );
}
