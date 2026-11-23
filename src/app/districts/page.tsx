import Link from "next/link";
import { SelectionContact } from "@/components/Editorial";
import { projectImages } from "@/lib/project-images";
import { pageMetadata } from "@/lib/seo";
import { districts } from "@/lib/site-content";
import { DistrictHero } from "./DistrictHero";

const heroPath = "/atelier/assets/hero/city-river";

export const metadata = pageMetadata(
  "Районы и локации Москвы: новостройки и обзоры",
  "Сравните Павелецкую, Даниловский, Южный порт, Кутузовский и исторический центр. Жилые проекты и критерии покупки в каждой локации.",
  "/districts/",
  heroPath + "-1920.webp",
);

export default function DistrictsPage() {
  return (
    <article className="district-page district-index">
      <DistrictHero
        breadcrumbs={[{ name: "Районы Москвы", href: "/districts/" }]}
        title="Районы Москвы"
        description="Сравните новостройки, окружение и маршруты. В каждом обзоре — проекты и вопросы, которые стоит проверить перед покупкой."
        image={{
          src: heroPath + "-1920.webp",
          srcSet: heroPath + "-960.webp 960w, " + heroPath + "-1920.webp 1920w",
          caption: "Панорама Москвы-реки",
        }}
      >
        <a className="district-hero-link" href="#district-directory">Смотреть районы</a>
      </DistrictHero>
      <div className="district-width district-body">
        <nav id="district-directory" className="district-directory" aria-label="Обзоры районов">
          {districts.map(district => {
            const image = projectImages[district.image];
            const count = district.projects.length;
            return (
              <Link
                href={`/districts/${district.slug}/`}
                className="district-card"
                key={district.slug}
              >
                <div className="district-card-media">
                  <img src={image.src} alt="" width="1200" height="750" loading="lazy" decoding="async" />
                </div>
                <div className="district-card-copy">
                  <p className="district-card-count">{count === 1 ? "1 проект" : `${count} проекта`}</p>
                  <h2>{district.name}</h2>
                  <p>{district.description}</p>
                  <span className="district-card-arrow" aria-hidden="true">↗</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <SelectionContact context="выбор района Москвы" />
      </div>
    </article>
  );
}
