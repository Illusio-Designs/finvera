import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { useNavigation } from '@react-navigation/native';

export default function DebitNoteScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDebitNote, setSelectedDebitNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchDebitNotes = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await voucherAPI.list({
        voucher_type: 'debit_note',
        search: searchQuery,
        status: filter === 'all' ? undefined : filter,
        limit: 50
      });
      const data = response.data?.data || response.data || [];
      setDebitNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Debit notes fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load debit notes'
      });
      setDebitNotes([]);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [searchQuery, filter, showNotification]);

  useEffect(() => {
    fetchDebitNotes();
  }, [fetchDebitNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDebitNotes();
    setRefreshing(false);
  }, [fetchDebitNotes]);

  const handleDebitNotePress = (debitNote) => {
    setSelectedDebitNote(debitNote);
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

  const getDebitNoteStatusColor = (status) => {
    const colors = {
      'sent': '#10b981',
      'draft': '#6b7280',
      'cancelled': '#ef4444',
      'pending': '#f59e0b',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getDebitNoteStatusIcon = (status) => {
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
        title="Debit Notes" 
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
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.sectionTitle}>Debit Notes</Text>
              <Text style={styles.sectionSubtitle}>
                Manage and track all debit note transactions
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('DebitNoteForm')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search debit notes by party or reference..."
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
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="remove-circle" size={24} color="#ef4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{debitNotes.length}</Text>
              <Text style={styles.statLabel}>Total Notes</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {debitNotes.filter(d => d.status === 'sent').length}
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
                {debitNotes.filter(d => d.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Debit Notes List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : debitNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="remove-circle-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Debit Notes Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No debit notes found matching "${searchQuery}"`
                  : 'No debit notes have been created yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.debitNotesList}>
            {debitNotes.map((debitNote, index) => (
              <TouchableOpacity
                key={debitNote.id || index}
                style={styles.debitNoteCard}
                onPress={() => handleDebitNotePress(debitNote)}
                activeOpacity={0.95}
              >
                <View style={styles.debitNoteCardGradient}>
                  <View style={styles.debitNoteCardContent}>
                    <View style={styles.debitNoteCardHeader}>
                      <View style={[
                        styles.debitNoteIcon,
                        { backgroundColor: getDebitNoteStatusColor(debitNote.status) + '20' }
                      ]}>
                        <Ionicons
                          name={getDebitNoteStatusIcon(debitNote.status)} 
                          size={24} 
                          color={getDebitNoteStatusColor(debitNote.status)} 
                        />
                      </View>
                      <View style={styles.debitNoteInfo}>
                        <Text style={styles.debitNoteTitle}>
                          {debitNote.party_name || 'Debit Note'}
                        </Text>
                        <Text style={styles.debitNoteDate}>
                          {formatDate(debitNote.voucher_date)}
                        </Text>
                      </View>
                      <View style={styles.debitNoteStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getDebitNoteStatusColor(debitNote.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {debitNote.status?.toUpperCase() || 'DRAFT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.debitNoteCardBody}>
                      <View style={styles.debitNoteDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.debitNoteDetailText}>
                          Note No: {debitNote.note_number || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.debitNoteDetail}>
                        <Ionicons name="person-outline" size={16} color="#64748b" />
                        <Text style={styles.debitNoteDetailText}>
                          Party: {debitNote.party_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.debitNoteDetail}>
                        <Ionicons name="document-outline" size={16} color="#64748b" />
                        <Text style={styles.debitNoteDetailText}>
                          Ref Invoice: {debitNote.reference_invoice || 'N/A'}
                        </Text>
                      </View>
                      {debitNote.reason && (
                        <View style={styles.debitNoteDetail}>
                          <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                          <Text style={styles.debitNoteDetailText} numberOfLines={1}>
                            Reason: {debitNote.reason}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.debitNoteCardFooter}>
                      <View style={styles.debitNoteAmount}>
                        <Text style={styles.debitNoteAmountValue}>
                          {formatCurrency(debitNote.total_amount)}
                        </Text>
                        <Text style={styles.debitNoteAmountLabel}>Debit Amount</Text>
                      </View>
                      <TouchableOpacity style={styles.debitNoteAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle,
                    styles.decorativeCircle, 
                    { backgroundColor: getDebitNoteStatusColor(debitNote.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine,
                    styles.decorativeLine, 
                    { backgroundColor: getDebitNoteStatusColor(debitNote.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Debit Note Detail Modal */}
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
                { backgroundColor: selectedDebitNote ? getDebitNoteStatusColor(selectedDebitNote.status) + '20' : '#fee2e2' }
              ]}>
                <Ionicons
                  name={selectedDebitNote ? getDebitNoteStatusIcon(selectedDebitNote.status) : 'remove-circle'}
                  size={20}
                  color={selectedDebitNote ? getDebitNoteStatusColor(selectedDebitNote.status) : '#ef4444'}
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Debit Note Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDebitNote?.party_name || 'Debit Note'}
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
          
          {selectedDebitNote && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Note Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Note Number:</Text>
                  <Text style={styles.detailValue}>{selectedDebitNote.note_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedDebitNote.voucher_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Party Name:</Text>
                  <Text style={styles.detailValue}>{selectedDebitNote.party_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getDebitNoteStatusColor(selectedDebitNote.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedDebitNote.status?.toUpperCase() || 'DRAFT'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Debit Note Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference Invoice:</Text>
                  <Text style={styles.detailValue}>{selectedDebitNote.reference_invoice || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedDebitNote.total_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tax Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedDebitNote.tax_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Net Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedDebitNote.net_amount)}</Text>
                </View>
              </View>

              {selectedDebitNote.reason && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Reason for Debit Note</Text>
                  <Text style={styles.reasonText}>{selectedDebitNote.reason}</Text>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    ...FONT_STYLES.h1,
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
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
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b',
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
    borderTopColor: '#ef4444',
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
    ...FONT_STYLES.h2,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  debitNotesList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  debitNoteCard: {
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
  debitNoteCardGradient: {
    position: 'relative',
    padding: 20,
  },
  debitNoteCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  debitNoteCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  debitNoteIcon: {
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
  debitNoteInfo: {
    flex: 1,
    paddingRight: 12,
  },
  debitNoteTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  debitNoteDate: {
    ...FONT_STYLES.body,
    color: '#64748b',
    lineHeight: 18,
  },
  debitNoteStatus: {
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
    fontWeight: '600',
    color: 'white',
  },
  debitNoteCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  debitNoteDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  debitNoteDetailText: {
    ...FONT_STYLES.body,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
  },
  debitNoteCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  debitNoteAmount: {
    flex: 1,
  },
  debitNoteAmountValue: {
    ...FONT_STYLES.h4,
    color: '#ef4444',
  },
  debitNoteAmountLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2,
  },
  debitNoteAction: {
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
    ...FONT_STYLES.body,
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
    ...FONT_STYLES.body,
    color: '#64748b',
    fontWeight: '500',
    width: 120,
  },
  detailValue: {
    ...FONT_STYLES.body,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  reasonText: {
    ...FONT_STYLES.body,
    color: '#0f172a',
    lineHeight: 20,
  },
});