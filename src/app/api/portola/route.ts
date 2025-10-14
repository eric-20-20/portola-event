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

const AGENDA: AgendaItem[] = agenda as unknown as AgendaItem[];

// ---------- Helpers (dates & formatting) ----------
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
function isOverviewDayQuery(q: string): boolean {
  // broad “what’s on … / agenda … / schedule …”
  return /(what'?s|whats|what is|agenda|schedule).*(monday|tuesday)/i.test(q);
}
function hasQualifier(q: string): boolean {
  return /(first|last|morning|afternoon|evening|where|when|time|location|dinner|breakfast|lunch|cocktail)/i.test(
    q.toLowerCase(),
  );
}
function itemsForDay(date: string): AgendaItem[] {
  return AGENDA.filter((it) => it.date === date).sort((a, b) =>
    (a.start ?? "").localeCompare(b.start ?? ""),
  );
}
function fmtTime(t?: string | null): string {
  if (!t) return "";
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function fmtItem(it: AgendaItem): string {
  const time = `${fmtTime(it.start)}${it.end ? `–${fmtTime(it.end)}` : ""}`;
  return `${time} • ${it.name} — ${it.location}`;
}
function summarizeDayStrict(date: string): string | null {
  const items = itemsForDay(date);
  if (!items.length) return null;

  const pretty = new Date(`${date}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const lines = items.map(fmtItem).join("\n");
  return `Schedule for ${pretty}:\n${lines}`;
}
function firstItem(date: string) {
  const list = itemsForDay(date);
  return list.length ? list[0] : null;
}
function lastItem(date: string) {
  const list = itemsForDay(date);
  return list.length ? list[list.length - 1] : null;
}
function inPartOfDay(
  date: string,
  part: "morning" | "afternoon" | "evening",
): AgendaItem[] {
  const list = itemsForDay(date);
  const hourOf = (iso?: string | null) => (iso ? new Date(iso).getHours() : -1);
  const within = (h: number) =>
    part === "morning" ? h >= 5 && h < 12 : part === "afternoon" ? h >= 12 && h < 17 : h >= 17 && h <= 23;
  return list.filter((it) => within(hourOf(it.start)));
}
function prettyWeekday(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "long" });
}

// ---------- LLM system prompt (strict) ----------
const SYSTEM = `You are Portola — an event concierge for the Portola Retreat.
STRICT RULES:
- Answer ONLY using the provided Context verbatim; do not change dates or times.
- If the answer is not present in Context, say: "I’m not sure — please check the Agenda or Map."
- Keep answers concise (1–2 sentences) or a short bullet list for multiple items.
- Do NOT invent people, times, or locations.`;

// ---------- API handler ----------
export async function POST(req: Request) {
  try {
    const { message, history } = (await req.json()) as {
      message?: string;
      history?: ChatMessage[];
    };

    const q = (message ?? "").trim();
    if (!q) return NextResponse.json({ answer: "Hey there 👋 How can I help you today?" });

    // --- Day queries: safe, smart handling ---
    if (looksLikeDayQuery(q)) {
      const day = pickDayFromQuery(q);
      if (day) {
        // 1) Overview (e.g., “what’s on Monday”) => deterministic summary
        if (isOverviewDayQuery(q) && !hasQualifier(q)) {
          const summary = summarizeDayStrict(day);
          if (summary) return NextResponse.json({ answer: summary });
        }

        // 2) Deterministic specifics
        const lower = q.toLowerCase();
        if (/\bfirst\b/.test(lower)) {
          const it = firstItem(day);
          if (it) return NextResponse.json({ answer: `First on ${prettyWeekday(day)}: ${fmtItem(it)}` });
        }
        if (/\blast\b/.test(lower)) {
          const it = lastItem(day);
          if (it) return NextResponse.json({ answer: `Last on ${prettyWeekday(day)}: ${fmtItem(it)}` });
        }
        if (/\bmorning\b/.test(lower) || /\bafternoon\b/.test(lower) || /\bevening\b/.test(lower)) {
          const part = /\bmorning\b/.test(lower)
            ? "morning"
            : /\bafternoon\b/.test(lower)
            ? "afternoon"
            : "evening";
          const list = inPartOfDay(day, part);
          if (list.length) {
            return NextResponse.json({
              answer:
                `${part[0].toUpperCase() + part.slice(1)} on ${prettyWeekday(day)}:\n` +
                list.map(fmtItem).join("\n"),
            });
          }
        }

        // 3) Other specific Monday/Tuesday questions:
        //    use LLM but restrict context to that day’s items only
        const dayContext = itemsForDay(day).map(fmtItem).join("\n");

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          console.error("Missing OPENAI_API_KEY");
          return NextResponse.json(
            { answer: "Server is not configured (missing API key)." },
            { status: 500 },
          );
        }
        const client = new OpenAI({ apiKey });

        const messages: ChatMessage[] = [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Context (items for ${prettyWeekday(day)}):\n${dayContext}\n\nUser: ${q}\nAssistant:`,
          },
        ];
        const rsp = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          messages,
        });
        const answer =
          rsp.choices?.[0]?.message?.content?.trim() ||
          "I’m not sure — please check the Agenda or Map.";
        return NextResponse.json({ answer });
      }
    }

    // --- General questions: normal RAG with strict prompt ---
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      return NextResponse.json({ answer: "Server is not configured (missing API key)." }, { status: 500 });
    }
    const client = new OpenAI({ apiKey });

    const results = await retrieve(q, 6); // no hard cutoff
    const context = results.map((r, i) => `[${i + 1} | ${r.type}] ${r.text}`).join("\n");
    const past: ChatMessage[] = Array.isArray(history) ? history : [];

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nUser: ${q}\nAssistant:` },
      ...past,
    ];

    const rsp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0, // factual
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
      { status: 500 },
    );
  }
}