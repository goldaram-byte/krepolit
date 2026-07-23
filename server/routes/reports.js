import { Router } from 'express';
import { db, STAGES, STAGE_LABELS, ORDER_STATUSES, ORDER_LABELS } from '../db.js';
import { auth, require } from '../auth.js';
const r = Router();
r.use(auth, require('reports'));

r.get('/dashboard', (req, res) => {
  const num = (q,...p) => db.prepare(q).get(...p);
  const all = (q,...p) => db.prepare(q).all(...p);
  const catalog = num('SELECT COUNT(*) n, ROUND(AVG(price),2) avg FROM products');
  res.json({
    totals: {
      clients: num('SELECT COUNT(*) n FROM clients').n,
      deals: num('SELECT COUNT(*) n FROM deals').n,
      orders: num('SELECT COUNT(*) n FROM orders').n,
      employees: num('SELECT COUNT(*) n FROM employees WHERE active=1').n,
      products: catalog.n, avgPrice: catalog.avg,
      revenue: num("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status IN ('shipped','done')").s,
      wonAmount: num("SELECT COALESCE(SUM(amount),0) s FROM deals WHERE stage='won'").s,
    },
    funnel: STAGES.map(st => ({ stage: st, label: STAGE_LABELS[st],
      count: num('SELECT COUNT(*) n FROM deals WHERE stage=?', st).n,
      amount: num('SELECT COALESCE(SUM(amount),0) s FROM deals WHERE stage=?', st).s })),
    ordersByStatus: ORDER_STATUSES.map(st => ({ status: st, label: ORDER_LABELS[st],
      count: num('SELECT COUNT(*) n FROM orders WHERE status=?', st).n,
      total: num('SELECT COALESCE(SUM(total),0) s FROM orders WHERE status=?', st).s })),
    byManager: all(`SELECT e.name AS manager,
      (SELECT COUNT(*) FROM clients WHERE manager_id=e.id) clients,
      (SELECT COUNT(*) FROM deals WHERE manager_id=e.id) deals,
      (SELECT COUNT(*) FROM orders WHERE manager_id=e.id) orders,
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE manager_id=e.id AND status IN ('shipped','done')) revenue,
      (SELECT COALESCE(SUM(amount),0) FROM deals WHERE manager_id=e.id AND stage='won') won
      FROM employees e WHERE e.active=1 ORDER BY revenue DESC`),
  });
});

export default r;
