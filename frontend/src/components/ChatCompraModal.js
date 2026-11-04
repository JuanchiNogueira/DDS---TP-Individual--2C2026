import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW, formatDate } from '../theme/colors';

export function ChatCompraModal({ compra, visible, onClose, onMensajeEnviado }) {
  const { usuarioActivo } = useSession();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajesLocales, setMensajesLocales] = useState([]);
  const flatListRef = useRef(null);
  const visiblePrevRef = useRef(false);

  // Sincronizar mensajes cuando se abre el modal o cambia la compra
  useEffect(() => {
    if (visible && compra) {
      setMensajesLocales(compra.mensajes || []);
      setError(null);
      // Limpiar texto solo en la transición inicial de apertura (no en re-renders subsecuentes)
      if (!visiblePrevRef.current) {
        setTexto('');
      }
    }
    visiblePrevRef.current = visible;
  }, [compra?.id, visible]);

  const handleEnviar = async () => {
    const textoLimpio = texto.trim();
    if (!textoLimpio) {
      setError('El texto del mensaje no puede estar vacío');
      return;
    }

    if (!usuarioActivo?.id) {
      setError('No hay un usuario activo seleccionado');
      return;
    }

    if (!compra?.id) {
      setError('Identificador de compra inválido');
      return;
    }

    try {
      setEnviando(true);
      setError(null);

      const nuevoMensaje = await apiClient.post(`/compras/${compra.id}/mensajes`, {
        usuarioId: usuarioActivo.id,
        texto: textoLimpio
      });

      setMensajesLocales((prev) => [...prev, nuevoMensaje]);
      setTexto('');

      if (onMensajeEnviado) {
        onMensajeEnviado(nuevoMensaje);
      }
    } catch (err) {
      setError(err.message || 'Error al enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Cabecera del Chat */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.titulo} accessibilityRole="header">
                💬 Chat de Compra
              </Text>
              <Text style={styles.subtitulo} numberOfLines={1}>
                {compra?.evento?.nombre || 'Evento'} • Compra #{compra?.id?.slice(0, 8)}
              </Text>
              <Text style={styles.participantesTexto} numberOfLines={1}>
                Comprador: {compra?.comprador?.nombre} {compra?.comprador?.apellido} | Org:{' '}
                {compra?.evento?.organizador?.nombre || 'Organizador'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnCerrar}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar chat"
              testID="btn-cerrar-chat"
            >
              <Text style={styles.btnCerrarText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mensajes Virtualizados con FlatList */}
          <FlatList
            ref={flatListRef}
            data={mensajesLocales}
            keyExtractor={(item, index) => (item?.id ? String(item.id) : `msg-${index}`)}
            style={styles.mensajesList}
            contentContainerStyle={styles.mensajesContent}
            testID="lista-mensajes-chat"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item: m, index: idx }) => {
              const esMio = m.usuario?.id === usuarioActivo?.id;
              const nombreEmisor = m.usuario
                ? `${m.usuario.nombre || ''} ${m.usuario.apellido || ''}`.trim() || 'Usuario'
                : 'Usuario';

              return (
                <View
                  style={[
                    styles.mensajeBubble,
                    esMio ? styles.mensajeMio : styles.mensajeOtro
                  ]}
                  testID={`mensaje-chat-${m.id || idx}`}
                >
                  <View style={styles.mensajeHeader}>
                    <Text style={[styles.emisorNombre, esMio ? styles.emisorMio : styles.emisorOtro]}>
                      {esMio ? 'Tú' : nombreEmisor}
                    </Text>
                    <Text style={[styles.fechaHora, esMio && styles.fechaHoraMio]}>
                      {formatDate(m.enviado)}
                    </Text>
                  </View>
                  <Text style={[styles.mensajeTexto, esMio && styles.mensajeTextoMio]}>
                    {m.mensaje}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.sinMensajesContainer}>
                <Text style={styles.sinMensajesTexto}>
                  No hay mensajes registrados aún en esta compra. ¡Inicia la conversación!
                </Text>
              </View>
            }
          />

          {/* Alerta de Error */}
          {error ? (
            <View style={styles.errorAlert} accessibilityRole="alert" testID="alerta-error-chat">
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Entrada de Texto y Botón Enviar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribí un mensaje..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              accessibilityLabel="Escribir mensaje"
              testID="input-mensaje-chat"
            />

            <TouchableOpacity
              style={[styles.btnEnviar, enviando && styles.btnEnviarDisabled]}
              onPress={handleEnviar}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              testID="btn-enviar-mensaje"
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnEnviarText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    height: '80%',
    maxHeight: 650,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...CARD_SHADOW
  },
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12
  },
  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  subtitulo: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2
  },
  participantesTexto: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2
  },
  btnCerrar: {
    backgroundColor: COLORS.inputBackground,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    zIndex: 10
  },
  btnCerrarText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: 'bold'
  },
  mensajesList: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  mensajesContent: {
    padding: 14,
    gap: 10
  },
  mensajeBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
    gap: 4
  },
  mensajeMio: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2
  },
  mensajeOtro: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
    ...CARD_SHADOW
  },
  mensajeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  emisorNombre: {
    fontSize: 12,
    fontWeight: '700'
  },
  emisorMio: {
    color: '#EDE9FE'
  },
  emisorOtro: {
    color: COLORS.secondary
  },
  fechaHora: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  fechaHoraMio: {
    color: '#DDD6FE'
  },
  mensajeTexto: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  mensajeTextoMio: {
    color: '#FFFFFF'
  },
  sinMensajesContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  sinMensajesTexto: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic'
  },
  errorAlert: {
    backgroundColor: COLORS.dangerSoft,
    padding: 10,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 8
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 14,
    maxHeight: 90
  },
  btnEnviar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnEnviarDisabled: {
    opacity: 0.6
  },
  btnEnviarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  }
});

export default ChatCompraModal;
