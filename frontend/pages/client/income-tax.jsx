import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { incomeTaxAPI, companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiDollarSign, FiFileText, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiDownload, FiUpload, FiRefreshCw
} from 'react-icons/fi';
import { formatCurrency } from '../../lib/formatters';

export default function IncomeTaxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [activeTab, setActiveTab] = useState('calculate'); // calculate, itr, form26as, form16

  // Tax Calculation State
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [taxFormData, setTaxFormData] = useState({
    financialYear: new Date().getFullYear() - 1,
    assesseeType: 'Individual',
    residentialStatus: 'Resident',
    age: null,
    incomeSources: {
      salary: 0,
      house_property: 0,
      business_profession: 0,
      capital_gains: 0,
      other_sources: 0,
    },
    deductions: {
      section_80c: 0,
      section_80d: 0,
      section_24b: 0,
      other: 0,
    },
  });

  // ITR State
  const [itrFormData, setItrFormData] = useState({
    formType: 'ITR-1',
    financialYear: new Date().getFullYear() - 1,
    pan: '',
  });
  const [itrStatus, setItrStatus] = useState(null);
  const [itrReturnId, setItrReturnId] = useState('');

  // Form 26AS State
  const [form26ASData, setForm26ASData] = useState({
    pan: '',
    financialYear: new Date().getFullYear() - 1,
  });
  const [form26ASResult, setForm26ASResult] = useState(null);

  // Form 16 State
  const [form16File, setForm16File] = useState(null);
  const [form16Result, setForm16Result] = useState(null);

  const fetchCompanyData = useCallback(async () => {
    try {
      if (!user?.company_id) return;
      
      const response = await companyAPI.list();
      const companies = response.data?.data || response.data || [];
      const currentCompany = companies.find(c => c.id === user.company_id);
      
      if (currentCompany) {
        setCompanyName(currentCompany.company_name || '');
        setTaxFormData(prev => ({ ...prev }));
        setItrFormData(prev => ({ ...prev, pan: currentCompany.pan || '' }));
        setForm26ASData(prev => ({ ...prev, pan: currentCompany.pan || '' }));
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
    }
  }, [user?.company_id]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleTaxInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('incomeSources.')) {
      const key = name.split('.')[1];
      setTaxFormData(prev => ({
        ...prev,
        incomeSources: {
          ...prev.incomeSources,
          [key]: parseFloat(value) || 0,
        },
      }));
    } else if (name.startsWith('deductions.')) {
      const key = name.split('.')[1];
      setTaxFormData(prev => ({
        ...prev,
        deductions: {
          ...prev.deductions,
          [key]: parseFloat(value) || 0,
        },
      }));
    } else {
      setTaxFormData(prev => ({
        ...prev,
        [name]: name === 'age' || name === 'financialYear' ? parseInt(value) || null : value,
      }));
    }
  };

  const handleCalculateTax = async () => {
    try {
      setLoading(true);
      const response = await incomeTaxAPI.calculateTax(taxFormData);
      const data = response.data?.data || response.data;
      setTaxCalculation(data);
      toast.success('Tax calculated successfully');
    } catch (error) {
      console.error('Tax calculation error:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate tax');
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareITR = async () => {
    try {
      setLoading(true);
      const response = await incomeTaxAPI.prepareITR(itrFormData);
      const data = response.data?.data || response.data;
      setItrReturnId(data.returnId || data.return_id || '');
      toast.success('ITR prepared successfully');
    } catch (error) {
      console.error('ITR preparation error:', error);
      toast.error(error.response?.data?.message || 'Failed to prepare ITR');
    } finally {
      setLoading(false);
    }
  };

  const handleFileITR = async () => {
    try {
      setLoading(true);
      const response = await incomeTaxAPI.fileITR(itrFormData);
      const data = response.data?.data || response.data;
      setItrReturnId(data.returnId || data.return_id || '');
      toast.success('ITR filed successfully');
      if (data.acknowledgmentNumber) {
        toast.success(`Acknowledgment Number: ${data.acknowledgmentNumber}`);
      }
    } catch (error) {
      console.error('ITR filing error:', error);
      toast.error(error.response?.data?.message || 'Failed to file ITR');
    } finally {
      setLoading(false);
    }
  };

  const handleGetITRStatus = async () => {
    if (!itrReturnId) {
      toast.error('Please enter Return ID');
      return;
    }
    try {
      setLoading(true);
      const response = await incomeTaxAPI.getITRStatus(itrReturnId);
      const data = response.data?.data || response.data;
      setItrStatus(data);
      toast.success('ITR status fetched successfully');
    } catch (error) {
      console.error('ITR status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get ITR status');
    } finally {
      setLoading(false);
    }
  };

  const handleGetForm26AS = async () => {
    if (!form26ASData.pan) {
      toast.error('PAN is required');
      return;
    }
    try {
      setLoading(true);
      const response = await incomeTaxAPI.getForm26AS(form26ASData.pan);
      const data = response.data?.data || response.data;
      setForm26ASResult(data);
      toast.success('Form 26AS fetched successfully');
    } catch (error) {
      console.error('Form 26AS error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch Form 26AS');
    } finally {
      setLoading(false);
    }
  };

  const handleParseForm16 = async () => {
    if (!form16File) {
      toast.error('Please upload Form 16 file');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', form16File);
      formData.append('financialYear', taxFormData.financialYear);
      
      const response = await incomeTaxAPI.parseForm16(formData);
      const data = response.data?.data || response.data;
      setForm16Result(data);
      toast.success('Form 16 parsed successfully');
    } catch (error) {
      console.error('Form 16 parsing error:', error);
      toast.error(error.response?.data?.message || 'Failed to parse Form 16');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'calculate', label: 'Calculate Tax', icon: FiDollarSign },
    { id: 'itr', label: 'ITR Filing', icon: FiFileText },
    { id: 'form26as', label: 'Form 26AS', icon: FiDownload },
    { id: 'form16', label: 'Form 16', icon: FiUpload },
  ];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Income Tax">
        <Toaster />
        <PageLayout
          title="Income Tax"
          breadcrumbs={[
            { label: companyName || 'Client', href: '/client/dashboard' },
            { label: 'Income Tax', href: '/client/income-tax' },
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

            {/* Tax Calculation Tab */}
            {activeTab === 'calculate' && (
              <Card title="Calculate Income Tax">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Financial Year
                      </label>
                      <Input
                        type="number"
                        value={taxFormData.financialYear}
                        onChange={(e) => handleTaxInputChange({ target: { name: 'financialYear', value: e.target.value } })}
                        placeholder="e.g. 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assessee Type
                      </label>
                      <select
                        name="assesseeType"
                        value={taxFormData.assesseeType}
                        onChange={handleTaxInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Individual">Individual</option>
                        <option value="HUF">HUF</option>
                        <option value="Company">Company</option>
                        <option value="Firm">Firm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Residential Status
                      </label>
                      <select
                        name="residentialStatus"
                        value={taxFormData.residentialStatus}
                        onChange={handleTaxInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Resident">Resident</option>
                        <option value="Non-Resident">Non-Resident</option>
                        <option value="Resident but Not Ordinarily Resident">RNOR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age (if Senior Citizen)
                      </label>
                      <Input
                        type="number"
                        name="age"
                        value={taxFormData.age || ''}
                        onChange={handleTaxInputChange}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Income Sources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(taxFormData.incomeSources).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (₹)
                          </label>
                          <Input
                            type="number"
                            name={`incomeSources.${key}`}
                            value={value}
                            onChange={handleTaxInputChange}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(taxFormData.deductions).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {key === 'section_80c' ? 'Section 80C' :
                             key === 'section_80d' ? 'Section 80D' :
                             key === 'section_24b' ? 'Section 24(b)' :
                             'Other Deductions'} (₹)
                          </label>
                          <Input
                            type="number"
                            name={`deductions.${key}`}
                            value={value}
                            onChange={handleTaxInputChange}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleCalculateTax}
                      disabled={loading}
                      variant="primary"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <FiDollarSign className="h-4 w-4 mr-2" />
                          Calculate Tax
                        </>
                      )}
                    </Button>
                  </div>

                  {taxCalculation && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <h3 className="font-semibold mb-4">Tax Calculation Result</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Income</p>
                          <p className="text-lg font-semibold">{formatCurrency(taxCalculation.totalIncome || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Deductions</p>
                          <p className="text-lg font-semibold">{formatCurrency(taxCalculation.totalDeductions || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Taxable Income</p>
                          <p className="text-lg font-semibold">{formatCurrency(taxCalculation.taxableIncome || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Tax</p>
                          <p className="text-lg font-semibold text-red-600">{formatCurrency(taxCalculation.totalTax || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ITR Filing Tab */}
            {activeTab === 'itr' && (
              <div className="space-y-6">
                <Card title="Prepare ITR">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Form Type
                        </label>
                        <select
                          name="formType"
                          value={itrFormData.formType}
                          onChange={(e) => setItrFormData(prev => ({ ...prev, formType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="ITR-1">ITR-1 (Sahaj)</option>
                          <option value="ITR-2">ITR-2</option>
                          <option value="ITR-3">ITR-3</option>
                          <option value="ITR-4">ITR-4 (Sugam)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Financial Year
                        </label>
                        <Input
                          type="number"
                          value={itrFormData.financialYear}
                          onChange={(e) => setItrFormData(prev => ({ ...prev, financialYear: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN
                        </label>
                        <Input
                          value={itrFormData.pan}
                          onChange={(e) => setItrFormData(prev => ({ ...prev, pan: e.target.value }))}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handlePrepareITR}
                        disabled={loading}
                        variant="primary"
                      >
                        {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <FiFileText className="h-4 w-4 mr-2" />}
                        Prepare ITR
                      </Button>
                      <Button
                        onClick={handleFileITR}
                        disabled={loading || !itrReturnId}
                        variant="primary"
                      >
                        {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <FiCheckCircle className="h-4 w-4 mr-2" />}
                        File ITR
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card title="Check ITR Status">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Return ID
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={itrReturnId}
                          onChange={(e) => setItrReturnId(e.target.value)}
                          placeholder="Enter Return ID"
                          className="flex-1"
                        />
                        <Button
                          onClick={handleGetITRStatus}
                          disabled={loading || !itrReturnId}
                        >
                          <FiRefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </Button>
                      </div>
                    </div>
                    {itrStatus && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">Status: {itrStatus.status || 'N/A'}</p>
                        {itrStatus.acknowledgmentNumber && (
                          <p className="text-sm text-gray-600 mt-2">
                            Acknowledgment: {itrStatus.acknowledgmentNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Form 26AS Tab */}
            {activeTab === 'form26as' && (
              <Card title="Form 26AS (Tax Credit Statement)">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PAN
                      </label>
                      <Input
                        value={form26ASData.pan}
                        onChange={(e) => setForm26ASData(prev => ({ ...prev, pan: e.target.value }))}
                        maxLength={10}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Financial Year
                      </label>
                      <Input
                        type="number"
                        value={form26ASData.financialYear}
                        onChange={(e) => setForm26ASData(prev => ({ ...prev, financialYear: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleGetForm26AS}
                      disabled={loading || !form26ASData.pan}
                      variant="primary"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <FiDownload className="h-4 w-4 mr-2" />
                          Fetch Form 26AS
                        </>
                      )}
                    </Button>
                  </div>
                  {form26ASResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold mb-2">Form 26AS Data Retrieved</p>
                      <pre className="text-xs overflow-auto">{JSON.stringify(form26ASResult, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Form 16 Tab */}
            {activeTab === 'form16' && (
              <Card title="Parse Form 16 (OCR)">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Form 16 PDF/Image
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm16File(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleParseForm16}
                      disabled={loading || !form16File}
                      variant="primary"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <FiUpload className="h-4 w-4 mr-2" />
                          Parse Form 16
                        </>
                      )}
                    </Button>
                  </div>
                  {form16Result && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold mb-2">Form 16 Parsed Successfully</p>
                      <pre className="text-xs overflow-auto">{JSON.stringify(form16Result, null, 2)}</pre>
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
