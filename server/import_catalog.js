// Импорт каталога из ../assets/products.js (window.KATALOG) в БД.
import { db } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const js = fs.readFileSync(path.join(__dirname, '..', 'assets', 'products.js'), 'utf8');
const g = {}; new Function('window', js)(g);
const K = g.KATALOG || {};
const tx = db.transaction(() => {
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM groups').run();
  db.prepare('DELETE FROM subs').run();
  const gi = db.prepare('INSERT INTO groups(id,name,icon) VALUES(?,?,?)');
  (K.groups||[]).forEach(x => gi.run(x.id, x.name, x.icon));
  const si = db.prepare('INSERT INTO subs(id,g,name) VALUES(?,?,?)');
  (K.subs||[]).forEach(x => si.run(x.id, x.g, x.name));
  const pi = db.prepare('INSERT INTO products(id,grp,sub,name,art,unit,price,weight,image) VALUES(?,?,?,?,?,?,?,?,?)');
  // image=null: каталожные иллюстрации сайта живут в /images, а админ грузит фото в /uploads
  (K.products||[]).forEach(a => pi.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], null));
});
tx();
console.log('Импортировано: групп', db.prepare('SELECT COUNT(*) n FROM groups').get().n,
  '| подгрупп', db.prepare('SELECT COUNT(*) n FROM subs').get().n,
  '| товаров', db.prepare('SELECT COUNT(*) n FROM products').get().n);
