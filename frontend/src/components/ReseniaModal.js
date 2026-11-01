import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW } from '../theme/colors';

const RATING_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

export function ReseniaModal({ compra, visible, onClose, onReseniaPublicada }) {
  const { usuarioActivo } = useSession();
  const [puntuacion, setPuntuacion] = useState(5);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setPuntuacion(5);
      setDetalle('');
      setError(null);
    }
  }, [visible, compra]);

  const handleEnviar = async () => {
    if (!detalle.trim()) {
      setError('El comentario de la reseña no puede estar vacío');
      return;
    }

    if (!usuarioActivo?.id) {
      setError('Usuario activo no disponible');
      return;
    }

    if (!compra?.id) {
      setError('Compra inválida');
      return;
    }

    try {
      setEnviando(true);
      setError(null);

      const nuevaResenia = await apiClient.post('/resenias', {
        compraId: compra.id,
        compradorId: usuarioActivo.id,
        puntuacion,
        detalle: detalle.trim()
      });

      if (onReseniaPublicada) {
        onReseniaPublicada(nuevaResenia);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error al publicar la reseña');
    } finally {
      setEnviando(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer} testID="modal-resenia">
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.titulo} accessibilityRole="header">
                ⭐ Calificar Evento
              </Text>
              <Text style={styles.subtitulo} numberOfLines={1}>
                {compra?.evento?.nombre || 'Evento'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnCerrar}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de reseña"
              testID="btn-cerrar-resenia"
            >
              <Text style={styles.btnCerrarText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario de Calificación */}
          <View style={styles.body}>
            <Text style={styles.label}>Puntuación (1 a 5 estrellas):</Text>
            <View style={styles.estrellasRow} accessibilityRole="radiogroup">
              {[1, 2, 3, 4, 5].map((num) => {
                const seleccionada = puntuacion >= num;
                const exacta = puntuacion === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.btnEstrella,
                      exacta && styles.btnEstrellaExacta,
                      seleccionada && styles.btnEstrellaActiva
                    ]}
                    onPress={() => setPuntuacion(num)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: exacta }}
                    accessibilityLabel={`Puntuación ${num} de 5`}
                    testID={`btn-puntuacion-${num}`}
                  >
                    <Text style={[styles.estrellaIcon, seleccionada && styles.estrellaIconActiva]}>
                      ⭐
                    </Text>
                    <Text style={[styles.estrellaNum, seleccionada && styles.estrellaNumActiva]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.ratingDescriptor}>
              {RATING_LABELS[puntuacion] || ''}
            </Text>

            {/* Comentario */}
            <Text style={styles.label}>Tu opinión o experiencia:</Text>
            <TextInput
              style={styles.comentarioInput}
              value={detalle}
              onChangeText={setDetalle}
              placeholder="Contanos qué te pareció la organización, accesos, calidad del show..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              accessibilityLabel="Comentario de la reseña"
              testID="input-comentario-resenia"
            />

            {/* Alerta de Error */}
            {error ? (
              <View
                style={styles.errorAlert}
                accessibilityRole="alert"
                testID="alerta-error-resenia"
              >
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Botón Publicar */}
            <TouchableOpacity
              style={[styles.btnPublicar, enviando && styles.btnPublicarDisabled]}
              onPress={handleEnviar}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityLabel="Publicar Reseña"
              testID="btn-enviar-resenia"
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnPublicarText}>Publicar Reseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...CARD_SHADOW
  },
  flex: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  subtitulo: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2
  },
  btnCerrar: {
    backgroundColor: COLORS.inputBackground,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnCerrarText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: 'bold'
  },
  body: {
    padding: 18,
    gap: 12
  },
  label: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700'
  },
  estrellasRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  btnEstrella: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2
  },
  btnEstrellaActiva: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  btnEstrellaExacta: {
    borderColor: '#D97706',
    borderWidth: 2
  },
  estrellaIcon: {
    fontSize: 18,
    opacity: 0.35
  },
  estrellaIconActiva: {
    opacity: 1
  },
  estrellaNum: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted
  },
  estrellaNumActiva: {
    color: '#92400E'
  },
  ratingDescriptor: {
    textAlign: 'center',
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 18
  },
  comentarioInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 96,
    textAlignVertical: 'top'
  },
  errorAlert: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    padding: 10
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600'
  },
  btnPublicar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4
  },
  btnPublicarDisabled: {
    opacity: 0.6
  },
  btnPublicarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15
  }
});

export default ReseniaModal;
