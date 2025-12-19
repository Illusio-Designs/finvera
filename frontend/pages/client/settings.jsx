import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import { companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSave, FiSettings } from 'react-icons/fi';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // E-Invoice Configuration
    e_invoice_applicable: false,
    e_invoice_username: '',
    e_invoice_password: '',
    e_invoice_client_id: '',
    e_invoice_client_secret: '',
    e_invoice_threshold: '50000000',
    // E-Way Bill Configuration
    e_way_bill_applicable: false,
    e_way_bill_username: '',
    e_way_bill_password: '',
    e_way_bill_client_id: '',
    e_way_bill_client_secret: '',
    // Invoice Number Configuration
    sales_invoice_prefix: 'INV',
    sales_invoice_suffix: '',
    sales_invoice_padding: 6,
    purchase_invoice_prefix: 'PUR',
    purchase_invoice_suffix: '',
    purchase_invoice_padding: 6,
  });

  // Fetch current company details
  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.company_id) {
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        const response = await companyAPI.get(user.company_id);
        // Handle different response structures
        const company = response?.data?.data || response?.data;
        
        if (company) {
          const compliance = company.compliance || {};
          const eInvoice = compliance.e_invoice || {};
          const eWayBill = compliance.e_way_bill || {};
          const invoiceConfig = compliance.invoice_numbering || {};

          setFormData({
            // E-Invoice Configuration
            e_invoice_applicable: eInvoice.applicable || false,
            e_invoice_username: eInvoice.username || '',
            e_invoice_password: '', // Don't show existing password
            e_invoice_client_id: eInvoice.client_id || '',
            e_invoice_client_secret: '', // Don't show existing secret
            e_invoice_threshold: eInvoice.threshold?.toString() || '50000000',
            // E-Way Bill Configuration
            e_way_bill_applicable: eWayBill.applicable || false,
            e_way_bill_username: eWayBill.username || '',
            e_way_bill_password: '', // Don't show existing password
            e_way_bill_client_id: eWayBill.client_id || '',
            e_way_bill_client_secret: '', // Don't show existing secret
            // Invoice Number Configuration
            sales_invoice_prefix: invoiceConfig.sales?.prefix || 'INV',
            sales_invoice_suffix: invoiceConfig.sales?.suffix || '',
            sales_invoice_padding: invoiceConfig.sales?.padding || 6,
            purchase_invoice_prefix: invoiceConfig.purchase?.prefix || 'PUR',
            purchase_invoice_suffix: invoiceConfig.purchase?.suffix || '',
            purchase_invoice_padding: invoiceConfig.purchase?.padding || 6,
          });
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          toast.error('Unable to connect to server. Please ensure the backend is running.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to load company settings');
        }
      } finally {
        setFetching(false);
      }
    };

    fetchCompany();
  }, [user?.company_id]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Build e_invoice config - only include password/secret if provided
      const eInvoiceConfig = {
        applicable: formData.e_invoice_applicable,
        username: formData.e_invoice_username?.trim() || null,
        client_id: formData.e_invoice_client_id?.trim() || null,
        threshold: formData.e_invoice_threshold ? parseFloat(formData.e_invoice_threshold) : 50000000,
      };
      if (formData.e_invoice_password?.trim()) {
        eInvoiceConfig.password = formData.e_invoice_password.trim();
      }
      if (formData.e_invoice_client_secret?.trim()) {
        eInvoiceConfig.client_secret = formData.e_invoice_client_secret.trim();
      }

      // Build e_way_bill config - only include password/secret if provided
      const eWayBillConfig = {
        applicable: formData.e_way_bill_applicable,
        username: formData.e_way_bill_username?.trim() || null,
        client_id: formData.e_way_bill_client_id?.trim() || null,
      };
      if (formData.e_way_bill_password?.trim()) {
        eWayBillConfig.password = formData.e_way_bill_password.trim();
      }
      if (formData.e_way_bill_client_secret?.trim()) {
        eWayBillConfig.client_secret = formData.e_way_bill_client_secret.trim();
      }

      const compliance = {
        e_invoice: eInvoiceConfig,
        e_way_bill: eWayBillConfig,
        invoice_numbering: {
          sales: {
            prefix: formData.sales_invoice_prefix?.trim() || 'INV',
            suffix: formData.sales_invoice_suffix?.trim() || '',
            padding: parseInt(formData.sales_invoice_padding) || 6,
          },
          purchase: {
            prefix: formData.purchase_invoice_prefix?.trim() || 'PUR',
            suffix: formData.purchase_invoice_suffix?.trim() || '',
            padding: parseInt(formData.purchase_invoice_padding) || 6,
          },
        },
      };

      await companyAPI.update(user.company_id, { compliance });

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Unable to connect to server. Please ensure the backend is running.');
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update settings';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedRoute portalType="client">
        <ClientLayout>
          <PageLayout title="Settings">
            <Card>
              <div className="text-center py-8">Loading settings...</div>
            </Card>
          </PageLayout>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout>
        <PageLayout
          title="Company Settings"
          icon={<FiSettings className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-Invoice Configuration */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">E-Invoice Configuration</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.e_invoice_applicable}
                      onChange={(e) => handleChange('e_invoice_applicable', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>E-Invoice Applicable</span>
                  </label>
                </div>
                
                {formData.e_invoice_applicable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="e_invoice_username"
                      label="API Username"
                      type="text"
                      value={formData.e_invoice_username}
                      onChange={handleChange}
                      placeholder="E-invoice portal username"
                      error={errors.e_invoice_username}
                    />
                    <FormInput
                      name="e_invoice_password"
                      label="API Password"
                      type="password"
                      value={formData.e_invoice_password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep existing password"
                      error={errors.e_invoice_password}
                    />
                    <FormInput
                      name="e_invoice_client_id"
                      label="Client ID"
                      type="text"
                      value={formData.e_invoice_client_id}
                      onChange={handleChange}
                      placeholder="GSP/Client ID"
                      error={errors.e_invoice_client_id}
                    />
                    <FormInput
                      name="e_invoice_client_secret"
                      label="Client Secret"
                      type="password"
                      value={formData.e_invoice_client_secret}
                      onChange={handleChange}
                      placeholder="Leave blank to keep existing secret"
                      error={errors.e_invoice_client_secret}
                    />
                    <FormInput
                      name="e_invoice_threshold"
                      label="E-Invoice Threshold (₹)"
                      type="number"
                      value={formData.e_invoice_threshold}
                      onChange={handleChange}
                      placeholder="50000000"
                      helperText="Annual turnover threshold for e-invoice applicability (default: 5 Crore)"
                      error={errors.e_invoice_threshold}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* E-Way Bill Configuration */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">E-Way Bill Configuration</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.e_way_bill_applicable}
                      onChange={(e) => handleChange('e_way_bill_applicable', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>E-Way Bill Applicable</span>
                  </label>
                </div>
                
                {formData.e_way_bill_applicable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="e_way_bill_username"
                      label="API Username"
                      type="text"
                      value={formData.e_way_bill_username}
                      onChange={handleChange}
                      placeholder="E-way bill portal username"
                      error={errors.e_way_bill_username}
                    />
                    <FormInput
                      name="e_way_bill_password"
                      label="API Password"
                      type="password"
                      value={formData.e_way_bill_password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep existing password"
                      error={errors.e_way_bill_password}
                    />
                    <FormInput
                      name="e_way_bill_client_id"
                      label="Client ID"
                      type="text"
                      value={formData.e_way_bill_client_id}
                      onChange={handleChange}
                      placeholder="GSP/Client ID"
                      error={errors.e_way_bill_client_id}
                    />
                    <FormInput
                      name="e_way_bill_client_secret"
                      label="Client Secret"
                      type="password"
                      value={formData.e_way_bill_client_secret}
                      onChange={handleChange}
                      placeholder="Leave blank to keep existing secret"
                      error={errors.e_way_bill_client_secret}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Sales Invoice Number Configuration */}
            <Card>
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Sales Invoice Number Management</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure how sales invoice numbers are generated. Set your preferred prefix and suffix format.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      name="sales_invoice_prefix"
                      label="Prefix"
                      type="text"
                      value={formData.sales_invoice_prefix}
                      onChange={handleChange}
                      placeholder="INV"
                      error={errors.sales_invoice_prefix}
                      helperText="e.g., INV, SI, SAL, SI-2024"
                      required
                    />
                    <FormInput
                      name="sales_invoice_suffix"
                      label="Suffix (Optional)"
                      type="text"
                      value={formData.sales_invoice_suffix}
                      onChange={handleChange}
                      placeholder="Leave empty for no suffix"
                      error={errors.sales_invoice_suffix}
                      helperText="e.g., -FY24, /2024, -FY"
                    />
                    <FormInput
                      name="sales_invoice_padding"
                      label="Number Padding (Digits)"
                      type="number"
                      value={formData.sales_invoice_padding}
                      onChange={handleChange}
                      placeholder="6"
                      error={errors.sales_invoice_padding}
                      helperText="Number of digits (e.g., 6 = 000001, 4 = 0001)"
                      min={1}
                      max={10}
                      required
                    />
                  </div>
                  
                  {/* Live Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-900">Live Preview:</span>
                      <span className="text-lg font-mono font-bold text-blue-700">
                        {formData.sales_invoice_prefix || 'INV'}-{String(1).padStart(parseInt(formData.sales_invoice_padding) || 6, '0')}
                        {formData.sales_invoice_suffix ? formData.sales_invoice_suffix : ''}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Your sales invoices will be numbered sequentially using this format. 
                      Example: First invoice = {formData.sales_invoice_prefix || 'INV'}-{String(1).padStart(parseInt(formData.sales_invoice_padding) || 6, '0')}
                      {formData.sales_invoice_suffix ? formData.sales_invoice_suffix : ''}, 
                      Second = {formData.sales_invoice_prefix || 'INV'}-{String(2).padStart(parseInt(formData.sales_invoice_padding) || 6, '0')}
                      {formData.sales_invoice_suffix ? formData.sales_invoice_suffix : ''}
                    </p>
                  </div>

                  {/* Information Box */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h5>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                      <li>Prefix appears at the start of every invoice number</li>
                      <li>Suffix (if set) appears at the end of every invoice number</li>
                      <li>Numbers are auto-incremented and padded with zeros</li>
                      <li>Changes apply to new invoices only (existing invoices remain unchanged)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Purchase Invoice Number Configuration */}
            <Card>
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Purchase Invoice Number Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure prefix, suffix, and padding for purchase invoice numbers
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      name="purchase_invoice_prefix"
                      label="Prefix"
                      type="text"
                      value={formData.purchase_invoice_prefix}
                      onChange={handleChange}
                      placeholder="PUR"
                      error={errors.purchase_invoice_prefix}
                      helperText="e.g., PUR, PI, PURCH"
                    />
                    <FormInput
                      name="purchase_invoice_suffix"
                      label="Suffix (Optional)"
                      type="text"
                      value={formData.purchase_invoice_suffix}
                      onChange={handleChange}
                      placeholder="Leave empty for no suffix"
                      error={errors.purchase_invoice_suffix}
                      helperText="e.g., -FY24, /2024"
                    />
                    <FormInput
                      name="purchase_invoice_padding"
                      label="Number Padding"
                      type="number"
                      value={formData.purchase_invoice_padding}
                      onChange={handleChange}
                      placeholder="6"
                      error={errors.purchase_invoice_padding}
                      helperText="Number of digits (e.g., 6 = 000001)"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <strong>Example format:</strong>{' '}
                    {formData.purchase_invoice_prefix || 'PUR'}-{String(1).padStart(parseInt(formData.purchase_invoice_padding) || 6, '0')}
                    {formData.purchase_invoice_suffix ? formData.purchase_invoice_suffix : ''}
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FiSave className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </Button>
            </div>
          </form>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
