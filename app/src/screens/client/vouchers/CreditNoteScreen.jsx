import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';

export default function CreditNoteScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchCreditNotes = useCallback(async () => {
    try {
      const response = await voucherAPI.list({ 
        voucher_type: 'credit_note',
        search: searchQuery,
        status: filter === 'all' ? undefined : filter,
        limit: 50 
      });
      const data = response.data?.data || response.data || [];
      setCreditNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Credit notes fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load credit notes'
      });
      setCreditNotes([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter, showNotification]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCreditNotes();
    setRefreshing(false);
  }, [fetchCreditNotes]);

  const handleCreditNotePress = (creditNote) => {
    setSelectedCreditNote(creditNote);
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

  const getCreditNoteStatusColor = (status) => {
    const colors = {
      'sent': '#10b981',
      'draft': '#6b7280',
      'cancelled': '#ef4444',
      'pending': '#f59e0b',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getCreditNoteStatusIcon = (status) => {
    const icons = {
      'sent': 'checkmark-circle',
      'draft': 'document-text',
      'cancelled': 'close-circle',
      'pending': 'time',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  const filterOptions = [
    { key: 'all', label: 'All Notes', icon: 'list-outline' },
    { key: 'sent', label: 'Sent', icon: 'checkmark-circle-outline' },
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'draft', label: 'Draft', icon: 'document-text-outline' },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Credit Notes" 
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
          <Text style={styles.sectionTitle}>Credit Notes</Text>
          <Text style={styles.sectionSubtitle}>
            Manage and track all credit note transactions
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search credit notes by party or reference..."
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
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="add-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{creditNotes.length}</Text>
              <Text style={styles.statLabel}>Total Notes</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {creditNotes.filter(c => c.status === 'sent').length}
              </Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {creditNotes.filter(c => c.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Credit Notes List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading credit notes...</Text>
            </View>
          </View>
        ) : creditNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="add-circle-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Credit Notes Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No credit notes found matching "${searchQuery}"`
                  : 'No credit notes have been created yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.creditNotesList}>
            {creditNotes.map((creditNote, index) => (
              <TouchableOpacity
                key={creditNote.id || index}
                style={styles.creditNoteCard}
                onPress={() => handleCreditNotePress(creditNote)}
                activeOpacity={0.95}
              >
                <View style={styles.creditNoteCardGradient}>
                  <View style={styles.creditNoteCardContent}>
                    <View style={styles.creditNoteCardHeader}>
                      <View style={[
                        styles.creditNoteIcon,
                        { backgroundColor: getCreditNoteStatusColor(creditNote.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getCreditNoteStatusIcon(creditNote.status)} 
                          size={24} 
                          color={getCreditNoteStatusColor(creditNote.status)} 
                        />
                      </View>
                      <View style={styles.creditNoteInfo}>
                        <Text style={styles.creditNoteTitle}>
                          {creditNote.party_name || 'Credit Note'}
                        </Text>
                        <Text style={styles.creditNoteDate}>
                          {formatDate(creditNote.voucher_date)}
                        </Text>
                      </View>
                      <View style={styles.creditNoteStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getCreditNoteStatusColor(creditNote.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {creditNote.status?.toUpperCase() || 'DRAFT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.creditNoteCardBody}>
                      <View style={styles.creditNoteDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.creditNoteDetailText}>
                          Note No: {creditNote.note_number || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.creditNoteDetail}>
                        <Ionicons name="person-outline" size={16} color="#64748b" />
                        <Text style={styles.creditNoteDetailText}>
                          Party: {creditNote.party_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.creditNoteDetail}>
                        <Ionicons name="document-outline" size={16} color="#64748b" />
                        <Text style={styles.creditNoteDetailText}>
                          Ref Invoice: {creditNote.reference_invoice || 'N/A'}
                        </Text>
                      </View>
                      {creditNote.reason && (
                        <View style={styles.creditNoteDetail}>
                          <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                          <Text style={styles.creditNoteDetailText} numberOfLines={1}>
                            Reason: {creditNote.reason}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.creditNoteCardFooter}>
                      <View style={styles.creditNoteAmount}>
                        <Text style={styles.creditNoteAmountValue}>
                          {formatCurrency(creditNote.total_amount)}
                        </Text>
                        <Text style={styles.creditNoteAmountLabel}>Credit Amount</Text>
                      </View>
                      <TouchableOpacity style={styles.creditNoteAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getCreditNoteStatusColor(creditNote.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getCreditNoteStatusColor(creditNote.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Credit Note Detail Modal */}
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
                { backgroundColor: selectedCreditNote ? getCreditNoteStatusColor(selectedCreditNote.status) + '20' : '#d1fae5' }
              ]}>
                <Ionicons 
                  name={selectedCreditNote ? getCreditNoteStatusIcon(selectedCreditNote.status) : 'add-circle'} 
                  size={20} 
                  color={selectedCreditNote ? getCreditNoteStatusColor(selectedCreditNote.status) : '#10b981'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Credit Note Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCreditNote?.party_name || 'Credit Note'}
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
          
          {selectedCreditNote && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Note Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Note Number:</Text>
                  <Text style={styles.detailValue}>{selectedCreditNote.note_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedCreditNote.voucher_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Party Name:</Text>
                  <Text style={styles.detailValue}>{selectedCreditNote.party_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getCreditNoteStatusColor(selectedCreditNote.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedCreditNote.status?.toUpperCase() || 'DRAFT'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Credit Note Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference Invoice:</Text>
                  <Text style={styles.detailValue}>{selectedCreditNote.reference_invoice || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedCreditNote.total_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tax Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedCreditNote.tax_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Net Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedCreditNote.net_amount)}</Text>
                </View>
              </View>

              {selectedCreditNote.reason && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Reason for Credit Note</Text>
                  <Text style={styles.reasonText}>{selectedCreditNote.reason}</Text>
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
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Agency',
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
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
    borderTopColor: '#10b981',
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
  creditNotesList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  creditNoteCard: {
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
  creditNoteCardGradient: {
    position: 'relative',
    padding: 20,
  },
  creditNoteCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  creditNoteCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  creditNoteIcon: {
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
  creditNoteInfo: {
    flex: 1,
    paddingRight: 12,
  },
  creditNoteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  creditNoteDate: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 18,
  },
  creditNoteStatus: {
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
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  creditNoteCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  creditNoteDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  creditNoteDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 18,
  },
  creditNoteCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  creditNoteAmount: {
    flex: 1,
  },
  creditNoteAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Agency',
  },
  creditNoteAmountLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  creditNoteAction: {
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
  reasonText: {
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
});