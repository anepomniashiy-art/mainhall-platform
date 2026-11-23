import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { collections } from "@/lib/site-content";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { projectImages } from "@/lib/project-images";
import { editorialProjects } from "@/lib/editorial-projects";
import {
  Breadcrumbs,
  EditorialShell,
  EditorialHeader,
  EditorialImage,
  ProjectGrid,
  SelectionContact,
  JsonLd,
} from "@/components/Editorial";
import "../../analytics/editorial-sections.css";

export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = collections.find((item) => item.slug === slug);
  return collection
    ? pageMetadata(collection.title, collection.description, `/collections/${slug}/`, projectImages[collection.image].src)
    : { title: "Подборка не найдена", robots: { index: false } };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collections.find((item) => item.slug === slug);
  if (!collection) notFound();

  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Подборки", href: "/collections/" }, { name: collection.name, href: `/collections/${slug}/` }]} />
      <EditorialHeader eyebrow="ТЕМАТИЧЕСКАЯ ПОДБОРКА" title={collection.title} description={collection.description} />
      <EditorialImage slug={collection.image} />
      <div className="mh-content-layout mh-editorial-reading">
        <div className="mh-longread">
          <section>
            <h2>Как выбирать в этой подборке</h2>
            <p>{collection.intro}</p>
            <h3>Что проверяем у конкретной квартиры</h3>
            <ul>{collection.checks.map((check) => <li key={check}>{check}</li>)}</ul>
            <p>В карточках проектов есть описание расположения, характеристики дома и вопросы для проверки. Наличие, цену и график оплаты уточняем перед подбором.</p>
          </section>
        </div>
        <nav className="mh-reading-aside" aria-label="Материалы для сравнения">
          <Link href="/analytics/kak-sravnit-novostroyki/">Как сравнить новостройки до бронирования ↗</Link>
          <Link href="/districts/">Сравнить районы ↗</Link>
          <Link href="/installments/">Посчитать рассрочку ↗</Link>
        </nav>
      </div>
      <ProjectGrid slugs={collection.projects} />
      <JsonLd data={{
        "@type": "CollectionPage",
        name: collection.title,
        url: SITE_URL + `/collections/${slug}/`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: collection.projects.map((projectSlug, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: SITE_URL + `/projects/${projectSlug}/`,
            name: editorialProjects.find((project) => project.slug === projectSlug)?.name,
          })),
        },
      }} />
      <SelectionContact context={`подбор: ${collection.name}`} />
    </EditorialShell>
  );
}
