import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { accountingAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiUpload, FiFile, FiCheck, FiX, FiAlertCircle, FiInfo, FiDownload } from 'react-icons/fi';

export default function TallyImport() {
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

  // Load template info on mount
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await accountingAPI.tallyImport.getTemplate();
        setTemplateInfo(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to load template info:', error);
      }
    };
    loadTemplate();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xml', '.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file type. Please upload XML, Excel (.xlsx, .xls), or CSV file.');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 50MB limit. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('importOptions', JSON.stringify(importOptions));

      const response = await accountingAPI.tallyImport.import(
        formData,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setImportResult(response.data?.data || response.data);
      toast.success('Tally data imported successfully!');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('tally-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to import Tally data');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (imported, skipped, errors) => {
    if (errors && errors.length > 0) {
      return <Badge variant="danger">Errors</Badge>;
    }
    if (imported > 0 && skipped === 0) {
      return <Badge variant="success">Success</Badge>;
    }
    if (imported > 0) {
      return <Badge variant="warning">Partial</Badge>;
    }
    return <Badge variant="default">Skipped</Badge>;
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout>
        <Toaster />
        <PageLayout
          title="Import from Tally"
          breadcrumbs={[
            { label: 'Dashboard', href: '/client/dashboard' },
            { label: 'Tally Import' },
          ]}
        >
          <div className="space-y-6">
            {/* Instructions Card */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FiInfo className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">How to Export from Tally</h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Step 1: Open Tally</h4>
                    <p className="text-sm text-blue-800">Go to <strong>Gateway of Tally</strong></p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Step 2: Export Data</h4>
                    <p className="text-sm text-blue-800">
                      Navigate to <strong>Display</strong> → <strong>List of Accounts</strong>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Step 3: Choose Format</h4>
                    <p className="text-sm text-blue-800">
                      Press <strong>Alt+E</strong> or click <strong>Export</strong>, then select:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-800 mt-1 ml-4">
                      <li><strong>XML</strong> (Recommended - Most comprehensive)</li>
                      <li><strong>Excel</strong> (.xlsx, .xls)</li>
                      <li><strong>CSV</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* File Upload Card */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Tally Export File</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="tally-file-input"
                      className={`
                        cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm
                        text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <FiUpload className="h-4 w-4 mr-2" />
                      Choose File
                    </label>
                    <input
                      id="tally-file-input"
                      type="file"
                      accept=".xml,.xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-2">
                        <FiFile className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            const fileInput = document.getElementById('tally-file-input');
                            if (fileInput) fileInput.value = '';
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Supported formats: XML, Excel (.xlsx, .xls), CSV (Max 50MB)
                  </p>
                </div>

                {/* Import Options */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Import Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importOptions.importGroups}
                        onChange={(e) =>
                          setImportOptions({ ...importOptions, importGroups: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Import Account Groups</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importOptions.importLedgers}
                        onChange={(e) =>
                          setImportOptions({ ...importOptions, importLedgers: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Import Ledgers</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importOptions.importStockItems}
                        onChange={(e) =>
                          setImportOptions({ ...importOptions, importStockItems: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Import Stock Items</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importOptions.importVouchers}
                        onChange={(e) =>
                          setImportOptions({ ...importOptions, importVouchers: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Import Vouchers</span>
                    </label>
                    {importOptions.importVouchers && (
                      <div className="ml-6">
                        <label className="block text-xs text-gray-600 mb-1">
                          Max Vouchers (to prevent timeout)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={importOptions.maxVouchers}
                          onChange={(e) =>
                            setImportOptions({
                              ...importOptions,
                              maxVouchers: parseInt(e.target.value) || 1000,
                            })
                          }
                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Import Button */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || uploading}
                    loading={uploading}
                    className="flex items-center gap-2"
                  >
                    <FiUpload className="h-4 w-4" />
                    {uploading ? 'Importing...' : 'Import Data'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Import Results */}
            {importResult && (
              <Card>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
                    {importResult.summary && (
                      <div className="text-sm text-gray-600">
                        Total Processed: {Object.values(importResult.summary).reduce((a, b) => a + b, 0)} records
                      </div>
                    )}
                  </div>

                  {/* Groups Results */}
                  {importResult.groups && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Account Groups</h4>
                        {getStatusBadge(
                          importResult.groups.imported,
                          importResult.groups.skipped,
                          importResult.groups.errors
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Imported:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {importResult.groups.imported}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Skipped:</span>
                          <span className="ml-2 font-medium text-yellow-600">
                            {importResult.groups.skipped}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {importResult.groups.errors?.length || 0}
                          </span>
                        </div>
                      </div>
                      {importResult.groups.errors && importResult.groups.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {importResult.groups.errors.slice(0, 5).map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 flex items-center gap-1">
                              <FiAlertCircle className="h-3 w-3" />
                              {error.group}: {error.error}
                            </div>
                          ))}
                          {importResult.groups.errors.length > 5 && (
                            <div className="text-xs text-gray-500">
                              +{importResult.groups.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ledgers Results */}
                  {importResult.ledgers && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Ledgers</h4>
                        {getStatusBadge(
                          importResult.ledgers.imported,
                          importResult.ledgers.skipped,
                          importResult.ledgers.errors
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Imported:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {importResult.ledgers.imported}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Skipped:</span>
                          <span className="ml-2 font-medium text-yellow-600">
                            {importResult.ledgers.skipped}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {importResult.ledgers.errors?.length || 0}
                          </span>
                        </div>
                      </div>
                      {importResult.ledgers.errors && importResult.ledgers.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {importResult.ledgers.errors.slice(0, 5).map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 flex items-center gap-1">
                              <FiAlertCircle className="h-3 w-3" />
                              {error.ledger}: {error.error}
                            </div>
                          ))}
                          {importResult.ledgers.errors.length > 5 && (
                            <div className="text-xs text-gray-500">
                              +{importResult.ledgers.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock Items Results */}
                  {importResult.stockItems && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Stock Items</h4>
                        {getStatusBadge(
                          importResult.stockItems.imported,
                          importResult.stockItems.skipped,
                          importResult.stockItems.errors
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Imported:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {importResult.stockItems.imported}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Skipped:</span>
                          <span className="ml-2 font-medium text-yellow-600">
                            {importResult.stockItems.skipped}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {importResult.stockItems.errors?.length || 0}
                          </span>
                        </div>
                      </div>
                      {importResult.stockItems.errors && importResult.stockItems.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {importResult.stockItems.errors.slice(0, 5).map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 flex items-center gap-1">
                              <FiAlertCircle className="h-3 w-3" />
                              {error.item}: {error.error}
                            </div>
                          ))}
                          {importResult.stockItems.errors.length > 5 && (
                            <div className="text-xs text-gray-500">
                              +{importResult.stockItems.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vouchers Results */}
                  {importResult.vouchers && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Vouchers</h4>
                        {getStatusBadge(
                          importResult.vouchers.imported,
                          importResult.vouchers.skipped,
                          importResult.vouchers.errors
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Imported:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {importResult.vouchers.imported}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Skipped:</span>
                          <span className="ml-2 font-medium text-yellow-600">
                            {importResult.vouchers.skipped}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {importResult.vouchers.errors?.length || 0}
                          </span>
                        </div>
                      </div>
                      {importResult.vouchers.errors && importResult.vouchers.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {importResult.vouchers.errors.slice(0, 5).map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 flex items-center gap-1">
                              <FiAlertCircle className="h-3 w-3" />
                              {error.voucher}: {error.error}
                            </div>
                          ))}
                          {importResult.vouchers.errors.length > 5 && (
                            <div className="text-xs text-gray-500">
                              +{importResult.vouchers.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
