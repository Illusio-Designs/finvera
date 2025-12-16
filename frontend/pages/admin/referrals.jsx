import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import Badge from '../../components/ui/Badge';
import { useTable } from '../../hooks/useTable';
import { useApi } from '../../hooks/useApi';
import { referralAPI, adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency } from '../../lib/formatters';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiGift } from 'react-icons/fi';

export default function ReferralsList() {
  const [activeTab, setActiveTab] = useState('codes'); // 'codes', 'discount-config', 'rewards'
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState(null);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [ownerType, setOwnerType] = useState('distributor');
  const [loading, setLoading] = useState(false);
  const [codeFormData, setCodeFormData] = useState({
    code: '',
    owner_type: 'distributor',
    owner_id: '',
    discount_type: 'percentage',
    discount_value: '',
    free_trial_days: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
  });
  const [discountFormData, setDiscountFormData] = useState({
    discount_percentage: 10,
    effective_from: '',
    effective_until: '',
    notes: '',
  });
  const [discountConfigs, setDiscountConfigs] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(true);

  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const { data: salesmenData } = useApi(() => adminAPI.salesmen.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || distributorsData || [];
  const salesmen = salesmenData?.data || salesmenData || [];

  const ownerOptions =
    ownerType === 'distributor'
      ? distributors.map((d) => ({
          value: d.id,
          label: `${d.distributor_code} - ${d.company_name || 'N/A'}`,
        }))
      : salesmen.map((s) => ({
          value: s.id,
          label: `${s.salesman_code} - ${s.full_name}`,
        }));

  const {
    data: tableData,
    loading: codesLoading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(adminAPI.referrals.list, {});

  const {
    data: rewardsData,
    loading: rewardsLoading,
    pagination: rewardsPagination,
    handlePageChange: handleRewardsPageChange,
    handleSort: handleRewardsSort,
    sort: rewardsSort,
  } = useTable(referralAPI.getRewards, {});

  useEffect(() => {
    if (activeTab === 'discount-config') {
      fetchDiscountConfigs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (codeFormData.owner_type) {
      setOwnerType(codeFormData.owner_type);
    }
  }, [codeFormData.owner_type]);

  const fetchDiscountConfigs = async () => {
    try {
      setDiscountLoading(true);
      const response = await referralAPI.discountConfig.list();
      setDiscountConfigs(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to load discount configurations');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleCreateCode = () => {
    setEditingCodeId(null);
    resetCodeForm();
    setShowCodeModal(true);
  };

  const handleEditCode = (row) => {
    setCodeFormData({
      code: row.code || '',
      owner_type: row.owner_type || 'distributor',
      owner_id: row.owner_id || '',
      discount_type: row.discount_type || 'percentage',
      discount_value: row.discount_value?.toString() || '',
      free_trial_days: row.free_trial_days?.toString() || '',
      max_uses: row.max_uses?.toString() || '',
      valid_from: row.valid_from ? row.valid_from.split('T')[0] : '',
      valid_until: row.valid_until ? row.valid_until.split('T')[0] : '',
    });
    setEditingCodeId(row.id);
    setShowCodeModal(true);
  };

  const handleDeleteCode = async (id) => {
    if (!confirm('Are you sure you want to delete this referral code?')) return;
    try {
      await adminAPI.referrals.delete(id);
      toast.success('Referral code deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete referral code');
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCodeId) {
        await adminAPI.referrals.update(editingCodeId, codeFormData);
        toast.success('Referral code updated successfully');
      } else {
        await referralAPI.createCode(codeFormData);
        toast.success('Referral code created successfully');
      }
      setShowCodeModal(false);
      resetCodeForm();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save referral code');
    } finally {
      setLoading(false);
    }
  };

  const resetCodeForm = () => {
    setCodeFormData({
      code: '',
      owner_type: 'distributor',
      owner_id: '',
      discount_type: 'percentage',
      discount_value: '',
      free_trial_days: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
    });
    setEditingCodeId(null);
  };

  const handleCreateDiscount = () => {
    setEditingDiscountId(null);
    setDiscountFormData({
      discount_percentage: 10,
      effective_from: '',
      effective_until: '',
      notes: '',
    });
    setShowDiscountModal(true);
  };

  const handleEditDiscount = (config) => {
    setEditingDiscountId(config.id);
    setDiscountFormData({
      discount_percentage: config.discount_percentage,
      effective_from: config.effective_from ? new Date(config.effective_from).toISOString().split('T')[0] : '',
      effective_until: config.effective_until ? new Date(config.effective_until).toISOString().split('T')[0] : '',
      notes: config.notes || '',
    });
    setShowDiscountModal(true);
  };

  const handleDeleteDiscount = async (id) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    try {
      await referralAPI.discountConfig.delete(id);
      toast.success('Configuration deleted successfully');
      fetchDiscountConfigs();
    } catch (error) {
      toast.error('Failed to delete configuration');
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingDiscountId) {
        await referralAPI.discountConfig.update(editingDiscountId, discountFormData);
        toast.success('Configuration updated successfully');
      } else {
        await referralAPI.discountConfig.create(discountFormData);
        toast.success('Configuration created successfully');
      }
      setShowDiscountModal(false);
      fetchDiscountConfigs();
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const codeColumns = [
    { key: 'code', label: 'Code', sortable: true },
    {
      key: 'owner_type',
      label: 'Owner Type',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
    {
      key: 'discount_type',
      label: 'Discount Type',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'current_uses',
      label: 'Uses',
      sortable: true,
      render: (value, row) => `${value || 0} / ${row.max_uses || '∞'}`,
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditCode(row)}
            className="text-primary-600 hover:text-primary-700"
            title="Edit"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteCode(row.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  const discountColumns = [
    {
      key: 'discount_percentage',
      label: 'Discount %',
      sortable: true,
      render: (value) => (
        <Badge variant="primary" className="text-lg">
          {value}%
        </Badge>
      ),
    },
    {
      key: 'effective_from',
      label: 'Effective From',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      key: 'effective_until',
      label: 'Effective Until',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Indefinite',
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditDiscount(row)}
            className="text-primary-600 hover:text-primary-700"
            title="Edit"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteDiscount(row.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  const rewardsColumns = [
    {
      key: 'referrer_type',
      label: 'Referrer Type',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
    {
      key: 'reward_type',
      label: 'Reward Type',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'reward_amount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'reward_status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          pending: 'warning',
          paid: 'success',
          cancelled: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'reward_date',
      label: 'Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <Toaster />
        <PageLayout
          title="Referral Code Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Referrals' },
          ]}
          actions={
            <>
              {activeTab === 'codes' && (
                <Button onClick={handleCreateCode}>
                  <FiPlus className="h-4 w-4 mr-2" />
                  Create Referral Code
                </Button>
              )}
              {activeTab === 'discount-config' && (
                <Button onClick={handleCreateDiscount}>
                  <FiPlus className="h-4 w-4 mr-2" />
                  Add Configuration
                </Button>
              )}
            </>
          }
        >
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['codes', 'discount-config', 'rewards'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab === 'codes' ? 'Referral Codes' : tab === 'discount-config' ? 'Discount Configuration' : 'Rewards'}
                </button>
              ))}
            </nav>
          </div>

          {/* Codes Tab */}
          {activeTab === 'codes' && (
            <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={codeColumns}
              data={tableData?.data || tableData || []}
              loading={codesLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
            />
            </Card>
          )}

          {/* Discount Config Tab */}
          {activeTab === 'discount-config' && (
            <>
              <Card className="shadow-sm border border-gray-200">
              <DataTable
                columns={discountColumns}
                data={discountConfigs}
                loading={discountLoading}
              />
              </Card>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Configurations are applied based on date ranges</li>
                  <li>• When a new configuration is created, overlapping ones are automatically deactivated</li>
                  <li>• The system uses the most recent active configuration for new referral codes</li>
                </ul>
              </div>
            </>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={rewardsColumns}
              data={rewardsData?.data || rewardsData || []}
              loading={rewardsLoading}
              pagination={rewardsPagination}
              onPageChange={handleRewardsPageChange}
              onSort={handleRewardsSort}
              sortField={rewardsSort.field}
              sortOrder={rewardsSort.order}
            />
            </Card>
          )}

          {/* Create/Edit Code Modal */}
          <Modal
            isOpen={showCodeModal}
            onClose={() => {
              setShowCodeModal(false);
              resetCodeForm();
            }}
            title={editingCodeId ? 'Edit Referral Code' : 'Create Referral Code'}
            size="lg"
          >
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <LoadingSpinner size="lg" />
              </div>
            )}
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FiGift className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Referral Code Details</h3>
              </div>
              <FormInput
                name="code"
                label="Referral Code"
                value={codeFormData.code}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
                required
                placeholder="Enter unique code"
              />

              <FormSelect
                name="owner_type"
                label="Owner Type"
                value={codeFormData.owner_type}
                onChange={(name, value) => {
                  setCodeFormData(prev => ({ ...prev, [name]: value, owner_id: '' }));
                }}
                required
                options={[
                  { value: 'distributor', label: 'Distributor' },
                  { value: 'salesman', label: 'Salesman' },
                ]}
              />

              <FormSelect
                name="owner_id"
                label={ownerType === 'distributor' ? 'Distributor' : 'Salesman'}
                value={codeFormData.owner_id}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
                required
                options={ownerOptions}
              />

              <FormSelect
                name="discount_type"
                label="Discount Type"
                value={codeFormData.discount_type}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />

              <FormInput
                name="discount_value"
                label="Discount Value"
                type="number"
                value={codeFormData.discount_value}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
                step="0.01"
                min="0"
              />

              <FormInput
                name="free_trial_days"
                label="Free Trial Days"
                type="number"
                value={codeFormData.free_trial_days}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
                min="0"
              />

              <FormInput
                name="max_uses"
                label="Max Uses"
                type="number"
                value={codeFormData.max_uses}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
                min="1"
                placeholder="Leave empty for unlimited"
              />

              <FormInput
                name="valid_from"
                label="Valid From"
                type="date"
                value={codeFormData.valid_from}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
              />

              <FormInput
                name="valid_until"
                label="Valid Until"
                type="date"
                value={codeFormData.valid_until}
                onChange={(name, value) => setCodeFormData(prev => ({ ...prev, [name]: value }))}
              />

              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button type="submit" disabled={loading} loading={loading}>
                  <FiSave className="h-4 w-4 mr-2" />
                  {editingCodeId ? 'Update' : 'Create'} Referral Code
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCodeModal(false);
                    resetCodeForm();
                  }}
                  disabled={loading}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>

          {/* Create/Edit Discount Config Modal */}
          <Modal
            isOpen={showDiscountModal}
            onClose={() => {
              setShowDiscountModal(false);
              setEditingDiscountId(null);
            }}
            title={editingDiscountId ? 'Edit Configuration' : 'New Configuration'}
            size="md"
          >
            <form onSubmit={handleDiscountSubmit} className="space-y-4">
              <Input
                name="discount_percentage"
                label="Discount Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={discountFormData.discount_percentage}
                onChange={(e) => setDiscountFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) }))}
                required
              />
              <Input
                name="effective_from"
                label="Effective From"
                type="date"
                value={discountFormData.effective_from}
                onChange={(e) => setDiscountFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                required
              />
              <Input
                name="effective_until"
                label="Effective Until (optional - leave empty for indefinite)"
                type="date"
                value={discountFormData.effective_until}
                onChange={(e) => setDiscountFormData(prev => ({ ...prev, effective_until: e.target.value }))}
              />
              <Input
                name="notes"
                label="Notes (optional)"
                value={discountFormData.notes}
                onChange={(e) => setDiscountFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button type="submit" disabled={loading} loading={loading}>
                  <FiSave className="h-4 w-4 mr-2" />
                  {editingDiscountId ? 'Update' : 'Create'} Configuration
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDiscountModal(false);
                    setEditingDiscountId(null);
                  }}
                  disabled={loading}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
