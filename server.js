/**
 * server.js — E-commerce backend (CodeAlpha Task 1)
 * Express REST API: products, auth (register/login), and order processing.
 * Data is persisted in data.json via db.js.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const { load, save, seedIfEmpty } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha-dev-secret-change-me';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

seedIfEmpty();

// ---- auth helpers ---------------------------------------------------------
function sign(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
function auth(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Please log in again.' });
  }
}

// ---- products -------------------------------------------------------------
app.get('/api/products', (req, res) => {
  const db = load();
  let items = db.products;
  const { q, category } = req.query;
  if (q) items = items.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  if (category && category !== 'All') items = items.filter(p => p.category === category);
  res.json(items);
});

app.get('/api/products/:id', (req, res) => {
  const db = load();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

app.get('/api/categories', (req, res) => {
  const db = load();
  res.json(['All', ...new Set(db.products.map(p => p.category))]);
});

// ---- auth -----------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are all required.' });
  const db = load();
  if (db.users.find(u => u.email === email.toLowerCase()))
    return res.status(409).json({ error: 'An account with that email already exists.' });

  const user = {
    id: 'u' + crypto.randomBytes(4).toString('hex'),
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  save(db);

  const token = sign(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = load();
  const user = db.users.find(u => u.email === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash))
    return res.status(401).json({ error: 'Email or password is incorrect.' });

  const token = sign(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => res.json({ user: req.user }));

// ---- orders (order processing) -------------------------------------------
app.post('/api/orders', auth, (req, res) => {
  const { items } = req.body; // [{ id, qty }]
  if (!Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'Your cart is empty.' });

  const db = load();
  const lines = [];
  let total = 0;

  for (const { id, qty } of items) {
    const product = db.products.find(p => p.id === id);
    if (!product) return res.status(400).json({ error: 'A product in your cart no longer exists.' });
    if (product.stock < qty)
      return res.status(400).json({ error: `Only ${product.stock} of ${product.name} left in stock.` });
    lines.push({ id: product.id, name: product.name, price: product.price, qty });
    total += product.price * qty;
  }

  // decrement stock — part of order processing
  for (const { id, qty } of items) {
    const product = db.products.find(p => p.id === id);
    product.stock -= qty;
  }

  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    userId: req.user.id,
    items: lines,
    total,
    status: 'Confirmed',
    placedAt: new Date().toISOString()
  };
  db.orders.push(order);
  save(db);
  res.status(201).json(order);
});

app.get('/api/orders', auth, (req, res) => {
  const db = load();
  res.json(db.orders.filter(o => o.userId === req.user.id).reverse());
});

app.listen(PORT, () => console.log(`E-commerce store running at http://localhost:${PORT}`));
