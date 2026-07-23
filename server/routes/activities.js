import { Router } from 'express';
import { db, logActivity } from '../db.js';
import { auth } from '../auth.js';
const r = Router();
r.use(auth);

// Лента по клиенту или сделке: ?client_id= | ?deal_id=
r.get('/', (req, res) => {
  const { client_id, deal_id } = req.query;
  const where = [], p = [];
  if (client_id) { where.push('a.client_id=?'); p.push(client_id); }
  if (deal_id) { where.push('a.deal_id=?'); p.push(deal_id); }
  if (!where.length) return res.json([]);
  const rows = db.prepare(`SELECT a.*, e.name AS employee FROM activities a
    LEFT JOIN employees e ON e.id=a.employee_id WHERE ${where.join(' OR ')} ORDER BY a.created_at DESC LIMIT 100`).all(...p);
  res.json(rows);
});

r.post('/', (req, res) => {
  const { type, text, client_id, deal_id } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Пустая запись' });
  logActivity({ type: type||'note', text, employee_id: req.user.id, client_id: client_id||null, deal_id: deal_id||null });
  res.json({ ok: true });
});

export default r;
