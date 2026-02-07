import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import CreateLedgerModal from '../../../components/modals/CreateLedgerModal';
import DatePicker from '../../../components/ui/ModernDatePicker';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function LedgersScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [ledgerBalance, setLedgerBalance] = useState(null);
  const [statementData, setStatementData] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await accountingAPI.ledgers.list({ 
        limit: 100
      });
      const data = response.data?.data || response.data || [];
      const ledgersArray = Array.isArray(data) ? data : [];
      
      // Fetch ledgers with current balances
      // Individual detailed balance fetching will happen when user views ledger details
      setLedgers(ledgersArray);
    } catch (error) {
      console.error('Ledgers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load ledgers'
      });
      setLedgers([]);
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
    fetchLedgers();
  }, [fetchLedgers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLedgers();
    setRefreshing(false);
  }, [fetchLedgers]);

  const handleLedgerPress = (ledger) => {
    setSelectedLedger(ledger);
    setShowDetailModal(true);
    fetchLedgerBalance(ledger.id);
  };

  const fetchLedgerBalance = async (ledgerId) => {
    try {
      const response = await accountingAPI.ledgers.balance(ledgerId);
      setLedgerBalance(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching ledger balance:', error);
      setLedgerBalance(null);
    }
  };

  const handleViewStatement = async (ledger) => {
    setSelectedLedger(ledger);
    setShowStatementModal(true);
    setStatementLoading(true);
    
    try {
      // Fetch ledger statement with date range if provided
      const params = {};
      if (dateRange.fromDate) params.from_date = dateRange.fromDate;
      if (dateRange.toDate) params.to_date = dateRange.toDate;
      
      const response = await accountingAPI.ledgers.statement(ledger.id, params);
      const statementData = response.data?.transactions || response.data?.statement || response.data?.data || [];
      setStatementData(Array.isArray(statementData) ? statementData : []);
    } catch (error) {
      console.error('Error fetching ledger statement:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load ledger statement'
      });
      setStatementData([]);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: lastDay.toISOString().split('T')[0]
    });
  };

  const handleSetCurrentYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    
    setDateRange({
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: lastDay.toISOString().split('T')[0]
    });
  };

  const handleEditLedger = (ledger) => {
    setSelectedLedger(ledger);
    setShowEditModal(true);
  };

  const handleDeleteLedger = (ledger) => {
    Alert.alert(
      'Delete Ledger',
      `Are you sure you want to delete "${ledger.ledger_name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountingAPI.ledgers.delete(ledger.id);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Ledger deleted successfully'
              });
              fetchLedgers();
            } catch (error) {
              console.error('Delete ledger error:', error);
              showNotification({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete ledger'
              });
            }
          },
        },
      ]
    );
  };

  const handleCreateLedger = () => {
    setShowCreateModal(true);
  };

  const handleLedgerCreated = () => {
    fetchLedgers();
  };

  const handleLedgerUpdated = () => {
    fetchLedgers();
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Ledgers" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateLedger}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* Ledgers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : ledgers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Ledgers Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first ledger to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateLedger}>
              <Text style={styles.emptyButtonText}>Create Ledger</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ledgersList}>
            {ledgers.map((ledger, index) => (
              <TouchableOpacity
                key={ledger.id || index}
                style={styles.ledgerCard}
                onPress={() => handleLedgerPress(ledger)}
              >
                <View style={styles.ledgerCardHeader}>
                  <View style={styles.ledgerMainInfo}>
                    <Text style={styles.ledgerName}>
                      {ledger.ledger_name || 'Unnamed Ledger'}
                    </Text>
                    <Text style={styles.ledgerCode}>
                      Code: {ledger.ledger_code || 'N/A'}
                    </Text>
                    <Text style={styles.ledgerGroup}>
                      {ledger.account_group?.name || ledger.account_group?.group_name || 'No Group'}
                    </Text>
                  </View>
                  <View style={styles.ledgerAmount}>
                    <Text style={styles.ledgerBalance}>
                      {formatCurrency(ledger.current_balance || ledger.opening_balance || 0)}
                    </Text>
                    <View style={[
                      styles.balanceTypeBadge,
                      { backgroundColor: ledger.balance_type === 'debit' ? '#fef2f2' : '#ecfdf5' }
                    ]}>
                      <Text style={[
                        styles.balanceTypeText,
                        { color: ledger.balance_type === 'debit' ? '#dc2626' : '#059669' }
                      ]}>
                        {ledger.balance_type === 'debit' ? 'Dr' : 'Cr'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.ledgerCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLedgerPress(ledger);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleViewStatement(ledger);
                    }}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#2563eb" />
                    <Text style={styles.actionButtonText}>Statement</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditLedger(ledger);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteLedger(ledger);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedLedger?.ledger_name || 'Ledger Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedLedger && (
              <View style={styles.detailContainer}>
                {/* Balance Cards */}
                <View style={styles.balanceCards}>
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceCardLabel}>Current Balance</Text>
                    <Text style={styles.balanceCardValue}>
                      {formatCurrency(ledgerBalance?.current_balance || selectedLedger.opening_balance || 0)}
                    </Text>
                    <View style={[
                      styles.balanceTypeBadge,
                      { backgroundColor: (ledgerBalance?.balance_type || selectedLedger.balance_type) === 'debit' ? '#fef2f2' : '#ecfdf5' }
                    ]}>
                      <Text style={[
                        styles.balanceTypeText,
                        { color: (ledgerBalance?.balance_type || selectedLedger.balance_type) === 'debit' ? '#dc2626' : '#059669' }
                      ]}>
                        {(ledgerBalance?.balance_type || selectedLedger.balance_type) === 'debit' ? 'Debit' : 'Credit'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceCardLabel}>Opening Balance</Text>
                    <Text style={styles.balanceCardValue}>
                      {formatCurrency(ledgerBalance?.opening_balance || selectedLedger.opening_balance || 0)}
                    </Text>
                  </View>
                </View>

                {/* Transaction Summary */}
                {ledgerBalance && (ledgerBalance.total_debit > 0 || ledgerBalance.total_credit > 0) && (
                  <View style={styles.balanceCards}>
                    <View style={styles.balanceCard}>
                      <Text style={styles.balanceCardLabel}>Total Debit</Text>
                      <Text style={[styles.balanceCardValue, { color: '#dc2626' }]}>
                        {formatCurrency(ledgerBalance.total_debit || 0)}
                      </Text>
                    </View>
                    
                    <View style={styles.balanceCard}>
                      <Text style={styles.balanceCardLabel}>Total Credit</Text>
                      <Text style={[styles.balanceCardValue, { color: '#059669' }]}>
                        {formatCurrency(ledgerBalance.total_credit || 0)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Ledger Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Ledger Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Ledger Code</Text>
                      <Text style={styles.infoValue}>{selectedLedger.ledger_code || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Account Group</Text>
                      <Text style={styles.infoValue}>
                        {selectedLedger.account_group?.name || selectedLedger.account_group?.group_name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Currency</Text>
                      <Text style={styles.infoValue}>{selectedLedger.currency || 'INR'}</Text>
                    </View>
                    {selectedLedger.description && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Description</Text>
                        <Text style={styles.infoValue}>{selectedLedger.description}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Contact Information */}
                {(selectedLedger.gstin || selectedLedger.pan || selectedLedger.address || selectedLedger.phone || selectedLedger.email) && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Contact Information</Text>
                    <View style={styles.infoGrid}>
                      {selectedLedger.gstin && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>GSTIN</Text>
                          <Text style={styles.infoValue}>{selectedLedger.gstin}</Text>
                        </View>
                      )}
                      {selectedLedger.pan && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>PAN</Text>
                          <Text style={styles.infoValue}>{selectedLedger.pan}</Text>
                        </View>
                      )}
                      {selectedLedger.address && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Address</Text>
                          <Text style={styles.infoValue}>
                            {selectedLedger.address}
                            {selectedLedger.city && `, ${selectedLedger.city}`}
                            {selectedLedger.state && `, ${selectedLedger.state}`}
                            {selectedLedger.pincode && ` - ${selectedLedger.pincode}`}
                          </Text>
                        </View>
                      )}
                      {selectedLedger.phone && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Phone</Text>
                          <Text style={styles.infoValue}>{selectedLedger.phone}</Text>
                        </View>
                      )}
                      {selectedLedger.email && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoValue}>{selectedLedger.email}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalActionButton}
              onPress={() => {
                setShowDetailModal(false);
                handleViewStatement(selectedLedger);
              }}
            >
              <Ionicons name="document-text-outline" size={16} color="white" />
              <Text style={styles.modalActionText}>View Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
              onPress={() => {
                setShowDetailModal(false);
                handleEditLedger(selectedLedger);
              }}
            >
              <Ionicons name="create-outline" size={16} color="#3e60ab" />
              <Text style={[styles.modalActionText, { color: '#3e60ab' }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Statement Modal */}
      <Modal
        visible={showStatementModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatementModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedLedger?.ledger_name || 'Ledger'} - Statement
            </Text>
            <TouchableOpacity onPress={() => setShowStatementModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {/* Date Range Filter */}
          <View style={styles.dateFilterContainer}>
            {/* Quick Date Range Buttons */}
            <View style={styles.quickDateButtons}>
              <TouchableOpacity 
                style={styles.quickDateButton}
                onPress={handleSetCurrentMonth}
              >
                <Text style={styles.quickDateButtonText}>This Month</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickDateButton}
                onPress={handleSetCurrentYear}
              >
                <Text style={styles.quickDateButtonText}>This Year</Text>
              </TouchableOpacity>
            </View>
            
            {/* Date Pickers Row */}
            <View style={styles.datePickersRow}>
              <View style={styles.dateInputGroup}>
                <DatePicker
                  label="From Date"
                  value={dateRange.fromDate}
                  onDateChange={(value) => setDateRange(prev => ({ ...prev, fromDate: value }))}
                  placeholder="Select from date"
                  style={styles.datePicker}
                />
              </View>
              <View style={styles.dateInputGroup}>
                <DatePicker
                  label="To Date"
                  value={dateRange.toDate}
                  onDateChange={(value) => setDateRange(prev => ({ ...prev, toDate: value }))}
                  placeholder="Select to date"
                  style={styles.datePicker}
                  minimumDate={dateRange.fromDate ? new Date(dateRange.fromDate) : undefined}
                />
              </View>
            </View>
            
            {/* Filter Buttons */}
            <View style={styles.filterButtonContainer}>
              <View style={styles.filterButtons}>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setDateRange({ fromDate: '', toDate: '' })}
                >
                  <Ionicons name="close" size={16} color="#6b7280" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => handleViewStatement(selectedLedger)}
                >
                  <Ionicons name="filter" size={16} color="white" />
                  <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.statementContainer}>
              {statementLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading statement...</Text>
                </View>
              ) : statementData.length === 0 ? (
                <View style={styles.comingSoonContainer}>
                  <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                  <Text style={styles.comingSoonTitle}>No Transactions</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    No transactions found for the selected date range
                  </Text>
                </View>
              ) : (
                <View style={styles.transactionsList}>
                  {statementData.map((transaction, index) => (
                    <View key={index} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </Text>
                        <Text style={styles.transactionVoucher}>
                          {transaction.voucher_number}
                        </Text>
                      </View>
                      <Text style={styles.transactionDescription}>
                        {transaction.description || transaction.narration}
                      </Text>
                      <View style={styles.transactionAmounts}>
                        <Text style={styles.debitAmount}>
                          Dr: {formatCurrency(transaction.debit_amount || 0)}
                        </Text>
                        <Text style={styles.creditAmount}>
                          Cr: {formatCurrency(transaction.credit_amount || 0)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Ledger Modal */}
      <CreateLedgerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleLedgerCreated}
      />

      {/* Edit Ledger Modal */}
      <CreateLedgerModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleLedgerUpdated}
        editData={selectedLedger}
        isEdit={true}
      />
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
    paddingBottom: 100,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    minWidth: 200,
  },
  createButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  ledgersList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ledgerCard: {
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
  ledgerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ledgerMainInfo: {
    flex: 1,
  },
  ledgerName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  ledgerCode: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  ledgerGroup: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  ledgerAmount: {
    alignItems: 'flex-end',
  },
  ledgerBalance: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  balanceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  balanceTypeText: {
    ...FONT_STYLES.captionSmall,
  },
  ledgerCardActions: {
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
  // Modal Styles
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
  statementContainer: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Date Filter Styles
  dateFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  quickDateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quickDateButtonText: {
    ...FONT_STYLES.labelSmall,
    color: '#6b7280',
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
  },
  datePicker: {
    marginBottom: 0,
  },
  filterButtonContainer: {
    alignItems: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
    minWidth: 100,
  },
  clearButtonText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    gap: 8,
    minWidth: 120,
  },
  filterButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
  },
  // Transaction Styles
  transactionsList: {
    padding: 16,
    gap: 12,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDate: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  transactionVoucher: {
    ...FONT_STYLES.labelSmall,
    color: '#3e60ab',
  },
  transactionDescription: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginBottom: 8,
  },
  transactionAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debitAmount: {
    ...FONT_STYLES.labelSmall,
    color: '#dc2626',
  },
  creditAmount: {
    ...FONT_STYLES.labelSmall,
    color: '#059669',
  },
});
