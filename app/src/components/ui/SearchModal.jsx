import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../utils/fonts';;
import { useNavigation } from '@react-navigation/native';
import { useSearch } from '../../contexts/SearchContext';

export default function SearchModal({ 
  visible = false,
  onClose,
  placeholder = "Search ledgers, vouchers, inventory...",
}) {
  const navigation = useNavigation();
  const {
    searchResults,
    isSearching,
    recentSearches,
    performSearch,
    clearSearch,
  } = useSearch();
  
  const [localQuery, setLocalQuery] = useState('');
  const searchInputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto focus when modal opens
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Handle text changes and trigger search
  useEffect(() => {
    if (localQuery.trim().length > 0) {
      const debounceTimer = setTimeout(() => {
        handleSearch(localQuery);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      clearSearch();
    }
  }, [localQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }
    
    await performSearch(query);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setLocalQuery('');
    clearSearch();
    if (onClose) onClose();
  };

  const handleResultPress = (result) => {
    try {
      switch (result.type) {
        case 'ledger':
        case 'ledgers':
          navigation.navigate('Ledgers');
          break;
        case 'voucher':
        case 'vouchers':
          navigation.navigate('Vouchers');
          break;
        case 'inventory':
          navigation.navigate('Inventory');
          break;
        case 'warehouse':
        case 'warehouses':
          navigation.navigate('Warehouses');
          break;
        case 'company':
        case 'companies':
          navigation.navigate('Companies');
          break;
        case 'tenant':
        case 'tenants':
          // Admin only - might need different navigation
          console.log('Tenant result:', result);
          break;
        case 'distributor':
        case 'distributors':
          // Admin only
          console.log('Distributor result:', result);
          break;
        case 'salesman':
        case 'salesmen':
          // Admin only
          console.log('Salesman result:', result);
          break;
        case 'user':
        case 'users':
          // Admin only
          console.log('User result:', result);
          break;
        case 'support_ticket':
        case 'support':
          navigation.navigate('Support');
          break;
        case 'notification':
          navigation.navigate('Notifications');
          break;
        default:
          console.log('Unknown result type:', result.type);
          break;
      }
      handleClose();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleRecentSearchPress = (query) => {
    setLocalQuery(query);
    handleSearch(query);
  };

  const handleQuickActionPress = (searchTerm) => {
    setLocalQuery(searchTerm);
    handleSearch(searchTerm);
  };

  const getResultIcon = (type) => {
    const icons = {
      ledger: 'folder-outline',
      ledgers: 'folder-outline',
      voucher: 'document-text-outline',
      vouchers: 'document-text-outline',
      inventory: 'cube-outline',
      warehouse: 'business-outline',
      warehouses: 'business-outline',
      company: 'briefcase-outline',
      companies: 'briefcase-outline',
      tenant: 'business-outline',
      tenants: 'business-outline',
      distributor: 'people-outline',
      distributors: 'people-outline',
      salesman: 'person-outline',
      salesmen: 'person-outline',
      user: 'person-circle-outline',
      users: 'person-circle-outline',
      support_ticket: 'help-circle-outline',
      support: 'help-circle-outline',
      notification: 'notifications-outline',
    };
    return icons[type] || 'search-outline';
  };

  const getResultColor = (type) => {
    const colors = {
      ledger: '#3e60ab',
      ledgers: '#3e60ab',
      voucher: '#10b981',
      vouchers: '#10b981',
      inventory: '#8b5cf6',
      warehouse: '#f59e0b',
      warehouses: '#f59e0b',
      company: '#f59e0b',
      companies: '#f59e0b',
      tenant: '#3b82f6',
      tenants: '#3b82f6',
      distributor: '#06b6d4',
      distributors: '#06b6d4',
      salesman: '#14b8a6',
      salesmen: '#14b8a6',
      user: '#6366f1',
      users: '#6366f1',
      support_ticket: '#ef4444',
      support: '#ef4444',
      notification: '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <View style={styles.modalContainer}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder={placeholder}
                  placeholderTextColor="#9ca3af"
                  value={localQuery}
                  onChangeText={setLocalQuery}
                  onSubmitEditing={() => handleSearch(localQuery)}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {localQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLocalQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Search Content */}
            <ScrollView 
              style={styles.searchContent} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Loading */}
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && !isSearching && (
                <View style={styles.resultsSection}>
                  <Text style={styles.sectionTitle}>Search Results</Text>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={`result-${index}`}
                      style={styles.resultItem}
                      onPress={() => handleResultPress(result)}
                    >
                      <View style={[styles.resultIcon, { backgroundColor: getResultColor(result.type) }]}>
                        <Ionicons name={getResultIcon(result.type)} size={16} color="white" />
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{result.title || 'Untitled'}</Text>
                        <Text style={styles.resultSubtitle}>{result.subtitle || result.description || ''}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && !isSearching && searchResults.length === 0 && localQuery.length === 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  {recentSearches.map((query, index) => (
                    <TouchableOpacity
                      key={`recent-${index}`}
                      style={styles.recentItem}
                      onPress={() => handleRecentSearchPress(query)}
                    >
                      <Ionicons name="time-outline" size={16} color="#9ca3af" />
                      <Text style={styles.recentText}>{query}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Quick Actions */}
              {!isSearching && searchResults.length === 0 && localQuery.length === 0 && (
                <View style={styles.quickActionsSection}>
                  <Text style={styles.sectionTitle}>Quick Search</Text>
                  <View style={styles.quickActionsGrid}>
                    <TouchableOpacity 
                      style={styles.quickActionItem}
                      onPress={() => handleQuickActionPress('ledgers')}
                    >
                      <Ionicons name="folder-outline" size={24} color="#3e60ab" />
                      <Text style={styles.quickActionText}>Ledgers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionItem}
                      onPress={() => handleQuickActionPress('vouchers')}
                    >
                      <Ionicons name="document-text-outline" size={24} color="#10b981" />
                      <Text style={styles.quickActionText}>Vouchers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionItem}
                      onPress={() => handleQuickActionPress('inventory')}
                    >
                      <Ionicons name="cube-outline" size={24} color="#8b5cf6" />
                      <Text style={styles.quickActionText}>Inventory</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionItem}
                      onPress={() => handleQuickActionPress('companies')}
                    >
                      <Ionicons name="business-outline" size={24} color="#f59e0b" />
                      <Text style={styles.quickActionText}>Companies</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* No Results */}
              {!isSearching && searchResults.length === 0 && localQuery.length > 0 && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color="#d1d5db" />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsSubtitle}>
                    Try searching with different keywords
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 0,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    ...FONT_STYLES.h5,
    flex: 1,
    paddingVertical: 8,
    color: '#111827'
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cancelButtonText: {
    ...FONT_STYLES.h5,
    color: '#3e60ab'
  },
  searchContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginTop: 20,
    marginBottom: 12
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  resultSubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginTop: 2
  },
  recentSection: {
    marginBottom: 20,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recentText: {
    ...FONT_STYLES.h5,
    color: '#374151',
    marginLeft: 12
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  quickActionText: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginTop: 8
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginTop: 16
  },
  noResultsSubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center'
  },
});