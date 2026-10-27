"use client";
import { useState, useEffect, useRef } from "react";

function RealCalculator() {
  const [d, setD] = useState("0"); const [h, setH] = useState("");
  const press = (v: string) => {
    if (v==="C") { setD("0"); setH(""); return; }
    if (v==="⌫") { setD(d.slice(0,-1)||"0"); return; }
    if (v==="=") { try { const r = eval(d.replace(/×/g,"*").replace(/÷/g,"/")); setH(d+" ="); setD(String(r).slice(0,12)); } catch { setD("خطأ"); } return; }
    setD(d==="0" && v!=="." ? v : d+v);
  };
  const btns = [["C","⌫","%","÷"],["7","8","9","×"],["4","5","6","-"],["1","2","3","+"],["0",".","="]];
  return (
    <div style={{background:"#111", borderRadius:20, padding:15, maxWidth:300, margin:"10px auto"}}>
      <div style={{background:"#222", borderRadius:12, padding:12, textAlign:"right"}}><div style={{color:"#888", fontSize:12}}>{h}</div><div style={{color:"#fff", fontSize:28}}>{d}</div></div>
      {btns.map((r,i)=><div key={i} style={{display:"flex", gap:8, marginTop:8}}>{r.map(b=><button key={b} onClick={()=> press(b)} style={{flex: b==="0"?2:1, height:50, borderRadius:12, border:"none", background: b==="="? "#007aff" : ["÷","×","-","+"].includes(b) ? "#333" : "#222", color:"#fff"}}>{b}</button>)}</div>)}
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<any[]>(()=>{ const s = typeof window!=="undefined" ? localStorage.getItem("titan_chat") : null; return s ? JSON.parse(s) : [{role:"assistant", content:"هلا والله! انا تيتان 2.0 - ارفع ملف، اكتب 'حاسبة'، او 'ارسملي قطه'!"}]; });
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const endRef = useRef<any>(null); const fileRef = useRef<any>(null);
  const [uploadedFile, setUploadedFile] = useState<{name:string, content:string, type:string}|null>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); localStorage.setItem("titan_chat", JSON.stringify(messages)); }, [messages]);

  const handleFile = async (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    
    if (file.type.startsWith("image/")) {
      reader.onload = (ev) => {
        setUploadedFile({name: file.name, content: ev.target?.result as string, type: "image"});
        setMessages(m=> [...m, {role:"user", content:`📎 رفعت صورة: ${file.name}`, image: ev.target?.result}]);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => {
        const text = (ev.target?.result as string).slice(0, 5000);
        setUploadedFile({name: file.name, content: text, type: "text"});
        setMessages(m=> [...m, {role:"user", content:`📎 رفعت ملف: ${file.name}\n\nمحتواه:\n${text.slice(0,500)}...`}]);
      };
      reader.readAsText(file);
    }
  };

  const send = async () => {
    if (!input.trim() && !uploadedFile) return;
    const t = input; setInput("");
    if (t) setMessages(m=> [...m, {role:"user", content:t}]);

    if (t.toLowerCase().includes("حاسبة") || t.toLowerCase().includes("calculator")) {
      setMessages(m=> [...m, {role:"assistant", content:"تفضل حاسبة:", showCalc:true}]); return;
    }
    if (t.includes("ارسم") || t.toLowerCase().includes("draw") || t.includes("صورة") || t.includes("قطه")) {
      let p = t.replace(/ارسملي|ارسم|صورة/g, "").trim() || "cute cat";
      const map: any = {"قطه":"cute kitten", "قطة":"cute kitten"};
      for (let k in map) if (p.includes(k)) p = p.replace(k, map[k]);
      const img = `https://image.pollinations.ai/prompt/${encodeURIComponent(p+", cute, safe for work")}?width=512&height=512&nologo=true&safe=true&model=flux`;
      setMessages(m=> [...m, {role:"assistant", content:"تفضل:", image: img}]); return;
    }

    setLoading(true);
    try {
      let finalMessages = [...messages];
      if (t) finalMessages.push({role:"user", content:t});
      if (uploadedFile) finalMessages.push({role:"user", content:`ملف مرفوع ${uploadedFile.name}: ${uploadedFile.content.slice(0,2000)}`});

      const res = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({messages: finalMessages})});
      const data = await res.json();
      setMessages(m=> [...m, {role:"assistant", content:data.reply}]);
      setUploadedFile(null);
    } catch {}
    setLoading(false);
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:15, height:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <h1 style={{textAlign:"center"}}>تيتان - يرفع ملفات 📁 مثل Meta AI</h1>
      <div style={{flex:1, border:"1px solid #ddd", overflowY:"auto", padding:12, borderRadius:12, background:"#fafafa"}}>
        {messages.map((m:any,i:number)=>(
          <div key={i} style={{margin:8}}>
            <div style={{padding:10, borderRadius:12, background: m.role==="user" ? "#007aff" : "#fff", color: m.role==="user" ? "#fff" : "#000", textAlign:"right", border:"1px solid #eee", whiteSpace:"pre-wrap"}}>
              {m.content}
              {m.image && <img src={m.image} style={{width:"100%", marginTop:8, borderRadius:12, maxHeight:300, objectFit:"contain"}} />}
              {m.showCalc && <RealCalculator />}
            </div>
          </div>
        ))}
        {loading && <div style={{fontSize:12, color:"#999"}}>تيتان يقرا الملف...</div>}
        <div ref={endRef}/>
      </div>
      
      {uploadedFile && <div style={{padding:"8px 12px", background:"#e3f2fd", borderRadius:10, fontSize:12, margin:"8px 0"}}>📎 {uploadedFile.name} جاهز للارسال <button onClick={()=> setUploadedFile(null)} style={{marginRight:10}}>✕</button></div>}
      
      <div style={{display:"flex", gap:8, marginTop:10, alignItems:"center"}}>
        <input ref={fileRef} type="file" onChange={handleFile} accept=".txt,.pdf,.json,.js,.ts,.py,.csv,image/*" style={{display:"none"}} />
        <button onClick={()=> fileRef.current?.click()} style={{width:44, height:44, borderRadius:"50%", border:"1px solid #ccc", background:"#fff", fontSize:18}}>📎</button>
        <input value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && send()} placeholder="اكتب... ارفع ملف، او 'حاسبة'" style={{flex:1, padding:12, borderRadius:25, border:"1px solid #ccc"}} />
        <button onClick={send} style={{width:48, height:48, borderRadius:"50%", border:"none", background:"#007aff", color:"#fff"}}>↑</button>
      </div>
      <p style={{fontSize:10, color:"#888", textAlign:"center", marginTop:6}}>📁 رفع ملفات | 🧮 حاسبة | 🖼️ رسم صور | مثل Meta AI</p>
    </main>
  );
}
