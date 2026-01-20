import { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';
import { incomeTaxAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import { FiRefreshCw, FiUpload, FiTrendingUp, FiDollarSign, FiFileText } from 'react-icons/fi';

export default function IncomeTaxCalculatorPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('securities'); // securities, capital-gains, advance-tax, form16

  // Securities Tax P&L State
  const [securitiesForm, setSecuritiesForm] = useState({
    input: 'csv',
    from: 'zerodha',
    output: 'json',
    to: 'itr'
  });
  const [securitiesJob, setSecuritiesJob] = useState(null);
  const [securitiesJobStatus, setSecuritiesJobStatus] = useState(null);

  // Trading Data Upload State
  const [tradingDataForm, setTradingDataForm] = useState({
    upload_url: '',
    trading_data: []
  });
  const [sampleTrade, setSampleTrade] = useState({
    trade_date: new Date().toISOString().split('T')[0],
    settlement_date: new Date().toISOString().split('T')[0],
    stock_symbol: '',
    isin: '',
    company_name: '',
    trade_type: 'BUY',
    quantity: 0,
    price: 0,
    brokerage: 0,
    stt: 0,
    exchange_charges: 0,
    gst: 0,
    sebi_charges: 0,
    stamp_duty: 0,
    total_charges: 0,
    net_amount: 0
  });

  // Capital Gains State
  const [capitalGainsForm, setCapitalGainsForm] = useState({
    transactions: [],
    financial_year: '2023-24'
  });
  const [sampleTransaction, setSampleTransaction] = useState({
    type: 'equity',
    purchase_date: '',
    sale_date: '',
    purchase_price: 0,
    sale_price: 0,
    quantity: 0
  });
  const [capitalGainsResult, setCapitalGainsResult] = useState(null);

  // Advance Tax State
  const [advanceTaxForm, setAdvanceTaxForm] = useState({
    estimated_income: 0,
    financial_year: '2023-24',
    previous_year_tax: 0,
    tds_amount: 0
  });
  const [advanceTaxResult, setAdvanceTaxResult] = useState(null);

  // Form 16 Generation State
  const [form16Form, setForm16Form] = useState({
    employee_details: {
      name: '',
      pan: '',
      address: ''
    },
    salary_details: {
      basic_salary: 0,
      hra: 0,
      special_allowance: 0,
      pf_contribution: 0,
      professional_tax: 0
    },
    financial_year: '2023-24'
  });
  const [form16Result, setForm16Result] = useState(null);

  const handleSubmitSecuritiesJob = async () => {
    try {
      setLoading(true);
      const response = await incomeTaxAPI.calculator.securities.submitTaxPnLJob(securitiesForm);
      const data = response.data?.data || response.data;
      setSecuritiesJob(data);
      toast.success('Tax P&L job created successfully');
    } catch (error) {
      console.error('Securities job error:', error);
      toast.error(error.response?.data?.message || 'Failed to create Tax P&L job');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSecuritiesJobStatus = async () => {
    if (!securitiesJob?.jobId) {
      toast.error('No job ID available');
      return;
    }
    try {
      setLoading(true);
      const response = await incomeTaxAPI.calculator.securities.getTaxPnLJobStatus(securitiesJob.jobId);
      const data = response.data?.data || response.data;
      setSecuritiesJobStatus(data);
      toast.success('Job status updated');
    } catch (error) {
      console.error('Job status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get job status');
    } finally {
      setLoading(false);
    }
  };

  const addSampleTrade = () => {
    if (!sampleTrade.stock_symbol || !sampleTrade.quantity || !sampleTrade.price) {
      toast.error('Please fill stock symbol, quantity, and price');
      return;
    }

    const trade = {
      ...sampleTrade,
      net_amount: sampleTrade.quantity * sampleTrade.price + sampleTrade.total_charges
    };

    setTradingDataForm(prev => ({
      ...prev,
      trading_data: [...prev.trading_data, trade]
    }));

    // Reset sample trade
    setSampleTrade({
      trade_date: new Date().toISOString().split('T')[0],
      settlement_date: new Date().toISOString().split('T')[0],
      stock_symbol: '',
      isin: '',
      company_name: '',
      trade_type: 'BUY',
      quantity: 0,
      price: 0,
      brokerage: 0,
      stt: 0,
      exchange_charges: 0,
      gst: 0,
      sebi_charges: 0,
      stamp_duty: 0,
      total_charges: 0,
      net_amount: 0
    });

    toast.success('Trade added to trading data');
  };

  const handleUploadTradingData = async () => {
    if (!tradingDataForm.upload_url || tradingDataForm.trading_data.length === 0) {
      toast.error('Please provide upload URL and at least one trade');
      return;
    }
    try {
      setLoading(true);
      const response = await incomeTaxAPI.calculator.securities.uploadTradingData(tradingDataForm);
      toast.success('Trading data uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload trading data');
    } finally {
      setLoading(false);
    }
  };

  const addSampleTransaction = () => {
    if (!sampleTransaction.purchase_date || !sampleTransaction.sale_date || !sampleTransaction.quantity) {
      toast.error('Please fill all transaction details');
      return;
    }

    setCapitalGainsForm(prev => ({
      ...prev,
      transactions: [...prev.transactions, sampleTransaction]
    }));

    setSampleTransaction({
      type: 'equity',
      purchase_date: '',
      sale_date: '',
      purchase_price: 0,
      sale_price: 0,
      quantity: 0
    });

    toast.success('Transaction added');
  };

  const handleCalculateCapitalGains = async () => {
    if (capitalGainsForm.transactions.length === 0) {
      toast.error('Please add at least one transaction');
      return;
    }
    try {
      setLoading(true);
      const response = await incomeTaxAPI.calculator.calculateCapitalGains(capitalGainsForm);
      const data = response.data?.data || response.data;
      setCapitalGainsResult(data);
      toast.success('Capital gains calculated successfully');
    } catch (error) {
      console.error('Capital gains error:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate capital gains');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAdvanceTax = async () => {
    try {
      setLoading(true);
      const response = await incomeTaxAPI.calculator.calculateAdvanceTax(advanceTaxForm);
      const data = response.data?.data || response.data;
      setAdvanceTaxResult(data);
      toast.success('Advance tax calculated successfully');
    } catch (error) {
      console.error('Advance tax error:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate advance tax');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForm16 = async () => {
    try {
      setLoading(true);
      const response = await incomeTaxAPI.generateForm16(form16Form);
      const data = response.data?.data || response.data;
      setForm16Result(data);
      toast.success('Form 16 generated successfully');
    } catch (error) {
      console.error('Form 16 error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate Form 16');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'securities', label: 'Securities Tax P&L', icon: FiTrendingUp },
    { id: 'capital-gains', label: 'Capital Gains', icon: FiDollarSign },
    { id: 'advance-tax', label: 'Advance Tax', icon: FiDollarSign },
    { id: 'form16', label: 'Generate Form 16', icon: FiFileText },
  ];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Income Tax Calculator">
        <Toaster />
        <PageLayout
          title="Income Tax Calculator"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Income Tax', href: '/client/income-tax' },
            { label: 'Calculator' },
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

            {/* Securities Tax P&L Tab */}
            {activeTab === 'securities' && (
              <div className="space-y-6">
                <Card title="Submit Tax P&L Job for Securities">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Input Format
                        </label>
                        <select
                          value={securitiesForm.input}
                          onChange={(e) => setSecuritiesForm(prev => ({ ...prev, input: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="csv">CSV</option>
                          <option value="excel">Excel</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Broker
                        </label>
                        <select
                          value={securitiesForm.from}
                          onChange={(e) => setSecuritiesForm(prev => ({ ...prev, from: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="zerodha">Zerodha</option>
                          <option value="upstox">Upstox</option>
                          <option value="angel">Angel Broking</option>
                          <option value="icici">ICICI Direct</option>
                          <option value="hdfc">HDFC Securities</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Output Format
                        </label>
                        <select
                          value={securitiesForm.output}
                          onChange={(e) => setSecuritiesForm(prev => ({ ...prev, output: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="json">JSON</option>
                          <option value="excel">Excel</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To Format
                        </label>
                        <select
                          value={securitiesForm.to}
                          onChange={(e) => setSecuritiesForm(prev => ({ ...prev, to: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="itr">ITR</option>
                          <option value="schedule_cg">Schedule CG</option>
                          <option value="summary">Summary</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSubmitSecuritiesJob}
                        disabled={loading}
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating Job...
                          </>
                        ) : (
                          <>
                            <FiTrendingUp className="h-4 w-4 mr-2" />
                            Submit Tax P&L Job
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {securitiesJob && (
                  <Card title="Tax P&L Job Status">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Job ID</p>
                          <p className="font-mono text-sm">{securitiesJob.jobId}</p>
                        </div>
                        {securitiesJob.uploadUrl && (
                          <div>
                            <p className="text-sm text-gray-600">Upload URL</p>
                            <p className="font-mono text-xs break-all">{securitiesJob.uploadUrl}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCheckSecuritiesJobStatus}
                          disabled={loading}
                          variant="outline"
                        >
                          <FiRefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </Button>
                      </div>
                      {securitiesJobStatus && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={securitiesJobStatus.status === 'completed' ? 'success' : 'warning'}>
                              {securitiesJobStatus.status}
                            </Badge>
                          </div>
                          {securitiesJobStatus.result && (
                            <div className="text-sm">
                              <p>Total Trades Processed: {securitiesJobStatus.result.total_trades || 0}</p>
                              <p>Short Term Gains: {formatCurrency(securitiesJobStatus.result.short_term_gains || 0)}</p>
                              <p>Long Term Gains: {formatCurrency(securitiesJobStatus.result.long_term_gains || 0)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <Card title="Upload Trading Data">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload URL (from Tax P&L job)
                      </label>
                      <Input
                        value={tradingDataForm.upload_url}
                        onChange={(e) => setTradingDataForm(prev => ({ ...prev, upload_url: e.target.value }))}
                        placeholder="https://s3.amazonaws.com/upload-url"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Add Sample Trade</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock Symbol *
                          </label>
                          <Input
                            value={sampleTrade.stock_symbol}
                            onChange={(e) => setSampleTrade(prev => ({ ...prev, stock_symbol: e.target.value }))}
                            placeholder="RELIANCE"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name
                          </label>
                          <Input
                            value={sampleTrade.company_name}
                            onChange={(e) => setSampleTrade(prev => ({ ...prev, company_name: e.target.value }))}
                            placeholder="Reliance Industries Ltd"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Type
                          </label>
                          <select
                            value={sampleTrade.trade_type}
                            onChange={(e) => setSampleTrade(prev => ({ ...prev, trade_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <Input
                            type="number"
                            value={sampleTrade.quantity}
                            onChange={(e) => setSampleTrade(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (₹) *
                          </label>
                          <Input
                            type="number"
                            value={sampleTrade.price}
                            onChange={(e) => setSampleTrade(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            placeholder="2500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brokerage (₹)
                          </label>
                          <Input
                            type="number"
                            value={sampleTrade.brokerage}
                            onChange={(e) => setSampleTrade(prev => ({ ...prev, brokerage: parseFloat(e.target.value) || 0 }))}
                            placeholder="20"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button onClick={addSampleTrade} variant="outline">
                          Add Trade
                        </Button>
                      </div>
                    </div>

                    {tradingDataForm.trading_data.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Trades to Upload ({tradingDataForm.trading_data.length})</h4>
                        <div className="max-h-40 overflow-y-auto border rounded-lg">
                          {tradingDataForm.trading_data.map((trade, index) => (
                            <div key={index} className="p-3 border-b last:border-b-0 text-sm">
                              <div className="flex justify-between">
                                <span>{trade.stock_symbol} - {trade.trade_type} {trade.quantity} @ ₹{trade.price}</span>
                                <span>₹{trade.net_amount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleUploadTradingData}
                        disabled={loading || !tradingDataForm.upload_url || tradingDataForm.trading_data.length === 0}
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
                            Upload Trading Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Capital Gains Tab */}
            {activeTab === 'capital-gains' && (
              <Card title="Calculate Capital Gains Tax">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Financial Year
                    </label>
                    <Input
                      value={capitalGainsForm.financial_year}
                      onChange={(e) => setCapitalGainsForm(prev => ({ ...prev, financial_year: e.target.value }))}
                      placeholder="2023-24"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Add Transaction</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asset Type
                        </label>
                        <select
                          value={sampleTransaction.type}
                          onChange={(e) => setSampleTransaction(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="equity">Equity</option>
                          <option value="mutual_fund">Mutual Fund</option>
                          <option value="property">Property</option>
                          <option value="gold">Gold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Purchase Date
                        </label>
                        <Input
                          type="date"
                          value={sampleTransaction.purchase_date}
                          onChange={(e) => setSampleTransaction(prev => ({ ...prev, purchase_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sale Date
                        </label>
                        <Input
                          type="date"
                          value={sampleTransaction.sale_date}
                          onChange={(e) => setSampleTransaction(prev => ({ ...prev, sale_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Purchase Price (₹)
                        </label>
                        <Input
                          type="number"
                          value={sampleTransaction.purchase_price}
                          onChange={(e) => setSampleTransaction(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sale Price (₹)
                        </label>
                        <Input
                          type="number"
                          value={sampleTransaction.sale_price}
                          onChange={(e) => setSampleTransaction(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
                          placeholder="1200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          value={sampleTransaction.quantity}
                          onChange={(e) => setSampleTransaction(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={addSampleTransaction} variant="outline">
                        Add Transaction
                      </Button>
                    </div>
                  </div>

                  {capitalGainsForm.transactions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Transactions ({capitalGainsForm.transactions.length})</h4>
                      <div className="max-h-40 overflow-y-auto border rounded-lg">
                        {capitalGainsForm.transactions.map((txn, index) => (
                          <div key={index} className="p-3 border-b last:border-b-0 text-sm">
                            <div className="flex justify-between">
                              <span>{txn.type} - {txn.quantity} units</span>
                              <span>Gain: ₹{((txn.sale_price - txn.purchase_price) * txn.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleCalculateCapitalGains}
                      disabled={loading || capitalGainsForm.transactions.length === 0}
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
                          Calculate Capital Gains
                        </>
                      )}
                    </Button>
                  </div>

                  {capitalGainsResult && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold mb-2">Capital Gains Tax Result</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Short Term Gains</p>
                          <p className="font-semibold">{formatCurrency(capitalGainsResult.shortTermGains || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Long Term Gains</p>
                          <p className="font-semibold">{formatCurrency(capitalGainsResult.longTermGains || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Tax</p>
                          <p className="font-semibold text-red-600">{formatCurrency(capitalGainsResult.totalTax || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Advance Tax Tab */}
            {activeTab === 'advance-tax' && (
              <Card title="Calculate Advance Tax">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Income (₹)
                      </label>
                      <Input
                        type="number"
                        value={advanceTaxForm.estimated_income}
                        onChange={(e) => setAdvanceTaxForm(prev => ({ ...prev, estimated_income: parseFloat(e.target.value) || 0 }))}
                        placeholder="1200000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Financial Year
                      </label>
                      <Input
                        value={advanceTaxForm.financial_year}
                        onChange={(e) => setAdvanceTaxForm(prev => ({ ...prev, financial_year: e.target.value }))}
                        placeholder="2023-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Previous Year Tax (₹)
                      </label>
                      <Input
                        type="number"
                        value={advanceTaxForm.previous_year_tax}
                        onChange={(e) => setAdvanceTaxForm(prev => ({ ...prev, previous_year_tax: parseFloat(e.target.value) || 0 }))}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TDS Amount (₹)
                      </label>
                      <Input
                        type="number"
                        value={advanceTaxForm.tds_amount}
                        onChange={(e) => setAdvanceTaxForm(prev => ({ ...prev, tds_amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="20000"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleCalculateAdvanceTax}
                      disabled={loading || !advanceTaxForm.estimated_income}
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
                          Calculate Advance Tax
                        </>
                      )}
                    </Button>
                  </div>
                  {advanceTaxResult && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold mb-2">Advance Tax Calculation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Q1 (15 Jun)</p>
                          <p className="font-semibold">{formatCurrency(advanceTaxResult.q1_amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Q2 (15 Sep)</p>
                          <p className="font-semibold">{formatCurrency(advanceTaxResult.q2_amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Q3 (15 Dec)</p>
                          <p className="font-semibold">{formatCurrency(advanceTaxResult.q3_amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Q4 (15 Mar)</p>
                          <p className="font-semibold">{formatCurrency(advanceTaxResult.q4_amount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Form 16 Generation Tab */}
            {activeTab === 'form16' && (
              <Card title="Generate Form 16">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-4">Employee Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Name
                        </label>
                        <Input
                          value={form16Form.employee_details.name}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            employee_details: { ...prev.employee_details, name: e.target.value }
                          }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee PAN
                        </label>
                        <Input
                          value={form16Form.employee_details.pan}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            employee_details: { ...prev.employee_details, pan: e.target.value }
                          }))}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <Input
                          value={form16Form.employee_details.address}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            employee_details: { ...prev.employee_details, address: e.target.value }
                          }))}
                          placeholder="123 Main St, City"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Salary Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Basic Salary (₹)
                        </label>
                        <Input
                          type="number"
                          value={form16Form.salary_details.basic_salary}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            salary_details: { ...prev.salary_details, basic_salary: parseFloat(e.target.value) || 0 }
                          }))}
                          placeholder="600000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          HRA (₹)
                        </label>
                        <Input
                          type="number"
                          value={form16Form.salary_details.hra}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            salary_details: { ...prev.salary_details, hra: parseFloat(e.target.value) || 0 }
                          }))}
                          placeholder="240000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Special Allowance (₹)
                        </label>
                        <Input
                          type="number"
                          value={form16Form.salary_details.special_allowance}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            salary_details: { ...prev.salary_details, special_allowance: parseFloat(e.target.value) || 0 }
                          }))}
                          placeholder="160000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PF Contribution (₹)
                        </label>
                        <Input
                          type="number"
                          value={form16Form.salary_details.pf_contribution}
                          onChange={(e) => setForm16Form(prev => ({
                            ...prev,
                            salary_details: { ...prev.salary_details, pf_contribution: parseFloat(e.target.value) || 0 }
                          }))}
                          placeholder="21600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Financial Year
                    </label>
                    <Input
                      value={form16Form.financial_year}
                      onChange={(e) => setForm16Form(prev => ({ ...prev, financial_year: e.target.value }))}
                      placeholder="2023-24"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleGenerateForm16}
                      disabled={loading || !form16Form.employee_details.name || !form16Form.employee_details.pan}
                      variant="primary"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FiFileText className="h-4 w-4 mr-2" />
                          Generate Form 16
                        </>
                      )}
                    </Button>
                  </div>

                  {form16Result && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold mb-2">Form 16 Generated Successfully</h4>
                      <p className="text-sm text-gray-600">
                        Form 16 has been generated and is ready for download.
                      </p>
                      {form16Result.download_url && (
                        <a 
                          href={form16Result.download_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-primary-600 hover:underline"
                        >
                          Download Form 16
                        </a>
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