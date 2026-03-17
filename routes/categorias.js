const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - listar todas
router.get('/', (req, res) => {
  db.all('SELECT * FROM categorias', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - obtener una
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM categorias WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  });
});

// POST - crear
router.post('/', (req, res) => {
  const { nombre } = req.body;
  db.run('INSERT INTO categorias (nombre) VALUES (?)', [nombre], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, nombre });
  });
});

// PUT - actualizar
router.put('/:id', (req, res) => {
  const { nombre } = req.body;
  db.run('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ actualizado: this.changes > 0 });
  });
});

// DELETE - eliminar
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM categorias WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;