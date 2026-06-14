/**
 * db.js — a tiny, dependency-free JSON-file database.
 * Stores everything in data.json. Good enough for an internship-scale app,
 * and it runs anywhere with no native build step.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { users: [], products: [], orders: [] };
  }
}

function save(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

// Seed a catalogue the first time the app runs.
function seedIfEmpty() {
  const db = load();
  if (db.products.length) return;

  db.products = [
    { id: 'p1', name: 'Aether Wireless Headphones', price: 7999, category: 'Audio',
      image: '🎧', stock: 25,
      description: 'Over-ear headphones with active noise cancellation and 40-hour battery life. Plush memory-foam cushions for all-day comfort.' },
    { id: 'p2', name: 'Nimbus Mechanical Keyboard', price: 5499, category: 'Desk',
      image: '⌨️', stock: 40,
      description: 'Hot-swappable 75% mechanical keyboard with tactile switches, PBT keycaps and per-key RGB.' },
    { id: 'p3', name: 'Lumen Desk Lamp', price: 2299, category: 'Desk',
      image: '💡', stock: 60,
      description: 'Adjustable LED desk lamp with five colour temperatures and a USB-C charging port in the base.' },
    { id: 'p4', name: 'Drift Ergonomic Mouse', price: 3199, category: 'Desk',
      image: '🖱️', stock: 35,
      description: 'Vertical ergonomic mouse that keeps your wrist neutral. Silent clicks, 4000 DPI sensor.' },
    { id: 'p5', name: 'Cobalt 4K Monitor', price: 23999, category: 'Displays',
      image: '🖥️', stock: 15,
      description: '27-inch 4K IPS display with 99% sRGB coverage, USB-C 90W power delivery and a height-adjustable stand.' },
    { id: 'p6', name: 'Pulse Smartwatch', price: 12499, category: 'Wearables',
      image: '⌚', stock: 22,
      description: 'Fitness smartwatch with heart-rate, SpO2, sleep tracking and a seven-day battery.' },
    { id: 'p7', name: 'Echo Portable Speaker', price: 4499, category: 'Audio',
      image: '🔊', stock: 50,
      description: 'Pocket Bluetooth speaker with surprising bass, IPX7 waterproofing and 18 hours of playback.' },
    { id: 'p8', name: 'Vault Power Bank 20K', price: 2799, category: 'Power',
      image: '🔋', stock: 80,
      description: '20,000 mAh power bank with 65W fast charging and dual USB-C ports. Charges a laptop and a phone at once.' },
    { id: 'p9', name: 'Forge USB-C Hub', price: 3499, category: 'Power',
      image: '🔌', stock: 45,
      description: '8-in-1 hub: HDMI 4K, gigabit ethernet, SD reader and three USB-A ports from a single USB-C cable.' },
    { id: 'p10', name: 'Glide Laptop Stand', price: 1899, category: 'Desk',
      image: '💻', stock: 70,
      description: 'Aluminium laptop stand that lifts your screen to eye level and folds flat for travel.' },
    { id: 'p11', name: 'Spark Webcam 1080p', price: 3899, category: 'Displays',
      image: '📷', stock: 30,
      description: 'Full-HD webcam with auto light correction, dual noise-cancelling mics and a privacy shutter.' },
    { id: 'p12', name: 'Tempo Charging Pad', price: 1599, category: 'Power',
      image: '⚡', stock: 90,
      description: '15W Qi wireless charging pad with a non-slip surface and a fabric finish.' }
  ];
  save(db);
  console.log('Seeded ' + db.products.length + ' products.');
}

module.exports = { load, save, seedIfEmpty, FILE };
