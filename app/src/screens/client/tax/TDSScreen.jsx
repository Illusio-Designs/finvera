import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { taxAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function TDSScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [tdsData, setTdsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTDS, setSelectedTDS] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, paid, pending, overdue

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchTDSData = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await taxAPI.tds.list({ 
        search: searchQuery,
        status: filter === 'all' ? undefined : filter,
        limit: 50 
      }).catch(error => {
        console.error('TDS API error:', error);
        return { data: { data: [] } };
      });
      
      // Enhanced error handling for API responses
      const data = response?.data?.data || response?.data?.tds || response?.data?.tdsDetails || response?.data || [];
      setTdsData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('TDS fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load TDS data'
      });
      setTdsData([]);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [searchQuery, filter]); // Removed showNotification from dependencies

  useEffect(() => {
    fetchTDSData();
  }, [searchQuery, filter]); // Changed to depend on searchQuery and filter directly

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTDSData();
    setRefreshing(false);
  }, [fetchTDSData]);

  const handleTDSPress = (tds) => {
    setSelectedTDS(tds);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getTDSStatusColor = (status) => {
    const colors = {
      'paid': '#10b981',
      'pending': '#f59e0b',
      'overdue': '#ef4444',
      'partial': '#3b82f6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getTDSStatusIcon = (status) => {
    const icons = {
      'paid': 'checkmark-circle',
      'pending': 'time',
      'overdue': 'warning',
      'partial': 'pie-chart',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  const filterOptions = [
    { key: 'all', label: 'All TDS', icon: 'list-outline' },
    { key: 'paid', label: 'Paid', icon: 'checkmark-circle-outline' },
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'overdue', label: 'Overdue', icon: 'warning-outline' },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="TDS Management" 
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
          <Text style={styles.sectionTitle}>TDS Management</Text>
          <Text style={styles.sectionSubtitle}>
            Track and manage Tax Deducted at Source transactions
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search TDS by deductee or TAN..."
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

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                filter === option.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(option.key)}
            >
              <Ionicons 
                name={option.icon} 
                size={16} 
                color={filter === option.key ? 'white' : '#64748b'} 
              />
              <Text style={[
                styles.filterTabText,
                filter === option.key && styles.filterTabTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="receipt" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{tdsData.length}</Text>
              <Text style={styles.statLabel}>Total TDS</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {tdsData.filter(item => item.status === 'paid').length}
              </Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning" size={24} color="#ef4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {tdsData.filter(item => item.status === 'overdue').length}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* TDS List */}
        {loading ? (
          <View style={styles.tdsList}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : tdsData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No TDS Records Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No TDS records found matching "${searchQuery}"`
                  : 'No TDS transactions have been recorded yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.tdsList}>
            {tdsData.map((tds, index) => (
              <TouchableOpacity
                key={tds.id || index}
                style={styles.tdsCard}
                onPress={() => handleTDSPress(tds)}
                activeOpacity={0.95}
              >
                <View style={styles.tdsCardGradient}>
                  <View style={styles.tdsCardContent}>
                    <View style={styles.tdsCardHeader}>
                      <View style={[
                        styles.tdsIcon,
                        { backgroundColor: getTDSStatusColor(tds.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getTDSStatusIcon(tds.status)} 
                          size={24} 
                          color={getTDSStatusColor(tds.status)} 
                        />
                      </View>
                      <View style={styles.tdsInfo}>
                        <Text style={styles.tdsTitle}>
                          {tds.deductee_name || 'TDS Transaction'}
                        </Text>
                        <Text style={styles.tdsDate}>
                          Deducted: {formatDate(tds.deduction_date)}
                        </Text>
                      </View>
                      <View style={styles.tdsStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getTDSStatusColor(tds.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {tds.status?.toUpperCase() || 'PENDING'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.tdsCardBody}>
                      <View style={styles.tdsDetail}>
                        <Ionicons name="person-outline" size={16} color="#64748b" />
                        <Text style={styles.tdsDetailText}>
                          PAN: {tds.deductee_pan || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.tdsDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.tdsDetailText}>
                          Section: {tds.tds_section || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.tdsDetail}>
                        <Ionicons name="calculator-outline" size={16} color="#64748b" />
                        <Text style={styles.tdsDetailText}>
                          Rate: {tds.tds_rate || 0}%
                        </Text>
                      </View>
                      <View style={styles.tdsDetail}>
                        <Ionicons name="cash-outline" size={16} color="#64748b" />
                        <Text style={styles.tdsDetailText}>
                          Amount: {formatCurrency(tds.payment_amount)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tdsCardFooter}>
                      <View style={styles.tdsAmount}>
                        <Text style={styles.tdsAmountValue}>
                          {formatCurrency(tds.tds_amount)}
                        </Text>
                        <Text style={styles.tdsAmountLabel}>TDS Deducted</Text>
                      </View>
                      <TouchableOpacity style={styles.tdsAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getTDSStatusColor(tds.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getTDSStatusColor(tds.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* TDS Detail Modal */}
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
                { backgroundColor: selectedTDS ? getTDSStatusColor(selectedTDS.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedTDS ? getTDSStatusIcon(selectedTDS.status) : 'receipt'} 
                  size={20} 
                  color={selectedTDS ? getTDSStatusColor(selectedTDS.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>TDS Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTDS?.deductee_name || 'TDS Transaction'}
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
          
          {selectedTDS && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Transaction Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deductee Name:</Text>
                  <Text style={styles.detailValue}>{selectedTDS.deductee_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PAN:</Text>
                  <Text style={styles.detailValue}>{selectedTDS.deductee_pan || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TDS Section:</Text>
                  <Text style={styles.detailValue}>{selectedTDS.tds_section || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TDS Rate:</Text>
                  <Text style={styles.detailValue}>{selectedTDS.tds_rate || 0}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getTDSStatusColor(selectedTDS.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedTDS.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Amount Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedTDS.payment_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TDS Deducted:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedTDS.tds_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Net Payment:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency((selectedTDS.payment_amount || 0) - (selectedTDS.tds_amount || 0))}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Dates</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deduction Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTDS.deduction_date)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTDS.due_date)}
                  </Text>
                </View>
                {selectedTDS.payment_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Date:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedTDS.payment_date)}
                    </Text>
                  </View>
                )}
              </View>

              {selectedTDS.challan_number && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Challan Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Challan Number:</Text>
                    <Text style={styles.detailValue}>{selectedTDS.challan_number}</Text>
                  </View>
                  {selectedTDS.bank_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Bank:</Text>
                      <Text style={styles.detailValue}>{selectedTDS.bank_name}</Text>
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
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    flex: 1,
    ...FONT_STYLES.h5,
    color: '#0f172a',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
    ...FONT_STYLES.label,
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
    color: '#0f172a',
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2,
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
    color: '#64748b',
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
    ...FONT_STYLES.h3,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
  },
  tdsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  tdsCard: {
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
  tdsCardGradient: {
    position: 'relative',
    padding: 20,
  },
  tdsCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  tdsCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tdsIcon: {
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
  tdsInfo: {
    flex: 1,
    paddingRight: 12,
  },
  tdsTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginBottom: 4,
  },
  tdsDate: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  tdsStatus: {
    alignItems: 'flex-end',
    minWidth: 80,
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
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
  },
  tdsCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  tdsDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  tdsDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
  },
  tdsCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tdsAmount: {
    flex: 1,
  },
  tdsAmountValue: {
    ...FONT_STYLES.h4,
    color: '#3e60ab',
  },
  tdsAmountLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2,
  },
  tdsAction: {
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
    ...FONT_STYLES.h4,
    color: '#0f172a',
  },
  modalSubtitle: {
    ...FONT_STYLES.label,
    color: '#64748b',
    marginTop: 2,
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
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#64748b',
    width: 120,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    flex: 1,
  },
});