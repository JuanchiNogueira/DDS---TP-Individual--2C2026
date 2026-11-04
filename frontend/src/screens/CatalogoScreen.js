import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW, formatDate, formatPrice, CATEGORY_EMOJIS } from '../theme/colors';

const EventoCard = memo(function EventoCard({
  item,
  fav,
  favoritoCargando,
  usuarioActivo,
  onToggleFavorito,
  onVerDetalle
}) {
  const precioMin = useMemo(() => {
    if (item.tiposEntrada && item.tiposEntrada.length > 0) {
      return Math.min(...item.tiposEntrada.map((t) => t.precio));
    }
    return 0;
  }, [item.tiposEntrada]);

  const puntajeTexto =
    item.puntajeOrganizador !== null && item.puntajeOrganizador !== undefined
      ? `${Number(item.puntajeOrganizador).toFixed(1)} ★`
      : 'Sin reseñas';
  const primerImagen = item.multimedia && item.multimedia.length > 0 ? item.multimedia[0] : null;
  const emojiCover = CATEGORY_EMOJIS[item.categoria?.nombre] || '🎟️';

  return (
    <View
      style={styles.card}
      testID={`evento-card-${item.id}`}
      accessibilityLabel={`Evento ${item.nombre}`}
    >
      {/* Cover Header con Imagen o Emoji */}
      <View style={styles.cardCover}>
        {primerImagen ? (
          <Image source={{ uri: primerImagen }} style={styles.cardCoverImage} resizeMode="cover" />
        ) : (
          <Text style={styles.cardCoverEmoji}>{emojiCover}</Text>
        )}

        {/* Categoría Pill */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} testID={`evento-categoria-${item.id}`}>
            {item.categoria?.nombre || 'General'}
          </Text>
        </View>

        {/* Botón Favorito */}
        <TouchableOpacity
          style={[styles.btnFavorito, fav && styles.btnFavoritoActivo]}
          onPress={() => onToggleFavorito(item.id)}
          disabled={favoritoCargando || !usuarioActivo}
          accessibilityRole="button"
          accessibilityLabel={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          testID={`btn-favorito-${item.id}`}
        >
          <Text style={[styles.btnFavoritoText, fav && styles.btnFavoritoTextActivo]}>
            {fav ? '❤️ Favorito' : '🤍 Favorito'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cuerpo de la Tarjeta */}
      <View style={styles.cardBody}>
        <Text
          style={styles.cardTitle}
          accessibilityRole="header"
          testID={`evento-nombre-${item.id}`}
          numberOfLines={2}
        >
          {item.nombre}
        </Text>

        <Text style={styles.cardDate} testID={`evento-fecha-${item.id}`}>
          📅 {formatDate(item.fecha)}
        </Text>

        {item.descripcion ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : null}

        {/* Fila de Organizador y Precio */}
        <View style={styles.cardRow}>
          <Text style={styles.cardRating} testID={`evento-puntaje-${item.id}`}>
            ⭐ {puntajeTexto}{' '}
            <Text style={styles.cardOrganizerName}>
              ({item.organizador?.nombre || 'Org'})
            </Text>
          </Text>

          <View style={styles.priceTag}>
            <Text style={styles.priceTagText} testID={`evento-precio-${item.id}`}>
              Desde {formatPrice(precioMin)}
            </Text>
          </View>
        </View>

        {/* CTA Detalle */}
        <TouchableOpacity
          style={styles.btnDetalle}
          onPress={() => onVerDetalle && onVerDetalle(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${item.nombre}`}
          testID={`btn-ver-detalle-${item.id}`}
        >
          <Text style={styles.btnDetalleText}>Ver Detalle y Comprar →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export function CatalogoScreen({ onVerDetalle }) {
  const { usuarioActivo, toggleFavorito, esFavorito, refreshKey } = useSession();

  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [ordenarPor, setOrdenarPor] = useState(''); // '' | 'precio' | 'fecha' | 'puntaje'
  const [orden, setOrden] = useState('asc'); // 'asc' | 'desc'

  const [categorias, setCategorias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [cargandoEventos, setCargandoEventos] = useState(false);
  const [error, setError] = useState(null);
  const [favoritoCargando, setFavoritoCargando] = useState(null);

  // Cargar Categorías
  const cargarCategorias = useCallback(async () => {
    try {
      setCargandoCategorias(true);
      const data = await apiClient.get('/categorias');
      setCategorias(data || []);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError(err.message || 'Error al cargar categorías');
    } finally {
      setCargandoCategorias(false);
    }
  }, []);

  // Cargar categorías al iniciar o ante reset de seed
  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias, refreshKey]);

  // Debounce para búsqueda textual y cambio de filtros con cancelación de peticiones desfasadas (evita race conditions)
  useEffect(() => {
    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        setCargandoEventos(true);
        setError(null);

        const params = {};
        if (texto.trim()) params.texto = texto.trim();
        if (categoriaId) params.categoriaId = categoriaId;
        if (ordenarPor) {
          params.ordenarPor = ordenarPor;
          params.orden = orden;
        }

        const data = await apiClient.get('/eventos', { params });
        if (!cancelado) {
          setEventos(data || []);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err.message || 'Error al buscar eventos');
        }
      } finally {
        if (!cancelado) {
          setCargandoEventos(false);
        }
      }
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [texto, categoriaId, ordenarPor, orden, refreshKey]);

  const handleToggleFavorito = useCallback(async (eventoId) => {
    try {
      setFavoritoCargando(eventoId);
      await toggleFavorito(eventoId);
    } catch (err) {
      console.error('Error al alternar favorito:', err);
    } finally {
      setFavoritoCargando(null);
    }
  }, [toggleFavorito]);

  const renderEventoCard = useCallback(({ item }) => (
    <EventoCard
      item={item}
      fav={esFavorito(item.id)}
      favoritoCargando={favoritoCargando === item.id}
      usuarioActivo={usuarioActivo}
      onToggleFavorito={handleToggleFavorito}
      onVerDetalle={onVerDetalle}
    />
  ), [esFavorito, favoritoCargando, usuarioActivo, handleToggleFavorito, onVerDetalle]);

  return (
    <View style={styles.container}>
      {/* Sección de Filtros y Búsqueda */}
      <View style={styles.filterSection}>
        {/* Buscador */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos por nombre o descripción..."
            placeholderTextColor={COLORS.textMuted}
            value={texto}
            onChangeText={setTexto}
            accessibilityRole="search"
            accessibilityLabel="Buscar eventos por texto"
            testID="input-buscar-evento"
          />
          {texto ? (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setTexto('')}
              accessibilityRole="button"
              accessibilityLabel="Limpiar texto de búsqueda"
              testID="btn-limpiar-busqueda"
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filtro de Categorías */}
        <View style={styles.categorySection} testID="filtro-categoria">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, categoriaId === '' && styles.categoryChipActive]}
              onPress={() => setCategoriaId('')}
              accessibilityRole="button"
              accessibilityLabel="Todas las categorías"
              testID="filtro-categoria-todas"
            >
              <Text
                style={[
                  styles.categoryChipText,
                  categoriaId === '' && styles.categoryChipTextActive
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {categorias.map((cat) => {
              const activo = categoriaId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, activo && styles.categoryChipActive]}
                  onPress={() => setCategoriaId(cat.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por categoría ${cat.nombre}`}
                  testID={`filtro-categoria-${cat.id}`}
                >
                  <Text
                    style={[styles.categoryChipText, activo && styles.categoryChipTextActive]}
                  >
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selector de Ordenamiento */}
        <View style={styles.sortSection} testID="selector-ordenar-por">
          <Text style={styles.sortLabel}>Ordenar:</Text>
          <View style={styles.sortOptionsRow}>
            <TouchableOpacity
              style={[styles.sortChip, ordenarPor === '' && styles.sortChipActive]}
              onPress={() => setOrdenarPor('')}
              accessibilityRole="button"
              accessibilityLabel="Sin ordenamiento específico"
              testID="orden-por-defecto"
            >
              <Text style={[styles.sortChipText, ordenarPor === '' && styles.sortChipTextActive]}>
                Por defecto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortChip, ordenarPor === 'precio' && styles.sortChipActive]}
              onPress={() => setOrdenarPor('precio')}
              accessibilityRole="button"
              accessibilityLabel="Ordenar por precio"
              testID="orden-por-precio"
            >
              <Text
                style={[styles.sortChipText, ordenarPor === 'precio' && styles.sortChipTextActive]}
              >
                Precio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortChip, ordenarPor === 'fecha' && styles.sortChipActive]}
              onPress={() => setOrdenarPor('fecha')}
              accessibilityRole="button"
              accessibilityLabel="Ordenar por fecha"
              testID="orden-por-fecha"
            >
              <Text
                style={[styles.sortChipText, ordenarPor === 'fecha' && styles.sortChipTextActive]}
              >
                Fecha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortChip, ordenarPor === 'puntaje' && styles.sortChipActive]}
              onPress={() => setOrdenarPor('puntaje')}
              accessibilityRole="button"
              accessibilityLabel="Ordenar por puntaje"
              testID="orden-por-puntaje"
            >
              <Text
                style={[styles.sortChipText, ordenarPor === 'puntaje' && styles.sortChipTextActive]}
              >
                Mejor Puntaje
              </Text>
            </TouchableOpacity>

            {ordenarPor !== '' ? (
              <TouchableOpacity
                style={styles.orderDirectionBtn}
                onPress={() => setOrden((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                accessibilityRole="button"
                accessibilityLabel={`Dirección: ${orden === 'asc' ? 'Ascendente' : 'Descendente'}`}
                testID="btn-orden-direccion"
              >
                <Text style={styles.orderDirectionText}>
                  {orden === 'asc' ? 'Asc' : 'Desc'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Contador de eventos */}
        <Text style={styles.eventsCount}>
          {eventos.length} {eventos.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
        </Text>
      </View>

      {/* Error general */}
      {error ? (
        <View style={styles.errorContainer} accessibilityRole="alert" testID="alerta-error-catalogo">
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Listado de Eventos */}
      {cargandoEventos ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Buscando eventos disponibles...</Text>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.id}
          renderItem={renderEventoCard}
          contentContainerStyle={styles.listContainer}
          testID="lista-eventos"
          ListEmptyComponent={
            <View style={styles.emptyContainer} testID="sin-eventos-alerta">
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No encontramos eventos</Text>
              <Text style={styles.emptySubtitle}>
                Probá modificando los términos de búsqueda o seleccionando otra categoría.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  filterSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text
  },
  clearSearchBtn: {
    padding: 6
  },
  clearSearchText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: 'bold'
  },
  categorySection: {
    marginTop: 2
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8
  },
  categoryChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    minHeight: 32,
    justifyContent: 'center'
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  categoryChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700'
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  sortLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4
  },
  sortOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  sortChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 28,
    justifyContent: 'center'
  },
  sortChipActive: {
    backgroundColor: COLORS.secondarySoft,
    borderColor: COLORS.secondary
  },
  sortChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  sortChipTextActive: {
    color: COLORS.secondary,
    fontWeight: '700'
  },
  orderDirectionBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 76,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  orderDirectionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  eventsCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500'
  },
  errorContainer: {
    backgroundColor: COLORS.dangerSoft,
    padding: 12,
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.danger
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14
  },
  listContainer: {
    padding: 16,
    gap: 16
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...CARD_SHADOW
  },
  cardCover: {
    height: 120,
    backgroundColor: COLORS.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  cardCoverImage: {
    width: '100%',
    height: '100%'
  },
  cardCoverEmoji: {
    fontSize: 50
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800'
  },
  btnFavorito: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  btnFavoritoActivo: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171'
  },
  btnFavoritoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text
  },
  btnFavoritoTextActivo: {
    color: '#DC2626'
  },
  cardBody: {
    padding: 14,
    gap: 8
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text
  },
  cardDate: {
    color: COLORS.textMuted,
    fontSize: 13
  },
  cardDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8
  },
  cardRating: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1
  },
  cardOrganizerName: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  priceTag: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  priceTagText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  btnDetalle: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  btnDetalleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 6
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

export default CatalogoScreen;
