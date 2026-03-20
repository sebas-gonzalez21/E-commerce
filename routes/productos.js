const express = require('express');
const router = express.Router();
const db = require('../db');

const productosIniciales = [
  { id: 1, nombre: 'Audífonos Bluetooth',  precio: 89900,  stock: 50,  categoria_id: 1 },
  { id: 2, nombre: 'Cargador USB-C',        precio: 35000,  stock: 120, categoria_id: 1 },
  { id: 3, nombre: 'Smartwatch Negro',      precio: 159900, stock: 30,  categoria_id: 1 },
  { id: 4, nombre: 'Camiseta Deportiva',    precio: 45000,  stock: 80,  categoria_id: 2 },
  { id: 5, nombre: 'Chaqueta Impermeable',  precio: 120000, stock: 40,  categoria_id: 2 },
  { id: 6, nombre: 'Lámpara de Escritorio', precio: 62000,  stock: 60,  categoria_id: 3 },
];
productosIniciales.forEach(p => {
  db.prepare(`INSERT OR IGNORE INTO productos (id, nombre, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?)`)
    .run(p.id, p.nombre, p.precio, p.stock, p.categoria_id);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`productos.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  try {
    const rows = db.prepare(`SELECT productos.*, categorias.nombre AS categoria 
      FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id ${where}`).all(valores);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT productos.*, categorias.nombre AS categoria 
      FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id
      WHERE productos.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;
  if (!nombre || precio === undefined || stock === undefined || !categoria_id)
    return res.status(400).json({ error: 'Los campos nombre, precio, stock y categoria_id son obligatorios' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  if (isNaN(precio) || precio < 0)
    return res.status(400).json({ error: 'El precio debe ser un número válido mayor o igual a 0' });
  if (isNaN(stock) || stock < 0)
    return res.status(400).json({ error: 'El stock debe ser un número válido mayor o igual a 0' });
  try {
    const existe = db.prepare('SELECT id FROM categorias WHERE id = ?').get(categoria_id);
    if (!existe) return res.status(400).json({ error: `No existe una categoría con id ${categoria_id}` });
    const result = db.prepare('INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES (?, ?, ?, ?)')
      .run(nombre.trim(), precio, stock, categoria_id);
    res.status(201).json({ id: result.lastInsertRowid, nombre, precio, stock, categoria_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;
  if (!nombre || precio === undefined || stock === undefined || !categoria_id)
    return res.status(400).json({ error: 'Los campos nombre, precio, stock y categoria_id son obligatorios' });
  if (isNaN(precio) || precio < 0)
    return res.status(400).json({ error: 'El precio debe ser un número válido mayor o igual a 0' });
  if (isNaN(stock) || stock < 0)
    return res.status(400).json({ error: 'El stock debe ser un número válido mayor o igual a 0' });
  try {
    const existe = db.prepare('SELECT id FROM productos WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });
    const cat = db.prepare('SELECT id FROM categorias WHERE id = ?').get(categoria_id);
    if (!cat) return res.status(400).json({ error: `No existe una categoría con id ${categoria_id}` });
    const result = db.prepare('UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria_id = ? WHERE id = ?')
      .run(nombre.trim(), precio, stock, categoria_id, req.params.id);
    res.json({ actualizado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
    res.json({ eliminado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;