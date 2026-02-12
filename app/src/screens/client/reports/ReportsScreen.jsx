import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import DatePicker from '../../../components/ui/ModernDatePicker';
import Dropdown from '../../../components/ui/Dropdown';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reportsAPI, accountingAPI } from '../../../lib/api';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function ReportsScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ledgers, setLedgers] = useState([]);
  const [dateRange, setDateRange] = useState({
    from_date: '',
    to_date: '',
    ledger_id: '',
  });

  useEffect(() => {
    // Simulate initial data load with 3-second minimum display
    const startTime = Date.now();
    
    const loadData = async () => {
      // Fetch ledgers for dropdown
      try {
        const response = await accountingAPI.ledgers.list({ limit: 100 });
        const data = response.data?.data || response.data || [];
        setLedgers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching ledgers:', error);
        setLedgers([]);
      }
      
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    };
    
    loadData();
    
    setDateRange({
      from_date: getFirstDayOfMonth(),
      to_date: getCurrentDate(),
      ledger_id: '',
    });
  }, []);

  const reports = [
    {
      id: 'profit-loss',
      title: 'Profit & Loss',
      description: 'Trading account showing income and expenses',
      icon: 'trending-up',
      color: '#10b981',
      screen: 'ProfitLoss',
      category: 'Financial',
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Statement of financial position',
      icon: 'bar-chart',
      color: '#3b82f6',
      screen: 'BalanceSheet',
      category: 'Financial',
    },
    {
      id: 'receivables',
      title: 'Receivables',
      description: 'Accounts receivable from customers',
      icon: 'people',
      color: '#059669',
      screen: 'Receivables',
      category: 'Financial',
    },
    {
      id: 'payables',
      title: 'Payables',
      description: 'Accounts payable to suppliers',
      icon: 'card',
      color: '#dc2626',
      screen: 'Payables',
      category: 'Financial',
    },
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      description: 'Verify accounting accuracy',
      icon: 'calculator',
      color: '#8b5cf6',
      apiCall: 'trialBalance',
      hasDateRange: true,
      category: 'Accounting',
    },
    {
      id: 'ledger-statement',
      title: 'Ledger Statement',
      description: 'Detailed transaction history',
      icon: 'document-text',
      color: '#f59e0b',
      screen: 'LedgerStatement',
      category: 'Accounting',
    },
  ];

  const categories = ['All', 'Financial', 'Accounting'];
  const filteredReports = selectedCategory === 'All' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);

  const handleMenuPress = () => {
    openDrawer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  const handleReportPress = (report) => {
    if (report.screen) {
      navigation.navigate(report.screen);
    } else if (report.hasDateRange) {
      setSelectedReport(report);
      setShowDateModal(true);
    } else {
      generateReport(report, {});
    }
  };

  const generateReport = async (report, params) => {
    try {
      setLoading(true);
      
      let response;
      switch (report.apiCall) {
        case 'trialBalance':
          response = await reportsAPI.trialBalance(params);
          break;
        case 'ledgerStatement':
          response = await reportsAPI.ledgerStatement(params);
          break;
        default:
          throw new Error('Unknown report type');
      }

      const data = response.data?.data || response.data;
      
      showNotification({
        type: 'success',
        title: 'Report Generated',
        message: `${report.title} has been generated successfully`
      });

      console.log('Report data:', data);
      
    } catch (error) {
      console.error('Report generation error:', error);
      showNotification({
        type: 'error',
        title: 'Report Error',
        message: error.response?.data?.message || `Failed to generate ${report.title}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!dateRange.from_date || !dateRange.to_date) {
      showNotification({
        type: 'error',
        title: 'Missing Dates',
        message: 'Please select both from and to dates'
      });
      return;
    }

    if (selectedReport.requiresLedger && !dateRange.ledger_id) {
      showNotification({
        type: 'error',
        title: 'Missing Ledger',
        message: 'Please enter a ledger ID for this report'
      });
      return;
    }

    const params = {
      from_date: dateRange.from_date,
      to_date: dateRange.to_date,
    };

    if (selectedReport.requiresLedger) {
      params.ledger_id = dateRange.ledger_id;
    }

    generateReport(selectedReport, params);
    setShowDateModal(false);
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Reports" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Actions - Same as LedgersScreen */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={() => {}}>
            <Ionicons name="analytics" size={16} color="white" />
            <Text style={styles.createButtonText}>Generate Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category && styles.categoryTabTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'All Reports' : `${selectedCategory} Reports`}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} available
          </Text>
          
          {loading ? (
            <View style={styles.reportsList}>
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
            </View>
          ) : (
            <View style={styles.reportsList}>
              {filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleReportPress(report)}
              >
                <View style={styles.reportCardHeader}>
                  <View style={styles.reportMainInfo}>
                    <Text style={styles.reportName}>{report.title}</Text>
                    <Text style={styles.reportDescription}>{report.description}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{report.category}</Text>
                    </View>
                  </View>
                  <View style={[styles.reportIcon, { backgroundColor: `${report.color}20` }]}>
                    <Ionicons name={report.icon} size={24} color={report.color} />
                  </View>
                </View>
                
                <View style={styles.reportCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReportPress(report);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReportPress(report);
                    }}
                  >
                    <Ionicons name="download-outline" size={16} color="#2563eb" />
                    <Text style={styles.actionButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          )}
        </View>

        {/* Date Range Modal */}
        <Modal
          visible={showDateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Report</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formCard}>
                <Text style={styles.formHeaderText}>Select Date Range</Text>
                
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateInputGroup}>
                    <DatePicker
                      label="From Date"
                      value={dateRange.from_date}
                      onDateChange={(date) => setDateRange(prev => ({ ...prev, from_date: date }))}
                      placeholder="Select from date"
                      style={styles.datePicker}
                    />
                  </View>

                  <View style={styles.dateInputGroup}>
                    <DatePicker
                      label="To Date"
                      value={dateRange.to_date}
                      onDateChange={(date) => setDateRange(prev => ({ ...prev, to_date: date }))}
                      placeholder="Select to date"
                      style={styles.datePicker}
                    />
                  </View>
                </View>

                {selectedReport?.requiresLedger && (
                  <View style={styles.formGroup}>
                    <Dropdown
                      label="Select Ledger"
                      value={dateRange.ledger_id}
                      onSelect={(value) => setDateRange(prev => ({ ...prev, ledger_id: value }))}
                      options={ledgers.map(ledger => ({
                        label: `${ledger.ledger_name} ${ledger.ledger_code ? `(${ledger.ledger_code})` : ''}`,
                        value: ledger.id
                      }))}
                      placeholder="Choose a ledger"
                      searchable={true}
                    />
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowDateModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleGenerateReport}
                  disabled={loading}
                >
                  <Ionicons name="analytics" size={16} color="white" />
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
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
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header Actions - Same as LedgersScreen
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    minWidth: 200,
  },
  createButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
    marginLeft: 8,
  },

  // Category Filter - Simple style
  categorySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  categoryTabs: {
    flexDirection: 'row',
  },
  categoryTabsContent: {
    paddingRight: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  categoryTabText: {
    ...FONT_STYLES.labelSmall,
    color: '#6b7280',
  },
  categoryTabTextActive: {
    color: 'white',
  },

  // Reports Section - Same as LedgersScreen
  reportsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginBottom: 16,
  },
  reportsList: {
    gap: 12,
  },

  // Report Cards - Same as LedgersScreen
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportMainInfo: {
    flex: 1,
  },
  reportName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  reportDescription: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  categoryBadgeText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    color: '#6b7280',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  reportCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    gap: 4,
  },
  actionButtonText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
  },

  // Modal Styles - Same as LedgersScreen
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formHeaderText: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
  },
  datePicker: {
    marginBottom: 0,
  },
  formGroup: {
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...FONT_STYLES.button,
    color: '#6b7280',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
});