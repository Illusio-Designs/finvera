import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

const INVENTORY_TASKS = [
  { 
    value: 'items', 
    label: 'Inventory Items', 
    icon: 'cube', 
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: 'Manage inventory items',
    screen: 'InventoryItems'
  },
  { 
    value: 'adjustments', 
    label: 'Stock Adjustments', 
    icon: 'swap-horizontal', 
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Adjust stock quantities',
    screen: 'InventoryAdjustment'
  },
  { 
    value: 'transfers', 
    label: 'Stock Transfers', 
    icon: 'git-compare', 
    color: '#8b5cf6',
    bgColor: '#f3e8ff',
    description: 'Transfer between warehouses',
    screen: 'InventoryTransfer'
  },
  { 
    value: 'warehouses', 
    label: 'Warehouses', 
    icon: 'business', 
    color: '#f59e0b',
    bgColor: '#fffbeb',
    description: 'Manage warehouse locations',
    screen: 'Warehouses'
  },
  { 
    value: 'attributes', 
    label: 'Attributes', 
    icon: 'pricetags', 
    color: '#ec4899',
    bgColor: '#fce7f3',
    description: 'Manage item attributes',
    screen: 'Attributes'
  },
  { 
    value: 'reports', 
    label: 'Stock Reports', 
    icon: 'bar-chart', 
    color: '#6366f1',
    bgColor: '#eef2ff',
    description: 'View stock reports',
    screen: 'Reports'
  },
];

export default function InventoryScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchInventoryStats = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await inventoryAPI.items.list({ limit: 1000 });
      const data = response?.data?.data || response?.data?.items || response?.data || [];
      const items = Array.isArray(data) ? data : [];
      
      // Calculate stats
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        const cost = parseFloat(item.avg_cost) || 0;
        return sum + (qty * cost);
      }, 0);
      const lowStock = items.filter(item => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        return qty > 0 && qty <= 10;
      }).length;
      const outOfStock = items.filter(item => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        return qty === 0;
      }).length;
      
      setInventoryStats({ totalItems, totalValue, lowStock, outOfStock });
    } catch (error) {
      console.error('Inventory stats fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load inventory statistics'
      });
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchInventoryStats();
  }, [fetchInventoryStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventoryStats();
    setRefreshing(false);
  }, [fetchInventoryStats]);

  const handleTaskPress = (task) => {
    if (task.screen) {
      try {
        navigation.navigate(task.screen);
      } catch (error) {
        console.error('Navigation error:', error);
        showNotification({
          type: 'error',
          title: 'Navigation Error',
          message: error.message
        });
      }
    } else {
      showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: `${task.label} will be available soon`
      });
    }
  };

  const renderTaskCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.taskCard, { backgroundColor: item.bgColor }]}
      onPress={() => handleTaskPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.taskIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <Text style={styles.taskLabel}>{item.label}</Text>
      <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TopBar 
        title="Inventory Management" 
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
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your inventory, stock levels, and warehouse operations
          </Text>
          
          {/* Stats Cards */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonListItem />
              <SkeletonListItem />
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Ionicons name="cube-outline" size={24} color="#3e60ab" style={styles.statIcon} />
                  <Text style={styles.statNumber}>{inventoryStats.totalItems}</Text>
                  <Text style={styles.statLabel}>Total Items</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="cash-outline" size={24} color="#10b981" style={styles.statIcon} />
                  <Text style={styles.statNumber}>{formatCurrency(inventoryStats.totalValue)}</Text>
                  <Text style={styles.statLabel}>Total Value</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" style={styles.statIcon} />
                  <Text style={styles.statNumber}>{inventoryStats.lowStock}</Text>
                  <Text style={styles.statLabel}>Low Stock</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="close-circle-outline" size={24} color="#ef4444" style={styles.statIcon} />
                  <Text style={styles.statNumber}>{inventoryStats.outOfStock}</Text>
                  <Text style={styles.statLabel}>Out of Stock</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Inventory Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Inventory Operations</Text>
            <Text style={styles.sectionSubtitle}>Choose an operation to get started</Text>
          </View>
          
          <FlatList
            data={INVENTORY_TASKS}
            renderItem={renderTaskCard}
            keyExtractor={(item) => item.value}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.tasksList}
            columnWrapperStyle={styles.tasksRow}
          />
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('InventoryItems', { mode: 'create' })}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.quickActionText}>Add New Item</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
              onPress={() => navigation.navigate('InventoryAdjustment', { mode: 'create' })}
            >
              <Ionicons name="swap-horizontal" size={20} color="#3e60ab" />
              <Text style={[styles.quickActionText, { color: '#3e60ab' }]}>Stock Adjustment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
              onPress={() => navigation.navigate('InventoryTransfer', { mode: 'create' })}
            >
              <Ionicons name="git-compare" size={20} color="#3e60ab" />
              <Text style={[styles.quickActionText, { color: '#3e60ab' }]}>Stock Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
  },
  statsContainer: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    marginBottom: 16,
  },
  tasksList: {
    gap: 8,
  },
  tasksRow: {
    justifyContent: 'space-between',
  },
  taskCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskLabel: {
    ...FONT_STYLES.label,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  taskDescription: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  quickActionText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
  loadingContainer: {
    marginTop: 16,
  },
});
