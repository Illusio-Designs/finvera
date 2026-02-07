import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { gstAPI } from '../../../lib/api';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function GSTINsScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [gstins, setGstins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGstin, setSelectedGstin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchGstins = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await gstAPI.gstins.list();
      const data = response.data?.data || response.data || [];
      setGstins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('GSTINs fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load GSTIN records'
      });
      setGstins([]);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchGstins();
  }, [fetchGstins]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGstins();
    setRefreshing(false);
  }, [fetchGstins]);

  const handleGstinPress = (gstin) => {
    setSelectedGstin(gstin);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const getGstinStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'inactive': '#ef4444',
      'suspended': '#f59e0b',
      'cancelled': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getGstinStatusIcon = (status) => {
    const icons = {
      'active': 'checkmark-circle',
      'inactive': 'close-circle',
      'suspended': 'pause-circle',
      'cancelled': 'ban',
    };
    return icons[status?.toLowerCase()] || 'help-circle';
  };

  const filteredGstins = gstins.filter(gstin => 
    !searchQuery || 
    gstin.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gstin.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gstin.trade_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TopBar 
        title="GSTIN Management" 
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
          <Text style={styles.sectionTitle}>GSTIN Records</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your GST identification numbers and registration details
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by GSTIN, legal name, or trade name..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="receipt" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{gstins.length}</Text>
              <Text style={styles.statLabel}>Total GSTINs</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {gstins.filter(g => g.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="star" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {gstins.filter(g => g.is_default).length}
              </Text>
              <Text style={styles.statLabel}>Default</Text>
            </View>
          </View>
        </View>

        {/* GSTINs List */}
        {loading ? (
          <View style={styles.gstinsList}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : filteredGstins.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No GSTINs Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No GSTINs found matching "${searchQuery}"`
                  : 'No GSTIN records have been added yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.gstinsList}>
            {filteredGstins.map((gstin, index) => (
              <TouchableOpacity
                key={gstin.id || index}
                style={styles.gstinCard}
                onPress={() => handleGstinPress(gstin)}
                activeOpacity={0.95}
              >
                <View style={styles.gstinCardGradient}>
                  <View style={styles.gstinCardContent}>
                    <View style={styles.gstinCardHeader}>
                      <View style={[
                        styles.gstinIcon,
                        { backgroundColor: getGstinStatusColor(gstin.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getGstinStatusIcon(gstin.status)} 
                          size={24} 
                          color={getGstinStatusColor(gstin.status)} 
                        />
                      </View>
                      <View style={styles.gstinInfo}>
                        <View style={styles.gstinNumberRow}>
                          <Text style={styles.gstinNumber}>
                            {gstin.gstin || 'N/A'}
                          </Text>
                          {gstin.is_default && (
                            <View style={styles.defaultBadge}>
                              <Ionicons name="star" size={10} color="white" />
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.gstinLegalName}>
                          {gstin.legal_name || 'Legal Name Not Available'}
                        </Text>
                      </View>
                      <View style={styles.gstinStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getGstinStatusColor(gstin.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {gstin.status?.toUpperCase() || 'UNKNOWN'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.gstinCardBody}>
                      <View style={styles.gstinDetail}>
                        <Ionicons name="business-outline" size={16} color="#64748b" />
                        <Text style={styles.gstinDetailText}>
                          Trade Name: {gstin.trade_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.gstinDetail}>
                        <Ionicons name="location-outline" size={16} color="#64748b" />
                        <Text style={styles.gstinDetailText} numberOfLines={1}>
                          {gstin.address || 'Address not available'}
                        </Text>
                      </View>
                      <View style={styles.gstinDetail}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.gstinDetailText}>
                          Registration: {gstin.registration_date 
                            ? new Date(gstin.registration_date).toLocaleDateString('en-IN')
                            : 'N/A'
                          }
                        </Text>
                      </View>
                      <View style={styles.gstinDetail}>
                        <Ionicons name="shield-outline" size={16} color="#64748b" />
                        <Text style={styles.gstinDetailText}>
                          Type: {gstin.taxpayer_type || 'Regular'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.gstinCardFooter}>
                      <View style={styles.gstinMeta}>
                        <Text style={styles.gstinState}>
                          State: {gstin.state_name || gstin.state_code || 'N/A'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.gstinAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getGstinStatusColor(gstin.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getGstinStatusColor(gstin.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* GSTIN Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={[
                styles.modalIcon,
                { backgroundColor: selectedGstin ? getGstinStatusColor(selectedGstin.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedGstin ? getGstinStatusIcon(selectedGstin.status) : 'receipt'} 
                  size={20} 
                  color={selectedGstin ? getGstinStatusColor(selectedGstin.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>GSTIN Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedGstin?.gstin || 'GSTIN Information'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          {selectedGstin && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Registration Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GSTIN:</Text>
                  <Text style={styles.detailValue}>{selectedGstin.gstin || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getGstinStatusColor(selectedGstin.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedGstin.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Legal Name:</Text>
                  <Text style={styles.detailValue}>{selectedGstin.legal_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trade Name:</Text>
                  <Text style={styles.detailValue}>{selectedGstin.trade_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Taxpayer Type:</Text>
                  <Text style={styles.detailValue}>{selectedGstin.taxpayer_type || 'Regular'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registration Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedGstin.registration_date 
                      ? new Date(selectedGstin.registration_date).toLocaleDateString('en-IN')
                      : 'N/A'
                    }
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Default GSTIN:</Text>
                  <Text style={styles.detailValue}>
                    {selectedGstin.is_default ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Address Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>
                    {selectedGstin.address || 'Address not available'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{selectedGstin.city || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State:</Text>
                  <Text style={styles.detailValue}>
                    {selectedGstin.state_name || selectedGstin.state_code || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode:</Text>
                  <Text style={styles.detailValue}>{selectedGstin.pincode || 'N/A'}</Text>
                </View>
              </View>

              {(selectedGstin.nature_of_business || selectedGstin.constitution_of_business) && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Business Information</Text>
                  {selectedGstin.nature_of_business && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nature of Business:</Text>
                      <Text style={styles.detailValue}>{selectedGstin.nature_of_business}</Text>
                    </View>
                  )}
                  {selectedGstin.constitution_of_business && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Constitution:</Text>
                      <Text style={styles.detailValue}>{selectedGstin.constitution_of_business}</Text>
                    </View>
                  )}
                  {selectedGstin.center_jurisdiction && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Center Jurisdiction:</Text>
                      <Text style={styles.detailValue}>{selectedGstin.center_jurisdiction}</Text>
                    </View>
                  )}
                  {selectedGstin.state_jurisdiction && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>State Jurisdiction:</Text>
                      <Text style={styles.detailValue}>{selectedGstin.state_jurisdiction}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  searchInput: {
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#0f172a'
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...FONT_STYLES.h3,
    color: '#0f172a'
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingCard: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderTopColor: '#3e60ab',
    marginBottom: 12,
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#64748b'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    width: '100%',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    ...FONT_STYLES.h2,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24
  },
  gstinsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  gstinCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  gstinCardGradient: {
    position: 'relative',
    padding: 20,
  },
  gstinCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  gstinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gstinIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gstinInfo: {
    flex: 1,
  },
  gstinNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gstinNumber: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    flex: 1,
    letterSpacing: -0.3
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    gap: 3,
  },
  defaultBadgeText: {
    ...FONT_STYLES.captionSmall,
    color: 'white'
  },
  gstinLegalName: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  gstinStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white'
  },
  gstinCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  gstinDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  gstinDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1
  },
  gstinCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gstinMeta: {
    flex: 1,
  },
  gstinState: {
    ...FONT_STYLES.caption,
    color: '#64748b'
  },
  gstinAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.1,
    zIndex: 1,
  },
  decorativeLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.3,
    zIndex: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a'
  },
  modalSubtitle: {
    ...FONT_STYLES.label,
    color: '#64748b',
    marginTop: 2
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailCardTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#64748b',
    width: 120
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    flex: 1
  },
});