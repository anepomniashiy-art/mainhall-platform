/** MAINHALL team, copied as published on the company's own previous site.
 * Identity basis: each photo, name, role and bio sit together in one team card
 * on main-hall.ru (local copy: public/legacy-mainhall/index.html, section #team;
 * earlier export: legacy/index.html). Text is verbatim; nothing is added.
 * Photos: copies of public/legacy-mainhall/assets/* with the EXIF/XMP (APP1)
 * segment removed. Pixels are unchanged.
 * Public professional info only: no phone numbers, messengers or private details.
 */
export const teamSource = {
  page: 'https://main-hall.ru/#team',
  localCopy: 'public/legacy-mainhall/index.html',
  earlierExport: 'legacy/index.html',
  recoveredAt: '2026-10-20',
  context: 'Bios describe experience in commercial real estate (the previous MAINHALL direction).',
};

export const team = [
  {
    slug: 'andrey-nepomniashchiy',
    name: 'Андрей Непомнящий',
    role: 'Партнёр',
    bio: 'Стратегия, управление проектами, привлечение инвестиций. 20 лет в девелопменте — Башня Федерация, ЖК Eleven, Aiva Development',
    photo: '/images/team/andrey-nepomniashchiy.jpg',
    photoSource: 'public/legacy-mainhall/assets/6eb04e5b5cd60be3-IMG_6163_2.jpg',
    photoTildaUrl: 'https://static.tildacdn.com/tild3334-3636-4233-a237-636432363665/IMG_6163_2.jpg',
    photoSize: [483, 483],
  },
  {
    slug: 'ivan-yachmenev',
    name: 'Иван Ячменев',
    role: 'Партнёр',
    bio: 'Выкуп объектов, схемы реализации, стройка. 15 лет в коммерческой недвижимости, 100+ сделок на торгах',
    photo: '/images/team/ivan-yachmenev.jpg',
    photoSource: 'public/legacy-mainhall/assets/75543ff3f8d2bc96-IMG_6145.JPG',
    photoTildaUrl: 'https://static.tildacdn.com/tild3736-3138-4265-a664-613930303430/IMG_6145.JPG',
    photoSize: [1024, 1024],
  },
  {
    slug: 'sergey-chernavin',
    name: 'Сергей Чернавин',
    // Live site wording; the earlier export says "Руководитель отдела продаж".
    role: 'Руководитель отдела продаж и привлечения',
    bio: 'Привлечение инвестиций, продажа лотов. 10 лет в коммерческой недвижимости, реализовал 200+ объектов на 5+ млрд ₽',
    photo: '/images/team/sergey-chernavin.jpg',
    photoSource: 'public/legacy-mainhall/assets/59426f858b465503-_.jpg',
    photoTildaUrl: 'https://static.tildacdn.com/tild3934-6664-4561-b362-373130663031/_.jpg',
    photoSize: [830, 826],
  },
];
