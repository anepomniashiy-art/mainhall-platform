import Link from "next/link";
import { articles, articleDate } from "@/lib/articles";
import { projectImages } from "@/lib/project-images";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs, EditorialShell, EditorialHeader, SelectionContact } from "@/components/Editorial";
import "./editorial-sections.css";

export const metadata = pageMetadata(
  "Аналитика недвижимости Москвы и разборы покупки",
  "Материалы MAINHALL о выборе новостройки, рассрочках и квартире для аренды. Архив сравнений условий оплаты с датой исходных данных.",
  "/analytics/",
);

export default function AnalyticsPage() {
  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Аналитика", href: "/analytics/" }]} />
      <EditorialHeader
        eyebrow="РЕДАКЦИЯ MAINHALL"
        title="Аргументы перед покупкой."
        description="Разбираем вопросы, с которыми сталкивается покупатель: как сравнить квартиры, проверить график платежей и посчитать вложения до аренды."
      />
      <div className="mh-story-grid">
        {articles.map((article, index) => {
          const cover = projectImages[article.image];
          return (
            <Link
              href={`/analytics/${article.slug}/`}
              className={`mh-story-card${index === 0 ? " mh-story-feature" : ""}`}
              key={article.slug}
            >
              <span className="mh-story-card-media">
                <img src={cover.src} alt={cover.caption} width="1000" height="650" loading={index === 0 ? "eager" : "lazy"} />
              </span>
              <div className="mh-story-card-copy">
                <p className="mh-story-category">{article.category}</p>
                <h2>{article.title}</h2>
                <p className="mh-story-card-summary">{article.description}</p>
                <p className="mh-story-credit">{article.author} · <time dateTime={article.publishedAt}>{articleDate(article.publishedAt!)}</time></p>
                <span className="mh-text-link">Читать разбор ↗</span>
              </div>
            </Link>
          );
        })}
      </div>
      <SelectionContact />
    </EditorialShell>
  );
}
