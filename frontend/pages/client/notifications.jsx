import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/layouts/ClientLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItemCard, MarkAsReadButton } from '../../components/account/notifications';
import { getNotificationConfig, NOTIFICATION_TYPES } from '../../lib/notificationConfig';
import { FiFilter, FiCheck, FiTrash2, FiX } from 'react-icons/fi';
import { notify } from '../../components/ui/Toast';

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationDisplay,
    refresh,
  } = useNotifications({ limit: 100 });

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (selectedCategory !== 'all') {
      const config = getNotificationConfig(notification.type);
      if (config.category !== selectedCategory) {
        return false;
      }
    }
    if (selectedType !== 'all') {
      if (notification.type !== selectedType) {
        return false;
      }
    }
    return true;
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      notify.success('All notifications marked as read');
    } else {
      notify.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      notify.success('Notification deleted');
    } else {
      notify.error('Failed to delete notification');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) {
      notify.warning('Please select notifications to delete');
      return;
    }

    try {
      const promises = Array.from(selectedNotifications).map((id) =>
        deleteNotification(id)
      );
      await Promise.all(promises);
      setSelectedNotifications(new Set());
      notify.success(`${selectedNotifications.size} notifications deleted`);
    } catch (error) {
      notify.error('Failed to delete notifications');
    }
  };

  const toggleSelection = (notificationId) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Errors' },
    { value: 'warning', label: 'Warnings' },
    { value: 'info', label: 'Info' },
  ];

  // Get unique notification types for filter
  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    ...Object.entries(NOTIFICATION_TYPES).map(([key, value]) => ({
      value,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    })),
  ];

  return (
    <ClientLayout title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FiFilter className="h-4 w-4" />
              Filters
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            {selectedNotifications.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete}>
                <FiTrash2 className="h-4 w-4 mr-2" />
                Delete ({selectedNotifications.size})
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {notificationTypes.slice(0, 20).map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications List */}
        <Card>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const display = getNotificationDisplay(notification);
                const config = getNotificationConfig(notification.type);
                const isSelected = selectedNotifications.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-primary-50' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(notification.id)}
                      className="mt-1.5 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: config.bgColor,
                            color: config.color,
                          }}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-semibold ${
                                    !notification.is_read
                                      ? 'text-gray-900'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <Badge variant="primary" size="sm">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTime(
                                  notification.createdAt ||
                                    notification.created_at
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                          title="Mark as read"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </ClientLayout>
  );
}
