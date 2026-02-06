import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_STYLES } from '../../utils/fonts';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#2140D7', '#3665E6', '#4A85EE']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>F</Text>
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.brandName}>Finvera</Text>
        <Text style={styles.tagline}>Financial Excellence Simplified</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
          <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Finvera Solutions</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    ...FONT_STYLES.h1,
    fontSize: 48,
    color: 'white',
  },
  brandName: {
    ...FONT_STYLES.h1,
    fontSize: 36,
    color: 'white',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    ...FONT_STYLES.h5,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 60,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    ...FONT_STYLES.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  versionText: {
    ...FONT_STYLES.captionSmall,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});