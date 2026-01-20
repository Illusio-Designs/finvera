import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';
import { gstAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiRefreshCw, FiUpload, FiFileText, FiCheckCircle } from 'react-icons/fi';

export default function GSTAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gstr2a'); // gstr2a, upload

  // GSTR-2A Reconciliation State
  const [gstr2aForm, setGstr2aForm] = useState({
    gstin: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    reconciliation_criteria: 'strict'
  });
  const [gstr2aJob, setGstr2aJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  // Purchase Ledger Upload State
  const [uploadForm, setUploadForm] = useState({
    upload_url: '',
    ledger_data: {
      invoices: [],
      debitNotes: []
    }
  });
  const [sampleInvoice, setSampleInvoice] = useState({
    supplier_name: '',
    supplier_gstin: '',
    invoice_number: '',
    invoice_date_epoch: Math.floor(Date.now() / 1000),
    irn: '',
    place_of_supply: '',
    sub_total: 0,
    gst_rate: 18,
    cgst: 0,
    sgst: 0,
    igst: 0,
    cess: 0,
    total: 0
  });

  const handleGSTR2ASubmit = async () => {
    try {
      setLoading(true);
      const response = await gstAPI.analytics.createGSTR2AReconciliation(gstr2aForm);
      const data = response.data?.data || response.data;
      setGstr2aJob(data);
      toast.success('GSTR-2A reconciliation job created successfully');
    } catch (error) {
      console.error('GSTR-2A reconciliation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create reconciliation job');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckJobStatus = async () => {
    if (!gstr2aJob?.jobId) {
      toast.error('No job ID available');
      return;
    }
    try {
      setLoading(true);
      const response = await gstAPI.analytics.getGSTR2AReconciliationStatus(gstr2aJob.jobId);
      const data = response.data?.data || response.data;
      setJobStatus(data);
      toast.success('Job status updated');
    } catch (error) {
      console.error('Job status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get job status');
    } finally {
      setLoading(false);
    }
  };

  const addSampleInvoice = () => {
    if (!sampleInvoice.supplier_name || !sampleInvoice.invoice_number) {
      toast.error('Please fill supplier name and invoice number');
      return;
    }

    const invoice = {
      ...sampleInvoice,
      cgst: sampleInvoice.sub_total * (sampleInvoice.gst_rate / 2) / 100,
      sgst: sampleInvoice.sub_total * (sampleInvoice.gst_rate / 2) / 100,
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
      invoice_date_epoch: Math.floor(Date.now() / 1000),
      irn: '',
      place_of_supply: '',
      sub_total: 0,
      gst_rate: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      total: 0
    });

    toast.success('Invoice added to ledger data');
  };

  const handleUploadLedgerData = async () => {
    if (!uploadForm.upload_url || uploadForm.ledger_data.invoices.length === 0) {
      toast.error('Please provide upload URL and at least one invoice');
      return;
    }
    try {
      setLoading(true);
      const response = await gstAPI.analytics.uploadPurchaseLedger(uploadForm);
      toast.success('Purchase ledger data uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload ledger data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'gstr2a', label: 'GSTR-2A Reconciliation', icon: FiFileText },
    { id: 'upload', label: 'Upload Purchase Ledger', icon: FiUpload },
  ];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="GST Analytics">
        <Toaster />
        <PageLayout
          title="GST Analytics"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GST', href: '/client/gst' },
            { label: 'Analytics' },
          ]}
        >
          <div className="space-y-6">
            {/* Tabs */}
            <Card>
              <div className="flex gap-2 border-b">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* GSTR-2A Reconciliation Tab */}
            {activeTab === 'gstr2a' && (
              <div className="space-y-6">
                <Card title="Create GSTR-2A Reconciliation Job">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <Input
                          value={gstr2aForm.gstin}
                          onChange={(e) => setGstr2aForm(prev => ({ ...prev, gstin: e.target.value }))}
                          placeholder="29AABCU9603R1ZX"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <Input
                          type="number"
                          value={gstr2aForm.year}
                          onChange={(e) => setGstr2aForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                          min="2017"
                          max="2030"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Month
                        </label>
                        <select
                          value={gstr2aForm.month}
                          onChange={(e) => setGstr2aForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reconciliation Criteria
                        </label>
                        <select
                          value={gstr2aForm.reconciliation_criteria}
                          onChange={(e) => setGstr2aForm(prev => ({ ...prev, reconciliation_criteria: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="strict">Strict</option>
                          <option value="relaxed">Relaxed</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleGSTR2ASubmit}
                        disabled={loading || !gstr2aForm.gstin}
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating Job...
                          </>
                        ) : (
                          <>
                            <FiFileText className="h-4 w-4 mr-2" />
                            Create Reconciliation Job
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {gstr2aJob && (
                  <Card title="Job Details">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Job ID</p>
                          <p className="font-mono text-sm">{gstr2aJob.jobId}</p>
                        </div>
                        {gstr2aJob.uploadUrl && (
                          <div>
                            <p className="text-sm text-gray-600">Upload URL</p>
                            <p className="font-mono text-xs break-all">{gstr2aJob.uploadUrl}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCheckJobStatus}
                          disabled={loading}
                          variant="outline"
                        >
                          <FiRefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </Button>
                      </div>
                      {jobStatus && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={jobStatus.status === 'completed' ? 'success' : 'warning'}>
                              {jobStatus.status}
                            </Badge>
                          </div>
                          {jobStatus.progress && (
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">Progress: {jobStatus.progress}%</span>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full" 
                                  style={{ width: `${jobStatus.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {jobStatus.result && (
                            <div className="text-sm">
                              <p>Matched Invoices: {jobStatus.result.matched_invoices || 0}</p>
                              <p>Unmatched Invoices: {jobStatus.result.unmatched_invoices || 0}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Upload Purchase Ledger Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <Card title="Add Invoice to Ledger Data">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier Name *
                        </label>
                        <Input
                          value={sampleInvoice.supplier_name}
                          onChange={(e) => setSampleInvoice(prev => ({ ...prev, supplier_name: e.target.value }))}
                          placeholder="ABC Corp"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier GSTIN
                        </label>
                        <Input
                          value={sampleInvoice.supplier_gstin}
                          onChange={(e) => setSampleInvoice(prev => ({ ...prev, supplier_gstin: e.target.value }))}
                          placeholder="29AABCU9603R1ZX"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Invoice Number *
                        </label>
                        <Input
                          value={sampleInvoice.invoice_number}
                          onChange={(e) => setSampleInvoice(prev => ({ ...prev, invoice_number: e.target.value }))}
                          placeholder="INV001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Place of Supply
                        </label>
                        <Input
                          value={sampleInvoice.place_of_supply}
                          onChange={(e) => setSampleInvoice(prev => ({ ...prev, place_of_supply: e.target.value }))}
                          placeholder="29"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sub Total (₹)
                        </label>
                        <Input
                          type="number"
                          value={sampleInvoice.sub_total}
                          onChange={(e) => setSampleInvoice(prev => ({ ...prev, sub_total: parseFloat(e.target.value) || 0 }))}
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GST Rate (%)
                        </label>
                        <Input
                          type="number"
                          value={sampleInvoice.gst_rate}
                          onChange={(e) => setSampleInvoice(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
                          placeholder="18"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addSampleInvoice} variant="outline">
                        Add Invoice
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card title="Upload Purchase Ledger Data">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload URL (from reconciliation job)
                      </label>
                      <Input
                        value={uploadForm.upload_url}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, upload_url: e.target.value }))}
                        placeholder="https://s3.amazonaws.com/upload-url"
                      />
                    </div>
                    
                    {uploadForm.ledger_data.invoices.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Invoices to Upload ({uploadForm.ledger_data.invoices.length})</h4>
                        <div className="max-h-40 overflow-y-auto border rounded-lg">
                          {uploadForm.ledger_data.invoices.map((invoice, index) => (
                            <div key={index} className="p-3 border-b last:border-b-0 text-sm">
                              <div className="flex justify-between">
                                <span>{invoice.supplier_name} - {invoice.invoice_number}</span>
                                <span>₹{invoice.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleUploadLedgerData}
                        disabled={loading || !uploadForm.upload_url || uploadForm.ledger_data.invoices.length === 0}
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload className="h-4 w-4 mr-2" />
                            Upload Ledger Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}