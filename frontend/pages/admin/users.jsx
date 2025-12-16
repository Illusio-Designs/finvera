import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useTable } from '../../hooks/useTable';
import { adminAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { getRoleDisplayName } from '../../lib/roleConfig';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiUser } from 'react-icons/fi';
import { useState } from 'react';

export default function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
    phone: '',
    is_active: true,
  });

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(adminAPI.users.list, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminAPI.users.update(editingId, formData);
        toast.success('User updated successfully');
      } else {
        await adminAPI.users.create(formData);
        toast.success('User created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminAPI.users.delete(id);
      toast.success('User deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'admin',
      phone: '',
      is_active: true,
    });
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant="primary">{getRoleDisplayName(value)}</Badge>
      ),
    },
    { key: 'phone', label: 'Phone' },
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
      key: 'last_login',
      label: 'Last Login',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-primary-600 hover:text-primary-700"
            title="Edit"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <PageLayout
          title="System Users"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Users' },
          ]}
          actions={
            <Button onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}>
              <FiPlus className="h-4 w-4 mr-2" />
              New User
            </Button>
          }
        >
          {showForm && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit User' : 'New User'}
              </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="name"
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    name="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="password"
                    label={editingId ? 'New Password (leave empty to keep current)' : 'Password'}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingId}
                  />
                  <Input
                    name="phone"
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="finance_manager">Finance Manager</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit">
                    <FiSave className="h-4 w-4 mr-2" />
                    {editingId ? 'Update' : 'Create'} User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      resetForm();
                    }}
                  >
                    <FiX className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

            <DataTable
              columns={columns}
              data={tableData?.data || tableData || []}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
            />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
