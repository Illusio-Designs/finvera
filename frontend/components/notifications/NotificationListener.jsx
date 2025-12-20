import { useEffect, useRef } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { displayNotification, shouldDisplayAsToast } from '../../lib/notificationService';

/**
 * NotificationListener Component
 * Automatically displays new notifications as toast when they arrive
 * Should be placed in the layout or root component
 */
export default function NotificationListener() {
  const { notifications } = useNotifications({
    autoFetch: true,
    pollInterval: 30000, // Poll every 30 seconds
  });

  // Track displayed notification IDs to avoid duplicates
  const displayedIdsRef = useRef(new Set());

  // Display new notifications as they arrive
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Display only unread notifications that haven't been shown yet
    notifications.forEach((notification) => {
      if (
        !notification.is_read &&
        !displayedIdsRef.current.has(notification.id) &&
        shouldDisplayAsToast(notification)
      ) {
        displayedIdsRef.current.add(notification.id);
        // Small delay to ensure notification is ready
        setTimeout(() => {
          displayNotification(notification);
        }, 500);
      }
    });
  }, [notifications]);

  // Clean up old displayed IDs periodically (keep last 100)
  useEffect(() => {
    const interval = setInterval(() => {
      if (displayedIdsRef.current.size > 100) {
        const idsArray = Array.from(displayedIdsRef.current);
        displayedIdsRef.current = new Set(idsArray.slice(-100));
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything
  return null;
}
