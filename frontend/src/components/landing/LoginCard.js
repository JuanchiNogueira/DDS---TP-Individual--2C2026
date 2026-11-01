import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import {
  COLORS,
  DEMO_ACCOUNTS,
  detectRole,
  roleColor,
  roleLabel
} from '../../theme/colors';

export function LoginCard({ onLogin, onExplorarCatalogo }) {
  const [userId, setUserId] = useState('usr-comp-1');
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(false);

  const trimmed = userId.trim();
  const detectedRole = trimmed ? detectRole(trimmed) : null;

  const handleSelect = (account) => {
    setUserId(account.id);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (!trimmed) {
      setError('Ingresá un identificador o elegí un perfil de prueba.');
      return;
    }
    setError(null);
    onLogin({ userId: trimmed, role: detectRole(trimmed) });
  };

  const buyers = DEMO_ACCOUNTS.filter((a) => a.role === 'COMPRADOR');
  const organizers = DEMO_ACCOUNTS.filter((a) => a.role === 'ORGANIZADOR');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <Text style={styles.subtitle}>
        Ingresa tu identificador o selecciona un perfil para continuar
      </Text>

      {/* Input de Identificador o Email */}
      <Text style={styles.label}>Identificador o email</Text>
      <TextInput
        testID="input-login-id"
        accessibilityLabel="Identificador o email"
        value={userId}
        onChangeText={(text) => {
          setUserId(text);
          if (error) setError(null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={handleSubmit}
        placeholder="Ej: usr-comp-1 o usr-org-1"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null
        ]}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Banner de Detección Dinámica de Rol */}
      {detectedRole ? (
        <View
          style={[
            styles.roleBanner,
            {
              borderColor: roleColor(detectedRole),
              backgroundColor:
                detectedRole === 'ORGANIZADOR'
                  ? 'rgba(207, 107, 252, 0.08)'
                  : 'rgba(116, 111, 252, 0.08)'
            }
          ]}
          accessibilityLiveRegion="polite"
        >
          <View style={[styles.roleDot, { backgroundColor: roleColor(detectedRole) }]} />
          <Text style={styles.roleBannerText}>
            Rol detectado:{' '}
            <Text style={{ color: roleColor(detectedRole), fontWeight: '800' }}>
              {roleLabel(detectedRole)}
            </Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Acceso Rápido de Prueba */}
      <Text style={styles.sectionTitle}>Acceso Rápido de Prueba</Text>

      <DemoGroup
        label="Compradores"
        accounts={buyers}
        selectedId={trimmed}
        onSelect={handleSelect}
      />
      <DemoGroup
        label="Organizadores"
        accounts={organizers}
        selectedId={trimmed}
        onSelect={handleSelect}
      />

      {/* Botón Principal de Ingreso */}
      <TouchableOpacity
        testID="btn-iniciar-sesion"
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={handleSubmit}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Ingresar a AI Ticket It</Text>
      </TouchableOpacity>

      {/* Enlace opcional para explorar catálogo sin loguearse */}
      {onExplorarCatalogo ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onExplorarCatalogo}
          style={styles.guestButton}
          testID="btn-explorar-catalogo"
        >
          <Text style={styles.guestButtonText}>Explorar Catálogo como invitado →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function DemoGroup({ label, accounts, selectedId, onSelect }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {accounts.map((account) => {
          const selected = selectedId === account.id;
          const color = roleColor(account.role);
          return (
            <TouchableOpacity
              key={account.id}
              testID={`demo-${account.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              activeOpacity={0.8}
              onPress={() => onSelect(account)}
              style={[
                styles.pill,
                selected && { borderColor: color, backgroundColor: `${color}14` }
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{account.name.charAt(0)}</Text>
              </View>
              <View style={styles.pillTextWrap}>
                <Text style={styles.pillName} numberOfLines={1}>
                  {account.name}
                </Text>
                <Text style={styles.pillId}>{account.id}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: COLORS.text,
    fontSize: 15
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF'
  },
  inputError: {
    borderColor: COLORS.danger
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600'
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10
  },
  roleBannerText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  group: {
    marginBottom: 14
  },
  groupLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  pillTextWrap: {
    flex: 1,
    minWidth: 0
  },
  pillName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700'
  },
  pillId: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  guestButton: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center'
  },
  guestButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700'
  }
});
