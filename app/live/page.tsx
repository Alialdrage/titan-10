"use client";
import { useState, useRef } from "react";

export default function LivePage() {
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<any>(null);

  const startLive = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = s;
      setIsLive(true);
    } catch {
      alert("اسمح للكاميرا من المتصفح");
    }
  };

  const stopLive = () => {
    setIsLive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t:any) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <main style={{maxWidth:700, margin:"0 auto", padding:20, fontFamily:"sans-serif", textAlign:"center"}}>
      <h1>🎥 بث مباشر - تيتان</h1>
      
      <div style={{background:"#111", borderRadius:16, padding:10, margin:"20px 0"}}>
        <video ref={videoRef} autoPlay muted playsInline style={{width:"100%", height:350, background:"#000", borderRadius:12}} />
        {isLive && <div style={{color:"red", marginTop:10}}>🔴 LIVE</div>}
      </div>

      <div style={{display:"flex", gap:10, justifyContent:"center"}}>
        {!isLive ? (
          <button onClick={startLive} style={{padding:"14px 30px", borderRadius:30, border:"none", background:"#e53935", color:"#fff", fontSize:16}}>🔴 بدء البث</button>
        ) : (
          <button onClick={stopLive} style={{padding:"14px 30px", borderRadius:30, border:"none", background:"#333", color:"#fff", fontSize:16}}>⏹️ انهاء البث</button>
        )}
      </div>

      <p style={{marginTop:20, fontSize:12, color:"#888"}}>
        بعد ما يصير اخضر، الرابط: titan-10.vercel.app/live
      </p>
    </main>
  );
}
