import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import ChatCompraModal from '../components/ChatCompraModal';
import { COLORS, CARD_SHADOW, formatDate, formatPrice } from '../theme/colors';

const STATUS_STYLE = {
  CONFIRMADA: { bg: COLORS.successSoft, fg: '#047857' },
  PENDIENTE: { bg: '#FEF3C7', fg: '#B45309' },
  UTILIZADA: { bg: COLORS.secondarySoft, fg: COLORS.secondary },
  CANCELADA: { bg: COLORS.dangerSoft, fg: '#B91C1C' },
  REEMBOLSADA: { bg: '#F1F5F9', fg: COLORS.textMuted }
};

const FILTROS = ['TODOS', 'CONFIRMADA', 'PENDIENTE', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'];

export function OrganizadorEventosScreen({ onCrearEvento }) {
  const { usuarioActivo, refreshKey } = useSession();

  const [eventos, setEventos] = useState([]);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState(null);

  // Estado del Evento Seleccionado para ver compras y cupos
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [detalleCompras, setDetalleCompras] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [marcandoId, setMarcandoId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modal de Chat
  const [compraChat, setCompraChat] = useState(null);
  const [modalChatVisible, setModalChatVisible] = useState(false);

  const exitoTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (exitoTimerRef.current) {
        clearTimeout(exitoTimerRef.current);
      }
    };
  }, []);

  const mostrarMensajeExito = (msg) => {
    if (exitoTimerRef.current) clearTimeout(exitoTimerRef.current);
    setMensajeExito(msg);
    exitoTimerRef.current = setTimeout(() => setMensajeExito(null), 4000);
  };

  // Cargar eventos del organizador
  const cargarEventos = useCallback(async () => {
    if (!usuarioActivo?.id) {
      setEventos([]);
      setCargandoEventos(false);
      return;
    }

    try {
      setCargandoEventos(true);
      setErrorEventos(null);
      const todosLosEventos = await apiClient.get('/eventos');
      // Filtrar únicamente los pertenecientes a este organizador
      const misEventos = (todosLosEventos || []).filter(
        (e) => e.organizador?.id === usuarioActivo.id
      );
      setEventos(misEventos);
    } catch (err) {
      setErrorEventos(err.message || 'Error al obtener los eventos del organizador');
    } finally {
      setCargandoEventos(false);
    }
  }, [usuarioActivo?.id]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos, refreshKey]);

  // Cargar compras y cupos del evento seleccionado
  const cargarComprasEvento = async (evento) => {
    try {
      setEventoSeleccionado(evento);
      setCargandoDetalle(true);
      setErrorDetalle(null);
      setMensajeExito(null);

      const data = await apiClient.get(`/eventos/${evento.id}/compras`, {
        params: { organizadorId: usuarioActivo.id }
      });

      setDetalleCompras(data);
    } catch (err) {
      setErrorDetalle(err.message || 'Error al obtener las compras del evento');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Marcar compra como UTILIZADA
  const handleMarcarUtilizada = async (compraId) => {
    try {
      setMarcandoId(compraId);
      setErrorDetalle(null);

      await apiClient.patch(`/compras/${compraId}/estado`, {
        estado: 'UTILIZADA',
        usuarioId: usuarioActivo.id
      });

      mostrarMensajeExito('Entrada marcada como UTILIZADA con éxito.');

      // Recargar datos de compras y cupos del evento
      if (eventoSeleccionado) {
        await cargarComprasEvento(eventoSeleccionado);
      }
    } catch (err) {
      setErrorDetalle(err.message || 'Error al actualizar el estado de la compra');
    } finally {
      setMarcandoId(null);
    }
  };

  const handleMensajeEnviado = async (nuevoMensaje) => {
    if (eventoSeleccionado) {
      const data = await apiClient.get(`/eventos/${eventoSeleccionado.id}/compras`, {
        params: { organizadorId: usuarioActivo.id }
      });
      setDetalleCompras(data);
      setCompraChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mensajes: [...(prev.mensajes || []), nuevoMensaje]
        };
      });
    }
  };

  const comprasLista = useMemo(() => detalleCompras?.compras || [], [detalleCompras?.compras]);
  const entradasDisponibles = useMemo(() => detalleCompras?.entradasDisponibles || [], [detalleCompras?.entradasDisponibles]);

  const conteosPorEstado = useMemo(() => {
    const counts = { TODOS: comprasLista.length };
    for (const compra of comprasLista) {
      counts[compra.estado] = (counts[compra.estado] || 0) + 1;
    }
    return counts;
  }, [comprasLista]);

  const comprasFiltradas = useMemo(() => {
    if (filtroEstado === 'TODOS') return comprasLista;
    return comprasLista.filter((c) => c.estado === filtroEstado);
  }, [comprasLista, filtroEstado]);

  // ==========================================
  // VISTA 2: DETALLE DE COMPRAS Y GESTIÓN DE CUPOS
  // ==========================================
  if (eventoSeleccionado) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.detailContainer}>
          {/* Botón Volver */}
          <TouchableOpacity
            testID="btn-volver-mis-eventos"
            accessibilityRole="button"
            onPress={() => {
              setEventoSeleccionado(null);
              setDetalleCompras(null);
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Volver a Mis Eventos</Text>
          </TouchableOpacity>

          {/* Tarjeta de Cabecera del Evento */}
          <View style={styles.eventHeaderCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                🏷️ {eventoSeleccionado.categoria?.nombre || 'General'}
              </Text>
            </View>
            <Text style={styles.eventHeaderTitle} accessibilityRole="header">
              {eventoSeleccionado.nombre}
            </Text>
            <Text style={styles.eventHeaderDate}>
              📅 {formatDate(eventoSeleccionado.fecha)}
            </Text>
          </View>

          {/* Feedback Alertas */}
          {mensajeExito ? (
            <View style={styles.successBanner} accessibilityRole="alert" testID="alerta-exito-org">
              <Text style={styles.successBannerText}>✅ {mensajeExito}</Text>
            </View>
          ) : null}

          {errorDetalle ? (
            <View style={styles.errorBanner} accessibilityRole="alert" testID="alerta-error-org">
              <Text style={styles.errorBannerText}>⚠️ {errorDetalle}</Text>
            </View>
          ) : null}

          {cargandoDetalle ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando compras y cupos del evento...</Text>
            </View>
          ) : (
            <>
              {/* Sección 1: Cupos Disponibles por Tipo de Entrada */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  🎫 Cupos Disponibles por Tipo de Entrada
                </Text>
                <View style={styles.cuposGrid}>
                  {entradasDisponibles.map((t) => {
                    const agotado = t.cupoDisponible <= 0;
                    return (
                      <View
                        key={t.id}
                        testID={`cupo-disponible-tipo-${t.id}`}
                        style={styles.cupoCard}
                      >
                        <Text style={styles.cupoName}>{t.nombre}</Text>
                        <Text style={styles.cupoPrice}>{formatPrice(t.precio)}</Text>
                        <View
                          style={[
                            styles.cupoPill,
                            { backgroundColor: agotado ? COLORS.dangerSoft : COLORS.successSoft }
                          ]}
                        >
                          <Text
                            style={[
                              styles.cupoPillText,
                              { color: agotado ? '#B91C1C' : '#047857' }
                            ]}
                          >
                            {agotado ? 'Cupo agotado: 0' : `Cupo disponible: ${t.cupoDisponible}`}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Sección 2: Ventas y Compras Registradas */}
              <View style={styles.sectionBlock}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.sectionTitle} accessibilityRole="header">
                    📊 Ventas y Compras Registradas
                  </Text>
                  <Text style={styles.counterText}>
                    {comprasLista.length} {comprasLista.length === 1 ? 'compra' : 'compras'}
                  </Text>
                </View>

                {/* Filtros por Estado */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScroll}
                >
                  {FILTROS.map((st) => {
                    const activo = filtroEstado === st;
                    const cantidad = conteosPorEstado[st] || 0;
                    return (
                      <TouchableOpacity
                        key={st}
                        testID={`filtro-org-estado-${st.toLowerCase()}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activo }}
                        onPress={() => setFiltroEstado(st)}
                        style={[styles.filterChip, activo && styles.filterChipActive]}
                      >
                        <Text style={[styles.filterChipText, activo && styles.filterChipTextActive]}>
                          {st} ({cantidad})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Listado de Compras del Evento */}
                <View testID="lista-compras-evento" style={styles.purchasesList}>
                  {comprasFiltradas.length > 0 ? (
                    comprasFiltradas.map((compra) => {
                      const colorEst = STATUS_STYLE[compra.estado] || STATUS_STYLE.PENDIENTE;
                      const compradorNombre = compra.comprador
                        ? `${compra.comprador.nombre || ''} ${compra.comprador.apellido || ''}`.trim() || compra.comprador.id
                        : 'Comprador';

                      return (
                        <View
                          key={compra.id}
                          testID={`org-compra-card-${compra.id}`}
                          style={styles.purchaseCard}
                        >
                          <View style={styles.purchaseHeader}>
                            <View style={styles.flex}>
                              <Text style={styles.buyerName}>
                                👤 Comprador: {compradorNombre}
                              </Text>
                              <Text style={styles.purchaseId}>ID: {compra.id}</Text>
                            </View>

                            <View
                              testID={`org-compra-estado-${compra.id}`}
                              style={[
                                styles.statusBadge,
                                { backgroundColor: colorEst.bg }
                              ]}
                            >
                              <Text style={[styles.statusBadgeText, { color: colorEst.fg }]}>
                                {compra.estado}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.purchaseDetailsBox}>
                            <Text style={styles.purchaseDetailsText}>
                              Entrada: <Text style={styles.boldText}>{compra.tipoEntrada?.nombre || 'General'}</Text> x {compra.cantidad}
                            </Text>
                            <Text style={styles.purchaseTotalText}>
                              Total: ${compra.total}
                            </Text>
                          </View>

                          {/* Acciones del Organizador */}
                          <View style={styles.purchaseActionsRow}>
                            <TouchableOpacity
                              testID={`btn-org-chat-compra-${compra.id}`}
                              accessibilityRole="button"
                              accessibilityLabel="Responder chat de compra"
                              onPress={() => {
                                setCompraChat(compra);
                                setModalChatVisible(true);
                              }}
                              style={styles.btnSecondary}
                            >
                              <Text style={styles.btnSecondaryText}>💬 Responder Chat</Text>
                            </TouchableOpacity>

                            {compra.estado === 'CONFIRMADA' ? (
                              <TouchableOpacity
                                testID={`btn-marcar-utilizada-${compra.id}`}
                                accessibilityRole="button"
                                accessibilityLabel="Marcar entrada como Utilizada"
                                onPress={() => handleMarcarUtilizada(compra.id)}
                                disabled={marcandoId === compra.id}
                                style={styles.btnPrimary}
                              >
                                {marcandoId === compra.id ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <Text style={styles.btnPrimaryText}>✅ Marcar Utilizada</Text>
                                )}
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyComprasBox}>
                      <Text style={styles.emptyComprasText}>
                        No hay compras registradas para el filtro seleccionado.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Modal de Chat de Compra */}
        <ChatCompraModal
          compra={compraChat}
          visible={modalChatVisible}
          onClose={() => {
            setModalChatVisible(false);
            setCompraChat(null);
          }}
          onMensajeEnviado={handleMensajeEnviado}
        />
      </View>
    );
  }

  // ==========================================
  // VISTA 1: LISTADO PRINCIPAL DE EVENTOS DEL ORGANIZADOR
  // ==========================================
  return (
    <View style={styles.container}>
      <FlatList
        testID="lista-eventos-organizador"
        data={eventos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle} accessibilityRole="header">
                🎪 Mis Eventos Publicados
              </Text>
              <Text style={styles.pageSubtitle}>
                Gestioná los cupos y seguí tus ventas en tiempo real.
              </Text>
            </View>

            <TouchableOpacity
              testID="btn-header-crear-evento"
              accessibilityRole="button"
              accessibilityLabel="Crear Nuevo Evento"
              onPress={onCrearEvento}
              style={styles.headerCreateBtn}
            >
              <Text style={styles.headerCreateBtnText}>+ Crear Evento</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View testID="sin-eventos-org-alerta" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎭</Text>
            <Text style={styles.emptyTitle}>Todavía no publicaste eventos</Text>
            <Text style={styles.emptySubtitle}>
              Creá tu primer evento y empezá a publicar entradas en minutos.
            </Text>
            <TouchableOpacity
              testID="btn-crear-primer-evento"
              accessibilityRole="button"
              onPress={onCrearEvento}
              style={styles.emptyCreateBtn}
            >
              <Text style={styles.emptyCreateBtnText}>➕ Crear mi primer evento</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const totalTipos = item.tiposEntrada?.length || 0;
          return (
            <View testID={`org-evento-card-${item.id}`} style={styles.eventCard}>
              <View style={styles.eventCardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    🏷️ {item.categoria?.nombre || 'General'}
                  </Text>
                </View>
                <Text style={styles.eventDateText}>📅 {formatDate(item.fecha)}</Text>
              </View>

              <Text style={styles.eventCardTitle}>{item.nombre}</Text>

              {item.descripcion ? (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              ) : null}

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Tipos de entrada</Text>
                  <Text style={styles.metricValue}>{totalTipos}</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Cupos totales</Text>
                  <Text style={[styles.metricValue, { color: COLORS.primary }]}>
                    {item.tiposEntrada?.reduce((acc, t) => acc + (t.cupo || 0), 0) || 0}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                testID={`btn-ver-compras-evento-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Ver compras y cupos de ${item.nombre}`}
                onPress={() => cargarComprasEvento(item)}
                style={styles.btnVerCompras}
              >
                <Text style={styles.btnVerComprasText}>📊 Ver Compras y Cupos</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  flex: {
    flex: 1
  },
  listContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40
  },
  detailContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 4
  },
  pageHeaderText: {
    flexShrink: 1,
    gap: 4
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  headerCreateBtn: {
    backgroundColor: COLORS.secondarySoft,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  headerCreateBtnText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '800'
  },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
    ...CARD_SHADOW
  },
  eventCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  categoryBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800'
  },
  eventDateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  eventCardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800'
  },
  eventDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 2
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600'
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800'
  },
  btnVerCompras: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2
  },
  btnVerComprasText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    ...CARD_SHADOW
  },
  emptyEmoji: {
    fontSize: 40
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800'
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8
  },
  emptyCreateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  eventHeaderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 6,
    ...CARD_SHADOW
  },
  eventHeaderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800'
  },
  eventHeaderDate: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  successBanner: {
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 12,
    padding: 12
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700'
  },
  errorBanner: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    padding: 12
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600'
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14
  },
  sectionBlock: {
    gap: 10
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800'
  },
  cuposGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  cupoCard: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 6,
    ...CARD_SHADOW
  },
  cupoName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700'
  },
  cupoPrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  cupoPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  cupoPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  salesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  counterText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  filtersScroll: {
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  purchasesList: {
    gap: 10
  },
  emptyComprasBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center'
  },
  emptyComprasText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center'
  },
  purchaseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
    ...CARD_SHADOW
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  buyerName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700'
  },
  purchaseId: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  purchaseDetailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10
  },
  purchaseDetailsText: {
    color: COLORS.text,
    fontSize: 13
  },
  boldText: {
    fontWeight: '800'
  },
  purchaseTotalText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800'
  },
  purchaseActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  btnSecondary: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground
  },
  btnSecondaryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700'
  },
  btnPrimary: {
    flexGrow: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});

export default OrganizadorEventosScreen;
