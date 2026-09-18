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

// Галерея: несколько дополнительных фото товара
r.get('/:id/gallery', (req, res) => {
  const main = db.prepare('SELECT image FROM products WHERE id=?').get(req.params.id);
  const g = db.prepare('SELECT id,file FROM product_images WHERE product_id=? ORDER BY sort,id').all(req.params.id);
  res.json({ main: main?.image ? '/uploads/' + main.image : null,
    gallery: g.map(x => ({ id: x.id, url: '/uploads/' + x.file })) });
});

r.post('/:id/gallery', auth, require('catalog'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
  if (!db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id)) return res.status(404).json({ error: 'Товар не найден' });
  const id = db.prepare('INSERT INTO product_images(product_id,file) VALUES(?,?)').run(req.params.id, req.file.filename).lastInsertRowid;
  res.json({ ok: true, id, url: '/uploads/' + req.file.filename });
});

r.delete('/gallery/:imgId', auth, require('catalog'), (req, res) => {
  const img = db.prepare('SELECT file FROM product_images WHERE id=?').get(req.params.imgId);
  if (img) { try { fs.unlinkSync(path.join(UP, img.file)); } catch {} }
  db.prepare('DELETE FROM product_images WHERE id=?').run(req.params.imgId);
  res.json({ ok: true });
});

export default r;
