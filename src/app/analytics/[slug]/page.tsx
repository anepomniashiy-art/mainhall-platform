import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, articleDate } from "@/lib/articles";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { projectImages } from "@/lib/project-images";
import {
  Breadcrumbs,
  EditorialShell,
  EditorialHeader,
  EditorialImage,
  ContentSections,
  ProjectGrid,
  SelectionContact,
  JsonLd,
} from "@/components/Editorial";
import "../editorial-sections.css";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return { title: "Материал не найден", robots: { index: false } };
  const { title, description } = article;
  const url = `/analytics/${slug}/`;
  const image = projectImages[article.image].src;
  return {
    ...pageMetadata(title, description, url, image),
    openGraph: { type: "article", title, description, url, images: [image] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Аналитика", href: "/analytics/" }, { name: article.title, href: `/analytics/${slug}/` }]} />
      <EditorialHeader eyebrow={article.category} title={article.title} description={article.description} />
      <p className="mh-story-byline">
        <span>{article.author}</span>
        <time dateTime={article.publishedAt}>{articleDate(article.publishedAt!)}</time>
      </p>
      <EditorialImage slug={article.image} />
      <div className="mh-content-layout mh-editorial-reading">
        <ContentSections sections={article.sections} />
        <nav className="mh-reading-aside" aria-label="В материале">
          <p className="mh-eyebrow">В материале</p>
          {article.sections.map((section, index) => (
            <a key={section.title} href={`#section-${index + 1}`}>{section.title}</a>
          ))}
          <Link href="/installments/">Калькулятор рассрочки ↗</Link>
          <Link href="/projects/">Каталог проектов ↗</Link>
        </nav>
      </div>
      <section className="mh-related">
        <h2>Проекты для сравнения</h2>
        {article.links && (
          <nav className="mh-inline-links">
            {article.links.map((link) => <Link href={link.url} key={link.url}>{link.name} ↗</Link>)}
          </nav>
        )}
        <ProjectGrid slugs={article.related} />
      </section>
      <SelectionContact context={article.title} />
      <Link href="/analytics/" className="mh-text-link">Другие материалы ↗</Link>
      <JsonLd data={{
        "@type": "Article",
        headline: article.title,
        description: article.description,
        image: SITE_URL + projectImages[article.image].src,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        author: { "@type": "Organization", name: article.author, url: SITE_URL + "/about/" },
        publisher: { "@id": SITE_URL + "/#organization" },
        mainEntityOfPage: SITE_URL + `/analytics/${slug}/`,
      }} />
    </EditorialShell>
  );
}
