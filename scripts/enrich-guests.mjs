// scripts/enrich-guests.mjs
import fs from "fs/promises";

const GUESTS_SRC = "src/data/guests.json";
const OUT = "src/data/guests.enriched.json";

function normGuest(g) {
  return {
    name: g.name ?? g.Name ?? "",
    title: g.title ?? g.Title ?? "",
    company: g.company ?? g.Company ?? "",
    photo: g.photo ?? g.Photo ?? null,
    wikipedia: g.wikipedia ?? g.Wikipedia ?? null,
  };
}

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
  const baseGuests = raw.map(normGuest);

  const out = [];
  for (const g of baseGuests) {
    const q = g.wikipedia || g.name || `${g.name} ${g.company}`.trim();
    let wiki = null;
    if (q) {
      const t1 = await wikiSearchTitle(q);
      const t2 = t1 || (g.company ? await wikiSearchTitle(`${g.name} ${g.company}`) : null);
      if (t2) wiki = await wikiSummary(t2);
      await sleep(200);
    }

    out.push({
      name: g.name,
      title: g.title,
      company: g.company,
      photo: g.photo,
      wiki: wiki
        ? { title: wiki.title, summary: wiki.extract, description: wiki.description, image: wiki.image, url: wiki.url }
        : null,
    });
  }

  await fs.writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`Enriched ${out.length} guests -> ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });