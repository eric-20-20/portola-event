import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// Reads src/data/agenda.csv and writes src/data/agenda.json
const csvPath = "src/data/agenda.csv";
const outPath = "src/data/agenda.json";

const csv = readFileSync(csvPath, "utf8");
const rows = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

// Normalize “7:00- 9:30 AM”, “9:50 AM- 10:10 AM”, etc.
function toISO(dateStr, timeStr) {
  // timeStr like "7:30 PM" → "19:30"
  const t = timeStr.trim().replace(/\s+/g, " ").toUpperCase();
  const m = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
  if (!m) return null;
  let [ , hh, mm, ampm ] = m;
  hh = parseInt(hh, 10);
  mm = mm ? parseInt(mm, 10) : 0;
  if (ampm === "PM" && hh !== 12) hh += 12;
  if (ampm === "AM" && hh === 12) hh = 0;
  const h = String(hh).padStart(2, "0");
  const m2 = String(mm).padStart(2, "0");
  // Keep it naive local time (no timezone conversion)
  return `${dateStr}T${h}:${m2}:00`;
}

function parseRange(dateStr, rangeStr) {
  // e.g. "7:00- 9:30 AM" or "9:50 AM- 10:10 AM"
  const norm = rangeStr.replace(/\s+/g, " ").trim().toUpperCase();
  const parts = norm.split("-");
  if (parts.length !== 2) return { start: null, end: null };

  const left = parts[0].trim();        // may be "7:00" or "9:50 AM"
  const right = parts[1].trim();       // usually "9:30 AM" or "10:10 AM"

  // If left has no AM/PM, borrow from right
  const rightAmpm = right.endsWith("AM") || right.endsWith("PM")
    ? right.slice(-2)
    : "";

  const leftFull = /AM|PM$/.test(left) ? left : `${left} ${rightAmpm}`;

  const start = toISO(dateStr, leftFull);
  const end = toISO(dateStr, right);
  return { start, end };
}

const out = rows.map(r => {
  const { Date: date, Name: name, Time: time, Location: location, Notes: notes } = r;
  const { start, end } = parseRange(date, time || "");
  return {
    name: name || "",
    start,
    end,
    location: location || "",
    notes: notes || "",
    date // keep original date for grouping
  };
});

// Optional: sort by date then start time
out.sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return String(a.start).localeCompare(String(b.start));
});

writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} agenda items → ${outPath}`);