"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "هلا! انا تيتان هيرميس ✅ عام" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const t = input;
    setInput("");
    setMessages(m => [...m, { role: "user", content: t }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: t }] })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "❌ خطأ" }]);
    }
    setLoading(false);
  };

  return (
    <img src={url} style={{width:"100%",borderRadius:12}} alt="" 
  onError={(e:any)=>{
    e.target.src=`https://picsum.photos/seed/${Date.now()}/1024/1024`;
    e.target.onerror=null;
  }} 
/>
        {loading && <div style={{ fontSize: 12, color: "#888" }}>يكتب...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="اكتب اي شي..."
          style={{ flex: 1, padding: "11px 14px", borderRadius: 22, border: "1px solid #ccc", outline: "none" }}
        />
        <button onClick={send} style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: "#0b93ff", color: "#fff", fontSize: 18 }}>↑</button>
      </div>
    </main>
  );
}
