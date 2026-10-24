import { z } from 'zod';

export const tipoEntradaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre del tipo de entrada es requerido'),
  descripcion: z.string().optional().default(''),
  precio: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  cupo: z.coerce.number().int().positive('El cupo debe ser un entero positivo')
});

export const crearEventoSchema = {
  body: z.object({
    nombre: z.string().trim().min(1, 'El nombre del evento es requerido'),
    descripcion: z.string().optional().default(''),
    categoriaId: z.string().trim().min(1, 'El ID de categoría es requerido'),
    fecha: z.coerce.date({ errorMap: () => ({ message: 'Fecha de evento inválida' }) }),
    organizadorId: z.string().trim().min(1, 'El ID de organizador es requerido'),
    multimedia: z.array(z.string()).optional().default([]),
    tiposEntrada: z
      .array(tipoEntradaSchema)
      .nonempty('Debe ingresar al menos un tipo de entrada')
  })
};

export const buscarEventosQuerySchema = {
  query: z.object({
    texto: z.string().optional(),
    categoriaId: z.string().optional(),
    precioMin: z.coerce.number().min(0).optional(),
    precioMax: z.coerce.number().min(0).optional(),
    ordenarPor: z.enum(['precio', 'fecha', 'puntaje']).optional(),
    orden: z.enum(['asc', 'desc']).optional()
  })
};

export const eventoIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'El ID de evento es requerido')
  })
};
