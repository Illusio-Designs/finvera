import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voucherAPI } from '../../../lib/api';

export default function VouchersScreen({ navigation }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const voucherTypes = [
    { key: 'all', label: 'All', icon: 'list-outline' },
    { key: 'sales', label: 'Sales', icon: 'trending-up-outline' },
    { key: 'purchase', label: 'Purchase', icon: 'trending-down-outline' },
    { key: 'payment', label: 'Payment', icon: 'card-outline' },
    { key: 'receipt', label: 'Receipt', icon: 'cash-outline' },
  ];

  useEffect(() => {
    loadVouchers();
  }, [filter]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') {
        params.type = filter;
      }
      
      const response = await voucherAPI.list(params);
      const vouchers = response.data?.data || response.data || [];
      setVouchers(vouchers);
    } catch (error) {
      console.error('Error loading vouchers:', error);
      Alert.alert('Error', 'Failed to load vouchers. Please check your connection.');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVouchers();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getVoucherIcon = (type) => {
    switch (type) {
      case 'sales': return 'trending-up';
      case 'purchase': return 'trending-down';
      case 'payment': return 'card';
      case 'receipt': return 'cash';
      default: return 'document';
    }
  };

  const VoucherCard = ({ voucher }) => (
    <TouchableOpacity 
      style={styles.voucherCard}
      onPress={() => navigation.navigate('VoucherDetails', { voucherId: voucher.id })}
    >
      <View style={styles.voucherHeader}>
        <View style={styles.voucherLeft}>
          <View style={[styles.voucherIcon, { backgroundColor: getStatusColor(voucher.status) + '20' }]}>
            <Ionicons 
              name={getVoucherIcon(voucher.type)} 
              size={20} 
              color={getStatusColor(voucher.status)} 
            />
          </View>
          <View style={styles.voucherInfo}>
            <Text style={styles.voucherNumber}>{voucher.number}</Text>
            <Text style={styles.voucherParty}>{voucher.party}</Text>
          </View>
        </View>
        <View style={styles.voucherRight}>
          <Text style={styles.voucherAmount}>{formatCurrency(voucher.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(voucher.status) }]}>
            <Text style={styles.statusText}>{voucher.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.voucherFooter}>
        <Text style={styles.voucherDate}>{formatDate(voucher.date)}</Text>
        <Text style={styles.voucherType}>{voucher.type.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vouchers</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateVoucher')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {voucherTypes.map((type) => (
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

      {/* Voucher List */}
      <ScrollView
        style={styles.voucherList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading vouchers...</Text>
          </View>
        ) : vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Vouchers Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Create your first voucher to get started'
                : `No ${filter} vouchers found`
              }
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateVoucher')}
            >
              <Text style={styles.createButtonText}>Create Voucher</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.voucherContainer}>
            {vouchers.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} />
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
  voucherList: {
    flex: 1,
  },
  voucherContainer: {
    padding: 16,
  },
  voucherCard: {
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
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  voucherParty: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Agency',
  },
  voucherRight: {
    alignItems: 'flex-end',
  },
  voucherAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Agency',
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  voucherDate: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  voucherType: {
    fontSize: 12,
    color: '#3e60ab',
    fontWeight: '600',
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