import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { FONT_STYLES } from '../../../utils/fonts';

export default function IncomeTaxScreen() {
  const { openDrawer } = useDrawer();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleCalculatorPress = () => {
    navigation.navigate('TaxCalculator');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getReturnStatusColor = (status) => {
    const colors = {
      'filed': '#10b981',
      'pending': '#f59e0b',
      'overdue': '#ef4444',
      'draft': '#6b7280',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getReturnStatusIcon = (status) => {
    const icons = {
      'filed': 'checkmark-circle',
      'pending': 'time',
      'overdue': 'warning',
      'draft': 'document-text',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  const features = [
    {
      id: 1,
      title: 'Tax Calculator',
      subtitle: 'Calculate your income tax liability',
      icon: 'calculator',
      color: '#3e60ab',
      bgColor: '#dbeafe',
      onPress: handleCalculatorPress,
    },
    {
      id: 2,
      title: 'File ITR',
      subtitle: 'Prepare and file income tax returns',
      icon: 'document-text',
      color: '#10b981',
      bgColor: '#d1fae5',
      comingSoon: true,
    },
    {
      id: 3,
      title: 'Form 26AS',
      subtitle: 'View tax credit statement',
      icon: 'receipt',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      comingSoon: true,
    },
    {
      id: 4,
      title: 'Form 16',
      subtitle: 'Parse and extract Form 16 data',
      icon: 'document-attach',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      comingSoon: true,
    },
    {
      id: 5,
      title: 'Capital Gains',
      subtitle: 'Calculate capital gains tax',
      icon: 'trending-up',
      color: '#06b6d4',
      bgColor: '#cffafe',
      comingSoon: true,
    },
    {
      id: 6,
      title: 'Advance Tax',
      subtitle: 'Calculate advance tax installments',
      icon: 'calendar',
      color: '#ec4899',
      bgColor: '#fce7f3',
      comingSoon: true,
    },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Income Tax" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <Ionicons name="calculator" size={32} color="#3e60ab" />
          </View>
          <Text style={styles.headerTitle}>Income Tax Management</Text>
          <Text style={styles.headerSubtitle}>
            Calculate tax, file returns, and manage income tax compliance
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={feature.onPress}
              activeOpacity={0.8}
              disabled={feature.comingSoon}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                <Ionicons name={feature.icon} size={28} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
              {feature.comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              )}
              {!feature.comingSoon && (
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#3e60ab" />
            <Text style={styles.infoTitle}>About Income Tax Services</Text>
          </View>
          <Text style={styles.infoText}>
            Our income tax services help you calculate tax liability, prepare and file ITR, 
            view Form 26AS, parse Form 16, and calculate capital gains and advance tax. 
            All calculations use the latest tax slabs and rules.
          </Text>
        </View>

        {/* Tax Slabs Card */}
        <View style={styles.taxSlabsCard}>
          <Text style={styles.taxSlabsTitle}>Current Tax Slabs (FY 2024-25)</Text>
          <Text style={styles.taxSlabsSubtitle}>For individuals below 60 years</Text>
          
          <View style={styles.slabsList}>
            <View style={styles.slabItem}>
              <Text style={styles.slabRange}>Up to ₹2.5 Lakh</Text>
              <Text style={styles.slabRate}>Nil</Text>
            </View>
            <View style={styles.slabItem}>
              <Text style={styles.slabRange}>₹2.5 - ₹5 Lakh</Text>
              <Text style={styles.slabRate}>5%</Text>
            </View>
            <View style={styles.slabItem}>
              <Text style={styles.slabRange}>₹5 - ₹10 Lakh</Text>
              <Text style={styles.slabRate}>20%</Text>
            </View>
            <View style={styles.slabItem}>
              <Text style={styles.slabRange}>Above ₹10 Lakh</Text>
              <Text style={styles.slabRate}>30%</Text>
            </View>
          </View>
          
          <Text style={styles.taxSlabsNote}>
            * Plus 4% Health & Education Cess on total tax
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  featuresContainer: {
    padding: 16,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  featureSubtitle: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  comingSoonBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  comingSoonText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  infoText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    lineHeight: 22,
  },
  taxSlabsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taxSlabsTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  taxSlabsSubtitle: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 16,
  },
  slabsList: {
    gap: 12,
    marginBottom: 16,
  },
  slabItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slabRange: {
    ...FONT_STYLES.body,
    color: '#111827',
    flex: 1,
  },
  slabRate: {
    ...FONT_STYLES.h6,
    color: '#3e60ab',
  },
  taxSlabsNote: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});