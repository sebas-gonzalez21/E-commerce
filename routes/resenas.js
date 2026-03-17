const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all(`SELECT resenas.*, usuarios.nombre AS usuario, productos.nombre AS producto
          FROM resenas 
          LEFT JOIN usuarios ON resenas.usuario_id = usuarios.id
          LEFT JOIN productos ON resenas.producto_id = productos.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM resenas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const { usuario_id, producto_id, calificacion, comentario } = req.body;
  db.run('INSERT INTO resenas (usuario_id, producto_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
    [usuario_id, producto_id, calificacion, comentario], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, usuario_id, producto_id, calificacion });
    });
});

router.put('/:id', (req, res) => {
  const { usuario_id, producto_id, calificacion, comentario } = req.body;
  db.run('UPDATE resenas SET usuario_id = ?, producto_id = ?, calificacion = ?, comentario = ? WHERE id = ?',
    [usuario_id, producto_id, calificacion, comentario, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes > 0 });
    });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM resenas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;