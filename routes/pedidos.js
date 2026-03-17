const express = require('express');
const router = express.Router();
const db = require('../db');

const pedidosIniciales = [
  { id: 1, usuario_id: 1, total: 124900, estado: 'pagado' },
  { id: 2, usuario_id: 2, total: 45000,  estado: 'pendiente' },
  { id: 3, usuario_id: 1, total: 159900, estado: 'enviado' },
];
pedidosIniciales.forEach(p => {
  db.run(`INSERT OR IGNORE INTO pedidos (id, usuario_id, total, estado) VALUES (?, ?, ?, ?)`,
    [p.id, p.usuario_id, p.total, p.estado]);
});

// GET - filtro dinámico con Object.entries()
router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  Object.entries(req.query).forEach(([campo, valor]) => {
    condiciones.push(`pedidos.${campo} LIKE ?`);
    valores.push(`%${valor}%`);
  });
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  db.all(`SELECT pedidos.*, usuarios.nombre AS usuario 
          FROM pedidos LEFT JOIN usuarios ON pedidos.usuario_id = usuarios.id
          ${where}`, valores, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get(`SELECT pedidos.*, usuarios.nombre AS usuario 
          FROM pedidos LEFT JOIN usuarios ON pedidos.usuario_id = usuarios.id
          WHERE pedidos.id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

// POST con validaciones
router.post('/', (req, res) => {
  const { usuario_id, total, estado } = req.body;

  if (!usuario_id || total === undefined)
    return res.status(400).json({ error: 'Los campos usuario_id y total son obligatorios' });
  if (isNaN(usuario_id))
    return res.status(400).json({ error: 'El usuario_id debe ser un número válido' });
  if (isNaN(total) || total < 0)
    return res.status(400).json({ error: 'El total debe ser un número válido mayor o igual a 0' });

  const estadosValidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];
  if (estado && !estadosValidos.includes(estado))
    return res.status(400).json({ error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` });

  // Verificar que el usuario (FK) existe
  db.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(400).json({ error: `No existe un usuario con id ${usuario_id}` });

    db.run('INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, ?)',
      [usuario_id, total, estado || 'pendiente'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, usuario_id, total, estado: estado || 'pendiente' });
      });
  });
});

// PUT con validaciones
router.put('/:id', (req, res) => {
  const { usuario_id, total, estado } = req.body;

  if (!usuario_id || total === undefined || !estado)
    return res.status(400).json({ error: 'Los campos usuario_id, total y estado son obligatorios' });
  if (isNaN(usuario_id))
    return res.status(400).json({ error: 'El usuario_id debe ser un número válido' });
  if (isNaN(total) || total < 0)
    return res.status(400).json({ error: 'El total debe ser un número válido mayor o igual a 0' });

  const estadosValidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` });

  // Verificar que el pedido existe
  db.get('SELECT id FROM pedidos WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Verificar que el usuario (FK) existe
    db.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: `No existe un usuario con id ${usuario_id}` });

      db.run('UPDATE pedidos SET usuario_id = ?, total = ?, estado = ? WHERE id = ?',
        [usuario_id, total, estado, req.params.id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ actualizado: this.changes > 0 });
        });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM pedidos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //pedidos