import { Router } from 'express';
import { db } from '../db.js';
import { check, sign, setAuthCookie, clearAuthCookie, auth } from '../auth.js';
const r = Router();

r.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(String(email||'').toLowerCase().trim());
  if (!emp || !emp.active || !check(password || '', emp.pass))
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  setAuthCookie(res, sign(emp));
  res.json({ id: emp.id, name: emp.name, email: emp.email, role: emp.role, perms: JSON.parse(emp.perms||'{}') });
});

r.post('/logout', (req, res) => { clearAuthCookie(res); res.json({ ok: true }); });

r.get('/me', auth, (req, res) => res.json(req.user));

export default r;
