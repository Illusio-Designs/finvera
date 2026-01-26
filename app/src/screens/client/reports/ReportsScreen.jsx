import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reportsAPI } from '../../../lib/api';

const REPORTS = [
  {
    id: 'trial-balance',
    title: 'Trial Balance',
    description: 'View trial balance report for a specific date range',
    icon: 'bar-chart',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    apiCall: 'trialBalance',
    hasDateRange: true,
  },
  {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    description: 'View balance sheet report',
    icon: 'trending-up',
    color: '#10b981',
    bgColor: '#d1fae5',
    apiCall: 'balanceSheet',
    hasDateRange: true,
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss',
    description: 'View profit and loss statement',
    icon: 'trending-down',
    color: '#ef4444',
    bgColor: '#fee2e2',
    apiCall: 'profitLoss',
    hasDateRange: true,
  },
  {
    id: 'ledger-statement',
    title: 'Ledger Statement',
    description: 'View detailed ledger statement',
    icon: 'document-text',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    apiCall: 'ledgerStatement',
    hasDateRange: true,
    requiresLedger: true,
  },
  {
    id: 'stock-summary',
    title: 'Stock Summary',
    description: 'View stock summary report',
    icon: 'cube',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    apiCall: 'stockSummary',
    hasDateRange: true,
  },
  {
    id: 'stock-ledger',
    title: 'Stock Ledger',
    description: 'View detailed stock ledger',
    icon: 'list',
    color: '#6366f1',
    bgColor: '#e0e7ff',
    apiCall: 'stockLedger',
    hasDateRange: true,
  },
];

export default function ReportsScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [refreshing, setRefreshing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from_date: '',
    to_date: '',
    ledger_id: '',
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add any refresh logic here
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

  useEffect(() => {
    // Set default date range
    setDateRange({
      from_date: getFirstDayOfMonth(),
      to_date: getCurrentDate(),
      ledger_id: '',
    });
  }, []);

  const handleReportPress = (report) => {
    if (report.hasDateRange) {
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
        case 'balanceSheet':
          response = await reportsAPI.balanceSheet(params);
          break;
        case 'profitLoss':
          response = await reportsAPI.profitLoss(params);
          break;
        case 'ledgerStatement':
          response = await reportsAPI.ledgerStatement(params);
          break;
        case 'stockSummary':
          response = await reportsAPI.stockSummary(params);
          break;
        case 'stockLedger':
          response = await reportsAPI.stockLedger(params);
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

      // In a real app, you would navigate to a report viewer screen
      // For now, we'll just show the success message
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

  const renderReportCard = (report, index) => (
    <TouchableOpacity 
      key={report.id}
      style={[styles.reportCard, { transform: [{ scale: 1 }] }]}
      onPress={() => handleReportPress(report)}
      activeOpacity={0.95}
    >
      <View style={styles.reportCardGradient}>
        <View style={styles.reportCardContent}>
          <View style={styles.reportCardHeader}>
            <View style={[styles.reportIcon, { backgroundColor: report.bgColor }]}>
              <Ionicons name={report.icon} size={28} color={report.color} />
            </View>
            <View style={styles.reportBadge}>
              <Text style={styles.reportBadgeText}>NEW</Text>
            </View>
          </View>
          
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
            
            <View style={styles.reportMeta}>
              {report.hasDateRange && (
                <View style={styles.metaChip}>
                  <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                  <Text style={styles.metaText}>Date Range</Text>
                </View>
              )}
              {report.requiresLedger && (
                <View style={styles.metaChip}>
                  <Ionicons name="folder-outline" size={12} color="#6b7280" />
                  <Text style={styles.metaText}>Ledger</Text>
                </View>
              )}
            </View>
            
            <View style={styles.reportFooter}>
              <TouchableOpacity 
                style={[styles.generateButton, { backgroundColor: report.color }]}
                onPress={() => handleReportPress(report)}
              >
                <Ionicons name="analytics" size={16} color="white" />
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle, { backgroundColor: report.bgColor }]} />
        <View style={[styles.decorativeLine, { backgroundColor: report.color }]} />
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.section}>
          <View style={styles.headerSection}>
            <Text style={styles.sectionTitle}>Financial Reports</Text>
            <Text style={styles.sectionSubtitle}>
              Generate comprehensive reports to analyze your business performance
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>6</Text>
                <Text style={styles.statLabel}>Report Types</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>Real-time</Text>
                <Text style={styles.statLabel}>Data</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.reportsList}>
            {REPORTS.map((report, index) => renderReportCard(report, index))}
          </View>
        </View>

        {/* Modern Date Range Modal */}
        <Modal
          visible={showDateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={[styles.modalIcon, { backgroundColor: selectedReport?.bgColor }]}>
                  <Ionicons name={selectedReport?.icon} size={20} color={selectedReport?.color} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Generate Report</Text>
                  <Text style={styles.modalSubtitle}>{selectedReport?.title}</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowDateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Ionicons name="calendar" size={20} color="#3e60ab" />
                  <Text style={styles.formHeaderText}>Select Date Range</Text>
                </View>
                
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.label}>From Date</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={dateRange.from_date}
                        onChangeText={(text) => setDateRange(prev => ({ ...prev, from_date: text }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.dateInputGroup}>
                    <Text style={styles.label}>To Date</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={dateRange.to_date}
                        onChangeText={(text) => setDateRange(prev => ({ ...prev, to_date: text }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                </View>

                {selectedReport?.requiresLedger && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Ledger ID</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="folder-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={dateRange.ledger_id}
                        onChangeText={(text) => setDateRange(prev => ({ ...prev, ledger_id: text }))}
                        placeholder="Enter ledger ID"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShowDateModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.spinner} />
                      <Text style={styles.primaryButtonText}>Generating...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="analytics" size={20} color="white" />
                      <Text style={styles.primaryButtonText}>Generate Report</Text>
                    </>
                  )}
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
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'Agency',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    fontFamily: 'Agency',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  reportsList: {
    gap: 20,
  },
  reportCard: {
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
  reportCardGradient: {
    position: 'relative',
    padding: 20,
  },
  reportCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reportBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reportBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Agency',
    letterSpacing: 0.5,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'Agency',
    letterSpacing: -0.3,
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'Agency',
    fontWeight: '500',
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
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
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  formHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  primaryButton: {
    backgroundColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: 'white',
  },
});