import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function AttributesScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await inventoryAPI.attributes.list({ 
        search: searchQuery,
        limit: 50 
      });
      const data = response.data?.data || response.data || [];
      setAttributes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Attributes fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load product attributes'
      });
      setAttributes([]);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [searchQuery, showNotification]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAttributes();
    setRefreshing(false);
  }, [fetchAttributes]);

  const handleAttributePress = (attribute) => {
    setSelectedAttribute(attribute);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const getAttributeTypeColor = (type) => {
    const colors = {
      'text': '#3e60ab',
      'number': '#10b981',
      'boolean': '#f59e0b',
      'date': '#8b5cf6',
      'select': '#ef4444',
      'multiselect': '#06b6d4',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const getAttributeTypeIcon = (type) => {
    const icons = {
      'text': 'text',
      'number': 'calculator',
      'boolean': 'toggle',
      'date': 'calendar',
      'select': 'list',
      'multiselect': 'list-circle',
    };
    return icons[type?.toLowerCase()] || 'pricetag';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Product Attributes" 
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
          <Text style={styles.sectionTitle}>Product Attributes</Text>
          <Text style={styles.sectionSubtitle}>
            Manage custom attributes and properties for your inventory items
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search attributes by name..."
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

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="pricetag" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{attributes.length}</Text>
              <Text style={styles.statLabel}>Total Attributes</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {attributes.filter(attr => attr.is_active).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="star" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {attributes.filter(attr => attr.is_required).length}
              </Text>
              <Text style={styles.statLabel}>Required</Text>
            </View>
          </View>
        </View>

        {/* Attributes List */}
        {loading ? (
          <View style={styles.attributesList}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : attributes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="pricetag-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Attributes Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No attributes found matching "${searchQuery}"`
                  : 'No product attributes have been configured yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.attributesList}>
            {attributes.map((attribute, index) => (
              <TouchableOpacity
                key={attribute.id || index}
                style={[
                  styles.attributeCard,
                  !attribute.is_active && styles.inactiveAttributeCard
                ]}
                onPress={() => handleAttributePress(attribute)}
                activeOpacity={0.95}
              >
                <View style={styles.attributeCardGradient}>
                  <View style={styles.attributeCardContent}>
                    <View style={styles.attributeCardHeader}>
                      <View style={[
                        styles.attributeIcon,
                        { backgroundColor: getAttributeTypeColor(attribute.attribute_type) + '20' }
                      ]}>
                        <Ionicons 
                          name={getAttributeTypeIcon(attribute.attribute_type)} 
                          size={24} 
                          color={getAttributeTypeColor(attribute.attribute_type)} 
                        />
                      </View>
                      <View style={styles.attributeInfo}>
                        <View style={styles.attributeNameRow}>
                          <Text style={styles.attributeName}>
                            {attribute.attribute_name || 'Unnamed Attribute'}
                          </Text>
                          {attribute.is_required && (
                            <View style={styles.requiredBadge}>
                              <Ionicons name="star" size={10} color="white" />
                              <Text style={styles.requiredBadgeText}>Required</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.attributeCode}>
                          Code: {attribute.attribute_code || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.attributeStatus}>
                        <View style={[
                          styles.typeBadge,
                          { backgroundColor: getAttributeTypeColor(attribute.attribute_type) }
                        ]}>
                          <Text style={styles.typeText}>
                            {attribute.attribute_type?.toUpperCase() || 'TEXT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.attributeCardBody}>
                      <View style={styles.attributeDetail}>
                        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                        <Text style={styles.attributeDetailText} numberOfLines={2}>
                          {attribute.description || 'No description provided'}
                        </Text>
                      </View>
                      {attribute.default_value && (
                        <View style={styles.attributeDetail}>
                          <Ionicons name="bookmark-outline" size={16} color="#64748b" />
                          <Text style={styles.attributeDetailText}>
                            Default: {attribute.default_value}
                          </Text>
                        </View>
                      )}
                      {attribute.attribute_type === 'select' && attribute.options && (
                        <View style={styles.attributeDetail}>
                          <Ionicons name="list-outline" size={16} color="#64748b" />
                          <Text style={styles.attributeDetailText}>
                            Options: {Array.isArray(attribute.options) 
                              ? attribute.options.slice(0, 3).join(', ') + (attribute.options.length > 3 ? '...' : '')
                              : 'N/A'
                            }
                          </Text>
                        </View>
                      )}
                      <View style={styles.attributeDetail}>
                        <Ionicons name="toggle-outline" size={16} color="#64748b" />
                        <Text style={styles.attributeDetailText}>
                          Status: {attribute.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.attributeCardFooter}>
                      <View style={styles.attributeMeta}>
                        <Text style={styles.attributeUsage}>
                          Used in {attribute.usage_count || 0} products
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.attributeAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getAttributeTypeColor(attribute.attribute_type) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getAttributeTypeColor(attribute.attribute_type) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Attribute Detail Modal */}
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
                { backgroundColor: selectedAttribute ? getAttributeTypeColor(selectedAttribute.attribute_type) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedAttribute ? getAttributeTypeIcon(selectedAttribute.attribute_type) : 'pricetag'} 
                  size={20} 
                  color={selectedAttribute ? getAttributeTypeColor(selectedAttribute.attribute_type) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Attribute Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAttribute?.attribute_name || 'Attribute Information'}
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
          
          {selectedAttribute && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedAttribute.attribute_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Code:</Text>
                  <Text style={styles.detailValue}>{selectedAttribute.attribute_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getAttributeTypeColor(selectedAttribute.attribute_type) }
                  ]}>
                    <Text style={styles.typeText}>
                      {selectedAttribute.attribute_type?.toUpperCase() || 'TEXT'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAttribute.description || 'No description provided'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Required:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAttribute.is_required ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAttribute.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Configuration</Text>
                {selectedAttribute.default_value && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Default Value:</Text>
                    <Text style={styles.detailValue}>{selectedAttribute.default_value}</Text>
                  </View>
                )}
                {selectedAttribute.min_value && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Min Value:</Text>
                    <Text style={styles.detailValue}>{selectedAttribute.min_value}</Text>
                  </View>
                )}
                {selectedAttribute.max_value && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Max Value:</Text>
                    <Text style={styles.detailValue}>{selectedAttribute.max_value}</Text>
                  </View>
                )}
                {selectedAttribute.validation_rules && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Validation:</Text>
                    <Text style={styles.detailValue}>{selectedAttribute.validation_rules}</Text>
                  </View>
                )}
              </View>

              {selectedAttribute.attribute_type === 'select' && selectedAttribute.options && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Options</Text>
                  {Array.isArray(selectedAttribute.options) ? (
                    selectedAttribute.options.map((option, index) => (
                      <View key={index} style={styles.optionRow}>
                        <View style={styles.optionBullet} />
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.detailValue}>No options configured</Text>
                  )}
                </View>
              )}

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Usage Statistics</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Products Using:</Text>
                  <Text style={styles.detailValue}>{selectedAttribute.usage_count || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAttribute.created_at 
                      ? new Date(selectedAttribute.created_at).toLocaleDateString('en-IN')
                      : 'N/A'
                    }
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Modified:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAttribute.updated_at 
                      ? new Date(selectedAttribute.updated_at).toLocaleDateString('en-IN')
                      : 'N/A'
                    }
                  </Text>
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
  headerSection: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    ...FONT_STYLES.h1,
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    lineHeight: 24
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#0f172a'
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
    color: '#0f172a'
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2
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
    color: '#64748b'
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
    ...FONT_STYLES.h2,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24
  },
  attributesList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  attributeCard: {
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
  inactiveAttributeCard: {
    opacity: 0.7,
  },
  attributeCardGradient: {
    position: 'relative',
    padding: 20,
  },
  attributeCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  attributeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  attributeIcon: {
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
  attributeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  attributeNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    minHeight: 22,
  },
  attributeName: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: 22,
    paddingRight: 8
  },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    ...FONT_STYLES.captionSmall,
    color: 'white'
  },
  attributeCode: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 18
  },
  attributeStatus: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  typeText: {
    ...FONT_STYLES.captionSmall,
    color: 'white'
  },
  attributeCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  attributeDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  attributeDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
    lineHeight: 18
  },
  attributeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attributeMeta: {
    flex: 1,
  },
  attributeUsage: {
    ...FONT_STYLES.caption,
    color: '#64748b'
  },
  attributeAction: {
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
    ...FONT_STYLES.h5,
    color: '#0f172a'
  },
  modalSubtitle: {
    ...FONT_STYLES.label,
    color: '#64748b',
    marginTop: 2
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
    color: '#0f172a',
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#64748b',
    width: 120
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    flex: 1
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  optionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3e60ab',
  },
  optionText: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    flex: 1
  },
});