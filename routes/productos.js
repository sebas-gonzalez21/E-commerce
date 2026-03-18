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
  db.run(`INSERT OR IGNORE INTO productos (id, nombre, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?)`,
    [p.id, p.nombre, p.precio, p.stock, p.categoria_id]);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`productos.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  db.all(`SELECT productos.*, categorias.nombre AS categoria 
          FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id
          ${where}`, valores, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get(`SELECT productos.*, categorias.nombre AS categoria 
          FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id
          WHERE productos.id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
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

  db.get('SELECT id FROM categorias WHERE id = ?', [categoria_id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(400).json({ error: `No existe una categoría con id ${categoria_id}` });

    db.run('INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES (?, ?, ?, ?)',
      [nombre.trim(), precio, stock, categoria_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, nombre, precio, stock, categoria_id });
      });
  });
});

router.put('/:id', (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;

  if (!nombre || precio === undefined || stock === undefined || !categoria_id)
    return res.status(400).json({ error: 'Los campos nombre, precio, stock y categoria_id son obligatorios' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  if (isNaN(precio) || precio < 0)
    return res.status(400).json({ error: 'El precio debe ser un número válido mayor o igual a 0' });
  if (isNaN(stock) || stock < 0)
    return res.status(400).json({ error: 'El stock debe ser un número válido mayor o igual a 0' });

  db.get('SELECT id FROM productos WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

    db.get('SELECT id FROM categorias WHERE id = ?', [categoria_id], (err, cat) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!cat) return res.status(400).json({ error: `No existe una categoría con id ${categoria_id}` });

      db.run('UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria_id = ? WHERE id = ?',
        [nombre.trim(), precio, stock, categoria_id, req.params.id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ actualizado: this.changes > 0 });
        });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM productos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //productos
