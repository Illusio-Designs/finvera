import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function JournalScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await voucherAPI.list({ 
        voucher_type: 'journal',
        search: searchQuery,
        status: filter === 'all' ? undefined : filter,
        limit: 50 
      });
      const data = response.data?.data || response.data || [];
      setJournals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Journals fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load journal entries'
      });
      setJournals([]);
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
    fetchJournals();
  }, [fetchJournals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJournals();
    setRefreshing(false);
  }, [fetchJournals]);

  const handleJournalPress = (journal) => {
    setSelectedJournal(journal);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
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

  const getJournalStatusColor = (status) => {
    const colors = {
      'posted': '#10b981',
      'draft': '#6b7280',
      'cancelled': '#ef4444',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getJournalStatusIcon = (status) => {
    const icons = {
      'posted': 'checkmark-circle',
      'draft': 'document-text',
      'cancelled': 'close-circle',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  const filterOptions = [
    { key: 'all', label: 'All Journals', icon: 'list-outline' },
    { key: 'posted', label: 'Posted', icon: 'checkmark-circle-outline' },
    { key: 'draft', label: 'Draft', icon: 'document-text-outline' },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Journal Entries" 
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
          <Text style={styles.sectionTitle}>Journal Entries</Text>
          <Text style={styles.sectionSubtitle}>
            Manage and track all journal transactions
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search journals by reference or narration..."
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
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="journal" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{journals.length}</Text>
              <Text style={styles.statLabel}>Total Journals</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {journals.filter(j => j.status === 'posted').length}
              </Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name="document-text" size={24} color="#6b7280" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {journals.filter(j => j.status === 'draft').length}
              </Text>
              <Text style={styles.statLabel}>Draft</Text>
            </View>
          </View>
        </View>

        {/* Journals List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : journals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="journal-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Journal Entries Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No journal entries found matching "${searchQuery}"`
                  : 'No journal entries have been created yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.journalsList}>
            {journals.map((journal, index) => (
              <TouchableOpacity
                key={journal.id || index}
                style={styles.journalCard}
                onPress={() => handleJournalPress(journal)}
                activeOpacity={0.95}
              >
                <View style={styles.journalCardGradient}>
                  <View style={styles.journalCardContent}>
                    <View style={styles.journalCardHeader}>
                      <View style={[
                        styles.journalIcon,
                        { backgroundColor: getJournalStatusColor(journal.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getJournalStatusIcon(journal.status)} 
                          size={24} 
                          color={getJournalStatusColor(journal.status)} 
                        />
                      </View>
                      <View style={styles.journalInfo}>
                        <Text style={styles.journalTitle}>
                          {journal.reference || 'Journal Entry'}
                        </Text>
                        <Text style={styles.journalDate}>
                          {formatDate(journal.voucher_date)}
                        </Text>
                      </View>
                      <View style={styles.journalStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getJournalStatusColor(journal.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {journal.status?.toUpperCase() || 'DRAFT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.journalCardBody}>
                      <View style={styles.journalDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.journalDetailText}>
                          Voucher No: {journal.voucher_number || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.journalDetail}>
                        <Ionicons name="swap-horizontal-outline" size={16} color="#64748b" />
                        <Text style={styles.journalDetailText}>
                          Type: {journal.journal_type || 'General'}
                        </Text>
                      </View>
                      {journal.narration && (
                        <View style={styles.journalDetail}>
                          <Ionicons name="chatbox-outline" size={16} color="#64748b" />
                          <Text style={styles.journalDetailText} numberOfLines={1}>
                            {journal.narration}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.journalCardFooter}>
                      <View style={styles.journalAmount}>
                        <Text style={styles.journalAmountValue}>
                          {formatCurrency(journal.total_amount)}
                        </Text>
                        <Text style={styles.journalAmountLabel}>Total Amount</Text>
                      </View>
                      <TouchableOpacity style={styles.journalAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getJournalStatusColor(journal.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getJournalStatusColor(journal.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Journal Detail Modal */}
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
                { backgroundColor: selectedJournal ? getJournalStatusColor(selectedJournal.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedJournal ? getJournalStatusIcon(selectedJournal.status) : 'journal'} 
                  size={20} 
                  color={selectedJournal ? getJournalStatusColor(selectedJournal.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Journal Entry Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedJournal?.reference || 'Journal Entry'}
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
          
          {selectedJournal && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Entry Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Voucher Number:</Text>
                  <Text style={styles.detailValue}>{selectedJournal.voucher_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedJournal.voucher_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>{selectedJournal.reference || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getJournalStatusColor(selectedJournal.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedJournal.status?.toUpperCase() || 'DRAFT'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Journal Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Journal Type:</Text>
                  <Text style={styles.detailValue}>{selectedJournal.journal_type || 'General'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedJournal.total_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Debit Total:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedJournal.debit_total)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credit Total:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedJournal.credit_total)}</Text>
                </View>
              </View>

              {selectedJournal.narration && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Narration</Text>
                  <Text style={styles.narrationText}>{selectedJournal.narration}</Text>
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
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#0f172a'
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b'
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
    borderTopColor: '#8b5cf6',
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
  journalsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  journalCard: {
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
  journalCardGradient: {
    position: 'relative',
    padding: 20,
  },
  journalCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  journalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  journalIcon: {
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
  journalInfo: {
    flex: 1,
    paddingRight: 12,
  },
  journalTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22
  },
  journalDate: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 18
  },
  journalStatus: {
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
    color: 'white'
  },
  journalCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  journalDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  journalDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
    lineHeight: 18
  },
  journalCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  journalAmount: {
    flex: 1,
  },
  journalAmountValue: {
    ...FONT_STYLES.h5,
    color: '#8b5cf6'
  },
  journalAmountLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2
  },
  journalAction: {
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
  narrationText: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    lineHeight: 20
  },
});