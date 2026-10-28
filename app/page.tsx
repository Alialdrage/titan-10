"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([{ role: "assistant", content: "هلا! انا تيتان هيرميس ✅ عام" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<any>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const t = input; setInput("");
    setMessages(m => [...m, { role: "user", content: t }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, { role: "user", content: t }] }) });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch { setMessages(m => [...m, { role: "assistant", content: "❌ فشل" }]); }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 12, height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <h2 style={{ textAlign: "center" }}>تيتان هيرميس ✅ عام</h2>
      <div style={{ flex: 1, border: "1px solid #eee", overflowY: "auto", padding: 10, borderRadius: 12, background: "#fafafa" }}>
        {messages.map((m: any, i: number) => (
          <div key={i} style={{ margin: "8px 0", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "80%", padding: "10px 12px", borderRadius: 16, background: m.role === "user" ? "#007aff" : "#fff", color: m.role === "user" ? "#fff" : "#000", border: "1px solid #eee", textAlign: "right", whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12 }}>هيرميس يكتب...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="اكتب اي شي..." style={{ flex: 1, padding: 11, borderRadius: 22, border: "1px solid #ccc" }} />
        <button onClick={send} style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff" }}>↑</button>
      </div>
    </main>
  );
}
