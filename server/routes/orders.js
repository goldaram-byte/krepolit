import { Router } from 'express';
import { db, ORDER_STATUSES } from '../db.js';
import { auth, scope, canTouch } from '../auth.js';
const r = Router();
r.use(auth);

r.get('/', (req, res) => {
  const s = scope(req.user, 'orders');
  const rows = db.prepare(`SELECT o.*, e.name AS manager, c.name AS client FROM orders o
    LEFT JOIN employees e ON e.id=o.manager_id
    LEFT JOIN clients c ON c.id=o.client_id WHERE ${s.where} ORDER BY o.id DESC`).all(...s.params);
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items||'[]') })));
});

r.post('/', (req, res) => {
  const { client_id, manager_id, status, items, comment } = req.body || {};
  const list = Array.isArray(items) ? items : [];
  const total = list.reduce((s, i) => s + (+i.price||0) * (+i.qty||0), 0);
  const mgr = (req.user.perms?.orders === 'all' || req.user.role === 'admin') && manager_id ? manager_id : req.user.id;
  const st = ORDER_STATUSES.includes(status) ? status : 'new';
  const number = 'КР-' + String(Date.now()).slice(-6);
  const info = db.prepare('INSERT INTO orders(number,client_id,manager_id,status,total,items,comment) VALUES(?,?,?,?,?,?,?)')
    .run(number, client_id||null, mgr, st, total, JSON.stringify(list), comment||null);
  res.json({ id: info.lastInsertRowid, number, total });
});

r.put('/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Не найден' });
  if (!canTouch(req.user, 'orders', o.manager_id)) return res.status(403).json({ error: 'Чужой заказ' });
  const { client_id, manager_id, status, items, comment } = req.body || {};
  const list = Array.isArray(items) ? items : JSON.parse(o.items||'[]');
  const total = list.reduce((s, i) => s + (+i.price||0) * (+i.qty||0), 0);
  const mgr = (req.user.perms?.orders === 'all' || req.user.role === 'admin') ? (manager_id ?? o.manager_id) : o.manager_id;
  const st = status && ORDER_STATUSES.includes(status) ? status : o.status;
  db.prepare('UPDATE orders SET client_id=?,manager_id=?,status=?,total=?,items=?,comment=? WHERE id=?')
    .run(client_id??o.client_id, mgr, st, total, JSON.stringify(list), comment??o.comment, req.params.id);
  res.json({ ok: true, total });
});

r.delete('/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Не найден' });
  if (!canTouch(req.user, 'orders', o.manager_id)) return res.status(403).json({ error: 'Чужой заказ' });
  db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
