import { Router } from 'express';
import { db } from '../db.js';
import { auth, scope, canTouch } from '../auth.js';
const r = Router();
r.use(auth);

r.get('/', (req, res) => {
  const s = scope(req.user, 'clients');
  const rows = db.prepare(`SELECT c.*, e.name AS manager FROM clients c
    LEFT JOIN employees e ON e.id=c.manager_id WHERE ${s.where} ORDER BY c.id DESC`).all(...s.params);
  res.json(rows);
});

r.post('/', (req, res) => {
  const { name, company, phone, email, inn, manager_id, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Имя клиента обязательно' });
  const mgr = (req.user.perms?.clients === 'all' || req.user.role === 'admin') && manager_id ? manager_id : req.user.id;
  const info = db.prepare('INSERT INTO clients(name,company,phone,email,inn,manager_id,notes) VALUES(?,?,?,?,?,?,?)')
    .run(name, company||null, phone||null, email||null, inn||null, mgr, notes||null);
  res.json({ id: info.lastInsertRowid });
});

r.put('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Не найден' });
  if (!canTouch(req.user, 'clients', c.manager_id)) return res.status(403).json({ error: 'Чужой клиент' });
  const { name, company, phone, email, inn, manager_id, notes } = req.body || {};
  const mgr = (req.user.perms?.clients === 'all' || req.user.role === 'admin') ? (manager_id ?? c.manager_id) : c.manager_id;
  db.prepare('UPDATE clients SET name=?,company=?,phone=?,email=?,inn=?,manager_id=?,notes=? WHERE id=?')
    .run(name??c.name, company??c.company, phone??c.phone, email??c.email, inn??c.inn, mgr, notes??c.notes, req.params.id);
  res.json({ ok: true });
});

r.delete('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Не найден' });
  if (!canTouch(req.user, 'clients', c.manager_id)) return res.status(403).json({ error: 'Чужой клиент' });
  db.prepare('DELETE FROM clients WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
