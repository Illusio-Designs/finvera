import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useTable } from '../../../hooks/useTable';
import { blogAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiSave, FiX } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function BlogManagement() {
  const router = useRouter();
  const mode = typeof router.query.mode === 'string' ? router.query.mode : 'list';
  const selectedId = typeof router.query.id === 'string' ? router.query.id : null;

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(blogAPI.list, {});

  const [categories, setCategories] = useState([]);
  const [fetchingPost, setFetchingPost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState(null);
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

  const isList = mode === 'list' || !mode;
  const isNew = mode === 'new';
  const isEdit = mode === 'edit' && !!selectedId;
  const isView = mode === 'view' && !!selectedId;

  const pageTitle = useMemo(() => {
    if (isNew) return 'New Blog Post';
    if (isEdit) return 'Edit Blog Post';
    if (isView) return 'View Blog Post';
    return 'Blog Management';
  }, [isNew, isEdit, isView]);

  const generateSlug = (title) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const goList = () => router.push('/admin/blog');
  const goNew = () => router.push('/admin/blog?mode=new');
  const goEdit = (id) => router.push(`/admin/blog?mode=edit&id=${encodeURIComponent(id)}`);
  const goView = (id) => router.push(`/admin/blog?mode=view&id=${encodeURIComponent(id)}`);

  const fetchCategories = async () => {
    try {
      const response = await blogAPI.categories.list();
      setCategories(response.data?.data || response.data || []);
    } catch (error) {
      // Keep UI usable even if categories fail
      console.error('Failed to load categories', error);
    }
  };

  const fetchBlogPost = async (id) => {
    try {
      setFetchingPost(true);
      const response = await blogAPI.get(id);
      const blog = response.data?.data || response.data;
      setPost(blog);
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
      goList();
    } finally {
      setFetchingPost(false);
    }
  };

  useEffect(() => {
    if (isNew || isEdit || isView) {
      fetchCategories();
    }
  }, [isNew, isEdit, isView]);

  useEffect(() => {
    if ((isEdit || isView) && selectedId) {
      fetchBlogPost(selectedId);
    } else {
      setPost(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isView, selectedId]);

  useEffect(() => {
    if (isNew) {
      setPost(null);
      setFormData({
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
    }
  }, [isNew]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await blogAPI.delete(id);
      toast.success('Blog post deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete blog post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (isEdit && selectedId) {
        await blogAPI.update(selectedId, formData);
        toast.success('Blog post updated successfully');
      } else {
        await blogAPI.create(formData);
        toast.success('Blog post created successfully');
      }
      refetch();
      goList();
    } catch (error) {
      toast.error(isEdit ? 'Failed to update blog post' : 'Failed to create blog post');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'category',
      label: 'Category',
      render: (value, row) => row.category?.name || 'Uncategorized',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'published' ? 'success' : value === 'draft' ? 'warning' : 'danger'}>
          {value || 'draft'}
        </Badge>
      ),
    },
    {
      key: 'published_at',
      label: 'Published',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Not published',
    },
    {
      key: 'author',
      label: 'Author',
      render: (value, row) => row.author?.name || 'Unknown',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => goView(row.id)}
            className="text-gray-600 hover:text-gray-800"
            title="View"
          >
            <FiEye className="h-5 w-5" />
          </button>
          <button
            onClick={() => goEdit(row.id)}
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
      <AdminLayout title={pageTitle}>
        <Toaster />

        {isList && (
          <PageLayout
            title="Blog Posts"
            breadcrumbs={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Blog' },
            ]}
            actions={
              <Button onClick={goNew}>
                <FiPlus className="h-4 w-4 mr-2" />
                New Blog Post
              </Button>
            }
          >
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
        )}

        {(isNew || isEdit) && (
          <PageLayout
            title={isNew ? 'New Blog Post' : 'Edit Blog Post'}
            breadcrumbs={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Blog', href: '/admin/blog' },
              { label: isNew ? 'New' : 'Edit' },
            ]}
          >
            {fetchingPost ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <Input
                      name="title"
                      label="Title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: generateSlug(e.target.value),
                        })
                      }
                      required
                    />
                    <Input
                      name="slug"
                      label="Slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated-from-title"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                      <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                    <Input
                      name="featured_image"
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
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            [{ color: [] }, { background: [] }],
                            ['link', 'image'],
                            ['clean'],
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
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
                  <Button type="submit" disabled={saving}>
                    <FiSave className="h-4 w-4 mr-2" />
                    {saving ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Blog Post' : 'Create Blog Post'}
                  </Button>
                  <Button type="button" variant="outline" onClick={goList}>
                    <FiX className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </PageLayout>
        )}

        {isView && (
          <PageLayout
            title="View Blog Post"
            breadcrumbs={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Blog', href: '/admin/blog' },
              { label: 'View' },
            ]}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={goList}>
                  <FiX className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {selectedId && (
                  <Button onClick={() => goEdit(selectedId)}>
                    <FiEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            }
          >
            {fetchingPost ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="text-lg font-semibold text-gray-900">{post?.title || '-'}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="mt-1">
                      <Badge variant={post?.status === 'published' ? 'success' : post?.status === 'draft' ? 'warning' : 'danger'}>
                        {post?.status || 'draft'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="text-gray-900">{post?.category?.name || 'Uncategorized'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Slug</div>
                    <div className="text-gray-900">{post?.slug || '-'}</div>
                  </div>
                </div>
                {post?.excerpt && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Excerpt</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{post.excerpt}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-2">Content</div>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: post?.content || '' }}
                  />
                </div>
              </div>
            )}
          </PageLayout>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
