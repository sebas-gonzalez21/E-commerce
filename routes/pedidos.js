const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all(`SELECT pedidos.*, usuarios.nombre AS usuario 
          FROM pedidos LEFT JOIN usuarios ON pedidos.usuario_id = usuarios.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get(`SELECT pedidos.*, usuarios.nombre AS usuario 
          FROM pedidos LEFT JOIN usuarios ON pedidos.usuario_id = usuarios.id
          WHERE pedidos.id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const { usuario_id, total, estado } = req.body;
  db.run('INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, ?)',
    [usuario_id, total, estado || 'pendiente'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, usuario_id, total });
    });
});

router.put('/:id', (req, res) => {
  const { usuario_id, total, estado } = req.body;
  db.run('UPDATE pedidos SET usuario_id = ?, total = ?, estado = ? WHERE id = ?',
    [usuario_id, total, estado, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes > 0 });
    });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM pedidos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;