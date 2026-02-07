import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../utils/fonts';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SCREENS = [
  {
    id: 1,
    title: 'Manage All Your Accounts',
    subtitle: 'One Place for Everything',
    description: 'Unified dashboard for invoices, inventory, GST, and financial reports',
    icon: 'business-outline',
    gradient: ['#3e60ab', '#5a7ec7'],
    illustration: 'grid-outline',
  },
  {
    id: 2,
    title: 'Real-Time Sync & Reports',
    subtitle: 'Stay Updated Instantly',
    description: 'Automated reporting, live inventory tracking, and instant GST calculations',
    icon: 'sync-outline',
    gradient: ['#3e60ab', '#5a7ec7'],
    illustration: 'analytics-outline',
  },
  {
    id: 3,
    title: 'Bank-Level Security',
    subtitle: 'Your Data is Protected',
    description: 'End-to-end encryption, two-factor authentication, and secure cloud backup',
    icon: 'shield-checkmark-outline',
    gradient: ['#3e60ab', '#5a7ec7'],
    illustration: 'lock-closed-outline',
  },
];

export default function OnboardingScreen({ onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SCREENS.length - 1) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(currentIndex + 1);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const currentScreen = ONBOARDING_SCREENS[currentIndex];

  return (
    <LinearGradient
      colors={currentScreen.gradient}
      style={styles.container}
    >
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name={currentScreen.illustration} size={80} color="#ffffff" />
          </View>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <View style={styles.iconBadge}>
            <Ionicons name={currentScreen.icon} size={24} color="#3e60ab" />
          </View>
          
          <Text style={styles.subtitle}>{currentScreen.subtitle}</Text>
          <Text style={styles.title}>{currentScreen.title}</Text>
          <Text style={styles.description}>{currentScreen.description}</Text>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {ONBOARDING_SCREENS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === ONBOARDING_SCREENS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons 
            name={currentIndex === ONBOARDING_SCREENS.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color="#3e60ab" 
          />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    ...FONT_STYLES.button,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    position: 'relative',
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 3,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    ...FONT_STYLES.caption,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    ...FONT_STYLES.h2,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  description: {
    ...FONT_STYLES.body,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
  },
  nextButtonText: {
    ...FONT_STYLES.button,
    color: '#3e60ab',
    fontWeight: '600',
  },
});
