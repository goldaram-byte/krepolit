// БД КРЕПОЛИТ CRM — SQLite (better-sqlite3), единый файл, без внешнего сервера.
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'krepolit.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pass TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',      -- admin | manager
  perms TEXT NOT NULL DEFAULT '{}',          -- JSON прав доступа
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  inn TEXT,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (             -- воронка продаж
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'new',           -- new|contact|offer|negotiation|won|lost
  amount REAL NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',          -- new|processing|shipped|done|canceled
  total REAL NOT NULL DEFAULT 0,
  items TEXT NOT NULL DEFAULT '[]',            -- JSON позиций
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grp TEXT, sub TEXT,
  name TEXT NOT NULL,
  art TEXT,
  unit TEXT,
  price REAL NOT NULL DEFAULT 0,
  weight REAL,
  image TEXT,                                   -- имя загруженного файла
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT, icon TEXT);
CREATE TABLE IF NOT EXISTS subs   (id TEXT PRIMARY KEY, g TEXT, name TEXT);

CREATE INDEX IF NOT EXISTS idx_clients_mgr ON clients(manager_id);
CREATE INDEX IF NOT EXISTS idx_deals_mgr ON deals(manager_id);
CREATE INDEX IF NOT EXISTS idx_orders_mgr ON orders(manager_id);
CREATE INDEX IF NOT EXISTS idx_products_grp ON products(grp);
CREATE INDEX IF NOT EXISTS idx_products_art ON products(art);
`);

// Права по умолчанию для роли менеджера (ограниченный доступ)
export const DEFAULT_MANAGER_PERMS = {
  clients: 'own',    // own | all
  deals: 'own',
  orders: 'own',
  catalog: false,    // редактирование каталога
  reports: false,    // сводные отчёты
  employees: false,  // управление сотрудниками
};

export const STAGES = ['new','contact','offer','negotiation','won','lost'];
export const STAGE_LABELS = {new:'Новая',contact:'Контакт',offer:'КП отправлено',negotiation:'Переговоры',won:'Сделка',lost:'Отказ'};
export const ORDER_STATUSES = ['new','processing','shipped','done','canceled'];
export const ORDER_LABELS = {new:'Новый',processing:'В работе',shipped:'Отгружен',done:'Завершён',canceled:'Отменён'};
