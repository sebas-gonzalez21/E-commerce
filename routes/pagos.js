const express = require('express');
const router = express.Router();
const db = require('../db');

const pagosIniciales = [
  { id: 1, pedido_id: 1, metodo: 'tarjeta',      estado: 'aprobado'  },
  { id: 2, pedido_id: 2, metodo: 'transferencia', estado: 'pendiente' },
  { id: 3, pedido_id: 3, metodo: 'tarjeta',       estado: 'aprobado'  },
];
pagosIniciales.forEach(p => {
  db.prepare(`INSERT OR IGNORE INTO pagos (id, pedido_id, metodo, estado) VALUES (?, ?, ?, ?)`)
    .run(p.id, p.pedido_id, p.metodo, p.estado);
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
    const rows = db.prepare(`SELECT * FROM pagos ${where}`).all(valores);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM pagos WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { pedido_id, metodo, estado } = req.body;
  if (!pedido_id || !metodo) return res.status(400).json({ error: 'Los campos pedido_id y metodo son obligatorios' });
  if (isNaN(pedido_id)) return res.status(400).json({ error: 'El pedido_id debe ser un número válido' });
  if (typeof metodo !== 'string' || metodo.trim() === '') return res.status(400).json({ error: 'El metodo debe ser un texto válido' });
  const metodosValidos = ['tarjeta', 'transferencia', 'efectivo'];
  if (!metodosValidos.includes(metodo)) return res.status(400).json({ error: `El metodo debe ser uno de: ${metodosValidos.join(', ')}` });
  const estadosValidos = ['pendiente', 'aprobado', 'fallido'];
  if (estado && !estadosValidos.includes(estado)) return res.status(400).json({ error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` });
  try {
    const pedido = db.prepare('SELECT id FROM pedidos WHERE id = ?').get(pedido_id);
    if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });
    const result = db.prepare('INSERT INTO pagos (pedido_id, metodo, estado) VALUES (?, ?, ?)')
      .run(pedido_id, metodo, estado || 'pendiente');
    res.status(201).json({ id: result.lastInsertRowid, pedido_id, metodo, estado: estado || 'pendiente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { pedido_id, metodo, estado } = req.body;
  if (!pedido_id || !metodo || !estado) return res.status(400).json({ error: 'Los campos pedido_id, metodo y estado son obligatorios' });
  if (isNaN(pedido_id)) return res.status(400).json({ error: 'El pedido_id debe ser un número válido' });
  const metodosValidos = ['tarjeta', 'transferencia', 'efectivo'];
  if (!metodosValidos.includes(metodo)) return res.status(400).json({ error: `El metodo debe ser uno de: ${metodosValidos.join(', ')}` });
  const estadosValidos = ['pendiente', 'aprobado', 'fallido'];
  if (!estadosValidos.includes(estado)) return res.status(400).json({ error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` });
  try {
    const existe = db.prepare('SELECT id FROM pagos WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ error: 'Pago no encontrado' });
    const pedido = db.prepare('SELECT id FROM pedidos WHERE id = ?').get(pedido_id);
    if (!pedido) return res.status(400).json({ error: `No existe un pedido con id ${pedido_id}` });
    const result = db.prepare('UPDATE pagos SET pedido_id = ?, metodo = ?, estado = ? WHERE id = ?')
      .run(pedido_id, metodo, estado, req.params.id);
    res.json({ actualizado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM pagos WHERE id = ?').run(req.params.id);
    res.json({ eliminado: result.changes > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;