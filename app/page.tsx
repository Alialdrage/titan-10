"use client";
import { useState, useEffect, useRef } from "react";
export default function Page() {
  const [messages, setMessages] = useState<any[]>([{ role: "assistant", content: "هلا والله! تيتان رجع ✅" }]);
  const [input, setInput] = useState(""); const endRef = useRef<any>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async () => {
    if (!input.trim()) return; const t = input; setInput(""); setMessages(m => [...m, { role: "user", content: t }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, { role: "user", content: t }] }) });
      const data = await res.json(); setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch { setMessages(m => [...m, { role: "assistant", content: "هلا والله!" }]); }
  };
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 12, height: "100vh", display: "flex", flexDirection: "column" }}>
      <h2 style={{ textAlign: "center" }}>تيتان ✅</h2>
      <div style={{ flex: 1, border: "1px solid #eee", overflowY: "auto", padding: 10, borderRadius: 12 }}>
        {messages.map((m: any, i: number) => (<div key={i} style={{ margin: 8, padding: 10, borderRadius: 12, background: m.role === "user" ? "#007aff" : "#eee", textAlign: "right" }}>{m.content}</div>))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="اكتب..." style={{ flex: 1, padding: 11, borderRadius: 22, border: "1px solid #ccc" }} />
        <button onClick={send} style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff" }}>↑</button>
      </div>
    </main>
  );
}
