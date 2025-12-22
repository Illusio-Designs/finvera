import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormTextarea from '../../components/forms/FormTextarea';
import FormDatePicker from '../../components/forms/FormDatePicker';
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import DataTable from '../../components/tables/DataTable';
import toast from 'react-hot-toast';
import { companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { extractPANFromGSTIN } from '../../lib/formatters';
import { FiPlus, FiX, FiSave, FiPackage } from 'react-icons/fi';

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership_firm', label: 'Partnership Firm' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'opc', label: 'One Person Company (OPC)' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'section_8', label: 'Section 8 Company (Non-profit)' },
];

export default function CompaniesPage() {
  const router = useRouter();
  const { switchCompany } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    company_name: '',
    company_type: 'private_limited',
    registration_number: '',
    incorporation_date: '',
    pan: '',
    tan: '',
    gstin: '',
    registered_address: '',
    state: '',
    pincode: '',
    contact_number: '',
    email: '',
    principal_name: '',
    principal_din: '',
    principal_pan: '',
    principal_phone: '',
    principal_address: '',
    financial_year_start: '',
    financial_year_end: '',
    currency: 'INR',
    books_beginning_date: '',
    bank_name: '',
    bank_branch: '',
    bank_account_number: '',
    bank_ifsc: '',
    tds_applicable: false,
    gst_registered: false,
    professional_tax_registered: false,
    // E-Invoice Configuration
    e_invoice_applicable: false,
    e_invoice_username: '',
    e_invoice_password: '',
    e_invoice_client_id: '',
    e_invoice_client_secret: '',
    e_invoice_threshold: '50000000', // 5 Crore default threshold
    // E-Way Bill Configuration
    e_way_bill_applicable: false,
    e_way_bill_username: '',
    e_way_bill_password: '',
    e_way_bill_client_id: '',
    e_way_bill_client_secret: '',
  });

  // Fetch companies and status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, statusRes] = await Promise.all([
          companyAPI.list().catch(() => ({ data: { data: [] } })),
          companyAPI.status().catch(() => ({ data: { data: {} } })),
        ]);
        setCompanies(companiesRes?.data?.data || companiesRes?.data || []);
        setStatus(statusRes?.data?.data || {});
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchData();
  }, []);

  // Check if company limit reached and auto-show form for new users
  useEffect(() => {
    if (status) {
      const companyCount = status.company_count || 0;
      const maxCompanies = status.max_companies || 1;
      if (companyCount >= maxCompanies && companies.length > 0) {
        // If limit reached and companies exist, hide form
        setShowForm(false);
      } else if (companyCount === 0) {
        // If no companies exist, automatically show the form
        setShowForm(true);
      }
    }
  }, [status, companies]);

  const resetForm = () => {
    setFormData({
      company_name: '',
      company_type: 'private_limited',
      registration_number: '',
      incorporation_date: '',
      pan: '',
      tan: '',
      gstin: '',
      registered_address: '',
      state: '',
      pincode: '',
      contact_number: '',
      email: '',
      principal_name: '',
      principal_din: '',
      principal_pan: '',
      principal_phone: '',
      principal_address: '',
      financial_year_start: '',
      financial_year_end: '',
      currency: 'INR',
      books_beginning_date: '',
      bank_name: '',
      bank_branch: '',
      bank_account_number: '',
      bank_ifsc: '',
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
      tds_applicable: false,
      gst_registered: false,
      professional_tax_registered: false,
      e_invoice_applicable: false,
      e_invoice_username: '',
      e_invoice_password: '',
      e_invoice_client_id: '',
      e_invoice_client_secret: '',
      e_invoice_threshold: '50000000',
      e_way_bill_applicable: false,
      e_way_bill_username: '',
      e_way_bill_password: '',
      e_way_bill_client_id: '',
      e_way_bill_client_secret: '',
    });
    setFormErrors({});
    setShowForm(false);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-set TDS applicable when TAN is entered
      if (name === 'tan') {
        updated.tds_applicable = !!value.trim();
      }

      // Auto-set GST registered when GST is entered
      if (name === 'gstin') {
        updated.gst_registered = !!value.trim();
      }

      return updated;
    });
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const payload = useMemo(() => {
    const principals = [];
    if (formData.principal_name.trim()) {
      principals.push({
        full_name: formData.principal_name.trim(),
        din: formData.principal_din?.trim() || null,
        pan: formData.principal_pan?.trim() || null,
        phone: formData.principal_phone?.trim() || null,
        address: formData.principal_address?.trim() || null,
      });
    }

    return {
      company_name: formData.company_name.trim(),
      company_type: formData.company_type,
      registration_number: formData.registration_number?.trim() || null,
      incorporation_date: formData.incorporation_date || null,
      pan: formData.pan?.trim() || null,
      tan: formData.tan?.trim() || null,
      gstin: formData.gstin?.trim() || null,
      registered_address: formData.registered_address?.trim() || null,
      state: formData.state?.trim() || null,
      pincode: formData.pincode?.trim() || null,
      contact_number: formData.contact_number?.trim() || null,
      email: formData.email?.trim() || null,
      principals: principals.length ? principals : null,
      financial_year_start: formData.financial_year_start || null,
      financial_year_end: formData.financial_year_end || null,
      currency: formData.currency || 'INR',
      books_beginning_date: formData.books_beginning_date || null,
      bank_details: {
        bank_name: formData.bank_name?.trim() || null,
        branch: formData.bank_branch?.trim() || null,
        account_number: formData.bank_account_number?.trim() || null,
        ifsc: formData.bank_ifsc?.trim() || null,
      },
      compliance: {
        tds_applicable: !!formData.tds_applicable,
        gst_registered: !!formData.gst_registered,
        professional_tax_registered: !!formData.professional_tax_registered,
        // E-Invoice Configuration
        e_invoice: {
          applicable: formData.e_invoice_applicable,
          username: formData.e_invoice_username?.trim() || null,
          password: formData.e_invoice_password?.trim() || null,
          client_id: formData.e_invoice_client_id?.trim() || null,
          client_secret: formData.e_invoice_client_secret?.trim() || null,
          threshold: formData.e_invoice_threshold ? parseFloat(formData.e_invoice_threshold) : 50000000,
        },
        // E-Way Bill Configuration
        e_way_bill: {
          applicable: formData.e_way_bill_applicable,
          username: formData.e_way_bill_username?.trim() || null,
          password: formData.e_way_bill_password?.trim() || null,
          client_id: formData.e_way_bill_client_id?.trim() || null,
          client_secret: formData.e_way_bill_client_secret?.trim() || null,
        },
      },
    };
  }, [formData]);

  const validate = () => {
    const errors = {};
    if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
    if (!formData.company_type) errors.company_type = 'Company type is required';
    if (!formData.currency.trim()) errors.currency = 'Currency is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const response = await companyAPI.create(payload);
      const createdCompany = response?.data?.data || response?.data;
      const companyId = createdCompany?.id;

      if (companyId && switchCompany) {
        try {
          await switchCompany(companyId);
          toast.success('Company created successfully');
          setTimeout(() => {
            router.replace('/client/dashboard');
          }, 300);
        } catch (switchError) {
          console.error('Error switching to company:', switchError);
          toast.success('Company created successfully. Please refresh the page.');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        toast.success('Company created successfully');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create company');
      setLoading(false);
    }
  };

  const handleSwitchCompany = async (companyId) => {
    try {
      if (switchCompany) {
        await switchCompany(companyId);
        toast.success('Company switched successfully');
        setTimeout(() => {
          router.replace('/client/dashboard');
        }, 300);
      }
    } catch (error) {
      toast.error('Failed to switch company');
    }
  };

  const canCreateMore = status ? (status.company_count || 0) < (status.max_companies || 1) : true;

  const columns = [
    { key: 'company_name', label: 'Company Name', sortable: true },
    { key: 'company_type', label: 'Type', render: (value) => {
      const type = COMPANY_TYPES.find(t => t.value === value);
      return type ? type.label : value;
    }},
    { key: 'gstin', label: 'GSTIN' },
    { key: 'pan', label: 'PAN' },
    { key: 'state', label: 'State' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <Button
          onClick={() => handleSwitchCompany(row.id)}
          variant="outline"
          className="text-sm"
        >
          Switch to this Company
        </Button>
      ),
    },
  ];

  const tableData = Array.isArray(companies) ? companies : [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Companies">
        <PageLayout
          title="Companies"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Companies' },
          ]}
          actions={
            !showForm && canCreateMore ? (
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Company</span>
              </Button>
            ) : showForm ? (
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiX className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            ) : null
          }
        >
          {showForm ? (
            <Card>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">New Company</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add your company details to start using accounting features. Database setup will run after creation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="company_name"
                      label="Company Name"
                      value={formData.company_name}
                      onChange={handleChange}
                      error={formErrors.company_name}
                      touched={!!formErrors.company_name}
                      required
                    />
                    <FormSelect
                      name="company_type"
                      label="Company Type / Structure"
                      value={formData.company_type}
                      onChange={handleChange}
                      error={formErrors.company_type}
                      touched={!!formErrors.company_type}
                      options={COMPANY_TYPES}
                      required
                    />
                    {(formData.company_type === 'private_limited' || formData.company_type === 'llp') && (
                      <FormInput
                        name="registration_number"
                        label="Registration Number (CIN / LLPIN)"
                        value={formData.registration_number}
                        onChange={handleChange}
                        placeholder="e.g. U12345MH2025PTC123456"
                      />
                    )}
                    <FormDatePicker
                      name="incorporation_date"
                      label="Date of Incorporation"
                      value={formData.incorporation_date}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="gstin"
                      label="GSTIN"
                      value={formData.gstin}
                      onChange={(name, value) => {
                        const upperValue = value.toUpperCase().replace(/\s/g, '');
                        setFormData((prev) => {
                          const updated = { ...prev, [name]: upperValue };

                          if (upperValue.length === 15) {
                            const extractedPAN = extractPANFromGSTIN(upperValue);
                            if (extractedPAN && !prev.pan) {
                              updated.pan = extractedPAN;
                            }
                          }

                          updated.gst_registered = !!upperValue.trim();
                          return updated;
                        });
                        if (formErrors[name]) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next[name];
                            return next;
                          });
                        }
                      }}
                      error={formErrors.gstin}
                      touched={!!formErrors.gstin}
                      placeholder="27ABCDE1234F1Z5 (15 characters)"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <FormInput
                      name="pan"
                      label="PAN"
                      value={formData.pan}
                      onChange={(name, value) => handleChange(name, value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      style={{ textTransform: 'uppercase' }}
                    />
                    <FormInput
                      name="tan"
                      label="TAN (optional)"
                      value={formData.tan}
                      onChange={(name, value) => {
                        const upperValue = value.toUpperCase();
                        handleChange(name, upperValue);
                      }}
                      placeholder="ABCD12345E"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Registered Office</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormTextarea
                        name="registered_address"
                        label="Registered Office Address"
                        value={formData.registered_address}
                        onChange={handleChange}
                        placeholder="Full address"
                      />
                    </div>
                    <FormInput
                      name="state"
                      label="State"
                      value={formData.state}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="pincode"
                      label="PIN Code"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="contact_number"
                      label="Contact Number"
                      value={formData.contact_number}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Director / Partner / Proprietor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="principal_name"
                      label="Full Name"
                      value={formData.principal_name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                    />
                    <FormInput
                      name="principal_din"
                      label="DIN (for companies)"
                      value={formData.principal_din}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                    <FormInput
                      name="principal_pan"
                      label="PAN"
                      value={formData.principal_pan}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                    <FormInput
                      name="principal_phone"
                      label="Contact"
                      value={formData.principal_phone}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                    <div className="md:col-span-2">
                      <FormTextarea
                        name="principal_address"
                        label="Address"
                        value={formData.principal_address}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial & Accounting</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormDatePicker
                      name="financial_year_start"
                      label="Financial Year Start"
                      value={formData.financial_year_start}
                      onChange={handleChange}
                    />
                    <FormDatePicker
                      name="financial_year_end"
                      label="Financial Year End"
                      value={formData.financial_year_end}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="currency"
                      label="Currency"
                      value={formData.currency}
                      onChange={handleChange}
                      error={formErrors.currency}
                      touched={!!formErrors.currency}
                    />
                    <FormDatePicker
                      name="books_beginning_date"
                      label="Books Beginning Date"
                      value={formData.books_beginning_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bank Details (optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="bank_name"
                      label="Bank Name"
                      value={formData.bank_name}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="bank_branch"
                      label="Branch"
                      value={formData.bank_branch}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="bank_account_number"
                      label="Account Number"
                      value={formData.bank_account_number}
                      onChange={handleChange}
                    />
                    <FormInput
                      name="bank_ifsc"
                      label="IFSC"
                      value={formData.bank_ifsc}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {formData.gstin && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Compliance</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={formData.professional_tax_registered}
                            onChange={(e) =>
                              handleChange('professional_tax_registered', e.target.checked)
                            }
                            className="h-4 w-4"
                          />
                          Professional tax registered
                        </label>
                      </div>
                    </div>

                    {/* E-Invoice Configuration */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <FormInput
                            name="e_invoice_username"
                            label="API Username"
                            type="text"
                            value={formData.e_invoice_username}
                            onChange={handleChange}
                            placeholder="E-invoice portal username"
                          />
                          <FormPasswordInput
                            name="e_invoice_password"
                            label="API Password"
                            value={formData.e_invoice_password}
                            onChange={handleChange}
                            placeholder="E-invoice portal password"
                          />
                          <FormInput
                            name="e_invoice_client_id"
                            label="Client ID"
                            type="text"
                            value={formData.e_invoice_client_id}
                            onChange={handleChange}
                            placeholder="GSP/Client ID"
                          />
                          <FormPasswordInput
                            name="e_invoice_client_secret"
                            label="Client Secret"
                            value={formData.e_invoice_client_secret}
                            onChange={handleChange}
                            placeholder="GSP/Client Secret"
                          />
                          <FormInput
                            name="e_invoice_threshold"
                            label="E-Invoice Threshold (₹)"
                            type="number"
                            value={formData.e_invoice_threshold}
                            onChange={handleChange}
                            placeholder="50000000"
                            helperText="Annual turnover threshold for e-invoice applicability (default: 5 Crore)"
                          />
                        </div>
                      )}
                    </div>

                    {/* E-Way Bill Configuration */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <FormInput
                            name="e_way_bill_username"
                            label="API Username"
                            type="text"
                            value={formData.e_way_bill_username}
                            onChange={handleChange}
                            placeholder="E-way bill portal username"
                          />
                          <FormPasswordInput
                            name="e_way_bill_password"
                            label="API Password"
                            value={formData.e_way_bill_password}
                            onChange={handleChange}
                            placeholder="E-way bill portal password"
                          />
                          <FormInput
                            name="e_way_bill_client_id"
                            label="Client ID"
                            type="text"
                            value={formData.e_way_bill_client_id}
                            onChange={handleChange}
                            placeholder="GSP/Client ID"
                          />
                          <FormPasswordInput
                            name="e_way_bill_client_secret"
                            label="Client Secret"
                            value={formData.e_way_bill_client_secret}
                            onChange={handleChange}
                            placeholder="GSP/Client Secret"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button type="submit" loading={loading} disabled={loading} className="flex items-center gap-2">
                    <FiSave className="h-4 w-4" />
                    <span>Create Company</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              {companies.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={tableData}
                  loading={false}
                  searchable={false}
                />
              ) : (
                <div className="text-center py-12">
                  <FiPackage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies</h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first company.
                  </p>
                  {canCreateMore && (
                    <Button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Add Company</span>
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
