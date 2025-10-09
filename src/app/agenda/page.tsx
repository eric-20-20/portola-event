import agenda from "@/data/agenda.json";

function fmt(t: string) {
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AgendaPage() {
  return (
    <div>
      <h1>Agenda</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {(agenda as { name:string; start:string; end:string; location:string }[]).map((it, i) => (
          <li key={i} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ fontWeight: 600 }}>{it.name}</div>
            <div>{fmt(it.start)} – {fmt(it.end)} • {it.location}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}