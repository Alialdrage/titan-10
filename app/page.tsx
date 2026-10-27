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
      setMessages((m) => [...m, { role: "assistant", content: "خطأ" }]);
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>تيتان 1.0</h1>
      <div style={{ border: "1px solid #ddd", height: 400, overflowY: "auto", padding: 10, borderRadius: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: 5, padding: 8, background: m.role === "user" ? "#007aff" : "#eee", color: m.role === "user" ? "#fff" : "#000", borderRadius: 8, textAlign: "right" }}>
            {m.content}
          </div>
        ))}
        {loading && <div>يكتب...</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} style={{ flex: 1, padding: 10, borderRadius: 20, border: "1px solid #ccc" }} placeholder="اكتب..." />
        <button onClick={send} style={{ padding: "10px 20px", borderRadius: 20, background: "#007aff", color: "#fff", border: "none" }}>ارسال</button>
      </div>
    </main>
  );
}
