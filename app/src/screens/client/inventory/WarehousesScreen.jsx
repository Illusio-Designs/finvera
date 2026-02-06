import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';

export default function WarehousesScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await accountingAPI.warehouses.list({ limit: 50 });
      const data = response.data?.data || response.data || [];
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Warehouses fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load warehouses'
      });
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWarehouses();
    setRefreshing(false);
  }, [fetchWarehouses]);

  const handleWarehousePress = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDetailModal(true);
  };

  const getWarehouseTypeColor = (type) => {
    const colors = {
      'main': '#3e60ab',
      'branch': '#10b981',
      'transit': '#f59e0b',
      'damaged': '#ef4444',
      'virtual': '#8b5cf6',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const getWarehouseTypeIcon = (type) => {
    const icons = {
      'main': 'business',
      'branch': 'storefront',
      'transit': 'car',
      'damaged': 'warning',
      'virtual': 'cloud',
    };
    return icons[type?.toLowerCase()] || 'storefront';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Warehouses" 
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
          <Text style={styles.sectionTitle}>Warehouse Management</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your warehouse locations and storage facilities
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="storefront" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{warehouses.length}</Text>
              <Text style={styles.statLabel}>Total Warehouses</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {warehouses.filter(wh => wh.is_active).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="business" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {warehouses.filter(wh => wh.warehouse_type === 'main').length}
              </Text>
              <Text style={styles.statLabel}>Main</Text>
            </View>
          </View>
        </View>

        {/* Warehouses List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading warehouses...</Text>
            </View>
          </View>
        ) : warehouses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="storefront-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Warehouses Found</Text>
              <Text style={styles.emptySubtitle}>
                No warehouses have been configured yet
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.warehousesList}>
            {warehouses.map((warehouse, index) => (
              <TouchableOpacity
                key={warehouse.id || index}
                style={[
                  styles.warehouseCard,
                  !warehouse.is_active && styles.inactiveWarehouseCard
                ]}
                onPress={() => handleWarehousePress(warehouse)}
                activeOpacity={0.95}
              >
                <View style={styles.warehouseCardGradient}>
                  <View style={styles.warehouseCardContent}>
                    <View style={styles.warehouseCardHeader}>
                      <View style={[
                        styles.warehouseIcon,
                        { backgroundColor: getWarehouseTypeColor(warehouse.warehouse_type) + '20' }
                      ]}>
                        <Ionicons 
                          name={getWarehouseTypeIcon(warehouse.warehouse_type)} 
                          size={24} 
                          color={getWarehouseTypeColor(warehouse.warehouse_type)} 
                        />
                      </View>
                      <View style={styles.warehouseInfo}>
                        <View style={styles.warehouseNameRow}>
                          <Text style={styles.warehouseName}>
                            {warehouse.warehouse_name || 'Unnamed Warehouse'}
                          </Text>
                          {warehouse.is_default && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.warehouseCode}>
                          Code: {warehouse.warehouse_code || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.warehouseStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: warehouse.is_active ? '#10b981' : '#ef4444' }
                        ]}>
                          <Ionicons 
                            name={warehouse.is_active ? 'checkmark' : 'close'} 
                            size={12} 
                            color="white" 
                          />
                          <Text style={styles.statusText}>
                            {warehouse.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.warehouseCardBody}>
                      <View style={styles.warehouseDetail}>
                        <Ionicons name="business-outline" size={16} color="#64748b" />
                        <Text style={styles.warehouseDetailText}>
                          Type: {warehouse.warehouse_type?.toUpperCase() || 'GENERAL'}
                        </Text>
                      </View>
                      <View style={styles.warehouseDetail}>
                        <Ionicons name="location-outline" size={16} color="#64748b" />
                        <Text style={styles.warehouseDetailText} numberOfLines={1}>
                          {warehouse.address || 'No address provided'}
                        </Text>
                      </View>
                      <View style={styles.warehouseDetail}>
                        <Ionicons name="call-outline" size={16} color="#64748b" />
                        <Text style={styles.warehouseDetailText}>
                          {warehouse.contact_number || 'No contact'}
                        </Text>
                      </View>
                      {warehouse.manager_name && (
                        <View style={styles.warehouseDetail}>
                          <Ionicons name="person-outline" size={16} color="#64748b" />
                          <Text style={styles.warehouseDetailText}>
                            Manager: {warehouse.manager_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.warehouseCardFooter}>
                      <View style={styles.warehouseMeta}>
                        <Text style={styles.warehouseCapacity}>
                          {warehouse.capacity ? `Capacity: ${warehouse.capacity}` : 'No capacity limit'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.warehouseAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getWarehouseTypeColor(warehouse.warehouse_type) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getWarehouseTypeColor(warehouse.warehouse_type) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Warehouse Detail Modal */}
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
                { backgroundColor: selectedWarehouse ? getWarehouseTypeColor(selectedWarehouse.warehouse_type) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedWarehouse ? getWarehouseTypeIcon(selectedWarehouse.warehouse_type) : 'storefront'} 
                  size={20} 
                  color={selectedWarehouse ? getWarehouseTypeColor(selectedWarehouse.warehouse_type) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Warehouse Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedWarehouse?.warehouse_name || 'Warehouse Information'}
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
          
          {selectedWarehouse && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.warehouse_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Code:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.warehouse_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWarehouse.warehouse_type?.toUpperCase() || 'GENERAL'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedWarehouse.is_active ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedWarehouse.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Default:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWarehouse.is_default ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Location & Contact</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWarehouse.address || 'No address provided'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.city || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.state || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.pincode || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.contact_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.email || 'N/A'}</Text>
                </View>
              </View>

              {(selectedWarehouse.manager_name || selectedWarehouse.capacity) && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Additional Information</Text>
                  {selectedWarehouse.manager_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Manager:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.manager_name}</Text>
                    </View>
                  )}
                  {selectedWarehouse.capacity && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Capacity:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.capacity}</Text>
                    </View>
                  )}
                  {selectedWarehouse.description && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.description}</Text>
                    </View>
                  )}
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
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
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
  warehousesList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  warehouseCard: {
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
  inactiveWarehouseCard: {
    opacity: 0.7,
  },
  warehouseCardGradient: {
    position: 'relative',
    padding: 20,
  },
  warehouseCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  warehouseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  warehouseIcon: {
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
  warehouseInfo: {
    flex: 1,
    paddingRight: 12,
  },
  warehouseNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    minHeight: 22,
  },
  warehouseName: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    flex: 1,
    lineHeight: 22,
    paddingRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    color: 'white',
  },
  warehouseCode: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  warehouseStatus: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 70,
    justifyContent: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    color: 'white',
  },
  warehouseCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  warehouseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  warehouseDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
  },
  warehouseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  warehouseMeta: {
    flex: 1,
  },
  warehouseCapacity: {
    ...FONT_STYLES.caption,
    fontWeight: '500',
    color: '#64748b',
  },
  warehouseAction: {
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
    width: 100,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
});