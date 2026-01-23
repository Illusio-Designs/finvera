import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { companyAPI } from '../../../lib/api';

export default function CompaniesScreen({ navigation }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await companyAPI.list();
      const companies = response.data?.data || response.data || [];
      setCompanies(companies);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies. Please check your connection.');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompanies();
    setRefreshing(false);
  };

  const handleCreateCompany = () => {
    navigation.navigate('CreateCompany');
  };

  const handleCompanyPress = (company) => {
    navigation.navigate('CompanyDetails', { companyId: company.id });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const CompanyCard = ({ company }) => (
    <TouchableOpacity 
      style={styles.companyCard}
      onPress={() => handleCompanyPress(company)}
    >
      <View style={styles.companyHeader}>
        <View style={styles.companyIcon}>
          <Ionicons name="business" size={24} color="#3e60ab" />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyGstin}>GSTIN: {company.gstin}</Text>
          <Text style={styles.companyAddress}>{company.address}</Text>
        </View>
        <View style={styles.companyStatus}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: company.status === 'active' ? '#10b981' : '#6b7280' }
          ]}>
            <Text style={styles.statusText}>
              {company.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.companyFooter}>
        <View style={styles.companyStats}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text style={styles.statText}>{company.branches} Branches</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.statText}>Created {formatDate(company.createdAt)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Companies</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateCompany}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{companies.length}</Text>
          <Text style={styles.statLabel}>Total Companies</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {companies.filter(c => c.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {companies.reduce((sum, c) => sum + c.branches, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Branches</Text>
        </View>
      </View>

      {/* Company List */}
      <ScrollView
        style={styles.companyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading companies...</Text>
          </View>
        ) : companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Companies Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first company to get started with managing your business
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateCompany}
            >
              <Text style={styles.createButtonText}>Create Company</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.companyContainer}>
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
  companyList: {
    flex: 1,
  },
  companyContainer: {
    padding: 16,
  },
  companyCard: {
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
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  companyGstin: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  companyAddress: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  companyStatus: {
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
  companyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  companyStats: {
    flexDirection: 'row',
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
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