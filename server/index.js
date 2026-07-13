import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authR from './routes/auth.js';
import empR from './routes/employees.js';
import cliR from './routes/clients.js';
import dealR from './routes/deals.js';
import ordR from './routes/orders.js';
import prodR from './routes/products.js';
import repR from './routes/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authR);
app.use('/api/employees', empR);
app.use('/api/clients', cliR);
app.use('/api/deals', dealR);
app.use('/api/orders', ordR);
app.use('/api/products', prodR);
app.use('/api/reports', repR);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Загруженные фото товаров
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), { maxAge: '7d' }));
// Админ-панель (SPA)
app.use('/admin', express.static(path.join(ROOT, 'admin')));
// Публичная витрина (существующий статический сайт)
app.use('/', express.static(ROOT, { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('КРЕПОЛИТ CRM на http://localhost:' + PORT + '  (админка: /admin)'));
