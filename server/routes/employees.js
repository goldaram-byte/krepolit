import { Router } from 'express';
import { db, DEFAULT_MANAGER_PERMS } from '../db.js';
import { auth, require, hash, isAdmin } from '../auth.js';
const r = Router();
r.use(auth, require('employees'));

r.get('/', (req, res) => {
  const rows = db.prepare('SELECT id,name,email,role,perms,active,created_at FROM employees ORDER BY id').all();
  res.json(rows.map(e => ({ ...e, perms: JSON.parse(e.perms||'{}') })));
});

r.post('/', (req, res) => {
  const { name, email, password, role, perms } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
  const p = JSON.stringify(role === 'admin' ? {} : { ...DEFAULT_MANAGER_PERMS, ...(perms||{}) });
  try {
    const info = db.prepare('INSERT INTO employees(name,email,pass,role,perms) VALUES(?,?,?,?,?)')
      .run(name, String(email).toLowerCase().trim(), hash(password), role === 'admin' ? 'admin' : 'manager', p);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'Email уже используется' : e.message });
  }
});

r.put('/:id', (req, res) => {
  const { name, email, role, perms, active, password } = req.body || {};
  const cur = db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Не найден' });
  const p = role === 'admin' ? '{}' : JSON.stringify({ ...DEFAULT_MANAGER_PERMS, ...(perms||JSON.parse(cur.perms||'{}')) });
  db.prepare('UPDATE employees SET name=?,email=?,role=?,perms=?,active=? WHERE id=?')
    .run(name??cur.name, (email??cur.email).toLowerCase(), role??cur.role, p, active==null?cur.active:(active?1:0), req.params.id);
  if (password) db.prepare('UPDATE employees SET pass=? WHERE id=?').run(hash(password), req.params.id);
  res.json({ ok: true });
});

r.delete('/:id', (req, res) => {
  if (+req.params.id === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' });
  db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
