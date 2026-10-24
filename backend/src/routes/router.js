import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger.js';
import eventoRoutes from './eventoRoutes.js';
import compraRoutes from './compraRoutes.js';
import reseniaRoutes from './reseniaRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import { eventoController } from '../controllers/EventoController.js';
import { compraController } from '../controllers/CompraController.js';
import { seedController } from '../controllers/SeedController.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { ok: true }
  });
});

router.post('/seed', (req, res, next) => seedController.seed(req, res, next));

// Documentación Swagger / OpenAPI 3.0
router.get('/api-docs.json', (req, res) => {
  res.status(200).json(swaggerSpec);
});
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

router.get('/categorias', (req, res, next) =>
  eventoController.listarCategorias(req, res, next)
);

// Ruta combinada para listar compras por evento
router.get('/eventos/:eventoId/compras', (req, res, next) =>
  compraController.listarComprasPorEvento(req, res, next)
);

router.use('/eventos', eventoRoutes);
router.use('/compras', compraRoutes);
router.use('/resenias', reseniaRoutes);
router.use('/usuarios', usuarioRoutes);

export default router;
