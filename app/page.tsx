"use client";

import { useEffect, useRef, useState } from "react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatApiResponse = {
  reply?: unknown;
  error?: unknown;
};

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setInput("");
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("وصل رد غير مفهوم من الخادم. حاول مرة أخرى.");
      }

      const data: ChatApiResponse = isRecord(payload)
        ? (payload as ChatApiResponse)
        : {};

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

  return (
    <main
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
      <h2 style={{ textAlign: "center" }}>تيتان 1.0</h2>

      <section
        aria-label="المحادثة"
        style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid #eee",
          overflowY: "auto",
          padding: 10,
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        {messages.map((message, index) => {
          const imageUrl = getImageUrl(message.content);
          const isUnsupportedVideo = message.content.startsWith("__VIDEO__");

          return (
            <div
              key={index}
              style={{
                margin: "8px 0",
                display: "flex",
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
              }}
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
                  <img
                    src={imageUrl}
                    alt="الصورة التي أنشأها تيتان"
                    loading="lazy"
                    style={{ display: "block", width: "100%", borderRadius: 12 }}
                  />
                ) : isUnsupportedVideo ? (
                  "توليد الفيديو غير متاح حالياً؛ لم يتم ربط مزود فيديو فعلي بعد."
                ) : (
                  message.content
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <p role="status" style={{ fontSize: 12, textAlign: "right" }}>
            تيتان يكتب...
          </p>
        )}
        <div ref={endRef} />
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        style={{ display: "flex", gap: 6, marginTop: 8 }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="اكتب رسالتك..."
          aria-label="رسالتك"
          disabled={loading}
          style={{
            flex: 1,
            minWidth: 0,
            padding: 11,
            borderRadius: 22,
            border: "1px solid #ccc",
          }}
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
