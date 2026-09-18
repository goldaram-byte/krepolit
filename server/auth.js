// Авторизация (JWT в httpOnly-cookie) + проверка ролей и прав доступа.
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const SECRET = process.env.JWT_SECRET || 'krepolit-dev-secret-change-me';
const COOKIE = 'krepolit_token';

export const hash = (p) => bcrypt.hashSync(p, 10);
export const check = (p, h) => bcrypt.compareSync(p, h);

export function sign(emp) {
  return jwt.sign({ id: emp.id, role: emp.role }, SECRET, { expiresIn: '7d' });
}
export function setAuthCookie(res, token) {
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5 });
}
export function clearAuthCookie(res) { res.clearCookie(COOKIE); }

// Кладёт req.user (сотрудник) или 401
export function auth(req, res, next) {
  const token = req.cookies?.[COOKIE] || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const p = jwt.verify(token, SECRET);
    const emp = db.prepare('SELECT id,name,email,role,perms,active FROM employees WHERE id=?').get(p.id);
    if (!emp || !emp.active) return res.status(401).json({ error: 'Доступ отключён' });
    emp.perms = JSON.parse(emp.perms || '{}');
    req.user = emp;
    next();
  } catch {
    return res.status(401).json({ error: 'Сессия истекла' });
  }
}

export const isAdmin = (u) => u.role === 'admin';

// Требует конкретное право (или роль admin). area: 'catalog'|'reports'|'employees'
export function require(area) {
  return (req, res, next) => {
    const u = req.user;
    if (isAdmin(u) || u.perms?.[area] === true) return next();
    return res.status(403).json({ error: 'Недостаточно прав' });
  };
}

// Ограничение видимости записей: admin и perms[area]==='all' видят всё,
// иначе — только свои (manager_id = user.id). Возвращает {sql, params}.
export function scope(u, area, col = 'manager_id') {
  if (isAdmin(u) || u.perms?.[area] === 'all') return { where: '1=1', params: [] };
  return { where: `${col} = ?`, params: [u.id] };
}

// Может ли пользователь трогать запись с данным manager_id
export function canTouch(u, area, ownerId) {
  return isAdmin(u) || u.perms?.[area] === 'all' || ownerId === u.id;
}
