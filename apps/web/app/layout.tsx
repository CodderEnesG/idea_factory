import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Figtree } from "next/font/google";

// Satoshi (display) + Figtree (UI) design referansı. Satoshi Google'da yok →
// Space Grotesk offline-güvenli stand-in; Figtree birebir Google'da.
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "IdeaFact — Tez-odaklı Pazar İstihbaratı",
  description: "Sinyal içeri → tezine göre sıralı, gerekçeli, sorgulanabilir fırsatlar dışarı.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
