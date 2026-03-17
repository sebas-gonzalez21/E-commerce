const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all('SELECT id, nombre, email, creado_en FROM usuarios', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const { nombre, email, password } = req.body;
  db.run('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
    [nombre, email, password], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, nombre, email });
    });
});

router.put('/:id', (req, res) => {
  const { nombre, email, password } = req.body;
  db.run('UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?',
    [nombre, email, password, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes > 0 });
    });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;