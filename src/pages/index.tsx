import Head from "next/head";
import { readFile } from "node:fs/promises";
import path from "node:path";

const base = "/atelier";
const title = "Mainhall — новостройки Москвы";
const description = "Подберите квартиру в новостройке Москвы. Сравните похожие предложения по цене, планировке и сроку сдачи.";
const heroDirectory = base + "/assets/hero";
const heroImage = heroDirectory + "/city-level-1920.webp";
const heroSrcSet = heroDirectory + "/city-level-960.webp 960w, " + heroImage + " 1920w";
const portraitQuery = "(max-width: 760px) and (orientation: portrait)";
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
        <meta name="theme-color" content="#19232e" />
        <link rel="canonical" href="https://main-hall.ru/" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Mainhall" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://main-hall.ru/" />
        <meta property="og:image" content={"https://main-hall.ru" + heroImage} />
        <link rel="preload" as="image" href={heroDirectory + "/city-level-portrait.webp"} media={portraitQuery} />
        <link rel="preload" as="image" imageSrcSet={heroSrcSet} imageSizes="100vw" media={"not all and " + portraitQuery} />
        <link rel="preload" href={base + "/assets/onest.ttf"} as="font" type="font/ttf" crossOrigin="anonymous" />
        {styles.map(name => <link key={name} rel="stylesheet" href={base + "/" + name + ".css" + (["cinematic", "company"].includes(name) ? "?v=20261123-city" : "")} />)}
      </Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
