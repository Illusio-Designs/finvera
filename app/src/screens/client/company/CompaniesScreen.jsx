import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { companyAPI, branchAPI } from '../../../lib/api';

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership_firm', label: 'Partnership Firm' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'opc', label: 'One Person Company (OPC)' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'section_8', label: 'Section 8 Company (Non-profit)' },
];

export default function CompaniesScreen({ isPostLogin = false, onSelectionComplete }) {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { user, switchCompany } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [activeTab, setActiveTab] = useState('companies'); // 'companies' or 'branches'

  const handleMenuPress = () => {
    openDrawer();
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
      
      // Set default status since status API doesn't exist
      setStatus({
        company_count: companiesList.length,
        max_companies: 5, // Default limit
        branch_count: branches.length,
        max_branches: 10 // Default limit
      });
      // Set default subscription since subscription API doesn't exist
      setSubscription({
        plan_type: 'basic',
        multi_company: companiesList.length > 1,
        multi_branch: branches.length > 1
      });

      // For post-login flow, determine which tab to show
      if (isPostLogin) {
        if (companiesList.length > 1) {
          setActiveTab('companies');
        } else if (branches.length > 1) {
          setActiveTab('branches');
        }
      }
    } catch (error) {
      console.error('Companies fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load companies data'
      });
      setCompanies([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification, user?.company_id, isPostLogin, branches.length]);

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
      if (switchCompany) {
        await switchCompany(companyId);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Company switched successfully'
        });
        setShowDetailModal(false);
        
        // If this is post-login flow, complete the selection
        if (isPostLogin && onSelectionComplete) {
          onSelectionComplete();
        }
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to switch company'
      });
    }
  };

  const handleBranchPress = (branch) => {
    setSelectedBranch(branch);
    setShowBranchModal(true);
  };

  const handleSwitchBranch = async (branchId) => {
    try {
      // In a real app, you would have a switchBranch function
      // For now, we'll just show success and close modal
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Branch switched successfully'
      });
      setShowBranchModal(false);
      
      // If this is post-login flow, complete the selection
      if (isPostLogin && onSelectionComplete) {
        onSelectionComplete();
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to switch branch'
      });
    }
  };

  const shouldShowPostLoginSelection = () => {
    return isPostLogin && (companies.length > 1 || branches.length > 1);
  };

  const canCreateMore = false; // Disabled - View & Switch only

  const getCompanyTypeLabel = (type) => {
    const companyType = COMPANY_TYPES.find(t => t.value === type);
    return companyType ? companyType.label : type?.replace('_', ' ').toUpperCase() || 'GENERAL';
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

  const getCompanyTypeIcon = (type) => {
    const icons = {
      'private_limited': 'business',
      'public_limited': 'storefront',
      'partnership_firm': 'people',
      'sole_proprietorship': 'person',
      'llp': 'shield',
      'opc': 'person-circle',
      'section_8': 'heart',
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

  const isCurrentCompany = (companyId) => {
    return user?.company_id === companyId;
  };

  const isCurrentBranch = (branchId) => {
    return user?.branch_id === branchId;
  };

  const getBranchIcon = (branch) => {
    return branch.is_head_office ? 'business' : 'storefront';
  };

  const getBranchColor = (branch) => {
    return branch.is_head_office ? '#3e60ab' : '#10b981';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title={isPostLogin ? "Select Company & Branch" : "Companies"} 
        onMenuPress={isPostLogin ? null : handleMenuPress}
        showBackButton={isPostLogin}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Post-login selection header */}
        {shouldShowPostLoginSelection() && (
          <View style={styles.postLoginHeader}>
            <Text style={styles.postLoginTitle}>Welcome to Finvera!</Text>
            <Text style={styles.postLoginSubtitle}>
              {companies.length > 1 && branches.length > 1 
                ? 'Please select your company and branch to continue'
                : companies.length > 1 
                ? 'Please select your company to continue'
                : 'Please select your branch to continue'
              }
            </Text>
          </View>
        )}

        {/* Tab Navigation - only show if we have both companies and branches */}
        {(companies.length > 1 || branches.length > 1) && (
          <View style={styles.tabContainer}>
            {companies.length > 1 && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'companies' && styles.activeTab]}
                onPress={() => setActiveTab('companies')}
              >
                <Ionicons 
                  name="business" 
                  size={20} 
                  color={activeTab === 'companies' ? 'white' : '#64748b'} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'companies' && styles.activeTabText
                ]}>
                  Companies ({companies.length})
                </Text>
              </TouchableOpacity>
            )}
            
            {branches.length > 1 && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'branches' && styles.activeTab]}
                onPress={() => setActiveTab('branches')}
              >
                <Ionicons 
                  name="storefront" 
                  size={20} 
                  color={activeTab === 'branches' ? 'white' : '#64748b'} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'branches' && styles.activeTabText
                ]}>
                  Branches ({branches.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Companies Tab Content */}
        {activeTab === 'companies' && (
          <>
            {/* Companies List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                  <View style={styles.spinner} />
                  <Text style={styles.loadingText}>Loading companies...</Text>
                </View>
              </View>
            ) : companies.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="business-outline" size={64} color="#94a3b8" />
                  </View>
                  <Text style={styles.emptyTitle}>No Companies Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {isPostLogin 
                      ? 'No companies available for selection'
                      : 'No companies found in your account'
                    }
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.companiesList}>
                {companies.map((company, index) => (
                  <TouchableOpacity
                    key={company.id || index}
                    style={[
                      styles.companyCard,
                      isCurrentCompany(company.id) && styles.currentCompanyCard
                    ]}
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
                        <View style={styles.companyNameRow}>
                          <Text style={styles.companyName}>
                            {company.company_name || company.name || 'Unnamed Company'}
                          </Text>
                        </View>
                        <View style={styles.companyMetaRow}>
                          <Text style={styles.companyType}>
                            {getCompanyTypeLabel(company.company_type)}
                          </Text>
                          {isCurrentCompany(company.id) && (
                            <View style={styles.currentBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="white" />
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.companyStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: company.is_active ? '#10b981' : '#ef4444' }
                        ]}>
                          <Ionicons 
                            name={company.is_active ? 'checkmark' : 'close'} 
                            size={12} 
                            color="white" 
                          />
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
                          {company.registered_address || company.address || 'Address not provided'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.companyCardFooter}>
                      <View style={styles.companyStats}>
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
          </>
        )}

        {/* Branches Tab Content */}
        {activeTab === 'branches' && (
          <>
            {/* Branches List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                  <View style={styles.spinner} />
                  <Text style={styles.loadingText}>Loading branches...</Text>
                </View>
              </View>
            ) : branches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="storefront-outline" size={64} color="#94a3b8" />
                  </View>
                  <Text style={styles.emptyTitle}>No Branches Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {isPostLogin 
                      ? 'No branches available for selection'
                      : 'No branches available for the current company'
                    }
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.branchesList}>
                {branches.map((branch, index) => (
                  <TouchableOpacity
                    key={branch.id || index}
                    style={[
                      styles.branchCard,
                      isCurrentBranch(branch.id) && styles.currentBranchCard
                    ]}
                    onPress={() => handleBranchPress(branch)}
                  >
                    <View style={styles.branchCardHeader}>
                      <View style={[
                        styles.branchIcon, 
                        { backgroundColor: getBranchColor(branch) }
                      ]}>
                        <Ionicons 
                          name={getBranchIcon(branch)} 
                          size={24} 
                          color="white" 
                        />
                      </View>
                      <View style={styles.branchInfo}>
                        <View style={styles.branchNameRow}>
                          <Text style={styles.branchName}>
                            {branch.branch_name || branch.name || 'Unnamed Branch'}
                          </Text>
                        </View>
                        <View style={styles.branchMetaRow}>
                          <Text style={styles.branchCode}>
                            Code: {branch.branch_code || 'N/A'}
                          </Text>
                          <View style={styles.branchBadges}>
                            {isCurrentBranch(branch.id) && (
                              <View style={styles.currentBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="white" />
                                <Text style={styles.currentBadgeText}>Current</Text>
                              </View>
                            )}
                            {branch.is_head_office && (
                              <View style={styles.headOfficeBadge}>
                                <Text style={styles.headOfficeBadgeText}>HO</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.branchStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: branch.is_active ? '#10b981' : '#ef4444' }
                        ]}>
                          <Ionicons 
                            name={branch.is_active ? 'checkmark' : 'close'} 
                            size={12} 
                            color="white" 
                          />
                          <Text style={styles.statusText}>
                            {branch.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.branchCardBody}>
                      <View style={styles.branchDetail}>
                        <Ionicons name="card-outline" size={16} color="#6b7280" />
                        <Text style={styles.branchDetailText}>
                          GSTIN: {branch.gstin || 'Not provided'}
                        </Text>
                      </View>
                      <View style={styles.branchDetail}>
                        <Ionicons name="location-outline" size={16} color="#6b7280" />
                        <Text style={styles.branchDetailText} numberOfLines={1}>
                          {branch.address || 'Address not provided'}
                        </Text>
                      </View>
                      <View style={styles.branchDetail}>
                        <Ionicons name="call-outline" size={16} color="#6b7280" />
                        <Text style={styles.branchDetailText}>
                          {branch.contact_number || 'No contact'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.branchCardFooter}>
                      <View style={styles.branchStats}>
                        <View style={styles.branchStat}>
                          <Text style={styles.branchStatValue}>
                            {branch.city || 'Unknown'}
                          </Text>
                          <Text style={styles.branchStatLabel}>City</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.branchAction}>
                        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Company Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Company Details</Text>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedCompany && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Company Name:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.company_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{getCompanyTypeLabel(selectedCompany.company_type)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GSTIN:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.gstin || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PAN:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.pan || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TAN:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.tan || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registration Number:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.registration_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.registered_address || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.state || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.contact_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedCompany.email || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                {!isCurrentCompany(selectedCompany.id) && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.switchButton]}
                    onPress={() => handleSwitchCompany(selectedCompany.id)}
                  >
                    <Ionicons name="swap-horizontal" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Switch to this Company</Text>
                  </TouchableOpacity>
                )}
                
                {isCurrentCompany(selectedCompany.id) && (
                  <View style={[styles.actionButton, styles.currentButton]}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Current Company</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Branch Detail Modal */}
      <Modal
        visible={showBranchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Branch Details</Text>
            <TouchableOpacity 
              onPress={() => setShowBranchModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedBranch && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Branch Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Branch Name:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.branch_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Branch Code:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.branch_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.is_head_office ? 'Head Office' : 'Branch Office'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GSTIN:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.gstin || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.address || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.city || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.state || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.pincode || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.contact_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedBranch.email || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                {!isCurrentBranch(selectedBranch.id) && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.switchButton]}
                    onPress={() => handleSwitchBranch(selectedBranch.id)}
                  >
                    <Ionicons name="swap-horizontal" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Switch to this Branch</Text>
                  </TouchableOpacity>
                )}
                
                {isCurrentBranch(selectedBranch.id) && (
                  <View style={[styles.actionButton, styles.currentButton]}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Current Branch</Text>
                  </View>
                )}
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  postLoginHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  postLoginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  postLoginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    backgroundColor: '#3e60ab',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  activeTabText: {
    color: 'white',
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
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 24,
  },
  companiesList: {
    gap: 12,
  },
  companyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  currentCompanyCard: {
    borderWidth: 2,
    borderColor: '#3e60ab',
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
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
  },
  companyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyType: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    flex: 1,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  companyStatus: {
    alignItems: 'flex-end',
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
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    textTransform: 'capitalize',
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
  // Branch styles
  branchesList: {
    gap: 12,
  },
  branchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  currentBranchCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  branchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  branchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
  },
  branchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  branchCode: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    flex: 1,
  },
  branchBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headOfficeBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  headOfficeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  branchStatus: {
    alignItems: 'flex-end',
  },
  branchCardBody: {
    marginBottom: 12,
    gap: 8,
  },
  branchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchDetailText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    flex: 1,
  },
  branchCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  branchStats: {
    flexDirection: 'row',
    flex: 1,
  },
  branchStat: {
    alignItems: 'center',
  },
  branchStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  branchStatLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  branchAction: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    width: 120,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Agency',
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  switchButton: {
    backgroundColor: '#3e60ab',
  },
  currentButton: {
    backgroundColor: '#10b981',
  },
});