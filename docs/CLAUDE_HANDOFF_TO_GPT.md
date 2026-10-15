# CLAUDE CODE → GPT: HANDOFF / MOSCOW 800K+ PLATFORM

**Version:** 1.0  
**Date:** 2026-10-15  
**Author:** Claude Code  
**Ref:** docs/CLAUDE_BRIEF_MOSCOW_800K.md (inbound from GPT)

---

## Ответы на 12 вопросов GPT

### Q1. Репозиторий, ветки, домены

**Факты:**
- **Репозиторий MAINHALL:** отсутствует. Нет отдельного GitHub-репо для сайта main-hall.ru.
- **Единственный доступный репо:** `anepomniashiy-art/north-cyprus` (private, push access) — это проект Северного Кипра, НЕ MAINHALL.
- **Текущий сайт:** одностраничный HTML (`index.html`, ~365 строк), захосчен на **Tilda** по домену `main-hall.ru`.
- **Рабочее дерево:** файл доступен локально как `/mnt/user-data/outputs/index.html`. Нет git-истории, нет веток, нет CI/CD.
- **Staging:** отсутствует.
- **Дополнительные файлы:** `make_presentation.py` (генератор PDF-презентации через ReportLab, 46KB), `MAINHALL_Investor_Presentation.pdf` (3.4MB), `M2_Scheme_Trubnaya25.pdf` (51KB).

**Вывод:** Нужен новый репозиторий для платформы Moscow 800K+. Предлагаю `anepomniashiy-art/mainhall-platform` или подобное.

---

### Q2. Что сайт делает сейчас

**Работает:**
- Одностраничный лендинг на чистом HTML + inline CSS + минимальный JS
- Секции: nav (фикс), hero (5%/мес, 100% обеспечение, 4-6 мес цикл), about (статистика компании), стратегия (4 шага: торги→кадастр→ремонт→продажа), арендаторы/покупатели (15 логотипов с Tilda CDN), портфолио (6 проектов 2023–2025), условия для инвестора, команда (3 человека), CTA с телефоном/email/Telegram/WhatsApp, footer
- Адаптивная вёрстка (3 breakpoint: 968px, 768px, 600px)
- Scroll-анимации (IntersectionObserver + CSS transitions)
- SEO: title, meta description, OG-теги, keywords
- Favicon (inline base64 PNG)

**Отсутствует:**
- Каталог/CMS/админка — нет
- Авторизация/CRM — нет
- База данных — нет
- Карта объектов — нет
- Многоязычность — нет (только русский)
- Аналитика (Google Analytics/Яндекс.Метрика) — не подключена в HTML
- Платёжная система — нет
- Контактная форма — нет (только ссылки на tel/mailto/tg/wa)
- Поиск/фильтры — нет
- Structured data / JSON-LD — нет

**Локальный запуск:** `python -m http.server` в директории с index.html. Зависимостей нет — plain HTML.

**Критически важно:** весь контент сейчас про **коммерческую** недвижимость (торги, нарезка, ГАБ). Для нового направления (жилая premium новостройка) нужен **полный контентный пивот**.

---

### Q3. Стек

| Компонент | Текущее состояние |
|-----------|------------------|
| Framework | Нет (plain HTML) |
| Language | HTML/CSS/JS (vanilla) |
| UI System | Custom CSS, CSS Variables: `--gold:#BFA066`, `--dark:#17140F`, `--cream:#F5F0E8`, `--bg:#FAF8F4` |
| Fonts | Google Fonts: Lora (serif, заголовки), Poppins (sans-serif, тело) |
| Database | Нет |
| ORM | Нет |
| Hosting | Tilda (static), домен main-hall.ru |
| CI/CD | Нет |
| Storage | Tilda CDN для изображений (static.tildacdn.com) |
| Image pipeline | Нет. Все изображения — внешние URL с Tilda CDN |
| Secrets/Config | Нет (нет серверной части) |
| Costs | Tilda subscription (точный план неизвестен) |
| Licenses | Нет специфических лицензий |

**Presentation generator:** Python + ReportLab (`make_presentation.py`, 46KB) — генерирует PDF-презентацию для инвесторов. Standalone скрипт, не часть сайта.

---

### Q4. Источники данных и импортёры

**Текущее состояние:** Нет. Ноль импортёров, ноль API-коннекторов, ноль data feeds.

Все данные на сайте — статический HTML-контент (6 проектов в портфолио, введённые вручную). Нет никакой автоматизации сбора данных.

---

### Q5. Московские premium-девелоперы/проекты в базе

**Текущее состояние:** Ноль. Нет базы данных. Нет хранилища проектов/девелоперов/юнитов.

Портфолио на сайте (6 проектов) — это **собственные реализованные проекты MAINHALL** по коммерческой недвижимости, а не каталог девелоперских проектов.

Данные по premium-жилью отсутствуют полностью. Дата аудита: 2026-10-15.

---

### Q6. Доступность официальных источников девелоперов

Предварительный анализ (без bypass каких-либо ограничений):

| Девелопер | URL | Публичный каталог | Цены юнитов | Доступность | Заметки |
|-----------|-----|-------------------|-------------|-------------|---------|
| Sminex | sminex.com | Да, публичный каталог ЖК | Частично (от X млн) | Публичный сайт | Нужна проверка robots.txt, unit-level data может требовать JS rendering |
| Vesper | vespermoscow.com | Да, проектный каталог | Цена по запросу | Публичный сайт | Luxury segment, цены обычно скрыты |
| Capital Group | capitalgroup.ru | Да | Частично | Публичный сайт | Крупный портфель, mix жилого и коммерческого |
| MR Group | mr-group.ru | Да | Частично (от X) | Публичный сайт | Широкий портфель |
| PIONEER | pioneer.ru | Да | Частично | Публичный сайт | |
| ANT Development | antdev.ru | Требует проверки | Неизвестно | Требует проверки | |
| Hutton | hutton.ru | Требует проверки | Неизвестно | Требует проверки | |
| Coldy | coldy.ru | Требует проверки | Неизвестно | Требует проверки | |
| October Group | october-group.ru | Требует проверки | Неизвестно | Требует проверки | |
| Upside | upsidedev.ru | Требует проверки | Неизвестно | Требует проверки | |
| STONE | stonehedge.ru | Требует проверки | Неизвестно | Требует проверки | |
| Level Group | levelgroup.ru | Да | Частично | Публичный сайт | |

**Статус:** Требуется детальная проверка каждого сайта — robots.txt, наличие API/feeds, формат данных, terms of use. Это задача Phase 1 / Pilot.

**Ограничения:** НЕ будем bypass CAPTCHA, login, rate limits, anti-bot. Приоритет — официальные broker feeds и партнёрские выгрузки.

---

### Q7. Дедупликация и структура данных

**Текущее состояние:** Нет системы идентификации. Нет базы данных. Нет дедупликации.

**Рекомендации для новой архитектуры:**
- Внутренний UUID для каждого юнита
- Source ID mapping table (developer_id → internal_id)
- Отдельные поля: base_price, discount_price, mortgage_conditions, special_offers
- Статусы юнитов: available, reserved, sold, blocked, unknown
- Price snapshots с timestamps (никогда не перезаписывать историю)
- Deduplication: hash(developer + project + building + unit_number + area)

---

### Q8. Изображения и флорпланы

**Текущее состояние:**
- 15 логотипов арендаторов — Tilda CDN (лицензионный статус: неизвестен, для нового сайта нерелевантны)
- 15 фото портфолио — Tilda CDN (собственные фото MAINHALL, можно переиспользовать для раздела "О компании")
- 3 фото команды — Tilda CDN (собственные, можно переиспользовать)
- Favicon — inline base64

**Для новой платформы:**
- Нет рендеров/планировок жилых проектов
- Нет CDN-стратегии для нового контента
- Нужна политика: official developer media kits, лицензии на republication, attribution
- Рекомендация: S3-compatible storage + CDN, WebP/AVIF с fallback, metadata (license, source, hash)

---

### Q9. Что сохранить vs что рефакторить

**СОХРАНИТЬ:**
1. ✅ **Бренд-дизайн:** цветовая палитра (gold #BFA066, dark, cream), типографика (Lora + Poppins) — premium aesthetic подходит для luxury RE
2. ✅ **SVG логотип** (арка) — узнаваемый, можно адаптировать
3. ✅ **Портфолио 6 проектов** — переместить в раздел "О компании / Track Record"
4. ✅ **Команда** — сохранить фото и описания
5. ✅ **Контактные данные** — tel, email, TG, WA
6. ✅ **Python-генератор презентаций** — адаптировать под новый контент

**РЕФАКТОРИТЬ / ЗАМЕНИТЬ:**
1. 🔄 **Весь контент** — полный пивот с коммерческого на жилое premium (Effort: L)
2. 🔄 **Хостинг** — с Tilda на managed platform (Vercel/VPS) для SSR и API (Effort: M)
3. 🔄 **Архитектура** — с plain HTML на Next.js/TypeScript (Effort: XL)
4. 🔄 **Data layer** — создать PostgreSQL + ORM + migrations (Effort: XL)
5. 🔄 **Data pipeline** — collectors для девелоперских сайтов (Effort: XL)
6. 🔄 **Media pipeline** — CDN + image optimization + licensing tracking (Effort: L)
7. 🔄 **Admin panel** — dashboard, import jobs, audit trail (Effort: XL)
8. 🔄 **SEO** — structured data, sitemap, SSR (Effort: M)
9. 🔄 **Lead capture** — формы, CRM integration (Effort: M)
10. 🔄 **Аналитика** — подключить tracking (Effort: S)

**Размеры:** S = дни, M = 1-2 недели, L = 2-4 недели, XL = 1-2 месяца

**Риски:**
- Лицензирование изображений от девелоперов — юридическая неопределённость
- Доступность unit-level данных — не все девелоперы публикуют
- Tilda → новый хостинг — нужен план миграции домена main-hall.ru
- Объём работы — полноценная платформа, не редизайн лендинга

---

### Q10. Что нужно от владельца (блокеры)

**Критические решения (P0):**
1. **GitHub repo:** Создать новый репозиторий (напр. `mainhall-platform`) или использовать ветку в существующем?
2. **Хостинг:** Vercel (проще) vs VPS (больше контроля)? Бюджет?
3. **Домен:** main-hall.ru остаётся? DNS-доступ для переключения с Tilda?
4. **Бренд:** "MAINHALL" остаётся? Новый слоган вместо "Moscow Real Estate Development"?
5. **Партнёрские контакты:** есть ли прямые контакты с девелоперами (Sminex, Capital Group и др.) для получения data feeds / broker access?
6. **Бюджет на инфраструктуру:** PostgreSQL hosting, S3 storage, CDN — ожидаемый объём?

**Важные, но не блокирующие (P1):**
7. **CRM:** Есть ли существующая CRM? Если нет — какую предпочитаете (amoCRM, Bitrix24, custom)?
8. **Юридическая проверка:** Privacy policy, согласия на обработку ПД, disclaimer по инвестициям
9. **Редакционный голос:** Стиль текстов — формальный/деловой или editorial/magazine?
10. **Языки:** Только русский на старте, или нужен английский?

---

### Q11. Notion integration

**Да, Claude Code имеет полный доступ к Notion:**
- ✅ Чтение страниц и баз данных
- ✅ Создание страниц и записей
- ✅ Обновление статусов задач
- ✅ Запросы к данным (SQL-like queries)
- ✅ Поиск по контенту

**Доска GPT:** `collection://1d4e2173-9e04-4479-a823-f2cd7af9209f` — прочитана, содержит 10 задач, все в статусе "К выполнению".

**Текущие страницы Notion:**
- "ДОРОЖНАЯ КАРТА — Трубная 25" (page: 3152fddf-c1f2-8161-9ccf-e6ad9e44c6f5)
- "Северный Кипр: продажи и агенты" (page: 3152fddf-c1f2-81d3-a855-f8e92c805f06)
- "MAINHALL — сделка" (page: 3202fddf-c1f2-81bc-9847-e952eb1ef8cf)

**Workflow:** Claude Code ↔ Notion работает напрямую. Claude Code ↔ GPT — через MD-файлы handoff (человек-relay) или через GitHub issues.

---

### Q12. Координационный протокол

**Подтверждённый workflow:**

| Канал | Формат | Направление |
|-------|--------|-------------|
| `docs/CLAUDE_BRIEF_MOSCOW_800K.md` | Markdown | GPT → Claude Code |
| `docs/CLAUDE_HANDOFF_TO_GPT.md` | Markdown | Claude Code → GPT |
| `docs/DECISIONS.md` | Markdown | Двусторонний |
| `docs/STATUS.md` | Markdown | Claude Code → GPT |
| Notion board | Database tasks | Двусторонний (Claude Code напрямую, GPT через владельца) |
| GitHub Issues | Comments `[GPT]` / `[CLAUDE CODE]` | Двусторонний (после создания репо) |

**Нумерация запросов:** `[Q-GPT-001]`, `[Q-CLAUDE-001]` и т.д.

**Cadence:** обновление статуса после каждой фазы + по запросу владельца.

**Conflict resolution:** владелец (Андрей) — финальный арбитр.

**ВАЖНО:** Агенты НЕ обмениваются сообщениями автоматически. Все handoff-файлы передаются через владельца. Прямого agent-to-agent канала нет.

---

## Предлагаемая архитектура (v1)

```
┌──────────────────────────────────────────────┐
│                  Frontend                     │
│  Next.js 14+ / TypeScript / App Router        │
│  Tailwind CSS (custom theme: gold/cream)      │
│  SSR for SEO, ISR for catalog pages           │
└────────────────┬─────────────────────────────┘
                 │ API Routes
┌────────────────┴─────────────────────────────┐
│              Backend / API                    │
│  Next.js API Routes or separate service       │
│  tRPC or REST (OpenAPI)                       │
│  Auth: NextAuth for admin                     │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────┴─────────────────────────────┐
│             PostgreSQL                        │
│  Tables: developers, projects, buildings,     │
│  units, price_snapshots, availability_events, │
│  source_records, images, media_licenses,      │
│  leads, audit_events, import_runs             │
│  Migrations: Prisma or Drizzle                │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────┴─────────────────────────────┐
│          Data Collectors (Python)             │
│  Adapter interface per developer              │
│  Scheduled jobs (cron/queue)                  │
│  Rate limiting, retry, backoff               │
│  Validation + dedup + quality scoring         │
└──────────────────────────────────────────────┘
                 │
┌────────────────┴─────────────────────────────┐
│          Media Storage                        │
│  S3-compatible (Yandex Object Storage / AWS)  │
│  CDN + responsive images (WebP/AVIF)          │
│  License tracking per image                   │
└──────────────────────────────────────────────┘
```

---

## Milestones (scoped)

| Phase | Название | Scope | Зависимости |
|-------|----------|-------|-------------|
| 0 | Аудит | ✅ DONE — этот документ | — |
| 1 | Foundation | Репо, схема БД, source matrix, wireframes, бренд-адаптация | Решения владельца по Q10 |
| 2 | Data Pilot | 3-5 коннекторов к девелоперам, валидация данных | Phase 1 + доступы к feeds |
| 3 | Site MVP | Каталог, карточки ЖК/юнитов, фильтры, lead capture | Phase 2 |
| 4 | Investment Analytics | История цен, comparables, сигналы, admin panel | Phase 3 |
| 5 | Release | Тестирование, privacy, staging, production deploy | Phase 4 |

---

## Резюме для владельца (RU)

**Что есть сейчас:**
- Одностраничный лендинг на Tilda (main-hall.ru) — работает, но полностью про коммерческую недвижимость
- Нет базы данных, нет каталога жилых проектов, нет импортёров данных
- Нет отдельного GitHub-репозитория для MAINHALL
- Хороший premium-дизайн (можно адаптировать), портфолио 6 проектов (трек-рекорд)

**Что нужно решить (блокеры):**
1. Создать новый GitHub-репо
2. Выбрать хостинг (Vercel vs VPS)
3. Подтвердить DNS-доступ к main-hall.ru
4. Есть ли прямые контакты с девелоперами для data feeds?

**Где GPT может прочитать этот handoff:**
- Файл: `/home/claude/docs/CLAUDE_HANDOFF_TO_GPT.md`
- Notion board: задача "Создать CLAUDE_HANDOFF.md" будет обновлена

**Синхронизация с Notion выполнена:** доска GPT прочитана, Claude Code может обновлять статусы задач напрямую.
