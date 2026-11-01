import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW, formatDate, formatPrice } from '../theme/colors';

const CATEGORY_EMOJIS = {
  'Recitales': '🎸',
  'Teatro': '🎭',
  'Festivales': '🎪',
  'Deportes': '⚽',
  'Conferencias': '🎤'
};

function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <Text style={styles.starsText} accessibilityLabel={`${value} de 5 estrellas`}>
      {'⭐'.repeat(Math.max(0, Math.min(5, rounded)))}
      <Text style={styles.starsOff}>{'⭐'.repeat(Math.max(0, 5 - rounded))}</Text>
    </Text>
  );
}

export function DetalleEventoScreen({ eventoId, onVolver, onIrAMisCompras }) {
  const { usuarioActivo, refreshKey } = useSession();

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [tipoEntradaSeleccionado, setTipoEntradaSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [comprando, setComprando] = useState(false);
  const [errorCompra, setErrorCompra] = useState(null);
  const [exitoCompra, setExitoCompra] = useState(null);

  const cargarDetalle = useCallback(async () => {
    if (!eventoId) return;
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await apiClient.get(`/eventos/${eventoId}`);
      setDetalle(data);

      const tipos = data?.tiposEntrada || data?.evento?.tiposEntrada || [];
      if (tipos.length > 0) {
        setTipoEntradaSeleccionado((prev) => {
          if (prev) {
            const stillExists = tipos.find((t) => t.id === prev.id);
            if (stillExists) return stillExists;
          }
          return tipos[0];
        });
      }
    } catch (err) {
      setErrorCarga(err.message || 'Error al cargar los detalles del evento');
    } finally {
      setCargando(false);
    }
  }, [eventoId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle, refreshKey]);

  const updateQuantity = (next) => {
    if (!Number.isFinite(next)) return;
    const maxCupo = tipoEntradaSeleccionado?.cupo ?? 999;
    const clamped = Math.max(1, Math.min(maxCupo, Math.floor(next)));
    setCantidad(String(clamped));
  };

  const handleComprar = async () => {
    setErrorCompra(null);
    setExitoCompra(null);

    if (!usuarioActivo) {
      setErrorCompra('Debes seleccionar un usuario activo para comprar.');
      return;
    }

    if (!tipoEntradaSeleccionado) {
      setErrorCompra('Debes seleccionar un tipo de entrada.');
      return;
    }

    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      setErrorCompra('La cantidad de entradas debe ser un número entero mayor a 0');
      return;
    }

    try {
      setComprando(true);
      const body = {
        compradorId: usuarioActivo.id,
        eventoId: eventoId,
        tipoEntradaId: tipoEntradaSeleccionado.id,
        cantidad: cantNum,
        confirmarInmediatamente: true
      };

      const compraRealizada = await apiClient.post('/compras', body);
      setExitoCompra({
        id: compraRealizada?.id || 'OK',
        eventoNombre: evento?.nombre || 'Evento',
        tipoEntradaNombre: tipoEntradaSeleccionado.nombre,
        cantidad: cantNum,
        total: tipoEntradaSeleccionado.precio * cantNum
      });
      // Recargar detalle para actualizar el cupo en pantalla
      await cargarDetalle();
    } catch (err) {
      setErrorCompra(err.message || 'Error al realizar la compra');
    } finally {
      setComprando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando información del evento...</Text>
      </View>
    );
  }

  if (errorCarga || !detalle) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorAlert} accessibilityRole="alert" testID="alerta-error-detalle">
          <Text style={styles.errorText}>⚠️ {errorCarga || 'Evento no encontrado'}</Text>
        </View>
        <TouchableOpacity
          style={styles.btnVolver}
          onPress={onVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver al catálogo"
          testID="btn-volver-catalogo"
        >
          <Text style={styles.btnVolverText}>← Volver al catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { evento, puntajeOrganizador, resenias } = detalle;
  const tiposEntrada = detalle.tiposEntrada || evento?.tiposEntrada || [];
  const puntajeTexto =
    puntajeOrganizador !== null && puntajeOrganizador !== undefined
      ? `${Number(puntajeOrganizador).toFixed(1)} ★`
      : 'Sin reseñas';

  const cantValida = parseInt(cantidad, 10) || 0;
  const precioUnitario = tipoEntradaSeleccionado?.precio || 0;
  const totalEstimado = precioUnitario * (cantValida > 0 ? cantValida : 0);
  const emojiCover = CATEGORY_EMOJIS[evento?.categoria?.nombre] || '🎟️';
  const organizadorNombre = `${evento?.organizador?.nombre || ''} ${evento?.organizador?.apellido || ''}`.trim() || 'Organizador';

  return (
    <ScrollView
      testID="pantalla-detalle-evento"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Botón Volver */}
      <TouchableOpacity
        style={styles.btnVolver}
        onPress={onVolver}
        accessibilityRole="button"
        accessibilityLabel="Volver al catálogo de eventos"
        testID="btn-volver-catalogo"
      >
        <Text style={styles.btnVolverText}>← Volver al Catálogo</Text>
      </TouchableOpacity>

      {/* Cover / Multimedia */}
      <View style={styles.coverCard}>
        {evento?.multimedia && evento.multimedia.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.multimediaScroll}
            testID="detalle-evento-multimedia"
          >
            {evento.multimedia.map((url, idx) => (
              <Image
                key={idx}
                source={{ uri: url }}
                style={styles.multimediaImage}
                resizeMode="cover"
                accessibilityRole="image"
                accessibilityLabel={`Imagen ${idx + 1} del evento ${evento.nombre}`}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.coverFallback}>
            <Text style={styles.coverEmoji}>{emojiCover}</Text>
          </View>
        )}
      </View>

      {/* Bloque de Información del Evento */}
      <View style={styles.headerBlock}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} testID="detalle-evento-categoria">
            🏷️ {evento?.categoria?.nombre || 'General'}
          </Text>
        </View>

        <Text
          style={styles.eventoTitulo}
          accessibilityRole="header"
          testID="detalle-evento-titulo"
        >
          {evento?.nombre}
        </Text>

        <Text style={styles.metaText} testID="detalle-evento-fecha">
          📅 {formatDate(evento?.fecha)}
        </Text>

        <Text style={styles.eventoDescripcion} testID="detalle-evento-descripcion">
          {evento?.descripcion || 'Sin descripción disponible.'}
        </Text>
      </View>

      {/* Tarjeta del Organizador */}
      <View style={styles.card}>
        <View style={styles.orgRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {organizadorNombre.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.orgLabel}>Organizado por</Text>
            <Text style={styles.orgName} testID="detalle-evento-organizador">
              {organizadorNombre}
            </Text>
          </View>
          <View style={styles.alignEnd}>
            <Stars value={puntajeOrganizador || 0} />
            <Text
              style={styles.orgScore}
              testID="detalle-evento-puntaje-organizador"
            >
              {puntajeTexto}
            </Text>
          </View>
        </View>
      </View>

      {/* Reseñas Anteriores del Organizador */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading} accessibilityRole="header">
          Reseñas anteriores del Organizador
        </Text>

        <View testID="lista-resenias-organizador" style={styles.reviewsList}>
          {resenias && resenias.length > 0 ? (
            resenias.map((r, idx) => (
              <View
                key={r.id || idx}
                style={styles.reviewCard}
                testID={`resenia-item-${r.id || idx}`}
              >
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>
                    👤 {r.comprador?.nombre || 'Comprador'} {r.comprador?.apellido || ''}
                  </Text>
                  <Stars value={r.puntuacion || 5} />
                </View>
                <Text style={styles.reviewComment}>
                  "{r.detalle || 'Sin comentario'}"
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.sinReseniasBox}>
              <Text style={styles.sinReseniasText}>
                Este organizador aún no cuenta con reseñas de eventos anteriores.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sección de Compra de Entradas */}
      <View style={styles.compraCard} testID="seccion-comprar-entradas">
        <Text style={styles.sectionHeading} accessibilityRole="header">
          Comprar Entradas
        </Text>

        <Text style={styles.subLabel}>Seleccioná un tipo de entrada:</Text>
        <View style={styles.tiposEntradaContainer} accessibilityRole="radiogroup">
          {tiposEntrada.map((tipo) => {
            const isSelected = tipoEntradaSeleccionado?.id === tipo.id;
            return (
              <TouchableOpacity
                key={tipo.id}
                style={[styles.tipoEntradaCard, isSelected && styles.tipoEntradaCardSelected]}
                onPress={() => setTipoEntradaSeleccionado(tipo)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Tipo de entrada ${tipo.nombre}, precio ${tipo.precio}, cupo restante ${tipo.cupo}`}
                testID={`tipo-entrada-${tipo.id}`}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                <View style={styles.flex}>
                  <Text style={[styles.tipoNombre, isSelected && styles.tipoNombreSelected]}>
                    {tipo.nombre}
                  </Text>
                  {tipo.descripcion ? (
                    <Text style={styles.tipoDescripcion}>{tipo.descripcion}</Text>
                  ) : null}
                  <Text style={styles.tipoCupo}>
                    Cupo restante:{' '}
                    <Text style={{ fontWeight: '800', color: tipo.cupo > 0 ? COLORS.success : COLORS.danger }}>
                      {tipo.cupo}
                    </Text>
                  </Text>
                </View>

                <Text style={[styles.tipoPrecio, isSelected && styles.tipoPrecioSelected]}>
                  {formatPrice(tipo.precio)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selector de Cantidad */}
        <View style={styles.section}>
          <Text style={styles.subLabel}>Cantidad de entradas:</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepBtn, cantValida <= 1 && styles.stepBtnDisabled]}
              onPress={() => updateQuantity(cantValida - 1)}
              disabled={cantValida <= 1}
              accessibilityRole="button"
              accessibilityLabel="Restar una entrada"
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.cantidadInput}
              value={cantidad}
              onChangeText={(text) => {
                const clean = text.replace(/[^0-9]/g, '');
                setCantidad(clean);
              }}
              keyboardType="number-pad"
              maxLength={4}
              accessibilityRole="text"
              accessibilityLabel="Cantidad de entradas"
              testID="input-cantidad-entradas"
            />

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateQuantity(cantValida + 1)}
              accessibilityRole="button"
              accessibilityLabel="Sumar una entrada"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalBreakdown}>
            {tipoEntradaSeleccionado?.nombre || 'Entrada'} × {cantValida}
          </Text>
          <Text style={styles.totalValor} testID="detalle-compra-total">
            Total a pagar: ${totalEstimado}
          </Text>
        </View>

        {/* Mensaje de Error en Compra */}
        {errorCompra ? (
          <View
            style={styles.errorAlert}
            accessibilityRole="alert"
            testID="alerta-error-compra"
          >
            <Text style={styles.errorText}>⚠️ {errorCompra}</Text>
          </View>
        ) : null}

        {/* Botón Confirmar Compra */}
        <TouchableOpacity
          style={[styles.btnComprar, comprando && styles.btnComprarDisabled]}
          onPress={handleComprar}
          disabled={comprando}
          accessibilityRole="button"
          accessibilityLabel="Confirmar compra de entradas"
          testID="btn-comprar-entradas"
        >
          {comprando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.btnComprarText}>Confirmar Compra</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Éxito de Compra */}
      {exitoCompra && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setExitoCompra(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSuccessSheet}>
              <View
                style={styles.successAlert}
                accessibilityRole="alert"
                testID="alerta-exito-compra"
              >
                <Text style={styles.successCheck}>✓</Text>
                <Text style={styles.successAlertTitle}>
                  ¡Compra confirmada con éxito!
                </Text>
              </View>

              <View style={styles.successSummaryBox}>
                <Text style={styles.successEventTitle}>{exitoCompra.eventoNombre}</Text>
                <Text style={styles.successDetailText}>
                  {exitoCompra.tipoEntradaNombre} × {exitoCompra.cantidad}
                </Text>
                <Text style={styles.successTotalText}>
                  Total abonado: {formatPrice(exitoCompra.total)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btnIrACompras}
                onPress={() => {
                  setExitoCompra(null);
                  if (onIrAMisCompras) onIrAMisCompras();
                }}
                accessibilityRole="button"
                accessibilityLabel="Ir a Mis Compras"
                testID="btn-ir-a-mis-compras"
              >
                <Text style={styles.btnIrAComprasText}>Ver en Mis Compras →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSeguirExplorando}
                onPress={() => setExitoCompra(null)}
                accessibilityRole="button"
                accessibilityLabel="Seguir explorando"
              >
                <Text style={styles.btnSeguirExplorandoText}>Seguir explorando</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40
  },
  flex: {
    flex: 1
  },
  alignEnd: {
    alignItems: 'flex-end'
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14
  },
  btnVolver: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  btnVolverText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  coverCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.secondarySoft
  },
  coverFallback: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center'
  },
  coverEmoji: {
    fontSize: 64
  },
  multimediaScroll: {
    flexDirection: 'row'
  },
  multimediaImage: {
    width: 280,
    height: 160,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: COLORS.border
  },
  headerBlock: {
    gap: 8
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.secondary
  },
  categoryBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800'
  },
  eventoTitulo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500'
  },
  eventoDescripcion: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginTop: 4
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...CARD_SHADOW
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  orgLabel: {
    color: COLORS.textMuted,
    fontSize: 12
  },
  orgName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700'
  },
  orgScore: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  starsText: {
    fontSize: 12,
    letterSpacing: 1
  },
  starsOff: {
    opacity: 0.2
  },
  section: {
    gap: 10
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text
  },
  reviewsList: {
    gap: 10
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 6,
    ...CARD_SHADOW
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    fontStyle: 'italic'
  },
  sinReseniasBox: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  sinReseniasText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic'
  },
  compraCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
    ...CARD_SHADOW
  },
  subLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  tiposEntradaContainer: {
    gap: 10
  },
  tipoEntradaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14
  },
  tipoEntradaCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioSelected: {
    borderColor: COLORS.primary
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary
  },
  tipoNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text
  },
  tipoNombreSelected: {
    color: COLORS.primary
  },
  tipoDescripcion: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },
  tipoCupo: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3
  },
  tipoPrecio: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text
  },
  tipoPrecioSelected: {
    color: COLORS.primary
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnDisabled: {
    opacity: 0.35
  },
  stepBtnText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700'
  },
  cantidadInput: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBackground,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text
  },
  totalBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    padding: 16,
    gap: 4
  },
  totalBreakdown: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  totalValor: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary
  },
  errorAlert: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    padding: 12
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600'
  },
  btnComprar: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  btnComprarDisabled: {
    opacity: 0.6
  },
  btnComprarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalSuccessSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    ...CARD_SHADOW
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.successSoft,
    borderRadius: 12,
    padding: 14
  },
  successCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800'
  },
  successAlertTitle: {
    color: '#065F46',
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1
  },
  successSummaryBox: {
    gap: 4
  },
  successEventTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800'
  },
  successDetailText: {
    color: COLORS.textMuted,
    fontSize: 14
  },
  successTotalText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700'
  },
  btnIrACompras: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  btnIrAComprasText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  btnSeguirExplorando: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  btnSeguirExplorandoText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600'
  }
});

export default DetalleEventoScreen;
