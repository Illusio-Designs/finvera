/**
 * Invoice Notification Service
 * 
 * Handles notifications for e-invoice, e-way bill, and TDS events
 * Integrates with existing globalNotificationService and NotificationContext
 * Provides notification payload formatting and scheduling capabilities
 */

import * as Notifications from 'expo-notifications';
import { 
  showGlobalSuccess, 
  showGlobalError, 
  showGlobalWarning, 
  showGlobalInfo 
} from '../globalNotificationService';
import { notificationAPI } from '../../lib/api';

/**
 * Notification types for invoice system
 */
export const NOTIFICATION_TYPES = {
  E_INVOICE: 'E_INVOICE',
  E_WAY_BILL: 'E_WAY_BILL',
  TDS: 'TDS',
  STATUS_CHANGE: 'STATUS_CHANGE',
};

/**
 * Configure expo-notifications behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * NotificationService class
 * Provides methods for sending, scheduling, and retrieving notifications
 */
class NotificationService {
  /**
   * Send a notification immediately
   * @param {Object} payload - Notification payload
   * @param {string} payload.type - Notification type (E_INVOICE, E_WAY_BILL, TDS, STATUS_CHANGE)
   * @param {string} payload.title - Notification title
   * @param {string} payload.message - Notification message
   * @param {string} payload.voucherId - Associated voucher ID
   * @param {string} payload.voucherNumber - Associated voucher number
   * @param {Date} payload.timestamp - Notification timestamp
   * @param {Object} payload.data - Additional data
   * @returns {Promise<void>}
   */
  async sendNotification(payload) {
    const { type, title, message, voucherId, voucherNumber, timestamp, data } = payload;

    // Determine notification display type based on event type
    const displayType = this._getDisplayType(type, data);

    // Show in-app notification using global notification service
    switch (displayType) {
      case 'success':
        showGlobalSuccess(title, message);
        break;
      case 'error':
        showGlobalError(title, message);
        break;
      case 'warning':
        showGlobalWarning(title, message);
        break;
      case 'info':
      default:
        showGlobalInfo(title, message);
        break;
    }

    // Send push notification using expo-notifications
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: {
            type,
            voucherId,
            voucherNumber,
            timestamp: timestamp?.toISOString() || new Date().toISOString(),
            ...data,
          },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }

    // Store notification in backend for history
    try {
      await this._persistNotification(payload);
    } catch (error) {
      console.error('Failed to persist notification:', error);
    }
  }

  /**
   * Schedule a notification for delayed delivery
   * @param {Object} payload - Notification payload
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise<string>} - Notification identifier
   */
  async scheduleNotification(payload, delay) {
    const { type, title, message, voucherId, voucherNumber, timestamp, data } = payload;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: {
            type,
            voucherId,
            voucherNumber,
            timestamp: timestamp?.toISOString() || new Date().toISOString(),
            ...data,
          },
        },
        trigger: {
          seconds: Math.floor(delay / 1000),
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Get notification history for a voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Array>} - Array of notification payloads
   */
  async getNotificationHistory(voucherId) {
    try {
      const response = await notificationAPI.list({ voucher_id: voucherId });
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
      return [];
    }
  }

  /**
   * Format notification payload for e-invoice events
   * @param {string} event - Event type (success, failure, cancelled)
   * @param {Object} data - Event data
   * @returns {Object} - Formatted notification payload
   */
  formatEInvoiceNotification(event, data) {
    const { voucherId, voucherNumber, irn, ackNo, errorMessage } = data;

    switch (event) {
      case 'success':
        return {
          type: NOTIFICATION_TYPES.E_INVOICE,
          title: 'E-Invoice Generated',
          message: `E-Invoice generated successfully for ${voucherNumber}. IRN: ${irn}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { irn, ackNo, event: 'generated' },
        };

      case 'failure':
        return {
          type: NOTIFICATION_TYPES.E_INVOICE,
          title: 'E-Invoice Generation Failed',
          message: `Failed to generate e-invoice for ${voucherNumber}. ${errorMessage || 'Please try again.'}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { errorMessage, event: 'failed' },
        };

      case 'cancelled':
        return {
          type: NOTIFICATION_TYPES.E_INVOICE,
          title: 'E-Invoice Cancelled',
          message: `E-Invoice cancelled for ${voucherNumber}. IRN: ${irn}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { irn, event: 'cancelled' },
        };

      default:
        return {
          type: NOTIFICATION_TYPES.E_INVOICE,
          title: 'E-Invoice Update',
          message: `E-Invoice status updated for ${voucherNumber}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { event },
        };
    }
  }

  /**
   * Format notification payload for e-way bill events
   * @param {string} event - Event type (success, failure, cancelled, vehicle_updated)
   * @param {Object} data - Event data
   * @returns {Object} - Formatted notification payload
   */
  formatEWayBillNotification(event, data) {
    const { voucherId, voucherNumber, ewbNumber, validUntil, errorMessage, vehicleNumber } = data;

    switch (event) {
      case 'success':
        return {
          type: NOTIFICATION_TYPES.E_WAY_BILL,
          title: 'E-Way Bill Generated',
          message: `E-Way Bill generated successfully for ${voucherNumber}. EWB: ${ewbNumber}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { ewbNumber, validUntil, event: 'generated' },
        };

      case 'failure':
        return {
          type: NOTIFICATION_TYPES.E_WAY_BILL,
          title: 'E-Way Bill Generation Failed',
          message: `Failed to generate e-way bill for ${voucherNumber}. ${errorMessage || 'Please try again.'}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { errorMessage, event: 'failed' },
        };

      case 'cancelled':
        return {
          type: NOTIFICATION_TYPES.E_WAY_BILL,
          title: 'E-Way Bill Cancelled',
          message: `E-Way Bill cancelled for ${voucherNumber}. EWB: ${ewbNumber}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { ewbNumber, event: 'cancelled' },
        };

      case 'vehicle_updated':
        return {
          type: NOTIFICATION_TYPES.E_WAY_BILL,
          title: 'Vehicle Details Updated',
          message: `Vehicle details updated for ${voucherNumber}. New vehicle: ${vehicleNumber}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { ewbNumber, vehicleNumber, event: 'vehicle_updated' },
        };

      default:
        return {
          type: NOTIFICATION_TYPES.E_WAY_BILL,
          title: 'E-Way Bill Update',
          message: `E-Way Bill status updated for ${voucherNumber}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { event },
        };
    }
  }

  /**
   * Format notification payload for TDS events
   * @param {string} event - Event type (calculated, updated)
   * @param {Object} data - Event data
   * @returns {Object} - Formatted notification payload
   */
  formatTDSNotification(event, data) {
    const { voucherId, voucherNumber, section, amount, rate } = data;

    switch (event) {
      case 'calculated':
        return {
          type: NOTIFICATION_TYPES.TDS,
          title: 'TDS Calculated',
          message: `TDS calculated for ${voucherNumber}. Section ${section}: ₹${amount.toFixed(2)} @ ${rate}%`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { section, amount, rate, event: 'calculated' },
        };

      case 'updated':
        return {
          type: NOTIFICATION_TYPES.TDS,
          title: 'TDS Updated',
          message: `TDS recalculated for ${voucherNumber}. New amount: ₹${amount.toFixed(2)}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { section, amount, rate, event: 'updated' },
        };

      default:
        return {
          type: NOTIFICATION_TYPES.TDS,
          title: 'TDS Update',
          message: `TDS status updated for ${voucherNumber}`,
          voucherId,
          voucherNumber,
          timestamp: new Date(),
          data: { event },
        };
    }
  }

  /**
   * Format notification payload for status change events
   * @param {Object} data - Event data
   * @returns {Object} - Formatted notification payload
   */
  formatStatusChangeNotification(data) {
    const { voucherId, voucherNumber, documentType, oldStatus, newStatus } = data;

    return {
      type: NOTIFICATION_TYPES.STATUS_CHANGE,
      title: `${documentType} Status Changed`,
      message: `${documentType} for ${voucherNumber} changed from ${oldStatus} to ${newStatus}`,
      voucherId,
      voucherNumber,
      timestamp: new Date(),
      data: { documentType, oldStatus, newStatus, event: 'status_changed' },
    };
  }

  /**
   * Determine display type based on notification type and data
   * @private
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {string} - Display type (success, error, warning, info)
   */
  _getDisplayType(type, data = {}) {
    const event = data.event;

    if (event === 'generated' || event === 'calculated' || event === 'vehicle_updated') {
      return 'success';
    }

    if (event === 'failed') {
      return 'error';
    }

    if (event === 'cancelled') {
      return 'warning';
    }

    return 'info';
  }

  /**
   * Persist notification to backend
   * @private
   * @param {Object} payload - Notification payload
   * @returns {Promise<void>}
   */
  async _persistNotification(payload) {
    try {
      // Backend expects specific format for notification storage
      await notificationAPI.list({
        type: payload.type,
        title: payload.title,
        message: payload.message,
        voucher_id: payload.voucherId,
        data: payload.data,
      });
    } catch (error) {
      // Silently fail - notification persistence is not critical
      console.warn('Failed to persist notification to backend:', error);
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
