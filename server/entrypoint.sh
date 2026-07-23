#!/usr/bin/env bash
set -e
mkdir -p /app/data /app/uploads
cd /app/server
if [ ! -f "$DB_PATH" ]; then
  echo "[init] База не найдена — импортирую каталог и создаю администратора…"
  node import_catalog.js
  node seed.js
else
  echo "[init] База найдена — применяю миграции схемы…"
  node -e "import('./db.js').then(()=>console.log('schema ok'))"
fi
echo "[start] Запуск КРЕПОЛИТ CRM…"
exec node index.js
