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
  db.prepare(`INSERT OR IGNORE INTO resenas (id, usuario_id, producto_id, calificacion, comentario) VALUES (?, ?, ?, ?, ?)`)
    .run(r.id, r.usuario_id, r.producto_id, r.calificacion, r.comentario);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`resenas.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  try {
    const rows = db.prepare(`SELECT resenas.*, usuarios.nombre AS usuario, productos.nombre AS producto
      FROM resenas
      LEFT JOIN usuarios ON resenas.usuario_id = usuarios.id
      LEFT JOIN productos ON resenas.producto_id = productos.id
      ${where}`).all(valores);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM resenas WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { usuario_id, producto_id, calificacion, comentario } = req.body;
  if (!usuario_id || !producto_id || calificacion === undefined || !comentario)
    return res.status(400).json({ error: 'Los campos usuario_id, producto_id, calificacion y comentario son obligatorios' });
  if (isNaN(usuario_id)) return res.status(400).json({ error: 'El usuario_id debe ser un número válido' });
  if (isNaN(producto_id)) return res.status(400).json({ error: 'El producto_id debe ser un número válido' });
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5)
    return res.status(400).json({ error: 'La calificacion debe ser un número entre 1 y 5' });
  if (typeof comentario !== 'string' || comentario.trim() === '')
    return res.status(400).json({ error: 'El comentario debe ser un texto válido' });
  try {
    const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(usuario_id);
    if (!usuario) return res.status(400).json({ error: `No existe un usuario con id ${usuario_id}` });
    const producto = db.prepare('SELECT id FROM productos WHERE id = ?').get(producto_id);
    if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });
    const result = db.prepare('INSERT INTO resenas (usuario_id, producto_id, calificacion, comentario) VALUES (?, ?, ?, ?)')
      .run(usuario_id, producto_id, calificacion, comentario.trim());
    res.status(201).json({ id: result.lastInsertRowid, usuario_id, producto_id, calificacion });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { usuario_id, producto_id, calificacion, comentario } = req.body;
  if (!usuario_id || !producto_id || calificacion === undefined || !comentario)
    return res.status(400).json({ error: 'Los campos usuario_id, producto_id, calificacion y comentario son obligatorios' });
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5)
    return res.status(400).json({ error: 'La calificacion debe ser un número entre 1 y 5' });
  if (typeof comentario !== 'string' || comentario.trim() === '')
    return res.status(400).json({ error: 'El comentario debe ser un texto válido' });
  try {
    const existe = db.prepare('SELECT id FROM resenas WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ error: 'Reseña no encontrada' });
    const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(usuario_id);
    if (!usuario) return res.status(400).json({ error: `No existe un usuario con id ${usuario_id}` });
    const producto = db.prepare('SELECT id FROM productos WHERE id = ?').get(producto_id);
    if (!producto) return res.status(400).json({ error: `No existe un producto con id ${producto_id}` });
    const result = db.prepare('UPDATE resenas SET usuario_id = ?, producto_id = ?, calificacion = ?, comentario = ? WHERE id = ?')
      .run(usuario_id, producto_id, calificacion, comentario.trim(), req.params.id);
    res.json({ actualizado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM resenas WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ eliminado: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;