"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type ChatApiResponse = { reply?: unknown; error?: unknown };
type AuthMode = "signin" | "signup";

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "هلا! أنا تيتان. أقدر أساعدك بالمحادثة وإنشاء الصور. جرّب: ولد لي صورة كرة حمراء.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getImageUrl(content: string): string | null {
  if (!content.startsWith("__IMAGE__")) return null;
  const value = content.slice("__IMAGE__".length).replace(/__$/, "").trim();
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!firebaseAuth) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firebaseAuth || authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      }
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      const messagesByCode: Record<string, string> = {
        "auth/invalid-email": "البريد الإلكتروني غير صالح.",
        "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
        "auth/wrong-password": "كلمة المرور غير صحيحة.",
        "auth/invalid-credential": "بيانات الدخول غير صحيحة.",
        "auth/email-already-in-use": "هذا البريد مسجل مسبقاً.",
        "auth/weak-password": "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
        "auth/too-many-requests": "محاولات كثيرة. حاول لاحقاً.",
        "auth/network-request-failed": "تعذر الاتصال. تحقق من الإنترنت.",
      };
      setAuthError(messagesByCode[code] || "تعذر إكمال تسجيل الدخول.");
    } finally {
      setAuthBusy(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !user) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setInput("");
    setMessages(nextMessages);
    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("وصل رد غير مفهوم من الخادم. حاول مرة أخرى.");
      }

      const data: ChatApiResponse = isRecord(payload) ? payload : {};
      if (!response.ok) {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : `تعذر إكمال الطلب (HTTP ${response.status}).`;
        throw new Error(errorMessage);
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("لم يصل رد صالح من تيتان.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "تعذر الاتصال. تحقق من الإنترنت ثم حاول مرة أخرى.";
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `❌ ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return <main dir="rtl" style={{ padding: 24, textAlign: "center" }}>جارٍ التحقق من جلسة الدخول...</main>;
  }

  if (!isFirebaseClientConfigured || !firebaseAuth) {
    return (
      <main dir="rtl" style={{ maxWidth: 520, margin: "48px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
        <h2>تهيئة تسجيل الدخول مطلوبة</h2>
        <p>أضف إعدادات Firebase Web App الموضحة في ملف docs/AI_MODEL_HUB_PHASE_0.md إلى متغيرات بيئة الاستضافة، ثم أعد نشر المعاينة.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main dir="rtl" style={{ maxWidth: 420, margin: "48px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
        <h2 style={{ textAlign: "center" }}>تيتان 1.0</h2>
        <p style={{ textAlign: "center" }}>{authMode === "signin" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب جديد"}</p>
        <form onSubmit={submitAuth} style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="البريد الإلكتروني"
            aria-label="البريد الإلكتروني"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <input
            type="password"
            autoComplete={authMode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة المرور"
            aria-label="كلمة المرور"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
          {authError && <p role="alert" style={{ color: "#b42318" }}>{authError}</p>}
          <button type="submit" disabled={authBusy} style={{ padding: 12, border: 0, borderRadius: 8, background: "#0b93ff", color: "#fff" }}>
            {authBusy ? "يرجى الانتظار..." : authMode === "signin" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); }}
          style={{ width: "100%", marginTop: 12, padding: 10, border: 0, background: "transparent" }}
        >
          {authMode === "signin" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
        </button>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 12,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2>تيتان 1.0</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <small>{user.email}</small>
          <button type="button" onClick={() => void signOut(firebaseAuth)} style={{ padding: "7px 10px" }}>خروج</button>
        </div>
      </header>

      <section
        aria-label="المحادثة"
        style={{ flex: 1, minHeight: 0, border: "1px solid #eee", overflowY: "auto", padding: 10, borderRadius: 12, background: "#fafafa" }}
      >
        {messages.map((message, index) => {
          const imageUrl = getImageUrl(message.content);
          const isUnsupportedVideo = message.content.startsWith("__VIDEO__");
          return (
            <div
              key={index}
              style={{ margin: "8px 0", display: "flex", justifyContent: message.role === "user" ? "flex-start" : "flex-end" }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: 16,
                  background: message.role === "user" ? "#0b93ff" : "#fff",
                  color: message.role === "user" ? "#fff" : "#000",
                  border: "1px solid #eee",
                  textAlign: "right",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="الصورة التي أنشأها تيتان" loading="lazy" style={{ display: "block", width: "100%", borderRadius: 12 }} />
                ) : isUnsupportedVideo ? (
                  "توليد الفيديو غير متاح حالياً؛ لم يتم ربط مزود فيديو فعلي بعد."
                ) : message.content}
              </div>
            </div>
          );
        })}
        {loading && <p role="status" style={{ fontSize: 12 }}>تيتان يكتب...</p>}
        <div ref={endRef} />
      </section>

      <form
        onSubmit={(event) => { event.preventDefault(); void send(); }}
        style={{ display: "flex", gap: 6, marginTop: 8 }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="اكتب رسالتك..."
          aria-label="رسالتك"
          disabled={loading}
          style={{ flex: 1, minWidth: 0, padding: 11, borderRadius: 22, border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="إرسال"
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: "50%",
            border: "none",
            background: loading || !input.trim() ? "#9bbfe0" : "#0b93ff",
            color: "#fff",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          ↑
        </button>
      </form>
    </main>
  );
}
