import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { developers } from "@/lib/developers";
import { districts } from "@/lib/site-content";
import { sminexCommercialPortfolio } from "@/lib/sminex-projects";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  Breadcrumbs,
  EditorialShell,
  EditorialHeader,
  ProjectGrid,
  SelectionContact,
  JsonLd,
} from "@/components/Editorial";
import "../../analytics/editorial-sections.css";

export function generateStaticParams() {
  return developers.map((developer) => ({ slug: developer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const developer = developers.find((item) => item.slug === slug);
  return developer
    ? pageMetadata(
        developer.name + ": жилые комплексы и квартиры",
        developer.name + ": " + developer.projects.length + " проектов в каталоге MAINHALL. Расположение, архитектура, планировки, статусы домов и критерии сравнения условий покупки.",
        `/developers/${slug}/`,
      )
    : { title: "Застройщик не найден", robots: { index: false } };
}

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const developer = developers.find((item) => item.slug === slug);
  if (!developer) notFound();

  const areas = districts.filter((area) => area.projects.some(
    (projectSlug) => developer.projects.some((project) => project.slug === projectSlug),
  ));

  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Застройщики", href: "/developers/" }, { name: developer.name, href: `/developers/${slug}/` }]} />
      <EditorialHeader
        eyebrow="ЗАСТРОЙЩИКИ"
        title={developer.name + ": дома для разных задач."}
        description={"Сравните проекты " + developer.name + " по локации, масштабу дома, планировкам и условиям покупки. Отдельная карточка каждого комплекса помогает перейти от имени девелопера к выбору конкретной квартиры."}
      />
      <section className="mh-dossier-section" aria-labelledby="developer-residential">
        <h2 id="developer-residential">Жилые проекты {developer.name} в каталоге</h2>
        <p className="mh-portfolio-summary">Здесь собраны {developer.projects.length} проектов. Дата проверки и характеристики приведены в карточках. Наличие квартиры подтверждаем отдельно: статус завершённого дома не подтверждает наличие квартиры в продаже.</p>
        <ProjectGrid slugs={developer.projects.map((project) => project.slug)} />
      </section>
      {developer.slug === "sminex" && (
        <section className="mh-dossier-section" aria-labelledby="developer-commercial">
          <h2 id="developer-commercial">Коммерческие проекты портфеля Sminex</h2>
          <p className="mh-portfolio-summary">Ещё 9 объектов официального портфеля приведены отдельно от жилых комплексов. Это перечень проектов, а не подтверждение наличия помещений в продаже.</p>
          <ul className="mh-editorial-directory mh-portfolio-list">
            {sminexCommercialPortfolio.map((project) => (
              <li className="mh-editorial-directory-group" key={project.slug}>
                <h3>{project.name}</h3>
                <p>{project.addressOfficial} · {project.statusOfficial}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mh-content-layout mh-editorial-reading">
        <section className="mh-longread">
          <h2>Как сравнить предложения {developer.name}</h2>
          <h3>Сначала квартира и полная цена</h3>
          <p>Сопоставьте площадь, этаж, ориентацию окон и отделку. Для разных способов оплаты запросите отдельные расчёты: цена при полной оплате может отличаться от суммы платежей по рассрочке.</p>
          <h3>Затем срок и окружение</h3>
          <p>Проверьте адрес корпуса, маршрут до транспорта и готовность инфраструктуры. Для инвестиционной задачи учитывайте конкурирующие квартиры в этом же доме: одинаковое имя застройщика не делает все планировки одинаково ликвидными.</p>
        </section>
        <nav className="mh-reading-aside" aria-label="Материалы для сравнения">
          <Link href="/units/">Квартиры в продаже ↗</Link>
          <Link href="/installments/">Калькулятор рассрочки ↗</Link>
          {areas.map((area) => <Link key={area.slug} href={`/districts/${area.slug}/`}>{area.name} ↗</Link>)}
          <Link href="/analytics/kak-sravnit-novostroyki/">Критерии сравнения новостроек ↗</Link>
        </nav>
      </div>
      <SelectionContact context={"квартиры в проектах " + developer.name} />
      <JsonLd data={{
        "@type": "CollectionPage",
        name: "Проекты " + developer.name,
        url: SITE_URL + `/developers/${slug}/`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: developer.projects.map((project, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: project.name,
            url: SITE_URL + `/projects/${project.slug}/`,
          })),
        },
      }} />
    </EditorialShell>
  );
}
