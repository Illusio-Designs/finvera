import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { referralAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import DataTable from '../../../components/tables/DataTable';
import { FiPlus, FiEdit, FiTrash2, FiCalendar } from 'react-icons/fi';
import Badge from '../../../components/ui/Badge';

export default function ReferralDiscountConfig() {
  const router = useRouter();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    discount_percentage: 10,
    effective_from: '',
    effective_until: '',
    notes: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await referralAPI.discountConfig.list();
      setConfigs(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to load discount configurations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await referralAPI.discountConfig.update(editingId, formData);
        toast.success('Configuration updated successfully');
      } else {
        await referralAPI.discountConfig.create(formData);
        toast.success('Configuration created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        discount_percentage: 10,
        effective_from: '',
        effective_until: '',
        notes: '',
      });
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error(error);
    }
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setFormData({
      discount_percentage: config.discount_percentage,
      effective_from: config.effective_from ? new Date(config.effective_from).toISOString().split('T')[0] : '',
      effective_until: config.effective_until ? new Date(config.effective_until).toISOString().split('T')[0] : '',
      notes: config.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    try {
      await referralAPI.discountConfig.delete(id);
      toast.success('Configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to delete configuration');
      console.error(error);
    }
  };

  const columns = [
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
            onClick={() => handleEdit(row)}
            className="text-primary-600 hover:text-primary-700"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Referral Discount Configuration">
        <PageLayout
          title="Referral Discount Configuration"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Referrals', href: '/admin/referrals' },
            { label: 'Discount Configuration' },
          ]}
          actions={
            <Button onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                discount_percentage: 10,
                effective_from: '',
                effective_until: '',
                notes: '',
              });
            }}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          }
        >
          {showForm && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? 'Edit Configuration' : 'New Configuration'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  name="discount_percentage"
                  label="Discount Percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  name="effective_from"
                  label="Effective From"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  required
                />
                <Input
                  name="effective_until"
                  label="Effective Until (optional - leave empty for indefinite)"
                  type="date"
                  value={formData.effective_until}
                  onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                />
                <Input
                  name="notes"
                  label="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button type="submit">
                    {editingId ? 'Update' : 'Create'} Configuration
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={configs}
              loading={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Configurations are applied based on date ranges</li>
              <li>• When a new configuration is created, overlapping ones are automatically deactivated</li>
              <li>• The system uses the most recent active configuration for new referral codes</li>
              <li>• Existing referral codes are updated with the new discount percentage</li>
            </ul>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
