import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { useNavigation } from '@react-navigation/native';

const VOUCHER_TYPES = [
  { 
    value: 'sales_invoice', 
    label: 'Sales Invoice', 
    icon: 'trending-up', 
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: 'Record sales transactions'
  },
  { 
    value: 'purchase_invoice', 
    label: 'Purchase Invoice', 
    icon: 'trending-down', 
    color: '#f59e0b',
    bgColor: '#fffbeb',
    description: 'Record purchase transactions'
  },
  { 
    value: 'payment', 
    label: 'Payment', 
    icon: 'card', 
    color: '#ef4444',
    bgColor: '#fef2f2',
    description: 'Record outgoing payments'
  },
  { 
    value: 'receipt', 
    label: 'Receipt', 
    icon: 'cash', 
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: 'Record incoming receipts'
  },
  { 
    value: 'journal', 
    label: 'Journal', 
    icon: 'document-text', 
    color: '#6366f1',
    bgColor: '#eef2ff',
    description: 'Record journal entries'
  },
  { 
    value: 'contra', 
    label: 'Contra', 
    icon: 'refresh', 
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Record contra entries'
  },
  { 
    value: 'debit_note', 
    label: 'Debit Note', 
    icon: 'remove-circle', 
    color: '#f59e0b',
    bgColor: '#fffbeb',
    description: 'Record debit adjustments'
  },
  { 
    value: 'credit_note', 
    label: 'Credit Note', 
    icon: 'add-circle', 
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: 'Record credit adjustments'
  },
];

export default function VouchersScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    draft: 0,
    posted: 0,
    totalAmount: 0
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchVouchers = useCallback(async () => {
    try {
      const response = await voucherAPI.list({ 
        limit: 50,
        sort: 'created_at',
        order: 'desc'
      });
      const data = response.data?.data || response.data || [];
      const voucherList = Array.isArray(data) ? data : [];
      setVouchers(voucherList);
      
      // Calculate stats
      const stats = voucherList.reduce((acc, voucher) => {
        acc.total += 1;
        if (voucher.status === 'draft') acc.draft += 1;
        if (voucher.status === 'posted') acc.posted += 1;
        acc.totalAmount += parseFloat(voucher.total_amount || 0);
        return acc;
      }, { total: 0, draft: 0, posted: 0, totalAmount: 0 });
      
      setVoucherStats(stats);
    } catch (error) {
      console.error('Vouchers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load vouchers'
      });
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  }, [fetchVouchers]);

  const handleVoucherPress = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const handleCreateVoucher = (voucherType) => {
    // Navigate to specific voucher creation screen
    const screenMap = {
      'purchase_invoice': 'PurchaseInvoice',
      'sales_invoice': 'SalesInvoice',
      'payment': 'Payment',
      'receipt': 'Receipt', 
      'journal': 'Journal',
      'contra': 'Contra',
      'debit_note': 'DebitNote',
      'credit_note': 'CreditNote',
    };

    const screenName = screenMap[voucherType.value];
    
    if (screenName) {
      try {
        navigation.navigate(screenName, { 
          mode: 'create', 
          voucherType: voucherType.value,
          voucherLabel: voucherType.label 
        });
      } catch (error) {
        console.error('Navigation error:', error);
        showNotification({
          type: 'error',
          title: 'Navigation Error',
          message: error.message
        });
      }
    } else {
      showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: `${voucherType.label} creation will be available soon`
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'posted': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const renderVoucherTypeCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.typeCard, { backgroundColor: item.bgColor }]}
      onPress={() => handleCreateVoucher(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.typeIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color="white" />
      </View>
      <Text style={styles.typeLabel}>{item.label}</Text>
      <Text style={styles.typeDescription} numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderVoucherCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.voucherCard}
      onPress={() => handleVoucherPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.voucherHeader}>
        <View style={styles.voucherInfo}>
          <Text style={styles.voucherNumber}>{item.voucher_number || 'N/A'}</Text>
          <Text style={styles.voucherType}>{item.voucher_type?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
        </View>
        <View style={styles.voucherAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.total_amount || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase() || 'DRAFT'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.voucherFooter}>
        <View style={styles.voucherDetail}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{formatDate(item.voucher_date)}</Text>
        </View>
        {item.party_name && (
          <View style={styles.voucherDetail}>
            <Ionicons name="person-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.party_name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TopBar 
        title="Vouchers" 
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
          <Text style={styles.sectionTitle}>Voucher Management</Text>
          <Text style={styles.sectionSubtitle}>
            Create, manage and track all your business vouchers
          </Text>
          
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{voucherStats.total}</Text>
                <Text style={styles.statLabel}>Total Vouchers</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{voucherStats.draft}</Text>
                <Text style={styles.statLabel}>Draft</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{voucherStats.posted}</Text>
                <Text style={styles.statLabel}>Posted</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{formatCurrency(voucherStats.totalAmount)}</Text>
                <Text style={styles.statLabel}>Total Amount</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Create Voucher Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Create New Voucher</Text>
            <Text style={styles.sectionSubtitle}>Choose a voucher type to get started</Text>
          </View>
          
          <FlatList
            data={VOUCHER_TYPES}
            renderItem={renderVoucherTypeCard}
            keyExtractor={(item) => item.value}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.typesList}
            columnWrapperStyle={styles.typesRow}
          />
        </View>

        {/* Recent Vouchers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Vouchers</Text>
            <TouchableOpacity onPress={fetchVouchers}>
              <Ionicons name="refresh" size={20} color="#3e60ab" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading vouchers...</Text>
            </View>
          ) : vouchers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Vouchers Found</Text>
              <Text style={styles.emptySubtitle}>
                Create your first voucher using the options above
              </Text>
            </View>
          ) : (
            <FlatList
              data={vouchers.slice(0, 10)} // Show only recent 10
              renderItem={renderVoucherCard}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.vouchersList}
            />
          )}
        </View>
      </ScrollView>

      {/* Voucher Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voucher Details</Text>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedVoucher && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Voucher Information</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Voucher Number</Text>
                  <Text style={styles.detailValue}>{selectedVoucher.voucher_number || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View style={[styles.typeBadge, { backgroundColor: '#3e60ab' }]}>
                    <Text style={styles.typeBadgeText}>
                      {selectedVoucher.voucher_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedVoucher.voucher_date)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    {formatCurrency(selectedVoucher.total_amount || 0)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedVoucher.status) }]}>
                    <Text style={styles.statusText}>{selectedVoucher.status?.toUpperCase() || 'DRAFT'}</Text>
                  </View>
                </View>
                
                {selectedVoucher.party_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Party Name</Text>
                    <Text style={styles.detailValue}>{selectedVoucher.party_name}</Text>
                  </View>
                )}
                
                {selectedVoucher.reference && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference</Text>
                    <Text style={styles.detailValue}>{selectedVoucher.reference}</Text>
                  </View>
                )}
                
                {selectedVoucher.narration && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Narration</Text>
                    <Text style={styles.detailValue}>{selectedVoucher.narration}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                  <Text style={[styles.modalActionText, { color: '#3e60ab' }]}>View Full Details</Text>
                </TouchableOpacity>
                
                {selectedVoucher.status === 'draft' && (
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => {
                      setShowDetailModal(false);
                      showNotification({
                        type: 'info',
                        title: 'Coming Soon',
                        message: 'Edit voucher functionality will be available soon'
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="white" />
                    <Text style={styles.modalActionText}>Edit Voucher</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
  },
  statsContainer: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3e60ab',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    marginBottom: 16,
  },
  typesList: {
    gap: 8,
  },
  typesRow: {
    justifyContent: 'space-between',
  },
  typeCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContent: {
    flex: 1,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  typeDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: 'Agency',
  },
  vouchersList: {
    gap: 12,
  },
  voucherCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  voucherType: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  voucherAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e60ab',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  amountValue: {
    color: '#3e60ab',
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Agency',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Agency',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    gap: 8,
  },
  modalActionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
});