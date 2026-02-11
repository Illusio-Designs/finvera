import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

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

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await voucherAPI.list({ 
        limit: 50,
        sort: 'created_at',
        order: 'desc'
      });
      const data = response.data?.data || response.data || [];
      const voucherList = Array.isArray(data) ? data : [];
      setVouchers(voucherList);
    } catch (error) {
      console.error('Vouchers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load vouchers'
      });
      setVouchers([]);
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
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
      <View style={styles.voucherCardHeader}>
        <View style={styles.voucherMainInfo}>
          <Text style={styles.voucherNumber}>{item.voucher_number || 'N/A'}</Text>
          <Text style={styles.voucherType}>{item.voucher_type?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
          {item.party_name && (
            <Text style={styles.voucherParty}>{item.party_name}</Text>
          )}
        </View>
        <View style={styles.voucherAmount}>
          <Text style={styles.voucherBalance}>{formatCurrency(item.total_amount || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase() || 'DRAFT'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.voucherCardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleVoucherPress(item);
          }}
        >
          <Ionicons name="eye-outline" size={16} color="#3e60ab" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            showNotification({
              type: 'info',
              title: 'Coming Soon',
              message: 'Print functionality will be available soon'
            });
          }}
        >
          <Ionicons name="print-outline" size={16} color="#2563eb" />
          <Text style={styles.actionButtonText}>Print</Text>
        </TouchableOpacity>
        
        {item.status === 'draft' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              showNotification({
                type: 'info',
                title: 'Coming Soon',
                message: 'Edit functionality will be available soon'
              });
            }}
          >
            <Ionicons name="create-outline" size={16} color="#059669" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            showNotification({
              type: 'info',
              title: 'Coming Soon',
              message: 'Delete functionality will be available soon'
            });
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
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
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
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
            <Text style={styles.modalTitle}>
              {selectedVoucher?.voucher_number || 'Voucher Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedVoucher && (
              <View style={styles.detailContainer}>
                {/* Amount Card */}
                <View style={styles.balanceCards}>
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceCardLabel}>Total Amount</Text>
                    <Text style={styles.balanceCardValue}>
                      {formatCurrency(selectedVoucher.total_amount || 0)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedVoucher.status) }]}>
                      <Text style={styles.statusText}>{selectedVoucher.status?.toUpperCase() || 'DRAFT'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceCardLabel}>Voucher Date</Text>
                    <Text style={styles.balanceCardValue}>
                      {formatDate(selectedVoucher.voucher_date)}
                    </Text>
                  </View>
                </View>

                {/* Voucher Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Voucher Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Voucher Number</Text>
                      <Text style={styles.infoValue}>{selectedVoucher.voucher_number || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Voucher Type</Text>
                      <Text style={styles.infoValue}>
                        {selectedVoucher.voucher_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </Text>
                    </View>
                    {selectedVoucher.party_name && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Party Name</Text>
                        <Text style={styles.infoValue}>{selectedVoucher.party_name}</Text>
                      </View>
                    )}
                    {selectedVoucher.reference && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Reference</Text>
                        <Text style={styles.infoValue}>{selectedVoucher.reference}</Text>
                      </View>
                    )}
                    {selectedVoucher.narration && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Narration</Text>
                        <Text style={styles.infoValue}>{selectedVoucher.narration}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalActionButton}
              onPress={() => {
                setShowDetailModal(false);
                showNotification({
                  type: 'info',
                  title: 'Coming Soon',
                  message: 'Print functionality will be available soon'
                });
              }}
            >
              <Ionicons name="print-outline" size={16} color="white" />
              <Text style={styles.modalActionText}>Print</Text>
            </TouchableOpacity>
            {selectedVoucher?.status === 'draft' && (
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
                onPress={() => {
                  setShowDetailModal(false);
                  showNotification({
                    type: 'info',
                    title: 'Coming Soon',
                    message: 'Edit functionality will be available soon'
                  });
                }}
              >
                <Ionicons name="create-outline" size={16} color="#3e60ab" />
                <Text style={[styles.modalActionText, { color: '#3e60ab' }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginBottom: 16,
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
    ...FONT_STYLES.label,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  typeDescription: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    textAlign: 'center',
  },
  vouchersList: {
    gap: 12,
  },
  voucherCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  voucherMainInfo: {
    flex: 1,
  },
  voucherNumber: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  voucherType: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  voucherParty: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  voucherAmount: {
    alignItems: 'flex-end',
  },
  voucherBalance: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
  },
  voucherCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  actionButtonText: {
    ...FONT_STYLES.captionSmall,
    marginLeft: 4,
  },
  amountValue: {
    color: '#3e60ab',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    ...FONT_STYLES.labelSmall,
    color: 'white',
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
    ...FONT_STYLES.body,
    color: '#6b7280',
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
    ...FONT_STYLES.h4,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONT_STYLES.label,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailContainer: {
    gap: 20,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceCardLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceCardValue: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoSectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    ...FONT_STYLES.label,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
  },
  modalActionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  modalActionText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
});