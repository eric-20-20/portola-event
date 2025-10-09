import agenda from "@/data/agenda.json";
import faq from "@/data/faq.json";
import guests from "@/data/guests.json";

type Result = { answer: string; source: "faq" | "agenda" | "guest" | "fallback" };

function scoreOverlap(a: string, b: string) {
  const A = a.toLowerCase().split(/\W+/).filter(Boolean);
  const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  return A.reduce((s, w) => s + (B.has(w) ? 1 : 0), 0);
}

function fmtTime(t: string) {
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function answerFromData(query: string): Result {
  const q = query.trim();
  if (!q) return { answer: "Hi! Ask me about agenda times, locations, or guests.", source: "fallback" };

  // 1) FAQ – fuzzy match
  const f = (faq as { q: string; a: string }[])
    .map(x => ({ ...x, score: scoreOverlap(q, x.q) }))
    .sort((a, b) => b.score - a.score)[0];
  if (f && f.score > 0) return { answer: f.a, source: "faq" };

  // 2) Agenda – keyword / name / location
  const K = ["dinner", "reception", "registration", "breakfast", "lunch", "keynote", "closing"];
  const ag = (agenda as { name: string; start: string; end: string; location: string }[])
    .find(it =>
      K.some(k => q.toLowerCase().includes(k)) ||
      `${it.name} ${it.location}`.toLowerCase().includes(q.toLowerCase())
    );
  if (ag) return { answer: `${ag.name}: ${fmtTime(ag.start)}–${fmtTime(ag.end)} at ${ag.location}.`, source: "agenda" };

  // 3) Guest – exact or contains
  const g = (guests as { name: string; company: string; title: string; bio?: string }[])
    .find(x => x.name.toLowerCase() === q.toLowerCase() || q.toLowerCase().includes(x.name.toLowerCase()));
  if (g) return { answer: `${g.name} — ${g.title} at ${g.company}. ${g.bio ?? ""}`.trim(), source: "guest" };

  // 4) Fallback
  return { answer: "I’m not fully sure. Please check the info desk or see the Agenda page.", source: "fallback" };
}