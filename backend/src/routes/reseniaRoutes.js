import express from 'express';
import { reseniaController } from '../controllers/ReseniaController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  crearReseniaSchema,
  listarReseniasPorOrganizadorSchema
} from '../schemas/ReseniaSchema.js';

const router = express.Router();

router.post('/', validateRequest(crearReseniaSchema), (req, res, next) =>
  reseniaController.crearResenia(req, res, next)
);

router.get(
  '/organizador/:organizadorId',
  validateRequest(listarReseniasPorOrganizadorSchema),
  (req, res, next) => reseniaController.listarReseniasPorOrganizador(req, res, next)
);

export default router;
