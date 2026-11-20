import Head from "next/head";
import { readFile } from "node:fs/promises";
import path from "node:path";

const base = "/atelier";
const title = "Mainhall — новостройки Москвы";
const description = "Выберите квартиру в новостройке Москвы и области. Сравните жилые комплексы, планировки и цены квартир.";
const heroImage = base + "/assets/hero/high-life-1200.webp";
const styles = [
  "style", "investment", "expertise", "cinematic", "company", "recommendation",
  "assets/leaflet", "assets/markercluster",
];
const organization = {
  "@context": "https://schema.org", "@type": "RealEstateAgent",
  "@id": "https://main-hall.ru/#organization", name: "Mainhall",
  url: "https://main-hall.ru/", telephone: "+79269179901", areaServed: "Москва",
};

export async function getStaticProps() {
  const markup = await readFile(path.join(process.cwd(), "src/home/home.html"), "utf8");
  return { props: { markup } };
}

export default function Home({ markup }: { markup: string }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="canonical" href="https://main-hall.ru/" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Mainhall" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://main-hall.ru/" />
        <meta property="og:image" content={"https://main-hall.ru" + heroImage} />
        <link rel="preload" href={heroImage} as="image" />
        <link rel="preload" href={base + "/assets/hero/mainhall-editorial.woff"} as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href={base + "/assets/onest.ttf"} as="font" type="font/ttf" crossOrigin="anonymous" />
        {styles.map(name => <link key={name} rel="stylesheet" href={base + "/" + name + ".css" + (name === "cinematic" ? "?v=20261120-high-life" : "")} />)}
      </Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
