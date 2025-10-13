"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I’m Portola 👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/portola", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, history: newMessages }),
    });

    const data = await res.json();

    // typing delay effect
    await new Promise((r) => setTimeout(r, 600));

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.answer || "Hmm, not sure about that." },
    ]);
    setLoading(false);
  }

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, loading]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 60px)",
        maxWidth: "700px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#fafafa",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #eee",
          marginBottom: "16px",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                background: m.role === "user" ? "#4A6CF7" : "#E5E7EB",
                color: m.role === "user" ? "#fff" : "#000",
                padding: "10px 14px",
                borderRadius: "16px",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                transition: "all 0.3s ease",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              textAlign: "left",
              fontStyle: "italic",
              color: "#666",
              padding: "8px",
            }}
          >
            Portola is typing...
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Ask about events, times, or guests..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "10px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0 18px",
            borderRadius: "10px",
            background: "#4A6CF7",
            color: "white",
            border: "none",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </main>
  );
}