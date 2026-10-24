import express from 'express';
import { compraController } from '../controllers/CompraController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  realizarCompraSchema,
  cancelarCompraSchema,
  actualizarEstadoCompraSchema,
  enviarMensajeSchema,
  listarComprasPorCompradorSchema,
  listarComprasPorEventoSchema
} from '../schemas/CompraSchema.js';

const router = express.Router();

router.post('/', validateRequest(realizarCompraSchema), (req, res, next) =>
  compraController.realizarCompra(req, res, next)
);

router.get(
  '/comprador/:compradorId',
  validateRequest(listarComprasPorCompradorSchema),
  (req, res, next) => compraController.listarComprasPorComprador(req, res, next)
);

router.get(
  '/evento/:eventoId',
  validateRequest(listarComprasPorEventoSchema),
  (req, res, next) => compraController.listarComprasPorEvento(req, res, next)
);

router.post(
  '/:id/cancelar',
  validateRequest(cancelarCompraSchema),
  (req, res, next) => compraController.cancelarCompra(req, res, next)
);

router.patch(
  '/:id/cancelar',
  validateRequest(cancelarCompraSchema),
  (req, res, next) => compraController.cancelarCompra(req, res, next)
);

router.patch(
  '/:id/estado',
  validateRequest(actualizarEstadoCompraSchema),
  (req, res, next) => compraController.actualizarEstadoCompra(req, res, next)
);

router.put(
  '/:id/estado',
  validateRequest(actualizarEstadoCompraSchema),
  (req, res, next) => compraController.actualizarEstadoCompra(req, res, next)
);

router.post(
  '/:id/mensajes',
  validateRequest(enviarMensajeSchema),
  (req, res, next) => compraController.enviarMensaje(req, res, next)
);

export default router;
