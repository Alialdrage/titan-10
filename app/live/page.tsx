"use client";
import { useState, useRef, useEffect } from "react";

export default function LivePage() {
  const [isLive, setIsLive] = useState(false);
  const [mode, setMode] = useState<"teacher"|"student">("teacher");
  const [roomCode, setRoomCode] = useState("");
  const [viewers, setViewers] = useState(12);
  const [messages, setMessages] = useState<any[]>([{from:"نظام", text:"بث مباشر - تيتان"}]);
  const [input, setInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startLive = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setIsLive(true);
      const code = Math.random().toString(36).substring(2,8).toUpperCase();
      setRoomCode(code);
      setInterval(()=> setViewers(v=> v + Math.floor(Math.random()*2)), 5000);
    } catch { alert("اسمح للكاميرا"); }
  };

  const stopLive = () => {
    stream?.getTracks().forEach(t=> t.stop());
    setIsLive(false); setStream(null); setRoomCode("");
  };

  const shareScreen = async () => {
    try {
      const s = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {}
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    setMessages(m=> [...m, {from: mode==="teacher" ? "الاستاذ" : "طالب", text: input}]);
    setInput("");
  };

  return (
    <main style={{maxWidth:1000, margin:"0 auto", padding:15, fontFamily:"sans-serif", direction:"rtl"}}>
      <h1 style={{textAlign:"center"}}>🎥 بث مباشر - تيتان</h1>
      
      <div style={{display:"flex", gap:10, justifyContent:"center", margin:"15px 0"}}>
        <button onClick={()=> setMode("teacher")} style={{padding:"10px 20px", borderRadius:20, border:"none", background: mode==="teacher" ? "#007aff" : "#eee", color: mode==="teacher" ? "#fff" : "#000"}}>👨‍🏫 استاذ</button>
        <button onClick={()=> setMode("student")} style={{padding:"10px 20px", borderRadius:20, border:"none", background: mode==="student" ? "#007aff" : "#eee", color: mode==="student" ? "#fff" : "#000"}}>👨‍🎓 طالب</button>
      </div>

      {mode==="teacher" ? (
        <div>
          <div style={{background:"#111", borderRadius:16, padding:10, position:"relative"}}>
            <video ref={videoRef} autoPlay muted playsInline style={{width:"100%", height:400, background:"#000", borderRadius:12, objectFit:"cover"}} />
            {isLive && <div style={{position:"absolute", top:20, left:20, background:"red", color:"#fff", padding:"4px 12px", borderRadius:20, fontSize:12}}>🔴 LIVE - {viewers} مشاهد</div>}
            {roomCode && <div style={{position:"absolute", bottom:20, left:20, background:"#fff", padding:"6px 12px", borderRadius:10, fontSize:12}}>كود: {roomCode} <button onClick={()=> navigator.clipboard.writeText(`titan-10.vercel.app/live?code=${roomCode}`)}>📋</button></div
