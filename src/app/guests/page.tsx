"use client";
import guests from "@/data/guests.json";
import { useMemo, useState } from "react";

type Guest = {
  name: string;
  company: string;
  title: string;
  bio?: string;
  headshot_url?: string;
};

export default function GuestsPage() {
  const [q, setQ] = useState("");
  const list = guests as Guest[];

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return list;
    return list.filter(g =>
      `${g.name} ${g.company} ${g.title}`.toLowerCase().includes(s)
    );
  }, [q, list]);

  return (
    <div>
      <h1>Guests</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, company, or title"
        style={{
          width: "100%",
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((g, i) => (
          <div
            key={i}
            style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {g.headshot_url ? (
                <img
                  src={g.headshot_url}
                  alt={g.name}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#f2f2f2",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                  }}
                >
                  {g.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}

              <div>
                <div style={{ fontWeight: 700 }}>{g.name}</div>
                <div>{g.title}</div>
                <div style={{ color: "#666" }}>{g.company}</div>
              </div>
            </div>

            {g.bio && <p style={{ marginTop: 8 }}>{g.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}