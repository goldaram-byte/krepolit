import { Router } from 'express';
import { db, STAGE_LABELS, ORDER_LABELS } from '../db.js';
import { auth, scope } from '../auth.js';
const r = Router();
r.use(auth);

const BOM = '﻿';
const cell = v => { v = v==null?'':String(v); return /[";\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; };
const csv = (rows, cols) => BOM + [cols.map(c=>c[0]).join(';')]
  .concat(rows.map(r => cols.map(c => cell(typeof c[1]==='function'?c[1](r):r[c[1]])).join(';'))).join('\r\n');
function send(res, name, text) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.send(text);
}

r.get('/clients.csv', (req, res) => {
  const s = scope(req.user, 'clients');
  const rows = db.prepare(`SELECT c.*, e.name AS manager FROM clients c LEFT JOIN employees e ON e.id=c.manager_id WHERE ${s.where} ORDER BY c.id`).all(...s.params);
  send(res, 'clients.csv', csv(rows, [['ID','id'],['Имя','name'],['Компания','company'],['Телефон','phone'],['Email','email'],['ИНН','inn'],['Менеджер','manager'],['Источник','source'],['Создан','created_at']]));
});

r.get('/orders.csv', (req, res) => {
  const s = scope(req.user, 'orders');
  const rows = db.prepare(`SELECT o.*, e.name AS manager, c.name AS client FROM orders o LEFT JOIN employees e ON e.id=o.manager_id LEFT JOIN clients c ON c.id=o.client_id WHERE ${s.where} ORDER BY o.id`).all(...s.params);
  send(res, 'orders.csv', csv(rows, [['Номер','number'],['Клиент','client'],['Менеджер','manager'],['Статус',r=>ORDER_LABELS[r.status]||r.status],['Позиций',r=>JSON.parse(r.items||'[]').length],['Сумма','total'],['Создан','created_at']]));
});

r.get('/deals.csv', (req, res) => {
  const s = scope(req.user, 'deals');
  const rows = db.prepare(`SELECT d.*, e.name AS manager, c.name AS client FROM deals d LEFT JOIN employees e ON e.id=d.manager_id LEFT JOIN clients c ON c.id=d.client_id WHERE ${s.where} ORDER BY d.id`).all(...s.params);
  send(res, 'deals.csv', csv(rows, [['Сделка','title'],['Клиент','client'],['Менеджер','manager'],['Этап',r=>STAGE_LABELS[r.stage]||r.stage],['Сумма','amount'],['Источник','source'],['Создана','created_at']]));
});

// Печатная форма: КП или счёт по заказу (?type=kp|invoice)
r.get('/order/:id/doc', (req, res) => {
  const o = db.prepare(`SELECT o.*, c.name AS client, c.company, c.inn, c.phone, e.name AS manager FROM orders o
    LEFT JOIN clients c ON c.id=o.client_id LEFT JOIN employees e ON e.id=o.manager_id WHERE o.id=?`).get(req.params.id);
  if (!o) return res.status(404).send('Заказ не найден');
  const isKP = req.query.type === 'kp';
  const items = JSON.parse(o.items || '[]');
  const money = n => (Number(n)||0).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
  const rows = items.map((it,i) => `<tr><td>${i+1}</td><td>${it.name||''}</td><td>${it.unit||''}</td>
    <td class="r">${it.qty||0}</td><td class="r">${money(it.price)}</td><td class="r">${money((+it.price||0)*(+it.qty||0))}</td></tr>`).join('');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${isKP?'Коммерческое предложение':'Счёт'} ${o.number}</title>
  <style>body{font-family:Arial,sans-serif;color:#101623;max-width:800px;margin:0 auto;padding:30px}
  h1{font-size:22px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #0f1b2d;padding-bottom:12px;margin-bottom:16px}
  .brand{font-weight:900;font-size:22px}.brand span{color:#ff6a00}
  table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ccc;padding:7px 9px;font-size:13px}
  th{background:#0f1b2d;color:#fff}.r{text-align:right}.tot{font-size:18px;font-weight:800;text-align:right;margin-top:8px}
  .meta{font-size:13px;color:#333;line-height:1.6}.print{margin:14px 0}@media print{.print{display:none}}
  button{background:#ff6a00;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer}</style></head>
  <body><div class="print"><button onclick="print()">🖨 Печать / Сохранить в PDF</button></div>
  <div class="top"><div><div class="brand">КРЕПО<span>ЛИТ</span></div><div class="meta">Крепёж и метизы · Королёв · +7 909 933 24 64</div></div>
    <div class="meta" style="text-align:right"><b>${isKP?'Коммерческое предложение':'Счёт'} № ${o.number}</b><br>от ${new Date(o.created_at.replace(' ','T')).toLocaleDateString('ru-RU')}</div></div>
  <div class="meta"><b>Клиент:</b> ${o.client||'—'}${o.company?', '+o.company:''}${o.inn?' · ИНН '+o.inn:''}${o.phone?' · '+o.phone:''}<br>
    <b>Менеджер:</b> ${o.manager||'—'}</div>
  <table><thead><tr><th>№</th><th>Наименование</th><th>Ед.</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>${rows||'<tr><td colspan=6>Нет позиций</td></tr>'}</tbody></table>
  <div class="tot">Итого: ${money(o.total)} ₽</div>
  <div class="meta" style="margin-top:20px">${isKP?'Предложение действительно 14 дней. Цены указаны с учётом НДС.':'Оплата в течение 3 банковских дней. Товар отгружается со склада в Королёве.'}</div>
  </body></html>`);
});

export default r;
