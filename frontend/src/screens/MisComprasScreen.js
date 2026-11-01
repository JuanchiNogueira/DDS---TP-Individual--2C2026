import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import ChatCompraModal from '../components/ChatCompraModal';
import ReseniaModal from '../components/ReseniaModal';
import { COLORS, CARD_SHADOW, formatDate, formatPrice } from '../theme/colors';

export function MisComprasScreen() {
  const { usuarioActivo, refreshKey } = useSession();

  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  // Estados de Modales
  const [compraChat, setCompraChat] = useState(null);
  const [modalChatVisible, setModalChatVisible] = useState(false);

  const [compraResenia, setCompraResenia] = useState(null);
  const [modalReseniaVisible, setModalReseniaVisible] = useState(false);

  const cargarCompras = useCallback(async () => {
    if (!usuarioActivo?.id) {
      setCompras([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const data = await apiClient.get(`/compras/comprador/${usuarioActivo.id}`);
      setCompras(data || []);
    } catch (err) {
      setError(err.message || 'Error al obtener las compras');
    } finally {
      setCargando(false);
    }
  }, [usuarioActivo?.id]);

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras, refreshKey]);

  const handleCancelarCompra = async (compraId) => {
    try {
      setCancelandoId(compraId);
      setMensajeExito(null);
      setError(null);

      await apiClient.post(`/compras/${compraId}/cancelar`, {
        usuarioId: usuarioActivo.id
      });

      setMensajeExito('Compra cancelada y reembolsada con éxito. Cupo restituido.');
      setTimeout(() => setMensajeExito(null), 5000);

      await cargarCompras();
    } catch (err) {
      setError(err.message || 'Error al cancelar la compra');
    } finally {
      setCancelandoId(null);
    }
  };

  const handleMensajeEnviado = async (nuevoMensaje) => {
    await cargarCompras();
    setCompraChat((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        mensajes: [...(prev.mensajes || []), nuevoMensaje]
      };
    });
  };

  const handleReseniaPublicada = async () => {
    setMensajeExito(`¡Reseña publicada con éxito para "${compraResenia?.evento?.nombre}"!`);
    setTimeout(() => setMensajeExito(null), 5000);
    await cargarCompras();
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' };
      case 'CONFIRMADA':
        return { bg: COLORS.successSoft, text: '#065F46', border: COLORS.success };
      case 'UTILIZADA':
        return { bg: COLORS.secondarySoft, text: COLORS.secondary, border: COLORS.secondary };
      case 'CANCELADA':
        return { bg: COLORS.dangerSoft, text: '#B91C1C', border: COLORS.danger };
      case 'REEMBOLSADA':
        return { bg: '#F1F5F9', text: COLORS.textMuted, border: COLORS.border };
      default:
        return { bg: COLORS.inputBackground, text: COLORS.textMuted, border: COLORS.border };
    }
  };

  const renderCompraItem = ({ item }) => {
    const estadoColor = obtenerColorEstado(item.estado);

    const fechaEvento = item.evento?.fecha ? new Date(item.evento.fecha) : null;
    const eventoYaOcurrio = fechaEvento ? fechaEvento.getTime() <= Date.now() : false;

    const puedeCancelar =
      item.estado !== 'UTILIZADA' &&
      item.estado !== 'CANCELADA' &&
      item.estado !== 'REEMBOLSADA' &&
      !eventoYaOcurrio;

    return (
      <View
        style={styles.card}
        testID={`compra-card-${item.id}`}
        accessibilityLabel={`Compra de ${item.evento?.nombre || 'Evento'}`}
      >
        {/* Cabecera de la Tarjeta */}
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text
              style={styles.cardTitle}
              accessibilityRole="header"
              testID={`compra-evento-nombre-${item.id}`}
            >
              {item.evento?.nombre || 'Evento'}
            </Text>
            <Text style={styles.cardDate} testID={`compra-evento-fecha-${item.id}`}>
              📅 {formatDate(item.evento?.fecha)}
            </Text>
          </View>

          {/* Etiqueta distintiva de estado */}
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: estadoColor.bg, borderColor: estadoColor.border }
            ]}
            testID={`compra-estado-${item.id}`}
            accessibilityLabel={`Estado: ${item.estado}`}
          >
            <Text style={[styles.estadoBadgeText, { color: estadoColor.text }]}>
              {item.estado}
            </Text>
          </View>
        </View>

        {/* Detalle de Entradas y Monto */}
        <View style={styles.detailsRow}>
          <Text style={styles.ticketDetail}>
            🎫 Entrada: <Text style={styles.boldText}>{item.tipoEntrada?.nombre || 'General'}</Text> x{' '}
            {item.cantidad}
          </Text>
          <Text style={styles.cardTotal} testID={`compra-total-${item.id}`}>
            Total: ${item.total}
          </Text>
        </View>

        {/* Notificación destacada de días faltantes si el estado es CONFIRMADA */}
        {item.estado === 'CONFIRMADA' && item.diasFaltantes !== null && item.diasFaltantes !== undefined ? (
          <View
            style={styles.diasFaltantesBanner}
            testID={`compra-dias-faltantes-${item.id}`}
            accessibilityLabel={`Faltan ${item.diasFaltantes} días para el evento`}
          >
            <Text style={styles.diasFaltantesText}>
              ⏳ Faltan {item.diasFaltantes} días para el evento
            </Text>
          </View>
        ) : null}

        {/* Aviso de Reembolso */}
        {item.estado === 'CANCELADA' && (
          <Text style={styles.refundNotice}>
            Compra cancelada. El reembolso se acreditará en 5 a 10 días hábiles.
          </Text>
        )}

        {/* Botones de Acción */}
        <View style={styles.actionsColumn}>
          {puedeCancelar ? (
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={() => handleCancelarCompra(item.id)}
              disabled={cancelandoId === item.id}
              accessibilityRole="button"
              accessibilityLabel="Cancelar compra y reembolsar"
              testID={`btn-cancelar-compra-${item.id}`}
            >
              {cancelandoId === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnCancelarText}>🚫 Cancelar compra y reembolsar</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <View style={styles.actionsRow}>
            {/* Botón Abrir Chat */}
            <TouchableOpacity
              style={styles.btnChat}
              onPress={() => {
                setCompraChat(item);
                setModalChatVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Abrir Chat"
              testID={`btn-chat-compra-${item.id}`}
            >
              <Text style={styles.btnChatText}>💬 Abrir Chat</Text>
            </TouchableOpacity>

            {/* Botón Calificar Evento (para compras en estado UTILIZADA) */}
            {item.estado === 'UTILIZADA' ? (
              <TouchableOpacity
                style={styles.btnCalificar}
                onPress={() => {
                  setCompraResenia(item);
                  setModalReseniaVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Calificar Evento"
                testID={`btn-calificar-compra-${item.id}`}
              >
                <Text style={styles.btnCalificarText}>⭐ Calificar Evento</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Banner de mensajes de éxito */}
      {mensajeExito ? (
        <View style={styles.successBanner} accessibilityRole="alert" testID="alerta-exito-mis-compras">
          <Text style={styles.successBannerText}>✅ {mensajeExito}</Text>
        </View>
      ) : null}

      {/* Banner de errores */}
      {error ? (
        <View style={styles.errorBanner} accessibilityRole="alert" testID="alerta-error-mis-compras">
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Listado de compras */}
      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tus compras...</Text>
        </View>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(item) => item.id}
          renderItem={renderCompraItem}
          contentContainerStyle={styles.listContent}
          testID="lista-mis-compras"
          ListHeaderComponent={
            <Text style={styles.heading} accessibilityRole="header">
              Mis Compras
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer} testID="sin-compras-alerta">
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyTitle}>No tienes compras registradas</Text>
              <Text style={styles.emptySubtitle}>
                Explorá el catálogo de eventos para adquirir tus primeras entradas.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Chat de la Compra */}
      <ChatCompraModal
        compra={compraChat}
        visible={modalChatVisible}
        onClose={() => {
          setModalChatVisible(false);
          setCompraChat(null);
        }}
        onMensajeEnviado={handleMensajeEnviado}
      />

      {/* Modal de Calificación de Evento */}
      <ReseniaModal
        compra={compraResenia}
        visible={modalReseniaVisible}
        onClose={() => {
          setModalReseniaVisible(false);
          setCompraResenia(null);
        }}
        onReseniaPublicada={handleReseniaPublicada}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  listContent: {
    padding: 16,
    gap: 14
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4
  },
  flex: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14
  },
  successBanner: {
    backgroundColor: COLORS.successSoft,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700'
  },
  errorBanner: {
    backgroundColor: COLORS.dangerSoft,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600'
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
    ...CARD_SHADOW
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  cardDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  estadoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  ticketDetail: {
    fontSize: 14,
    color: COLORS.text
  },
  boldText: {
    fontWeight: '800',
    color: COLORS.primary
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text
  },
  diasFaltantesBanner: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  diasFaltantesText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  refundNotice: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500'
  },
  actionsColumn: {
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  btnCancelar: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.card,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  btnCancelarText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '800'
  },
  btnChat: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center'
  },
  btnChatText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700'
  },
  btnCalificar: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center'
  },
  btnCalificarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 4
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center'
  }
});

export default MisComprasScreen;
