const express = require('express');
const router = express.Router();
const db = require('../db');

const detallesIniciales = [
  { id: 1, pedido_id: 1, producto_id: 1, cantidad: 1, precio_unitario: 89900  },
  { id: 2, pedido_id: 1, producto_id: 2, cantidad: 1, precio_unitario: 35000  },
  { id: 3, pedido_id: 2, producto_id: 4, cantidad: 1, precio_unitario: 45000  },
  { id: 4, pedido_id: 3, producto_id: 3, cantidad: 1, precio_unitario: 159900 },
];
detallesIniciales.forEach(d => {
  db.prepare(`INSERT OR IGNORE INTO detallePedidos (id, pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)`)
    .run(d.id, d.pedido_id, d.producto_id, d.cantidad, d.precio_unitario);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`detallePedidos.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  try {
    const rows = db.prepare(`SELECT detallePedidos.*, productos.nombre AS producto 
      FROM detallePedidos LEFT JOIN productos ON detallePedidos.producto_id = productos.id ${where}`).all(valores);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM detallePedidos WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { pedido_id, producto_id, cantidad, precio_unitario } = req.body;
  if (!pedido_id || !producto_id || cantidad === undefined || precio_unitario === undefined)
    return res.status(400).json({ error: 'Los campos pedido_id, producto_id, cantidad y precio_unitario son obligatorios' });
  if (isNaN(pedido_id)) return res.status(400).json({ error: 'El pedido_id debe ser un número válido' });
  if (isNaN(producto_id)) return res.status(400).json({ error: 'El producto_id debe ser un número válido' });
  if (isNaN(cantidad) || cantidad <= 0) return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
  if (isNaN(precio_unitario) || precio_unitario < 0) return res.status(400).json({ error: 'El precio_unitario debe ser un número válido mayor o igual a 0' });
  try {
    const pedido = db.prepare('SELECT id FROM pedidos WHERE id = ?').get(pedido_id);
    if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });
    const producto = db.prepare('SELECT id FROM productos WHERE id = ?').get(producto_id);
    if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });
    const result = db.prepare('INSERT INTO detallePedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)')
      .run(pedido_id, producto_id, cantidad, precio_unitario);
    res.status(201).json({ id: result.lastInsertRowid, pedido_id, producto_id, cantidad, precio_unitario });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { pedido_id, producto_id, cantidad, precio_unitario } = req.body;
  if (!pedido_id || !producto_id || cantidad === undefined || precio_unitario === undefined)
    return res.status(400).json({ error: 'Los campos pedido_id, producto_id, cantidad y precio_unitario son obligatorios' });
  if (isNaN(cantidad) || cantidad <= 0) return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
  if (isNaN(precio_unitario) || precio_unitario < 0) return res.status(400).json({ error: 'El precio_unitario debe ser un número válido mayor o igual a 0' });
  try {
    const existe = db.prepare('SELECT id FROM detallePedidos WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ error: 'Detalle de pedido no encontrado' });
    const pedido = db.prepare('SELECT id FROM pedidos WHERE id = ?').get(pedido_id);
    if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });
    const producto = db.prepare('SELECT id FROM productos WHERE id = ?').get(producto_id);
    if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });
    const result = db.prepare('UPDATE detallePedidos SET pedido_id = ?, producto_id = ?, cantidad = ?, precio_unitario = ? WHERE id = ?')
      .run(pedido_id, producto_id, cantidad, precio_unitario, req.params.id);
    res.json({ actualizado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM detallePedidos WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Detalle de pedido no encontrado' });
    res.json({ eliminado: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;