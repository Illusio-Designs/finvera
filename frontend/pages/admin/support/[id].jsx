import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiTag,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import { formatDate } from '../../../lib/formatters';

export default function SupportTicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.support.tickets.get(id);
      setTicket(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) {
      toast.error('Please select a status');
      return;
    }

    try {
      setSaving(true);
      const data = { status: statusUpdate };
      if (statusUpdate === 'resolved' && resolutionNote) {
        data.resolution_note = resolutionNote;
      }
      
      await adminAPI.support.tickets.updateStatus(id, data);
      toast.success('Ticket status updated');
      setShowStatusModal(false);
      setStatusUpdate('');
      setResolutionNote('');
      fetchTicket();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSaving(true);
      await adminAPI.support.tickets.addMessage(id, {
        message: newMessage,
        is_internal: false,
      });
      toast.success('Message sent');
      setNewMessage('');
      fetchTicket();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout title="Support Ticket">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!ticket) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout title="Support Ticket">
          <div className="text-center py-12">
            <p className="text-gray-500">Ticket not found</p>
            <Button onClick={() => router.push('/admin/support')} className="mt-4">
              Back to Tickets
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Support Ticket">
        <Toaster />
        <PageLayout
          title={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/support')}
              >
                <FiArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {ticket.ticket_number}
                </h1>
                <p className="text-sm text-gray-600">{ticket.subject}</p>
              </div>
            </div>
          }
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Support Tickets', href: '/admin/support' },
            { label: ticket.ticket_number },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(true)}
              >
                Update Status
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Description */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Messages */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Conversation ({ticket.messages?.length || 0})
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {ticket.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.sender_type === 'agent' || message.sender_type === 'system'
                          ? 'bg-primary-50 border border-primary-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {message.sender_name || 'System'}
                          </span>
                          {message.sender_type === 'system' && (
                            <Badge variant="default" size="sm">System</Badge>
                          )}
                          {message.is_internal && (
                            <Badge variant="warning" size="sm">Internal</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.createdAt, 'MMM DD, YYYY')} at{' '}
                          {new Date(message.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline"
                              >
                                File {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* New Message */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Reply
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={handleSendMessage}
                      disabled={saving || !newMessage.trim()}
                      loading={saving}
                    >
                      <FiSend className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Priority</span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Category</span>
                    <span className="text-sm text-gray-600 capitalize">
                      {ticket.category?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Assigned To</span>
                    <span className="text-sm text-gray-600">
                      {ticket.assignedAgent?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Created</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(ticket.createdAt, 'MMM DD, YYYY')}
                    </span>
                  </div>
                  {ticket.resolved_at && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-1">Resolved</span>
                      <span className="text-sm text-gray-600">
                        {formatDate(ticket.resolved_at, 'MMM DD, YYYY')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiUser className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{ticket.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${ticket.client_email}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {ticket.client_email}
                    </a>
                  </div>
                  {ticket.client_phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${ticket.client_phone}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {ticket.client_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Note */}
              {ticket.resolution_note && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                    Resolution Note
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {ticket.resolution_note}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Update Modal */}
          {showStatusModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Ticket Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
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
                  {statusUpdate === 'resolved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Note
                      </label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Enter resolution details..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowStatusModal(false);
                        setStatusUpdate('');
                        setResolutionNote('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={saving || !statusUpdate}
                      loading={saving}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
