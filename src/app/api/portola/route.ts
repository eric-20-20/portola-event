import { NextResponse } from "next/server";
import { answerFromData } from "@/lib/matchers";

export async function POST(req: Request) {
  const { message } = await req.json();
  const result = answerFromData(String(message || ""));
  return NextResponse.json(result);
}