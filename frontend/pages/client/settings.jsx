import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Stepper from '../../components/ui/Stepper';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import FormSelect from '../../components/forms/FormSelect';
import FormDatePicker from '../../components/forms/FormDatePicker';
import { companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSettings, FiEdit2, FiFileText, FiTruck, FiHash, FiSave, FiX, FiArrowLeft, FiArrowRight, FiFile, FiImage, FiPenTool } from 'react-icons/fi';
import { TEMPLATES, TEMPLATE_TYPES, PRINT_SIZES, getDefaultTemplate } from '../../lib/invoiceTemplates';
import Image from 'next/image';

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership_firm', label: 'Partnership Firm' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'opc', label: 'One Person Company (OPC)' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'section_8', label: 'Section 8 Company (Non-profit)' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [company, setCompany] = useState(null);
  
  // Modal states
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showEInvoice, setShowEInvoice] = useState(false);
  const [showEWayBill, setShowEWayBill] = useState(false);
  const [showInvoiceNumbering, setShowInvoiceNumbering] = useState(false);
  const [showInvoiceTemplate, setShowInvoiceTemplate] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showSignatureUpload, setShowSignatureUpload] = useState(false);
  const [showDSCConfig, setShowDSCConfig] = useState(false);

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
        const companyData = response?.data?.data || response?.data;
        setCompany(companyData);
      } catch (error) {
        console.error('Error fetching company:', error);
        toast.error(error.response?.data?.message || 'Failed to load company settings');
      } finally {
        setFetching(false);
      }
    };

    fetchCompany();
  }, [user?.company_id]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edit Company Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowEditCompany(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <FiEdit2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Edit Company</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Update company information, registration details, and contact information
                      </p>
                    </div>
                  </div>
                  {company && (
                    <div className="mt-4 text-sm text-gray-700">
                      <div className="font-medium">{company.company_name}</div>
                      <div className="text-gray-500">{company.company_type?.replace('_', ' ')}</div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* E-Invoice Configuration Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowEInvoice(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiFileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">E-Invoice Configuration</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure e-invoice API credentials and settings
                      </p>
                    </div>
                  </div>
                  {company?.compliance?.e_invoice?.applicable && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* E-Way Bill Configuration Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowEWayBill(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiTruck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">E-Way Bill Configuration</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure e-way bill API credentials and settings
                      </p>
                    </div>
                  </div>
                  {company?.compliance?.e_way_bill?.applicable && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Company Logo Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowLogoUpload(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <FiImage className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload company logo for invoices and documents
                      </p>
                    </div>
                  </div>
                  {company?.logo_url && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Logo Uploaded
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Digital Signature Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowSignatureUpload(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <FiPenTool className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload DSC or signature for invoices
                      </p>
                    </div>
                  </div>
                  {company?.compliance?.signature_url && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Signature Uploaded
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* DSC Certificate Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowDSCConfig(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <FiFileText className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">DSC Certificate</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure DSC for e-invoice and e-way bill signing
                      </p>
                    </div>
                  </div>
                  {company?.compliance?.dsc?.certificate_type && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {company.compliance.dsc.certificate_type === 'file' ? 'Certificate File' :
                         company.compliance.dsc.certificate_type === 'usb_token' ? 'USB Token' :
                         company.compliance.dsc.certificate_type === 'cloud' ? 'Cloud Service' : 'Configured'}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Invoice Template Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowInvoiceTemplate(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiFile className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Invoice Template</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Select invoice template and print size preferences
                      </p>
                    </div>
                  </div>
                  {company?.compliance?.invoice_template?.template_name && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {TEMPLATES.find(t => t.id === company.compliance.invoice_template.template_name)?.name || 'Configured'}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Invoice Numbering Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowInvoiceNumbering(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiHash className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Invoice Numbering</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure invoice number prefixes, suffixes, and formatting
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Edit Company Modal */}
          <EditCompanyModal
            isOpen={showEditCompany}
            onClose={() => setShowEditCompany(false)}
            company={company}
            onSuccess={() => {
              setShowEditCompany(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* E-Invoice Modal */}
          <EInvoiceModal
            isOpen={showEInvoice}
            onClose={() => setShowEInvoice(false)}
            company={company}
            onSuccess={() => {
              setShowEInvoice(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* E-Way Bill Modal */}
          <EWayBillModal
            isOpen={showEWayBill}
            onClose={() => setShowEWayBill(false)}
            company={company}
            onSuccess={() => {
              setShowEWayBill(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* Logo Upload Modal */}
          <LogoUploadModal
            isOpen={showLogoUpload}
            onClose={() => setShowLogoUpload(false)}
            company={company}
            onSuccess={() => {
              setShowLogoUpload(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* Signature Upload Modal */}
          <SignatureUploadModal
            isOpen={showSignatureUpload}
            onClose={() => setShowSignatureUpload(false)}
            company={company}
            onSuccess={() => {
              setShowSignatureUpload(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* DSC Configuration Modal */}
          <DSCConfigModal
            isOpen={showDSCConfig}
            onClose={() => setShowDSCConfig(false)}
            company={company}
            onSuccess={() => {
              setShowDSCConfig(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* Invoice Template Modal */}
          <InvoiceTemplateModal
            isOpen={showInvoiceTemplate}
            onClose={() => setShowInvoiceTemplate(false)}
            company={company}
            onSuccess={() => {
              setShowInvoiceTemplate(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />

          {/* Invoice Numbering Modal */}
          <InvoiceNumberingModal
            isOpen={showInvoiceNumbering}
            onClose={() => setShowInvoiceNumbering(false)}
            company={company}
            onSuccess={() => {
              setShowInvoiceNumbering(false);
              // Refresh company data
              const fetchCompany = async () => {
                try {
                  const response = await companyAPI.get(user.company_id);
                  const companyData = response?.data?.data || response?.data;
                  setCompany(companyData);
                } catch (error) {
                  console.error('Error fetching company:', error);
                }
              };
              fetchCompany();
            }}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

// Edit Company Modal with Stepper
function EditCompanyModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { label: 'Basic Info', description: 'Company name and type' },
    { label: 'Registration', description: 'PAN, GSTIN, TAN' },
    { label: 'Address', description: 'Registered office details' },
    { label: 'Financial', description: 'Financial year and currency' },
  ];

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
    financial_year_start: '',
    financial_year_end: '',
    currency: 'INR',
    books_beginning_date: '',
  });

  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        company_name: company.company_name || '',
        company_type: company.company_type || 'private_limited',
        registration_number: company.registration_number || '',
        incorporation_date: company.incorporation_date || '',
        pan: company.pan || '',
        tan: company.tan || '',
        gstin: company.gstin || '',
        registered_address: company.registered_address || '',
        state: company.state || '',
        pincode: company.pincode || '',
        contact_number: company.contact_number || '',
        email: company.email || '',
        financial_year_start: company.financial_year_start || '',
        financial_year_end: company.financial_year_end || '',
        currency: company.currency || 'INR',
        books_beginning_date: company.books_beginning_date || '',
      });
      setCurrentStep(0);
      setErrors({});
    }
  }, [company, isOpen]);

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

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.company_name?.trim()) newErrors.company_name = 'Company name is required';
      if (!formData.company_type) newErrors.company_type = 'Company type is required';
    }
    
    if (step === 1) {
      if (formData.pan && formData.pan.length !== 10) {
        newErrors.pan = 'PAN must be 10 characters';
      }
      if (formData.gstin && formData.gstin.length !== 15) {
        newErrors.gstin = 'GSTIN must be 15 characters';
      }
      if (formData.tan && formData.tan.length !== 10) {
        newErrors.tan = 'TAN must be 10 characters';
      }
    }
    
    if (step === 2) {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      await companyAPI.update(user.company_id, {
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
        financial_year_start: formData.financial_year_start || null,
        financial_year_end: formData.financial_year_end || null,
        currency: formData.currency || 'INR',
        books_beginning_date: formData.books_beginning_date || null,
      });

      toast.success('Company updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error(error.response?.data?.message || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Company" size="xl">
      <div className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        {/* Step 1: Basic Info */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <FormInput
              name="company_name"
              label="Company Name"
              value={formData.company_name}
              onChange={handleChange}
              error={errors.company_name}
              required
            />
            <FormSelect
              name="company_type"
              label="Company Type"
              value={formData.company_type}
              onChange={handleChange}
              options={COMPANY_TYPES}
              error={errors.company_type}
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
          </div>
        )}

        {/* Step 2: Registration */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <FormInput
              name="pan"
              label="PAN"
              value={formData.pan}
              onChange={handleChange}
              error={errors.pan}
              maxLength={10}
              placeholder="ABCDE1234F"
            />
            <FormInput
              name="gstin"
              label="GSTIN"
              value={formData.gstin}
              onChange={handleChange}
              error={errors.gstin}
              maxLength={15}
              placeholder="29ABCDE1234F1Z5"
            />
            <FormInput
              name="tan"
              label="TAN"
              value={formData.tan}
              onChange={handleChange}
              error={errors.tan}
              maxLength={10}
              placeholder="ABCD12345E"
            />
          </div>
        )}

        {/* Step 3: Address */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <FormTextarea
              name="registered_address"
              label="Registered Address"
              value={formData.registered_address}
              onChange={handleChange}
              rows={4}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="state"
                label="State"
                value={formData.state}
                onChange={handleChange}
              />
              <FormInput
                name="pincode"
                label="Pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                error={errors.email}
              />
            </div>
          </div>
        )}

        {/* Step 4: Financial */}
        {currentStep === 3 && (
          <div className="space-y-4">
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
            </div>
            <FormDatePicker
              name="books_beginning_date"
              label="Books Beginning Date"
              value={formData.books_beginning_date}
              onChange={handleChange}
            />
            <FormSelect
              name="currency"
              label="Currency"
              value={formData.currency}
              onChange={handleChange}
              options={[
                { value: 'INR', label: 'INR - Indian Rupee' },
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
              ]}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <div className="flex gap-3">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <FiArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// E-Invoice Modal with Stepper
function EInvoiceModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { label: 'Enable', description: 'Enable e-invoice' },
    { label: 'Credentials', description: 'API credentials' },
  ];

  const compliance = company?.compliance || {};
  const eInvoice = compliance.e_invoice || {};

  const [formData, setFormData] = useState({
    e_invoice_applicable: false,
    e_invoice_username: '',
    e_invoice_password: '',
  });

  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        e_invoice_applicable: eInvoice.applicable || false,
        e_invoice_username: eInvoice.username || '',
        e_invoice_password: '',
      });
      setCurrentStep(0);
      setErrors({});
    }
  }, [company, isOpen]);

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

  const handleNext = () => {
    if (currentStep === 0 && formData.e_invoice_applicable) {
      setCurrentStep(1);
    } else if (currentStep === 0 && !formData.e_invoice_applicable) {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const eInvoiceConfig = {
        applicable: formData.e_invoice_applicable,
        username: formData.e_invoice_username?.trim() || null,
      };
      if (formData.e_invoice_password?.trim()) {
        eInvoiceConfig.password = formData.e_invoice_password.trim();
      }

      await companyAPI.update(user.company_id, {
        compliance: {
          ...compliance,
          e_invoice: eInvoiceConfig,
        },
      });

      toast.success('E-Invoice settings updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating e-invoice settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update e-invoice settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="E-Invoice Configuration" size="lg">
      <div className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Enable e-invoice integration to automatically generate IRN (Invoice Reference Number) for your invoices.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.e_invoice_applicable}
                onChange={(e) => handleChange('e_invoice_applicable', e.target.checked)}
                className="h-5 w-5 text-primary-600 rounded"
              />
              <span className="text-sm font-medium text-gray-900">Enable E-Invoice</span>
            </label>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <FormInput
              name="e_invoice_username"
              label="API Username"
              value={formData.e_invoice_username}
              onChange={handleChange}
              placeholder="E-invoice portal username"
              error={errors.e_invoice_username}
              required
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
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <Button onClick={currentStep === 0 ? handleNext : handleSubmit} disabled={loading}>
            {currentStep === 0 ? (
              <>
                Next
                <FiArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// E-Way Bill Modal with Stepper
function EWayBillModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { label: 'Enable', description: 'Enable e-way bill' },
    { label: 'Credentials', description: 'API credentials' },
  ];

  const compliance = company?.compliance || {};
  const eWayBill = compliance.e_way_bill || {};

  const [formData, setFormData] = useState({
    e_way_bill_applicable: false,
    e_way_bill_username: '',
    e_way_bill_password: '',
  });

  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        e_way_bill_applicable: eWayBill.applicable || false,
        e_way_bill_username: eWayBill.username || '',
        e_way_bill_password: '',
      });
      setCurrentStep(0);
      setErrors({});
    }
  }, [company, isOpen]);

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

  const handleNext = () => {
    if (currentStep === 0 && formData.e_way_bill_applicable) {
      setCurrentStep(1);
    } else if (currentStep === 0 && !formData.e_way_bill_applicable) {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const eWayBillConfig = {
        applicable: formData.e_way_bill_applicable,
        username: formData.e_way_bill_username?.trim() || null,
      };
      if (formData.e_way_bill_password?.trim()) {
        eWayBillConfig.password = formData.e_way_bill_password.trim();
      }

      await companyAPI.update(user.company_id, {
        compliance: {
          ...compliance,
          e_way_bill: eWayBillConfig,
        },
      });

      toast.success('E-Way Bill settings updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating e-way bill settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update e-way bill settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="E-Way Bill Configuration" size="lg">
      <div className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Enable e-way bill integration to generate e-way bills for your goods transportation.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.e_way_bill_applicable}
                onChange={(e) => handleChange('e_way_bill_applicable', e.target.checked)}
                className="h-5 w-5 text-primary-600 rounded"
              />
              <span className="text-sm font-medium text-gray-900">Enable E-Way Bill</span>
            </label>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <FormInput
              name="e_way_bill_username"
              label="API Username"
              value={formData.e_way_bill_username}
              onChange={handleChange}
              placeholder="E-way bill portal username"
              error={errors.e_way_bill_username}
              required
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
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <Button onClick={currentStep === 0 ? handleNext : handleSubmit} disabled={loading}>
            {currentStep === 0 ? (
              <>
                Next
                <FiArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Invoice Numbering Modal with Stepper
function InvoiceNumberingModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { label: 'Sales Invoice', description: 'Sales invoice numbering' },
    { label: 'Purchase Invoice', description: 'Purchase invoice numbering' },
  ];

  const compliance = company?.compliance || {};
  const invoiceConfig = compliance.invoice_numbering || {};
  const salesConfig = invoiceConfig.sales || {};
  const purchaseConfig = invoiceConfig.purchase || {};

  const [formData, setFormData] = useState({
    sales_invoice_prefix: 'INV',
    sales_invoice_suffix: '',
    sales_invoice_padding: 6,
    purchase_invoice_prefix: 'PUR',
    purchase_invoice_suffix: '',
    purchase_invoice_padding: 6,
  });

  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        sales_invoice_prefix: salesConfig.prefix || 'INV',
        sales_invoice_suffix: salesConfig.suffix || '',
        sales_invoice_padding: salesConfig.padding || 6,
        purchase_invoice_prefix: purchaseConfig.prefix || 'PUR',
        purchase_invoice_suffix: purchaseConfig.suffix || '',
        purchase_invoice_padding: purchaseConfig.padding || 6,
      });
      setCurrentStep(0);
      setErrors({});
    }
  }, [company, isOpen]);

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

  const handleNext = () => {
    setCurrentStep(1);
  };

  const handlePrevious = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await companyAPI.update(user.company_id, {
        compliance: {
          ...compliance,
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
        },
      });

      toast.success('Invoice numbering settings updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating invoice numbering settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update invoice numbering settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Numbering Configuration" size="lg">
      <div className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                name="sales_invoice_prefix"
                label="Prefix"
                value={formData.sales_invoice_prefix}
                onChange={handleChange}
                placeholder="INV"
                error={errors.sales_invoice_prefix}
                helperText="e.g., INV, SI, SAL"
                required
              />
              <FormInput
                name="sales_invoice_suffix"
                label="Suffix (Optional)"
                value={formData.sales_invoice_suffix}
                onChange={handleChange}
                placeholder="Leave empty for no suffix"
                error={errors.sales_invoice_suffix}
                helperText="e.g., -FY24, /2024"
              />
              <FormInput
                name="sales_invoice_padding"
                label="Number Padding (Digits)"
                type="number"
                value={formData.sales_invoice_padding}
                onChange={handleChange}
                placeholder="6"
                error={errors.sales_invoice_padding}
                helperText="Number of digits"
                min={1}
                max={10}
                required
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-blue-900 mb-2">Preview:</div>
              <div className="text-lg font-mono font-bold text-blue-700">
                {formData.sales_invoice_prefix || 'INV'}-{String(1).padStart(parseInt(formData.sales_invoice_padding) || 6, '0')}
                {formData.sales_invoice_suffix ? formData.sales_invoice_suffix : ''}
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                name="purchase_invoice_prefix"
                label="Prefix"
                value={formData.purchase_invoice_prefix}
                onChange={handleChange}
                placeholder="PUR"
                error={errors.purchase_invoice_prefix}
                helperText="e.g., PUR, PI"
                required
              />
              <FormInput
                name="purchase_invoice_suffix"
                label="Suffix (Optional)"
                value={formData.purchase_invoice_suffix}
                onChange={handleChange}
                placeholder="Leave empty for no suffix"
                error={errors.purchase_invoice_suffix}
                helperText="e.g., -FY24, /2024"
              />
              <FormInput
                name="purchase_invoice_padding"
                label="Number Padding (Digits)"
                type="number"
                value={formData.purchase_invoice_padding}
                onChange={handleChange}
                placeholder="6"
                error={errors.purchase_invoice_padding}
                helperText="Number of digits"
                min={1}
                max={10}
                required
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-blue-900 mb-2">Preview:</div>
              <div className="text-lg font-mono font-bold text-blue-700">
                {formData.purchase_invoice_prefix || 'PUR'}-{String(1).padStart(parseInt(formData.purchase_invoice_padding) || 6, '0')}
                {formData.purchase_invoice_suffix ? formData.purchase_invoice_suffix : ''}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <Button onClick={currentStep === 0 ? handleNext : handleSubmit} disabled={loading}>
            {currentStep === 0 ? (
              <>
                Next
                <FiArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Invoice Template Modal
function InvoiceTemplateModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const defaultTemplate = getDefaultTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate?.id || null);
  const [printSize, setPrintSize] = useState('A4');
  const [showLogo, setShowLogo] = useState(true);
  const [showQRCode, setShowQRCode] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);

  const compliance = company?.compliance || {};
  const invoiceTemplate = compliance.invoice_template || {};
  const templateName = invoiceTemplate?.template_name;
  const templatePrintSize = invoiceTemplate?.print_size;
  const templateShowLogo = invoiceTemplate?.show_logo;
  const templateShowQRCode = invoiceTemplate?.show_qr_code;
  const templateShowBankDetails = invoiceTemplate?.show_bank_details;

  useEffect(() => {
    if (company && isOpen) {
      const defaultTemplate = getDefaultTemplate();
      setSelectedTemplate(templateName || defaultTemplate.id);
      setPrintSize(templatePrintSize || 'A4');
      setShowLogo(templateShowLogo !== false);
      setShowQRCode(templateShowQRCode !== false);
      setShowBankDetails(templateShowBankDetails !== false);
    }
  }, [company, isOpen, templateName, templatePrintSize, templateShowLogo, templateShowQRCode, templateShowBankDetails]);

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      toast.error('Please select an invoice template');
      return;
    }

    setLoading(true);
    try {
      const templateConfig = {
        template_name: selectedTemplate,
        print_size: printSize,
        show_logo: showLogo,
        show_qr_code: showQRCode,
        show_bank_details: showBankDetails,
      };

      await companyAPI.update(user.company_id, {
        compliance: {
          ...compliance,
          invoice_template: templateConfig,
        },
      });

      toast.success('Invoice template settings updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating invoice template settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update invoice template settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Template Settings" size="xl">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Invoice Template
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedTemplate(template.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTemplate(template.id);
                  }
                }}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-20 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                      {template.previewImage ? (
                        <Image
                          src={template.previewImage}
                          alt={template.name}
                          width={64}
                          height={80}
                          className="object-cover"
                        />
                      ) : (
                        <FiFile className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Print Size
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(PRINT_SIZES).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPrintSize(size)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  printSize === size
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {size === 'A4' ? 'A4 (Standard)' :
                 size === 'A5' ? 'A5 (Compact)' :
                 size === 'thermal_2inch' ? 'Thermal 2"' :
                 'Thermal 3"'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Display Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show Company Logo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showQRCode}
                onChange={(e) => setShowQRCode(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show UPI QR Code</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showBankDetails}
                onChange={(e) => setShowBankDetails(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show Bank Details</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <FiSave className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Logo Upload Modal
function LogoUploadModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (company?.logo_url) {
      setPreview(company.logo_url);
    } else {
      setPreview(null);
    }
    setSelectedFile(null);
  }, [company, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a logo file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      await companyAPI.uploadLogo(user.company_id, formData);
      toast.success('Logo uploaded successfully');
      onSuccess();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Company Logo" size="md">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Logo Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Logo preview"
                    className="mx-auto h-32 w-auto object-contain"
                  />
                  <div className="text-sm text-gray-600">
                    {selectedFile?.name || 'Current logo'}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                </div>
              )}
            </div>
          </div>
          {preview && (
            <div className="mt-3">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 text-sm">
                <span>Change logo</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedFile}>
            <FiSave className="h-4 w-4 mr-2" />
            {loading ? 'Uploading...' : 'Upload Logo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Signature Upload Modal
function SignatureUploadModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (company?.compliance?.signature_url) {
      setPreview(company.compliance.signature_url);
    } else {
      setPreview(null);
    }
    setSelectedFile(null);
  }, [company, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select an image (JPG, PNG, GIF, WEBP) or PDF file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a signature file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('signature', selectedFile);

      await companyAPI.uploadSignature(user.company_id, formData);
      toast.success('Signature uploaded successfully');
      onSuccess();
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast.error(error.response?.data?.message || 'Failed to upload signature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Digital Signature" size="md">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Signature File (Image or PDF)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Signature preview"
                    className="mx-auto h-32 w-auto object-contain"
                  />
                  <div className="text-sm text-gray-600">
                    {selectedFile?.name || 'Current signature'}
                  </div>
                </div>
              ) : selectedFile && selectedFile.type === 'application/pdf' ? (
                <div className="space-y-3">
                  <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600">{selectedFile.name}</div>
                </div>
              ) : (
                <div className="text-center">
                  <FiPenTool className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF, WEBP, PDF up to 2MB</p>
                </div>
              )}
            </div>
          </div>
          {(preview || selectedFile) && (
            <div className="mt-3">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 text-sm">
                <span>Change signature</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Upload a clear image or PDF of your digital signature or DSC. This will be used on invoices and documents.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedFile}>
            <FiSave className="h-4 w-4 mr-2" />
            {loading ? 'Uploading...' : 'Upload Signature'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// DSC Configuration Modal
function DSCConfigModal({ isOpen, onClose, company, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [certificateType, setCertificateType] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [usbTokenProvider, setUsbTokenProvider] = useState('');
  const [cloudProvider, setCloudProvider] = useState('');
  const [cloudApiKey, setCloudApiKey] = useState('');
  const [useForEInvoice, setUseForEInvoice] = useState(true);
  const [useForEWayBill, setUseForEWayBill] = useState(true);

  const dscConfig = company?.compliance?.dsc || {};

  useEffect(() => {
    if (company && isOpen) {
      setCertificateType(dscConfig.certificate_type || 'file');
      setUsbTokenProvider(dscConfig.usb_token_provider || '');
      setCloudProvider(dscConfig.cloud_provider || '');
      setCloudApiKey(dscConfig.cloud_api_key || '');
      setUseForEInvoice(dscConfig.use_for_einvoice !== false);
      setUseForEWayBill(dscConfig.use_for_ewaybill !== false);
      setSelectedFile(null);
      setCertificatePassword('');
    }
  }, [company, isOpen, dscConfig]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['.pfx', '.p12', '.cer', '.pem', '.crt'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validTypes.includes(ext)) {
        toast.error('Please select a certificate file (.pfx, .p12, .cer, .pem, .crt)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // If certificate file is selected, upload it first
      if (certificateType === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('certificate', selectedFile);
        formData.append('certificate_type', 'file');
        if (certificatePassword) {
          formData.append('certificate_password', certificatePassword);
        }

        await companyAPI.uploadDSCCertificate(user.company_id, formData);
      }

      // Update DSC configuration
      const configData = {
        certificate_type: certificateType,
        use_for_einvoice: useForEInvoice,
        use_for_ewaybill: useForEWayBill,
      };

      if (certificateType === 'file' && certificatePassword) {
        configData.certificate_password = certificatePassword;
      }
      if (certificateType === 'usb_token') {
        configData.usb_token_provider = usbTokenProvider;
      }
      if (certificateType === 'cloud') {
        configData.cloud_provider = cloudProvider;
        configData.cloud_api_key = cloudApiKey;
      }

      await companyAPI.updateDSCConfig(user.company_id, configData);
      toast.success('DSC configuration updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating DSC configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to update DSC configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DSC Certificate Configuration" size="xl">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Certificate Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setCertificateType('file')}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                certificateType === 'file'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold mb-1">Certificate File</div>
              <div className="text-xs">Upload .pfx, .p12, .cer file</div>
            </button>
            <button
              type="button"
              onClick={() => setCertificateType('usb_token')}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                certificateType === 'usb_token'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold mb-1">USB Token</div>
              <div className="text-xs">Use DSC from USB pendrive</div>
            </button>
            <button
              type="button"
              onClick={() => setCertificateType('cloud')}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                certificateType === 'cloud'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold mb-1">Cloud Service</div>
              <div className="text-xs">Third-party DSC service</div>
            </button>
          </div>
        </div>

        {certificateType === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Certificate File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {selectedFile ? (
                  <div className="space-y-3">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="text-sm text-gray-600">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                ) : dscConfig.certificate_filename ? (
                  <div className="space-y-3">
                    <FiFileText className="mx-auto h-12 w-12 text-green-400" />
                    <div className="text-sm text-gray-600">{dscConfig.certificate_filename}</div>
                    <div className="text-xs text-green-600">Certificate already uploaded</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <span>Upload certificate</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pfx,.p12,.cer,.pem,.crt"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">.pfx, .p12, .cer, .pem, .crt up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
            {selectedFile && (
              <div className="mt-3">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 text-sm">
                  <span>Change certificate</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pfx,.p12,.cer,.pem,.crt"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
            <div className="mt-4">
              <FormInput
                name="certificate_password"
                label="Certificate Password (if required)"
                type="password"
                value={certificatePassword}
                onChange={(name, value) => setCertificatePassword(value)}
                placeholder="Enter certificate password"
                helperText="Password for .pfx or .p12 certificate files"
              />
            </div>
          </div>
        )}

        {certificateType === 'usb_token' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>USB Token Instructions:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Insert your DSC USB token/pendrive into your computer</li>
                  <li>Install the DSC provider&apos;s software (eMudhra, eSign, etc.)</li>
                  <li>Install the browser plugin for your DSC provider</li>
                  <li>When signing documents, the system will prompt you to select the certificate from the USB token</li>
                  <li>Enter your DSC PIN when prompted</li>
                </ol>
              </div>
            </div>
            <FormInput
              name="usb_token_provider"
              label="DSC Provider (Optional)"
              value={usbTokenProvider}
              onChange={(name, value) => setUsbTokenProvider(value)}
              placeholder="e.g., eMudhra, eSign, Capricorn, SafeNet"
              helperText="Name of your DSC provider for reference"
            />
          </div>
        )}

        {certificateType === 'cloud' && (
          <div className="space-y-4">
            <FormSelect
              name="cloud_provider"
              label="Cloud DSC Provider"
              value={cloudProvider}
              onChange={(name, value) => setCloudProvider(value)}
              options={[
                { value: 'esign', label: 'eSign (eMudhra)' },
                { value: 'signdesk', label: 'SignDesk' },
                { value: 'digio', label: 'Digio' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="Select provider"
            />
            <FormInput
              name="cloud_api_key"
              label="API Key / Access Token"
              type="password"
              value={cloudApiKey}
              onChange={(name, value) => setCloudApiKey(value)}
              placeholder="Enter API key from your DSC provider"
              helperText="Get this from your cloud DSC service provider"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Use DSC For
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useForEInvoice}
                onChange={(e) => setUseForEInvoice(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">E-Invoice Signing</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useForEWayBill}
                onChange={(e) => setUseForEWayBill(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">E-Way Bill Signing</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <FiSave className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
