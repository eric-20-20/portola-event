import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  description: "Your concierge for the Portola Retreat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ Header goes here */}
        <header
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 700,
              fontSize: "18px",
              color: "#111",
              textDecoration: "none",
              marginRight: "20px",
            }}
          >
            🪩 Portola
          </Link>

          <nav style={{ display: "inline-flex", gap: 16 }}>
            <Link href="/agenda">Agenda</Link>
            <Link href="/guests">Guests</Link>
            <Link href="/map">Map</Link>
          </nav>
        </header>

        {/* This renders the page content below the header */}
        {children}
      </body>
    </html>
  );
}