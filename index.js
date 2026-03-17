require('dotenv').config();
const express = require('express');
require('./db');

const app = express();
app.use(express.json());

// Middleware de autenticación
app.use((req, res, next) => {
  const password = req.headers['x-api-password'];
  if (password !== process.env.API_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});

// Rutas
app.use('/usuarios', require('./routes/usuarios'));
app.use('/categorias', require('./routes/categorias'));
app.use('/productos', require('./routes/productos'));
app.use('/pedidos', require('./routes/pedidos'));
app.use('/detalle-pedidos', require('./routes/detallePedidos'));
app.use('/pagos', require('./routes/pagos'));
app.use('/resenas', require('./routes/resenas'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));