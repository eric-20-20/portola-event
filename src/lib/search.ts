// src/lib/search.ts
import indexJson from "@/data/search-index.json";

export type Item = {
  id: string;
  type: "faq" | "agenda" | "guest";
  text: string;
  meta?: Record<string, unknown>;
  embedding: number[];
};

export type SearchIndex = { createdAt: string; index: Item[] };
const data = indexJson as SearchIndex;
const V: Item[] = data.index;

// cosine similarity helpers
function dot(a: number[], b: number[]) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
function norm(a: number[]) { return Math.sqrt(dot(a, a)); }
function cosine(a: number[], b: number[]) { return dot(a, b) / (norm(a) * norm(b)); }

export async function embedQuery(q: string): Promise<number[]> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.embeddings.create({ model: "text-embedding-3-small", input: q });
  return res.data[0].embedding;
}

// What retrieve() returns (now fully typed, includes score)
export type RetrievedItem = Item & { score: number };

export async function retrieve(q: string, k = 8): Promise<RetrievedItem[]> {
  const qvec = await embedQuery(q);
  return V
    .map<RetrievedItem>((it) => ({ ...it, score: cosine(qvec, it.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}