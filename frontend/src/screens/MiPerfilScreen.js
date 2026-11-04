import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import apiClient from '../api/apiClient';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW } from '../theme/colors';

export function MiPerfilScreen({ onNavegar }) {
  const { usuarioActivo, modo, refreshKey } = useSession();
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  const esComprador = modo === 'COMPRADOR';

  const cargarDatosPerfil = useCallback(async () => {
    if (!usuarioActivo?.id) {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      if (esComprador) {
        // Cargar estadísticas del comprador
        const compras = await apiClient.get(`/compras/comprador/${usuarioActivo.id}`);
        const totalCompras = compras?.length || 0;
        const confirmadas = compras?.filter((c) => c.estado === 'CONFIRMADA' || c.estado === 'UTILIZADA')?.length || 0;
        const calificadas = compras?.filter((c) => c.yaCalificada)?.length || 0;

        setStats({
          totalCompras,
          confirmadas,
          calificadas
        });
      } else {
        // Cargar estadísticas del organizador
        const todosEventos = await apiClient.get('/eventos', {
          params: { incluirPasados: true }
        });
        const misEventos = (todosEventos || []).filter(
          (e) => e.organizador?.id === usuarioActivo.id
        );

        let promedio = 0;
        let totalResenias = 0;
        try {
          const resResenias = await apiClient.get(`/resenias/organizador/${usuarioActivo.id}`);
          promedio = resResenias?.promedio || 0;
          totalResenias = resResenias?.resenias?.length || 0;
        } catch {
          promedio = 0;
        }

        setStats({
          totalEventos: misEventos.length,
          promedio: Number(promedio).toFixed(1),
          totalResenias
        });
      }
    } catch (err) {
      console.error('Error al cargar datos del perfil:', err);
    } finally {
      setCargando(false);
    }
  }, [usuarioActivo?.id, esComprador]);

  useEffect(() => {
    cargarDatosPerfil();
  }, [cargarDatosPerfil, refreshKey]);

  const nombreUsuario = usuarioActivo
    ? `${usuarioActivo.nombre || ''} ${usuarioActivo.apellido || ''}`.trim() || usuarioActivo.id
    : 'Usuario';

  const iniciales =
    nombreUsuario
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      testID="pantalla-mi-perfil"
    >
      {/* Botón Volver */}
      <TouchableOpacity
        style={styles.btnVolver}
        onPress={() => onNavegar(esComprador ? 'catalogo' : 'org-eventos')}
        accessibilityRole="button"
        accessibilityLabel="Volver a la pantalla principal"
        testID="btn-perfil-volver"
      >
        <Text style={styles.btnVolverText}>← Volver</Text>
      </TouchableOpacity>

      {/* Tarjeta de Identidad del Usuario */}
      <View style={styles.profileCard}>
        <View
          style={[
            styles.avatarCircle,
            esComprador ? styles.avatarCircleComp : styles.avatarCircleOrg
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              esComprador ? styles.avatarTextComp : styles.avatarTextOrg
            ]}
          >
            {iniciales}
          </Text>
        </View>

        <Text
          style={styles.userName}
          accessibilityRole="header"
          testID="perfil-nombre-usuario"
        >
          {nombreUsuario}
        </Text>

        <View
          style={[
            styles.roleBadge,
            esComprador ? styles.roleBadgeComp : styles.roleBadgeOrg
          ]}
          testID="perfil-rol-usuario"
        >
          <Text
            style={[
              styles.roleBadgeText,
              esComprador ? styles.roleBadgeTextComp : styles.roleBadgeTextOrg
            ]}
          >
            Rol: {modo}
          </Text>
        </View>

        <Text style={styles.userIdText}>ID: {usuarioActivo?.id}</Text>
      </View>

      {/* Métricas y Estadísticas */}
      <Text style={styles.sectionTitle}>Métricas de Actividad</Text>

      {cargando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={esComprador ? COLORS.primary : COLORS.secondary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      ) : esComprador ? (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.totalCompras ?? 0}</Text>
            <Text style={styles.statLabel}>🎟️ Compras</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.confirmadas ?? 0}</Text>
            <Text style={styles.statLabel}>✅ Activas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.calificadas ?? 0}</Text>
            <Text style={styles.statLabel}>⭐ Reseñas</Text>
          </View>
        </View>
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.totalEventos ?? 0}</Text>
            <Text style={styles.statLabel}>🎪 Eventos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.promedio ?? '0.0'} ★</Text>
            <Text style={styles.statLabel}>⭐ Reputación</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.totalResenias ?? 0}</Text>
            <Text style={styles.statLabel}>💬 Opiniones</Text>
          </View>
        </View>
      )}

      {/* Accesos Rápidos */}
      <Text style={styles.sectionTitle}>Accesos Rápidos</Text>

      <View style={styles.actionsCard}>
        {esComprador ? (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onNavegar('catalogo')}
              accessibilityRole="button"
              accessibilityLabel="Explorar catálogo de eventos"
              testID="btn-perfil-ir-catalogo"
            >
              <Text style={styles.actionBtnIcon}>📋</Text>
              <View style={styles.flex}>
                <Text style={styles.actionBtnText}>Catálogo de Eventos</Text>
                <Text style={styles.actionBtnSub}>Explora y adquiere entradas vigentes</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onNavegar('mis-compras')}
              accessibilityRole="button"
              accessibilityLabel="Ir a mis compras"
              testID="btn-perfil-ir-compras"
            >
              <Text style={styles.actionBtnIcon}>🎟️</Text>
              <View style={styles.flex}>
                <Text style={styles.actionBtnText}>Mis Compras</Text>
                <Text style={styles.actionBtnSub}>Consulta tus tickets, chat y calificaciones</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onNavegar('org-eventos')}
              accessibilityRole="button"
              accessibilityLabel="Gestionar mis eventos"
              testID="btn-perfil-ir-org-eventos"
            >
              <Text style={styles.actionBtnIcon}>📊</Text>
              <View style={styles.flex}>
                <Text style={styles.actionBtnText}>Mis Eventos y Ventas</Text>
                <Text style={styles.actionBtnSub}>Monitorea compras, cupos y mensajes</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onNavegar('org-crear-evento')}
              accessibilityRole="button"
              accessibilityLabel="Publicar nuevo evento"
              testID="btn-perfil-ir-crear-evento"
            >
              <Text style={styles.actionBtnIcon}>➕</Text>
              <View style={styles.flex}>
                <Text style={styles.actionBtnText}>Publicar Evento</Text>
                <Text style={styles.actionBtnSub}>Crea un nuevo recital, show o función</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Cerrar Sesión */}
      <TouchableOpacity
        style={styles.btnLogout}
        onPress={() => onNavegar('landing')}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión de usuario"
        testID="btn-perfil-logout"
      >
        <Text style={styles.btnLogoutText}>🚪 Cerrar Sesión</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
    gap: 14
  },
  flex: {
    flex: 1
  },
  btnVolver: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  btnVolverText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700'
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CARD_SHADOW
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  avatarCircleComp: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  avatarCircleOrg: {
    backgroundColor: COLORS.secondarySoft,
    borderWidth: 2,
    borderColor: COLORS.secondary
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800'
  },
  avatarTextComp: {
    color: COLORS.primary
  },
  avatarTextOrg: {
    color: COLORS.secondary
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  roleBadgeComp: {
    backgroundColor: COLORS.primarySoft
  },
  roleBadgeOrg: {
    backgroundColor: COLORS.secondarySoft
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800'
  },
  roleBadgeTextComp: {
    color: COLORS.primary
  },
  roleBadgeTextOrg: {
    color: COLORS.secondary
  },
  userIdText: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    ...CARD_SHADOW
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  actionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    ...CARD_SHADOW
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12
  },
  actionBtnIcon: {
    fontSize: 22
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text
  },
  actionBtnSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border
  },
  btnLogout: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6
  },
  btnLogoutText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '800'
  }
});

export default MiPerfilScreen;
