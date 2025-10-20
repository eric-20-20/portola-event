// scripts/csv-to-guests.mjs
import fs from "fs";
import { parse } from "csv-parse/sync";

const SRC = "src/data/guests.csv";
const OUT = "src/data/guests.json";

function normHeader(h) {
  return String(h || "")
    .normalize("NFKC")
    .replace(/\uFEFF/g, "") // strip BOM
    .replace(/\s+/g, " ")   // collapse spaces
    .trim()
    .toLowerCase();
}

const csv = fs.readFileSync(SRC, "utf8");
const rows = parse(csv, {
  columns: (header) => header.map(normHeader), // normalize headers
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true,
});

function pick(row, keys) {
  for (const k of keys) {
    if (k in row && row[k] != null) {
      const v = String(row[k]).trim();
      if (v !== "") return v;
    }
  }
  return "";
}

const FIRST_KEYS = ["first", "first name", "firstname", "given name", "given"];
const LAST_KEYS  = ["last", "last name", "lastname", "surname", "family name", "family"];
const NAME_KEYS  = ["name", "full name", "fullname", "display name", "preferred name"];
const TITLE_KEYS = ["title", "job title", "role", "position"];
const CO_KEYS    = ["company", "organization", "org", "affiliation", "employer"];
const PHOTO_KEYS = ["photo", "headshot", "image", "picture"]; // optional

const data = rows.map((r) => {
  // 1) Try explicit name keys
  const first = pick(r, FIRST_KEYS);
  const last  = pick(r, LAST_KEYS);
  const fallbackName = pick(r, NAME_KEYS);

  // 2) If still empty, fall back to the **first column value** whatever its header
  let name = [first, last].filter(Boolean).join(" ") || fallbackName;
  if (!name) {
    const keys = Object.keys(r);
    if (keys.length) {
      const firstColVal = String(r[keys[0]] ?? "").trim();
      if (firstColVal) name = firstColVal;
    }
  }

  const title   = pick(r, TITLE_KEYS);
  const company = pick(r, CO_KEYS);
  const photo   = pick(r, PHOTO_KEYS);

  const obj = { name, title, company };
  if (photo) obj.photo = photo;
  return obj;
});

// Safety log if any names still empty
const empties = data.filter(g => !g.name).length;
if (empties) {
  console.warn(`Warning: ${empties} rows have empty 'name' even after first-column fallback.`);
  console.warn("First row keys seen by parser:", Object.keys(rows[0]));
}

fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
console.log(`Wrote ${data.length} guests -> ${OUT}`);