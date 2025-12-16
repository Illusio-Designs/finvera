import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import { useTable } from '../../../hooks/useTable';
import { blogAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BlogManagement() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(blogAPI.list, {});

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
            onClick={() => router.push(`/admin/blog/${row.id}`)}
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
      <AdminLayout title="Blog Management">
        <PageLayout
          title="Blog Posts"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Blog' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/blog/new')}>
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
      </AdminLayout>
    </ProtectedRoute>
  );
}
