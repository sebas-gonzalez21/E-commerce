const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - listar todos
router.get('/', (req, res) => {
  db.all(`SELECT productos.*, categorias.nombre AS categoria 
          FROM productos 
          LEFT JOIN categorias ON productos.categoria_id = categorias.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - obtener uno
router.get('/:id', (req, res) => {
  db.get(`SELECT productos.*, categorias.nombre AS categoria 
          FROM productos 
          LEFT JOIN categorias ON productos.categoria_id = categorias.id
          WHERE productos.id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

// POST - crear
router.post('/', (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;
  db.run('INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES (?, ?, ?, ?)',
    [nombre, precio, stock, categoria_id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, nombre, precio, stock, categoria_id });
    });
});

// PUT - actualizar
router.put('/:id', (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;
  db.run('UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria_id = ? WHERE id = ?',
    [nombre, precio, stock, categoria_id, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes > 0 });
    });
});

// DELETE - eliminar
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM productos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router;