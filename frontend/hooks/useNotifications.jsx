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
  const fetchingUnreadCountRef = useRef(false);
  const fetchUnreadCountAbortRef = useRef(null);

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
      // Only log network errors, don't set error state to prevent UI spam
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Network error fetching notifications (backend may be offline)');
      } else {
        console.error('Error fetching notifications:', err);
        setError(err.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  /**
   * Fetch unread count with debouncing and error handling
   */
  const fetchUnreadCount = useCallback(async () => {
    // Prevent concurrent calls
    if (fetchingUnreadCountRef.current) {
      return;
    }

    fetchingUnreadCountRef.current = true;

    try {
      const response = await notificationAPI.getUnreadCount();
      const count = response.data?.count || 0;
      setUnreadCount(count);
    } catch (err) {
      // Silently handle network errors - backend might be offline or endpoint unavailable
      // Suppress console errors for network issues to reduce noise
      if (
        err.code !== 'ERR_NETWORK' && 
        err.message !== 'Network Error' && 
        err.code !== 'ERR_CANCELED' &&
        !err.response // Suppress errors without response (network issues)
      ) {
        // Only log actual API errors (4xx, 5xx with response)
        if (err.response?.status >= 400) {
          console.warn('Notification API error:', err.response?.status, err.response?.data?.message);
        }
      }
      // Don't update state on error - keep existing count
    } finally {
      // Use setTimeout to prevent rapid re-calls
      setTimeout(() => {
        fetchingUnreadCountRef.current = false;
      }, 1000); // Wait 1 second before allowing next call
    }
  }, []); // No dependencies - stable function

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

  // Initial fetch - only run once on mount
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchNotifications();
      fetchUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Functions are stable useCallbacks, safe to omit from deps

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

    return () => {
      clearInterval(interval);
      // Abort any pending request on cleanup
      if (fetchUnreadCountAbortRef.current) {
        fetchUnreadCountAbortRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, pollInterval, isConnected]); // fetchUnreadCount is stable, safe to omit

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

  // Stable refresh function
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

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
    refresh,
  };
}
