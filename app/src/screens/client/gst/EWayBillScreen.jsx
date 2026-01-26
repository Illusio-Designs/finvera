import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { gstAPI } from '../../../lib/api';

export default function EWayBillScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [ewaybills, setEwaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEwaybill, setSelectedEwaybill] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchEwaybills = useCallback(async () => {
    try {
      const response = await gstAPI.ewaybill.list({ limit: 50 });
      const data = response.data?.data || response.data || [];
      setEwaybills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('E-way bills fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load e-way bills'
      });
      setEwaybills([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEwaybills();
  }, [fetchEwaybills]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEwaybills();
    setRefreshing(false);
  }, [fetchEwaybills]);

  const handleEwaybillPress = (ewaybill) => {
    setSelectedEwaybill(ewaybill);
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
      'active': '#10b981',
      'cancelled': '#ef4444',
      'expired': '#f59e0b',
      'rejected': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'active': 'checkmark-circle',
      'cancelled': 'close-circle',
      'expired': 'time',
      'rejected': 'ban',
    };
    return icons[status?.toLowerCase()] || 'help-circle';
  };

  const getTransportModeIcon = (mode) => {
    const icons = {
      'road': 'car',
      'rail': 'train',
      'air': 'airplane',
      'ship': 'boat',
    };
    return icons[mode?.toLowerCase()] || 'car';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="E-Way Bill" 
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
          <Text style={styles.sectionTitle}>E-Way Bill Management</Text>
          <Text style={styles.sectionSubtitle}>
            Generate and track electronic way bills for goods transportation
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="car" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{ewaybills.length}</Text>
              <Text style={styles.statLabel}>Total E-Way Bills</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {ewaybills.filter(e => e.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {ewaybills.filter(e => e.status === 'cancelled').length}
              </Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* E-Way Bills List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading e-way bills...</Text>
            </View>
          </View>
        ) : ewaybills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="car-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No E-Way Bills Found</Text>
              <Text style={styles.emptySubtitle}>
                No electronic way bills have been generated yet
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.ewaybillsList}>
            {ewaybills.map((ewaybill, index) => (
              <TouchableOpacity
                key={ewaybill.id || index}
                style={styles.ewaybillCard}
                onPress={() => handleEwaybillPress(ewaybill)}
                activeOpacity={0.95}
              >
                <View style={styles.ewaybillCardGradient}>
                  <View style={styles.ewaybillCardContent}>
                    <View style={styles.ewaybillCardHeader}>
                      <View style={[
                        styles.ewaybillIcon,
                        { backgroundColor: getStatusColor(ewaybill.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getTransportModeIcon(ewaybill.transport_mode)} 
                          size={24} 
                          color={getStatusColor(ewaybill.status)} 
                        />
                      </View>
                      <View style={styles.ewaybillInfo}>
                        <Text style={styles.ewaybillNumber}>
                          EWB: {ewaybill.ewb_number || 'N/A'}
                        </Text>
                        <Text style={styles.ewaybillDate}>
                          {formatDate(ewaybill.generated_date || ewaybill.created_at)}
                        </Text>
                      </View>
                      <View style={styles.ewaybillStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(ewaybill.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {ewaybill.status?.toUpperCase() || 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.ewaybillCardBody}>
                      <View style={styles.ewaybillDetail}>
                        <Ionicons name="business-outline" size={16} color="#64748b" />
                        <Text style={styles.ewaybillDetailText}>
                          Consignee: {ewaybill.consignee_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.ewaybillDetail}>
                        <Ionicons name="location-outline" size={16} color="#64748b" />
                        <Text style={styles.ewaybillDetailText}>
                          From: {ewaybill.from_place || 'N/A'} → To: {ewaybill.to_place || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.ewaybillDetail}>
                        <Ionicons name="cash-outline" size={16} color="#64748b" />
                        <Text style={styles.ewaybillDetailText}>
                          Value: {formatCurrency(ewaybill.total_value)}
                        </Text>
                      </View>
                      <View style={styles.ewaybillDetail}>
                        <Ionicons name="speedometer-outline" size={16} color="#64748b" />
                        <Text style={styles.ewaybillDetailText}>
                          Distance: {ewaybill.distance || 0} km
                        </Text>
                      </View>
                      {ewaybill.vehicle_number && (
                        <View style={styles.ewaybillDetail}>
                          <Ionicons name="car-outline" size={16} color="#64748b" />
                          <Text style={styles.ewaybillDetailText}>
                            Vehicle: {ewaybill.vehicle_number}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.ewaybillCardFooter}>
                      <View style={styles.ewaybillMeta}>
                        <Text style={styles.ewaybillExpiry}>
                          {ewaybill.valid_until 
                            ? `Valid until: ${formatDate(ewaybill.valid_until)}`
                            : 'Validity not specified'
                          }
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.ewaybillAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getStatusColor(ewaybill.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getStatusColor(ewaybill.status) }
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
              <Text style={styles.infoTitle}>About E-Way Bill</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  E-Way Bill is required for goods movement above ₹50,000
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Valid for specific time periods based on distance
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Can be generated by supplier, recipient, or transporter
                </Text>
              </View>
              <View style={styles.infoPoint}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>
                  Required for inter-state and intra-state movement
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* E-Way Bill Detail Modal */}
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
                { backgroundColor: selectedEwaybill ? getStatusColor(selectedEwaybill.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedEwaybill ? getTransportModeIcon(selectedEwaybill.transport_mode) : 'car'} 
                  size={20} 
                  color={selectedEwaybill ? getStatusColor(selectedEwaybill.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>E-Way Bill Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedEwaybill?.ewb_number || 'E-Way Bill Information'}
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
          
          {selectedEwaybill && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>E-Way Bill Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>EWB Number:</Text>
                  <Text style={styles.detailValue}>{selectedEwaybill.ewb_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedEwaybill.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedEwaybill.status?.toUpperCase() || 'ACTIVE'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Generated Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedEwaybill.generated_date || selectedEwaybill.created_at)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valid Until:</Text>
                  <Text style={styles.detailValue}>
                    {selectedEwaybill.valid_until 
                      ? formatDate(selectedEwaybill.valid_until)
                      : 'Not specified'
                    }
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Value:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(selectedEwaybill.total_value)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Consignment Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Consignor:</Text>
                  <Text style={styles.detailValue}>{selectedEwaybill.consignor_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Consignee:</Text>
                  <Text style={styles.detailValue}>{selectedEwaybill.consignee_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From Place:</Text>
                  <Text style={styles.detailValue}>{selectedEwaybill.from_place || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To Place:</Text>
                  <Text style={styles.detailValue}>{selectedEwaybill.to_place || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distance:</Text>
                  <Text style={styles.detailValue}>{selectedEwaybill.distance || 0} km</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Transport Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transport Mode:</Text>
                  <Text style={styles.detailValue}>
                    {selectedEwaybill.transport_mode?.toUpperCase() || 'ROAD'}
                  </Text>
                </View>
                {selectedEwaybill.vehicle_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vehicle Number:</Text>
                    <Text style={styles.detailValue}>{selectedEwaybill.vehicle_number}</Text>
                  </View>
                )}
                {selectedEwaybill.transporter_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transporter:</Text>
                    <Text style={styles.detailValue}>{selectedEwaybill.transporter_name}</Text>
                  </View>
                )}
                {selectedEwaybill.transporter_id && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transporter ID:</Text>
                    <Text style={styles.detailValue}>{selectedEwaybill.transporter_id}</Text>
                  </View>
                )}
                {selectedEwaybill.document_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Document Number:</Text>
                    <Text style={styles.detailValue}>{selectedEwaybill.document_number}</Text>
                  </View>
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
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'Agency',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 24,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
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
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 24,
  },
  ewaybillsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  ewaybillCard: {
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
  ewaybillCardGradient: {
    position: 'relative',
    padding: 20,
  },
  ewaybillCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  ewaybillCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ewaybillIcon: {
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
  ewaybillInfo: {
    flex: 1,
  },
  ewaybillNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  ewaybillDate: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  ewaybillStatus: {
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
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  ewaybillCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  ewaybillDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ewaybillDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
  },
  ewaybillCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ewaybillMeta: {
    flex: 1,
  },
  ewaybillExpiry: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  ewaybillAction: {
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
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
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
    flex: 1,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    width: 120,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Agency',
  },
});