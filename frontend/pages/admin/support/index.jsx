import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useTable } from '../../../hooks/useTable';
import { useDebounce } from '../../../hooks/useDebounce';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiFilter, FiX } from 'react-icons/fi';
import Select from '../../../components/ui/Select';

export default function SupportTicketsList() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 500);

  const {
    data: tableData,
    loading,
    error,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(
    adminAPI.support.tickets.list,
    {
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      search: debouncedSearch,
      page: 1,
      limit: 20,
    }
  );

  useEffect(() => {
    if (fetchData) {
      fetchData();
    }
  }, [filters.status, filters.priority, filters.category, debouncedSearch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: '',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'info',
      assigned: 'primary',
      in_progress: 'warning',
      waiting_client: 'warning',
      resolved: 'success',
      closed: 'default',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    };
    return (
      <Badge variant={variants[priority] || 'default'}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'ticket_number',
      label: 'Ticket #',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium text-primary-600">{value}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'client_name',
      label: 'Client',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="capitalize">{value?.replace('_', ' ') || 'N/A'}</span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value) => getPriorityBadge(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'assignedAgent',
      label: 'Assigned To',
      sortable: false,
      render: (value) => (
        <span>{value?.name || 'Unassigned'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        value ? new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : ''
      ),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Support Tickets">
        <Toaster />
        <PageLayout
          title="Support Tickets"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Support Tickets' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          }
        >
          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Filter Tickets</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Ticket #, subject, email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_client">Waiting Client</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="general">General</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
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
            onRowClick={(row) => router.push(`/admin/support/${row.id}`)}
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
