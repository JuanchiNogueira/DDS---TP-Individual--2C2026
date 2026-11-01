import React from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HeroSection } from '../components/landing/HeroSection';
import { LoginCard } from '../components/landing/LoginCard';
import { COLORS } from '../theme/colors';

export default function LandingLoginScreen({ onLogin, onExplorarCatalogo }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />
        <LoginCard onLogin={onLogin} onExplorarCatalogo={onExplorarCatalogo} />
        <View style={styles.footerContainer}>
          <Text style={styles.footer}>
            AI Ticket It — Universidad Tecnológica Nacional (UTN FRBA)
          </Text>
          <Text style={styles.subfooter}>
            Desarrollo de Software • Trabajo Práctico Individual (2C 2026)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  footerContainer: {
    marginTop: 32,
    alignItems: 'center'
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  subfooter: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8
  }
});
