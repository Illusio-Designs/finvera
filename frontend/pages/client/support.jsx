import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import { clientSupportAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { FiX, FiSend, FiHeadphones, FiPlus, FiStar } from 'react-icons/fi';

export default function ClientSupport() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Create ticket form state
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    fetchTickets();
  }, [filters.status, filters.priority, filters.category, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await clientSupportAPI.tickets.list({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category || undefined,
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

  const handleCreateTicket = async () => {
    if (!createForm.subject.trim() || !createForm.description.trim()) {
      toast.error('Please fill in subject and description');
      return;
    }

    try {
      setSaving(true);
      const response = await clientSupportAPI.tickets.create({
        client_name: user?.name || 'Client',
        client_email: user?.email || '',
        subject: createForm.subject,
        description: createForm.description,
        category: createForm.category,
        priority: createForm.priority,
      });
      toast.success('Support ticket created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (row) => {
    try {
      setDetailLoading(true);
      const response = await clientSupportAPI.tickets.get(row.id);
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
      await clientSupportAPI.tickets.addMessage(selectedTicket.id, {
        message: newMessage,
      });
      toast.success('Message sent');
      setNewMessage('');
      const response = await clientSupportAPI.tickets.get(selectedTicket.id);
      setSelectedTicket(response.data?.data || response.data);
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.rating || !selectedTicket) return;
    try {
      setSaving(true);
      await clientSupportAPI.tickets.submitReview(selectedTicket.id, reviewForm);
      toast.success('Thank you for your feedback!');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      const response = await clientSupportAPI.tickets.get(selectedTicket.id);
      setSelectedTicket(response.data?.data || response.data);
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      status: newFilters.status || '',
      priority: newFilters.priority || '',
      category: newFilters.category || '',
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
      key: 'category',
      label: 'Category',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: '', label: 'All Categories' },
        { value: 'technical', label: 'Technical' },
        { value: 'billing', label: 'Billing' },
        { value: 'feature_request', label: 'Feature Request' },
        { value: 'bug_report', label: 'Bug Report' },
        { value: 'general', label: 'General' },
        { value: 'other', label: 'Other' },
      ],
      render: (value) => (
        <span className="capitalize">{value?.replace('_', ' ') || 'N/A'}</span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: '', label: 'All Priorities' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
      render: (value) => getPriorityBadge(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: '', label: 'All Statuses' },
        { value: 'open', label: 'Open' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'waiting_client', label: 'Waiting Client' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
      ],
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
    <ProtectedRoute portalType="client">
      <ClientLayout>
        <Toaster />
        <PageLayout
          title="Support Tickets"
          breadcrumbs={[
            { label: 'Dashboard', href: '/client/dashboard' },
            { label: 'Support' },
          ]}
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <FiPlus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          }
        >
          <DataTable
            columns={columns}
            data={tableData}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onRowClick={handleView}
            onFilter={handleFilterChange}
            filters={filters}
            searchable={false}
            showFilters={true}
          />

          {/* Create Ticket Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setCreateForm({
                subject: '',
                description: '',
                category: 'general',
                priority: 'medium',
              });
            }}
            title="Create Support Ticket"
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <Input
                  label="Subject"
                  name="subject"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <Textarea
                  label="Description"
                  name="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="general">General</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleCreateTicket} disabled={saving} loading={saving}>
                  Create Ticket
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      subject: '',
                      description: '',
                      category: 'general',
                      priority: 'medium',
                    });
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>

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
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span>Status: {getStatusBadge(selectedTicket.status)}</span>
                    <span>Priority: {getPriorityBadge(selectedTicket.priority)}</span>
                    <span>Category: <span className="capitalize">{selectedTicket.category?.replace('_', ' ')}</span></span>
                    {selectedTicket.assignedAgent && (
                      <span>Assigned to: {selectedTicket.assignedAgent.name}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description || 'No description'}</p>
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Conversation</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTicket.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            msg.sender_type === 'client' ? 'bg-blue-50' : msg.sender_type === 'agent' ? 'bg-gray-50' : 'bg-yellow-50'
                          }`}
                        >
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span className="font-medium">
                              {msg.sender_type === 'client' ? 'You' : msg.sender_name || 'System'}
                            </span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {['resolved', 'closed'].includes(selectedTicket.status) && !selectedTicket.review && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 mb-3">
                      This ticket has been resolved. Please share your feedback to help us improve our service.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewModal(true)}
                    >
                      <FiStar className="h-4 w-4 mr-2" />
                      Submit Review
                    </Button>
                  </div>
                )}

                {selectedTicket.review && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-green-900">Your Review</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`h-4 w-4 ${
                              i < selectedTicket.review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {selectedTicket.review.comment && (
                      <p className="text-sm text-green-900">{selectedTicket.review.comment}</p>
                    )}
                  </div>
                )}

                {!['resolved', 'closed'].includes(selectedTicket.status) && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button onClick={handleSendMessage} disabled={saving || !newMessage.trim()} loading={saving}>
                        <FiSend className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
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

          {/* Review Modal */}
          <Modal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setReviewForm({ rating: 5, comment: '' });
            }}
            title="Submit Review"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating })}
                      className="focus:outline-none"
                    >
                      <FiStar
                        className={`h-8 w-8 ${
                          rating <= reviewForm.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {reviewForm.rating === 1 && 'Poor'}
                  {reviewForm.rating === 2 && 'Fair'}
                  {reviewForm.rating === 3 && 'Good'}
                  {reviewForm.rating === 4 && 'Very Good'}
                  {reviewForm.rating === 5 && 'Excellent'}
                </p>
              </div>

              <div>
                <Textarea
                  label="Comment (Optional)"
                  name="comment"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleSubmitReview} disabled={saving} loading={saving}>
                  Submit Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewForm({ rating: 5, comment: '' });
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
