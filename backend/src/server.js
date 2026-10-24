import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor AI Ticket It ejecutándose en http://0.0.0.0:${PORT}`);
});
