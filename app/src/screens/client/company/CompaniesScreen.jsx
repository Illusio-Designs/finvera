import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { quickNotifications } from '../../../services/globalNotificationService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { companyAPI, branchAPI } from '../../../lib/api';
import CreateCompanyModal from '../../../components/modals/CreateCompanyModal';
import CreateBranchModal from '../../../components/modals/CreateBranchModal';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

const { width } = Dimensions.get('window');

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship', icon: 'person' },
  { value: 'partnership_firm', label: 'Partnership Firm', icon: 'people' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)', icon: 'business' },
  { value: 'opc', label: 'One Person Company (OPC)', icon: 'person-circle' },
  { value: 'private_limited', label: 'Private Limited Company', icon: 'business' },
  { value: 'public_limited', label: 'Public Limited Company', icon: 'library' },
  { value: 'section_8', label: 'Section 8 Company (Non-profit)', icon: 'heart' },
];

export default function CompaniesScreen({ isPostLogin = false, onSelectionComplete }) {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { user, switchCompany } = useAuth();
  const {
    subscription,
    hasMultiCompanyAccess,
    hasMultiBranchAccess,
    canCreateCompany,
    canCreateBranch,
    getMaxCompanies,
    getMaxBranches,
    getPlanType,
    getPlanName,
  } = useSubscription();
  
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('companies');
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  // Determine which tab to show based on plan type
  const getDefaultTab = useCallback(() => {
    const planType = getPlanType();
    if (planType === 'multi-company') {
      return 'companies';
    } else if (planType === 'multi-branch') {
      return 'branches';
    }
    return 'companies';
  }, [getPlanType]);

  // Check if we should show both tabs or just one based on plan
  const shouldShowBothTabs = () => {
    return hasMultiCompanyAccess() && hasMultiBranchAccess();
  };

  const fetchData = useCallback(async () => {
    try {
      const companiesRes = await companyAPI.list().catch(() => ({ data: { data: [] } }));
      const companiesList = companiesRes?.data?.data || companiesRes?.data || [];
      setCompanies(companiesList);
      
      // If we have companies, fetch branches for the current company
      if (companiesList.length > 0 && user?.company_id) {
        const branchesRes = await branchAPI.list(user.company_id).catch(() => ({ data: { data: [] } }));
        setBranches(branchesRes?.data?.data || branchesRes?.data || []);
      }

      // Set default tab based on plan type
      setActiveTab(getDefaultTab());
    } catch (error) {
      console.error('Companies fetch error:', error);
      showNotification(quickNotifications.networkError());
      setCompanies([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification, user?.company_id, getDefaultTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCompanyPress = (company) => {
    setSelectedCompany(company);
    setShowDetailModal(true);
  };

  const handleSwitchCompany = async (companyId) => {
    try {
      console.log('🔄 Attempting to switch to company:', companyId);
      console.log('🔄 Current user company_id:', user?.company_id);
      
      if (switchCompany) {
        const result = await switchCompany(companyId);
        console.log('🔄 Switch company result:', result);
        
        if (result.success) {
          showNotification(quickNotifications.companySwitched());
          setShowDetailModal(false);
          
          // Refresh the data to reflect the new current company
          await fetchData();
          
          if (isPostLogin && onSelectionComplete) {
            onSelectionComplete();
          }
        } else {
          showNotification(quickNotifications.companySwitchFailed());
        }
      } else {
        console.log('❌ switchCompany function not available');
        showNotification(quickNotifications.companySwitchFailed());
      }
    } catch (error) {
      console.error('Switch company error:', error);
      showNotification(quickNotifications.companySwitchFailed());
    }
  };

  const handleBranchPress = (branch) => {
    showNotification({
      type: 'info',
      title: 'Branch Selected',
      message: `Selected branch: ${branch.branch_name}`,
      duration: 3000
    });
    // TODO: Implement branch switching functionality when backend supports it
  };

  const getCompanyTypeInfo = (type) => {
    const companyType = COMPANY_TYPES.find(t => t.value === type);
    return companyType || { label: type?.replace('_', ' ').toUpperCase() || 'GENERAL', icon: 'business' };
  };

  const getCompanyTypeColor = (type) => {
    const colors = {
      'private_limited': '#3e60ab',
      'public_limited': '#10b981',
      'partnership_firm': '#f59e0b',
      'sole_proprietorship': '#8b5cf6',
      'llp': '#ef4444',
      'opc': '#06b6d4',
      'section_8': '#84cc16',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const renderCompanyCard = (company, index) => {
    const typeInfo = getCompanyTypeInfo(company.company_type);
    const typeColor = getCompanyTypeColor(company.company_type);
    const isCurrentCompany = user?.company_id === company.id;

    return (
      <View
        key={company.id}
        style={[
          styles.companyCard,
          isCurrentCompany && styles.currentCompanyCard
        ]}
      >
        {isCurrentCompany && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
        
        {/* Touchable area for card content (excluding actions) */}
        <TouchableOpacity
          style={styles.companyCardContent}
          onPress={() => handleCompanyPress(company)}
          activeOpacity={0.7}
        >
          <View style={styles.companyHeader}>
            <View style={[styles.companyIcon, { backgroundColor: `${typeColor}15` }]}>
              <Ionicons name={typeInfo.icon} size={24} color={typeColor} />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName} numberOfLines={2}>
                {company.company_name}
              </Text>
              <View style={[styles.companyTypeBadge, { backgroundColor: `${typeColor}15` }]}>
                <Text style={[styles.companyTypeText, { color: typeColor }]}>
                  {typeInfo.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.companyDetails}>
            {company.gstin && (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>GSTIN:</Text>
                <Text style={styles.detailValue}>{company.gstin}</Text>
              </View>
            )}
            
            {company.pan && (
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>PAN:</Text>
                <Text style={styles.detailValue}>{company.pan}</Text>
              </View>
            )}
            
            {company.state && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>State:</Text>
                <Text style={styles.detailValue}>{company.state}</Text>
              </View>
            )}
            
            {company.contact_number && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{company.contact_number}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Action buttons - separate from card content */}
        <View style={styles.companyActions}>
          {!isCurrentCompany && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSwitchCompany(company.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={16} color="#3e60ab" />
              <Text style={styles.switchButtonText}>Switch</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCompanyPress(company);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={16} color="#6b7280" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="business-outline" size={64} color="#d1d5db" />
      </View>
      <Text style={styles.emptyTitle}>No Companies Found</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'companies' 
          ? 'Create your first company to get started with accounting'
          : 'No branches found for the current company'
        }
      </Text>
      
      {activeTab === 'companies' && canCreateCompany() && companies.length < getMaxCompanies() && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateCompanyModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Company</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCompanyDetailModal = () => {
    if (!selectedCompany) return null;
    
    const typeInfo = getCompanyTypeInfo(selectedCompany.company_type);
    const typeColor = getCompanyTypeColor(selectedCompany.company_type);
    const isCurrentCompany = user?.company_id === selectedCompany.id;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Company Details</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Company Header */}
            <View style={styles.modalCompanyHeader}>
              <View style={[styles.modalCompanyIcon, { backgroundColor: `${typeColor}15` }]}>
                <Ionicons name={typeInfo.icon} size={32} color={typeColor} />
              </View>
              <View style={styles.modalCompanyInfo}>
                <Text style={styles.modalCompanyName}>{selectedCompany.company_name}</Text>
                <View style={[styles.modalCompanyTypeBadge, { backgroundColor: `${typeColor}15` }]}>
                  <Text style={[styles.modalCompanyTypeText, { color: typeColor }]}>
                    {typeInfo.label}
                  </Text>
                </View>
                {isCurrentCompany && (
                  <View style={styles.modalCurrentBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.modalCurrentBadgeText}>Current Company</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Company Details Sections */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Basic Information</Text>
              <View style={styles.modalSectionContent}>
                {selectedCompany.registration_number && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Registration Number</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.registration_number}</Text>
                  </View>
                )}
                
                {selectedCompany.incorporation_date && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Incorporation Date</Text>
                    <Text style={styles.modalDetailValue}>
                      {new Date(selectedCompany.incorporation_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tax Information */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Tax Information</Text>
              <View style={styles.modalSectionContent}>
                {selectedCompany.gstin && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>GSTIN</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.gstin}</Text>
                  </View>
                )}
                
                {selectedCompany.pan && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>PAN</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.pan}</Text>
                  </View>
                )}
                
                {selectedCompany.tan && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>TAN</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.tan}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Contact Information</Text>
              <View style={styles.modalSectionContent}>
                {selectedCompany.registered_address && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Address</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.registered_address}</Text>
                  </View>
                )}
                
                {selectedCompany.state && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>State</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.state}</Text>
                  </View>
                )}
                
                {selectedCompany.pincode && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>PIN Code</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.pincode}</Text>
                  </View>
                )}
                
                {selectedCompany.contact_number && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Phone</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.contact_number}</Text>
                  </View>
                )}
                
                {selectedCompany.email && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Email</Text>
                    <Text style={styles.modalDetailValue}>{selectedCompany.email}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            {!isCurrentCompany && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalSwitchButton}
                  onPress={() => handleSwitchCompany(selectedCompany.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="swap-horizontal" size={20} color="white" />
                  <Text style={styles.modalSwitchButtonText}>Switch to this Company</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Bottom padding to prevent overlap with bottom navigation */}
            <View style={styles.modalBottomPadding} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title={isPostLogin ? "Select Company" : "Companies"} 
          onMenuPress={isPostLogin ? undefined : handleMenuPress}
          showBackButton={!isPostLogin}
          onBackPress={isPostLogin ? undefined : () => navigation.goBack()}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={{ width: 200, height: 28, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: 300, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
          </View>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title={isPostLogin ? "Select Company" : "Companies"} 
        onMenuPress={isPostLogin ? undefined : handleMenuPress}
        showBackButton={!isPostLogin}
        onBackPress={isPostLogin ? undefined : () => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isPostLogin ? "Select Your Company" : "Manage Companies"}
          </Text>
          <Text style={styles.subtitle}>
            {isPostLogin 
              ? "Choose a company to continue to your dashboard" 
              : "Switch between companies or create new ones"
            }
          </Text>
        </View>

        {/* Tab Navigation */}
        {shouldShowBothTabs() && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'companies' && styles.activeTab]}
              onPress={() => setActiveTab('companies')}
            >
              <Ionicons 
                name="business" 
                size={20} 
                color={activeTab === 'companies' ? '#3e60ab' : '#6b7280'} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'companies' && styles.activeTabText
              ]}>
                Companies
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'branches' && styles.activeTab]}
              onPress={() => setActiveTab('branches')}
            >
              <Ionicons 
                name="git-branch" 
                size={20} 
                color={activeTab === 'branches' ? '#3e60ab' : '#6b7280'} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'branches' && styles.activeTabText
              ]}>
                Branches
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Plan Information Banner */}
        {subscription && (
          <View style={styles.planBanner}>
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Ionicons name="diamond" size={20} color="#3e60ab" />
                <Text style={styles.planText}>
                  {getPlanName()} Plan
                </Text>
              </View>
              <View style={styles.planTypeIndicator}>
                <Text style={styles.planTypeText}>
                  {getPlanType() === 'multi-company' ? 'Multi-Company' : 'Multi-Branch'}
                </Text>
              </View>
            </View>
            
            <View style={styles.planLimitsContainer}>
              {(getPlanType() === 'multi-company' || shouldShowBothTabs()) && (
                <>
                  <View style={styles.planLimit}>
                    <Text style={styles.planLimitLabel}>Companies</Text>
                    <Text style={[
                      styles.planLimitValue,
                      companies.length >= getMaxCompanies() && styles.planLimitReached
                    ]}>
                      {companies.length}/{getMaxCompanies()}
                    </Text>
                  </View>
                  {shouldShowBothTabs() && <View style={styles.planLimitSeparator} />}
                </>
              )}
              {(getPlanType() === 'multi-branch' || shouldShowBothTabs()) && (
                <View style={styles.planLimit}>
                  <Text style={styles.planLimitLabel}>Branches</Text>
                  <Text style={[
                    styles.planLimitValue,
                    branches.length >= getMaxBranches() && styles.planLimitReached
                  ]}>
                    {branches.length}/{getMaxBranches()}
                  </Text>
                </View>
              )}
            </View>

            {/* Create Button */}
            {activeTab === 'companies' && canCreateCompany() && companies.length < getMaxCompanies() && (
              <TouchableOpacity
                style={styles.planCreateButton}
                onPress={() => setShowCreateCompanyModal(true)}
              >
                <Ionicons name="add" size={16} color="#3e60ab" />
                <Text style={styles.planCreateButtonText}>Create Company</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Companies List */}
        {activeTab === 'companies' && (
          <View style={styles.companiesContainer}>
            {companies.length > 0 ? (
              companies.map((company, index) => renderCompanyCard(company, index))
            ) : (
              renderEmptyState()
            )}
          </View>
        )}

        {/* Branches List */}
        {activeTab === 'branches' && (
          <View style={styles.branchesContainer}>
            {branches.length > 0 ? (
              branches.map((branch, index) => (
                <TouchableOpacity
                  key={branch.id}
                  style={styles.branchCard}
                  onPress={() => handleBranchPress(branch)}
                >
                  <View style={styles.branchHeader}>
                    <Ionicons name="git-branch" size={24} color="#3e60ab" />
                    <View style={styles.branchInfo}>
                      <Text style={styles.branchName}>{branch.branch_name}</Text>
                      {branch.branch_code && (
                        <Text style={styles.branchCode}>Code: {branch.branch_code}</Text>
                      )}
                    </View>
                  </View>
                  
                  {branch.address && (
                    <Text style={styles.branchAddress} numberOfLines={2}>
                      {branch.address}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              renderEmptyState()
            )}
          </View>
        )}

        {/* Upgrade Prompt */}
        {((activeTab === 'companies' && companies.length >= getMaxCompanies()) ||
          (activeTab === 'branches' && branches.length >= getMaxBranches())) && (
          <View style={styles.upgradePrompt}>
            <Ionicons name="arrow-up-circle" size={24} color="#3e60ab" />
            <Text style={styles.upgradePromptText}>
              You've reached your plan limit. Upgrade to create more {activeTab}.
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderCompanyDetailModal()}
      
      <CreateCompanyModal
        visible={showCreateCompanyModal}
        onClose={() => setShowCreateCompanyModal(false)}
        onSuccess={() => {
          setShowCreateCompanyModal(false);
          fetchData();
        }}
      />
      
      <CreateBranchModal
        visible={showCreateBranchModal}
        onClose={() => setShowCreateBranchModal(false)}
        onSuccess={() => {
          setShowCreateBranchModal(false);
          fetchData();
        }}
      />
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
    paddingBottom: 120, // Extra padding to prevent overlap with bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
  },
  
  // Header Styles
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    ...FONT_STYLES.h1,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...FONT_STYLES.label,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3e60ab',
  },

  // Plan Banner Styles
  planBanner: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planText: {
    ...FONT_STYLES.h5,
    fontWeight: '600',
    color: '#111827',
  },
  planTypeIndicator: {
    backgroundColor: '#3e60ab15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planTypeText: {
    ...FONT_STYLES.caption,
    fontWeight: '600',
    color: '#3e60ab',
  },
  planLimitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planLimit: {
    flex: 1,
    alignItems: 'center',
  },
  planLimitLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  planLimitValue: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  planLimitReached: {
    color: '#ef4444',
  },
  planLimitSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  planCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  planCreateButtonText: {
    ...FONT_STYLES.button,
    color: '#3e60ab',
  },

  // Company Card Styles
  companiesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  companyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  currentCompanyCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  companyCardContent: {
    // This wraps the touchable content area
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  currentBadgeText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    color: 'white',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 6,
  },
  companyTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  companyTypeText: {
    ...FONT_STYLES.caption,
    fontWeight: '600',
  },
  companyDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    minWidth: 60,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#111827',
    flex: 1,
  },
  companyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  switchButtonText: {
    ...FONT_STYLES.label,
    fontWeight: '600',
    color: '#3e60ab',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    ...FONT_STYLES.label,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Branch Card Styles
  branchesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  branchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    ...FONT_STYLES.h5,
    fontWeight: '600',
    color: '#111827',
  },
  branchCode: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2,
  },
  branchAddress: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },

  // Upgrade Prompt Styles
  upgradePrompt: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  upgradePromptText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 8,
  },
  upgradeButton: {
    backgroundColor: '#3e60ab',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  upgradeButtonText: {
    ...FONT_STYLES.label,
    fontWeight: '600',
    color: 'white',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  modalHeaderSpacer: {
    width: 32,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding to prevent overlap with bottom navigation
  },
  modalBottomPadding: {
    height: 80, // Additional padding at the bottom
  },
  modalCompanyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  modalCompanyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCompanyInfo: {
    flex: 1,
  },
  modalCompanyName: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8,
  },
  modalCompanyTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalCompanyTypeText: {
    ...FONT_STYLES.label,
    fontWeight: '600',
  },
  modalCurrentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalCurrentBadgeText: {
    ...FONT_STYLES.label,
    fontWeight: '600',
    color: '#10b981',
  },
  modalSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalSectionTitle: {
    ...FONT_STYLES.h5,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  modalSectionContent: {
    gap: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  modalDetailLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    flex: 1,
  },
  modalDetailValue: {
    ...FONT_STYLES.label,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  modalActions: {
    paddingTop: 20,
  },
  modalSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalSwitchButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
});