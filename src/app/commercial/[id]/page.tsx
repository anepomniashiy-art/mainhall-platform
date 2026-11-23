import { editorialProjects } from '@/lib/editorial-projects';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs, EditorialHeader, EditorialShell, JsonLd, SelectionContact } from '@/components/Editorial';
import { commercialUnits, sminexFeed, feedDate, unitFeatures, commercialTitle, rub, categoryNames } from '@/lib/sminex-catalogue';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import '../commercial.css';

export function generateStaticParams() {
  return commercialUnits.map(unit => ({ id: unit.sourceId }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = commercialUnits.find(item => item.sourceId === id);
  if (!unit) return { robots: { index: false } };
  return pageMetadata(
    commercialTitle(unit),
    `${categoryNames[unit.category] || 'Помещение'} в проекте ${unit.projectName}: ${unit.areaSqm} м², ${rub(unit.priceRub)}. Лот ${unit.sourceId}. Планировка и подбор MAINHALL.`,
    '/commercial/' + id + '/',
  );
}

export default async function CommercialUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = commercialUnits.find(item => item.sourceId === id);
  if (!unit) notFound();

  const facts = [
    ['Цена предложения', rub(unit.priceRub)],
    ['Стоимость метра', rub(unit.pricePerSqm)],
    ['Этаж', unit.floor ?? 'Не указан'],
    ['Номер помещения', unit.unitNumber || unit.sourceId],
  ];
  const gallery = unit.images.filter(image => image.url !== unit.planImageUrl);

  return (
    <EditorialShell>
      <Breadcrumbs items={[
        { name: 'Коммерческая недвижимость', href: '/commercial/' },
        { name: unit.projectName + ' · ' + unit.sourceId, href: '/commercial/' + id + '/' },
      ]} />
      <section className="mh-commercial-detail">
        <EditorialHeader
          eyebrow={unit.projectName}
          title={(categoryNames[unit.category] || 'Помещение') + ' ' + unit.areaSqm + ' м²'}
          description={'Предложение в проекте ' + unit.projectName + '. Сравним планировку, полную стоимость покупки и бюджет подготовки помещения под вашу задачу.'}
        />
        <dl className="mh-commercial-facts">
          {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>
      <p className="mh-commercial-date">Условия проверены {feedDate(sminexFeed.fetchedAt)} Наличие и условия оплаты подтверждаем перед сделкой.</p>
      {unit.planImageUrl && (
        <figure className="mh-commercial-plan">
          <img src={unit.planImageUrl} alt={'Планировка помещения ' + unit.sourceId + ' в ' + unit.projectName} width="1200" height="900" />
          <figcaption>Планировка помещения</figcaption>
        </figure>
      )}
      <section className="mh-commercial-characteristics">
        <h2>Характеристики лота</h2>
        <dl>{unitFeatures(unit).map(feature => <div key={feature.label}><dt>{feature.label}</dt><dd>{feature.value}</dd></div>)}</dl>
        <p>Дату передачи и состав отделки сверяем с документами выбранного лота.</p>
        {editorialProjects.some(project => project.slug === unit.projectSlug) && (
          <Link className="mh-text-link" href={'/projects/' + unit.projectSlug + '/'}>Подробнее о проекте {unit.projectName} ↗</Link>
        )}
      </section>
      <section className="mh-longread">
        <h2>Что проверить перед покупкой</h2>
        <p>Сверим назначение помещения, состав передаваемой отделки, входы и инженерные мощности. Для расчёта инвестиций отдельно учтём ремонт, содержание и срок подготовки к использованию.</p>
        <h3>Условия выбранного помещения</h3>
        <p>Цена относится к указанному помещению. Скидки, рассрочку и состав дополнительных платежей Mainhall уточняет индивидуально. Перед покупкой проверяем, подходит ли помещение для вашего бизнеса.</p>
      </section>
      {gallery.length > 0 && (
        <div className="mh-commercial-gallery">
          {gallery.map((image, index) => (
            <img key={image.url} src={image.url} alt={unit.projectName + ' · изображение ' + (index + 1)} width="1000" height="700" loading="lazy" />
          ))}
        </div>
      )}
      <SelectionContact text="Обсудим это помещение" context={'помещение ' + unit.sourceId + ' в проекте ' + unit.projectName} />
      <Link href="/commercial/" className="mh-text-link">Все коммерческие предложения ↗</Link>
      <JsonLd data={{ '@type': 'RealEstateListing', name: commercialTitle(unit), url: SITE_URL + '/commercial/' + id + '/', datePosted: sminexFeed.fetchedAt }} />
    </EditorialShell>
  );
}
