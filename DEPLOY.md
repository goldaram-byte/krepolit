# Деплой КРЕПОЛИТ CRM на сервер (Aeza VPS)

Разворачивание витрины + админки + API одной командой через Docker Compose
с автоматическим HTTPS (Caddy). Проверено под Ubuntu 22.04/24.04.

---

## 1. Создать сервер на Aeza

1. https://aeza.net → **Виртуальные серверы** → тариф от 1–2 GB RAM (для SQLite
   этого с запасом хватает).
2. ОС: **Ubuntu 24.04**.
3. После создания придут **IP-адрес**, логин `root` и пароль.

## 2. Подключиться по SSH

```bash
ssh root@ВАШ_IP
```
(Windows — через PowerShell или PuTTY.)

## 3. Установить Docker

```bash
curl -fsSL https://get.docker.com | sh
```

## 4. Скачать проект

```bash
cd /opt
git clone https://github.com/goldaram-byte/krepolit.git
cd krepolit
git checkout claude/python-dependencies-setup-3sdbs4   # ветка с CRM (до мержа в main)
```

## 5. Настроить `.env`

```bash
cp .env.example .env
nano .env
```
Заполнить:
```
# Если есть домен — впишите его (будет авто-HTTPS). Если нет — оставьте :80
DOMAIN=crm.вашдомен.ru
# Секрет сессий — сгенерируйте случайную строку:
JWT_SECRET=<вставьте сюда результат: openssl rand -hex 32>
```
Сгенерировать секрет:
```bash
openssl rand -hex 32
```
Сохранить в nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

### Есть домен?
В панели вашего регистратора создайте **A-запись**: `crm` → IP сервера.
Подождите 5–15 минут, пока обновится DNS. Caddy сам выпустит SSL-сертификат.

### Домена пока нет?
В `.env` оставьте `DOMAIN=:80` — сайт будет доступен по `http://ВАШ_IP`.
Домен и HTTPS можно подключить позже (шаг 8).

## 6. Запустить

```bash
docker compose up -d --build
```
Первый запуск: соберётся образ, импортируется каталог (6448 товаров) и
создастся администратор — автоматически. Занимает 1–3 минуты.

Проверить, что всё поднялось:
```bash
docker compose ps
docker compose logs -f app     # выход из логов: Ctrl+C
```

## 7. Открыть

- **Витрина:** `https://crm.вашдомен.ru` (или `http://ВАШ_IP`)
- **Админка:** `.../admin`
- Вход: **admin@krepolit.ru** / **admin123**

> ⚠️ **Сразу смените пароль администратора** и демо-менеджеров в разделе
> «Сотрудники», а демо-данные (клиенты/сделки) при желании удалите.

## 8. Подключить домен позже (если запускали по IP)

1. Создайте A-запись `crm` → IP сервера.
2. В `.env` укажите `DOMAIN=crm.вашдомен.ru`.
3. `docker compose up -d` — Caddy выпустит сертификат автоматически.

---

## Обновление (после новых изменений)

```bash
cd /opt/krepolit
git pull
docker compose up -d --build
```
База и загруженные фото сохраняются в Docker-томах (`crm_data`, `crm_uploads`)
и при обновлении не теряются.

## Резервная копия

```bash
# База данных
docker run --rm -v krepolit_crm_data:/d -v $PWD:/b alpine \
  sh -c "cp /d/krepolit.db /b/backup-$(date +%F).db"
# Фото товаров
docker run --rm -v krepolit_crm_uploads:/u -v $PWD:/b alpine \
  tar czf /b/uploads-$(date +%F).tgz -C /u .
```

## Полезные команды

```bash
docker compose restart          # перезапуск
docker compose down             # остановить (данные в томах сохраняются)
docker compose logs -f app      # логи приложения
docker compose logs -f caddy    # логи веб-сервера/HTTPS
```

---

## Альтернатива без Docker (PM2)

Если не хотите Docker:
```bash
# Node 20 + инструменты сборки
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs build-essential python3
cd /opt/krepolit/server
npm install
node import_catalog.js && node seed.js
JWT_SECRET=$(openssl rand -hex 32) PORT=3000 npm i -g pm2 && pm2 start index.js --name krepolit
pm2 save && pm2 startup
```
Затем поставьте Nginx/Caddy как reverse-proxy на `localhost:3000` для домена и HTTPS.
