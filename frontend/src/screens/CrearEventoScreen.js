import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW } from '../theme/colors';

const createDraftTicket = (initial = {}) => ({
  key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  nombre: initial.nombre || '',
  precio: initial.precio || '',
  cupo: initial.cupo || ''
});

export function CrearEventoScreen({ onEventoCreado }) {
  const { usuarioActivo, refreshKey } = useSession();

  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fecha, setFecha] = useState('2027-11-20T20:00:00.000Z');
  const [multimediaUrl, setMultimediaUrl] = useState('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4');
  const [descripcion, setDescripcion] = useState('');

  const [tiposEntrada, setTiposEntrada] = useState(() => [
    createDraftTicket({
      nombre: 'Entrada General',
      precio: '5000',
      cupo: '100'
    })
  ]);

  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    let montado = true;
    async function fetchCategorias() {
      try {
        setCargandoCategorias(true);
        const data = await apiClient.get('/categorias');
        if (montado) {
          setCategorias(data || []);
          if (data && data.length > 0) {
            setCategoriaId((prev) => prev || data[0].id);
          }
        }
      } catch (err) {
        if (montado) {
          setError(err.message || 'Error al cargar categorías');
        }
      } finally {
        if (montado) {
          setCargandoCategorias(false);
        }
      }
    }
    fetchCategorias();
    return () => {
      montado = false;
    };
  }, [refreshKey]);

  const agregarTipoEntrada = () => {
    setTiposEntrada((prev) => [...prev, createDraftTicket()]);
  };

  const quitarTipoEntrada = (key) => {
    if (tiposEntrada.length <= 1) return;
    setTiposEntrada((prev) => prev.filter((t) => t.key !== key));
  };

  const actualizarTipoEntrada = (key, campo, valor) => {
    setTiposEntrada((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [campo]: valor } : t))
    );
  };

  const resetForm = () => {
    setNombre('');
    setFecha('2027-11-20T20:00:00.000Z');
    setMultimediaUrl('');
    setDescripcion('');
    setTiposEntrada([
      createDraftTicket({
        nombre: 'Entrada General',
        precio: '5000',
        cupo: '100'
      })
    ]);
  };

  const handlePublicar = async () => {
    setError(null);
    setExito(null);

    if (!nombre.trim()) {
      setError('El nombre del evento es requerido');
      return;
    }

    if (!categoriaId) {
      setError('Debe seleccionar una categoría');
      return;
    }

    if (!fecha.trim()) {
      setError('La fecha del evento es requerida');
      return;
    }

    if (!usuarioActivo?.id) {
      setError('Usuario organizador no disponible');
      return;
    }

    // Validar tipos de entrada
    if (tiposEntrada.length === 0) {
      setError('Debe ingresar al menos un tipo de entrada');
      return;
    }

    for (let i = 0; i < tiposEntrada.length; i++) {
      const t = tiposEntrada[i];
      if (!t.nombre.trim()) {
        setError(`El nombre del tipo de entrada #${i + 1} es requerido`);
        return;
      }
      const p = parseFloat(t.precio);
      if (isNaN(p) || p < 0) {
        setError(`El precio del tipo de entrada #${i + 1} debe ser mayor o igual a 0`);
        return;
      }
      const c = parseInt(t.cupo, 10);
      if (isNaN(c) || c <= 0) {
        setError(`El cupo del tipo de entrada #${i + 1} debe ser un entero positivo`);
        return;
      }
    }

    try {
      setPublicando(true);
      const parsedDate = new Date(fecha.trim());
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaId,
        fecha: isNaN(parsedDate.getTime()) ? fecha.trim() : parsedDate.toISOString(),
        organizadorId: usuarioActivo.id,
        tiposEntrada: tiposEntrada.map((t) => ({
          nombre: t.nombre.trim(),
          precio: parseFloat(t.precio),
          cupo: parseInt(t.cupo, 10)
        })),
        multimedia: multimediaUrl.trim() ? [multimediaUrl.trim()] : []
      };

      const creado = await apiClient.post('/eventos', payload);
      setExito(creado);
      resetForm();
    } catch (err) {
      setError(err.message || 'Error al publicar el evento');
    } finally {
      setPublicando(false);
    }
  };

  if (exito) {
    return (
      <View style={styles.successWrapper}>
        <View testID="alerta-exito-crear-evento" style={styles.successCard}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>¡Evento publicado con éxito!</Text>
          <Text style={styles.successSubtitle}>
            "{exito.nombre || 'Tu evento'}" ya está publicado y disponible para los compradores en el catálogo.
          </Text>

          <TouchableOpacity
            testID="btn-volver-a-mis-eventos"
            accessibilityRole="button"
            accessibilityLabel="Volver a mis eventos"
            onPress={() => {
              setExito(null);
              if (onEventoCreado) onEventoCreado();
            }}
            style={styles.publishButton}
          >
            <Text style={styles.publishButtonText}>Ver en Mis Eventos →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Publicar otro evento"
            onPress={() => setExito(null)}
            style={styles.anotherButton}
          >
            <Text style={styles.anotherButtonText}>Publicar otro evento</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            ➕ Publicar Nuevo Evento
          </Text>
          <Text style={styles.pageSubtitle}>
            Completá los datos del evento y configurá los tipos de entrada con su cupo disponible.
          </Text>
        </View>

        {/* Tarjeta de Información General */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre del evento *</Text>
            <TextInput
              testID="input-evento-nombre"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Fito Páez en el Teatro Gran Rex"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Categoría *</Text>
            {cargandoCategorias ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={styles.chipsRow}>
                {categorias.map((c) => {
                  const active = c.id === categoriaId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      testID={`chip-categoria-${c.nombre?.toLowerCase()}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setCategoriaId(c.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {c.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fecha y hora (formato ISO) *</Text>
            <TextInput
              testID="input-evento-fecha"
              value={fecha}
              onChangeText={setFecha}
              placeholder="2027-11-20T20:00:00.000Z"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>URL de imagen o multimedia</Text>
            <TextInput
              testID="input-evento-multimedia"
              value={multimediaUrl}
              onChangeText={setMultimediaUrl}
              placeholder="https://images.unsplash.com/photo-..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="url"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descripción del evento</Text>
            <TextInput
              testID="input-evento-descripcion"
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Contá de qué se trata el show, horarios, accesos..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textarea]}
            />
          </View>
        </View>

        {/* Tarjeta de Tipos de Entrada */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading} accessibilityRole="header">
            🎫 Tipos de Entrada y Cupos
          </Text>

          {tiposEntrada.map((t, i) => (
            <View key={t.key} testID={`tipo-entrada-form-${i}`} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle}>Entrada #{i + 1}</Text>
                {tiposEntrada.length > 1 && (
                  <TouchableOpacity
                    testID={`btn-eliminar-tipo-entrada-${i}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar tipo de entrada ${i + 1}`}
                    onPress={() => quitarTipoEntrada(t.key)}
                  >
                    <Text style={styles.removeText}>🗑️ Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                testID={`input-tipo-entrada-nombre-${i}`}
                value={t.nombre}
                onChangeText={(v) => actualizarTipoEntrada(t.key, 'nombre', v)}
                placeholder="Nombre (ej: General, Campo VIP)"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <View style={styles.ticketInputsRow}>
                <View style={styles.flex}>
                  <Text style={styles.inputSublabel}>Precio ($)</Text>
                  <TextInput
                    testID={`input-tipo-entrada-precio-${i}`}
                    value={t.precio}
                    onChangeText={(v) => actualizarTipoEntrada(t.key, 'precio', v)}
                    placeholder="5000"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                <View style={styles.flex}>
                  <Text style={styles.inputSublabel}>Cupo disponible</Text>
                  <TextInput
                    testID={`input-tipo-entrada-cupo-${i}`}
                    value={t.cupo}
                    onChangeText={(v) => actualizarTipoEntrada(t.key, 'cupo', v)}
                    placeholder="100"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            testID="btn-agregar-tipo-entrada"
            accessibilityRole="button"
            accessibilityLabel="Agregar otro tipo de entrada"
            onPress={agregarTipoEntrada}
            style={styles.addTicketBtn}
          >
            <Text style={styles.addTicketBtnText}>+ Agregar otro tipo de entrada</Text>
          </TouchableOpacity>
        </View>

        {/* Alerta de Error */}
        {error ? (
          <View testID="alerta-error-crear-evento" style={styles.errorAlert} accessibilityRole="alert">
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Botón Publicar */}
        <TouchableOpacity
          testID="btn-publicar-evento"
          accessibilityRole="button"
          accessibilityLabel="Publicar evento"
          onPress={handlePublicar}
          disabled={publicando}
          style={[styles.publishButton, publicando && styles.publishButtonDisabled]}
        >
          {publicando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishButtonText}>🚀 Publicar Evento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40
  },
  flex: {
    flex: 1
  },
  pageHeader: {
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
    ...CARD_SHADOW
  },
  field: {
    gap: 6
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700'
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  chipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  chipTextActive: {
    color: COLORS.primary
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800'
  },
  ticketCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 8
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ticketTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700'
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700'
  },
  ticketInputsRow: {
    flexDirection: 'row',
    gap: 10
  },
  inputSublabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4
  },
  addTicketBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  addTicketBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700'
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
  publishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  publishButtonDisabled: {
    opacity: 0.6
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  successWrapper: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.background
  },
  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: 12,
    alignItems: 'stretch',
    ...CARD_SHADOW
  },
  successEmoji: {
    fontSize: 44,
    textAlign: 'center'
  },
  successTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center'
  },
  successSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8
  },
  anotherButton: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  anotherButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700'
  }
});

export default CrearEventoScreen;
