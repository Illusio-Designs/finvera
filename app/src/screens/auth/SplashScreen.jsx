import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_STYLES } from '../../utils/fonts';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={['#2140D7', '#3665E6', '#4A85EE']}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.brandName}>Fintranzact</Text>
        <Text style={styles.tagline}>Financial Excellence Simplified</Text>

        {/* Animated Loading Dots */}
        <View style={styles.loadingContainer}>
          {[0, 1, 2].map((index) => {
            const dotOpacity = dotsAnim.interpolate({
              inputRange: [0, 0.33, 0.66, 1],
              outputRange: index === 0 ? [0.3, 1, 0.3, 0.3] :
                           index === 1 ? [0.3, 0.3, 1, 0.3] :
                           [0.3, 0.3, 0.3, 1],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.loadingDot,
                  { opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Fintranzact Solutions</Text>
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
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 100,
    tintColor: 'white',
  },
  brandName: {
    ...FONT_STYLES.h1,
    fontSize: 42,
    fontFamily: 'Agency',
    color: 'white',
    marginBottom: 12,
    letterSpacing: 3,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    ...FONT_STYLES.h5,
    fontSize: 16,
    fontFamily: 'Agency',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    ...FONT_STYLES.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
    fontSize: 13,
    fontFamily: 'Agency',
  },
  versionText: {
    ...FONT_STYLES.captionSmall,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontFamily: 'Agency',
  },
});