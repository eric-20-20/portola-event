// src/app/api/portola/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/search";

// Types used for history/messaging
type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };

// Portola’s personality & behavior
const SYSTEM = `You are Portola — a warm, confident event concierge for the Portola Retreat.
Answer conversationally and helpfully. Use the provided Context when relevant.
If you don’t know, say so briefly and point to Agenda/Map/Info Desk.
Tone: professional yet relaxed, like a 5-star resort host.`;

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
    if (!q) {
      return NextResponse.json({ answer: "Hey there 👋 How can I help you?" });
    }

    // ✅ Lazy-create the OpenAI client at runtime (safer for Vercel builds)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY missing in environment");
      return NextResponse.json(
        { answer: "Portola’s brain isn’t configured yet. (Missing API key)" },
        { status: 500 }
      );
    }
    const client = new OpenAI({ apiKey });

    // Retrieve relevant chunks from your index
    const relevant = await retrieve(q, 6);
    const context = buildContext(relevant.map((r) => ({ type: r.type, text: r.text })));

    // History (memory) — validate to our type
    const pastMessages: ChatMessage[] = Array.isArray(history) ? history : [];

    // Build conversation
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nContinue the chat naturally.` },
      ...pastMessages,
      { role: "user", content: q },
    ];

    // Call the model
    const rsp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    });

    const answer = rsp.choices?.[0]?.message?.content?.trim() || "Sorry, I’m not sure.";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ answer: "Oops! Something went wrong." }, { status: 500 });
  }
}