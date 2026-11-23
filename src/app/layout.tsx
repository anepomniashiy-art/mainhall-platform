import type { Metadata } from "next";
import "./globals.css";
import "./luxury.css";
import "./editorial.css";
import "./mainhall.css";
import {JsonLd} from "@/components/Editorial";
import {SITE_URL} from "@/lib/seo";
import {COMPANY} from "@/lib/constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Mainhall — Инвестиции в премиальную недвижимость Москвы",
    template: "%s | Mainhall",
  },
  description:
    "Недвижимость Москвы с инвестиционной логикой. Проекты, разборы районов, рассрочки и персональный подбор Mainhall.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "Mainhall",
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
      <body data-mainhall-design="20261123" className="mainhall-site min-h-screen flex flex-col font-sans antialiased">
        <JsonLd data={{"@type":"RealEstateAgent","@id":SITE_URL+"/#organization",name:"Mainhall",url:SITE_URL,telephone:COMPANY.phone,areaServed:{"@type":"City",name:"Москва"},sameAs:[COMPANY.telegram]}}/>
        <a className="mh-skip" href="#main-content">Перейти к содержанию</a>
        <Header />
        <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
