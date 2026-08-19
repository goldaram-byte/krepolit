# flooring-site

Next.js 15 (App Router, TypeScript) каталог-сайт дилера напольных покрытий.
Полное ТЗ — [`../SPEC.md`](../SPEC.md), правила для разработки — [`../CLAUDE.md`](../CLAUDE.md).

## Статус: Спринт 2 (каталог)

**Спринт 1 — каркас:**
- Next.js 15 + TypeScript (strict) + Tailwind CSS.
- Схема Prisma (`prisma/schema.prisma`) по модели данных из SPEC.md §3, клиент на driver-adapter (`@prisma/adapter-pg`), т.к. Prisma 7 больше не читает `DATABASE_URL` напрямую из схемы.
- Базовый layout (шапка, подвал), главная, «О компании», «Доставка и оплата», «Контакты», «Политика конфиденциальности», «Спасибо».
- Единый компонент формы лида (`src/components/forms/LeadForm.tsx`): маска телефона, чекбокс согласия на ОПД, honeypot-поле, ссылка на политику конфиденциальности.
- `POST /api/leads`: валидация (zod), rate limit по IP, запись лида в БД, уведомление в Telegram.
- Конфиги для деплоя на VPS без Docker: `deploy/nginx.conf`, `deploy/flooring-site.service` (systemd).

**Спринт 2 — каталог:**
- Импорт каталога (`scripts/import/`): CLI `npm run import -- --supplier=<id>`, парсеры YML (Яндекс-фид) и XLSX/CSV с настраиваемым маппингом колонок (`Supplier.columnMapping`), общая логика upsert (новый SKU → черновик, существующий → обновление, пропавший из фида → `stockStatus=нет`, не удаляется), скачивание и оптимизация фото в WebP (`sharp`), отчёт в Telegram.
- Расчёт цены с защитой от демпинга ниже РРЦ (`src/lib/pricing.ts`) — используется импортом и (в будущем) ручным переопределением в админке.
- Каталог `/catalog` и `/catalog/[category]`: фильтры (бренд, толщина, класс износостойкости, декор, водостойкость, тёплый пол, цена, наличие) как GET-форма — целиком в URL, без JS; сортировка; пагинация; `rel=canonical` на чистую категорию.
- Карточка товара `/product/[slug]`: SSG + ISR (ревалидация раз в час), цена за упаковку и за м² одновременно, полная таблица характеристик, похожие декоры, страница не даёт 404 при уходе товара «в нет в наличии» (SPEC.md §6).
- Калькулятор метража — переиспользуемый компонент (`src/components/calculator/AreaCalculator.tsx`) на странице `/calculator` (с поиском товара) и на карточке товара (уже с привязанным товаром); учитывает запас на подрезку (прямая укладка 5%, диагональ 10%, ёлка 15%) и позволяет отправить расчёт как заявку.
- Добавлены поля `Product.waterproof`/`Product.warmFloorCompatible` (были в фильтрах §5, но отсутствовали в модели данных §3).

Не реализовано (следующие спринты по SPEC.md §10): заказ образцов как отдельная воронка (кнопка на карточке товара сейчас ведёт на встроенную форму), страница `/pro`, блог, админка, второй поставщик, Яндекс.Метрика, sitemap.xml/JSON-LD/YML-фид для Директа (SEO-обвязка целиком — Спринт 3).

## Разработка

```bash
npm install
cp .env.example .env   # заполнить DATABASE_URL и TELEGRAM_*
npm run db:migrate     # применить схему к локальной Postgres
npm run dev
```

`npm run build` собирает продакшн-бандл; `npm run postinstall` (запускается автоматически после `npm install`) генерирует Prisma-клиент в `src/generated/prisma` — эта папка не коммитится.

Локальная PostgreSQL для разработки (пример для Ubuntu/Debian):

```bash
apt-get install -y postgresql-16
service postgresql start
su postgres -c "psql -c \"CREATE USER flooring WITH PASSWORD 'devpassword' CREATEDB;\""
su postgres -c "psql -c \"CREATE DATABASE flooring OWNER flooring;\""
```

## Импорт каталога поставщика

```bash
npm run import -- --supplier=<id> [--no-images]
```

`--no-images` пропускает скачивание фото (быстрее для тестового прогона). Поставщик должен
существовать в таблице `suppliers` с заполненными `feedUrl`, `feedType` (`yml`/`xlsx`/`csv`) и,
для XLSX/CSV, `columnMapping` (JSON, см. `scripts/import/types.ts#ColumnMapping`) — управление
поставщиками появится в админке (Спринт 4), пока это делается напрямую через БД/Prisma Studio.

Для локальной проверки есть тестовый YML-фид на 320 товаров одного бренда:
`scripts/import/fixtures/sample-feed.yml`. Он же используется как ориентир формата, который
понимает парсер (структура `<yml_catalog><shop><categories>`/`<offers>`, характеристики —
через `<param name="...">`, распознаваемые имена параметров — в `scripts/import/param-mapping.ts`).

Скачанные и оптимизированные (WebP, `sharp`) фото сохраняются в `storage/images/products/` —
эта папка вне `public/`, чтобы не пересоздаваться при каждом деплое. На проде и в dev она должна
быть доступна как `public/uploads`:

```bash
mkdir -p storage/images/products
ln -s ../storage/images public/uploads
```

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
