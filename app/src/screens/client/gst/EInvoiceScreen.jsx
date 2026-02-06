import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { gstAPI } from '../../../lib/api';

export default function EInvoiceScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [einvoices, setEinvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEinvoice, setSelectedEinvoice] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchEinvoices = useCallback(async () => {
    try {
      const response = await gstAPI.einvoice.list({ limit: 50 });
      const data = response.data?.data || response.data || [];
      setEinvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('E-invoices fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load e-invoices'
      });
      setEinvoices([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEinvoices();
  }, [fetchEinvoices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEinvoices();
    setRefreshing(false);
  }, [fetchEinvoices]);

  const handleEinvoicePress = (einvoice) => {
    setSelectedEinvoice(einvoice);
    setShowDetailModal(true);
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

  const getStatusColor = (status) => {
    const colors = {
      'generated': '#10b981',
      'pending': '#f59e0b',
      'failed': '#ef4444',
      'cancelled': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'generated': 'checkmark-circle',
      'pending': 'time',
      'failed': 'close-circle',
      'cancelled': 'ban',
    };
    return icons[status?.toLowerCase()] || 'help-circle';
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>E-Invoice Management</Text>
          <Text style={styles.sectionSubtitle}>
            Generate and manage electronic invoices for GST compliance
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="document-text" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{einvoices.length}</Text>
              <Text style={styles.statLabel}>Total E-Invoices</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {einvoices.filter(e => e.status === 'generated').length}
              </Text>
              <Text style={styles.statLabel}>Generated</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {einvoices.filter(e => e.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* E-Invoices List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading e-invoices...</Text>
            </View>
          </View>
        ) : einvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No E-Invoices Found</Text>
              <Text style={styles.emptySubtitle}>
                No electronic invoices have been generated yet
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.einvoicesList}>
            {einvoices.map((einvoice, index) => (
              <TouchableOpacity
                key={einvoice.id || index}
                style={styles.einvoiceCard}
                onPress={() => handleEinvoicePress(einvoice)}
                activeOpacity={0.95}
              >
                <View style={styles.einvoiceCardGradient}>
                  <View style={styles.einvoiceCardContent}>
                    <View style={styles.einvoiceCardHeader}>
                      <View style={[
                        styles.einvoiceIcon,
                        { backgroundColor: getStatusColor(einvoice.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getStatusIcon(einvoice.status)} 
                          size={24} 
                          color={getStatusColor(einvoice.status)} 
                        />
                      </View>
                      <View style={styles.einvoiceInfo}>
                        <Text style={styles.einvoiceNumber}>
                          {einvoice.invoice_number || 'INV-' + (einvoice.id || index)}
                        </Text>
                        <Text style={styles.einvoiceDate}>
                          {formatDate(einvoice.invoice_date || einvoice.created_at)}
                        </Text>
                      </View>
                      <View style={styles.einvoiceStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(einvoice.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {einvoice.status?.toUpperCase() || 'PENDING'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.einvoiceCardBody}>
                      <View style={styles.einvoiceDetail}>
                        <Ionicons name="business-outline" size={16} color="#64748b" />
                        <Text style={styles.einvoiceDetailText}>
                          Buyer: {einvoice.buyer_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.einvoiceDetail}>
                        <Ionicons name="receipt-outline" size={16} color="#64748b" />
                        <Text style={styles.einvoiceDetailText}>
                          GSTIN: {einvoice.buyer_gstin || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.einvoiceDetail}>
                        <Ionicons name="cash-outline" size={16} color="#64748b" />
                        <Text style={styles.einvoiceDetailText}>
                          Amount: {formatCurrency(einvoice.total_amount)}
                        </Text>
                      </View>
                      {einvoice.irn && (
                        <View style={styles.einvoiceDetail}>
                          <Ionicons name="barcode-outline" size={16} color="#64748b" />
                          <Text style={styles.einvoiceDetailText} numberOfLines={1}>
                            IRN: {einvoice.irn}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.einvoiceCardFooter}>
                      <View style={styles.einvoiceMeta}>
                        <Text style={styles.einvoiceReference}>
                          {einvoice.ack_number ? `ACK: ${einvoice.ack_number}` : 'No ACK'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.einvoiceAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getStatusColor(einvoice.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getStatusColor(einvoice.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#3e60ab" />
              <Text style={styles.infoTitle}>About E-Invoice</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  E-Invoice is mandatory for businesses with turnover above ₹20 crores
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Each e-invoice gets a unique Invoice Reference Number (IRN)
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  E-invoices are digitally signed and cannot be tampered with
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Auto-population of GSTR-1 and e-way bill generation
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* E-Invoice Detail Modal */}
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
                { backgroundColor: selectedEinvoice ? getStatusColor(selectedEinvoice.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedEinvoice ? getStatusIcon(selectedEinvoice.status) : 'document-text'} 
                  size={20} 
                  color={selectedEinvoice ? getStatusColor(selectedEinvoice.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>E-Invoice Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedEinvoice?.invoice_number || 'Invoice Information'}
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
          
          {selectedEinvoice && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Invoice Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Invoice Number:</Text>
                  <Text style={styles.detailValue}>{selectedEinvoice.invoice_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedEinvoice.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedEinvoice.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Invoice Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedEinvoice.invoice_date || selectedEinvoice.created_at)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(selectedEinvoice.total_amount)}
                  </Text>
                </View>
                {selectedEinvoice.irn && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IRN:</Text>
                    <Text style={styles.detailValue}>{selectedEinvoice.irn}</Text>
                  </View>
                )}
                {selectedEinvoice.ack_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ACK Number:</Text>
                    <Text style={styles.detailValue}>{selectedEinvoice.ack_number}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Buyer Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Buyer Name:</Text>
                  <Text style={styles.detailValue}>{selectedEinvoice.buyer_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Buyer GSTIN:</Text>
                  <Text style={styles.detailValue}>{selectedEinvoice.buyer_gstin || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Buyer Address:</Text>
                  <Text style={styles.detailValue}>
                    {selectedEinvoice.buyer_address || 'Address not available'}
                  </Text>
                </View>
              </View>

              {(selectedEinvoice.qr_code || selectedEinvoice.signed_invoice) && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Digital Signature</Text>
                  {selectedEinvoice.qr_code && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>QR Code:</Text>
                      <Text style={styles.detailValue}>Available</Text>
                    </View>
                  )}
                  {selectedEinvoice.signed_invoice && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Digital Signature:</Text>
                      <Text style={styles.detailValue}>Verified</Text>
                    </View>
                  )}
                  {selectedEinvoice.ack_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ACK Date:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedEinvoice.ack_date)}
                      </Text>
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
  einvoicesList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  einvoiceCard: {
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
  einvoiceCardGradient: {
    position: 'relative',
    padding: 20,
  },
  einvoiceCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  einvoiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  einvoiceIcon: {
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
  einvoiceInfo: {
    flex: 1,
  },
  einvoiceNumber: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3
  },
  einvoiceDate: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  einvoiceStatus: {
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
  einvoiceCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  einvoiceDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  einvoiceDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1
  },
  einvoiceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  einvoiceMeta: {
    flex: 1,
  },
  einvoiceReference: {
    ...FONT_STYLES.caption,
    color: '#3e60ab'
  },
  einvoiceAction: {
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