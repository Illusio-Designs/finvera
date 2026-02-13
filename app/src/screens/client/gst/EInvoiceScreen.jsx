import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { eInvoiceAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import TableSkeleton from '../../../components/ui/skeletons/TableSkeleton';

export default function EInvoiceScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [einvoices, setEinvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchEinvoices = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const params = { limit: 100 };
      
      if (filter !== 'all') {
        params.status = filter.toUpperCase();
      }
      
      const response = await eInvoiceAPI.list(params);
      const data = response.data?.data || response.data || [];
      const summaryData = response.data?.summary || null;
      
      setEinvoices(Array.isArray(data) ? data : []);
      setSummary(summaryData);
    } catch (error) {
      console.error('E-invoices fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load e-invoices'
      });
      setEinvoices([]);
      setSummary(null);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [filter, showNotification]);

  useEffect(() => {
    fetchEinvoices();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEinvoices();
    setRefreshing(false);
  }, [fetchEinvoices]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const getStatusColor = (status) => {
    const colors = {
      'generated': '#10b981',
      'pending': '#f59e0b',
      'failed': '#ef4444',
      'cancelled': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="E-Invoice" 
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

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsContainer}
          contentContainerStyle={styles.filterTabs}
        >
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'generated' && styles.filterTabActive]}
            onPress={() => setFilter('generated')}
          >
            <Text style={[styles.filterTabText, filter === 'generated' && styles.filterTabTextActive]}>
              Generated
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'cancelled' && styles.filterTabActive]}
            onPress={() => setFilter('cancelled')}
          >
            <Text style={[styles.filterTabText, filter === 'cancelled' && styles.filterTabTextActive]}>
              Cancelled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'failed' && styles.filterTabActive]}
            onPress={() => setFilter('failed')}
          >
            <Text style={[styles.filterTabText, filter === 'failed' && styles.filterTabTextActive]}>
              Failed
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <View style={styles.reportContainer}>
            <TableSkeleton rows={10} columns={4} />
          </View>
        ) : !einvoices || einvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No E-Invoices Found</Text>
            <Text style={styles.emptySubtitle}>
              No electronic invoices available for the selected filter
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>E-Invoice Report</Text>
              <Text style={styles.reportSubtitle}>Electronic Invoice Management</Text>
            </View>

            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardIcon}>
                    <Ionicons name="document-text" size={24} color="#3e60ab" />
                  </View>
                  <View style={styles.summaryCardContent}>
                    <Text style={styles.summaryCardLabel}>Total E-Invoices</Text>
                    <Text style={styles.summaryCardValue}>{summary?.total || einvoices.length}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardIcon}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                  <View style={styles.summaryCardContent}>
                    <Text style={styles.summaryCardLabel}>Generated</Text>
                    <Text style={[styles.summaryCardValue, { color: '#10b981' }]}>
                      {summary?.generated || einvoices.filter(e => e.status?.toLowerCase() === 'generated').length}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardIcon}>
                    <Ionicons name="time" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.summaryCardContent}>
                    <Text style={styles.summaryCardLabel}>Pending</Text>
                    <Text style={styles.summaryCardValue}>
                      {summary?.pending || einvoices.filter(e => e.status?.toLowerCase() === 'pending').length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.tableContainer}>
              <Text style={styles.tableTitle}>E-Invoice List</Text>
              <ScrollView 
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                style={styles.tableScrollView}
              >
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <View style={[styles.tableHeaderCell, styles.invoiceColumn]}>
                      <Text style={styles.tableHeaderText}>Invoice Number</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.dateColumn]}>
                      <Text style={styles.tableHeaderText}>Date</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.partyColumn]}>
                      <Text style={styles.tableHeaderText}>Buyer</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.irnColumn]}>
                      <Text style={styles.tableHeaderText}>IRN</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.amountColumn]}>
                      <Text style={styles.tableHeaderText}>Amount</Text>
                    </View>
                    <View style={styles.tableHeaderStatus}>
                      <Text style={styles.tableHeaderText}>Status</Text>
                    </View>
                  </View>

                  <ScrollView 
                    style={styles.tableBodyScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.tableBody}>
                      {einvoices.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                          <View style={[styles.tableCell, styles.invoiceColumn]}>
                            <Text style={styles.tableCellText}>
                              {item.voucher?.voucher_number || item.invoice_number || 'N/A'}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.dateColumn]}>
                            <Text style={styles.tableCellText}>
                              {formatDate(item.voucher?.voucher_date || item.createdAt)}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.partyColumn]}>
                            <Text style={styles.tableCellText}>
                              {item.buyer_name || item.voucher?.party_name || 'N/A'}
                            </Text>
                            {item.buyer_gstin && (
                              <Text style={styles.detailText}>GSTIN: {item.buyer_gstin}</Text>
                            )}
                          </View>
                          <View style={[styles.tableCell, styles.irnColumn]}>
                            <Text style={styles.tableCellText} numberOfLines={1}>
                              {item.irn || 'Not Generated'}
                            </Text>
                            {item.ack_number && (
                              <Text style={styles.detailText}>ACK: {item.ack_number}</Text>
                            )}
                          </View>
                          <View style={[styles.tableCell, styles.amountColumn]}>
                            <Text style={styles.tableCellAmountText}>
                              {formatCurrency(item.total_amount || item.voucher?.total_amount || 0)}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.statusColumn]}>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(item.status) }
                            ]}>
                              <Text style={styles.statusText}>
                                {item.status?.toUpperCase() || 'PENDING'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
          </>
        )}
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
  filterTabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 80,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
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
  },
  reportContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  summaryRow: {
    width: '100%',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryCardContent: {
    flex: 1,
  },
  summaryCardLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryCardValue: {
    ...FONT_STYLES.h4,
    color: '#111827',
    fontWeight: '600',
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tableTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  tableScrollView: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  table: {
    backgroundColor: 'white',
    minWidth: 900,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    minHeight: 50,
  },
  tableHeaderCell: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'center',
  },
  tableHeaderStatus: {
    width: 120,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceColumn: {
    width: 150,
  },
  dateColumn: {
    width: 100,
  },
  partyColumn: {
    width: 200,
  },
  irnColumn: {
    width: 200,
  },
  amountColumn: {
    width: 130,
  },
  statusColumn: {
    width: 120,
  },
  tableHeaderText: {
    ...FONT_STYLES.label,
    color: '#374151',
    textAlign: 'center',
  },
  tableBodyScrollView: {
    maxHeight: 500,
  },
  tableBody: {
    backgroundColor: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 50,
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    justifyContent: 'center',
  },
  tableCellText: {
    ...FONT_STYLES.bodySmall,
    color: '#374151',
    lineHeight: 18,
  },
  tableCellAmountText: {
    ...FONT_STYLES.bodySmall,
    color: '#059669',
    textAlign: 'right',
    fontWeight: '600',
  },
  detailText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
    fontWeight: '600',
  },
});
