import express from 'express';
import { usuarioController } from '../controllers/UsuarioController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  toggleFavoritoSchema,
  usuarioIdParamSchema
} from '../schemas/UsuarioSchema.js';

const router = express.Router();

router.get('/', (req, res, next) => usuarioController.listarUsuarios(req, res, next));

router.get('/:id', validateRequest(usuarioIdParamSchema), (req, res, next) =>
  usuarioController.obtenerUsuarioPorId(req, res, next)
);

router.post(
  '/:id/favoritos',
  validateRequest(toggleFavoritoSchema),
  (req, res, next) => usuarioController.toggleFavorito(req, res, next)
);

export default router;
