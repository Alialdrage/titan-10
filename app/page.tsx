"use client";
import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role:string, content:string}[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if(!input) return;
    const newMessages = [...messages, {role:"user", content:input}];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({messages:newMessages})
      });
      const data = await res.json();
      setMessages([...newMessages, {role:"assistant", content:data.reply}]);
    } catch(e) {
      setMessages([...newMessages, {role:"assistant", content:"فشل الطلب - تأكد من GROQ_API_KEY"}]);
    }
    setLoading(false);
  }

  return (
    <main style={{maxWidth:600, margin:"0 auto", padding:20, fontFamily:"sans-serif"}}>
      <h1>تيتان - Titan 1.0</h1>
      <div style={{border:"1px solid #ccc", height:400, overflowY:"auto", padding:10, marginBottom:10}}>
        {messages.map((m,i)=><div key={i} style={{margin:"8px 0", textAlign: m.role==="user"?"right":"left"}}><b>{m.role==="user"?"انت":"تيتان"}:</b> {m.content}</div>)}
        {loading && <div>يكتب...</div>}
      </div>
      <div style={{display:"flex", gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="اكتب رسالة..." style={{flex:1, padding:10}} />
        <button onClick={send} style={{padding:"10px 20px"}}>ارسال</button>
      </div>
    </main>
  );
}
