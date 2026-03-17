const express = require('express');
const router = express.Router();
const db = require('../db');

const categoriasIniciales = [
  { id: 1, nombre: 'Electrónica' },
  { id: 2, nombre: 'Ropa' },
  { id: 3, nombre: 'Hogar y Jardín' },
];
categoriasIniciales.forEach(c => {
  db.run(`INSERT OR IGNORE INTO categorias (id, nombre) VALUES (?, ?)`, [c.id, c.nombre]);
});

// GET - filtro dinámico con Object.entries()
router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  db.all(`SELECT * FROM categorias ${where}`, valores, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM categorias WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  });
});

// POST con validaciones
router.post('/', (req, res) => {
  const { nombre } = req.body;

  if (!nombre)
    return res.status(400).json({ error: 'El campo nombre es obligatorio' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });

  // Unicidad del nombre
  db.get('SELECT id FROM categorias WHERE nombre = ?', [nombre.trim()], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existe) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });

    db.run('INSERT INTO categorias (nombre) VALUES (?)', [nombre.trim()], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, nombre });
    });
  });
});

// PUT con validaciones
router.put('/:id', (req, res) => {
  const { nombre } = req.body;

  if (!nombre)
    return res.status(400).json({ error: 'El campo nombre es obligatorio' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });

  // Verificar que la categoría existe
  db.get('SELECT id FROM categorias WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Categoría no encontrada' });

    // Unicidad excluyendo el mismo registro
    db.get('SELECT id FROM categorias WHERE nombre = ? AND id != ?', [nombre.trim(), req.params.id], (err, duplicado) => {
      if (err) return res.status(500).json({ error: err.message });
      if (duplicado) return res.status(400).json({ error: 'Ya existe otra categoría con ese nombre' });

      db.run('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre.trim(), req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ actualizado: this.changes > 0 });
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM categorias WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //categorias