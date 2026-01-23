import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountingAPI } from '../../../lib/api';

export default function LedgersScreen({ navigation }) {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const ledgerTypes = [
    { key: 'all', label: 'All', icon: 'list-outline' },
    { key: 'customer', label: 'Customers', icon: 'people-outline' },
    { key: 'supplier', label: 'Suppliers', icon: 'business-outline' },
    { key: 'bank', label: 'Banks', icon: 'card-outline' },
    { key: 'expense', label: 'Expenses', icon: 'trending-down-outline' },
  ];

  useEffect(() => {
    loadLedgers();
  }, [filter, searchQuery]);

  const loadLedgers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') {
        params.type = filter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await accountingAPI.ledgers.list(params);
      const ledgers = response.data?.data || response.data || [];
      setLedgers(ledgers);
    } catch (error) {
      console.error('Error loading ledgers:', error);
      Alert.alert('Error', 'Failed to load ledgers. Please check your connection.');
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLedgers();
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

  const LedgerCard = ({ ledger }) => (
    <TouchableOpacity 
      style={styles.ledgerCard}
      onPress={() => navigation.navigate('LedgerDetails', { ledgerId: ledger.id })}
    >
      <View style={styles.ledgerHeader}>
        <View style={styles.ledgerLeft}>
          <View style={[styles.ledgerIcon, { backgroundColor: getLedgerColor(ledger.type) + '20' }]}>
            <Ionicons 
              name={getLedgerIcon(ledger.type)} 
              size={20} 
              color={getLedgerColor(ledger.type)} 
            />
          </View>
          <View style={styles.ledgerInfo}>
            <Text style={styles.ledgerName}>{ledger.name}</Text>
            <Text style={styles.ledgerType}>{ledger.type.toUpperCase()}</Text>
            {ledger.phone && (
              <Text style={styles.ledgerContact}>{ledger.phone}</Text>
            )}
          </View>
        </View>
        <View style={styles.ledgerRight}>
          <Text style={[
            styles.ledgerBalance,
            { color: ledger.balanceType === 'dr' ? '#ef4444' : '#10b981' }
          ]}>
            {formatCurrency(ledger.balance)} {ledger.balanceType.toUpperCase()}
          </Text>
          <Text style={styles.lastTransaction}>
            Last: {formatDate(ledger.lastTransaction)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ledgers</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateLedger')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ledgers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {ledgerTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.filterTab,
              filter === type.key && styles.filterTabActive
            ]}
            onPress={() => setFilter(type.key)}
          >
            <Ionicons 
              name={type.icon} 
              size={16} 
              color={filter === type.key ? '#3e60ab' : '#6b7280'} 
            />
            <Text style={[
              styles.filterTabText,
              filter === type.key && styles.filterTabTextActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ledger List */}
      <ScrollView
        style={styles.ledgerList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading ledgers...</Text>
          </View>
        ) : ledgers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Ledgers Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No ledgers found for "${searchQuery}"`
                : filter === 'all' 
                  ? 'Create your first ledger to get started'
                  : `No ${filter} ledgers found`
              }
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateLedger')}
            >
              <Text style={styles.createButtonText}>Create Ledger</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ledgerContainer}>
            {ledgers.map((ledger) => (
              <LedgerCard key={ledger.id} ledger={ledger} />
            ))}
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    fontFamily: 'Agency',
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#e1e9f9',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    fontFamily: 'Agency',
  },
  filterTabTextActive: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  ledgerList: {
    flex: 1,
  },
  ledgerContainer: {
    padding: 16,
  },
  ledgerCard: {
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
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ledgerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ledgerInfo: {
    flex: 1,
  },
  ledgerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  ledgerType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Agency',
  },
  ledgerContact: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Agency',
  },
  ledgerRight: {
    alignItems: 'flex-end',
  },
  ledgerBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Agency',
  },
  lastTransaction: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Agency',
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
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Agency',
  },
  createButton: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Agency',
  },
});