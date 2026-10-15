# MAINHALL Bridge: Инструкция для GPT

## Контекст

MAINHALL — инвестиционная платформа премиальной жилой недвижимости Москвы (от 600K ₽/м²).

Репозиторий: `anepomniashiy-art/mainhall-platform`
Владелец: Андрей Непомнящий (@anepomniashiy-art)

## Что уже сделано

Claude Code реализовал двусторонний мост GPT ↔ Claude Code через GitHub Actions:

- `.github/workflows/claude-bridge.yml` — GPT → Claude (Anthropic API)
- `.github/workflows/gpt-bridge.yml` — Claude → GPT (OpenAI API)

Механика: комментарий с тегом `[GPT]` в Issue с лейблом `bridge` вызывает Claude API, ответ постится как `[CLAUDE CODE]`, что вызывает GPT API, и так далее. Лимит: 20 обменов на issue.

## Проблема

GitHub не запускает workflows от комментариев, созданных через GitHub App токены (стандартное ограничение для предотвращения рекурсии). Это значит:
- Комментарии от Claude Code (через GitHub App) НЕ триггерят workflows
- Комментарии, постнутые самими workflows через `GITHUB_TOKEN`, тоже НЕ триггерят другие workflows

## Решение: Personal Access Token (PAT)

Комментарии, постнутые через PAT, **триггерят** workflows. Workflows уже обновлены для использования `secrets.BRIDGE_PAT`.

### Что нужно сделать владельцу:

1. **Создать Fine-grained PAT:**
   - Перейти: https://github.com/settings/personal-access-tokens/new
   - **Token name:** `MAINHALL Bridge`
   - **Expiration:** 90 days (или больше)
   - **Repository access:** Only select repositories → `anepomniashiy-art/mainhall-platform`
   - **Permissions:**
     - Issues: **Read and write**
   - Нажать **Generate token**
   - **Скопировать токен** (показывается один раз!)

2. **Добавить как секрет репозитория:**
   - Перейти: https://github.com/anepomniashiy-art/mainhall-platform/settings/secrets/actions
   - **New repository secret**
   - Name: `BRIDGE_PAT`
   - Value: вставить скопированный токен
   - **Add secret**

3. **Тест:**
   - Перейти в Issue #1: https://github.com/anepomniashiy-art/mainhall-platform/issues/1
   - Написать комментарий: `[GPT] Подтверди получение. Сообщи статус проекта.`
   - Через ~30 сек должен появиться ответ от Claude

## Секреты репозитория (итого 4)

| Secret | Источник | Статус |
|--------|----------|--------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | ✅ Добавлен |
| `OPENAI_API_KEY` | platform.openai.com | ✅ Добавлен |
| `BRIDGE_PAT` | GitHub PAT | ❌ Нужно создать |

## Альтернатива (если PAT невозможен)

Если владелец не хочет создавать PAT, можно переделать мост на polling-архитектуру:
- Cron workflow каждые 3 минуты проверяет новые необработанные комментарии
- Плюс: не нужен PAT
- Минус: задержка до 3 минут вместо мгновенной реакции

## Для GPT: роль в проекте

GPT выступает как **стратегический продуктовый советник**:
- Принимает решения по бизнес-логике, приоритетам, архитектуре данных
- Не задаёт вопросов владельцу — решает сам
- Фокус: целевые девелоперы (Sminex, Capital Group, MR Group, PIONEER, Vesper и др.), ценовой фильтр от 600K ₽/м², инвестиционная аналитика

Claude Code — **технический исполнитель**:
- Next.js 16 + TypeScript + Tailwind v4 + Prisma 8.x + PostgreSQL
- Реализует код, пушит в репо, тестирует
- Все решения принимает сам, без вопросов владельцу
