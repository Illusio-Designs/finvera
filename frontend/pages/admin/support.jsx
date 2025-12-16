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
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiFilter, FiX, FiSend, FiHeadphones } from 'react-icons/fi';

export default function SupportTicketsList() {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchTickets();
  }, [filters.status, filters.priority, filters.category, filters.search, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.support.tickets.list({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
      });
      const data = response.data?.data || response.data || [];
      setTableData(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (row) => {
    try {
      setDetailLoading(true);
      const response = await adminAPI.support.tickets.get(row.id);
      setSelectedTicket(response.data?.data || response.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      setSaving(true);
      await adminAPI.support.tickets.addMessage(selectedTicket.id, {
        message: newMessage,
        is_internal: false,
      });
      toast.success('Message sent');
      setNewMessage('');
      const response = await adminAPI.support.tickets.get(selectedTicket.id);
      setSelectedTicket(response.data?.data || response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate || !selectedTicket) return;
    try {
      setSaving(true);
      await adminAPI.support.tickets.updateStatus(selectedTicket.id, {
        status: statusUpdate,
      });
      toast.success('Ticket status updated');
      setShowStatusModal(false);
      setStatusUpdate('');
      const response = await adminAPI.support.tickets.get(selectedTicket.id);
      setSelectedTicket(response.data?.data || response.data);
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          }
        >
          {/* Filters */}
          {showFilters && (
            <Card className="mb-4">
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

          <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={tableData}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onRowClick={handleView}
            />
          </Card>

          {/* Ticket Detail Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedTicket(null);
              setNewMessage('');
            }}
            title={selectedTicket ? `Ticket ${selectedTicket.ticket_number}` : 'Ticket Details'}
            size="xl"
            className="max-h-[90vh] overflow-y-auto"
          >
            {detailLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : selectedTicket ? (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTicket.subject}</h3>
                  <div className="flex gap-4 text-sm">
                    <span>Status: {getStatusBadge(selectedTicket.status)}</span>
                    <span>Priority: {getPriorityBadge(selectedTicket.priority)}</span>
                    <span>Category: <span className="capitalize">{selectedTicket.category?.replace('_', ' ')}</span></span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{selectedTicket.description || 'No description'}</p>
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Messages</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTicket.messages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${msg.is_internal ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{msg.sender_name || 'System'}</span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-900">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={saving || !newMessage.trim()}>
                      <FiSend className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStatusModal(true);
                    }}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTicket(null);
                      setNewMessage('');
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </Modal>

          {/* Status Update Modal */}
          <Modal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setStatusUpdate('');
            }}
            title="Update Ticket Status"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select status</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_client">Waiting Client</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button onClick={handleStatusUpdate} disabled={saving || !statusUpdate} loading={saving}>
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdate('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
