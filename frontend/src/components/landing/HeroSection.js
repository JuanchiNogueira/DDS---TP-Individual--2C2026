import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';

export function HeroSection() {
  return (
    <View style={styles.container}>
      {/* Fila de Marca y Badge */}
      <View style={styles.brandRow}>
        <View style={styles.brandBadgeWrap}>
          <Text style={styles.brandLogo}>🎟️</Text>
          <Text style={styles.brand}>AI Ticket It</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Plataforma de Eventos</Text>
        </View>
      </View>

      {/* Título Principal de Impacto */}
      <Text style={styles.title}>
        Tus mejores experiencias{' '}
        <Text style={styles.titleAccent}>a un ticket de distancia</Text>
      </Text>

      {/* Bajada Descriptiva */}
      <Text style={styles.subtitle}>
        Comprá entradas con validación de cupos en vivo o gestioná tus propios espectáculos desde un
        solo lugar.
      </Text>

      {/* Píldoras de Propuestas de Valor */}
      <View style={styles.featuresRow}>
        <View style={styles.featurePill}>
          <Text style={styles.featurePillText}>⚡ Cupos en vivo</Text>
        </View>
        <View style={styles.featurePill}>
          <Text style={styles.featurePillText}>🛡️ Compra segura</Text>
        </View>
        <View style={styles.featurePill}>
          <Text style={styles.featurePillText}>💬 Chat directo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 28,
    paddingBottom: 24
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24
  },
  brandBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandLogo: {
    fontSize: 22
  },
  brand: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(207, 107, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(207, 107, 252, 0.35)'
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 14
  },
  titleAccent: {
    color: COLORS.primary
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  featurePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  featurePillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600'
  }
});
