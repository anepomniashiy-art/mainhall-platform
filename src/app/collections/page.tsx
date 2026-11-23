import Link from "next/link";
import { collections } from "@/lib/site-content";
import { projectImages } from "@/lib/project-images";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs, EditorialShell, EditorialHeader, SelectionContact } from "@/components/Editorial";
import "../analytics/editorial-sections.css";

export const metadata = pageMetadata(
  "Подборки новостроек Москвы: у воды, клубные дома, высотные проекты",
  "Проекты Москвы по сценарию жизни: набережные, камерный формат и видовые квартиры в высотных комплексах.",
  "/collections/",
);

export default function CollectionsPage() {
  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Подборки", href: "/collections/" }]} />
      <EditorialHeader
        eyebrow="ВАШ СЦЕНАРИЙ ЖИЗНИ"
        title="Выберите, что вам ближе."
        description="Набережная, клубный дом или высокая панорама. Собрали проекты по характеристикам, которые можно сравнить при выборе квартиры."
      />
      <div className="mh-story-grid mh-collection-grid">
        {collections.map((collection) => {
          const cover = projectImages[collection.image];
          return (
            <Link href={`/collections/${collection.slug}/`} className="mh-story-card" key={collection.slug}>
              <span className="mh-story-card-media">
                <img src={cover.src} alt={cover.caption} width="1000" height="650" />
              </span>
              <div className="mh-story-card-copy">
                <h2>{collection.name}</h2>
                <p className="mh-story-card-summary">{collection.description}</p>
                <span className="mh-text-link">Смотреть подборку ↗</span>
              </div>
            </Link>
          );
        })}
      </div>
      <SelectionContact />
    </EditorialShell>
  );
}
