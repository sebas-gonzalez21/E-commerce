const Database = require('better-sqlite3');

const db = new Database('./ecommerce.db');
console.log('Conectado a SQLite');

db.exec(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
)`);

db.exec(`CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  categoria_id INTEGER,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  total REAL,
  estado TEXT DEFAULT 'pendiente',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS detallePedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER,
  producto_id INTEGER,
  cantidad INTEGER,
  precio_unitario REAL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER,
  metodo TEXT,
  estado TEXT DEFAULT 'pendiente',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS resenas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  producto_id INTEGER,
  calificacion INTEGER,
  comentario TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
)`);

module.exports = db;