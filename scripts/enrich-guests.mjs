// scripts/enrich-guests.mjs
import fs from "fs/promises";

const GUESTS_SRC = "src/data/guests.json";           // your existing list
const OUT = "src/data/guests.enriched.json";         // new enriched file

async function wikiSearchTitle(q) {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(q)}&limit=1`;
  const r = await fetch(url, { headers: { "User-Agent": "PortolaBot/1.0" } });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.pages?.[0]?.title || null;
}

async function wikiSummary(title) {
  const url = `https://en.wikipedia.org/w/rest.php/v1/page/summary/${encodeURIComponent(title)}`;
  const r = await fetch(url, { headers: { "User-Agent": "PortolaBot/1.0" } });
  if (!r.ok) return null;
  const d = await r.json();
  return {
    title: d.title,
    description: d.description || "",
    extract: d.extract || "",
    image: d.thumbnail?.url || null,
    url: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(d.title)}`,
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const raw = JSON.parse(await fs.readFile(GUESTS_SRC, "utf8"));
  const out = [];

  for (const g of raw) {
    // Keep what you already have
    const base = { name: g.name, title: g.title, company: g.company };

    // Try exact title for better hits; fall back to name+company
    const q = g.wikipedia || g.name;
    let title = await wikiSearchTitle(q);
    if (!title && g.company) title = await wikiSearchTitle(`${g.name} ${g.company}`);

    let wiki = null;
    if (title) wiki = await wikiSummary(title);

    out.push({
      ...base,
      wiki: wiki ? {
        title: wiki.title,
        summary: wiki.extract,
        description: wiki.description,
        image: wiki.image,
        url: wiki.url,
      } : null,
    });

    await sleep(200); // be polite to Wikipedia
  }

  await fs.writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`Enriched ${out.length} guests -> ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });