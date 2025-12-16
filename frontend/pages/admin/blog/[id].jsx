import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { blogAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { FiSave, FiX } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function EditBlogPost() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    if (id) {
      fetchBlogPost();
      fetchCategories();
    }
  }, [id]);

  const fetchBlogPost = async () => {
    try {
      setFetching(true);
      const response = await blogAPI.get(id);
      const blog = response.data?.data || response.data;
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        category_id: blog.category_id || '',
        status: blog.status || 'draft',
        featured_image: blog.featured_image || '',
        meta_title: blog.meta_title || '',
        meta_description: blog.meta_description || '',
        meta_keywords: blog.meta_keywords || '',
      });
    } catch (error) {
      toast.error('Failed to load blog post');
      router.push('/admin/blog');
    } finally {
      setFetching(false);
    }
  };

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
      await blogAPI.update(id, formData);
      toast.success('Blog post updated successfully');
      router.push('/admin/blog');
    } catch (error) {
      toast.error('Failed to update blog post');
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

  if (fetching) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout title="Edit Blog Post">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Edit Blog Post">
        <PageLayout
          title="Edit Blog Post"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Blog', href: '/admin/blog' },
            { label: 'Edit' },
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
                <Input
                  name="meta_title"
                  label="Meta Title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <Input
                  name="meta_keywords"
                  label="Meta Keywords (comma-separated)"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update Blog Post'}
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
