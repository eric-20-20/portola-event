import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/search";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🪩 Portola's system prompt
const SYSTEM = `You are Portola — a warm, confident concierge for the Portola Retreat.
You answer conversationally and helpfully.
You have access to the event agenda, guests, and FAQs through the provided Context.
If the question is unclear or unrelated to the event, respond politely but briefly.
Tone: professional yet relaxed — like a 5-star resort host.`;

// 💬 Main chat endpoint
export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ answer: "Hey there 👋 How can I help you today?" });
    }

    // 1️⃣ Retrieve relevant data (no cutoff)
    const results = await retrieve(message, 6);
    const context = results
      .map((r, i) => `[${i + 1} | ${r.type}] ${r.text}`)
      .join("\n");

    // 2️⃣ Format chat history
    const pastMessages = Array.isArray(history)
      ? history
      : [];

    // 3️⃣ Build message sequence for the LLM
    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nNow answer naturally and conversationally.` },
      ...pastMessages,
      { role: "user", content: message },
    ];

    // 4️⃣ Ask OpenAI
    const rsp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    });

    const answer =
      rsp.choices?.[0]?.message?.content?.trim() ??
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