// Начальные данные: администратор + пара менеджеров + демо клиенты/сделки/заказы.
import { db, DEFAULT_MANAGER_PERMS } from './db.js';
import { hash } from './auth.js';

function upsertEmp(name, email, pass, role, perms) {
  const e = db.prepare('SELECT id FROM employees WHERE email=?').get(email);
  if (e) return e.id;
  return db.prepare('INSERT INTO employees(name,email,pass,role,perms) VALUES(?,?,?,?,?)')
    .run(name, email, hash(pass), role, JSON.stringify(perms)).lastInsertRowid;
}

const admin = upsertEmp('Администратор', 'admin@krepolit.ru', 'admin123', 'admin', {});
const m1 = upsertEmp('Менеджер Смирнов', 'smirnov@krepolit.ru', 'manager123', 'manager',
  { ...DEFAULT_MANAGER_PERMS });
const m2 = upsertEmp('Менеджер Кузнецова', 'kuznetsova@krepolit.ru', 'manager123', 'manager',
  { ...DEFAULT_MANAGER_PERMS, orders: 'all' });

if (db.prepare('SELECT COUNT(*) n FROM clients').get().n === 0) {
  const ci = db.prepare('INSERT INTO clients(name,company,phone,email,inn,manager_id,notes) VALUES(?,?,?,?,?,?,?)');
  const c1 = ci.run('Иван Петров', 'ООО СтройМонтаж', '+7 999 123-45-67', 'petrov@sm.ru', '7712345678', m1, 'Постоянный клиент').lastInsertRowid;
  const c2 = ci.run('Ольга Сидорова', 'ИП Сидорова', '+7 903 222-33-44', 'olga@mail.ru', '', m2, '').lastInsertRowid;
  db.prepare('INSERT INTO deals(title,client_id,manager_id,stage,amount,note) VALUES(?,?,?,?,?,?)')
    .run('Анкеры для фасада', c1, m1, 'offer', 85000, 'Отправили КП');
  db.prepare('INSERT INTO deals(title,client_id,manager_id,stage,amount,note) VALUES(?,?,?,?,?,?)')
    .run('Саморезы оптом', c2, m2, 'negotiation', 42000, '');
  db.prepare('INSERT INTO orders(number,client_id,manager_id,status,total,items,comment) VALUES(?,?,?,?,?,?,?)')
    .run('КР-000001', c1, m1, 'processing', 12500,
      JSON.stringify([{ name: 'Болт DIN933 6х12 ОЦ.', art: 'A0000060', qty: 50, price: 145.18, unit: 'кг' }]), '');
}
console.log('Готово. Вход: admin@krepolit.ru / admin123 (админ); smirnov@krepolit.ru / manager123 (менеджер).');
