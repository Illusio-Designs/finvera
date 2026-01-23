import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gstAPI } from '../../../lib/api';

export default function GSTINsScreen({ navigation }) {
  const [gstins, setGstins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGstins();
  }, [searchQuery]);

  const loadGstins = async () => {
    setLoading(true);
    try {
      const response = await gstAPI.gstins.list();
      let gstins = response.data?.data || response.data || [];
      
      if (searchQuery) {
        gstins = gstins.filter(gstin => 
          gstin.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gstin.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gstin.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gstin.state.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setGstins(gstins);
    } catch (error) {
      console.error('Error loading GSTINs:', error);
      Alert.alert('Error', 'Failed to load GSTINs. Please check your connection.');
      setGstins([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGstins();
    setRefreshing(false);
  };

  const handleAddGstin = () => {
    navigation.navigate('AddGSTIN');
  };

  const handleGstinPress = (gstin) => {
    navigation.navigate('GSTINDetails', { gstinId: gstin.id });
  };

  const handleSetDefault = async (gstinId) => {
    try {
      await gstAPI.gstins.setDefault(gstinId);
      const updatedGstins = gstins.map(g => ({
        ...g,
        isDefault: g.id === gstinId
      }));
      setGstins(updatedGstins);
      Alert.alert('Success', 'Default GSTIN updated successfully');
    } catch (error) {
      console.error('Error setting default GSTIN:', error);
      Alert.alert('Error', 'Failed to set default GSTIN. Please check your connection.');
    }
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
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'suspended': return 'warning';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const GSTINCard = ({ gstin }) => (
    <TouchableOpacity 
      style={[styles.gstinCard, gstin.isDefault && styles.defaultCard]}
      onPress={() => handleGstinPress(gstin)}
    >
      {gstin.isDefault && (
        <View style={styles.defaultBadge}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.defaultText}>DEFAULT</Text>
        </View>
      )}
      
      <View style={styles.gstinHeader}>
        <View style={styles.gstinLeft}>
          <View style={styles.gstinIcon}>
            <Ionicons name="document-text" size={24} color="#3e60ab" />
          </View>
          <View style={styles.gstinInfo}>
            <Text style={styles.gstinNumber}>{gstin.gstin}</Text>
            <Text style={styles.legalName}>{gstin.legalName}</Text>
            <Text style={styles.tradeName}>{gstin.tradeName}</Text>
          </View>
        </View>
        <View style={styles.gstinRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gstin.status) }]}>
            <Ionicons 
              name={getStatusIcon(gstin.status)} 
              size={12} 
              color="white" 
            />
            <Text style={styles.statusText}>
              {gstin.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.gstinDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{gstin.state} ({gstin.stateCode})</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Registered: {formatDate(gstin.registrationDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="document-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Last Return: {gstin.lastReturn}</Text>
        </View>
      </View>
      
      <View style={styles.gstinFooter}>
        <Text style={styles.addressText} numberOfLines={2}>
          {gstin.address}
        </Text>
        <View style={styles.actionButtons}>
          {!gstin.isDefault && (
            <TouchableOpacity
              style={styles.setDefaultButton}
              onPress={() => handleSetDefault(gstin.id)}
            >
              <Text style={styles.setDefaultText}>Set Default</Text>
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const activeGstins = gstins.filter(g => g.status === 'active').length;
  const suspendedGstins = gstins.filter(g => g.status === 'suspended').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GSTIN Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddGstin}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{gstins.length}</Text>
          <Text style={styles.statLabel}>Total GSTINs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{activeGstins}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{suspendedGstins}</Text>
          <Text style={styles.statLabel}>Suspended</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search GSTIN, company name, or state..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* GSTIN List */}
      <ScrollView
        style={styles.gstinList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading GSTINs...</Text>
          </View>
        ) : gstins.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No GSTINs Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No GSTINs found for "${searchQuery}"`
                : 'Add your first GSTIN to manage GST compliance'
              }
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleAddGstin}
            >
              <Text style={styles.createButtonText}>Add GSTIN</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gstinContainer}>
            {gstins.map((gstin) => (
              <GSTINCard key={gstin.id} gstin={gstin} />
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Agency',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    fontFamily: 'Agency',
  },
  gstinList: {
    flex: 1,
  },
  gstinContainer: {
    padding: 16,
  },
  gstinCard: {
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
  defaultCard: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Agency',
  },
  gstinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  gstinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 60,
  },
  gstinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gstinInfo: {
    flex: 1,
  },
  gstinNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  legalName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  tradeName: {
    fontSize: 12,
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  gstinRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Agency',
  },
  gstinDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontFamily: 'Agency',
  },
  gstinFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setDefaultButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f4fc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  setDefaultText: {
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