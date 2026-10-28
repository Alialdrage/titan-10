"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", reply: "هلا! انا تيتان هيرميس ✅ عام" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(m => [...m, { role: "user", reply: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages.filter(x=>x.role!=="assistant" || true), userMsg].map(x=>({role: x.role==="user"?"user":"assistant", content: x.reply||x.content})) })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", reply: data.reply }]);
    } catch { setMessages(m => [...m, { role: "assistant", reply: "❌ خطأ" }]); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-3">
      <h1 className="text-center text-2xl font-bold mb-3">تيتان هيرميس ✅ عام</h1>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-2xl max-w-[90%] ${msg.role==="user"?"bg-blue-600 text-white ml-auto":"bg-white border"}`}>
            {msg.reply?.includes("__IMAGE__") ? (
              <img src={msg.reply.replace("__IMAGE__","").replace(/__/g,"").trim()} alt="generated" className="w-full rounded-xl" />
            ) : (
              <div className="whitespace-pre-wrap break-words">{msg.reply}</div>
            )}
          </div>
        ))}
        {loading && <div className="text-gray-400">يكتب...</div>}
      </div>
      <div className="flex gap-2 mt-3">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="اكتب اي شي..." className="flex-1 border rounded-full px-4 py-2" />
        <button onClick={send} className="bg-blue-600 text-white rounded-full w-12 h-12">↑</button>
      </div>
    </div>
  );
}
