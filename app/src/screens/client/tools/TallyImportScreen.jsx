import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import * as DocumentPicker from 'expo-document-picker';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useConfirmation } from '../../../contexts/ConfirmationContext';
import { accountingAPI } from '../../../lib/api';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';

export default function TallyImportScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { showInfoConfirmation } = useConfirmation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    importGroups: true,
    importLedgers: true,
    importStockItems: true,
    importVouchers: true,
    maxVouchers: 1000,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchTemplateInfo = useCallback(async () => {
    try {
      const response = await accountingAPI.tallyImport.getTemplate();
      setTemplateInfo(response.data?.data || response.data);
    } catch (error) {
      console.error('Template info fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load template information'
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTemplateInfo();
  }, [fetchTemplateInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTemplateInfo();
    setRefreshing(false);
  }, [fetchTemplateInfo]);

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/xml', 'text/xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          showNotification({
            type: 'error',
            title: 'File Too Large',
            message: 'File size exceeds 50MB limit. Please upload a smaller file.'
          });
          return;
        }

        setSelectedFile(file);
        setImportResult(null);
        showNotification({
          type: 'success',
          title: 'File Selected',
          message: `Selected: ${file.name}`
        });
      }
    } catch (error) {
      console.error('File selection error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to select file'
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showNotification({
        type: 'error',
        title: 'No File Selected',
        message: 'Please select a file to import'
      });
      return;
    }

    const confirmed = await showInfoConfirmation(
      'Confirm Import',
      `Import data from ${selectedFile.name}?`,
      {
        confirmText: 'Import',
        cancelText: 'Cancel',
      }
    );

    if (confirmed) {
      performImport();
    }
  };

  const performImport = async () => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name,
      });
      formData.append('importOptions', JSON.stringify(importOptions));

      const response = await accountingAPI.tallyImport.import(
        formData,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      const result = response.data?.data || response.data;
      setImportResult(result);
      setSelectedFile(null);
      
      showNotification({
        type: 'success',
        title: 'Import Completed',
        message: 'Tally data imported successfully!'
      });
    } catch (error) {
      console.error('Import error:', error);
      showNotification({
        type: 'error',
        title: 'Import Failed',
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to import Tally data'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleOption = (option) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const updateMaxVouchers = (value) => {
    const numValue = parseInt(value) || 1000;
    setImportOptions(prev => ({
      ...prev,
      maxVouchers: Math.max(1, Math.min(10000, numValue))
    }));
  };

  const getStatusBadge = (imported, skipped, errors) => {
    if (errors && errors.length > 0) {
      return { text: 'Errors', color: '#ef4444', bgColor: '#fef2f2' };
    }
    if (imported > 0 && skipped === 0) {
      return { text: 'Success', color: '#10b981', bgColor: '#f0fdf4' };
    }
    if (imported > 0) {
      return { text: 'Partial', color: '#f59e0b', bgColor: '#fffbeb' };
    }
    return { text: 'Skipped', color: '#6b7280', bgColor: '#f9fafb' };
  };

  const instructionSteps = [
    {
      title: 'Open Tally',
      description: 'Go to Gateway of Tally',
      icon: 'desktop-outline'
    },
    {
      title: 'Export Data',
      description: 'Navigate to Display → List of Accounts',
      icon: 'list-outline'
    },
    {
      title: 'Choose Format',
      description: 'Press Alt+E or click Export, then select XML (Recommended), Excel, or CSV',
      icon: 'download-outline'
    }
  ];

  const importOptionsList = [
    { key: 'importGroups', label: 'Import Account Groups', icon: 'folder-outline' },
    { key: 'importLedgers', label: 'Import Ledgers', icon: 'document-text-outline' },
    { key: 'importStockItems', label: 'Import Stock Items', icon: 'cube-outline' },
    { key: 'importVouchers', label: 'Import Vouchers', icon: 'receipt-outline' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Tally Import" 
          onMenuPress={handleMenuPress}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <FormSkeleton fieldCount={5} />
        </ScrollView>
      </View>
    );
  }

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
        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Export from Tally</Text>
          <View style={styles.sectionCard}>
            {instructionSteps.map((step, index) => (
              <View key={index} style={[styles.instructionItem, index < instructionSteps.length - 1 && styles.instructionItemBorder]}>
                <View style={styles.instructionIcon}>
                  <Ionicons name={step.icon} size={20} color="#3e60ab" />
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionTitle}>Step {index + 1}: {step.title}</Text>
                  <Text style={styles.instructionDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* File Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload File</Text>
          <View style={styles.sectionCard}>
            {selectedFile ? (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileInfo}>
                  <View style={styles.fileIcon}>
                    <Ionicons name="document-outline" size={24} color="#3e60ab" />
                  </View>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeFileButton}
                  onPress={() => setSelectedFile(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleFileSelect}
                disabled={uploading}
              >
                <Ionicons name="cloud-upload-outline" size={32} color="#3e60ab" />
                <Text style={styles.uploadButtonText}>Select Tally Export File</Text>
                <Text style={styles.uploadButtonSubtext}>
                  Supported: XML, Excel (.xlsx, .xls), CSV (Max 50MB)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Import Options Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Import Options</Text>
            <TouchableOpacity 
              style={styles.configButton}
              onPress={() => setShowOptionsModal(true)}
            >
              <Ionicons name="settings-outline" size={16} color="#3e60ab" />
              <Text style={styles.configButtonText}>Configure</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionCard}>
            {importOptionsList.map((option, index) => (
              <View key={option.key} style={[styles.optionItem, index < importOptionsList.length - 1 && styles.optionItemBorder]}>
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <Ionicons name={option.icon} size={18} color="#6b7280" />
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
                <View style={[styles.optionToggle, importOptions[option.key] && styles.optionToggleActive]}>
                  {importOptions[option.key] && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            ))}
            {importOptions.importVouchers && (
              <View style={styles.voucherLimitContainer}>
                <Text style={styles.voucherLimitLabel}>Max Vouchers: {importOptions.maxVouchers}</Text>
                <Text style={styles.voucherLimitSubtext}>Limit to prevent timeout</Text>
              </View>
            )}
          </View>
        </View>

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Importing... {uploadProgress}%</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Import Results */}
        {importResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Import Results</Text>
            <View style={styles.sectionCard}>
              {['groups', 'ledgers', 'stockItems', 'vouchers'].map((type) => {
                const result = importResult[type];
                if (!result) return null;
                
                const badge = getStatusBadge(result.imported, result.skipped, result.errors);
                const typeLabels = {
                  groups: 'Account Groups',
                  ledgers: 'Ledgers',
                  stockItems: 'Stock Items',
                  vouchers: 'Vouchers'
                };

                return (
                  <View key={type} style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultTitle}>{typeLabels[type]}</Text>
                      <View style={[styles.resultBadge, { backgroundColor: badge.bgColor }]}>
                        <Text style={[styles.resultBadgeText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.resultStats}>
                      <View style={styles.resultStat}>
                        <Text style={styles.resultStatValue}>{result.imported}</Text>
                        <Text style={styles.resultStatLabel}>Imported</Text>
                      </View>
                      <View style={styles.resultStat}>
                        <Text style={styles.resultStatValue}>{result.skipped}</Text>
                        <Text style={styles.resultStatLabel}>Skipped</Text>
                      </View>
                      <View style={styles.resultStat}>
                        <Text style={styles.resultStatValue}>{result.errors?.length || 0}</Text>
                        <Text style={styles.resultStatLabel}>Errors</Text>
                      </View>
                    </View>
                    {result.errors && result.errors.length > 0 && (
                      <View style={styles.errorContainer}>
                        {result.errors.slice(0, 3).map((error, idx) => (
                          <Text key={idx} style={styles.errorText}>
                            • {error.group || error.ledger || error.item || error.voucher}: {error.error}
                          </Text>
                        ))}
                        {result.errors.length > 3 && (
                          <Text style={styles.moreErrorsText}>
                            +{result.errors.length - 3} more errors
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Import Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.importButton, (!selectedFile || uploading) && styles.importButtonDisabled]}
            onPress={handleImport}
            disabled={!selectedFile || uploading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
            <Text style={styles.importButtonText}>
              {uploading ? 'Importing...' : 'Import Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Options</Text>
            <TouchableOpacity 
              onPress={() => setShowOptionsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {importOptionsList.map((option) => (
              <TouchableOpacity 
                key={option.key}
                style={styles.modalOptionItem}
                onPress={() => toggleOption(option.key)}
              >
                <View style={styles.modalOptionLeft}>
                  <View style={styles.modalOptionIcon}>
                    <Ionicons name={option.icon} size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.modalOptionLabel}>{option.label}</Text>
                </View>
                <View style={[styles.modalOptionToggle, importOptions[option.key] && styles.modalOptionToggleActive]}>
                  {importOptions[option.key] && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
            
            {importOptions.importVouchers && (
              <View style={styles.voucherLimitSection}>
                <Text style={styles.voucherLimitTitle}>Voucher Import Limit</Text>
                <Text style={styles.voucherLimitDescription}>
                  Limit the number of vouchers to import to prevent timeout issues.
                </Text>
                <View style={styles.voucherLimitOptions}>
                  {[500, 1000, 2000, 5000].map((limit) => (
                    <TouchableOpacity
                      key={limit}
                      style={[
                        styles.limitOption,
                        importOptions.maxVouchers === limit && styles.limitOptionActive
                      ]}
                      onPress={() => updateMaxVouchers(limit)}
                    >
                      <Text style={[
                        styles.limitOptionText,
                        importOptions.maxVouchers === limit && styles.limitOptionTextActive
                      ]}>
                        {limit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
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
    paddingBottom: 120, // Increased padding to ensure content doesn't overlap with bottom nav
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  configButtonText: {
    ...FONT_STYLES.caption,
    color: '#3e60ab',
    marginLeft: 4
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  instructionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginBottom: 4
  },
  instructionDescription: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    lineHeight: 18
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#fafbfc',
  },
  uploadButtonText: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginTop: 8
  },
  uploadButtonSubtext: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center'
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  fileSize: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2
  },
  removeFileButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  optionToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionToggleActive: {
    backgroundColor: '#3e60ab',
  },
  voucherLimitContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  voucherLimitLabel: {
    ...FONT_STYLES.bodySmall,
    color: '#374151'
  },
  voucherLimitSubtext: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    marginTop: 2
  },
  progressContainer: {
    padding: 16,
  },
  progressText: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3e60ab',
    borderRadius: 4,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultBadgeText: {
    ...FONT_STYLES.captionSmall,
    textTransform: 'uppercase'
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatValue: {
    ...FONT_STYLES.h3,
    color: '#111827'
  },
  resultStatLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    ...FONT_STYLES.captionSmall,
    color: '#dc2626',
    marginBottom: 4
  },
  moreErrorsText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  importButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
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
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionLabel: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  modalOptionToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionToggleActive: {
    backgroundColor: '#3e60ab',
  },
  voucherLimitSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  voucherLimitTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 8
  },
  voucherLimitDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20
  },
  voucherLimitOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  limitOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  limitOptionActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  limitOptionText: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  limitOptionTextActive: {
    color: 'white',
  },
});