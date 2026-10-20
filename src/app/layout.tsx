import type { Metadata } from "next";
import "./globals.css";
import "./luxury.css";
import "./editorial.css";
import {JsonLd} from "@/components/Editorial";
import {SITE_URL} from "@/lib/seo";
import {COMPANY} from "@/lib/constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "MAINHALL — Инвестиции в премиальную недвижимость Москвы",
    template: "%s | MAINHALL",
  },
  description:
    "Недвижимость Москвы с инвестиционной логикой. Проекты, разборы районов, рассрочки и персональный подбор MAINHALL.",
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
        <JsonLd data={{"@type":"RealEstateAgent","@id":SITE_URL+"/#organization",name:"MAINHALL",url:SITE_URL,telephone:COMPANY.phone,areaServed:{"@type":"City",name:"Москва"},sameAs:[COMPANY.telegram]}}/>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
