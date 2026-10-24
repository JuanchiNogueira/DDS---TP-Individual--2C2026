import { z } from 'zod';

export const toggleFavoritoSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'El ID de usuario es requerido')
  }),
  body: z.object({
    eventoId: z.string().trim().min(1, 'El ID de evento es requerido')
  })
};

export const usuarioIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'El ID de usuario es requerido')
  })
};
