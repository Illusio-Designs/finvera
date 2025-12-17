import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormTextarea from '../../../components/forms/FormTextarea';
import toast, { Toaster } from 'react-hot-toast';
import { companyAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership_firm', label: 'Partnership Firm' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'opc', label: 'One Person Company (OPC)' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'section_8', label: 'Section 8 Company (Non-profit)' },
];

const ACCOUNTING_METHODS = [
  { value: 'cash', label: 'Cash Basis' },
  { value: 'accrual', label: 'Accrual Basis' },
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const { switchCompany } = useAuth();
  const [loading, setLoading] = useState(false);
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

    // Principal (single entry UI, stored as array)
    principal_name: '',
    principal_din: '',
    principal_pan: '',
    principal_phone: '',
    principal_address: '',

    financial_year_start: '',
    financial_year_end: '',
    authorized_capital: '',
    accounting_method: 'accrual',
    currency: 'INR',
    books_beginning_date: '',

    bank_name: '',
    bank_branch: '',
    bank_account_number: '',
    bank_ifsc: '',

    tds_applicable: false,
    gst_registered: false,
    professional_tax_registered: false,
  });

  useEffect(() => {
    // If plan/company limit reached, skip this page
    (async () => {
      try {
        const res = await companyAPI.status();
        const status = res?.data?.data || {};
        const companyCount = status.company_count || 0;
        const maxCompanies = status.max_companies || 1;
        if (companyCount >= maxCompanies) router.replace('/client/dashboard');
      } catch (e) {
        // ignore
      }
    })();
  }, [router]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      authorized_capital: formData.authorized_capital || null,
      accounting_method: formData.accounting_method,
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
      },
    };
  }, [formData]);

  const validate = () => {
    const errors = {};
    if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
    if (!formData.company_type) errors.company_type = 'Company type is required';
    if (!formData.currency.trim()) errors.currency = 'Currency is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const response = await companyAPI.create(payload);
      const createdCompany = response?.data?.data || response?.data;
      const companyId = createdCompany?.id;
      
      if (companyId && switchCompany) {
        // Switch to the newly created company
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

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Create Company">
        <Toaster />
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your company</h1>
            <p className="text-sm text-gray-600">
              Add your company details to start using accounting features. Database setup will run after creation.
            </p>
          </Card>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
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
                  <FormInput
                    name="registration_number"
                    label="Registration Number (CIN / LLPIN)"
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="e.g. U12345MH2025PTC123456"
                  />
                  <FormInput
                    name="incorporation_date"
                    label="Date of Incorporation"
                    type="date"
                    value={formData.incorporation_date}
                    onChange={handleChange}
                  />
                  <FormInput
                    name="pan"
                    label="PAN"
                    value={formData.pan}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                  />
                  <FormInput
                    name="tan"
                    label="TAN"
                    value={formData.tan}
                    onChange={handleChange}
                    placeholder="ABCD12345E"
                  />
                  <FormInput
                    name="gstin"
                    label="GSTIN (if applicable)"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="27ABCDE1234F1Z5"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Registered Office</h2>
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
                <h2 className="text-lg font-semibold text-gray-900">Director / Partner / Proprietor</h2>
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
                <h2 className="text-lg font-semibold text-gray-900">Financial & Accounting</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="financial_year_start"
                    label="Financial Year Start"
                    type="date"
                    value={formData.financial_year_start}
                    onChange={handleChange}
                  />
                  <FormInput
                    name="financial_year_end"
                    label="Financial Year End"
                    type="date"
                    value={formData.financial_year_end}
                    onChange={handleChange}
                  />
                  <FormInput
                    name="authorized_capital"
                    label="Authorized Capital (optional)"
                    type="number"
                    value={formData.authorized_capital}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <FormSelect
                    name="accounting_method"
                    label="Accounting Method"
                    value={formData.accounting_method}
                    onChange={handleChange}
                    options={ACCOUNTING_METHODS}
                  />
                  <FormInput
                    name="currency"
                    label="Currency"
                    value={formData.currency}
                    onChange={handleChange}
                    error={formErrors.currency}
                    touched={!!formErrors.currency}
                  />
                  <FormInput
                    name="books_beginning_date"
                    label="Books Beginning Date"
                    type="date"
                    value={formData.books_beginning_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Bank Details (optional)</h2>
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

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Compliance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.tds_applicable}
                      onChange={(e) => handleChange('tds_applicable', e.target.checked)}
                      className="h-4 w-4"
                    />
                    TDS applicable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.gst_registered}
                      onChange={(e) => handleChange('gst_registered', e.target.checked)}
                      className="h-4 w-4"
                    />
                    GST registered
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.professional_tax_registered}
                      onChange={(e) => handleChange('professional_tax_registered', e.target.checked)}
                      className="h-4 w-4"
                    />
                    Professional tax registered
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" loading={loading} disabled={loading}>
                  Create Company
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}

