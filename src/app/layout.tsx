import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portola Event",
  description: "Event information and chat assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Navigation bar */}
        <header
  style={{
    padding: "12px 20px",
    borderBottom: "1px solid #eee",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <a
    href="/"
    style={{
      fontWeight: 700,
      fontSize: "18px",
      color: "#111",
      textDecoration: "none",
    }}
  >
    🪩 Portola
  </a>

  <nav style={{ display: "flex", gap: 16 }}>
    <a href="/agenda">Agenda</a>
    <a href="/guests">Guests</a>
    <a href="/map">Map</a>
  </nav>
</header>

        {/* Main content */}
        <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}