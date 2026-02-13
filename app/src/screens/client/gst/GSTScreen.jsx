import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
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
    // Reset all states
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

    // Reset sample invoice
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
      
      // Reset form
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

  const renderTabButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === item.id && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(item.id)}
    >
      <Ionicons 
        name={item.icon} 
        size={20} 
        color={activeTab === item.id ? '#3e60ab' : '#6b7280'} 
      />
      <Text style={[
        styles.tabButtonText,
        activeTab === item.id && styles.tabButtonTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderGSTR2ATab = () => (
    <View style={styles.tabContent}>
      {/* GSTR-2A Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create GSTR-2A Reconciliation Job</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>GSTIN *</Text>
          <TextInput
            style={styles.input}
            value={gstr2aForm.gstin}
            onChangeText={(text) => setGstr2aForm(prev => ({ ...prev, gstin: text }))}
            placeholder="29AABCU9603R1ZX"
            maxLength={15}
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
          style={[styles.submitButton, (!gstr2aForm.gstin || loading) && styles.submitButtonDisabled]}
          onPress={handleGSTR2ASubmit}
          disabled={!gstr2aForm.gstin || loading}
        >
          <Ionicons name="document-text" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Job...' : 'Create Reconciliation Job'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job Details */}
      {gstr2aJob && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job Details</Text>
          
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
    </View>
  );

  const renderUploadTab = () => (
    <View style={styles.tabContent}>
      {/* Add Invoice Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Invoice to Ledger Data</Text>
        
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
            onChangeText={(text) => setSampleInvoice(prev => ({ ...prev, supplier_gstin: text }))}
            placeholder="29AABCU9603R1ZX"
            maxLength={15}
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
      </View>

      {/* Upload Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload Purchase Ledger Data</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Upload URL (from reconciliation job)</Text>
          <TextInput
            style={styles.input}
            value={uploadForm.upload_url}
            onChangeText={(text) => setUploadForm(prev => ({ ...prev, upload_url: text }))}
            placeholder="https://s3.amazonaws.com/upload-url"
            multiline
          />
        </View>

        {uploadForm.ledger_data.invoices.length > 0 && (
          <View style={styles.invoicesList}>
            <Text style={styles.invoicesListTitle}>
              Invoices to Upload ({uploadForm.ledger_data.invoices.length})
            </Text>
            <ScrollView style={styles.invoicesContainer} nestedScrollEnabled>
              {uploadForm.ledger_data.invoices.map((invoice, index) => (
                <View key={index} style={styles.invoiceItem}>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceSupplier}>{invoice.supplier_name}</Text>
                    <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                  </View>
                  <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!uploadForm.upload_url || uploadForm.ledger_data.invoices.length === 0 || loading) && styles.submitButtonDisabled
          ]}
          onPress={handleUploadLedgerData}
          disabled={!uploadForm.upload_url || uploadForm.ledger_data.invoices.length === 0 || loading}
        >
          <Ionicons name="cloud-upload" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Uploading...' : 'Upload Ledger Data'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>GST Analytics</Text>
        <View style={styles.comingSoon}>
          <Ionicons name="analytics" size={48} color="#9ca3af" />
          <Text style={styles.comingSoonText}>GST Analytics Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>
            Advanced GST analytics and reporting features will be available soon
          </Text>
        </View>
      </View>
    </View>
  );

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
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            data={GST_TABS}
            renderItem={renderTabButton}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsList}
          />
        </View>

        {/* Tab Content */}
        {activeTab === 'gstr2a' && renderGSTR2ATab()}
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
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
    backgroundColor: '#f9fafb',
  },
  tabsContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    minWidth: 120,
  },
  tabButtonActive: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  tabButtonText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginLeft: 8,
    textAlign: 'center'
  },
  tabButtonTextActive: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16
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
    marginBottom: 8
  },
  input: {
    ...FONT_STYLES.h5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: 'white'
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    ...FONT_STYLES.h5,
    color: 'white',
    marginLeft: 8
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
  },
  addButtonText: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginLeft: 8
  },
  jobDetail: {
    marginBottom: 12,
  },
  jobDetailLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  jobDetailValue: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginTop: 2
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
  },
  statusButtonText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    marginLeft: 8
  },
  statusCard: {
    backgroundColor: '#f9fafb',
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
    color: '#374151'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusBadgeText: {
    ...FONT_STYLES.caption,
    color: 'white'
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4
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
    color: '#374151'
  },
  invoicesList: {
    marginBottom: 16,
  },
  invoicesListTitle: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8
  },
  invoicesContainer: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
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
    color: '#111827'
  },
  invoiceNumber: {
    ...FONT_STYLES.caption,
    color: '#6b7280'
  },
  invoiceAmount: {
    ...FONT_STYLES.label,
    color: '#3e60ab'
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonText: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8
  },
  comingSoonSubtext: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    textAlign: 'center'
  },
});