import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountingAPI } from '../../../lib/api';

export default function LedgerDetailsScreen({ navigation, route }) {
  const { ledgerId } = route.params;
  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const filterTypes = [
    { key: 'all', label: 'All' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
  ];

  useEffect(() => {
    loadLedgerDetails();
  }, [ledgerId, filter]);

  const loadLedgerDetails = async () => {
    setLoading(true);
    try {
      // Load ledger details
      const ledgerResponse = await accountingAPI.ledgers.get(ledgerId);
      const ledgerData = ledgerResponse.data?.data || ledgerResponse.data;
      setLedger(ledgerData);
      
      // Load transactions
      const params = {};
      if (filter === 'debit') {
        params.type = 'debit';
      } else if (filter === 'credit') {
        params.type = 'credit';
      }
      
      const transactionsResponse = await accountingAPI.ledgers.transactions(ledgerId, params);
      const transactionsData = transactionsResponse.data?.data || transactionsResponse.data || [];
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading ledger details:', error);
      Alert.alert('Error', 'Failed to load ledger details. Please check your connection.');
      setLedger(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLedgerDetails();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getLedgerIcon = (type) => {
    switch (type) {
      case 'customer': return 'people';
      case 'supplier': return 'business';
      case 'bank': return 'card';
      case 'expense': return 'trending-down';
      default: return 'document';
    }
  };

  const getLedgerColor = (type) => {
    switch (type) {
      case 'customer': return '#10b981';
      case 'supplier': return '#f59e0b';
      case 'bank': return '#3b82f6';
      case 'expense': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const TransactionCard = ({ transaction }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => navigation.navigate('VoucherDetails', { voucherId: transaction.id })}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
          <Text style={styles.voucherNumber}>{transaction.voucherNumber}</Text>
          <Text style={styles.voucherType}>{transaction.voucherType}</Text>
        </View>
        <View style={styles.transactionRight}>
          <View style={styles.amountContainer}>
            {transaction.debit > 0 && (
              <Text style={styles.debitAmount}>Dr {formatCurrency(transaction.debit)}</Text>
            )}
            {transaction.credit > 0 && (
              <Text style={styles.creditAmount}>Cr {formatCurrency(transaction.credit)}</Text>
            )}
          </View>
          <Text style={[
            styles.balanceAmount,
            { color: transaction.balanceType === 'dr' ? '#ef4444' : '#10b981' }
          ]}>
            Bal: {formatCurrency(transaction.balance)} {transaction.balanceType.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.transactionDescription}>{transaction.description}</Text>
    </TouchableOpacity>
  );

  if (!ledger) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ledger details...</Text>
      </View>
    );
  }

  const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ledger Details</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditLedger', { ledgerId })}
        >
          <Ionicons name="pencil" size={20} color="#3e60ab" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Ledger Info */}
        <View style={styles.ledgerInfo}>
          <View style={styles.ledgerHeader}>
            <View style={[styles.ledgerIcon, { backgroundColor: getLedgerColor(ledger.type) + '20' }]}>
              <Ionicons 
                name={getLedgerIcon(ledger.type)} 
                size={32} 
                color={getLedgerColor(ledger.type)} 
              />
            </View>
            <View style={styles.ledgerDetails}>
              <Text style={styles.ledgerName}>{ledger.name}</Text>
              <Text style={styles.ledgerType}>{ledger.type.toUpperCase()}</Text>
              <Text style={styles.ledgerContact}>{ledger.phone}</Text>
              <Text style={styles.ledgerEmail}>{ledger.email}</Text>
            </View>
          </View>
          
          {ledger.address && (
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.addressText}>{ledger.address}</Text>
            </View>
          )}
          
          {ledger.gstin && (
            <View style={styles.gstinContainer}>
              <Text style={styles.gstinLabel}>GSTIN:</Text>
              <Text style={styles.gstinText}>{ledger.gstin}</Text>
            </View>
          )}
        </View>

        {/* Balance Summary */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={[
              styles.balanceAmount,
              { color: ledger.balanceType === 'dr' ? '#ef4444' : '#10b981' }
            ]}>
              {formatCurrency(ledger.balance)} {ledger.balanceType.toUpperCase()}
            </Text>
          </View>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Debit</Text>
              <Text style={styles.statValue}>{formatCurrency(totalDebit)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Credit</Text>
              <Text style={styles.statValue}>{formatCurrency(totalCredit)}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.filterTabs}>
            {filterTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.filterTab,
                  filter === type.key && styles.filterTabActive
                ]}
                onPress={() => setFilter(type.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  filter === type.key && styles.filterTabTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transaction List */}
        <View style={styles.transactionContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySubtitle}>
                No transactions found for the selected filter
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateVoucher', { ledgerId })}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.actionButtonText}>New Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('LedgerStatement', { ledgerId })}
        >
          <Ionicons name="document-text" size={20} color="#3e60ab" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Statement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  editButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
  },
  ledgerInfo: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ledgerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ledgerDetails: {
    flex: 1,
  },
  ledgerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  ledgerType: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  ledgerContact: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  ledgerEmail: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Agency',
  },
  gstinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gstinLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  gstinText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Agency',
  },
  balanceContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Agency',
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  filterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  transactionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  voucherNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  voucherType: {
    fontSize: 12,
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  debitAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    fontFamily: 'Agency',
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'Agency',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Agency',
  },
  secondaryButtonText: {
    color: '#3e60ab',
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
});