/**
 * Unit Tests for NotificationService
 * Feature: mobile-invoice-system-enhancement
 */

import NotificationService, { NOTIFICATION_TYPES } from '../NotificationService';
import * as Notifications from 'expo-notifications';
import { 
  showGlobalSuccess, 
  showGlobalError, 
  showGlobalWarning, 
  showGlobalInfo 
} from '../../globalNotificationService';
import { notificationAPI } from '../../../lib/api';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('../../globalNotificationService');
jest.mock('../../../lib/api');

describe('NotificationService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock expo-notifications
    Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');
    
    // Mock notificationAPI
    notificationAPI.list.mockResolvedValue({ data: { data: [] } });
  });

  describe('sendNotification', () => {
    test('should send e-invoice success notification', async () => {
      const payload = {
        type: NOTIFICATION_TYPES.E_INVOICE,
        title: 'E-Invoice Generated',
        message: 'E-Invoice generated successfully',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: { irn: 'TEST-IRN', event: 'generated' },
      };

      await NotificationService.sendNotification(payload);

      // Verify global notification was shown
      expect(showGlobalSuccess).toHaveBeenCalledWith('E-Invoice Generated', 'E-Invoice generated successfully');

      // Verify push notification was scheduled
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'E-Invoice Generated',
            body: 'E-Invoice generated successfully',
            data: expect.objectContaining({
              type: NOTIFICATION_TYPES.E_INVOICE,
              voucherId: 'voucher-123',
              voucherNumber: 'INV-001',
            }),
          }),
          trigger: null,
        })
      );
    });

    test('should send e-invoice failure notification', async () => {
      const payload = {
        type: NOTIFICATION_TYPES.E_INVOICE,
        title: 'E-Invoice Generation Failed',
        message: 'Failed to generate e-invoice',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: { errorMessage: 'Network error', event: 'failed' },
      };

      await NotificationService.sendNotification(payload);

      // Verify error notification was shown
      expect(showGlobalError).toHaveBeenCalledWith('E-Invoice Generation Failed', 'Failed to generate e-invoice');
    });

    test('should send e-way bill success notification', async () => {
      const payload = {
        type: NOTIFICATION_TYPES.E_WAY_BILL,
        title: 'E-Way Bill Generated',
        message: 'E-Way Bill generated successfully',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: { ewbNumber: 'EWB-123', event: 'generated' },
      };

      await NotificationService.sendNotification(payload);

      expect(showGlobalSuccess).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    test('should send TDS calculation notification', async () => {
      const payload = {
        type: NOTIFICATION_TYPES.TDS,
        title: 'TDS Calculated',
        message: 'TDS calculated successfully',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: { section: '194C', amount: 1000, rate: 1, event: 'calculated' },
      };

      await NotificationService.sendNotification(payload);

      expect(showGlobalSuccess).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    test('should send status change notification', async () => {
      const payload = {
        type: NOTIFICATION_TYPES.STATUS_CHANGE,
        title: 'Status Changed',
        message: 'Document status changed',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: { event: 'status_changed' },
      };

      await NotificationService.sendNotification(payload);

      expect(showGlobalInfo).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    test('should handle push notification failure gracefully', async () => {
      Notifications.scheduleNotificationAsync.mockRejectedValue(new Error('Push notification failed'));

      const payload = {
        type: NOTIFICATION_TYPES.E_INVOICE,
        title: 'Test',
        message: 'Test message',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: {},
      };

      // Should not throw error
      await expect(NotificationService.sendNotification(payload)).resolves.not.toThrow();

      // Global notification should still be shown
      expect(showGlobalInfo).toHaveBeenCalled();
    });

    test('should handle backend persistence failure gracefully', async () => {
      notificationAPI.list.mockRejectedValue(new Error('Backend error'));

      const payload = {
        type: NOTIFICATION_TYPES.E_INVOICE,
        title: 'Test',
        message: 'Test message',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: {},
      };

      // Should not throw error
      await expect(NotificationService.sendNotification(payload)).resolves.not.toThrow();
    });
  });

  describe('scheduleNotification', () => {
    test('should schedule notification with delay', async () => {
      const payload = {
        type: NOTIFICATION_TYPES.E_INVOICE,
        title: 'Scheduled Notification',
        message: 'This is a scheduled notification',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: {},
      };

      const delay = 5000; // 5 seconds

      const notificationId = await NotificationService.scheduleNotification(payload, delay);

      expect(notificationId).toBe('notification-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Scheduled Notification',
            body: 'This is a scheduled notification',
          }),
          trigger: {
            seconds: 5,
          },
        })
      );
    });

    test('should throw error when scheduling fails', async () => {
      Notifications.scheduleNotificationAsync.mockRejectedValue(new Error('Scheduling failed'));

      const payload = {
        type: NOTIFICATION_TYPES.E_INVOICE,
        title: 'Test',
        message: 'Test message',
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        timestamp: new Date(),
        data: {},
      };

      await expect(NotificationService.scheduleNotification(payload, 1000)).rejects.toThrow('Scheduling failed');
    });
  });

  describe('getNotificationHistory', () => {
    test('should retrieve notification history successfully', async () => {
      const mockHistory = [
        {
          id: '1',
          type: NOTIFICATION_TYPES.E_INVOICE,
          title: 'E-Invoice Generated',
          message: 'Test message',
          voucher_id: 'voucher-123',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: NOTIFICATION_TYPES.E_WAY_BILL,
          title: 'E-Way Bill Generated',
          message: 'Test message 2',
          voucher_id: 'voucher-123',
          created_at: new Date().toISOString(),
        },
      ];

      notificationAPI.list.mockResolvedValue({ data: { data: mockHistory } });

      const history = await NotificationService.getNotificationHistory('voucher-123');

      expect(notificationAPI.list).toHaveBeenCalledWith({ voucher_id: 'voucher-123' });
      expect(history).toEqual(mockHistory);
      expect(history).toHaveLength(2);
    });

    test('should return empty array when no history found', async () => {
      notificationAPI.list.mockResolvedValue({ data: { data: [] } });

      const history = await NotificationService.getNotificationHistory('voucher-123');

      expect(history).toEqual([]);
    });

    test('should return empty array when API call fails', async () => {
      notificationAPI.list.mockRejectedValue(new Error('API error'));

      const history = await NotificationService.getNotificationHistory('voucher-123');

      expect(history).toEqual([]);
    });

    test('should handle malformed response', async () => {
      notificationAPI.list.mockResolvedValue({ data: {} });

      const history = await NotificationService.getNotificationHistory('voucher-123');

      expect(history).toEqual([]);
    });
  });

  describe('formatEInvoiceNotification', () => {
    test('should format e-invoice success notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        irn: 'TEST-IRN-123',
        ackNo: 'ACK-456',
      };

      const notification = NotificationService.formatEInvoiceNotification('success', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.E_INVOICE);
      expect(notification.title).toBe('E-Invoice Generated');
      expect(notification.message).toContain('INV-001');
      expect(notification.message).toContain('TEST-IRN-123');
      expect(notification.data.irn).toBe('TEST-IRN-123');
      expect(notification.data.ackNo).toBe('ACK-456');
    });

    test('should format e-invoice failure notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        errorMessage: 'Network error occurred',
      };

      const notification = NotificationService.formatEInvoiceNotification('failure', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.E_INVOICE);
      expect(notification.title).toBe('E-Invoice Generation Failed');
      expect(notification.message).toContain('INV-001');
      expect(notification.message).toContain('Network error occurred');
    });

    test('should format e-invoice cancelled notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        irn: 'TEST-IRN-123',
      };

      const notification = NotificationService.formatEInvoiceNotification('cancelled', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.E_INVOICE);
      expect(notification.title).toBe('E-Invoice Cancelled');
      expect(notification.message).toContain('INV-001');
      expect(notification.message).toContain('TEST-IRN-123');
    });
  });

  describe('formatEWayBillNotification', () => {
    test('should format e-way bill success notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        ewbNumber: 'EWB-123456',
        validUntil: new Date(),
      };

      const notification = NotificationService.formatEWayBillNotification('success', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.E_WAY_BILL);
      expect(notification.title).toBe('E-Way Bill Generated');
      expect(notification.message).toContain('INV-001');
      expect(notification.message).toContain('EWB-123456');
    });

    test('should format e-way bill failure notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        errorMessage: 'Invalid vehicle number',
      };

      const notification = NotificationService.formatEWayBillNotification('failure', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.E_WAY_BILL);
      expect(notification.title).toBe('E-Way Bill Generation Failed');
      expect(notification.message).toContain('Invalid vehicle number');
    });

    test('should format vehicle update notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        ewbNumber: 'EWB-123456',
        vehicleNumber: 'MH12AB1234',
      };

      const notification = NotificationService.formatEWayBillNotification('vehicle_updated', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.E_WAY_BILL);
      expect(notification.title).toBe('Vehicle Details Updated');
      expect(notification.message).toContain('MH12AB1234');
    });
  });

  describe('formatTDSNotification', () => {
    test('should format TDS calculation notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        section: '194C',
        amount: 1000,
        rate: 1,
      };

      const notification = NotificationService.formatTDSNotification('calculated', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.TDS);
      expect(notification.title).toBe('TDS Calculated');
      expect(notification.message).toContain('INV-001');
      expect(notification.message).toContain('194C');
      expect(notification.message).toContain('1000.00');
    });

    test('should format TDS update notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        section: '194J',
        amount: 2000,
        rate: 10,
      };

      const notification = NotificationService.formatTDSNotification('updated', data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.TDS);
      expect(notification.title).toBe('TDS Updated');
      expect(notification.message).toContain('2000.00');
    });
  });

  describe('formatStatusChangeNotification', () => {
    test('should format status change notification', () => {
      const data = {
        voucherId: 'voucher-123',
        voucherNumber: 'INV-001',
        documentType: 'E-Invoice',
        oldStatus: 'PENDING',
        newStatus: 'GENERATED',
      };

      const notification = NotificationService.formatStatusChangeNotification(data);

      expect(notification.type).toBe(NOTIFICATION_TYPES.STATUS_CHANGE);
      expect(notification.title).toBe('E-Invoice Status Changed');
      expect(notification.message).toContain('INV-001');
      expect(notification.message).toContain('PENDING');
      expect(notification.message).toContain('GENERATED');
    });
  });
});
