import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, FlatList } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
        limit: 100,
        search: searchQuery || undefined
      }).catch(error => {
        console.error('Inventory API error:', error);
        return { data: { data: [] } };
      });
      
      // Enhanced error handling for API responses
      const data = response?.data?.data || response?.data?.items || response?.data || [];
      const items = Array.isArray(data) ? data : [];
      setInventoryItems(items);
      
      // Calculate stats
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        const cost = parseFloat(item.avg_cost) || 0;
        return sum + (qty * cost);
      }, 0);
      const lowStock = items.filter(item => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        return qty > 0 && qty <= 10; // Consider low stock as <= 10
      }).length;
      const outOfStock = items.filter(item => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        return qty === 0;
      }).length;
      
      setStats({ totalItems, totalValue, lowStock, outOfStock });
    } catch (error) {
      console.error('Inventory fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load inventory items'
      });
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]); // Removed showNotification from dependencies

  useEffect(() => {
    fetchInventoryItems();
  }, [searchQuery]); // Changed to depend on searchQuery directly instead of fetchInventoryItems

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventoryItems();
    setRefreshing(false);
  }, [fetchInventoryItems]);

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleCreateItem = () => {
    navigation.navigate('InventoryItems', { mode: 'create' });
  };

  const handleEditItem = () => {
    navigation.navigate('InventoryItems', { mode: 'edit' });
  };

  const handleDeleteItem = () => {
    navigation.navigate('InventoryItems', { mode: 'manage' });
  };

  const handleAdjustment = () => {
    navigation.navigate('InventoryAdjustment', { mode: 'create' });
  };

  const handleTransfer = () => {
    navigation.navigate('InventoryTransfer', { mode: 'create' });
  };

  const handleWarehousesPress = () => {
    navigation.navigate('Warehouses');
  };

  const handleAttributesPress = () => {
    navigation.navigate('Attributes');
  };

  const getStockStatus = (quantity) => {
    const qty = parseFloat(quantity) || 0;
    if (qty === 0) return { level: 'out', color: '#6b7280', icon: 'close-circle', label: 'Out of Stock' };
    if (qty <= 10) return { level: 'low', color: '#ef4444', icon: 'alert-circle', label: 'Low Stock' };
    if (qty <= 50) return { level: 'medium', color: '#f59e0b', icon: 'warning', label: 'Medium Stock' };
    return { level: 'high', color: '#10b981', icon: 'checkmark-circle', label: 'In Stock' };
  };

  const formatQuantity = (quantity) => {
    const qty = parseFloat(quantity) || 0;
    return qty.toFixed(3);
  };

  const renderInventoryItem = ({ item }) => {
    const stockStatus = getStockStatus(item.quantity_on_hand);
    const totalValue = (parseFloat(item.quantity_on_hand) || 0) * (parseFloat(item.avg_cost) || 0);

    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.itemCardHeader}>
          <View style={styles.itemIcon}>
            <Ionicons name="cube" size={20} color="#3e60ab" />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.item_name || 'Unnamed Item'}</Text>
            <Text style={styles.itemCode}>
              {item.item_code || 'No Code'} • {item.hsn_sac_code || 'No HSN'}
            </Text>
          </View>
          <View style={styles.itemStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: stockStatus.color }
            ]}>
              <Ionicons 
                name={stockStatus.icon} 
                size={12} 
                color="white" 
              />
            </View>
          </View>
        </View>
        
        <View style={styles.itemCardBody}>
          <View style={styles.itemStat}>
            <Text style={styles.itemStatValue}>{formatQuantity(item.quantity_on_hand)}</Text>
            <Text style={styles.itemStatLabel}>Quantity</Text>
          </View>
          <View style={styles.itemStat}>
            <Text style={styles.itemStatValue}>{item.uqc || 'NOS'}</Text>
            <Text style={styles.itemStatLabel}>Unit</Text>
          </View>
          <View style={styles.itemStat}>
            <Text style={styles.itemStatValue}>{formatCurrency(item.avg_cost || 0)}</Text>
            <Text style={styles.itemStatLabel}>Avg Cost</Text>
          </View>
          <View style={styles.itemStat}>
            <Text style={styles.itemStatValue}>{formatCurrency(totalValue)}</Text>
            <Text style={styles.itemStatLabel}>Value</Text>
          </View>
        </View>

        <View style={styles.itemCardFooter}>
          <View style={styles.itemDetails}>
            <Text style={styles.itemDetailText}>
              GST: {item.gst_rate ? `${item.gst_rate}%` : 'N/A'}
            </Text>
            <Text style={[styles.itemDetailText, { color: stockStatus.color }]}>
              {stockStatus.label}
            </Text>
          </View>
          <TouchableOpacity style={styles.itemAction}>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Inventory" 
        onMenuPress={handleMenuPress}
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={fetchInventoryItems}
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
            <Text style={styles.actionButtonText}>Create Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handleAdjustment}>
            <Ionicons name="swap-horizontal" size={20} color="#3e60ab" />
            <Text style={[styles.actionButtonText, { color: '#3e60ab' }]}>Create Adjustment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handleTransfer}>
            <Ionicons name="arrow-forward" size={20} color="#3e60ab" />
            <Text style={[styles.actionButtonText, { color: '#3e60ab' }]}>Create Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Management Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Management</Text>
          </View>
          
          <View style={styles.managementGrid}>
            <TouchableOpacity style={styles.managementCard} onPress={() => navigation.navigate('InventoryItems', { mode: 'view' })}>
              <View style={[styles.managementIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="list" size={24} color="white" />
              </View>
              <View style={styles.managementInfo}>
                <Text style={styles.managementTitle}>Inventory Items</Text>
                <Text style={styles.managementSubtitle}>View & create items</Text>
              </View>
              <View style={styles.managementArrow}>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.managementCard} onPress={() => navigation.navigate('InventoryAdjustment', { mode: 'create' })}>
              <View style={[styles.managementIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="swap-horizontal" size={24} color="white" />
              </View>
              <View style={styles.managementInfo}>
                <Text style={styles.managementTitle}>Stock Adjustments</Text>
                <Text style={styles.managementSubtitle}>Create adjustments</Text>
              </View>
              <View style={styles.managementArrow}>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.managementCard} onPress={() => navigation.navigate('InventoryTransfer', { mode: 'create' })}>
              <View style={[styles.managementIcon, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
              <View style={styles.managementInfo}>
                <Text style={styles.managementTitle}>Stock Transfers</Text>
                <Text style={styles.managementSubtitle}>Create transfers</Text>
              </View>
              <View style={styles.managementArrow}>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.managementCard} onPress={() => navigation.navigate('Warehouses', { mode: 'create' })}>
              <View style={[styles.managementIcon, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="storefront" size={24} color="white" />
              </View>
              <View style={styles.managementInfo}>
                <Text style={styles.managementTitle}>Warehouses</Text>
                <Text style={styles.managementSubtitle}>Create & manage locations</Text>
              </View>
              <View style={styles.managementArrow}>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.managementCard} onPress={() => navigation.navigate('Attributes', { mode: 'create' })}>
              <View style={[styles.managementIcon, { backgroundColor: '#ef4444' }]}>
                <Ionicons name="pricetag" size={24} color="white" />
              </View>
              <View style={styles.managementInfo}>
                <Text style={styles.managementTitle}>Product Attributes</Text>
                <Text style={styles.managementSubtitle}>Create item properties</Text>
              </View>
              <View style={styles.managementArrow}>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inventory Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Items</Text>
            <TouchableOpacity onPress={fetchInventoryItems}>
              <Ionicons name="refresh" size={20} color="#3e60ab" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading inventory...</Text>
            </View>
          ) : inventoryItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptySubtitle}>
                Add your first inventory item to get started
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateItem}>
                <Text style={styles.emptyButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={inventoryItems}
              renderItem={renderInventoryItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.itemsList}
            />
          )}
        </View>
      </ScrollView>

      {/* Item Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Name:</Text>
                  <Text style={styles.detailValue}>{selectedItem.item_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Code:</Text>
                  <Text style={styles.detailValue}>{selectedItem.item_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>HSN/SAC Code:</Text>
                  <Text style={styles.detailValue}>{selectedItem.hsn_sac_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit:</Text>
                  <Text style={styles.detailValue}>{selectedItem.uqc || 'NOS'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GST Rate:</Text>
                  <Text style={styles.detailValue}>{selectedItem.gst_rate ? `${selectedItem.gst_rate}%` : 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Stock Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity on Hand:</Text>
                  <Text style={styles.detailValue}>{formatQuantity(selectedItem.quantity_on_hand)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Average Cost:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedItem.avg_cost || 0)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Value:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency((parseFloat(selectedItem.quantity_on_hand) || 0) * (parseFloat(selectedItem.avg_cost) || 0))}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStockStatus(selectedItem.quantity_on_hand).color }]}>
                    <Text style={styles.statusText}>{getStockStatus(selectedItem.quantity_on_hand).label}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditItem}
                >
                  <Ionicons name="create" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Edit Item</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.adjustButton]}
                  onPress={handleAdjustment}
                >
                  <Ionicons name="swap-horizontal" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Adjust Stock</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteItem}
                >
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: '#f9fafb',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    minHeight: 44,
  },
  actionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    marginLeft: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 0,
    marginBottom: 0,
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
    gap: 12,
    paddingBottom: 0,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
  itemDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetailText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  itemAction: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Agency',
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  editButton: {
    backgroundColor: '#f59e0b',
  },
  adjustButton: {
    backgroundColor: '#3e60ab',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  managementGrid: {
    gap: 12,
  },
  managementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 8,
  },
  managementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  managementInfo: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  managementSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  managementArrow: {
    padding: 8,
  },
});