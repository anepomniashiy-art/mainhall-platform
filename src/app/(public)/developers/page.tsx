import Link from "next/link";
import { developers } from "@/lib/developers";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs, EditorialShell, EditorialHeader, SelectionContact } from "@/components/Editorial";
import "../../analytics/editorial-sections.css";

export const metadata = pageMetadata(
  "Застройщики Москвы и их проекты в каталоге MAINHALL",
  "PIONEER, MR Group, Hutton, Vesper, Capital Group, STONE и другие девелоперы. Жилые комплексы с описанием расположения и условий покупки.",
  "/developers/",
);

export default function DevelopersPage() {
  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Застройщики", href: "/developers/" }]} />
      <EditorialHeader
        eyebrow="ПРОЕКТЫ ПО ДЕВЕЛОПЕРАМ"
        title="Сравнивайте конкретные дома."
        description="Имя застройщика помогает найти проект. Решение о покупке принимаем по квартире, документам, сроку и полной цене выбранного лота."
      />
      <div className="mh-editorial-directory">
        {developers.map((developer) => (
          <section className="mh-editorial-directory-group" key={developer.name}>
            <h2><Link href={`/developers/${developer.slug}/`}>{developer.name} ↗</Link></h2>
            <ul>
              {developer.projects.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}/`}>{project.name}<span>{project.area}</span></Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <SelectionContact />
    </EditorialShell>
  );
}
