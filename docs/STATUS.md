# STATUS — Moscow 800K+ Platform

**Последнее обновление:** 2026-10-15

---

## Phase 0: Аудит — ЗАВЕРШЁН ✅

| Задача | Статус | Результат |
|--------|--------|-----------|
| Аудит index.html | ✅ Done | Одностраничный HTML, Tilda, коммерческая недвижимость |
| Аудит make_presentation.py | ✅ Done | Python/ReportLab PDF generator, standalone |
| Проверка GitHub | ✅ Done | Нет MAINHALL-репо, только north-cyprus |
| Проверка Notion | ✅ Done | Доска GPT найдена, 10 задач, доступ есть |
| CLAUDE_HANDOFF_TO_GPT.md | ✅ Done | 12 вопросов отвечены |
| Source matrix CSV | ✅ Done | 12 девелоперов, предварительный статус |
| Notion реорганизация | ✅ Done | 3 страницы перемещены в архив |

## Phase 1: Foundation — В ПРОЦЕССЕ 🔧

**Блокеры:** GitHub репозиторий (ожидаем создание владельцем)

| Задача | Статус | Примечание |
|--------|--------|------------|
| Решения D-100..D-107 | ✅ Done | Все решения приняты |
| Next.js проект (init) | ✅ Done | Next.js 16, TypeScript, Tailwind v4 |
| Prisma схема (15 моделей) | ✅ Done | prisma/schema.prisma |
| Бренд-адаптация CSS | ✅ Done | Lora + Inter, gold palette |
| Collector adapter interface | ✅ Done | src/types/collector.ts |
| Constants, DB client | ✅ Done | src/lib/ |
| Layout (Header + Footer) | ✅ Done | Адаптивный, с мобильным меню |
| Главная страница | ✅ Done | Hero, About, Developers, CTA |
| Страница девелоперов | ✅ Done | Карточки 12 девелоперов |
| Каталог проектов | ✅ Done | 6 placeholder-проектов, фильтры |
| Каталог квартир | ✅ Done | Таблица + мобильные карточки |
| Создать GitHub repo | ⏳ | Владелец создаёт `anepomniashiy-art/mainhall-platform` |
| Push в GitHub | ⏳ | После создания репо |
| Подключение PostgreSQL | ⏳ | Vercel Postgres или Supabase |
| Prisma ORM generate | ⏳ | После подключения БД |

## Phase 2: Пилот — НЕ НАЧАТ ⏳

| Задача | Статус |
|--------|--------|
| Пилот по 5 девелоперам (collectors) | ⏳ |
| Реестр московских ЖК ≥800К | ⏳ |
| Медиатека планировок | ⏳ |
| API routes (CRUD) | ⏳ |

## Phase 3: Аналитика и релиз — НЕ НАЧАТ ⏳

| Задача | Статус |
|--------|--------|
| История цен, инвестиционная аналитика | ⏳ |
| Тестирование, безопасность, релиз | ⏳ |
| Публичный API и агентский доступ | ⏳ |

---

## Структура проекта

```
mainhall-platform/
├── prisma/schema.prisma          # 15 моделей БД
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (Header + Footer)
│   │   ├── page.tsx              # Главная
│   │   ├── globals.css           # Brand theme
│   │   ├── (public)/
│   │   │   ├── developers/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   └── units/page.tsx
│   │   ├── admin/                # (пусто)
│   │   └── api/                  # (пусто)
│   ├── components/
│   │   ├── layout/Header.tsx, Footer.tsx
│   │   ├── ui/                   # (пусто)
│   │   ├── catalog/              # (пусто)
│   │   └── filters/              # (пусто)
│   ├── lib/
│   │   ├── db/index.ts           # Prisma singleton (lazy)
│   │   ├── constants.ts          # Brand, company, developers
│   │   ├── collectors/           # (пусто)
│   │   └── utils/                # (пусто)
│   └── types/collector.ts        # Adapter interface
├── docs/                         # Документация, handoffs
├── collectors/adapters/          # Python collectors (пусто)
└── public/images/                # (пусто)
```
