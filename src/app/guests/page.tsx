import guestsRaw from "@/data/guests.json"; // use plain guests.json for now (no bios)

type Row = Record<string, string | null | undefined>;

function norm(row: Row) {
  // Try many possible column names and combine first+last when present
  const first =
    row["first"] ?? row["First"] ?? row["first_name"] ?? row["First Name"] ?? "";
  const last =
    row["last"] ?? row["Last"] ?? row["last_name"] ?? row["Last Name"] ?? "";
  const fallbackName =
    [String(first || "").trim(), String(last || "").trim()].filter(Boolean).join(" ") ||
    String(row["name"] ?? row["Name"] ?? "").trim();

  const title = String(row["title"] ?? row["Title"] ?? "").trim();
  const company = String(row["company"] ?? row["Company"] ?? "").trim();

  return { name: fallbackName, title, company };
}

export default function GuestsPage() {
  const guests = (guestsRaw as Row[]).map(norm).filter(g => g.name);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 48px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Guests</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {guests.map((g, i) => (
          <div
            key={`${g.name}-${g.company}-${i}`}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 14,
              background: "#fff",
              boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minHeight: 96,
              justifyContent: "center",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>{g.name}</div>
            <div style={{ color: "#555" }}>
              {[g.title, g.company].filter(Boolean).join(" · ")}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}