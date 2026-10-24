import { z } from 'zod';

export const realizarCompraSchema = {
  body: z.object({
    compradorId: z.string().trim().min(1, 'El ID de comprador es requerido'),
    eventoId: z.string().trim().min(1, 'El ID de evento es requerido'),
    tipoEntradaId: z.string().trim().min(1, 'El ID de tipo de entrada es requerido'),
    cantidad: z.coerce.number().int().positive('La cantidad debe ser un entero positivo'),
    confirmarInmediatamente: z.boolean().optional().default(true)
  })
};

export const cancelarCompraSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'El ID de compra es requerido')
  }),
  body: z.object({
    usuarioId: z.string().trim().min(1, 'El ID de usuario es requerido')
  })
};

export const actualizarEstadoCompraSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'El ID de compra es requerido')
  }),
  body: z.object({
    estado: z.enum(['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'], {
      errorMap: () => ({ message: 'Estado de compra inválido' })
    }),
    usuarioId: z.string().trim().min(1, 'El ID de usuario es requerido')
  })
};

export const enviarMensajeSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'El ID de compra es requerido')
  }),
  body: z.object({
    usuarioId: z.string().trim().min(1, 'El ID de usuario es requerido'),
    texto: z.string().trim().min(1, 'El texto del mensaje no puede estar vacío')
  })
};

export const listarComprasPorCompradorSchema = {
  params: z.object({
    compradorId: z.string().trim().min(1, 'El ID de comprador es requerido')
  })
};

export const listarComprasPorEventoSchema = {
  params: z.object({
    eventoId: z.string().trim().min(1, 'El ID de evento es requerido')
  }),
  query: z.object({
    organizadorId: z.string().trim().min(1, 'El ID de organizador es requerido')
  })
};
