import Image from "next/image";

export default function AgendaPage() {
  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "24px 16px 48px",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        Event Agenda
      </h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          Monday, October 20
        </h2>
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            border: "1px solid #eee",
            background: "#fff",
          }}
        >
          <Image
            src="/agenda/monday.png" // <- change if your filename/extension differs
            alt="Monday Agenda"
            width={1600}
            height={2200}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          Tuesday, October 21
        </h2>
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            border: "1px solid #eee",
            background: "#fff",
          }}
        >
          <Image
            src="/agenda/tuesday.png" // <- change if your filename/extension differs
            alt="Tuesday Agenda"
            width={1600}
            height={2200}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      </section>
    </main>
  );
}