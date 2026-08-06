import "../globals.css";
import type { Metadata } from "next";
import { inter, playfair } from "@/lib/fonts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yönetim Paneli | SAFARI CONSULTING",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-ivory">{children}</body>
    </html>
  );
}
