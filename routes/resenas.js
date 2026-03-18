const express = require('express');
const router = express.Router();
const db = require('../db');

const resenasIniciales = [
  { id: 1, usuario_id: 1, producto_id: 1, calificacion: 5, comentario: 'Excelente calidad de sonido, muy cómodos para usar todo el día.' },
  { id: 2, usuario_id: 2, producto_id: 4, calificacion: 4, comentario: 'Buena tela, talla correcta. La recomiendo para entrenar.' },
  { id: 3, usuario_id: 1, producto_id: 2, calificacion: 3, comentario: 'Funciona bien pero el cable es muy corto.' },
  { id: 4, usuario_id: 3, producto_id: 3, calificacion: 5, comentario: 'El smartwatch superó mis expectativas, batería dura bastante.' },
];
resenasIniciales.forEach(r => {
  db.run(`INSERT OR IGNORE INTO resenas (id, usuario_id, producto_id, calificacion, comentario) VALUES (?, ?, ?, ?, ?)`,
    [r.id, r.usuario_id, r.producto_id, r.calificacion, r.comentario]);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`resenas.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  db.all(`SELECT resenas.*, usuarios.nombre AS usuario, productos.nombre AS producto
          FROM resenas
          LEFT JOIN usuarios ON resenas.usuario_id = usuarios.id
          LEFT JOIN productos ON resenas.producto_id = productos.id
          ${where}`, valores, (err, rows) => {
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

  if (!usuario_id || !producto_id || calificacion === undefined || !comentario)
    return res.status(400).json({ error: 'Los campos usuario_id, producto_id, calificacion y comentario son obligatorios' });
  if (isNaN(usuario_id))
    return res.status(400).json({ error: 'El usuario_id debe ser un número válido' });
  if (isNaN(producto_id))
    return res.status(400).json({ error: 'El producto_id debe ser un número válido' });
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5)
    return res.status(400).json({ error: 'La calificacion debe ser un número entre 1 y 5' });
  if (typeof comentario !== 'string' || comentario.trim() === '')
    return res.status(400).json({ error: 'El comentario debe ser un texto válido' });

  db.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (err, usuario) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!usuario) return res.status(400).json({ error: `No existe un usuario con id ${usuario_id}` });

    db.get('SELECT id FROM productos WHERE id = ?', [producto_id], (err, producto) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });

      db.run('INSERT INTO resenas (usuario_id, producto_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
        [usuario_id, producto_id, calificacion, comentario.trim()], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ id: this.lastID, usuario_id, producto_id, calificacion });
        });
    });
  });
});

router.put('/:id', (req, res) => {
  const { usuario_id, producto_id, calificacion, comentario } = req.body;

  if (!usuario_id || !producto_id || calificacion === undefined || !comentario)
    return res.status(400).json({ error: 'Los campos usuario_id, producto_id, calificacion y comentario son obligatorios' });
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5)
    return res.status(400).json({ error: 'La calificacion debe ser un número entre 1 y 5' });
  if (typeof comentario !== 'string' || comentario.trim() === '')
    return res.status(400).json({ error: 'El comentario debe ser un texto válido' });

  db.get('SELECT id FROM resenas WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Reseña no encontrada' });

    db.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (err, usuario) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!usuario) return res.status(400).json({ error: `No existe un usuario con id ${usuario_id}` });

      db.get('SELECT id FROM productos WHERE id = ?', [producto_id], (err, producto) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });

        db.run('UPDATE resenas SET usuario_id = ?, producto_id = ?, calificacion = ?, comentario = ? WHERE id = ?',
          [usuario_id, producto_id, calificacion, comentario.trim(), req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ actualizado: this.changes > 0 });
          });
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM resenas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //resenas
