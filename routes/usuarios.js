const express = require('express');
const router = express.Router();
const db = require('../db');

const usuariosIniciales = [
  { id: 1, nombre: 'Carlos Ramírez', email: 'carlos@gmail.com', password: '123456' },
  { id: 2, nombre: 'Ana Torres',     email: 'ana@gmail.com',    password: 'abcdef' },
  { id: 3, nombre: 'Luis Martínez',  email: 'luis@gmail.com',   password: 'pass789' },
];
usuariosIniciales.forEach(u => {
  db.prepare(`INSERT OR IGNORE INTO usuarios (id, nombre, email, password) VALUES (?, ?, ?, ?)`)
    .run(u.id, u.nombre, u.email, u.password);
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
    const rows = db.prepare(`SELECT id, nombre, email, creado_en FROM usuarios ${where}`).all(valores);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Los campos nombre, email y password son obligatorios' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  if (typeof email !== 'string' || email.trim() === '')
    return res.status(400).json({ error: 'El email debe ser un texto válido' });
  if (typeof password !== 'string' || password.trim() === '')
    return res.status(400).json({ error: 'El password debe ser un texto válido' });
  try {
    const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existe) return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    const result = db.prepare('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)')
      .run(nombre.trim(), email.trim(), password);
    res.status(201).json({ id: result.lastInsertRowid, nombre, email });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Los campos nombre, email y password son obligatorios' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  if (typeof email !== 'string' || email.trim() === '')
    return res.status(400).json({ error: 'El email debe ser un texto válido' });
  try {
    const existe = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ error: 'Usuario no encontrado' });
    const duplicado = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(email, req.params.id);
    if (duplicado) return res.status(400).json({ error: 'Ya existe otro usuario con ese email' });
    const result = db.prepare('UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?')
      .run(nombre.trim(), email.trim(), password, req.params.id);
    res.json({ actualizado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
    res.json({ eliminado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;