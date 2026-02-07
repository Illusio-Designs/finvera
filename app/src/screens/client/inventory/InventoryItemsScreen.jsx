import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function InventoryItemsScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive, low_stock

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        accountingAPI.inventory.items.list({ 
          search: searchQuery,
          is_active: filter === 'active' ? true : filter === 'inactive' ? false : undefined,
          limit: 50 
        }).catch(error => {
          console.error('Inventory items API error:', error);
          return { data: { data: [] } };
        }),
        accountingAPI.warehouses.getAll({ is_active: true }).catch(error => {
          console.error('Warehouses API error:', error);
          return { data: { data: [] } };
        })
      ]);
      
      // Enhanced error handling for API responses
      const itemsData = itemsRes?.data?.data || itemsRes?.data?.items || itemsRes?.data || [];
      const warehousesData = warehousesRes?.data?.data || warehousesRes?.data?.warehouses || warehousesRes?.data || [];
      
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
    } catch (error) {
      console.error('Inventory items fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load inventory items'
      });
      setItems([]);
      setWarehouses([]);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [searchQuery, filter]); // Removed showNotification from dependencies

  useEffect(() => {
    fetchData();
  }, [searchQuery, filter]); // Changed to depend on searchQuery and filter directly

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { status: 'Out of Stock', color: '#ef4444' };
    if (quantity <= 10) return { status: 'Low Stock', color: '#f59e0b' };
    return { status: 'In Stock', color: '#10b981' };
  };

  const filterOptions = [
    { key: 'all', label: 'All Items', icon: 'list-outline' },
    { key: 'active', label: 'Active', icon: 'checkmark-circle-outline' },
    { key: 'inactive', label: 'Inactive', icon: 'close-circle-outline' },
    { key: 'low_stock', label: 'Low Stock', icon: 'warning-outline' },
  ];

  const filteredItems = items.filter(item => {
    if (filter === 'low_stock') {
      return (item.quantity_on_hand || 0) <= 10;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <TopBar 
        title="Inventory Items" 
        onMenuPress={handleMenuPress}
        onSearchPress={() => {}}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items by name or code..."
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
            <View style={styles.statIcon}>
              <Ionicons name="cube" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{items.length}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {items.filter(item => item.is_active).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {items.filter(item => (item.quantity_on_hand || 0) <= 10).length}
              </Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cube-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No items found matching "${searchQuery}"`
                  : filter === 'low_stock' 
                  ? 'No items with low stock'
                  : 'No inventory items available'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map((item, index) => {
              const stockStatus = getStockStatus(item.quantity_on_hand);
              return (
                <TouchableOpacity
                  key={item.id || index}
                  style={styles.itemCard}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.95}
                >
                  <View style={styles.itemCardGradient}>
                    <View style={styles.itemCardContent}>
                      <View style={styles.itemCardHeader}>
                        <View style={styles.itemIcon}>
                          <Ionicons name="cube" size={24} color="#3e60ab" />
                        </View>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>
                            {item.item_name || 'Unnamed Item'}
                          </Text>
                          <Text style={styles.itemCode}>
                            Code: {item.item_code || 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.itemStatus}>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: stockStatus.color }
                          ]}>
                            <Text style={styles.statusText}>{stockStatus.status}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.itemCardBody}>
                        <View style={styles.itemDetail}>
                          <Ionicons name="layers-outline" size={16} color="#64748b" />
                          <Text style={styles.itemDetailText}>
                            Quantity: {item.quantity_on_hand || 0} {item.uqc || 'units'}
                          </Text>
                        </View>
                        <View style={styles.itemDetail}>
                          <Ionicons name="pricetag-outline" size={16} color="#64748b" />
                          <Text style={styles.itemDetailText}>
                            Avg Cost: {formatCurrency(item.avg_cost)}
                          </Text>
                        </View>
                        <View style={styles.itemDetail}>
                          <Ionicons name="receipt-outline" size={16} color="#64748b" />
                          <Text style={styles.itemDetailText}>
                            HSN: {item.hsn_sac_code || 'N/A'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemCardFooter}>
                        <View style={styles.itemValue}>
                          <Text style={styles.itemValueAmount}>
                            {formatCurrency((item.quantity_on_hand || 0) * (item.avg_cost || 0))}
                          </Text>
                          <Text style={styles.itemValueLabel}>Total Value</Text>
                        </View>
                        <TouchableOpacity style={styles.itemAction}>
                          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Decorative elements */}
                    <View style={[styles.decorativeCircle, { backgroundColor: stockStatus.color + '20' }]} />
                    <View style={[styles.decorativeLine, { backgroundColor: stockStatus.color }]} />
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
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="cube" size={20} color="#3e60ab" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Item Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedItem?.item_name || 'Item Information'}
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
          
          {selectedItem && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.detailLabel}>Unit of Measure:</Text>
                  <Text style={styles.detailValue}>{selectedItem.uqc || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GST Rate:</Text>
                  <Text style={styles.detailValue}>{selectedItem.gst_rate || 0}%</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Stock Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity on Hand:</Text>
                  <Text style={styles.detailValue}>
                    {selectedItem.quantity_on_hand || 0} {selectedItem.uqc || 'units'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Average Cost:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedItem.avg_cost)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Value:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency((selectedItem.quantity_on_hand || 0) * (selectedItem.avg_cost || 0))}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedItem.is_active ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedItem.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
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
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
    ...FONT_STYLES.h6,
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
    backgroundColor: '#f8fafc',
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
    borderTopColor: '#3e60ab',
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
    ...FONT_STYLES.h3,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
  },
  itemsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  itemCard: {
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
  itemCardGradient: {
    position: 'relative',
    padding: 20,
  },
  itemCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  itemCode: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 18,
  },
  itemStatus: {
    alignItems: 'flex-end',
    minWidth: 80,
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
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    color: 'white',
  },
  itemCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  itemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  itemDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
  },
  itemCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemValue: {
    flex: 1,
  },
  itemValueAmount: {
    ...FONT_STYLES.h4,
    color: '#3e60ab',
  },
  itemValueLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2,
  },
  itemAction: {
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
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
  },
  modalSubtitle: {
    ...FONT_STYLES.label,
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
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#64748b',
    fontWeight: '500',
    width: 120,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
});