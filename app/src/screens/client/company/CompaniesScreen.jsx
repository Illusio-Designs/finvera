import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { companyAPI } from '../../../lib/api';

export default function CompaniesScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await companyAPI.list();
      const data = response.data?.data || response.data || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Companies fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load companies'
      });
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCompanies();
    setRefreshing(false);
  }, [fetchCompanies]);

  const handleCompanyPress = (company) => {
    showNotification(`View details for ${company.company_name || company.name}`, 'info');
  };

  const handleCreateCompany = () => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Create new company functionality will be available soon'
    });
  };

  const getCompanyTypeColor = (type) => {
    const colors = {
      'private_limited': '#3e60ab',
      'public_limited': '#10b981',
      'partnership': '#f59e0b',
      'proprietorship': '#8b5cf6',
      'llp': '#ef4444',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const getCompanyTypeIcon = (type) => {
    const icons = {
      'private_limited': 'business',
      'public_limited': 'storefront',
      'partnership': 'people',
      'proprietorship': 'person',
      'llp': 'shield',
    };
    return icons[type?.toLowerCase()] || 'business';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Companies" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Create Company Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateCompany}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create New Company</Text>
        </TouchableOpacity>

        {/* Companies List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading companies...</Text>
          </View>
        ) : companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Companies Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first company to get started with Finvera
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateCompany}>
              <Text style={styles.emptyButtonText}>Create Company</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.companiesList}>
            {companies.map((company, index) => (
              <TouchableOpacity
                key={company.id || index}
                style={styles.companyCard}
                onPress={() => handleCompanyPress(company)}
              >
                <View style={styles.companyCardHeader}>
                  <View style={[
                    styles.companyIcon, 
                    { backgroundColor: getCompanyTypeColor(company.company_type) }
                  ]}>
                    <Ionicons 
                      name={getCompanyTypeIcon(company.company_type)} 
                      size={24} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>
                      {company.company_name || company.name || 'Unnamed Company'}
                    </Text>
                    <Text style={styles.companyType}>
                      {company.company_type?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                    </Text>
                  </View>
                  <View style={styles.companyStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: company.is_active ? '#10b981' : '#ef4444' }
                    ]}>
                      <Text style={styles.statusText}>
                        {company.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.companyCardBody}>
                  <View style={styles.companyDetail}>
                    <Ionicons name="card-outline" size={16} color="#6b7280" />
                    <Text style={styles.companyDetailText}>
                      GSTIN: {company.gstin || 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.companyDetail}>
                    <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                    <Text style={styles.companyDetailText}>
                      PAN: {company.pan || 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.companyDetail}>
                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                    <Text style={styles.companyDetailText} numberOfLines={1}>
                      {company.address || 'Address not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.companyCardFooter}>
                  <View style={styles.companyStats}>
                    <View style={styles.companyStat}>
                      <Text style={styles.companyStatValue}>
                        {company.branch_count || 0}
                      </Text>
                      <Text style={styles.companyStatLabel}>Branches</Text>
                    </View>
                    <View style={styles.companyStat}>
                      <Text style={styles.companyStatValue}>
                        {company.user_count || 0}
                      </Text>
                      <Text style={styles.companyStatLabel}>Users</Text>
                    </View>
                    <View style={styles.companyStat}>
                      <Text style={styles.companyStatValue}>
                        {formatDate(company.created_at)}
                      </Text>
                      <Text style={styles.companyStatLabel}>Created</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.companyAction}>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    marginLeft: 8,
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
  companiesList: {
    gap: 12,
  },
  companyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  companyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  companyType: {
    fontSize: 12,
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
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  companyCardBody: {
    marginBottom: 12,
    gap: 8,
  },
  companyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyDetailText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    flex: 1,
  },
  companyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  companyStats: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  companyStat: {
    alignItems: 'center',
  },
  companyStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  companyStatLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  companyAction: {
    padding: 4,
  },
});