import { z } from 'zod';

export const crearReseniaSchema = {
  body: z.object({
    compraId: z.string().trim().min(1, 'El ID de compra es requerido'),
    compradorId: z.string().trim().min(1, 'El ID de comprador es requerido'),
    puntuacion: z.coerce
      .number({ invalid_type_error: 'La puntuación debe ser un número' })
      .min(1, 'La puntuación mínima es 1')
      .max(5, 'La puntuación máxima es 5'),
    detalle: z.string().trim().min(1, 'El detalle de la reseña es requerido')
  })
};

export const listarReseniasPorOrganizadorSchema = {
  params: z.object({
    organizadorId: z.string().trim().min(1, 'El ID de organizador es requerido')
  })
};
