const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all(`SELECT detallePedidos.*, productos.nombre AS producto 
          FROM detallePedidos LEFT JOIN productos ON detallePedidos.producto_id = productos.id`, [], (err, rows) => {
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
  db.run('INSERT INTO detallePedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
    [pedido_id, producto_id, cantidad, precio_unitario], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, pedido_id, producto_id, cantidad, precio_unitario });
    });
});

router.put('/:id', (req, res) => {
  const { pedido_id, producto_id, cantidad, precio_unitario } = req.body;
  db.run('UPDATE detallePedidos SET pedido_id = ?, producto_id = ?, cantidad = ?, precio_unitario = ? WHERE id = ?',
    [pedido_id, producto_id, cantidad, precio_unitario, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes > 0 });
    });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM detallePedidos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;