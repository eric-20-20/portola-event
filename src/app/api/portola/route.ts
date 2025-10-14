// src/app/api/portola/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/search";

type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };

const SYSTEM = `You are Portola — an event concierge for the Portola Retreat.
STRICT POLICY:
- Answer ONLY using the Context provided.
- If the answer is not clearly in Context, say: "I’m not sure — please check the Agenda or Map"
- Be concise (1–2 sentences). Include exact times/locations when present.
- Do NOT invent people, times, or locations.
- Make sure to double check before you give an answer.`;

function buildContext(chunks: { type: string; text: string }[]) {
  return chunks.map((c, i) => `[${i + 1} | ${c.type}] ${c.text}`).join("\n");
}

export async function POST(req: Request) {
  try {
    const { message, history } = (await req.json()) as {
      message?: string;
      history?: ChatMessage[];
    };
    const q = (message ?? "").trim();
    if (!q) return NextResponse.json({ answer: "Hi! Ask me about times, locations, or guests.", sources: [] });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ answer: "Server is missing OPENAI_API_KEY." }, { status: 500 });
    const client = new OpenAI({ apiKey });

    // Retrieve & apply a similarity threshold
    const top = await retrieve(q, 6); // each item now includes .score
    const MIN_SCORE = 0.75; // tweak 0.70–0.80 based on your data
    const strong = top.filter(t => (t as any).score >= MIN_SCORE);
    const used = strong.length > 0 ? strong : top.slice(0, 2); // always give model something

    const context = buildContext(used.map(t => ({ type: t.type, text: t.text })));

    const past: ChatMessage[] = Array.isArray(history) ? history : [];
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nUser: ${q}\nAssistant:` },
      ...past,
    ];

    // If context is weak, short-circuit without calling the model
    if (strong.length === 0) {
      return NextResponse.json({
        answer: "I’m not sure — please check the Agenda, Map, or Info Desk.",
        sources: used.map(u => ({ id: u.id, type: u.type })),
      });
    }

    const rsp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages,
    });

    const answer = rsp.choices?.[0]?.message?.content?.trim()
      || "I’m not sure — please check the Agenda, Map, or Info Desk.";

    return NextResponse.json({
      answer,
      sources: used.map(u => ({ id: u.id, type: u.type })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ answer: "Sorry, something went wrong." }, { status: 500 });
  }
}