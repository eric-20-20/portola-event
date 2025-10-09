"use client";
import { useState } from "react";

type Res = { answer: string; source: "faq" | "agenda" | "guest" | "fallback" };

export default function ChatPage() {
  const [input, setInput] = useState("Where is dinner tonight?");
  const [answer, setAnswer] = useState<Res | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setAnswer(null);
    const res = await fetch("/api/portola", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    const data = await res.json();
    setAnswer(data);
    setLoading(false);
  }

  return (
    <div>
      <h1>Chat with Portola</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about dinner, registration, or a guest"
          style={{ flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          onClick={ask}
          disabled={loading}
          style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #222", background: "#111", color: "#fff" }}
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>

      {answer && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
          <div style={{ fontWeight: 600 }}>Portola</div>
          <p>{answer.answer}</p>
          <div style={{ fontSize: 12, color: "#666" }}>source: {answer.source}</div>
        </div>
      )}
    </div>
  );
}