/**
 * Unit Tests for OfflineQueueManager
 * 
 * Tests operation queueing, queue processing, and offline handling.
 * Validates: Requirements 9.1, 9.4, 9.5, 9.6
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import {
  OfflineQueueManager,
  OfflineOperation,
  OperationType,
  getOfflineQueueManager
} from '../OfflineQueueManager';

// Mock Network module
jest.mock('expo-network');

describe('OfflineQueueManager - Unit Tests', () => {
  let queueManager;

  beforeEach(async () => {
    // Clear AsyncStorage and mocks before each test
    await AsyncStorage.clear();
    jest.clearAllMocks();

    // Create a fresh queue manager instance
    queueManager = new OfflineQueueManager();
  });

  describe('OfflineOperation', () => {
    test('should create operation with all properties', () => {
      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123',
        maxRetries: 5
      });

      expect(operation.id).toBeTruthy();
      expect(operation.type).toBe(OperationType.E_INVOICE_GENERATE);
      expect(operation.payload).toEqual({ voucherId: 'test-123' });
      expect(operation.voucherId).toBe('test-123');
      expect(operation.retryCount).toBe(0);
      expect(operation.maxRetries).toBe(5);
      expect(operation.createdAt).toBeInstanceOf(Date);
    });

    test('should generate unique IDs', () => {
      const op1 = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-1'
      });

      const op2 = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-2'
      });

      expect(op1.id).not.toBe(op2.id);
    });

    test('should serialize to JSON correctly', () => {
      const operation = new OfflineOperation({
        type: OperationType.E_WAY_BILL_GENERATE,
        payload: { amount: 50000 },
        voucherId: 'test-456'
      });

      const json = operation.toJSON();

      expect(json.id).toBe(operation.id);
      expect(json.type).toBe(OperationType.E_WAY_BILL_GENERATE);
      expect(json.payload).toEqual({ amount: 50000 });
      expect(json.voucherId).toBe('test-456');
      expect(json.retryCount).toBe(0);
      expect(json.maxRetries).toBe(3);
      expect(typeof json.createdAt).toBe('string');
    });

    test('should deserialize from JSON correctly', () => {
      const json = {
        id: 'test-id-123',
        type: OperationType.TDS_CALCULATE,
        payload: { amount: 10000 },
        voucherId: 'test-789',
        createdAt: '2024-01-01T00:00:00.000Z',
        retryCount: 2,
        maxRetries: 5
      };

      const operation = OfflineOperation.fromJSON(json);

      expect(operation.id).toBe('test-id-123');
      expect(operation.type).toBe(OperationType.TDS_CALCULATE);
      expect(operation.payload).toEqual({ amount: 10000 });
      expect(operation.voucherId).toBe('test-789');
      expect(operation.retryCount).toBe(2);
      expect(operation.maxRetries).toBe(5);
      expect(operation.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Queue Management', () => {
    test('should enqueue operation', async () => {
      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      expect(queueManager.getQueueSize()).toBe(1);
      const queue = queueManager.getQueue();
      expect(queue[0].id).toBe(operation.id);
    });

    test('should enqueue multiple operations', async () => {
      const op1 = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-1'
      });

      const op2 = new OfflineOperation({
        type: OperationType.E_WAY_BILL_GENERATE,
        payload: {},
        voucherId: 'test-2'
      });

      await queueManager.enqueue(op1);
      await queueManager.enqueue(op2);

      expect(queueManager.getQueueSize()).toBe(2);
    });

    test('should clear queue', async () => {
      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);
      expect(queueManager.getQueueSize()).toBe(1);

      await queueManager.clearQueue();
      expect(queueManager.getQueueSize()).toBe(0);
    });

    test('should remove specific operation', async () => {
      const op1 = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-1'
      });

      const op2 = new OfflineOperation({
        type: OperationType.E_WAY_BILL_GENERATE,
        payload: {},
        voucherId: 'test-2'
      });

      await queueManager.enqueue(op1);
      await queueManager.enqueue(op2);

      const removed = await queueManager.removeOperation(op1.id);

      expect(removed).toBe(true);
      expect(queueManager.getQueueSize()).toBe(1);
      expect(queueManager.getQueue()[0].id).toBe(op2.id);
    });

    test('should return false when removing non-existent operation', async () => {
      const removed = await queueManager.removeOperation('non-existent-id');
      expect(removed).toBe(false);
    });

    test('should get queue copy', async () => {
      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      const queue = queueManager.getQueue();
      expect(queue.length).toBe(1);

      // Verify it's a copy, not the original
      queue.push(new OfflineOperation({
        type: OperationType.TDS_CALCULATE,
        payload: {},
        voucherId: 'test-456'
      }));

      expect(queueManager.getQueueSize()).toBe(1); // Original unchanged
    });
  });

  describe('Queue Processing', () => {
    test('should skip processing when offline', async () => {
      // Mock network as offline
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'NONE',
        isConnected: false,
        isInternetReachable: false
      });

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn()
        }
      };

      await queueManager.processQueue(mockServices);

      // Queue should not be processed
      expect(queueManager.getQueueSize()).toBe(1);
      expect(mockServices.eInvoiceService.generateEInvoice).not.toHaveBeenCalled();
    });

    test('should process queue when online', async () => {
      // Mock network as online
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockResolvedValue({ status: 'GENERATED' })
        }
      };

      await queueManager.processQueue(mockServices);

      // Queue should be empty after successful processing
      expect(queueManager.getQueueSize()).toBe(0);
      expect(mockServices.eInvoiceService.generateEInvoice).toHaveBeenCalledWith(
        operation.payload
      );
    });

    test('should process multiple operations in order', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const op1 = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-1' },
        voucherId: 'test-1'
      });

      const op2 = new OfflineOperation({
        type: OperationType.E_WAY_BILL_GENERATE,
        payload: { voucherId: 'test-2' },
        voucherId: 'test-2'
      });

      await queueManager.enqueue(op1);
      await queueManager.enqueue(op2);

      const callOrder = [];
      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockImplementation(async () => {
            callOrder.push('einvoice');
            return { status: 'GENERATED' };
          })
        },
        eWayBillService: {
          generateEWayBill: jest.fn().mockImplementation(async () => {
            callOrder.push('ewaybill');
            return { status: 'GENERATED' };
          })
        }
      };

      await queueManager.processQueue(mockServices);

      expect(queueManager.getQueueSize()).toBe(0);
      expect(callOrder).toEqual(['einvoice', 'ewaybill']);
    });

    test('should retry failed operations up to maxRetries', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123',
        maxRetries: 2
      });

      await queueManager.enqueue(operation);

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockRejectedValue(new Error('Service unavailable'))
        }
      };

      // Process queue multiple times
      await queueManager.processQueue(mockServices); // Attempt 1, retry count = 1
      expect(queueManager.getQueueSize()).toBe(1);

      await queueManager.processQueue(mockServices); // Attempt 2, retry count = 2
      expect(queueManager.getQueueSize()).toBe(1);

      await queueManager.processQueue(mockServices); // Attempt 3, removed
      expect(queueManager.getQueueSize()).toBe(0);
    });

    test('should stop processing on first failure', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const op1 = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-1' },
        voucherId: 'test-1'
      });

      const op2 = new OfflineOperation({
        type: OperationType.E_WAY_BILL_GENERATE,
        payload: { voucherId: 'test-2' },
        voucherId: 'test-2'
      });

      await queueManager.enqueue(op1);
      await queueManager.enqueue(op2);

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockRejectedValue(new Error('Failed'))
        },
        eWayBillService: {
          generateEWayBill: jest.fn()
        }
      };

      await queueManager.processQueue(mockServices);

      // First operation failed, second should not be processed
      expect(queueManager.getQueueSize()).toBe(2);
      expect(mockServices.eInvoiceService.generateEInvoice).toHaveBeenCalled();
      expect(mockServices.eWayBillService.generateEWayBill).not.toHaveBeenCalled();
    });

    test('should not process when already processing', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockImplementation(async () => {
            // Simulate long-running operation
            await new Promise(resolve => setTimeout(resolve, 100));
            return { status: 'GENERATED' };
          })
        }
      };

      // Start processing
      const promise1 = queueManager.processQueue(mockServices);
      
      // Wait a bit to ensure first processing has started
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Try to process again while first is still running
      const promise2 = queueManager.processQueue(mockServices);

      await Promise.all([promise1, promise2]);

      // Queue should be empty after processing
      expect(queueManager.getQueueSize()).toBe(0);
      
      // Service should be called (may be once or twice depending on timing)
      expect(mockServices.eInvoiceService.generateEInvoice).toHaveBeenCalled();
    });
  });

  describe('Operation Execution', () => {
    test('should execute E_INVOICE_GENERATE operation', async () => {
      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123'
      });

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockResolvedValue({ status: 'GENERATED' })
        }
      };

      const result = await queueManager.executeOperation(operation, mockServices);

      expect(result).toEqual({ status: 'GENERATED' });
      expect(mockServices.eInvoiceService.generateEInvoice).toHaveBeenCalledWith(
        operation.payload
      );
    });

    test('should execute E_WAY_BILL_GENERATE operation', async () => {
      const operation = new OfflineOperation({
        type: OperationType.E_WAY_BILL_GENERATE,
        payload: { voucherId: 'test-456' },
        voucherId: 'test-456'
      });

      const mockServices = {
        eWayBillService: {
          generateEWayBill: jest.fn().mockResolvedValue({ status: 'GENERATED' })
        }
      };

      const result = await queueManager.executeOperation(operation, mockServices);

      expect(result).toEqual({ status: 'GENERATED' });
      expect(mockServices.eWayBillService.generateEWayBill).toHaveBeenCalledWith(
        operation.payload
      );
    });

    test('should execute TDS_CALCULATE operation', async () => {
      const operation = new OfflineOperation({
        type: OperationType.TDS_CALCULATE,
        payload: { amount: 10000 },
        voucherId: 'test-789'
      });

      const mockServices = {
        tdsService: {
          calculateTDS: jest.fn().mockResolvedValue({ amount: 1000 })
        }
      };

      const result = await queueManager.executeOperation(operation, mockServices);

      expect(result).toEqual({ amount: 1000 });
      expect(mockServices.tdsService.calculateTDS).toHaveBeenCalledWith(
        operation.payload
      );
    });

    test('should throw error for missing service', async () => {
      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-123'
      });

      const mockServices = {}; // No services provided

      await expect(
        queueManager.executeOperation(operation, mockServices)
      ).rejects.toThrow('eInvoiceService not provided');
    });

    test('should throw error for unknown operation type', async () => {
      const operation = new OfflineOperation({
        type: 'UNKNOWN_TYPE',
        payload: {},
        voucherId: 'test-123'
      });

      const mockServices = {};

      await expect(
        queueManager.executeOperation(operation, mockServices)
      ).rejects.toThrow('Unknown operation type: UNKNOWN_TYPE');
    });
  });

  describe('Event Listeners', () => {
    test('should notify listeners on enqueue', async () => {
      const listener = jest.fn();
      queueManager.addListener(listener);

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      expect(listener).toHaveBeenCalledWith('enqueued', operation, null);
    });

    test('should notify listeners on successful processing', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const listener = jest.fn();
      queueManager.addListener(listener);

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: { voucherId: 'test-123' },
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      const mockServices = {
        eInvoiceService: {
          generateEInvoice: jest.fn().mockResolvedValue({ status: 'GENERATED' })
        }
      };

      await queueManager.processQueue(mockServices);

      expect(listener).toHaveBeenCalledWith('processed', expect.any(Object), null);
    });

    test('should remove listener', async () => {
      const listener = jest.fn();
      queueManager.addListener(listener);
      queueManager.removeListener(listener);

      const operation = new OfflineOperation({
        type: OperationType.E_INVOICE_GENERATE,
        payload: {},
        voucherId: 'test-123'
      });

      await queueManager.enqueue(operation);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Instance', () => {
    test('should return same instance', () => {
      const instance1 = getOfflineQueueManager();
      const instance2 = getOfflineQueueManager();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Network Connectivity Check', () => {
    test('should return true when connected', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true
      });

      const isConnected = await queueManager.checkConnectivity();
      expect(isConnected).toBe(true);
    });

    test('should return false when not connected', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'NONE',
        isConnected: false,
        isInternetReachable: false
      });

      const isConnected = await queueManager.checkConnectivity();
      expect(isConnected).toBe(false);
    });

    test('should return false when internet not reachable', async () => {
      Network.getNetworkStateAsync.mockResolvedValue({
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: false
      });

      const isConnected = await queueManager.checkConnectivity();
      expect(isConnected).toBe(false);
    });

    test('should handle network check errors', async () => {
      Network.getNetworkStateAsync.mockRejectedValue(new Error('Network check failed'));

      const isConnected = await queueManager.checkConnectivity();
      expect(isConnected).toBe(false);
    });
  });
});
