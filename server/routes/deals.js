import { Router } from 'express';
import { db, STAGES, STAGE_LABELS, logActivity } from '../db.js';
import { auth, scope, canTouch } from '../auth.js';
const r = Router();
r.use(auth);

r.get('/', (req, res) => {
  const s = scope(req.user, 'deals');
  const rows = db.prepare(`SELECT d.*, e.name AS manager, c.name AS client FROM deals d
    LEFT JOIN employees e ON e.id=d.manager_id
    LEFT JOIN clients c ON c.id=d.client_id WHERE ${s.where} ORDER BY d.updated_at DESC`).all(...s.params);
  res.json(rows);
});

r.post('/', (req, res) => {
  const { title, client_id, manager_id, stage, amount, note } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Название сделки обязательно' });
  const mgr = (req.user.perms?.deals === 'all' || req.user.role === 'admin') && manager_id ? manager_id : req.user.id;
  const st = STAGES.includes(stage) ? stage : 'new';
  const info = db.prepare('INSERT INTO deals(title,client_id,manager_id,stage,amount,note) VALUES(?,?,?,?,?,?)')
    .run(title, client_id||null, mgr, st, +amount||0, note||null);
  res.json({ id: info.lastInsertRowid });
});

r.put('/:id', (req, res) => {
  const d = db.prepare('SELECT * FROM deals WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Не найдена' });
  if (!canTouch(req.user, 'deals', d.manager_id)) return res.status(403).json({ error: 'Чужая сделка' });
  const { title, client_id, manager_id, stage, amount, note } = req.body || {};
  const mgr = (req.user.perms?.deals === 'all' || req.user.role === 'admin') ? (manager_id ?? d.manager_id) : d.manager_id;
  const st = stage && STAGES.includes(stage) ? stage : d.stage;
  db.prepare(`UPDATE deals SET title=?,client_id=?,manager_id=?,stage=?,amount=?,note=?,updated_at=datetime('now') WHERE id=?`)
    .run(title??d.title, client_id??d.client_id, mgr, st, amount==null?d.amount:+amount, note??d.note, req.params.id);
  if (st !== d.stage)
    logActivity({ type: 'stage', text: `Этап: ${STAGE_LABELS[d.stage]} → ${STAGE_LABELS[st]}`,
      employee_id: req.user.id, client_id: d.client_id, deal_id: +req.params.id });
  res.json({ ok: true });
});

r.delete('/:id', (req, res) => {
  const d = db.prepare('SELECT * FROM deals WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Не найдена' });
  if (!canTouch(req.user, 'deals', d.manager_id)) return res.status(403).json({ error: 'Чужая сделка' });
  db.prepare('DELETE FROM deals WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
