import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchInventoryItems = useCallback(async () => {
    try {
      const response = await inventoryAPI.items.list({ 
        limit: 50,
        status: filter !== 'all' ? filter : undefined 
      });
      const data = response.data?.data || response.data || [];
      const items = Array.isArray(data) ? data : [];
      setInventoryItems(items);
      
      // Calculate stats
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
      const lowStock = items.filter(item => item.stock_level === 'low').length;
      const outOfStock = items.filter(item => item.stock_level === 'out').length;
      
      setStats({ totalItems, totalValue, lowStock, outOfStock });
    } catch (error) {
      console.error('Inventory fetch error:', error);
      showNotification('Failed to load inventory items', 'error');
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInventoryItems();
  }, [fetchInventoryItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventoryItems();
    setRefreshing(false);
  }, [fetchInventoryItems]);

  const handleItemPress = (item) => {
    showNotification(`View details for ${item.name}`, 'info');
  };

  const handleCreateItem = () => {
    showNotification('Create new inventory item functionality will be available soon', 'info');
  };

  const handleAdjustment = () => {
    showNotification('Stock adjustment functionality will be available soon', 'info');
  };

  const handleTransfer = () => {
    showNotification('Stock transfer functionality will be available soon', 'info');
  };

  const filterOptions = [
    { key: 'all', label: 'All Items', icon: 'cube-outline' },
    { key: 'in_stock', label: 'In Stock', icon: 'checkmark-circle-outline' },
    { key: 'low_stock', label: 'Low Stock', icon: 'warning-outline' },
    { key: 'out_of_stock', label: 'Out of Stock', icon: 'close-circle-outline' },
  ];

  const getStockStatusColor = (stockLevel) => {
    const colors = {
      'high': '#10b981',
      'medium': '#f59e0b',
      'low': '#ef4444',
      'out': '#6b7280',
    };
    return colors[stockLevel] || '#6b7280';
  };

  const getStockStatusIcon = (stockLevel) => {
    const icons = {
      'high': 'checkmark-circle',
      'medium': 'warning',
      'low': 'alert-circle',
      'out': 'close-circle',
    };
    return icons[stockLevel] || 'help-circle';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Inventory" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#f0f4fc' }]}>
              <Ionicons name="cube" size={24} color="#3e60ab" />
              <Text style={styles.statValue}>{stats.totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="cash" size={24} color="#10b981" />
              <Text style={styles.statValue}>{formatCurrency(stats.totalValue)}</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fffbeb' }]}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{stats.lowStock}</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <Text style={styles.statValue}>{stats.outOfStock}</Text>
              <Text style={styles.statLabel}>Out of Stock</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateItem}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.actionButtonText}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handleAdjustment}>
            <Ionicons name="swap-horizontal" size={20} color="#3e60ab" />
            <Text style={[styles.actionButtonText, { color: '#3e60ab' }]}>Adjust Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handleTransfer}>
            <Ionicons name="arrow-forward" size={20} color="#3e60ab" />
            <Text style={[styles.actionButtonText, { color: '#3e60ab' }]}>Transfer</Text>
          </TouchableOpacity>
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

        {/* Inventory Items List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : inventoryItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Add your first inventory item to get started' 
                : `No ${filter.replace('_', ' ')} items found`}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateItem}>
              <Text style={styles.emptyButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {inventoryItems.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.itemCard}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemCardHeader}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="cube" size={20} color="#3e60ab" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name || 'Unnamed Item'}</Text>
                    <Text style={styles.itemCode}>
                      {item.code || 'No Code'} • {item.category || 'General'}
                    </Text>
                  </View>
                  <View style={styles.itemStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStockStatusColor(item.stock_level) }
                    ]}>
                      <Ionicons 
                        name={getStockStatusIcon(item.stock_level)} 
                        size={12} 
                        color="white" 
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.itemCardBody}>
                  <View style={styles.itemStat}>
                    <Text style={styles.itemStatValue}>{item.quantity || 0}</Text>
                    <Text style={styles.itemStatLabel}>Quantity</Text>
                  </View>
                  <View style={styles.itemStat}>
                    <Text style={styles.itemStatValue}>{item.unit || 'PCS'}</Text>
                    <Text style={styles.itemStatLabel}>Unit</Text>
                  </View>
                  <View style={styles.itemStat}>
                    <Text style={styles.itemStatValue}>{formatCurrency(item.rate || 0)}</Text>
                    <Text style={styles.itemStatLabel}>Rate</Text>
                  </View>
                  <View style={styles.itemStat}>
                    <Text style={styles.itemStatValue}>{formatCurrency(item.value || 0)}</Text>
                    <Text style={styles.itemStatLabel}>Value</Text>
                  </View>
                </View>

                <View style={styles.itemCardFooter}>
                  <Text style={styles.itemDescription}>
                    {item.description || 'No description available'}
                  </Text>
                  <TouchableOpacity style={styles.itemAction}>
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
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    marginLeft: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  itemsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemCard: {
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
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCardBody: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemStat: {
    flex: 1,
    alignItems: 'center',
  },
  itemStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  itemStatLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  itemCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemDescription: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  itemAction: {
    padding: 4,
  },
});