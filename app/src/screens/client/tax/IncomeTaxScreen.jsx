import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { taxAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';

export default function IncomeTaxScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [taxData, setTaxData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchTaxData = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await taxAPI.incomeTax.returns({ limit: 50 });
      const data = response.data?.data || response.data || [];
      setTaxData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Income tax fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load income tax data'
      });
      setTaxData([]);
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
    fetchTaxData();
  }, [fetchTaxData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTaxData();
    setRefreshing(false);
  }, [fetchTaxData]);

  const handleCalculatorPress = () => {
    setShowCalculatorModal(true);
  };

  const handleReturnPress = (taxReturn) => {
    setSelectedReturn(taxReturn);
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
          <Text style={styles.sectionTitle}>Income Tax Management</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your income tax returns and calculations
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={handleCalculatorPress}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="calculator" size={28} color="#3e60ab" />
            </View>
            <Text style={styles.quickActionTitle}>Tax Calculator</Text>
            <Text style={styles.quickActionSubtitle}>Calculate your tax liability</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="document-text" size={28} color="#10b981" />
            </View>
            <Text style={styles.quickActionTitle}>File Return</Text>
            <Text style={styles.quickActionSubtitle}>File your ITR online</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="document-text" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{taxData.length}</Text>
              <Text style={styles.statLabel}>Total Returns</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {taxData.filter(item => item.status === 'filed').length}
              </Text>
              <Text style={styles.statLabel}>Filed</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning" size={24} color="#ef4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {taxData.filter(item => item.status === 'overdue').length}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* Tax Returns List */}
        {loading ? (
          <View style={styles.returnsList}>
            <FormSkeleton fieldCount={4} />
          </View>
        ) : taxData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Tax Returns Found</Text>
              <Text style={styles.emptySubtitle}>
                No income tax returns have been filed yet
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.returnsList}>
            {taxData.map((taxReturn, index) => (
              <TouchableOpacity
                key={taxReturn.id || index}
                style={styles.returnCard}
                onPress={() => handleReturnPress(taxReturn)}
                activeOpacity={0.95}
              >
                <View style={styles.returnCardGradient}>
                  <View style={styles.returnCardContent}>
                    <View style={styles.returnCardHeader}>
                      <View style={[
                        styles.returnIcon,
                        { backgroundColor: getReturnStatusColor(taxReturn.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getReturnStatusIcon(taxReturn.status)} 
                          size={24} 
                          color={getReturnStatusColor(taxReturn.status)} 
                        />
                      </View>
                      <View style={styles.returnInfo}>
                        <Text style={styles.returnTitle}>
                          ITR-{taxReturn.form_type || '1'} ({taxReturn.assessment_year || '2024-25'})
                        </Text>
                        <Text style={styles.returnDate}>
                          Due: {formatDate(taxReturn.due_date)}
                        </Text>
                      </View>
                      <View style={styles.returnStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getReturnStatusColor(taxReturn.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {taxReturn.status?.toUpperCase() || 'DRAFT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.returnCardBody}>
                      <View style={styles.returnDetail}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.returnDetailText}>
                          Assessment Year: {taxReturn.assessment_year || '2024-25'}
                        </Text>
                      </View>
                      <View style={styles.returnDetail}>
                        <Ionicons name="cash-outline" size={16} color="#64748b" />
                        <Text style={styles.returnDetailText}>
                          Total Income: {formatCurrency(taxReturn.total_income)}
                        </Text>
                      </View>
                      <View style={styles.returnDetail}>
                        <Ionicons name="receipt-outline" size={16} color="#64748b" />
                        <Text style={styles.returnDetailText}>
                          Tax Payable: {formatCurrency(taxReturn.tax_payable)}
                        </Text>
                      </View>
                      {taxReturn.filed_date && (
                        <View style={styles.returnDetail}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#64748b" />
                          <Text style={styles.returnDetailText}>
                            Filed: {formatDate(taxReturn.filed_date)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.returnCardFooter}>
                      <View style={styles.returnMeta}>
                        <Text style={styles.returnReference}>
                          Ref: {taxReturn.reference_number || `ITR-${taxReturn.id}`}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.returnAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getReturnStatusColor(taxReturn.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getReturnStatusColor(taxReturn.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Tax Calculator Modal */}
      <Modal
        visible={showCalculatorModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalculatorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="calculator" size={20} color="#3e60ab" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Tax Calculator</Text>
                <Text style={styles.modalSubtitle}>Calculate your income tax</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowCalculatorModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.calculatorCard}>
              <Text style={styles.calculatorTitle}>Income Tax Calculator</Text>
              <Text style={styles.calculatorSubtitle}>
                Enter your income details to calculate tax liability
              </Text>
              
              <View style={styles.comingSoonContainer}>
                <Ionicons name="construct" size={48} color="#94a3b8" />
                <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                <Text style={styles.comingSoonText}>
                  Tax calculator feature will be available in the next update
                </Text>
              </View>
            </View>
          </ScrollView>
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
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    textAlign: 'center',
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
  returnsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  returnCard: {
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
  returnCardGradient: {
    position: 'relative',
    padding: 20,
  },
  returnCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  returnCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  returnIcon: {
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
  returnInfo: {
    flex: 1,
    paddingRight: 12,
  },
  returnTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginBottom: 4,
  },
  returnDate: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  returnStatus: {
    alignItems: 'flex-end',
    minWidth: 70,
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
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
  },
  returnCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  returnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  returnDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
  },
  returnCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  returnMeta: {
    flex: 1,
  },
  returnReference: {
    ...FONT_STYLES.labelSmall,
    color: '#3e60ab',
  },
  returnAction: {
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
    backgroundColor: '#dbeafe',
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
  calculatorCard: {
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
  calculatorTitle: {
    ...FONT_STYLES.h3,
    color: '#0f172a',
    marginBottom: 8,
  },
  calculatorSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    marginBottom: 32,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    textAlign: 'center',
  },
});