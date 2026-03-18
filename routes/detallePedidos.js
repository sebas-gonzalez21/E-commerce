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
  db.run(`INSERT OR IGNORE INTO detallePedidos (id, pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)`,
    [d.id, d.pedido_id, d.producto_id, d.cantidad, d.precio_unitario]);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`detallePedidos.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  db.all(`SELECT detallePedidos.*, productos.nombre AS producto 
          FROM detallePedidos LEFT JOIN productos ON detallePedidos.producto_id = productos.id
          ${where}`, valores, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM detallePedidos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const { pedido_id, producto_id, cantidad, precio_unitario } = req.body;

  if (!pedido_id || !producto_id || cantidad === undefined || precio_unitario === undefined)
    return res.status(400).json({ error: 'Los campos pedido_id, producto_id, cantidad y precio_unitario son obligatorios' });
  if (isNaN(pedido_id))
    return res.status(400).json({ error: 'El pedido_id debe ser un número válido' });
  if (isNaN(producto_id))
    return res.status(400).json({ error: 'El producto_id debe ser un número válido' });
  if (isNaN(cantidad) || cantidad <= 0)
    return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
  if (isNaN(precio_unitario) || precio_unitario < 0)
    return res.status(400).json({ error: 'El precio_unitario debe ser un número válido mayor o igual a 0' });

  db.get('SELECT id FROM pedidos WHERE id = ?', [pedido_id], (err, pedido) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });

    db.get('SELECT id FROM productos WHERE id = ?', [producto_id], (err, producto) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });

      db.run('INSERT INTO detallePedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [pedido_id, producto_id, cantidad, precio_unitario], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ id: this.lastID, pedido_id, producto_id, cantidad, precio_unitario });
        });
    });
  });
});

router.put('/:id', (req, res) => {
  const { pedido_id, producto_id, cantidad, precio_unitario } = req.body;

  if (!pedido_id || !producto_id || cantidad === undefined || precio_unitario === undefined)
    return res.status(400).json({ error: 'Los campos pedido_id, producto_id, cantidad y precio_unitario son obligatorios' });
  if (isNaN(cantidad) || cantidad <= 0)
    return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
  if (isNaN(precio_unitario) || precio_unitario < 0)
    return res.status(400).json({ error: 'El precio_unitario debe ser un número válido mayor o igual a 0' });

  db.get('SELECT id FROM detallePedidos WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Detalle de pedido no encontrado' });

    db.get('SELECT id FROM pedidos WHERE id = ?', [pedido_id], (err, pedido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });

      db.get('SELECT id FROM productos WHERE id = ?', [producto_id], (err, producto) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });

        db.run('UPDATE detallePedidos SET pedido_id = ?, producto_id = ?, cantidad = ?, precio_unitario = ? WHERE id = ?',
          [pedido_id, producto_id, cantidad, precio_unitario, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ actualizado: this.changes > 0 });
          });
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM detallePedidos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //detallePedidos