// scripts/csv-to-guests.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const csvPath = "src/data/guests.csv";
const outPath = "src/data/guests.json";

const csv = readFileSync(csvPath, "utf8");
const records = parse(csv, {
  columns: true,          // use header row
  skip_empty_lines: true,
  trim: true
});

// Map CSV columns -> app schema
const guests = records.map(r => ({
  name: r.Name || "",
  company: r.Company || "",
  title: r.Title || "",
  bio: "",
  headshot_url: ""
}));

writeFileSync(outPath, JSON.stringify(guests, null, 2));
console.log(`Wrote ${guests.length} guests → ${outPath}`);