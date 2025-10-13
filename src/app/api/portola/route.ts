import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/search";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Portola’s personality & behavior
const SYSTEM = `You are Portola — a warm, confident event concierge for the Portola Retreat.
You answer conversationally and helpfully.
You can reference the event agenda, guests, and FAQ from the provided Context.
If the user asks something unrelated, respond briefly but stay friendly.
Tone: professional yet relaxed, like a 5-star resort host.`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ answer: "Hey there 👋 How can I help you?" });
    }

    // 1️⃣ Retrieve relevant chunks
    const relevant = await retrieve(message, 6);
    const context = relevant
      .map((r, i) => `[${i + 1} | ${r.type}] ${r.text}`)
      .join("\n");

    // 2️⃣ Build conversation history
    const pastMessages = (history || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // 3️⃣ Create the conversation payload
    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nNow continue the chat naturally.` },
      ...pastMessages,
      { role: "user", content: message },
    ];

    // 4️⃣ Get LLM response
    const rsp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    });

    const answer = rsp.choices?.[0]?.message?.content?.trim() ?? "Sorry, I’m not sure.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ answer: "Oops! Something went wrong." }, { status: 500 });
  }
}