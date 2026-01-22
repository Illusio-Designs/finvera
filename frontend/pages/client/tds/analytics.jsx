import { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';
import { tdsAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiRefreshCw, FiAlertTriangle, FiDollarSign, FiShield, FiFileText } from 'react-icons/fi';

export default function TDSAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('potential-notices'); // potential-notices, calculator, compliance, reports

  // Potential Notices State
  const [potentialNoticesForm, setPotentialNoticesForm] = useState({
    quarter: 'Q1',
    tan: '',
    form: '24Q',
    financial_year: '2023-24'
  });
  const [potentialNoticesJob, setPotentialNoticesJob] = useState(null);
  const [noticesJobStatus, setNoticesJobStatus] = useState(null);

  // TDS Calculator State
  const [calculatorForm, setCalculatorForm] = useState({
    payment_amount: 0,
    section: '194C',
    deductee_pan: '',
    payment_date: new Date().toISOString().split('T')[0],
    nature_of_payment: 'Contract Payment'
  });
  const [calculatorResult, setCalculatorResult] = useState(null);

  // 206AB Compliance State
  const [complianceForm, setComplianceForm] = useState({
    pan: '',
    consent: true,
    reason: 'TDS rate verification'
  });
  const [complianceResult, setComplianceResult] = useState(null);

  // CSI Download State
  const [csiForm, setCsiForm] = useState({
    tan: '',
    mobile: '',
    email: '',
    otp: '',
    quarter: 'Q1',
    financial_year: '2023-24'
  });
  const [csiOtpSent, setCsiOtpSent] = useState(false);

  // TCS Reports State
  const [tcsReportForm, setTcsReportForm] = useState({
    tan: '',
    quarter: 'Q1',
    financial_year: '2023-24',
    report_type: 'TCSRS'
  });
  const [tcsReportJob, setTcsReportJob] = useState(null);
  const [tcsJobStatus, setTcsJobStatus] = useState(null);

  const handleCreatePotentialNoticesJob = async () => {
    try {
      setLoading(true);
      const response = await tdsAPI.analytics.createPotentialNoticeJob(potentialNoticesForm);
      const data = response.data?.data || response.data;
      setPotentialNoticesJob(data);
      toast.success('TDS potential notice job created successfully');
    } catch (error) {
      console.error('Potential notices job error:', error);
      toast.error(error.response?.data?.message || 'Failed to create potential notices job');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNoticesJobStatus = async () => {
    if (!potentialNoticesJob?.jobId) {
      toast.error('No job ID available');
      return;
    }
    try {
      setLoading(true);
      const response = await tdsAPI.analytics.getJobStatus(potentialNoticesJob.jobId);
      const data = response.data?.data || response.data;
      setNoticesJobStatus(data);
      toast.success('Job status updated');
    } catch (error) {
      console.error('Job status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get job status');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateNonSalaryTDS = async () => {
    try {
      setLoading(true);
      const response = await tdsAPI.calculator.calculateNonSalary(calculatorForm);
      const data = response.data?.data || response.data;
      setCalculatorResult(data);
      toast.success('TDS calculated successfully');
    } catch (error) {
      console.error('TDS calculation error:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate TDS');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck206ABCompliance = async () => {
    try {
      setLoading(true);
      const response = await tdsAPI.compliance.check206AB(complianceForm);
      const data = response.data?.data || response.data;
      setComplianceResult(data);
      toast.success('206AB compliance check completed');
    } catch (error) {
      console.error('206AB compliance error:', error);
      toast.error(error.response?.data?.message || 'Failed to check 206AB compliance');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCSIOTP = async () => {
    try {
      setLoading(true);
      const response = await tdsAPI.compliance.generateCSIOTP({
        tan: csiForm.tan,
        mobile: csiForm.mobile,
        email: csiForm.email
      });
      setCsiOtpSent(true);
      toast.success('OTP sent successfully');
    } catch (error) {
      console.error('CSI OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSI = async () => {
    try {
      setLoading(true);
      const response = await tdsAPI.compliance.downloadCSI(csiForm);
      toast.success('CSI download initiated');
    } catch (error) {
      console.error('CSI download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download CSI');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTCSReport = async () => {
    try {
      setLoading(true);
      const response = await tdsAPI.reports.submitTCSJob(tcsReportForm);
      const data = response.data?.data || response.data;
      setTcsReportJob(data);
      toast.success('TCS report job submitted successfully');
    } catch (error) {
      console.error('TCS report error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit TCS report job');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckTCSJobStatus = async () => {
    if (!tcsReportJob?.jobId) {
      toast.error('No job ID available');
      return;
    }
    try {
      setLoading(true);
      const response = await tdsAPI.reports.getTCSJobStatus(tcsReportJob.jobId);
      const data = response.data?.data || response.data;
      setTcsJobStatus(data);
      toast.success('TCS job status updated');
    } catch (error) {
      console.error('TCS job status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get TCS job status');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'potential-notices', label: 'Potential Notices', icon: FiAlertTriangle },
    { id: 'calculator', label: 'TDS Calculator', icon: FiDollarSign },
    { id: 'compliance', label: 'Compliance Check', icon: FiShield },
    { id: 'reports', label: 'TCS Reports', icon: FiFileText },
  ];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="TDS Analytics">
        <Toaster />
        <PageLayout
          title="TDS Analytics & Compliance"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'TDS', href: '/client/tds' },
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

            {/* Potential Notices Tab */}
            {activeTab === 'potential-notices' && (
              <div className="space-y-6">
                <Card title="TDS Potential Notice Analysis">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TAN
                        </label>
                        <Input
                          value={potentialNoticesForm.tan}
                          onChange={(e) => setPotentialNoticesForm(prev => ({ ...prev, tan: e.target.value }))}
                          placeholder="ABCD12345E"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quarter
                        </label>
                        <select
                          value={potentialNoticesForm.quarter}
                          onChange={(e) => setPotentialNoticesForm(prev => ({ ...prev, quarter: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Q1">Q1 (Apr-Jun)</option>
                          <option value="Q2">Q2 (Jul-Sep)</option>
                          <option value="Q3">Q3 (Oct-Dec)</option>
                          <option value="Q4">Q4 (Jan-Mar)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Form Type
                        </label>
                        <select
                          value={potentialNoticesForm.form}
                          onChange={(e) => setPotentialNoticesForm(prev => ({ ...prev, form: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="24Q">24Q (Salary)</option>
                          <option value="26Q">26Q (Non-Salary)</option>
                          <option value="27Q">27Q (NR)</option>
                          <option value="27EQ">27EQ (TDS on Interest)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Financial Year
                        </label>
                        <Input
                          value={potentialNoticesForm.financial_year}
                          onChange={(e) => setPotentialNoticesForm(prev => ({ ...prev, financial_year: e.target.value }))}
                          placeholder="2023-24"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleCreatePotentialNoticesJob}
                        disabled={loading || !potentialNoticesForm.tan}
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating Job...
                          </>
                        ) : (
                          <>
                            <FiAlertTriangle className="h-4 w-4 mr-2" />
                            Analyze Potential Notices
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {potentialNoticesJob && (
                  <Card title="Analysis Job Status">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Job ID</p>
                        <p className="font-mono text-sm">{potentialNoticesJob.jobId}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCheckNoticesJobStatus}
                          disabled={loading}
                          variant="outline"
                        >
                          <FiRefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </Button>
                      </div>
                      {noticesJobStatus && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={noticesJobStatus.status === 'completed' ? 'success' : 'warning'}>
                              {noticesJobStatus.status}
                            </Badge>
                          </div>
                          {noticesJobStatus.result && (
                            <div className="text-sm">
                              <p>Potential Notices Found: {noticesJobStatus.result.potential_notices_count || 0}</p>
                              <p>Risk Level: {noticesJobStatus.result.risk_level || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* TDS Calculator Tab */}
            {activeTab === 'calculator' && (
              <Card title="Non-Salary TDS Calculator">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount (₹)
                      </label>
                      <Input
                        type="number"
                        value={calculatorForm.payment_amount}
                        onChange={(e) => setCalculatorForm(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="100000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TDS Section
                      </label>
                      <select
                        value={calculatorForm.section}
                        onChange={(e) => setCalculatorForm(prev => ({ ...prev, section: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="194C">194C - Contract Payment</option>
                        <option value="194J">194J - Professional Fees</option>
                        <option value="194I">194I - Rent</option>
                        <option value="194H">194H - Commission</option>
                        <option value="194A">194A - Interest</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deductee PAN
                      </label>
                      <Input
                        value={calculatorForm.deductee_pan}
                        onChange={(e) => setCalculatorForm(prev => ({ ...prev, deductee_pan: e.target.value }))}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date
                      </label>
                      <Input
                        type="date"
                        value={calculatorForm.payment_date}
                        onChange={(e) => setCalculatorForm(prev => ({ ...prev, payment_date: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nature of Payment
                      </label>
                      <Input
                        value={calculatorForm.nature_of_payment}
                        onChange={(e) => setCalculatorForm(prev => ({ ...prev, nature_of_payment: e.target.value }))}
                        placeholder="Contract Payment"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleCalculateNonSalaryTDS}
                      disabled={loading || !calculatorForm.payment_amount}
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
                          Calculate TDS
                        </>
                      )}
                    </Button>
                  </div>
                  {calculatorResult && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold mb-2">TDS Calculation Result</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">TDS Amount</p>
                          <p className="font-semibold">₹{calculatorResult.tdsAmount || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Net Amount</p>
                          <p className="font-semibold">₹{calculatorResult.netAmount || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Effective Rate</p>
                          <p className="font-semibold">{calculatorResult.effectiveRate || 0}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Compliance Check Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <Card title="Section 206AB & 206CCA Compliance Check">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN
                        </label>
                        <Input
                          value={complianceForm.pan}
                          onChange={(e) => setComplianceForm(prev => ({ ...prev, pan: e.target.value }))}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Check
                        </label>
                        <Input
                          value={complianceForm.reason}
                          onChange={(e) => setComplianceForm(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="TDS rate verification"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={complianceForm.consent}
                            onChange={(e) => setComplianceForm(prev => ({ ...prev, consent: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">I consent to the compliance check</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleCheck206ABCompliance}
                        disabled={loading || !complianceForm.pan || !complianceForm.consent}
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <FiShield className="h-4 w-4 mr-2" />
                            Check Compliance
                          </>
                        )}
                      </Button>
                    </div>
                    {complianceResult && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-semibold mb-2">Compliance Check Result</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Compliant:</span>
                            <Badge variant={complianceResult.isCompliant ? 'success' : 'danger'}>
                              {complianceResult.isCompliant ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          {complianceResult.higherRate && (
                            <div>
                              <span className="text-gray-600">Higher Rate Applicable:</span>
                              <span className="ml-2 font-semibold">{complianceResult.higherRate}%</span>
                            </div>
                          )}
                          {complianceResult.reason && (
                            <div>
                              <span className="text-gray-600">Reason:</span>
                              <span className="ml-2">{complianceResult.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="CSI Download">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TAN
                        </label>
                        <Input
                          value={csiForm.tan}
                          onChange={(e) => setCsiForm(prev => ({ ...prev, tan: e.target.value }))}
                          placeholder="ABCD12345E"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Number
                        </label>
                        <Input
                          value={csiForm.mobile}
                          onChange={(e) => setCsiForm(prev => ({ ...prev, mobile: e.target.value }))}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={csiForm.email}
                          onChange={(e) => setCsiForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="user@example.com"
                        />
                      </div>
                      {csiOtpSent && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            OTP
                          </label>
                          <Input
                            value={csiForm.otp}
                            onChange={(e) => setCsiForm(prev => ({ ...prev, otp: e.target.value }))}
                            placeholder="123456"
                            maxLength={6}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      {!csiOtpSent ? (
                        <Button
                          onClick={handleGenerateCSIOTP}
                          disabled={loading || !csiForm.tan || !csiForm.mobile}
                          variant="primary"
                        >
                          {loading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Sending OTP...
                            </>
                          ) : (
                            'Generate OTP'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleDownloadCSI}
                          disabled={loading || !csiForm.otp}
                          variant="primary"
                        >
                          {loading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Downloading...
                            </>
                          ) : (
                            'Download CSI'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TCS Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <Card title="Submit TCS Report Job">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TAN
                        </label>
                        <Input
                          value={tcsReportForm.tan}
                          onChange={(e) => setTcsReportForm(prev => ({ ...prev, tan: e.target.value }))}
                          placeholder="ABCD12345E"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quarter
                        </label>
                        <select
                          value={tcsReportForm.quarter}
                          onChange={(e) => setTcsReportForm(prev => ({ ...prev, quarter: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Q1">Q1 (Apr-Jun)</option>
                          <option value="Q2">Q2 (Jul-Sep)</option>
                          <option value="Q3">Q3 (Oct-Dec)</option>
                          <option value="Q4">Q4 (Jan-Mar)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Financial Year
                        </label>
                        <Input
                          value={tcsReportForm.financial_year}
                          onChange={(e) => setTcsReportForm(prev => ({ ...prev, financial_year: e.target.value }))}
                          placeholder="2023-24"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Report Type
                        </label>
                        <select
                          value={tcsReportForm.report_type}
                          onChange={(e) => setTcsReportForm(prev => ({ ...prev, report_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="TCSRS">TCSRS</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSubmitTCSReport}
                        disabled={loading || !tcsReportForm.tan}
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FiFileText className="h-4 w-4 mr-2" />
                            Submit TCS Report
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {tcsReportJob && (
                  <Card title="TCS Report Job Status">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Job ID</p>
                        <p className="font-mono text-sm">{tcsReportJob.jobId}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCheckTCSJobStatus}
                          disabled={loading}
                          variant="outline"
                        >
                          <FiRefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </Button>
                      </div>
                      {tcsJobStatus && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={tcsJobStatus.status === 'completed' ? 'success' : 'warning'}>
                              {tcsJobStatus.status}
                            </Badge>
                          </div>
                          {tcsJobStatus.result && (
                            <div className="text-sm">
                              <p>Report Generated: {tcsJobStatus.result.report_generated ? 'Yes' : 'No'}</p>
                              {tcsJobStatus.result.download_url && (
                                <p>
                                  <a 
                                    href={tcsJobStatus.result.download_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:underline"
                                  >
                                    Download Report
                                  </a>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}