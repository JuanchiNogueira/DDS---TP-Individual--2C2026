import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

export const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [modo, setModo] = useState('COMPRADOR'); // 'COMPRADOR' | 'ORGANIZADOR'
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const cargarUsuarios = useCallback(async (mantenerSeleccion = true) => {
    try {
      setCargando(true);
      setError(null);
      const lista = await apiClient.get('/usuarios');
      setUsuarios(lista);

      setUsuarioActivo((prev) => {
        if (mantenerSeleccion && prev) {
          const encontrado = lista.find((u) => u.id === prev.id);
          if (encontrado) return encontrado;
        }
        // Seleccionar por defecto al primer comprador ('usr-comp-1')
        const compradorDefault =
          lista.find((u) => u.id === 'usr-comp-1') ||
          lista.find((u) => u.id?.startsWith('usr-comp')) ||
          lista[0] ||
          null;
        return compradorDefault;
      });
    } catch (err) {
      setError(err.message || 'Error al cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios(false);
  }, [cargarUsuarios]);

  const cambiarUsuario = (usuarioId) => {
    const user = usuarios.find((u) => u.id === usuarioId);
    if (user) {
      setUsuarioActivo(user);
    }
  };

  const alternarModo = () => {
    setModo((prevModo) => {
      const nuevoModo = prevModo === 'COMPRADOR' ? 'ORGANIZADOR' : 'COMPRADOR';
      // Si cambia a organizador y el usuario actual no es organizador, seleccionar el primer organizador
      if (nuevoModo === 'ORGANIZADOR' && !usuarioActivo?.id?.startsWith('usr-org')) {
        const org = usuarios.find((u) => u.id?.startsWith('usr-org'));
        if (org) setUsuarioActivo(org);
      } else if (nuevoModo === 'COMPRADOR' && !usuarioActivo?.id?.startsWith('usr-comp')) {
        const comp = usuarios.find((u) => u.id === 'usr-comp-1') || usuarios.find((u) => u.id?.startsWith('usr-comp'));
        if (comp) setUsuarioActivo(comp);
      }
      return nuevoModo;
    });
  };

  const seleccionarModo = (nuevoModo) => {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    if (nuevoModo === 'ORGANIZADOR' && !usuarioActivo?.id?.startsWith('usr-org')) {
      const org = usuarios.find((u) => u.id?.startsWith('usr-org'));
      if (org) setUsuarioActivo(org);
    } else if (nuevoModo === 'COMPRADOR' && !usuarioActivo?.id?.startsWith('usr-comp')) {
      const comp = usuarios.find((u) => u.id === 'usr-comp-1') || usuarios.find((u) => u.id?.startsWith('usr-comp'));
      if (comp) setUsuarioActivo(comp);
    }
  };

  const iniciarSesion = (identificador) => {
    const idTrim = (identificador || '').trim();
    const esOrg = idTrim.toLowerCase().startsWith('usr-org');
    const nuevoModo = esOrg ? 'ORGANIZADOR' : 'COMPRADOR';

    let user = usuarios.find((u) => u.id === idTrim);
    if (!user) {
      user = usuarios.find((u) => esOrg ? u.id?.startsWith('usr-org') : u.id?.startsWith('usr-comp')) || {
        id: idTrim,
        nombre: esOrg ? 'Organizador' : 'Comprador',
        apellido: idTrim,
        favoritos: []
      };
    }

    setUsuarioActivo(user);
    setModo(nuevoModo);
    return { user, modo: nuevoModo };
  };

  const reiniciarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      await apiClient.post('/seed');
      await cargarUsuarios(true);
      setRefreshKey((k) => k + 1);
      return { ok: true };
    } catch (err) {
      setError(err.message || 'Error al reiniciar datos semilla');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const toggleFavorito = async (eventoId) => {
    if (!usuarioActivo) return;
    try {
      const usuarioActualizado = await apiClient.post(`/usuarios/${usuarioActivo.id}/favoritos`, {
        eventoId
      });
      setUsuarioActivo(usuarioActualizado);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u))
      );
      return usuarioActualizado;
    } catch (err) {
      setError(err.message || 'Error al alternar favorito');
      throw err;
    }
  };

  const esFavorito = (eventoId) => {
    if (!usuarioActivo?.favoritos) return false;
    return usuarioActivo.favoritos.some((fav) => fav.id === eventoId || fav === eventoId);
  };

  const value = {
    usuarios,
    usuarioActivo,
    setUsuarioActivo,
    cambiarUsuario,
    iniciarSesion,
    modo,
    setModo: seleccionarModo,
    alternarModo,
    reiniciarDatos,
    toggleFavorito,
    esFavorito,
    cargando,
    error,
    refreshKey
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe ser utilizado dentro de un SessionProvider');
  }
  return context;
}

export default SessionContext;
