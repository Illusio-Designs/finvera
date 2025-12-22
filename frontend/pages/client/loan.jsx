import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { finboxAPI, companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiDollarSign, FiTrendingUp, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiCreditCard, FiFileText, FiShield, FiArrowRight
} from 'react-icons/fi';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function LoanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [checkingCreditScore, setCheckingCreditScore] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyData, setCompanyData] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    pan: '',
    loan_amount: '',
    loan_type: 'business_loan',
    tenure: 12,
  });

  // Results state
  const [creditScore, setCreditScore] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [bankStatementStatus, setBankStatementStatus] = useState(null);

  useEffect(() => {
    fetchCompanyData();
    // Generate customer ID from user ID or company ID
    if (user?.id || user?.company_id) {
      setFormData(prev => ({
        ...prev,
        customer_id: user?.id || user?.company_id || '',
      }));
    }

    // Check for existing consent
    const existingConsent = localStorage.getItem('finbox_consent');
    if (!existingConsent) {
      // If no consent found, redirect back to dashboard to get consent
      toast.error('Please provide consent first');
      router.push('/client/dashboard');
    }
  }, [user, router]);

  const fetchCompanyData = async () => {
    try {
      if (!user?.company_id) return;
      
      const response = await companyAPI.list();
      const companies = response.data?.data || response.data || [];
      const currentCompany = companies.find(c => c.id === user.company_id);
      
      if (currentCompany) {
        setCompanyData(currentCompany);
        setCompanyName(currentCompany.company_name || '');
        setFormData(prev => ({
          ...prev,
          pan: currentCompany.pan || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckCreditScore = async () => {
    if (!formData.customer_id || !formData.pan) {
      toast.error('Customer ID and PAN are required');
      return;
    }

    try {
      setCheckingCreditScore(true);
      const response = await finboxAPI.getCreditScore({
        customer_id: formData.customer_id,
        pan: formData.pan,
      });

      const data = response.data?.data || response.data;
      setCreditScore(data);
      toast.success('Credit score fetched successfully');
    } catch (error) {
      console.error('Credit score error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch credit score');
    } finally {
      setCheckingCreditScore(false);
    }
  };

  const handleCheckEligibility = async () => {
    if (!formData.customer_id) {
      toast.error('Customer ID is required');
      return;
    }

    try {
      setCheckingEligibility(true);
      const response = await finboxAPI.checkEligibility({
        customer_id: formData.customer_id,
        loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : undefined,
        loan_type: formData.loan_type,
        tenure: formData.tenure ? parseInt(formData.tenure) : undefined,
      });

      const data = response.data?.data || response.data;
      setEligibility(data);
      toast.success('Eligibility checked successfully');
    } catch (error) {
      console.error('Eligibility error:', error);
      toast.error(error.response?.data?.message || 'Failed to check eligibility');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleInitiateBankStatement = async () => {
    if (!formData.customer_id) {
      toast.error('Customer ID is required');
      return;
    }

    try {
      setLoading(true);
      const response = await finboxAPI.initiateBankStatement({
        customer_id: formData.customer_id,
        method: 'aa', // Account Aggregator
      });

      const data = response.data?.data || response.data;
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
        toast.success('Bank statement collection initiated');
      } else {
        toast.success('Bank statement collection initiated');
      }
      setBankStatementStatus(data);
    } catch (error) {
      console.error('Bank statement error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate bank statement collection');
    } finally {
      setLoading(false);
    }
  };

  const handleGetBankStatementStatus = async () => {
    if (!formData.customer_id) {
      toast.error('Customer ID is required');
      return;
    }

    try {
      setLoading(true);
      const response = await finboxAPI.getBankStatementStatus(formData.customer_id);
      const data = response.data?.data || response.data;
      setBankStatementStatus(data);
    } catch (error) {
      console.error('Bank statement status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get bank statement status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Business Loan">
        <Toaster />
        <PageLayout
          title="Business Loan"
          breadcrumbs={[
            { label: companyName || 'Client', href: '/client/dashboard' },
            { label: 'Loan', href: '/client/loan' },
          ]}
        >
          <div className="space-y-6">
            {/* Hero Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Get Business Loan</h2>
                  <p className="text-blue-100">
                    Quick and hassle-free business loans up to ₹15 Crore
                  </p>
                </div>
                <div className="hidden md:block">
                  <FiDollarSign className="h-24 w-24 text-blue-200 opacity-50" />
                </div>
              </div>
            </Card>

            {/* Loan Application Form */}
            <Card title="Loan Application">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer ID *
                    </label>
                    <Input
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      placeholder="Enter customer ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number *
                    </label>
                    <Input
                      name="pan"
                      value={formData.pan}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Amount (₹)
                    </label>
                    <Input
                      name="loan_amount"
                      type="number"
                      value={formData.loan_amount}
                      onChange={handleInputChange}
                      placeholder="Enter loan amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Type
                    </label>
                    <select
                      name="loan_type"
                      value={formData.loan_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="business_loan">Business Loan</option>
                      <option value="term_loan">Term Loan</option>
                      <option value="lap">Loan Against Property</option>
                      <option value="cgtsme">CGTSME Loan</option>
                      <option value="professional_loan">Professional Loan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tenure (Months)
                    </label>
                    <Input
                      name="tenure"
                      type="number"
                      value={formData.tenure}
                      onChange={handleInputChange}
                      placeholder="12-84 months"
                      min={12}
                      max={84}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCheckCreditScore}
                    disabled={checkingCreditScore}
                    variant="outline"
                  >
                    {checkingCreditScore ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <FiFileText className="h-4 w-4 mr-2" />
                        Check Credit Score
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCheckEligibility}
                    disabled={checkingEligibility}
                    variant="primary"
                  >
                    {checkingEligibility ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <FiTrendingUp className="h-4 w-4 mr-2" />
                        Check Eligibility
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Credit Score Result */}
            {creditScore && (
              <Card title="Credit Score">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-lg ${
                    (creditScore.creditScore || 0) >= 750 ? 'bg-green-100' :
                    (creditScore.creditScore || 0) >= 650 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <div className="text-3xl font-bold">
                      {creditScore.creditScore || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Bureau: {creditScore.bureau || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Report Date: {creditScore.reportDate ? new Date(creditScore.reportDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Eligibility Result */}
            {eligibility && (
              <Card title="Loan Eligibility">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {eligibility.eligible ? (
                      <>
                        <FiCheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-lg font-semibold text-green-700">You are eligible for a loan!</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(eligibility.eligibleAmount || 0)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FiXCircle className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="text-lg font-semibold text-red-700">Not eligible at this time</p>
                        </div>
                      </>
                    )}
                  </div>
                  {eligibility.eligible && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Interest Rate</p>
                        <p className="text-lg font-semibold">
                          {eligibility.interestRate ? `${eligibility.interestRate}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tenure</p>
                        <p className="text-lg font-semibold">
                          {eligibility.tenure ? `${eligibility.tenure} months` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Eligible Amount</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(eligibility.eligibleAmount || 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Bank Statement Section */}
            <Card title="Bank Statement Analysis">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your bank account to get better loan offers and faster approval.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleInitiateBankStatement}
                    disabled={loading}
                    variant="primary"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCreditCard className="h-4 w-4 mr-2" />
                        Connect Bank Account
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGetBankStatementStatus}
                    disabled={loading}
                    variant="outline"
                  >
                    Check Status
                  </Button>
                </div>
                {bankStatementStatus && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Status: {bankStatementStatus.status || 'Unknown'}</p>
                    {bankStatementStatus.completed && (
                      <p className="text-sm text-green-600 mt-2">✓ Bank statement analysis completed</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <FiShield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Secure & Safe</h3>
                <p className="text-sm text-gray-600">100% secure and encrypted</p>
              </Card>
              <Card className="text-center">
                <FiTrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Quick Approval</h3>
                <p className="text-sm text-gray-600">Fast processing and approval</p>
              </Card>
              <Card className="text-center">
                <FiDollarSign className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Best Rates</h3>
                <p className="text-sm text-gray-600">Competitive interest rates</p>
              </Card>
            </div>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
