const express = require('express');
const router = express.Router();
const db = require('../db');

const pagosIniciales = [
  { id: 1, pedido_id: 1, metodo: 'tarjeta',      estado: 'aprobado'  },
  { id: 2, pedido_id: 2, metodo: 'transferencia', estado: 'pendiente' },
  { id: 3, pedido_id: 3, metodo: 'tarjeta',       estado: 'aprobado'  },
];
pagosIniciales.forEach(p => {
  db.run(`INSERT OR IGNORE INTO pagos (id, pedido_id, metodo, estado) VALUES (?, ?, ?, ?)`,
    [p.id, p.pedido_id, p.metodo, p.estado]);
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
  db.all(`SELECT * FROM pagos ${where}`, valores, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM pagos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });
});

// POST con validaciones
router.post('/', (req, res) => {
  const { pedido_id, metodo, estado } = req.body;

  if (!pedido_id || !metodo)
    return res.status(400).json({ error: 'Los campos pedido_id y metodo son obligatorios' });
  if (isNaN(pedido_id))
    return res.status(400).json({ error: 'El pedido_id debe ser un número válido' });
  if (typeof metodo !== 'string' || metodo.trim() === '')
    return res.status(400).json({ error: 'El metodo debe ser un texto válido' });

  const metodosValidos = ['tarjeta', 'transferencia', 'efectivo'];
  if (!metodosValidos.includes(metodo))
    return res.status(400).json({ error: `El metodo debe ser uno de: ${metodosValidos.join(', ')}` });

  const estadosValidos = ['pendiente', 'aprobado', 'fallido'];
  if (estado && !estadosValidos.includes(estado))
    return res.status(400).json({ error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` });

  // Verificar FK pedido
  db.get('SELECT id FROM pedidos WHERE id = ?', [pedido_id], (err, pedido) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });

    db.run('INSERT INTO pagos (pedido_id, metodo, estado) VALUES (?, ?, ?)',
      [pedido_id, metodo, estado || 'pendiente'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, pedido_id, metodo, estado: estado || 'pendiente' });
      });
  });
});

// PUT con validaciones
router.put('/:id', (req, res) => {
  const { pedido_id, metodo, estado } = req.body;

  if (!pedido_id || !metodo || !estado)
    return res.status(400).json({ error: 'Los campos pedido_id, metodo y estado son obligatorios' });
  if (isNaN(pedido_id))
    return res.status(400).json({ error: 'El pedido_id debe ser un número válido' });

  const metodosValidos = ['tarjeta', 'transferencia', 'efectivo'];
  if (!metodosValidos.includes(metodo))
    return res.status(400).json({ error: `El metodo debe ser uno de: ${metodosValidos.join(', ')}` });

  const estadosValidos = ['pendiente', 'aprobado', 'fallido'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` });

  // Verificar que el pago existe
  db.get('SELECT id FROM pagos WHERE id = ?', [req.params.id], (err, existe) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existe) return res.status(404).json({ error: 'Pago no encontrado' });

    // Verificar FK pedido
    db.get('SELECT id FROM pedidos WHERE id = ?', [pedido_id], (err, pedido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });

      db.run('UPDATE pagos SET pedido_id = ?, metodo = ?, estado = ? WHERE id = ?',
        [pedido_id, metodo, estado, req.params.id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ actualizado: this.changes > 0 });
        });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM pagos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ eliminado: this.changes > 0 });
  });
});

module.exports = router; //pagos