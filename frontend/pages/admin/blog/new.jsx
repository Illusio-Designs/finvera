import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import { blogAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { FiSave, FiX } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function NewBlogPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
    status: 'draft',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  const [categories, setCategories] = useState([]);

  useState(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await blogAPI.categories.list();
      setCategories(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await blogAPI.create(formData);
      toast.success('Blog post created successfully');
      router.push('/admin/blog');
    } catch (error) {
      toast.error('Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="New Blog Post">
        <PageLayout
          title="New Blog Post"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Blog', href: '/admin/blog' },
            { label: 'New' },
          ]}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <FormInput
                  label="Title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  required
                />
                <FormInput
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
                <FormInput
                  label="Excerpt"
                  type="textarea"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Category"
                    type="select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </FormInput>
                  <FormInput
                    label="Status"
                    type="select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </FormInput>
                </div>
                <FormInput
                  label="Featured Image URL"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                {typeof window !== 'undefined' && (
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                    className="bg-white"
                    style={{ minHeight: '300px' }}
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <FormInput
                  label="Meta Title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                />
                <FormInput
                  label="Meta Description"
                  type="textarea"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={2}
                />
                <FormInput
                  label="Meta Keywords (comma-separated)"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Blog Post'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/blog')}
              >
                <FiX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
