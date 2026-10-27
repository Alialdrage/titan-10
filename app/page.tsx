"use client";
import { useState } from "react";
export default function Page() {
  const [input,setInput]=useState("");
  const [msgs,setMsgs]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  async function send(){
    if(!input) return;
    const newMsgs=[...msgs,{role:"user",content:input}];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:newMsgs})});
    const data=await res.json();
    setMsgs([...newMsgs,{role:"assistant",content:data.reply}]);
    setLoading(false);
  }
  return (
    <main style={{maxWidth:600,margin:"0 auto",padding:20,fontFamily:"sans-serif"}}>
      <h1>تيتان - Titan 1.0 🤖</h1>
      <div style={{border:"1px solid #ccc",height:400,overflowY:"auto",padding:10,marginBottom:10}}>
        {msgs.map((m,i)=><div key={i} style={{margin:"8px 0",textAlign:m.role=="user"?"right":"left"}}><b>{m.role=="user"?"انت":"تيتان"}:</b> {m.content}</div>)}
        {loading&&<div>تيتان يكتب...</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key=="Enter"&&send()} placeholder="اكتب رسالتك..." style={{flex:1,padding:12,borderRadius:8,border:"1px solid #ccc"}} />
        <button onClick={send} style={{padding:"12px 20px",borderRadius:8,background:"black",color:"white"}}>ارسال</button>
      </div>
    </main>
  )
}
