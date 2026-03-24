require('dotenv').config();
const express = require('express');
require('./db');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando');
});

app.use((req, res, next) => {
  if (req.path === '/') return next();

  const password = req.headers['password'];

  if (password !== process.env.API_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  next();
});

app.use('/api/usuarios',        require('./routes/usuarios'));
app.use('/api/categorias',      require('./routes/categorias'));
app.use('/api/productos',       require('./routes/productos'));
app.use('/api/pedidos',         require('./routes/pedidos'));
app.use('/api/detalle-pedidos', require('./routes/detallePedidos'));
app.use('/api/pagos',           require('./routes/pagos'));
app.use('/api/resenas',         require('./routes/resenas'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));