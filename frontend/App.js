import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from './src/context/SessionContext';
import HeaderBar from './src/components/HeaderBar';
import LandingLoginScreen from './src/screens/LandingLoginScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';
import DetalleEventoScreen from './src/screens/DetalleEventoScreen';
import MisComprasScreen from './src/screens/MisComprasScreen';
import OrganizadorEventosScreen from './src/screens/OrganizadorEventosScreen';
import CrearEventoScreen from './src/screens/CrearEventoScreen';

function MainApp() {
  const { modo, iniciarSesion } = useSession();
  const [pantalla, setPantalla] = useState('landing'); // 'landing' | 'catalogo' | 'detalle' | 'mis-compras' | 'org-eventos' | 'org-crear-evento'
  const [eventoDetalleId, setEventoDetalleId] = useState(null);

  // Sincronizar pantalla cuando se cambia el modo (Comprador vs Organizador)
  useEffect(() => {
    if (pantalla === 'landing') return;
    if (modo === 'ORGANIZADOR') {
      if (pantalla === 'catalogo' || pantalla === 'detalle' || pantalla === 'mis-compras') {
        setPantalla('org-eventos');
      }
    } else if (modo === 'COMPRADOR') {
      if (pantalla === 'org-eventos' || pantalla === 'org-crear-evento') {
        setPantalla('catalogo');
      }
    }
  }, [modo, pantalla]);

  const handleNavegar = (pantallaDestino) => {
    setPantalla(pantallaDestino);
    if (pantallaDestino !== 'detalle') {
      setEventoDetalleId(null);
    }
  };

  const handleVerDetalle = (eventoId) => {
    setEventoDetalleId(eventoId);
    setPantalla('detalle');
  };

  const handleLogin = ({ userId, role }) => {
    const sesion = iniciarSesion(userId);
    const destino = sesion.modo === 'ORGANIZADOR' ? 'org-eventos' : 'catalogo';
    handleNavegar(destino);
  };

  return (
    <SafeAreaView style={[styles.safeArea, pantalla === 'landing' && styles.safeAreaLanding]}>
      <StatusBar style={pantalla === 'landing' ? 'dark' : 'light'} />
      <View style={[styles.appContainer, pantalla === 'landing' && styles.appContainerLanding]}>
        {/* Cabecera compartida: se muestra únicamente dentro de la app (oculta en la Landing Page) */}
        {pantalla !== 'landing' ? (
          <HeaderBar pantallaActual={pantalla} onNavegar={handleNavegar} />
        ) : null}

        {/* Contenido Principal según Modo y Pantalla */}
        <View style={styles.contentContainer}>
          {pantalla === 'landing' ? (
            <LandingLoginScreen
              onLogin={handleLogin}
              onExplorarCatalogo={() => handleNavegar('catalogo')}
            />
          ) : modo === 'ORGANIZADOR' ? (
            <>
              {pantalla === 'org-eventos' || pantalla === 'org-detalle' ? (
                <OrganizadorEventosScreen
                  onCrearEvento={() => handleNavegar('org-crear-evento')}
                />
              ) : null}

              {pantalla === 'org-crear-evento' ? (
                <CrearEventoScreen
                  onEventoCreado={() => handleNavegar('org-eventos')}
                />
              ) : null}
            </>
          ) : (
            <>
              {pantalla === 'catalogo' ? (
                <CatalogoScreen onVerDetalle={handleVerDetalle} />
              ) : null}

              {pantalla === 'detalle' ? (
                <DetalleEventoScreen
                  eventoId={eventoDetalleId}
                  onVolver={() => handleNavegar('catalogo')}
                  onIrAMisCompras={() => handleNavegar('mis-compras')}
                />
              ) : null}

              {pantalla === 'mis-compras' ? <MisComprasScreen /> : null}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <MainApp />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0
  },
  safeAreaLanding: {
    backgroundColor: '#F8FAFC'
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  appContainerLanding: {
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    flex: 1
  }
});
