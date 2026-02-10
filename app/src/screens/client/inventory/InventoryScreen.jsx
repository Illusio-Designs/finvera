import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

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
    setLoading(true);
    const startTime = Date.now();
    
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
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
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
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateItem}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Item</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Items List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : inventoryItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first inventory item to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateItem}>
              <Text style={styles.emptyButtonText}>Create Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {inventoryItems.map((item, index) => {
              const stockStatus = getStockStatus(item.quantity_on_hand);
              const totalValue = (parseFloat(item.quantity_on_hand) || 0) * (parseFloat(item.avg_cost) || 0);

              return (
                <TouchableOpacity
                  key={item.id?.toString() || index}
                  style={styles.itemCard}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.itemCardHeader}>
                    <View style={styles.itemMainInfo}>
                      <Text style={styles.itemName}>
                        {item.item_name || 'Unnamed Item'}
                      </Text>
                      <Text style={styles.itemCode}>
                        Code: {item.item_code || 'N/A'}
                      </Text>
                      <Text style={styles.itemHsn}>
                        HSN: {item.hsn_sac_code || 'N/A'} • Unit: {item.uqc || 'NOS'}
                      </Text>
                    </View>
                    <View style={styles.itemAmount}>
                      <Text style={styles.itemQuantity}>
                        {formatQuantity(item.quantity_on_hand)}
                      </Text>
                      <View style={[
                        styles.stockStatusBadge,
                        { backgroundColor: stockStatus.level === 'out' ? '#fef2f2' : stockStatus.level === 'low' ? '#fef2f2' : '#ecfdf5' }
                      ]}>
                        <Text style={[
                          styles.stockStatusText,
                          { color: stockStatus.color }
                        ]}>
                          {stockStatus.level === 'out' ? 'Out' : stockStatus.level === 'low' ? 'Low' : 'In Stock'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.itemCardActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleItemPress(item);
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                      <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditItem();
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color="#059669" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAdjustment();
                      }}
                    >
                      <Ionicons name="swap-horizontal-outline" size={16} color="#2563eb" />
                      <Text style={styles.actionButtonText}>Adjust</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteItem();
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
            <Text style={styles.modalTitle}>
              {selectedItem?.item_name || 'Item Details'}
            </Text>
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
            </ScrollView>
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalActionButton}
              onPress={() => {
                setShowDetailModal(false);
                handleAdjustment();
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color="white" />
              <Text style={styles.modalActionText}>Adjust Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
              onPress={() => {
                setShowDetailModal(false);
                handleEditItem();
              }}
            >
              <Ionicons name="create-outline" size={16} color="#3e60ab" />
              <Text style={[styles.modalActionText, { color: '#3e60ab' }]}>Edit</Text>
            </TouchableOpacity>
          </View>
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    minWidth: 200,
  },
  createButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  itemCode: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemHsn: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  stockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockStatusText: {
    ...FONT_STYLES.captionSmall,
  },
  itemCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  actionButtonText: {
    ...FONT_STYLES.captionSmall,
    marginLeft: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    ...FONT_STYLES.caption,
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
  },
  modalActionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  modalActionText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
});