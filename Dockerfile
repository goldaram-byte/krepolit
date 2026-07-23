# КРЕПОЛИТ CRM — образ приложения (витрина + админка + API)
FROM node:20-bookworm-slim

# сборочные зависимости для нативного модуля better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# копируем весь сайт (витрина, админка, ассеты, сервер)
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/krepolit.db
EXPOSE 3000

RUN chmod +x server/entrypoint.sh
CMD ["server/entrypoint.sh"]
