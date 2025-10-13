import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });  // <— force absolute path

import fs from "node:fs";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ROOT = path.resolve(process.cwd(), "src", "data");
const OUT = path.join(ROOT, "search-index.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
}

function fmtTime(t) {
  if (!t) return "";
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function makeChunks() {
  const chunks = [];

  // FAQ
  const faq = readJson("faq.json");
  for (const { q, a } of faq) {
    chunks.push({
      id: `faq:${q.slice(0, 60)}`,
      type: "faq",
      text: `FAQ\nQ: ${q}\nA: ${a}`,
      meta: { q }
    });
  }

  // Agenda
  const agenda = readJson("agenda.json");
  for (const it of agenda) {
    const day = it.date || (it.start ? new Date(it.start).toISOString().slice(0,10) : "");
    const line = `Agenda item (${day}): ${it.name}. Time: ${fmtTime(it.start)}${it.end ? "–" + fmtTime(it.end) : ""}. Location: ${it.location}. ${it.notes ? "Notes: " + it.notes : ""}`;
    chunks.push({
      id: `agenda:${day}:${it.name}`.slice(0,120),
      type: "agenda",
      text: line,
      meta: { name: it.name, date: day }
    });
  }

  // Guests
  const guests = readJson("guests.json");
  for (const g of guests) {
    const line = `Guest: ${g.name}. Title: ${g.title}. Company: ${g.company}. ${g.bio ? "Bio: " + g.bio : ""}`;
    chunks.push({
      id: `guest:${g.name}`.slice(0,120),
      type: "guest",
      text: line,
      meta: { name: g.name }
    });
  }

  return chunks;
}

async function embed(texts) {
  // batch-friendly embed
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts
  });
  return res.data.map(d => d.embedding);
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
  }

  const chunks = makeChunks();
  const vecs = [];
  for (const batch of chunkArray(chunks, 100)) {
    const batchEmb = await embed(batch.map(c => c.text));
    vecs.push(...batchEmb);
  }

  const index = chunks.map((c, i) => ({ ...c, embedding: vecs[i] }));
  fs.writeFileSync(OUT, JSON.stringify({ createdAt: new Date().toISOString(), index }, null, 2));
  console.log(`Wrote ${index.length} chunks → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });