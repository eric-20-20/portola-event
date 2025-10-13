import agenda from "@/data/agenda.json";

type Item = {
  name: string;
  start: string | null;
  end: string | null;
  location: string;
  notes?: string;
  date: string; // YYYY-MM-DD
};

function fmtTime(t?: string | null) {
  if (!t) return "";
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function groupByDate(items: Item[]) {
  return items.reduce<Record<string, Item[]>>((acc, it) => {
    (acc[it.date] ||= []).push(it);
    return acc;
  }, {});
}

export default function AgendaPage() {
  const items = agenda as Item[];
  const grouped = groupByDate(items);
  const days = Object.keys(grouped).sort();

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>Agenda</h1>

      {days.map((d, idx) => {
        const pretty = new Date(`${d}T00:00:00`).toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        return (
          <section key={d} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "#4A6CF7", marginBottom: "12px" }}>
              {`Day ${idx + 1}: ${pretty}`}
            </h2>

            <ul style={{ listStyle: "none", padding: 0 }}>
              {grouped[d].map((it, i) => (
                <li
                  key={i}
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "10px 0",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  <div style={{ color: "#555" }}>
                    {fmtTime(it.start)}{it.end ? ` – ${fmtTime(it.end)}` : ""} • {it.location}
                  </div>
                  {it.notes && (
                    <div style={{ color: "#777", marginTop: 4 }}>{it.notes}</div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}