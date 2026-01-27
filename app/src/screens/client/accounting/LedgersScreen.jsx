import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';

export default function LedgersScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [ledgerBalance, setLedgerBalance] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchLedgers = useCallback(async () => {
    try {
      const response = await accountingAPI.ledgers.list({ 
        limit: 100,
        search: searchQuery || undefined
      });
      const data = response.data?.data || response.data || [];
      setLedgers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ledgers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load ledgers'
      });
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showNotification]);

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
      const response = await accountingAPI.ledgers.get(ledgerId);
      setLedgerBalance(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching ledger balance:', error);
      setLedgerBalance(null);
    }
  };

  const handleViewStatement = (ledger) => {
    setSelectedLedger(ledger);
    setShowStatementModal(true);
  };

  const handleEditLedger = () => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Edit ledger functionality will be available soon'
    });
  };

  const handleDeleteLedger = () => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Delete ledger functionality will be available soon'
    });
  };

  const handleCreateLedger = () => {
    showNotification({
      type: 'success',
      title: 'Create Ledger',
      message: 'Ledger creation form will open'
    });
    // In a real implementation, this would open a create ledger form/modal
  };

  const handleCreateSupplier = () => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Create supplier functionality will be available soon'
    });
  };

  const filteredLedgers = ledgers.filter(ledger => 
    !searchQuery || 
    (ledger.ledger_name && ledger.ledger_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (ledger.ledger_code && ledger.ledger_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <TouchableOpacity style={styles.createSupplierButton} onPress={handleCreateSupplier}>
            <Ionicons name="person-add-outline" size={16} color="#6b7280" />
            <Text style={styles.createSupplierText}>Create Supplier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateLedger}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ledgers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Ledgers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading ledgers...</Text>
          </View>
        ) : filteredLedgers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Ledgers' : 'No Ledgers Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No ledgers match "${searchQuery}"` 
                : 'Create your first ledger to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateLedger}>
                <Text style={styles.emptyButtonText}>Create Ledger</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.ledgersList}>
            {filteredLedgers.map((ledger, index) => (
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
                      {formatCurrency(ledger.opening_balance || 0)}
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
                      handleEditLedger();
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteLedger();
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
                      { backgroundColor: selectedLedger.balance_type === 'debit' ? '#fef2f2' : '#ecfdf5' }
                    ]}>
                      <Text style={[
                        styles.balanceTypeText,
                        { color: selectedLedger.balance_type === 'debit' ? '#dc2626' : '#059669' }
                      ]}>
                        {selectedLedger.balance_type === 'debit' ? 'Debit' : 'Credit'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceCardLabel}>Opening Balance</Text>
                    <Text style={styles.balanceCardValue}>
                      {formatCurrency(selectedLedger.opening_balance || 0)}
                    </Text>
                  </View>
                </View>

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
                handleEditLedger();
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
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.statementContainer}>
              <View style={styles.comingSoonContainer}>
                <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                <Text style={styles.comingSoonTitle}>Statement View</Text>
                <Text style={styles.comingSoonSubtitle}>
                  Detailed ledger statement with transactions will be available soon
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  createSupplierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    flex: 1,
  },
  createSupplierText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginLeft: 8,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    flex: 1,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    marginLeft: 8,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  ledgerCode: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  ledgerGroup: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  ledgerAmount: {
    alignItems: 'flex-end',
  },
  ledgerBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  balanceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  balanceTypeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Agency',
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
    fontSize: 10,
    fontFamily: 'Agency',
    marginLeft: 4,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  balanceCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
});