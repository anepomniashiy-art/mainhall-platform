import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentSections, ProjectGrid, Questions, SelectionContact } from "@/components/Editorial";
import { editorialProjects } from "@/lib/editorial-projects";
import { projectDossiers } from "@/lib/project-dossiers";
import { projectImages } from "@/lib/project-images";
import { pageMetadata } from "@/lib/seo";
import { districts } from "@/lib/site-content";
import { DistrictHero } from "../DistrictHero";

type DistrictPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return districts.map(district => ({ slug: district.slug }));
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const district = districts.find(item => item.slug === slug);
  return district
    ? pageMetadata(district.title, district.description, `/districts/${slug}/`, projectImages[district.image].src)
    : { title: "Локация не найдена", robots: { index: false } };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const district = districts.find(item => item.slug === slug);
  if (!district) notFound();

  return (
    <article className={`district-page district-detail district-detail--${district.slug}`}>
      <DistrictHero
        breadcrumbs={[
          { name: "Районы Москвы", href: "/districts/" },
          { name: district.name, href: `/districts/${slug}/` },
        ]}
        title={district.title}
        description={district.description}
        image={projectImages[district.image]}
      >
        <a className="district-hero-link" href="#district-projects">Смотреть проекты</a>
      </DistrictHero>
      <div className="district-width district-body">
        <div className="district-reading">
          <aside className="district-reading-aside">
            <nav aria-label="Содержание обзора">
              <p className="district-label">В обзоре</p>
              {district.sections.map((section, index) => (
                <a href={`#section-${index + 1}`} key={section.title}>{section.title}</a>
              ))}
              <a href="#district-projects">Проекты в локации</a>
              <a href="#district-questions">Вопросы о покупке</a>
            </nav>
          </aside>
          <ContentSections sections={district.sections} />
        </div>
        <section className="district-projects" id="district-projects" aria-labelledby="district-projects-title">
          <div className="district-section-head">
            <h2 id="district-projects-title">Проекты в локации</h2>
            <Link href="/installments/">Рассчитать график оплаты ↗</Link>
          </div>
          <ProjectGrid slugs={district.projects} />
          <ul className="district-addresses" aria-label="Адреса проектов">
            {district.projects.map(project => {
              const name = editorialProjects.find(item => item.slug === project)?.name;
              const address = projectDossiers[project]?.address;
              return name && address && (
                <li key={project}><Link href={`/projects/${project}/`}>{name}</Link><span>{address}</span></li>
              );
            })}
          </ul>
          <p className="district-note">Данные проверены 20 октября 2026 года. Цены и наличие уточняем на дату запроса.</p>
        </section>
        <div id="district-questions" className="district-questions">
          <Questions items={district.questions} />
        </div>
        <SelectionContact context={`подбор в локации ${district.name}`} />
        <Link className="district-back-link" href="/districts/">← Все районы Москвы</Link>
      </div>
    </article>
  );
}
