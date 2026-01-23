import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { branchAPI } from '../../../lib/api';

export default function BranchesScreen({ navigation }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBranches();
  }, [searchQuery]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const response = await branchAPI.list();
      let branches = response.data?.data || response.data || [];
      
      if (searchQuery) {
        branches = branches.filter(branch => 
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (branch.manager && branch.manager.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      setBranches(branches);
    } catch (error) {
      console.error('Error loading branches:', error);
      Alert.alert('Error', 'Failed to load branches. Please check your connection.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBranches();
    setRefreshing(false);
  };

  const handleCreateBranch = () => {
    navigation.navigate('CreateBranch');
  };

  const handleBranchPress = (branch) => {
    navigation.navigate('BranchDetails', { branchId: branch.id });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const BranchCard = ({ branch }) => (
    <TouchableOpacity 
      style={styles.branchCard}
      onPress={() => handleBranchPress(branch)}
    >
      <View style={styles.branchHeader}>
        <View style={styles.branchLeft}>
          <View style={styles.branchIcon}>
            <Ionicons name="location" size={24} color="#3e60ab" />
          </View>
          <View style={styles.branchInfo}>
            <Text style={styles.branchName}>{branch.name}</Text>
            <Text style={styles.branchCode}>Code: {branch.code}</Text>
            <Text style={styles.branchManager}>Manager: {branch.manager}</Text>
          </View>
        </View>
        <View style={styles.branchStatus}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: branch.status === 'active' ? '#10b981' : '#6b7280' }
          ]}>
            <Text style={styles.statusText}>
              {branch.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.branchAddress}>
        <Ionicons name="location-outline" size={16} color="#6b7280" />
        <Text style={styles.addressText}>{branch.address}</Text>
      </View>
      
      <View style={styles.branchFooter}>
        <View style={styles.branchStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color="#6b7280" />
            <Text style={styles.statText}>{branch.employees} Employees</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="call" size={16} color="#6b7280" />
            <Text style={styles.statText}>{branch.phone}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const activeBranches = branches.filter(b => b.status === 'active').length;
  const totalEmployees = branches.reduce((sum, b) => sum + b.employees, 0);

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
        <Text style={styles.headerTitle}>Branches</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateBranch}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{branches.length}</Text>
          <Text style={styles.statLabel}>Total Branches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeBranches}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalEmployees}</Text>
          <Text style={styles.statLabel}>Total Employees</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search branches..."
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

      {/* Branch List */}
      <ScrollView
        style={styles.branchList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading branches...</Text>
          </View>
        ) : branches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Branches Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No branches found for "${searchQuery}"`
                : 'Create your first branch to expand your business'
              }
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateBranch}
            >
              <Text style={styles.createButtonText}>Create Branch</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.branchContainer}>
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
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
    fontSize: 24,
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
  branchList: {
    flex: 1,
  },
  branchContainer: {
    padding: 16,
  },
  branchCard: {
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
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  branchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  branchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  branchCode: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  branchManager: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  branchStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Agency',
  },
  branchAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 60,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Agency',
  },
  branchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  branchStats: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
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