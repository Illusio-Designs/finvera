import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI } from '../lib/api';
import { getNotificationConfig } from '../lib/notificationConfig';
import { useWebSocket } from '../contexts/WebSocketContext';
import { playNotificationSound } from '../lib/soundService';
import { showDesktopNotification } from '../lib/desktopNotificationService';
import { useNotificationPreferences } from './useNotificationPreferences';
import { displayNotification } from '../lib/notificationService';
import { useRouter } from 'next/router';

/**
 * Custom hook for managing notifications with WebSocket support
 * Provides state and methods for fetching, updating, and managing notifications
 */
export function useNotifications(options = {}) {
  const {
    autoFetch = true,
    pollInterval = 60000, // Reduced to 60s since we have WebSocket
    limit = 50,
  } = options;

  const router = useRouter();
  const { socket, isConnected } = useWebSocket();
  const { shouldShowNotification } = useNotificationPreferences();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const displayedIdsRef = useRef(new Set());

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.list({
        limit,
        offset: 0,
        ...params,
      });
      const data = response.data?.data || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const count = response.data?.count || 0;
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  }, []);

  /**
   * Handle new notification from WebSocket
   */
  const handleNewNotification = useCallback(
    (notification) => {
      // Avoid duplicate displays
      if (displayedIdsRef.current.has(notification.id)) {
        return;
      }
      displayedIdsRef.current.add(notification.id);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev].slice(0, limit));
      setUnreadCount((prev) => prev + 1);

      // Check preferences before displaying
      const showInApp = shouldShowNotification(notification.type, 'in_app');
      const showSound = shouldShowNotification(notification.type, 'sound');
      const showDesktop = shouldShowNotification(notification.type, 'desktop');

      // Display in-app notification (toast)
      if (showInApp) {
        displayNotification(notification);
      }

      // Play sound
      if (showSound) {
        playNotificationSound(notification.type);
      }

      // Show desktop notification
      if (showDesktop) {
        showDesktopNotification(
          {
            ...notification,
            config: getNotificationConfig(notification.type),
          },
          () => {
            if (notification.action_url) {
              router.push(notification.action_url);
            }
          }
        );
      }
    },
    [shouldShowNotification, limit, router]
  );

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date() }))
      );
      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      // Update unread count if it was unread
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [notifications]);

  /**
   * Get notification display config
   */
  const getNotificationDisplay = useCallback((notification) => {
    const config = getNotificationConfig(notification.type);
    return {
      ...config,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt || notification.created_at,
      isRead: notification.is_read || false,
      actionUrl: notification.action_url || null,
      metadata: notification.metadata || {},
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [autoFetch, fetchNotifications, fetchUnreadCount]);

  // Set up WebSocket listener
  useEffect(() => {
    if (!socket || !isConnected) return;

    const unsubscribe = socket.on('new_notification', handleNewNotification);

    return () => {
      if (unsubscribe) unsubscribe();
      if (socket) socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isConnected, handleNewNotification]);

  // Set up polling as fallback (only if WebSocket not connected)
  useEffect(() => {
    if (!autoFetch || !pollInterval || isConnected) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [autoFetch, pollInterval, fetchUnreadCount, isConnected]);

  // Clean up displayed IDs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (displayedIdsRef.current.size > 100) {
        const idsArray = Array.from(displayedIdsRef.current);
        displayedIdsRef.current = new Set(idsArray.slice(-100));
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationDisplay,
    refresh: () => {
      fetchNotifications();
      fetchUnreadCount();
    },
  };
}
