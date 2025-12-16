import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { seoAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiSearch } from 'react-icons/fi';

export default function SEOManagement() {
  const router = useRouter();
  const [seoSettings, setSeoSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    page_type: 'page',
    page_path: '',
    page_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSEO();
  }, []);

  const fetchSEO = async () => {
    try {
      setLoading(true);
      const response = await seoAPI.list();
      setSeoSettings(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await seoAPI.update(editingId, formData);
        toast.success('SEO settings updated successfully');
      } else {
        await seoAPI.create(formData);
        toast.success('SEO settings created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchSEO();
    } catch (error) {
      toast.error('Failed to save SEO settings');
    }
  };

  const handleEdit = (seo) => {
    setEditingId(seo.id);
    setFormData({
      page_type: seo.page_type,
      page_path: seo.page_path,
      page_title: seo.page_title,
      meta_description: seo.meta_description,
      meta_keywords: seo.meta_keywords,
      og_title: seo.og_title,
      og_description: seo.og_description,
      og_image: seo.og_image,
      canonical_url: seo.canonical_url,
      is_active: seo.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this SEO setting?')) return;
    try {
      await seoAPI.delete(id);
      toast.success('SEO setting deleted successfully');
      fetchSEO();
    } catch (error) {
      toast.error('Failed to delete SEO setting');
    }
  };

  const resetForm = () => {
    setFormData({
      page_type: 'page',
      page_path: '',
      page_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
      canonical_url: '',
      is_active: true,
    });
  };

  const columns = [
    { key: 'page_path', label: 'Page Path', sortable: true },
    {
      key: 'page_type',
      label: 'Type',
      render: (value) => <Badge variant="primary">{value || 'page'}</Badge>,
    },
    { key: 'page_title', label: 'Title' },
    {
      key: 'is_active',
      label: 'Status',
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
      <AdminLayout>
        <PageLayout
          title="SEO Settings"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'SEO' },
          ]}
          actions={
            <Button onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add SEO Setting
            </Button>
          }
        >
          {showForm && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiSearch className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit SEO Setting' : 'New SEO Setting'}
              </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="page_type"
                      value={formData.page_type}
                      onChange={(e) => setFormData({ ...formData, page_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="page">Page</option>
                      <option value="blog">Blog</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                  <Input
                    name="page_path"
                    label="Page Path"
                    value={formData.page_path}
                    onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                    placeholder="/about"
                    required
                  />
                </div>
                <Input
                  name="page_title"
                  label="Page Title"
                  value={formData.page_title}
                  onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <Input
                  name="meta_keywords"
                  label="Meta Keywords (comma-separated)"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="og_title"
                    label="OG Title"
                    value={formData.og_title}
                    onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                  />
                  <Input
                    name="og_image"
                    label="OG Image URL"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG Description
                  </label>
                  <textarea
                    name="og_description"
                    value={formData.og_description}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <Input
                  name="canonical_url"
                  label="Canonical URL"
                  value={formData.canonical_url}
                  onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                />
                <div className="flex items-center">
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
                <div className="flex gap-3">
                  <Button type="submit">
                    <FiSave className="h-4 w-4 mr-2" />
                    {editingId ? 'Update' : 'Create'} SEO Setting
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
              data={seoSettings}
              loading={loading}
            />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
