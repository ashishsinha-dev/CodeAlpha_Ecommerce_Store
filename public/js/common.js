// common.js — shared helpers for the storefront (cart, auth, header, toast)

// prices are stored as plain integer rupees
const Money = n => '₹' + n.toLocaleString('en-IN');

const Cart = {
  get: () => JSON.parse(localStorage.getItem('cart') || '[]'),
  set(items) { localStorage.setItem('cart', JSON.stringify(items)); updateCartCount(); },
  count() { return this.get().reduce((s, i) => s + i.qty, 0); },
  add(id, qty = 1) {
    const items = this.get();
    const found = items.find(i => i.id === id);
    if (found) found.qty += qty; else items.push({ id, qty });
    this.set(items);
  },
  setQty(id, qty) {
    let items = this.get();
    if (qty <= 0) items = items.filter(i => i.id !== id);
    else { const f = items.find(i => i.id === id); if (f) f.qty = qty; }
    this.set(items);
  },
  remove(id) { this.set(this.get().filter(i => i.id !== id)); },
  clear() { this.set([]); }
};

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

async function currentUser() {
  try { return (await api('/api/me')).user; } catch { return null; }
}

function toast(msg, isErr = false) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.toggle('err', isErr);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function updateCartCount() {
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = Cart.count());
}

async function renderHeader(active) {
  const user = await currentUser();
  const links = [
    `<a href="/" ${active === 'shop' ? 'style="color:var(--brand)"' : ''}>Shop</a>`,
    user
      ? `<a href="/orders.html" ${active === 'orders' ? 'style="color:var(--brand)"' : ''}>Orders</a>`
      : '',
    user
      ? `<a href="#" id="logoutLink">Log out</a>`
      : `<a href="/login.html">Log in</a>`,
    `<a class="cart-pill" href="/cart.html">Cart <b data-cart-count>0</b></a>`
  ].filter(Boolean).join('');

  document.querySelector('header.site .nav').innerHTML = links;
  if (user) document.querySelector('.nav').insertAdjacentHTML('afterbegin',
    `<span class="muted" style="font-weight:600">Hi, ${user.name.split(' ')[0]}</span>`);

  const lo = document.getElementById('logoutLink');
  if (lo) lo.onclick = async (e) => { e.preventDefault(); await api('/api/auth/logout', { method: 'POST' }); location.href = '/'; };
  updateCartCount();
}

document.addEventListener('DOMContentLoaded', updateCartCount);
