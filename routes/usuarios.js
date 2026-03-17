const express = require('express');
const router = express.Router();
const db = require('../db');

const usuariosIniciales = [
  { id: 1, nombre: 'Carlos Ramírez', email: 'carlos@gmail.com', password: '123456' },
  { id: 2, nombre: 'Ana Torres',     email: 'ana@gmail.com',    password: 'abcdef' },
  { id: 3, nombre: 'Luis Martínez',  email: 'luis@gmail.com',   password: 'pass789' },
];
usuariosIniciales.forEach(u => {
  db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, email, password) VALUES (?, ?, ?, ?)`,
    [u.id, u.nombre, u.email, u.password]);
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
  db.all(`SELECT id, nombre, email, creado_en FROM usuarios ${where}`, valores, (err, rows) => {
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

// POST con validaciones
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

  // Unicidad del email
  db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existe) return res.status(400).json({ error: 'Ya existe un usuario con ese email' });

    db.run('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre.trim(), email.trim(), password], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, nombre, email });
      });
  });
});

// PUT con validaciones
router.put('/:id', (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Los campos nombre, email y password son obligatorios' });
  if (typeof nombre !== 'string' || nombre.trim() === '')
    return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
  if (typeof email !== 'string' || email.trim() === '')
    return res.status(400).json({ error: 'El email debe ser un texto válido' });

  // Verificar que el usuario existe
  db.get('SELECT id FROM usuarios WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Unicidad del email excluyendo el mismo registro
    db.get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, req.params.id], (err, duplicado) => {
      if (err) return res.status(500).json({ error: err.message });
      if (duplicado) return res.status(400).json({ error: 'Ya existe otro usuario con ese email' });

      db.run('UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?',
        [nombre.trim(), email.trim(), password, req.params.id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ actualizado: this.changes > 0 });
        });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //usuarios