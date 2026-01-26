import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { toolsAPI } from '../../../lib/api';

export default function TallyImportScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchImportHistory = useCallback(async () => {
    try {
      const response = await toolsAPI.tallyImport.history();
      const data = response.data?.data || response.data || [];
      setImportHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Import history fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load import history'
      });
      setImportHistory([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchImportHistory();
  }, [fetchImportHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchImportHistory();
    setRefreshing(false);
  }, [fetchImportHistory]);

  const handleImportPress = (importItem) => {
    setSelectedImport(importItem);
    setShowDetailModal(true);
  };

  const handleUploadPress = () => {
    setShowUploadModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getImportStatusColor = (status) => {
    const colors = {
      'completed': '#10b981',
      'processing': '#3b82f6',
      'failed': '#ef4444',
      'pending': '#f59e0b',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getImportStatusIcon = (status) => {
    const icons = {
      'completed': 'checkmark-circle',
      'processing': 'sync',
      'failed': 'close-circle',
      'pending': 'time',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Tally Import" 
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
          <Text style={styles.sectionTitle}>Tally Data Import</Text>
          <Text style={styles.sectionSubtitle}>
            Import your Tally data seamlessly into Finvera
          </Text>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity 
            style={styles.uploadCard}
            onPress={handleUploadPress}
            activeOpacity={0.8}
          >
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload" size={48} color="#3e60ab" />
            </View>
            <Text style={styles.uploadTitle}>Import Tally Data</Text>
            <Text style={styles.uploadSubtitle}>
              Upload your Tally backup file to import data
            </Text>
            <View style={styles.uploadButton}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Start Import</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="document-text" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{importHistory.length}</Text>
              <Text style={styles.statLabel}>Total Imports</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {importHistory.filter(item => item.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {importHistory.filter(item => item.status === 'failed').length}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </View>

        {/* Import History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Import History</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingCard}>
                <View style={styles.spinner} />
                <Text style={styles.loadingText}>Loading import history...</Text>
              </View>
            </View>
          ) : importHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No Import History</Text>
                <Text style={styles.emptySubtitle}>
                  No Tally imports have been performed yet
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.historyList}>
              {importHistory.map((importItem, index) => (
                <TouchableOpacity
                  key={importItem.id || index}
                  style={styles.historyCard}
                  onPress={() => handleImportPress(importItem)}
                  activeOpacity={0.95}
                >
                  <View style={styles.historyCardGradient}>
                    <View style={styles.historyCardContent}>
                      <View style={styles.historyCardHeader}>
                        <View style={[
                          styles.historyIcon,
                          { backgroundColor: getImportStatusColor(importItem.status) + '20' }
                        ]}>
                          <Ionicons 
                            name={getImportStatusIcon(importItem.status)} 
                            size={24} 
                            color={getImportStatusColor(importItem.status)} 
                          />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyTitle}>
                            {importItem.file_name || 'Tally Import'}
                          </Text>
                          <Text style={styles.historyDate}>
                            {formatDate(importItem.created_at)}
                          </Text>
                        </View>
                        <View style={styles.historyStatus}>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getImportStatusColor(importItem.status) }
                          ]}>
                            <Text style={styles.statusText}>
                              {importItem.status?.toUpperCase() || 'PENDING'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.historyCardBody}>
                        <View style={styles.historyDetail}>
                          <Ionicons name="folder-outline" size={16} color="#64748b" />
                          <Text style={styles.historyDetailText}>
                            File Size: {importItem.file_size || 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.historyDetail}>
                          <Ionicons name="layers-outline" size={16} color="#64748b" />
                          <Text style={styles.historyDetailText}>
                            Records: {importItem.total_records || 0}
                          </Text>
                        </View>
                        <View style={styles.historyDetail}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#64748b" />
                          <Text style={styles.historyDetailText}>
                            Processed: {importItem.processed_records || 0}
                          </Text>
                        </View>
                        {importItem.error_count > 0 && (
                          <View style={styles.historyDetail}>
                            <Ionicons name="warning-outline" size={16} color="#ef4444" />
                            <Text style={[styles.historyDetailText, { color: '#ef4444' }]}>
                              Errors: {importItem.error_count}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.historyCardFooter}>
                        <View style={styles.historyProgress}>
                          {importItem.status === 'processing' ? (
                            <>
                              <Text style={styles.progressText}>
                                {Math.round((importItem.processed_records / importItem.total_records) * 100) || 0}% Complete
                              </Text>
                              <View style={styles.progressBar}>
                                <View 
                                  style={[
                                    styles.progressFill,
                                    { width: `${Math.round((importItem.processed_records / importItem.total_records) * 100) || 0}%` }
                                  ]} 
                                />
                              </View>
                            </>
                          ) : (
                            <Text style={styles.historyMeta}>
                              Import ID: {importItem.import_id || importItem.id}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity style={styles.historyAction}>
                          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Decorative elements */}
                    <View style={[
                      styles.decorativeCircle, 
                      { backgroundColor: getImportStatusColor(importItem.status) + '20' }
                    ]} />
                    <View style={[
                      styles.decorativeLine, 
                      { backgroundColor: getImportStatusColor(importItem.status) }
                    ]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="cloud-upload" size={20} color="#3e60ab" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Import Tally Data</Text>
                <Text style={styles.modalSubtitle}>Upload your Tally backup file</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowUploadModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.uploadInstructions}>
              <Text style={styles.instructionsTitle}>How to Import Tally Data</Text>
              
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Export from Tally</Text>
                  <Text style={styles.stepDescription}>
                    Export your data from Tally in XML or CSV format
                  </Text>
                </View>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select File</Text>
                  <Text style={styles.stepDescription}>
                    Choose the exported file from your device
                  </Text>
                </View>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Import & Review</Text>
                  <Text style={styles.stepDescription}>
                    Upload the file and review the imported data
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct" size={48} color="#94a3b8" />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                Tally import feature will be available in the next update
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Import Detail Modal */}
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
                { backgroundColor: selectedImport ? getImportStatusColor(selectedImport.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedImport ? getImportStatusIcon(selectedImport.status) : 'document-text'} 
                  size={20} 
                  color={selectedImport ? getImportStatusColor(selectedImport.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Import Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedImport?.file_name || 'Import Information'}
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
          
          {selectedImport && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Import Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>File Name:</Text>
                  <Text style={styles.detailValue}>{selectedImport.file_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Import Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedImport.created_at)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getImportStatusColor(selectedImport.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedImport.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>File Size:</Text>
                  <Text style={styles.detailValue}>{selectedImport.file_size || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Processing Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Records:</Text>
                  <Text style={styles.detailValue}>{selectedImport.total_records || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Processed:</Text>
                  <Text style={styles.detailValue}>{selectedImport.processed_records || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Success:</Text>
                  <Text style={styles.detailValue}>{selectedImport.success_count || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Errors:</Text>
                  <Text style={styles.detailValue}>{selectedImport.error_count || 0}</Text>
                </View>
              </View>

              {selectedImport.error_details && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Error Details</Text>
                  <Text style={styles.errorText}>{selectedImport.error_details}</Text>
                </View>
              )}
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
    fontFamily: 'Agency',
    lineHeight: 24,
  },
  uploadSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  uploadCard: {
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
  },
  uploadIcon: {
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  historySection: {
    paddingHorizontal: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
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
  historyList: {
    gap: 16,
    marginBottom: 24,
  },
  historyCard: {
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
  historyCardGradient: {
    position: 'relative',
    padding: 20,
  },
  historyCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyIcon: {
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
  historyInfo: {
    flex: 1,
    paddingRight: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  historyDate: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 18,
  },
  historyStatus: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  historyCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  historyDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 18,
  },
  historyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  historyProgress: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3e60ab',
    borderRadius: 2,
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  historyAction: {
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
    backgroundColor: '#dbeafe',
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
  uploadInstructions: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Agency',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    width: 120,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Agency',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
});