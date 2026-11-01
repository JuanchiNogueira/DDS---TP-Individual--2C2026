/**
 * Paleta de colores oficial de AI Ticket It (Modo Claro)
 * Diseñada para máxima legibilidad, accesibilidad y estética moderna.
 */
export const COLORS = {
  primary: '#746FFC',        // Color principal (Violeta distintivo)
  secondary: '#CF6BFC',      // Color secundario (Fucsia/Violeta de acento)
  background: '#F8FAFC',     // Fondo general claro (Slate 50)
  card: '#FFFFFF',           // Superficie de tarjetas y contenedores (Blanco puro)
  text: '#0F172A',           // Color de texto principal oscuro (Slate 900)
  textMuted: '#64748B',      // Color de texto secundario/atenuado (Slate 500)
  success: '#10B981',        // Estado de éxito / badge positivo
  danger: '#EF4444',         // Estado de error / alerta
  border: '#E2E8F0',         // Color para bordes y separadores sutiles (Slate 200)
  inputBackground: '#F8FAFC', // Fondo para campos de entrada de texto
  inputBorder: '#CBD5E1',     // Borde inactivo para inputs (Slate 300)
  primarySoft: '#EEF2FF',     // Fondo suave violeta para badges
  secondarySoft: '#FDF4FF',   // Fondo suave fucsia
  successSoft: '#D1FAE5',     // Fondo suave verde
  dangerSoft: '#FEE2E2',      // Fondo suave rojo
  gold: '#F59E0B'             // Color dorado para estrellas de calificación
};

export const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2
};

export function formatPrice(value = 0) {
  return `$${value}`;
}

export function formatDate(iso) {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    const day = date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const time = date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${day} · ${time} hs`;
  } catch {
    return String(iso);
  }
}

export function daysUntil(iso) {
  try {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

export const DEMO_ACCOUNTS = [
  { id: 'usr-comp-1', name: 'Ana Gómez', role: 'COMPRADOR' },
  { id: 'usr-comp-2', name: 'Lucas Fernández', role: 'COMPRADOR' },
  { id: 'usr-org-1', name: 'Charly Producciones', role: 'ORGANIZADOR' },
  { id: 'usr-org-2', name: 'Teatro Gran Rex', role: 'ORGANIZADOR' }
];

export function detectRole(userId = '') {
  return userId.trim().toLowerCase().startsWith('usr-org') ? 'ORGANIZADOR' : 'COMPRADOR';
}

export function roleColor(role) {
  return role === 'ORGANIZADOR' ? COLORS.secondary : COLORS.primary;
}

export function roleLabel(role) {
  return role === 'ORGANIZADOR' ? 'Organizador' : 'Comprador';
}
