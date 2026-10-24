import express from 'express';
import { eventoController } from '../controllers/EventoController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  crearEventoSchema,
  buscarEventosQuerySchema,
  eventoIdParamSchema
} from '../schemas/EventoSchema.js';

const router = express.Router();

router.get('/', validateRequest(buscarEventosQuerySchema), (req, res, next) =>
  eventoController.buscarEventos(req, res, next)
);

router.post('/', validateRequest(crearEventoSchema), (req, res, next) =>
  eventoController.crearEvento(req, res, next)
);

router.get('/:id', validateRequest(eventoIdParamSchema), (req, res, next) =>
  eventoController.obtenerDetalleEvento(req, res, next)
);

export default router;
