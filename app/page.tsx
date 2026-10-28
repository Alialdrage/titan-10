"use client";
import { useState, useEffect, useRef } from "react";

function Calculator() {
  const [d, setD] = useState("0"); const [h, setH] = useState("");
  const press = (v: string) => {
    if (v === "C") { setD("0"); setH(""); return; }
    if (v === "⌫") { setD(d.slice(0, -1) || "0"); return; }
    if (v === "=") { try { const r = Function('"use strict";return (' + d.replace(/×/g, "*").replace(/÷/g, "/") + ')')(); setH(d + " ="); setD(String(r).slice(0, 10)); } catch { setD("خطأ"); } return; }
    setD(d === "0" && v !== "." ? v : d + v);
  };
  const rows = [["C", "⌫", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "-"], ["1", "2", "3", "+"], ["0", ".", "="]];
  return (
    <div style={{ background: "#111", borderRadius: 16, padding: 12, maxWidth: 280, margin: "8px auto" }}>
      <div style={{ background: "#222", borderRadius: 10, padding: 10, textAlign: "right" }}><div style={{ color: "#888", fontSize: 11 }}>{h}</div><div style={{ color: "#fff", fontSize: 22 }}>{d}</div></div>
      {rows.map((r, i) => (<div key={i} style={{ display: "flex", gap: 6, marginTop: 6 }}>{r.map(b => (<button key={b} onClick={() => press(b)} style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: b === "=" ? "#007aff" : "#333", color: "#fff" }}>{b}</button>))}</div>))}
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<any[]>([{ role: "assistant", content: "هلا والله! تيتان رجع ✅\nجرب: حاسبة، قطة، بحث عن بغداد" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const endRef = useRef<any>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const t = input; setInput(""); setMessages(m => [...m, { role: "user", content: t }]);
    const low = t.toLowerCase(); const norm = low.replace(/ة/g, "ه");

    if (norm.includes("حاسب")) { setMessages(m => [...m, { role: "assistant", content: "حاسبة حقيقية:", showCalc: true }]); return; }
    if (norm.includes("قط") || low.includes("cat") || norm.includes("بزون")) {
      const img = `https://cataas.com/cat/cute?width=400&time=${Date.now()}`;
      setMessages(m => [...m, { role: "assistant", content: "😻 قطة:", image: img }]); return;
    }
    if (norm.includes("ابحث") || norm.includes("بحث")) {
      setLoading(true);
      try {
        const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: t }) });
        const data = await res.json();
        setMessages(m => [...m, { role: "assistant", content: `🔍 بحث: ${t}`, searchResults: data.results }]);
      } catch { setMessages(m => [...m, { role: "assistant", content: "بحث فشل" }]); }
      setLoading(false); return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, { role: "user", content: t }] }) });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch { setMessages(m => [...m, { role: "assistant", content: "هلا والله!" }]); }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 12, height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <h2 style={{ textAlign: "center" }}>تيتان ✅</h2>
      <div style={{ flex: 1, border: "1px solid #eee", overflowY: "auto", padding: 10, borderRadius: 12, background: "#fafafa" }}>
        {messages.map((m: any, i: number) => (
          <div key={i} style={{ margin: "8px 0", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "80%", padding: "10px 12px", borderRadius: 16, background: m.role === "user" ? "#007aff" : "#fff", color: m.role === "user" ? "#fff" : "#000", border: "1px solid #eee", textAlign: "right", whiteSpace: "pre-wrap" }}>
              {m.content}
              {m.image && <img src={m.image} style={{ width: "100%", borderRadius: 10, marginTop: 6 }} alt="" />}
              {m.showCalc && <Calculator />}
              {m.searchResults && m.searchResults.map((r: any, j: number) => (<a key={j} href={r.url} target="_blank" style={{ display: "block", margin: "6px 0", padding: 8, background: "#f0f7ff", borderRadius: 8, textDecoration: "none", color: "#000", fontSize: 12 }}>{r.title}</a>))}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12 }}>يكتب...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="حاسبة، قطة، بحث عن..." style={{ flex: 1, padding: 11, borderRadius: 22, border: "1px solid #ccc" }} />
        <button onClick={send} style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff" }}>↑</button>
      </div>
    </main>
  );
}
