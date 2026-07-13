import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from '../db.js';
import { auth, require } from '../auth.js';
const r = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UP = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UP, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, f, cb) => cb(null, UP),
  filename: (req, f, cb) => {
    const ext = (path.extname(f.originalname) || '.jpg').toLowerCase();
    cb(null, 'p' + req.params.id + '_' + Date.now() + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /image\/(jp|jpe|png|webp|gif)/i.test(f.mimetype)) });

// Список / поиск (публичный для витрины и админки)
r.get('/', (req, res) => {
  const { q, grp, limit = 100, offset = 0 } = req.query;
  const w = [], p = [];
  if (grp) { w.push('grp=?'); p.push(grp); }
  if (q) { w.push('(name LIKE ? OR art LIKE ?)'); p.push('%'+q+'%', '%'+q+'%'); }
  const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) n FROM products ${where}`).get(...p).n;
  const rows = db.prepare(`SELECT * FROM products ${where} ORDER BY id LIMIT ? OFFSET ?`).all(...p, +limit, +offset);
  res.json({ total, rows });
});

r.get('/groups', (req, res) => res.json({
  groups: db.prepare('SELECT * FROM groups').all(),
  subs: db.prepare('SELECT * FROM subs').all(),
}));

// Правка товара (нужно право catalog)
r.put('/:id', auth, require('catalog'), (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Не найден' });
  const { name, price, unit, art } = req.body || {};
  db.prepare('UPDATE products SET name=?,price=?,unit=?,art=? WHERE id=?')
    .run(name??cur.name, price==null?cur.price:+price, unit??cur.unit, art??cur.art, req.params.id);
  res.json({ ok: true });
});

// Загрузка картинки в карточку товара
r.post('/:id/image', auth, require('catalog'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
  const cur = db.prepare('SELECT image FROM products WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Товар не найден' });
  if (cur.image) { try { fs.unlinkSync(path.join(UP, cur.image)); } catch {} }
  db.prepare('UPDATE products SET image=? WHERE id=?').run(req.file.filename, req.params.id);
  res.json({ ok: true, image: req.file.filename, url: '/uploads/' + req.file.filename });
});

r.delete('/:id/image', auth, require('catalog'), (req, res) => {
  const cur = db.prepare('SELECT image FROM products WHERE id=?').get(req.params.id);
  if (cur?.image) { try { fs.unlinkSync(path.join(UP, cur.image)); } catch {} }
  db.prepare('UPDATE products SET image=NULL WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
