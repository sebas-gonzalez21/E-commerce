const express = require('express');
const router = express.Router();
const db = require('../db');

const categoriasIniciales = [
  { id: 1, nombre: 'Electrónica' },
  { id: 2, nombre: 'Ropa' },
  { id: 3, nombre: 'Hogar y Jardín' },
];
categoriasIniciales.forEach(c => {
  db.prepare(`INSERT OR IGNORE INTO categorias (id, nombre) VALUES (?, ?)`).run(c.id, c.nombre);
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  try {
    const rows = db.prepare(`SELECT * FROM categorias ${where}`).all(valores);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM categorias WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El campo nombre es obligatorio' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  try {
    const existe = db.prepare('SELECT id FROM categorias WHERE nombre = ?').get(nombre.trim());
    if (existe) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    const result = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run(nombre.trim());
    res.status(201).json({ id: result.lastInsertRowid, nombre });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El campo nombre es obligatorio' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  try {
    const existe = db.prepare('SELECT id FROM categorias WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ error: 'Categoría no encontrada' });
    const duplicado = db.prepare('SELECT id FROM categorias WHERE nombre = ? AND id != ?').get(nombre.trim(), req.params.id);
    if (duplicado) return res.status(400).json({ error: 'Ya existe otra categoría con ese nombre' });
    const result = db.prepare('UPDATE categorias SET nombre = ? WHERE id = ?').run(nombre.trim(), req.params.id);
    res.json({ actualizado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
    res.json({ eliminado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;