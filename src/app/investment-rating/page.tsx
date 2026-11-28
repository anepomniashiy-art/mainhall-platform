import Link from "next/link";
import { Breadcrumbs, EditorialShell, EditorialHeader, JsonLd } from "@/components/Editorial";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { editorialProjects } from "@/lib/editorial-projects";
import { publishedRatings, ratingCounts, ratingMeta, criterionNames, ruDate, type RatingCriterion } from "@/lib/investment-rating";
import "../analytics/editorial-sections.css";

export const metadata = pageMetadata(
  "Инвестиционная оценка жилых комплексов Москвы: рейтинг и методика Mainhall",
  "Оценка жилых комплексов по пяти критериям: цена покупки, район, спрос и ликвидность, сроки сдачи, экономика аренды. Таблица оценок и правила расчёта.",
  "/investment-rating/",
);

const num = (value: number, digits = 1) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const order: RatingCriterion[] = ["liquidity", "price", "timing", "location", "rent"];
const rules: Record<RatingCriterion, string[]> = {
  liquidity: [
    "Считаем квартиры без договора в строящихся корпусах и сравниваем с числом договоров долевого участия с частными покупателями за шесть месяцев. Оптовые сделки в темп не входят.",
    "Остатка хватит на 12 месяцев и меньше: 10 баллов. На 24 месяца: 7. На 36: 5. На 60: 3. На 96 и больше: 1.",
    "Если продажи идут меньше года, темп наполовину сверяем с соседними проектами того же класса. Если меньше шести месяцев, оценку не публикуем. Доля опта от 25% снижает балл на один.",
  ],
  price: [
    "Берём медианную цену квадратного метра по зарегистрированным договорам за шесть месяцев и сравниваем с домами того же класса в радиусе трёх километров: квартиры той же площади и с той же отделкой. Если таких домов меньше трёх, радиус растёт до пяти и восьми километров.",
    "На 15% ниже соседей и больше: 10 баллов. На 10% ниже: 8,5. На уровне соседей: 6. На 10% выше: 4. На 20% выше: 2,5. На 35% выше и больше: 1.",
    "Низкая цена не даёт больше 8 баллов, если остатка хватит дольше чем на четыре года или высока доля опта. Балл снижается за дорогу до метро дольше 20 минут и за отсутствие школ, садов и парка рядом.",
  ],
  timing: [
    "Половина балла: переносился ли заявленный срок ввода строящихся корпусов с начала продаж. Без переноса: 10. Три месяца: 8. Полгода: 6. Год: 3. Полтора года и больше: 1.",
    "Вторая половина: как девелопер сдавал прежние корпуса с 2017 года. Считаем медианный сдвиг срока по той же шкале. По Москве половина корпусов сдана с переносом не больше трёх месяцев.",
    "Если сданных корпусов у девелопера меньше трёх, эта половина получает нейтральные 5 баллов.",
  ],
  location: [
    "Две трети балла: дорога до ближайшей работающей станции метро, МЦК или МЦД. До 5 минут пешком: 10. До 8: 9. До 12: 8. До 15: 7. До 20: 5,5. До 30: 4. Дольше или только на транспорте: 2.",
    "Треть балла: школы и детские сады в радиусе километра, магазины в 800 метрах, поликлиника и парк площадью от гектара в радиусе километра.",
    "Строящиеся станции в балл не входят: считаем только то, чем можно пользоваться сегодня.",
  ],
  rent: [
    "Собираем объявления о долгосрочной аренде в радиусе одного километра: та же комнатность, близкая площадь. Если объявлений меньше пятнадцати, радиус растёт до полутора и двух километров.",
    "Делим годовую аренду на цену покупки. Валовая доходность от 7%: 10 баллов. 6%: 8,5. 5%: 7. 4%: 5. 3%: 3. 2% и меньше: 1.",
    "Рядом показываем доходность после месяца простоя, расходов 5% и налога 13%. В балл она не входит. Затраты на отделку в расчёт не включены.",
  ],
};

export default function RatingPage() {
  const name = (slug: string) => editorialProjects.find(p => p.slug === slug);
  return (
    <EditorialShell>
      <Breadcrumbs items={[{ name: "Жилые комплексы", href: "/projects/" }, { name: "Инвестиционная оценка", href: "/investment-rating/" }]} />
      <EditorialHeader
        eyebrow="МЕТОДИКА MAINHALL"
        title="Инвестиционная оценка жилых комплексов"
        description={`Пять критериев, одна цифра от 1 до 10. Оценку получили ${ratingCounts.published} из ${ratingCounts.total} жилых комплексов каталога: балл выходит, когда собраны все пять критериев. Расчёт на ${ruDate(ratingMeta.asOf)}.`}
      />
      <section className="mh-dossier-section" aria-labelledby="rating-table">
        <h2 id="rating-table">Оценки на {ruDate(ratingMeta.asOf)}</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".92rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #c2c9b9" }}>
                <th style={{ padding: ".6rem .5rem" }}>Жилой комплекс</th>
                <th style={{ padding: ".6rem .5rem" }}>Девелопер</th>
                <th style={{ padding: ".6rem .5rem", textAlign: "right" }}>Оценка</th>
                {order.map(key => <th key={key} style={{ padding: ".6rem .5rem", textAlign: "right", fontWeight: 400 }}>{criterionNames[key]}</th>)}
              </tr>
            </thead>
            <tbody>
              {publishedRatings.map(({ slug, rating }) => {
                const p = name(slug);
                if (!p) return null;
                return (
                  <tr key={slug} style={{ borderBottom: "1px solid #d7ddd5" }}>
                    <td style={{ padding: ".55rem .5rem" }}><Link href={`/projects/${slug}/`}>{p.name}</Link></td>
                    <td style={{ padding: ".55rem .5rem", color: "#606b61" }}>{p.developer}</td>
                    <td style={{ padding: ".55rem .5rem", textAlign: "right", fontWeight: 600 }}>{num(rating.score as number)}</td>
                    {order.map(key => <td key={key} style={{ padding: ".55rem .5rem", textAlign: "right" }}>{num(rating[key]!.score)}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mh-content-caption">Оценка относится к проекту в целом. Квартиру выбираем отдельно: по цене, планировке, виду и условиям оплаты.</p>
      </section>
      <section className="mh-editorial-method" aria-labelledby="rating-criteria">
        <h2 id="rating-criteria">Пять критериев и их вес</h2>
        <dl>
          {order.map(key => (
            <div key={key}>
              <dt>{criterionNames[key]}: {ratingMeta.weights[key]}%</dt>
              <dd>{rules[key].map((text, i) => <p key={i} style={{ margin: i ? ".5rem 0 0" : 0 }}>{text}</p>)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="mh-dossier-section">
        <h2>Как читать оценку</h2>
        <p>Итог складывается из пяти баллов с весами. Больше всего весит ликвидность: от скорости продаж зависит, насколько легко выйти из квартиры к моменту получения ключей. 7 из 10 означает 70 баллов из 100. Это не 7% доходности и не вероятность роста цены.</p>
        <p style={{ marginTop: "1rem" }}>Рядом с оценкой указана уверенность. Высокая: сопоставимых сделок от шестидесяти, объявлений аренды от пятнадцати в радиусе километра, продажи идут дольше года. Низкая: сравнивать пришлось с более далёкими домами или проект продаётся меньше года.</p>
        <p style={{ marginTop: "1rem" }}>Оценку пока не получают проекты, где продажи идут меньше шести месяцев, сданные дома, где застройщик продаёт по договорам купли-продажи, проекты без зарегистрированных договоров за последние месяцы, проекты Новой Москвы и Подмосковья. В их карточках показаны собранные критерии и то, чего не хватает.</p>
      </section>
      <section className="mh-dossier-section">
        <h2>Дата и обновление</h2>
        <p>Расчёт выполнен на {ruDate(ratingMeta.asOf)}. Договоры долевого участия учтены по {ruDate(ratingMeta.dealsThrough)}, темп продаж и цены считаются за период с {ruDate(ratingMeta.dealWindow[0])} по {ruDate(ratingMeta.dealWindow[1])}.{ratingMeta.rentWindow ? ` Объявления аренды собраны с ${ruDate(ratingMeta.rentWindow[0])} по ${ruDate(ratingMeta.rentWindow[1])}.` : ""}</p>
        <p style={{ marginTop: "1rem" }}>Оценку пересчитываем при обновлении сделок. Изменение цены, остатка или сроков меняет балл.</p>
        <p className="mh-content-caption">Сведения о школах, садах, магазинах, поликлиниках, парках и станциях: © участники OpenStreetMap. Оценка не является индивидуальной инвестиционной рекомендацией и не обещает доходность.</p>
        <Link className="mh-text-link" href="/projects/">Жилые комплексы ↗</Link>
      </section>
      <JsonLd data={{ "@type": "WebPage", name: "Инвестиционная оценка жилых комплексов Москвы", url: SITE_URL + "/investment-rating/" }} />
    </EditorialShell>
  );
}
