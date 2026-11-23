import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export function GET() {
  const description = 'Коммерческая недвижимость Москвы: подход Mainhall к выбору объектов, инвестиционным сценариям и работе с инвесторами.';
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: 'Коммерческая недвижимость', item: SITE_URL + '/commercial/' },
    ],
  };
  let descriptionCount = 0;
  const source = readFileSync(join(process.cwd(), 'public/legacy-mainhall/index.html'), 'utf8')
    .replaceAll('https://main-hall.ru', SITE_URL)
    .replace(/<meta\s+name="description"[^>]*>/g, () => descriptionCount++ ? '' : `<meta name="description" content="${description}">`)
    .replace(/<meta\s+property="og:description"[^>]*>/g, `<meta property="og:description" content="${description}">`)
    .replace('</head>', `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script></head>`);

  return new Response(source, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
