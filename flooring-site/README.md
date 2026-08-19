# flooring-site

Next.js 15 (App Router, TypeScript) каталог-сайт дилера напольных покрытий.
Полное ТЗ — [`../SPEC.md`](../SPEC.md), правила для разработки — [`../CLAUDE.md`](../CLAUDE.md).

## Статус: Спринт 1 (каркас)

Реализовано:
- Next.js 15 + TypeScript (strict) + Tailwind CSS.
- Схема Prisma (`prisma/schema.prisma`) по модели данных из SPEC.md §3, клиент на driver-adapter (`@prisma/adapter-pg`), т.к. Prisma 7 больше не читает `DATABASE_URL` напрямую из схемы.
- Базовый layout (шапка, подвал), главная, «О компании», «Доставка и оплата», «Контакты», «Политика конфиденциальности», «Спасибо».
- Единый компонент формы лида (`src/components/forms/LeadForm.tsx`): маска телефона, чекбокс согласия на ОПД, honeypot-поле, ссылка на политику конфиденциальности.
- `POST /api/leads`: валидация (zod), rate limit по IP, запись лида в БД, уведомление в Telegram.
- Конфиги для деплоя на VPS без Docker: `deploy/nginx.conf`, `deploy/flooring-site.service` (systemd).

Не реализовано (следующие спринты по SPEC.md §10): каталог, карточка товара, калькулятор метража, заказ образцов, страница `/pro`, блог, админка, импорт фидов поставщиков, Яндекс.Метрика, sitemap/JSON-LD.

## Разработка

```bash
npm install
cp .env.example .env   # заполнить DATABASE_URL и TELEGRAM_*
npm run db:migrate     # применить схему к локальной Postgres
npm run dev
```

`npm run build` собирает продакшн-бандл; `npm run postinstall` (запускается автоматически после `npm install`) генерирует Prisma-клиент в `src/generated/prisma` — эта папка не коммитится.

## Переменные окружения

См. `.env.example`:
- `DATABASE_URL` — строка подключения к PostgreSQL.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — бот и чат для уведомлений о заявках.

## Деплой

VPS, без Docker: `systemd`-юнит (`deploy/flooring-site.service`) запускает `next start` за `nginx` (`deploy/nginx.conf`), HTTPS — через `certbot`. Перед первым запуском:

```bash
npm ci
npm run build
npm run db:deploy   # prisma migrate deploy
```

Оба конфига в `deploy/` — шаблоны с `TODO`-плейсхолдерами (домен, пути, пользователь), их нужно подставить под конкретный VPS.
