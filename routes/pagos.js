const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all('SELECT * FROM pagos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM pagos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const { pedido_id, metodo, estado } = req.body;
  db.run('INSERT INTO pagos (pedido_id, metodo, estado) VALUES (?, ?, ?)',
    [pedido_id, metodo, estado || 'pendiente'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, pedido_id, metodo });
    });
});

router.put('/:id', (req, res) => {
  const { pedido_id, metodo, estado } = req.body;
  db.run('UPDATE pagos SET pedido_id = ?, metodo = ?, estado = ? WHERE id = ?',
    [pedido_id, metodo, estado, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes > 0 });
    });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM pagos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;