"use client";
import { useState, useEffect, useRef } from "react";

function RealCalculator() {
  const [d, setD] = useState("0");
  const [h, setH] = useState("");
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
      {rows.map((r, i) => (<div key={i} style={{ display: "flex", gap: 8, marginTop: 8 }}>{r.map((b) => (<button key={b} onClick={() => press(b)} style={{ flex: b === "0" ? 2 : 1, height: 50, borderRadius: 12, border: "none", background: b === "=" ? "#007aff" : ["÷", "×", "-", "+"].includes(b) ? "#333" : "#222", color: "#fff", fontSize: 18 }}>{b}</button>))}</div>))}
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<any>(null);
  const fileRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("titan_chat");
    if (saved) {
      if (saved.includes("التصميم") || saved.includes(".calculator") || saved.includes("عرض النتائج")) {
        localStorage.removeItem("titan_chat");
        setMessages([{ role: "assistant", content: "هلا والله! انا تيتان 2.0 - نسخة من Meta AI! 📁 ارفع ملف، 🧮 اكتب حاسبة، 🖼️ ارسملي قطه" }]);
        return;
      }
      try { setMessages(JSON.parse(saved)); return; } catch {}
    }
    setMessages([{ role: "assistant", content: "هلا والله! انا تيتان 2.0 - نسخة من Meta AI! 📁 ارفع ملف، 🧮 اكتب حاسبة، 🖼️ ارسملي قطه" }]);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); if (messages.length > 0) localStorage.setItem("titan_chat", JSON.stringify(messages)); }, [messages]);

  const copy = (t: string) => navigator.clipboard.writeText(t);
  const clear = () => { if (confirm("تمسح المحادثة؟")) { localStorage.removeItem("titan_chat"); setMessages([{ role: "assistant", content: "هلا والله! انا تيتان النظيف!" }]); } };

  const handleFile = (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (ev) => setMessages((m: any) => [...m, { role: "user", content: `📎 صورة: ${file.name}`, image: ev.target?.result }]);
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => {
        const text = (ev.target?.result as string).slice(0, 3000);
        setMessages((m: any) => [...m, { role: "user", content: `📎 ملف: ${file.name}\n${text.slice(0, 500)}...` }]);
      };
      reader.readAsText(file);
    }
  };

  const send = async () => {
    if (!input.trim()) return;
    const t = input; setInput(""); setMessages((m: any) => [...m, { role: "user", content: t }]);

    if (t.toLowerCase().includes("حاسبة") || t.toLowerCase().includes("calculator")) {
      setMessages((m: any) => [...m, { role: "assistant", content: "تفضل حاسبة متكاملة:", showCalc: true }]); return;
    }
    if (t.includes("ارسم") || t.toLowerCase().includes("draw") || t.includes("قطه") || t.includes("قطة") || t.includes("صورة")) {
      let p = t.replace(/ارسملي|ارسم|صورة/g, "").trim() || "cute cat";
      const map: any = { "قطه": "cute kitten", "قطة": "cute kitten", "كلب": "cute puppy" };
      for (let k in map) if (p.includes(k)) p = p.replace(k, map[k]);
      const img = `https://image.pollinations.ai/prompt/${encodeURIComponent(p + ", cute, safe for work, family friendly")}?width=512&height=512&nologo=true&safe=true&model=flux&seed=${Date.now()}`;
      setMessages((m: any) => [...m, { role: "assistant", content: "تفضل صورتك:", image: img }]); return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, { role: "user", content: t }] }) });
      const data = await res.json();
      setMessages((m: any) => [...m, { role: "assistant", content: data.reply }]);
    } catch { setMessages((m: any) => [...m, { role: "assistant", content: "حاول مرة ثانية حب" }]); }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 15, height: "100vh", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>تيتان 2.0 🤖 مثل Meta AI</h2>
        <button onClick={clear} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}>🗑️ مسح</button>
      </div>
      <div style={{ flex: 1, border: "1px solid #eee", overflowY: "auto", padding: 12, borderRadius: 16, background: "#fafafa", marginTop: 10 }}>
        {messages.map((m: any, i: number) => (
          <div key={i} style={{ margin: "10px 0", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 18, background: m.role === "user" ? "#007aff" : "#fff", color: m.role === "user" ? "#fff" : "#000", border: m.role === "user" ? "none" : "1px solid #eee", textAlign: "right", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.content}
              {m.image && <img src={m.image} style={{ width: "100%", marginTop: 8, borderRadius: 12, maxHeight: 350, objectFit: "contain" }} alt="titan" />}
              {m.showCalc && <RealCalculator />}
              {m.role === "assistant" && !m.showCalc && <div style={{ marginTop: 6 }}><button onClick={() => copy(m.content)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, border: "1px solid #ddd", background: "#fff" }}>📋 نسخ</button></div>}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: "#999" }}>يكتب...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <input ref={fileRef} type="file" onChange={handleFile} accept=".txt,.pdf,.json,.js,.ts,.py,.csv,image/*" style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #ddd", background: "#fff" }}>📎</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="اكتب... حاسبة، ارسملي قطه، ارفع ملف" style={{ flex: 1, padding: 12, borderRadius: 25, border: "1px solid #ccc" }} />
        <button onClick={send} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "#007aff", color: "#fff", fontSize: 18 }}>↑</button>
      </div>
    </main>
  );
}
