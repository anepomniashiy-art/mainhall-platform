import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "MAINHALL — Инвестиции в премиальную недвижимость Москвы",
    template: "%s | MAINHALL",
  },
  description:
    "Премиальная жилая недвижимость Москвы от 600 000 ₽/м². Каталог проектов, аналитика цен, инвестиционные стратегии.",
  metadataBase: new URL("https://main-hall.ru"),
  openGraph: {
    siteName: "MAINHALL",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
