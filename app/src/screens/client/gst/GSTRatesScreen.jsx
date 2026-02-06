import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { gstAPI } from '../../../lib/api';

export default function GSTRatesScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rateResult, setRateResult] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleSearch = async (hsn) => {
    if (!hsn || hsn.length < 4) {
      setRateResult(null);
      return;
    }

    setLoading(true);
    try {
      const response = await gstAPI.rates.get(hsn);
      setRateResult(response.data);
    } catch (error) {
      console.error('GST rate fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch GST rate for HSN code'
      });
      setRateResult(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (searchQuery) {
      await handleSearch(searchQuery);
    }
    setRefreshing(false);
  }, [searchQuery]);

  const handleSearchInput = (query) => {
    setSearchQuery(query);
    if (query.length >= 4) {
      handleSearch(query);
    } else {
      setRateResult(null);
    }
  };

  const getRateColor = (rate) => {
    if (rate === 0) return '#10b981';
    if (rate <= 5) return '#3b82f6';
    if (rate <= 12) return '#f59e0b';
    if (rate <= 18) return '#ef4444';
    return '#8b5cf6';
  };

  const commonHsnCodes = [
    { hsn: '1001', description: 'Wheat', rate: 0 },
    { hsn: '1006', description: 'Rice', rate: 0 },
    { hsn: '8471', description: 'Computers', rate: 18 },
    { hsn: '8517', description: 'Mobile Phones', rate: 18 },
    { hsn: '2710', description: 'Petroleum Products', rate: 28 },
    { hsn: '8703', description: 'Motor Cars', rate: 28 },
    { hsn: '6403', description: 'Footwear', rate: 18 },
    { hsn: '6109', description: 'T-shirts', rate: 12 },
    { hsn: '3004', description: 'Medicines', rate: 12 },
    { hsn: '1701', description: 'Sugar', rate: 0 },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="GST Rates" 
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
          <Text style={styles.sectionTitle}>GST Rate Lookup</Text>
          <Text style={styles.sectionSubtitle}>
            Find GST rates for HSN/SAC codes and product categories
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchCard}>
            <Text style={styles.searchCardTitle}>HSN/SAC Code Lookup</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter HSN/SAC code (e.g., 8471)"
                value={searchQuery}
                onChangeText={handleSearchInput}
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setRateResult(null);
                }}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            
            {loading && (
              <View style={styles.loadingIndicator}>
                <View style={styles.spinner} />
                <Text style={styles.loadingText}>Looking up GST rate...</Text>
              </View>
            )}

            {rateResult && (
              <View style={styles.rateResultCard}>
                <View style={styles.rateResultHeader}>
                  <View style={[
                    styles.rateIcon,
                    { backgroundColor: getRateColor(rateResult.gst_rate) + '20' }
                  ]}>
                    <Text style={[
                      styles.ratePercentage,
                      { color: getRateColor(rateResult.gst_rate) }
                    ]}>
                      {rateResult.gst_rate}%
                    </Text>
                  </View>
                  <View style={styles.rateInfo}>
                    <Text style={styles.rateHsn}>HSN: {rateResult.hsn_code}</Text>
                    <Text style={styles.rateDescription}>
                      {rateResult.description || 'Description not available'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.rateBreakdown}>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>CGST:</Text>
                    <Text style={styles.rateValue}>{(rateResult.gst_rate / 2)}%</Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>SGST:</Text>
                    <Text style={styles.rateValue}>{(rateResult.gst_rate / 2)}%</Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>IGST:</Text>
                    <Text style={styles.rateValue}>{rateResult.gst_rate}%</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* GST Rate Slabs */}
        <View style={styles.slabsSection}>
          <Text style={styles.slabsTitle}>GST Rate Slabs</Text>
          <View style={styles.slabsGrid}>
            <View style={[styles.slabCard, { borderLeftColor: '#10b981' }]}>
              <Text style={[styles.slabRate, { color: '#10b981' }]}>0%</Text>
              <Text style={styles.slabLabel}>Nil Rate</Text>
              <Text style={styles.slabDescription}>Essential items like food grains, milk</Text>
            </View>
            
            <View style={[styles.slabCard, { borderLeftColor: '#3b82f6' }]}>
              <Text style={[styles.slabRate, { color: '#3b82f6' }]}>5%</Text>
              <Text style={styles.slabLabel}>Low Rate</Text>
              <Text style={styles.slabDescription}>Daily necessities, medicines</Text>
            </View>
            
            <View style={[styles.slabCard, { borderLeftColor: '#f59e0b' }]}>
              <Text style={[styles.slabRate, { color: '#f59e0b' }]}>12%</Text>
              <Text style={styles.slabLabel}>Standard Rate</Text>
              <Text style={styles.slabDescription}>Processed foods, textiles</Text>
            </View>
            
            <View style={[styles.slabCard, { borderLeftColor: '#ef4444' }]}>
              <Text style={[styles.slabRate, { color: '#ef4444' }]}>18%</Text>
              <Text style={styles.slabLabel}>Higher Rate</Text>
              <Text style={styles.slabDescription}>Electronics, services</Text>
            </View>
            
            <View style={[styles.slabCard, { borderLeftColor: '#8b5cf6' }]}>
              <Text style={[styles.slabRate, { color: '#8b5cf6' }]}>28%</Text>
              <Text style={styles.slabLabel}>Highest Rate</Text>
              <Text style={styles.slabDescription}>Luxury items, automobiles</Text>
            </View>
          </View>
        </View>

        {/* Common HSN Codes */}
        <View style={styles.commonSection}>
          <Text style={styles.commonTitle}>Common HSN Codes</Text>
          <View style={styles.commonList}>
            {commonHsnCodes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.commonCard}
                onPress={() => handleSearchInput(item.hsn)}
                activeOpacity={0.95}
              >
                <View style={styles.commonCardContent}>
                  <View style={styles.commonInfo}>
                    <Text style={styles.commonHsn}>HSN: {item.hsn}</Text>
                    <Text style={styles.commonDescription}>{item.description}</Text>
                  </View>
                  <View style={[
                    styles.commonRate,
                    { backgroundColor: getRateColor(item.rate) }
                  ]}>
                    <Text style={styles.commonRateText}>{item.rate}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#3e60ab" />
              <Text style={styles.infoTitle}>Important Notes</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  GST rates may vary based on specific product specifications
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Always verify rates with official GST notifications
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Rates are subject to change based on government policies
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  For inter-state transactions, IGST applies instead of CGST+SGST
                </Text>
              </View>
            </View>
          </View>
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
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    ...FONT_STYLES.h1,
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    lineHeight: 24
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchCardTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  searchInput: {
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#0f172a'
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderTopColor: '#3e60ab',
  },
  loadingText: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  rateResultCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rateResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rateIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ratePercentage: {
    ...FONT_STYLES.h4,
  },
  rateInfo: {
    flex: 1,
  },
  rateHsn: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4
  },
  rateDescription: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  rateBreakdown: {
    gap: 8,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  rateValue: {
    ...FONT_STYLES.label,
    color: '#0f172a'
  },
  slabsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  slabsTitle: {
    ...FONT_STYLES.h3,
    color: '#0f172a',
    marginBottom: 16
  },
  slabsGrid: {
    gap: 12,
  },
  slabCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  slabRate: {
    ...FONT_STYLES.h2,
    marginBottom: 4
  },
  slabLabel: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4
  },
  slabDescription: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 20
  },
  commonSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  commonTitle: {
    ...FONT_STYLES.h3,
    color: '#0f172a',
    marginBottom: 16
  },
  commonList: {
    gap: 12,
  },
  commonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  commonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  commonInfo: {
    flex: 1,
  },
  commonHsn: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4
  },
  commonDescription: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  commonRate: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  commonRateText: {
    ...FONT_STYLES.label,
    color: 'white'
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
    gap: 12,
  },
  infoTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a'
  },
  infoContent: {
    gap: 12,
  },
  infoPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3e60ab',
    marginTop: 6,
  },
  infoText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 20,
    flex: 1
  },
});