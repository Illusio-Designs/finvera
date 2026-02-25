import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_STYLES } from '../utils/fonts';

export default function LoadingScreen() {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#f0f4fc', '#ffffff', '#f0f4fc']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Loading Spinner */}
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate }],
            },
          ]}
        >
          <View style={styles.spinnerDot} />
        </Animated.View>

        {/* Brand Name */}
        <Text style={styles.brandName}>Fintranzact Mobile</Text>
        <Text style={styles.loadingText}>Loading your workspace...</Text>
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
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 70,
    height: 70,
    tintColor: 'white',
  },
  spinner: {
    width: 40,
    height: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3e60ab',
  },
  brandName: {
    ...FONT_STYLES.h3,
    color: '#3e60ab',
    fontWeight: '700',
    marginTop: 10,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
});