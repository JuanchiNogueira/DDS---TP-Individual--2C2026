export const EstadoCompra = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  UTILIZADA: 'UTILIZADA',
  CANCELADA: 'CANCELADA',
  REEMBOLSADA: 'REEMBOLSADA'
});

export const esEstadoCompraValido = (estado) => {
  return Object.values(EstadoCompra).includes(estado);
};

export default EstadoCompra;
