import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../components/navigation/TopBar';
import { useDrawer } from '../../contexts/DrawerContext.jsx';
import { accountingAPI } from '../../lib/api';
import { formatCurrency } from '../../utils/businessLogic';

export default function LedgersScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const fetchLedgers = useCallback(async () => {
    try {
      const response = await accountingAPI.ledgers.list({ 
        limit: 50,
        type: filter !== 'all' ? filter : undefined 
      });
      const data = response.data?.data || response.data || [];
      setLedgers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ledgers fetch error:', error);
      Alert.alert('Error', 'Failed to load ledgers');
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLedgers();
    setRefreshing(false);
  }, [fetchLedgers]);

  const handleLedgerPress = (ledger) => {
    Alert.alert('Ledger Details', `View details for ${ledger.name}`);
  };

  const handleCreateLedger = () => {
    Alert.alert('Create Ledger', 'Create new ledger functionality will be available soon');
  };

  const filterOptions = [
    { key: 'all', label: 'All Ledgers', icon: 'list-outline' },
    { key: 'assets', label: 'Assets', icon: 'trending-up-outline' },
    { key: 'liabilities', label: 'Liabilities', icon: 'trending-down-outline' },
    { key: 'income', label: 'Income', icon: 'add-circle-outline' },
    { key: 'expenses', label: 'Expenses', icon: 'remove-circle-outline' },
  ];

  const getLedgerTypeColor = (type) => {
    const colors = {
      'assets': '#10b981',
      'liabilities': '#ef4444',
      'income': '#3b82f6',
      'expenses': '#f59e0b',
      'equity': '#8b5cf6',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const getLedgerIcon = (type) => {
    const icons = {
      'assets': 'trending-up',
      'liabilities': 'trending-down',
      'income': 'add-circle',
      'expenses': 'remove-circle',
      'equity': 'pie-chart',
    };
    return icons[type?.toLowerCase()] || 'folder';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Ledgers" 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
                color={filter === option.key ? 'white' : '#6b7280'} 
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

        {/* Create Ledger Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateLedger}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create New Ledger</Text>
        </TouchableOpacity>

        {/* Ledgers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading ledgers...</Text>
          </View>
        ) : ledgers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Ledgers Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Create your first ledger to get started' 
                : `No ${filter} ledgers found`}
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
                  <View style={[
                    styles.ledgerIcon, 
                    { backgroundColor: getLedgerTypeColor(ledger.type) }
                  ]}>
                    <Ionicons 
                      name={getLedgerIcon(ledger.type)} 
                      size={20} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.ledgerInfo}>
                    <Text style={styles.ledgerName}>{ledger.name || 'Unnamed Ledger'}</Text>
                    <Text style={styles.ledgerType}>
                      {ledger.type || 'General'} • {ledger.group || 'Default Group'}
                    </Text>
                  </View>
                  <View style={styles.ledgerAmount}>
                    <Text style={[
                      styles.ledgerBalance,
                      { color: getLedgerTypeColor(ledger.type) }
                    ]}>
                      {formatCurrency(ledger.balance || 0)}
                    </Text>
                    <Text style={styles.ledgerBalanceLabel}>Balance</Text>
                  </View>
                </View>
                
                <View style={styles.ledgerCardFooter}>
                  <View style={styles.ledgerStat}>
                    <Text style={styles.ledgerStatValue}>
                      {ledger.transaction_count || 0}
                    </Text>
                    <Text style={styles.ledgerStatLabel}>Transactions</Text>
                  </View>
                  <View style={styles.ledgerStat}>
                    <Text style={styles.ledgerStatValue}>
                      {formatCurrency(ledger.debit_total || 0)}
                    </Text>
                    <Text style={styles.ledgerStatLabel}>Debit</Text>
                  </View>
                  <View style={styles.ledgerStat}>
                    <Text style={styles.ledgerStatValue}>
                      {formatCurrency(ledger.credit_total || 0)}
                    </Text>
                    <Text style={styles.ledgerStatLabel}>Credit</Text>
                  </View>
                  <TouchableOpacity style={styles.ledgerAction}>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginLeft: 4,
  },
  filterTabTextActive: {
    color: 'white',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    marginLeft: 8,
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
    alignItems: 'center',
    marginBottom: 12,
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
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  ledgerType: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  ledgerAmount: {
    alignItems: 'flex-end',
  },
  ledgerBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  ledgerBalanceLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  ledgerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  ledgerStat: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  ledgerStatLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  ledgerAction: {
    padding: 4,
  },
});