import { Router } from 'express';
import { db, logActivity } from '../db.js';
import { auth, isAdmin } from '../auth.js';
const r = Router();
r.use(auth);

// Свои задачи (admin видит все). Фильтры: ?scope=my|all&overdue=1
r.get('/', (req, res) => {
  const u = req.user;
  const where = [], p = [];
  if (!(isAdmin(u) && req.query.scope === 'all')) { where.push('t.employee_id=?'); p.push(u.id); }
  if (req.query.open) where.push('t.done=0');
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`SELECT t.*, c.name AS client, d.title AS deal, e.name AS employee
    FROM tasks t LEFT JOIN clients c ON c.id=t.client_id
    LEFT JOIN deals d ON d.id=t.deal_id LEFT JOIN employees e ON e.id=t.employee_id
    ${w} ORDER BY t.done, (t.due_at IS NULL), t.due_at`).all(...p);
  res.json(rows);
});

r.post('/', (req, res) => {
  const { title, due_at, client_id, deal_id, employee_id } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Название задачи обязательно' });
  const emp = (isAdmin(req.user) && employee_id) ? employee_id : req.user.id;
  const id = db.prepare('INSERT INTO tasks(title,due_at,client_id,deal_id,employee_id) VALUES(?,?,?,?,?)')
    .run(title, due_at || null, client_id || null, deal_id || null, emp).lastInsertRowid;
  if (client_id || deal_id) logActivity({ type: 'task', text: 'Задача: ' + title, employee_id: emp, client_id: client_id||null, deal_id: deal_id||null });
  res.json({ id });
});

r.put('/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Не найдена' });
  if (!isAdmin(req.user) && t.employee_id !== req.user.id) return res.status(403).json({ error: 'Чужая задача' });
  const { title, due_at, done } = req.body || {};
  db.prepare('UPDATE tasks SET title=?,due_at=?,done=? WHERE id=?')
    .run(title??t.title, due_at===undefined?t.due_at:due_at, done==null?t.done:(done?1:0), req.params.id);
  res.json({ ok: true });
});

r.delete('/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Не найдена' });
  if (!isAdmin(req.user) && t.employee_id !== req.user.id) return res.status(403).json({ error: 'Чужая задача' });
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Счётчик активных/просроченных для бейджа
r.get('/badge', (req, res) => {
  const p = isAdmin(req.user) ? [] : [req.user.id];
  const w = isAdmin(req.user) ? '' : 'AND employee_id=?';
  const open = db.prepare(`SELECT COUNT(*) n FROM tasks WHERE done=0 ${w}`).get(...p).n;
  const overdue = db.prepare(`SELECT COUNT(*) n FROM tasks WHERE done=0 AND due_at IS NOT NULL AND due_at < datetime('now') ${w}`).get(...p).n;
  res.json({ open, overdue });
});

export default r;
