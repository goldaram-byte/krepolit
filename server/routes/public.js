// Публичные эндпоинты (без авторизации) — заявки с сайта и фото товаров для витрины.
import { Router } from 'express';
import { db, logActivity } from '../db.js';
const r = Router();

// Заявка с витрины -> клиент + сделка в воронке (этап "Новая", источник "сайт")
r.post('/lead', (req, res) => {
  const { name, phone, email, message, source, items } = req.body || {};
  if (!name && !phone) return res.status(400).json({ error: 'Укажите имя или телефон' });
  // назначаем менеджера по кругу среди активных менеджеров (round-robin)
  const mgrs = db.prepare("SELECT id FROM employees WHERE active=1 AND role='manager' ORDER BY id").all();
  let mgr = null;
  if (mgrs.length) {
    const cnt = db.prepare("SELECT COUNT(*) n FROM deals WHERE source='сайт'").get().n;
    mgr = mgrs[cnt % mgrs.length].id;
  }
  // клиент: ищем по телефону, иначе создаём
  let client = phone ? db.prepare('SELECT * FROM clients WHERE phone=?').get(phone) : null;
  if (!client) {
    const id = db.prepare('INSERT INTO clients(name,phone,email,manager_id,source,notes) VALUES(?,?,?,?,?,?)')
      .run(name || 'Клиент с сайта', phone || null, email || null, mgr, 'сайт', message || null).lastInsertRowid;
    client = { id };
  }
  const list = Array.isArray(items) ? items : [];
  const amount = list.reduce((s, i) => s + (+i.price || 0) * (+i.qty || 1), 0);
  const title = (source || 'Заявка с сайта') + (name ? ' — ' + name : '');
  const dealId = db.prepare('INSERT INTO deals(title,client_id,manager_id,stage,amount,source,note) VALUES(?,?,?,?,?,?,?)')
    .run(title, client.id, mgr, 'new', amount, 'сайт', message || null).lastInsertRowid;
  if (list.length) {
    const num = 'КР-' + String(Date.now()).slice(-6);
    db.prepare('INSERT INTO orders(number,client_id,manager_id,status,total,items,comment) VALUES(?,?,?,?,?,?,?)')
      .run(num, client.id, mgr, 'new', amount, JSON.stringify(list), 'Из корзины сайта');
  }
  logActivity({ type: 'lead', text: 'Заявка с сайта: ' + (message || title), client_id: client.id, deal_id: dealId, employee_id: mgr });
  res.json({ ok: true, message: 'Заявка принята, менеджер свяжется с вами' });
});

// Фото товара для публичной карточки
r.get('/product/:id/images', (req, res) => {
  const main = db.prepare('SELECT image FROM products WHERE id=?').get(req.params.id);
  const gallery = db.prepare('SELECT file FROM product_images WHERE product_id=? ORDER BY sort,id').all(req.params.id);
  const files = [];
  if (main?.image) files.push('/uploads/' + main.image);
  gallery.forEach(g => files.push('/uploads/' + g.file));
  res.json({ images: files });
});

export default r;
