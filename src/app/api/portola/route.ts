// src/app/api/portola/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/search";
import agenda from "@/data/agenda.json";

// ---------- Types ----------
type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };

type AgendaItem = {
  name: string;
  start: string | null;
  end: string | null;
  location: string;
  notes?: string;
  date: string; // "2025-10-20"
};

// Cast agenda to a typed array
const AGENDA: AgendaItem[] = agenda as unknown as AgendaItem[];

// ---------- Helpers: deterministic day summary ----------
const DAY_MAP: Record<string, string> = {
  monday: "2025-10-20",
  tuesday: "2025-10-21",
};

function looksLikeDayQuery(q: string): boolean {
  const s = q.toLowerCase();
  return s.includes("monday") || s.includes("tuesday");
}

function pickDayFromQuery(q: string): string | null {
  const s = q.toLowerCase();
  if (s.includes("monday")) return DAY_MAP.monday;
  if (s.includes("tuesday")) return DAY_MAP.tuesday;
  return null;
}

function fmtTime(t?: string | null): string {
  if (!t) return "";
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function summarizeDayStrict(date: string): string | null {
  const items = AGENDA.filter((it) => it.date === date);
  if (!items.length) return null;

  const pretty = new Date(`${date}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const lines = items.map((it) => {
    const time = `${fmtTime(it.start)}${it.end ? `–${fmtTime(it.end)}` : ""}`;
    return `- ${time} • ${it.name} — ${it.location}`;
  });

  return `Schedule for ${pretty}:\n${lines.join("\n")}`;
}

// ---------- LLM system prompt (strict, no rewriting) ----------
const SYSTEM = `You are Portola — an event concierge for the Portola Retreat.
STRICT RULES:
- Answer ONLY using the provided Context verbatim; do not change dates or times.
- If the answer is not present in Context, say: "I’m not sure — please check the Agenda or Map."
- Keep answers to 1–2 sentences (or a short bullet list when summarizing multiple items).
- Do NOT invent people, times, or locations.`;

// ---------- API handler ----------
export async function POST(req: Request) {
  try {
    const { message, history } = (await req.json()) as {
      message?: string;
      history?: ChatMessage[];
    };

    const q = (message ?? "").trim();
    if (!q) {
      return NextResponse.json({
        answer: "Hey there 👋 How can I help you today?",
      });
    }

    // 🔒 Deterministic answer for day queries (no LLM)
    if (looksLikeDayQuery(q)) {
      const day = pickDayFromQuery(q);
      const summary = day ? summarizeDayStrict(day) : null;
      if (summary) {
        return NextResponse.json({ answer: summary });
      }
    }

    // ✅ Create OpenAI client at runtime (Vercel-safe)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      return NextResponse.json(
        { answer: "Server is not configured (missing API key)." },
        { status: 500 }
      );
    }
    const client = new OpenAI({ apiKey });

    // 1) Retrieve relevant context (no strict cutoff)
    const results = await retrieve(q, 6);
    const context = results
      .map((r, i) => `[${i + 1} | ${r.type}] ${r.text}`)
      .join("\n");

    // 2) History (memory)
    const past: ChatMessage[] = Array.isArray(history) ? history : [];

    // 3) Compose messages
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nUser: ${q}\nAssistant:` },
      ...past,
    ];

    // 4) Ask the model (factual)
    const rsp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0, // keep factual to avoid rewriting dates/times
      messages,
    });

    const answer =
      rsp.choices?.[0]?.message?.content?.trim() ||
      "I’m not sure — please check the Agenda or Map.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Portola API error:", err);
    return NextResponse.json(
      { answer: "Oops! Something went wrong — please try again." },
      { status: 500 }
    );
  }
}