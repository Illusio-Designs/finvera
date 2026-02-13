import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { gstAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';

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
      
      // Handle the response from Sandbox API
      const data = response.data;
      
      if (data.success) {
        // Transform the response to match our UI expectations
        setRateResult({
          hsn_code: data.hsnCode || data.hsn_code || hsn,
          description: data.description || data.hsnDescription || 'Description not available',
          gst_rate: data.gstRate || data.gst_rate || 0,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch GST rate');
      }
    } catch (error) {
      console.error('GST rate fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to fetch GST rate for HSN code'
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
        <View style={styles.headerActions}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color="#3e60ab" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>GST Rate Lookup</Text>
          <Text style={styles.reportSubtitle}>Find GST rates for HSN/SAC codes using Sandbox API</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchCard}>
            <View style={styles.searchHeader}>
              <Ionicons name="search" size={24} color="#3e60ab" />
              <Text style={styles.searchCardTitle}>HSN/SAC Code Lookup</Text>
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="barcode-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter HSN/SAC code (minimum 4 digits)"
                value={searchQuery}
                onChangeText={handleSearchInput}
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={8}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setRateResult(null);
                }}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            
            {loading && (
              <View style={styles.loadingIndicator}>
                <View style={styles.spinner} />
                <Text style={styles.loadingText}>Fetching GST rate from Sandbox API...</Text>
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
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>CGST</Text>
                      <Text style={styles.breakdownValue}>{(rateResult.gst_rate / 2).toFixed(2)}%</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>SGST</Text>
                      <Text style={styles.breakdownValue}>{(rateResult.gst_rate / 2).toFixed(2)}%</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>IGST</Text>
                      <Text style={styles.breakdownValue}>{rateResult.gst_rate}%</Text>
                    </View>
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
          <Text style={styles.commonSubtitle}>Click on any code to view its GST rate</Text>
          <View style={styles.commonList}>
            {commonHsnCodes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.commonCard}
                onPress={() => handleSearchInput(item.hsn)}
                activeOpacity={0.7}
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
    paddingBottom: 120,
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
    gap: 8,
  },
  refreshButtonText: {
    ...FONT_STYLES.button,
    color: '#3e60ab',
  },
  reportHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  reportTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  reportSubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  searchCardTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  searchInput: {
    ...FONT_STYLES.body,
    flex: 1,
    color: '#111827',
    paddingVertical: 0,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderTopColor: '#3e60ab',
  },
  loadingText: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
  },
  rateResultCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rateResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rateIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratePercentage: {
    ...FONT_STYLES.h3,
    fontWeight: '700',
  },
  rateInfo: {
    flex: 1,
  },
  rateHsn: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  rateDescription: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    lineHeight: 18,
  },
  rateBreakdown: {
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  breakdownLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  breakdownValue: {
    ...FONT_STYLES.h5,
    color: '#111827',
    fontWeight: '600',
  },
  slabsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  slabsTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  slabsGrid: {
    gap: 12,
  },
  slabCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  slabRate: {
    ...FONT_STYLES.h4,
    marginBottom: 4,
    fontWeight: '700',
  },
  slabLabel: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginBottom: 4,
    fontWeight: '600',
  },
  slabDescription: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    lineHeight: 18,
  },
  commonSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  commonTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  commonSubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    marginBottom: 12,
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