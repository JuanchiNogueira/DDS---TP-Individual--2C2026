import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSession } from '../context/SessionContext';
import { COLORS, CARD_SHADOW } from '../theme/colors';

export function HeaderBar({ pantallaActual, onNavegar }) {
  const {
    usuarioActivo,
    modo,
    reiniciarDatos
  } = useSession();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const [mensajeSeed, setMensajeSeed] = useState('');
  const seedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (seedTimerRef.current) {
        clearTimeout(seedTimerRef.current);
      }
    };
  }, []);

  const handleReiniciarSeed = async () => {
    try {
      setReiniciando(true);
      setMensajeSeed('');
      if (seedTimerRef.current) clearTimeout(seedTimerRef.current);

      await reiniciarDatos();
      setMensajeSeed('¡Datos reiniciados!');
      seedTimerRef.current = setTimeout(() => setMensajeSeed(''), 3000);
    } catch {
      setMensajeSeed('Error al reiniciar datos');
      seedTimerRef.current = setTimeout(() => setMensajeSeed(''), 3000);
    } finally {
      setReiniciando(false);
    }
  };

  const handleNavegarYSalirMenu = (destino) => {
    setMenuAbierto(false);
    onNavegar(destino);
  };

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

  const esComprador = modo === 'COMPRADOR';

  return (
    <View style={styles.container}>
      {/* Barra Superior Limpia y Compacta */}
      <View style={styles.topBar}>
        {/* Botón Menú Hamburguesa */}
        <TouchableOpacity
          testID="btn-menu-hamburguesa"
          accessibilityRole="button"
          accessibilityLabel="Abrir menú de navegación"
          onPress={() => setMenuAbierto(true)}
          style={styles.hamburgerBtn}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>

        {/* Marca Centrada */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle} accessibilityRole="header">
            🎟️ AI Ticket It
          </Text>
          <View style={[styles.roleBadge, esComprador ? styles.roleBadgeComp : styles.roleBadgeOrg]}>
            <Text style={[styles.roleBadgeText, esComprador ? styles.roleBadgeTextComp : styles.roleBadgeTextOrg]}>
              {modo}
            </Text>
          </View>
        </View>

        {/* Avatar sutil del usuario a la derecha (lleva a Mi Perfil) */}
        <TouchableOpacity
          testID="btn-header-avatar-perfil"
          accessibilityRole="button"
          accessibilityLabel={`Mi Perfil - ${nombreUsuario}`}
          onPress={() => onNavegar('perfil')}
          style={[styles.topAvatar, esComprador ? styles.drawerAvatarComp : styles.drawerAvatarOrg]}
        >
          <Text style={[styles.topAvatarText, esComprador ? styles.drawerAvatarTextComp : styles.drawerAvatarTextOrg]}>
            {iniciales}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alerta de reinicio de seed si ocurre */}
      {mensajeSeed ? (
        <View style={styles.seedAlert} accessibilityRole="alert" testID="alerta-seed">
          <Text style={styles.seedAlertText}>{mensajeSeed}</Text>
        </View>
      ) : null}

      {/* Modal / Drawer Lateral (Menú Hamburguesa) */}
      <Modal
        visible={menuAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAbierto(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Fondo para cerrar al tocar fuera */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setMenuAbierto(false)}
          />

          {/* Panel Lateral Drawer */}
          <View style={styles.drawerPanel}>
            {/* Cabecera del Drawer */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity
                style={styles.drawerUserRow}
                onPress={() => handleNavegarYSalirMenu('perfil')}
                accessibilityRole="button"
                accessibilityLabel="Ver Mi Perfil"
              >
                <View style={[styles.drawerAvatar, esComprador ? styles.drawerAvatarComp : styles.drawerAvatarOrg]}>
                  <Text style={[styles.drawerAvatarText, esComprador ? styles.drawerAvatarTextComp : styles.drawerAvatarTextOrg]}>
                    {iniciales}
                  </Text>
                </View>
                <View style={styles.drawerUserInfo}>
                  <Text style={styles.drawerUserName} numberOfLines={1}>
                    {nombreUsuario}
                  </Text>
                  <View style={[styles.roleBadge, esComprador ? styles.roleBadgeComp : styles.roleBadgeOrg]}>
                    <Text style={[styles.roleBadgeText, esComprador ? styles.roleBadgeTextComp : styles.roleBadgeTextOrg]}>
                      {modo}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                testID="btn-cerrar-drawer"
                accessibilityRole="button"
                accessibilityLabel="Cerrar menú"
                onPress={() => setMenuAbierto(false)}
                style={styles.drawerCloseBtn}
              >
                <Text style={styles.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Opciones de Navegación */}
            <ScrollView contentContainerStyle={styles.drawerContent}>
              <Text style={styles.sectionHeader}>NAVEGACIÓN</Text>

              {/* Opción Mi Perfil (disponible para Comprador y Organizador) */}
              <TouchableOpacity
                testID="nav-mi-perfil"
                accessibilityRole="button"
                accessibilityLabel="Ir a Mi Perfil"
                onPress={() => handleNavegarYSalirMenu('perfil')}
                style={[
                  styles.drawerItem,
                  pantallaActual === 'perfil' && (esComprador ? styles.drawerItemActive : styles.drawerItemActiveOrg)
                ]}
              >
                <Text style={styles.drawerItemIcon}>👤</Text>
                <Text
                  style={[
                    styles.drawerItemText,
                    pantallaActual === 'perfil' && (esComprador ? styles.drawerItemTextActive : styles.drawerItemTextActiveOrg)
                  ]}
                >
                  Mi Perfil
                </Text>
                <Text style={styles.drawerChevron}>›</Text>
              </TouchableOpacity>

              {esComprador ? (
                <>
                  <TouchableOpacity
                    testID="nav-catalogo"
                    accessibilityRole="button"
                    accessibilityLabel="Ir al Catálogo de Eventos"
                    onPress={() => handleNavegarYSalirMenu('catalogo')}
                    style={[
                      styles.drawerItem,
                      (pantallaActual === 'catalogo' || pantallaActual === 'detalle') && styles.drawerItemActive
                    ]}
                  >
                    <Text style={styles.drawerItemIcon}>📋</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        (pantallaActual === 'catalogo' || pantallaActual === 'detalle') && styles.drawerItemTextActive
                      ]}
                    >
                      Catálogo de Eventos
                    </Text>
                    <Text style={styles.drawerChevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="nav-mis-compras"
                    accessibilityRole="button"
                    accessibilityLabel="Ir a Mis Compras"
                    onPress={() => handleNavegarYSalirMenu('mis-compras')}
                    style={[
                      styles.drawerItem,
                      pantallaActual === 'mis-compras' && styles.drawerItemActive
                    ]}
                  >
                    <Text style={styles.drawerItemIcon}>🎟️</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        pantallaActual === 'mis-compras' && styles.drawerItemTextActive
                      ]}
                    >
                      Mis Compras
                    </Text>
                    <Text style={styles.drawerChevron}>›</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    testID="nav-org-eventos"
                    accessibilityRole="button"
                    accessibilityLabel="Ir a Mis Eventos y Ventas"
                    onPress={() => handleNavegarYSalirMenu('org-eventos')}
                    style={[
                      styles.drawerItem,
                      pantallaActual === 'org-eventos' && styles.drawerItemActiveOrg
                    ]}
                  >
                    <Text style={styles.drawerItemIcon}>📊</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        pantallaActual === 'org-eventos' && styles.drawerItemTextActiveOrg
                      ]}
                    >
                      Mis Eventos y Ventas
                    </Text>
                    <Text style={styles.drawerChevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="nav-org-crear-evento"
                    accessibilityRole="button"
                    accessibilityLabel="Crear Nuevo Evento"
                    onPress={() => handleNavegarYSalirMenu('org-crear-evento')}
                    style={[
                      styles.drawerItem,
                      pantallaActual === 'org-crear-evento' && styles.drawerItemActiveOrg
                    ]}
                  >
                    <Text style={styles.drawerItemIcon}>➕</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        pantallaActual === 'org-crear-evento' && styles.drawerItemTextActiveOrg
                      ]}
                    >
                      Publicar Evento
                    </Text>
                    <Text style={styles.drawerChevron}>›</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.drawerDivider} />

              <Text style={styles.sectionHeader}>DESARROLLO & DATOS</Text>

              <TouchableOpacity
                testID="btn-reiniciar-seed"
                accessibilityRole="button"
                accessibilityLabel="Reiniciar datos semilla en memoria"
                onPress={handleReiniciarSeed}
                disabled={reiniciando}
                style={styles.drawerItem}
              >
                {reiniciando ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
                ) : (
                  <Text style={styles.drawerItemIcon}>🔄</Text>
                )}
                <Text style={styles.drawerItemText}>Reiniciar Datos (Seed)</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer del Drawer */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                testID="btn-header-landing"
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
                onPress={() => handleNavegarYSalirMenu('landing')}
                style={styles.drawerLogoutBtn}
              >
                <Text style={styles.drawerLogoutText}>🚪 Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...CARD_SHADOW
  },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hamburgerIcon: {
    fontSize: 20,
    color: COLORS.text,
    lineHeight: 22
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  roleBadgeComp: {
    backgroundColor: COLORS.primarySoft
  },
  roleBadgeOrg: {
    backgroundColor: COLORS.secondarySoft
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  roleBadgeTextComp: {
    color: COLORS.primary
  },
  roleBadgeTextOrg: {
    color: COLORS.secondary
  },
  topAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5
  },
  topAvatarText: {
    fontSize: 13,
    fontWeight: '800'
  },
  seedAlert: {
    backgroundColor: COLORS.successSoft,
    padding: 6,
    alignItems: 'center'
  },
  seedAlertText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600'
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)'
  },
  drawerBackdrop: {
    flex: 1
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 290,
    backgroundColor: COLORS.card,
    display: 'flex',
    flexDirection: 'column',
    ...CARD_SHADOW
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  drawerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5
  },
  drawerAvatarComp: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary
  },
  drawerAvatarOrg: {
    backgroundColor: COLORS.secondarySoft,
    borderColor: COLORS.secondary
  },
  drawerAvatarText: {
    fontSize: 16,
    fontWeight: '800'
  },
  drawerAvatarTextComp: {
    color: COLORS.primary
  },
  drawerAvatarTextOrg: {
    color: COLORS.secondary
  },
  drawerUserInfo: {
    gap: 3,
    flexShrink: 1
  },
  drawerUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerCloseText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700'
  },
  drawerContent: {
    padding: 16,
    gap: 6
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 8
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12
  },
  drawerItemActive: {
    backgroundColor: COLORS.primarySoft
  },
  drawerItemActiveOrg: {
    backgroundColor: COLORS.secondarySoft
  },
  drawerItemIcon: {
    fontSize: 18
  },
  drawerItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text
  },
  drawerItemTextActive: {
    color: COLORS.primary
  },
  drawerItemTextActiveOrg: {
    color: COLORS.secondary
  },
  drawerChevron: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '400'
  },
  drawerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  drawerLogoutBtn: {
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  drawerLogoutText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '800'
  }
});

export default HeaderBar;
