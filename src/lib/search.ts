import indexJson from "@/data/search-index.json";

type Item = {
  id: string;
  type: "faq" | "agenda" | "guest";
  text: string;
  meta?: Record<string, any>;
  embedding: number[];
};

type SearchIndex = { createdAt: string; index: Item[] };

const data = indexJson as SearchIndex;
const V = data.index;

// cosine similarity
function dot(a: number[], b: number[]) { let s = 0; for (let i=0; i<a.length; i++) s += a[i]*b[i]; return s; }
function norm(a: number[]) { return Math.sqrt(dot(a,a)); }
function cosine(a: number[], b: number[]) { return dot(a,b)/(norm(a)*norm(b)); }

export async function embedQuery(q: string) {
  // Embed once per query (fast + cheap with 3-small)
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: q
  });
  return res.data[0].embedding;
}

export async function retrieve(q: string, k = 8) {
  const qvec = await embedQuery(q);
  const scored = V.map(it => ({ it, score: cosine(qvec, it.embedding) }))
    .sort((a,b)=> b.score - a.score)
    .slice(0, k);
  return scored.map(s => s.it);
}

export function deterministicFallback(q: string) {
  // Optional: keep your old matcher as a safety net
  return null;
}