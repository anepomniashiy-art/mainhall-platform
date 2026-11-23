import Link from "next/link";
import { Breadcrumbs, EditorialShell, EditorialHeader, JsonLd } from "@/components/Editorial";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import "../analytics/editorial-sections.css";

export const metadata = pageMetadata(
  "Как Mainhall изучает жилые комплексы",
  "Критерии проверки жилых комплексов Москвы: цена, район, спрос, сроки сдачи и экономика аренды.",
  "/investment-rating/",
);

const factors = [
  ["Цена покупки", "Сравниваем сопоставимые квартиры с учётом местоположения, площади, отделки, готовности дома и условий оплаты."],
  ["Район и инфраструктура", "Проверяем реальные пешие маршруты от дома, доступность транспорта, повседневных услуг и парков. Для будущих объектов фиксируем стадию, источник и срок."],
  ["Спрос и ликвидность", "Сопоставляем доступный остаток с зарегистрированными ДДУ за шесть месяцев. Проверяем даты срезов, период продаж и объём опта."],
  ["Сроки сдачи и передачи ключей", "Сверяем документы по корпусу и историю завершённых объектов девелопера. Учитываем дату ввода и дату передачи отдельно."],
  ["Экономика аренды", "Собираем аналоги аренды и проверяем полную цену покупки, расходы на ремонт и содержание, простой и чистый доход."],
];

export default function RatingPage() {
  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Жилые комплексы", href: "/projects/" }, { name: "Критерии проверки", href: "/investment-rating/" }]} />
      <EditorialHeader
        eyebrow="МЕТОДИКА MAINHALL"
        title="Как мы изучаем жилые комплексы"
        description="Инвестиционный рейтинг готовится. Оценку и рекомендацию опубликуем после проверки всех критериев по конкретному жилому комплексу."
      />
      <section className="mh-editorial-method" aria-labelledby="rating-criteria">
        <h2 id="rating-criteria">Пять критериев проверки</h2>
        <dl>
          {factors.map(([title, text]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="mh-dossier-section">
        <h2>Выбор квартиры</h2>
        <p>В каталоге уже можно сравнить расположение, характеристики домов и доступные предложения.</p>
        <Link className="mh-text-link" href="/projects/">Жилые комплексы ↗</Link>
      </section>
      <JsonLd data={{ "@type": "WebPage", name: "Как Mainhall изучает жилые комплексы", url: SITE_URL + "/investment-rating/" }} />
    </EditorialShell>
  );
}
