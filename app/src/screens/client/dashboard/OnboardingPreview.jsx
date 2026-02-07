import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingScreen from '../../auth/OnboardingScreen';
import { FONT_STYLES } from '../../../utils/fonts';

/**
 * Preview component to display onboarding screens on dashboard
 * This allows you to review the design before making it live
 */
export default function OnboardingPreview() {
  const [showPreview, setShowPreview] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');

  const handleComplete = () => {
    setShowPreview(false);
    setMessageText('Onboarding Complete! (This will navigate to login in production)');
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const handleSkip = () => {
    setShowPreview(false);
    setMessageText('Onboarding Skipped! (This will navigate to login in production)');
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  return (
    <View style={styles.container}>
      {/* Success Message */}
      {showMessage && (
        <View style={styles.messageContainer}>
          <View style={styles.messageCard}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.messageText}>{messageText}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="eye-outline" size={24} color="#3e60ab" />
          <Text style={styles.title}>Onboarding Preview</Text>
        </View>
        
        <Text style={styles.description}>
          Preview the new 3-screen onboarding flow before making it live
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.featureText}>3 focused screens</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.featureText}>Skip button included</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.featureText}>Smooth animations</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.featureText}>Progress indicators</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.previewButton}
          onPress={() => setShowPreview(true)}
        >
          <Ionicons name="play-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.previewButtonText}>Preview Onboarding</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Once approved, this will show for first-time users before login
        </Text>
      </View>

      {/* Full Screen Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <OnboardingScreen 
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  messageContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  messageText: {
    ...FONT_STYLES.body,
    color: '#059669',
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    ...FONT_STYLES.h3,
    color: '#111827',
  },
  description: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  features: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    ...FONT_STYLES.body,
    color: '#374151',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewButtonText: {
    ...FONT_STYLES.button,
    color: '#ffffff',
    fontWeight: '600',
  },
  note: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
