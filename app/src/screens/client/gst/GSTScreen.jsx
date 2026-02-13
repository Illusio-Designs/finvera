import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../../utils/fonts';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { gstAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';

export default function GSTScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showGSTR1Modal, setShowGSTR1Modal] = useState(false);
  const [showGSTR3BModal, setShowGSTR3BModal] = useState(false);
  const [showGSTR2AModal, setShowGSTR2AModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  
  // GSTR-1 Form State
  const [gstr1Form, setGstr1Form] = useState({
    gstin: '',
    period: `${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}-${new Date().getFullYear()}`
  });
  const [gstr1Result, setGstr1Result] = useState(null);
  
  // GSTR-3B Form State
  const [gstr3bForm, setGstr3bForm] = useState({
    gstin: '',
    period: `${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}-${new Date().getFullYear()}`
  });
  const [gstr3bResult, setGstr3bResult] = useState(null);
  
  // GSTR-2A Form State
  const [gstr2aForm, setGstr2aForm] = useState({
    gstin: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    reconciliation_criteria: 'strict'
  });
  const [gstr2aJob, setGstr2aJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    upload_url: '',
    ledger_data: {
      invoices: []
    }
  });
  const [sampleInvoice, setSampleInvoice] = useState({
    supplier_name: '',
    supplier_gstin: '',
    invoice_number: '',
    place_of_supply: '',
    sub_total: 0,
    gst_rate: 18,
    total: 0
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setGstr1Result(null);
    setGstr3bResult(null);
    setGstr2aJob(null);
    setJobStatus(null);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // GSTR-1 Handlers
  const handleGSTR1Submit = async () => {
    if (!gstr1Form.gstin || !gstr1Form.period) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter GSTIN and period'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await gstAPI.returns.generateGSTR1(gstr1Form);
      const data = response.data?.data || response.data;
      setGstr1Result(data);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'GSTR-1 generated successfully'
      });
    } catch (error) {
      console.error('GSTR-1 generation error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to generate GSTR-1'
      });
    } finally {
      setLoading(false);
    }
  };

  // GSTR-3B Handlers
  const handleGSTR3BSubmit = async () => {
    if (!gstr3bForm.gstin || !gstr3bForm.period) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter GSTIN and period'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await gstAPI.returns.generateGSTR3B(gstr3bForm);
      const data = response.data?.data || response.data;
      setGstr3bResult(data);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'GSTR-3B generated successfully'
      });
    } catch (error) {
      console.error('GSTR-3B generation error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to generate GSTR-3B'
      });
    } finally {
      setLoading(false);
    }
  };

  // GSTR-2A Handlers
  const handleGSTR2ASubmit = async () => {
    if (!gstr2aForm.gstin) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter GSTIN'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await gstAPI.analytics.gstr2aReconciliation(gstr2aForm);
      const data = response.data?.data || response.data;
      setGstr2aJob(data);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'GSTR-2A reconciliation job created successfully'
      });
    } catch (error) {
      console.error('GSTR-2A reconciliation error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create reconciliation job'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckJobStatus = async () => {
    if (!gstr2aJob?.jobId) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No job ID available'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await gstAPI.analytics.getReconciliationStatus(gstr2aJob.jobId);
      const data = response.data?.data || response.data;
      setJobStatus(data);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Job status updated'
      });
    } catch (error) {
      console.error('Job status error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to get job status'
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload Handlers
  const addSampleInvoice = () => {
    if (!sampleInvoice.supplier_name || !sampleInvoice.invoice_number) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please fill supplier name and invoice number'
      });
      return;
    }

    const invoice = {
      ...sampleInvoice,
      total: sampleInvoice.sub_total + (sampleInvoice.sub_total * sampleInvoice.gst_rate / 100)
    };

    setUploadForm(prev => ({
      ...prev,
      ledger_data: {
        ...prev.ledger_data,
        invoices: [...prev.ledger_data.invoices, invoice]
      }
    }));

    setSampleInvoice({
      supplier_name: '',
      supplier_gstin: '',
      invoice_number: '',
      place_of_supply: '',
      sub_total: 0,
      gst_rate: 18,
      total: 0
    });

    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Invoice added to ledger data'
    });
  };

  const handleUploadLedgerData = async () => {
    if (!uploadForm.upload_url || uploadForm.ledger_data.invoices.length === 0) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please provide upload URL and at least one invoice'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await gstAPI.analytics.uploadPurchaseLedger(uploadForm);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Purchase ledger data uploaded successfully'
      });
      
      setUploadForm({
        upload_url: '',
        ledger_data: {
          invoices: []
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to upload ledger data'
      });
    } finally {
      setLoading(false);
    }
  };

  const gstOperations = [
    {
      id: 'gstr1',
      title: 'File GSTR-1',
      subtitle: 'Generate & file outward supplies return',
      icon: 'document-text',
      color: '#10b981',
      onPress: () => setShowGSTR1Modal(true)
    },
    {
      id: 'gstr3b',
      title: 'File GSTR-3B',
      subtitle: 'Generate & file monthly summary return',
      icon: 'calculator',
      color: '#3b82f6',
      onPress: () => setShowGSTR3BModal(true)
    },
    {
      id: 'gstr2a',
      title: 'GSTR-2A Reconciliation',
      subtitle: 'Reconcile purchase data with GSTR-2A',
      icon: 'git-compare',
      color: '#f59e0b',
      onPress: () => setShowGSTR2AModal(true)
    },
    {
      id: 'upload',
      title: 'Upload Purchase Ledger',
      subtitle: 'Upload ledger data for reconciliation',
      icon: 'cloud-upload',
      color: '#8b5cf6',
      onPress: () => setShowUploadModal(true)
    },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="GST Management" 
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
          <Text style={styles.headerTitle}>GST Returns & Compliance</Text>
          <Text style={styles.headerSubtitle}>
            Manage GST returns, reconciliation, and filing
          </Text>
        </View>

        {/* GST Operations Cards */}
        <View style={styles.operationsGrid}>
          {gstOperations.map((operation) => (
            <TouchableOpacity
              key={operation.id}
              style={styles.operationCard}
              onPress={operation.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.operationIcon, { backgroundColor: operation.color }]}>
                <Ionicons name={operation.icon} size={28} color="white" />
              </View>
              <View style={styles.operationInfo}>
                <Text style={styles.operationTitle}>{operation.title}</Text>
                <Text style={styles.operationSubtitle}>{operation.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3e60ab" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>GST Filing & Reconciliation</Text>
              <Text style={styles.infoText}>
                Use these tools to generate GST returns, reconcile purchase data with GSTR-2A, and upload ledger data for automated matching.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* GSTR-1 Modal */}
      <Modal
        visible={showGSTR1Modal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGSTR1Modal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIcon, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="document-text" size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.modalTitle}>File GSTR-1</Text>
                <Text style={styles.modalSubtitle}>Outward Supplies Return</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowGSTR1Modal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.infoText}>
              Generate GSTR-1 return for outward supplies. This will include B2B, B2C, exports, and HSN summary.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTIN *</Text>
              <TextInput
                style={styles.input}
                value={gstr1Form.gstin}
                onChangeText={(text) => setGstr1Form(prev => ({ ...prev, gstin: text.toUpperCase() }))}
                placeholder="29AABCU9603R1ZX"
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Period (MM-YYYY) *</Text>
              <TextInput
                style={styles.input}
                value={gstr1Form.period}
                onChangeText={(text) => setGstr1Form(prev => ({ ...prev, period: text }))}
                placeholder="01-2024"
                maxLength={7}
              />
              <Text style={styles.helpText}>Format: MM-YYYY (e.g., 01-2024)</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleGSTR1Submit}
              disabled={loading}
            >
              <Ionicons name="document-text" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Generating...' : 'Generate GSTR-1'}
              </Text>
            </TouchableOpacity>

            {gstr1Result && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>GSTR-1 Generated Successfully</Text>
                
                {gstr1Result.summary && (
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Taxable Value</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr1Result.summary.totalTaxableValue || 0)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Tax</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr1Result.summary.totalTax || 0)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>B2B Invoices</Text>
                      <Text style={styles.summaryValue}>{gstr1Result.summary.b2bCount || 0}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>B2C Invoices</Text>
                      <Text style={styles.summaryValue}>
                        {(gstr1Result.summary.b2clCount || 0) + (gstr1Result.summary.b2csCount || 0)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* GSTR-3B Modal */}
      <Modal
        visible={showGSTR3BModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGSTR3BModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIcon, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="calculator" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.modalTitle}>File GSTR-3B</Text>
                <Text style={styles.modalSubtitle}>Monthly Summary Return</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowGSTR3BModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.infoText}>
              Generate GSTR-3B monthly summary return. This includes output tax liability, input tax credit, and net tax payable.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTIN *</Text>
              <TextInput
                style={styles.input}
                value={gstr3bForm.gstin}
                onChangeText={(text) => setGstr3bForm(prev => ({ ...prev, gstin: text.toUpperCase() }))}
                placeholder="29AABCU9603R1ZX"
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Period (MM-YYYY) *</Text>
              <TextInput
                style={styles.input}
                value={gstr3bForm.period}
                onChangeText={(text) => setGstr3bForm(prev => ({ ...prev, period: text }))}
                placeholder="01-2024"
                maxLength={7}
              />
              <Text style={styles.helpText}>Format: MM-YYYY (e.g., 01-2024)</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleGSTR3BSubmit}
              disabled={loading}
            >
              <Ionicons name="calculator" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Generating...' : 'Generate GSTR-3B'}
              </Text>
            </TouchableOpacity>

            {gstr3bResult && gstr3bResult.summary && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>GSTR-3B Generated Successfully</Text>
                
                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Output Tax</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>CGST</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr3bResult.summary.totalOutput?.cgst || 0)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>SGST</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr3bResult.summary.totalOutput?.sgst || 0)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>IGST</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr3bResult.summary.totalOutput?.igst || 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Input Tax Credit</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>CGST</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr3bResult.summary.totalInput?.cgst || 0)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>SGST</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr3bResult.summary.totalInput?.sgst || 0)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>IGST</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(gstr3bResult.summary.totalInput?.igst || 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.totalPayable}>
                  <Text style={styles.totalPayableLabel}>Total Tax Payable</Text>
                  <Text style={styles.totalPayableValue}>
                    {formatCurrency(gstr3bResult.summary.totalTaxPayable || 0)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* GSTR-2A Reconciliation Modal */}
      <Modal
        visible={showGSTR2AModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGSTR2AModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="git-compare" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.modalTitle}>GSTR-2A Reconciliation</Text>
                <Text style={styles.modalSubtitle}>Match Purchase Data</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowGSTR2AModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.infoText}>
              Create a reconciliation job to match your purchase records with GSTR-2A data from the GST portal.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTIN *</Text>
              <TextInput
                style={styles.input}
                value={gstr2aForm.gstin}
                onChangeText={(text) => setGstr2aForm(prev => ({ ...prev, gstin: text.toUpperCase() }))}
                placeholder="29AABCU9603R1ZX"
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={gstr2aForm.year.toString()}
                  onChangeText={(text) => setGstr2aForm(prev => ({ ...prev, year: parseInt(text) || new Date().getFullYear() }))}
                  keyboardType="numeric"
                  placeholder="2024"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Month</Text>
                <TextInput
                  style={styles.input}
                  value={gstr2aForm.month.toString()}
                  onChangeText={(text) => setGstr2aForm(prev => ({ ...prev, month: parseInt(text) || 1 }))}
                  keyboardType="numeric"
                  placeholder="1-12"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleGSTR2ASubmit}
              disabled={loading}
            >
              <Ionicons name="git-compare" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Job...' : 'Create Reconciliation Job'}
              </Text>
            </TouchableOpacity>

            {gstr2aJob && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Reconciliation Job Created</Text>
                
                <View style={styles.jobDetail}>
                  <Text style={styles.jobDetailLabel}>Job ID:</Text>
                  <Text style={styles.jobDetailValue}>{gstr2aJob.jobId}</Text>
                </View>
                
                {gstr2aJob.uploadUrl && (
                  <View style={styles.jobDetail}>
                    <Text style={styles.jobDetailLabel}>Upload URL:</Text>
                    <Text style={styles.jobDetailValue} numberOfLines={2}>{gstr2aJob.uploadUrl}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={handleCheckJobStatus}
                  disabled={loading}
                >
                  <Ionicons name="refresh" size={20} color="#3e60ab" />
                  <Text style={styles.statusButtonText}>Check Status</Text>
                </TouchableOpacity>

                {jobStatus && (
                  <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                      <Text style={styles.statusLabel}>Status:</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: jobStatus.status === 'completed' ? '#10b981' : '#f59e0b' }
                      ]}>
                        <Text style={styles.statusBadgeText}>{jobStatus.status}</Text>
                      </View>
                    </View>
                    
                    {jobStatus.progress && (
                      <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>Progress: {jobStatus.progress}%</Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[styles.progressFill, { width: `${jobStatus.progress}%` }]}
                          />
                        </View>
                      </View>
                    )}
                    
                    {jobStatus.result && (
                      <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>Matched Invoices: {jobStatus.result.matched_invoices || 0}</Text>
                        <Text style={styles.resultText}>Unmatched Invoices: {jobStatus.result.unmatched_invoices || 0}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Upload Purchase Ledger Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIcon, { backgroundColor: '#8b5cf620' }]}>
                <Ionicons name="cloud-upload" size={20} color="#8b5cf6" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Upload Purchase Ledger</Text>
                <Text style={styles.modalSubtitle}>Add & Upload Invoices</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowUploadModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.infoText}>
              Add purchase invoices and upload them to the reconciliation job URL for automated matching.
            </Text>

            <Text style={styles.sectionHeader}>Add Invoice</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Supplier Name *</Text>
              <TextInput
                style={styles.input}
                value={sampleInvoice.supplier_name}
                onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, supplier_name: text }))}
                placeholder="ABC Corp"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Supplier GSTIN</Text>
              <TextInput
                style={styles.input}
                value={sampleInvoice.supplier_gstin}
                onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, supplier_gstin: text.toUpperCase() }))}
                placeholder="29AABCU9603R1ZX"
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Invoice Number *</Text>
                <TextInput
                  style={styles.input}
                  value={sampleInvoice.invoice_number}
                  onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, invoice_number: text }))}
                  placeholder="INV001"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Place of Supply</Text>
                <TextInput
                  style={styles.input}
                  value={sampleInvoice.place_of_supply}
                  onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, place_of_supply: text }))}
                  placeholder="29"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Sub Total (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={sampleInvoice.sub_total.toString()}
                  onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, sub_total: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="10000"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>GST Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={sampleInvoice.gst_rate.toString()}
                  onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, gst_rate: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="18"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addSampleInvoice}
            >
              <Ionicons name="add" size={20} color="#3e60ab" />
              <Text style={styles.addButtonText}>Add Invoice</Text>
            </TouchableOpacity>

            {uploadForm.ledger_data.invoices.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>
                  Invoices to Upload ({uploadForm.ledger_data.invoices.length})
                </Text>
                
                <View style={styles.invoicesList}>
                  {uploadForm.ledger_data.invoices.map((invoice, index) => (
                    <View key={index} style={styles.invoiceItem}>
                      <View style={styles.invoiceInfo}>
                        <Text style={styles.invoiceSupplier}>{invoice.supplier_name}</Text>
                        <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                      </View>
                      <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Upload URL (from reconciliation job)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={uploadForm.upload_url}
                    onChangeText={(text) => setUploadForm(prev => ({ ...prev, upload_url: text }))}
                    placeholder="https://s3.amazonaws.com/upload-url"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!uploadForm.upload_url || loading) && styles.submitButtonDisabled
                  ]}
                  onPress={handleUploadLedgerData}
                  disabled={!uploadForm.upload_url || loading}
                >
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Uploading...' : 'Upload Ledger Data'}
                  </Text>
                </TouchableOpacity>
              </>
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
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  operationsGrid: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  operationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  operationIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  operationInfo: {
    flex: 1,
  },
  operationTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  operationSubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f0f4fc',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...FONT_STYLES.h6,
    color: '#3e60ab',
    marginBottom: 4,
  },
  infoText: {
    ...FONT_STYLES.bodySmall,
    color: '#64748b',
    lineHeight: 20,
    backgroundColor: '#f0f4fc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  modalSubtitle: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
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
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    ...FONT_STYLES.button,
    color: '#3e60ab',
  },

  sectionHeader: {
    ...FONT_STYLES.h6,
    color: '#3e60ab',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  resultTitle: {
    ...FONT_STYLES.h6,
    color: '#15803d',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  summarySection: {
    marginBottom: 16,
  },
  summarySectionTitle: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  totalPayable: {
    backgroundColor: '#3e60ab',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalPayableLabel: {
    ...FONT_STYLES.h6,
    color: 'white',
  },
  totalPayableValue: {
    ...FONT_STYLES.h4,
    color: 'white',
    fontWeight: '700',
  },
  jobDetail: {
    marginBottom: 12,
  },
  jobDetailLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  jobDetailValue: {
    ...FONT_STYLES.body,
    color: '#111827',
    marginTop: 2,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  statusButtonText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    ...FONT_STYLES.label,
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusBadgeText: {
    ...FONT_STYLES.caption,
    color: 'white',
  },

  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
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
  },
  resultContainer: {
    gap: 4,
  },
  resultText: {
    ...FONT_STYLES.caption,
    color: '#374151',
  },
  invoicesList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceSupplier: {
    ...FONT_STYLES.label,
    color: '#111827',
  },
  invoiceNumber: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  invoiceAmount: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
  },
});
