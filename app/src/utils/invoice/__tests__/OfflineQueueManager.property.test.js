/**
 * Property-Based Tests for OfflineQueueManager
 * 
 * Feature: mobile-invoice-system-enhancement
 * Property 24: Offline Operation Queueing
 * Validates: Requirements 9.6
 */

import fc from 'fast-check';
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

describe('Feature: mobile-invoice-system-enhancement - OfflineQueueManager Property Tests', () => {
  let queueManager;
  let storage;

  beforeEach(async () => {
    // Create a fresh storage object for each test
    storage = {};
    
    // Override AsyncStorage methods to use the fresh storage
    AsyncStorage.setItem = jest.fn((key, value) => {
      storage[key] = value;
      return Promise.resolve();
    });
    AsyncStorage.getItem = jest.fn((key) => {
      return Promise.resolve(storage[key] || null);
    });
    AsyncStorage.clear = jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
      return Promise.resolve();
    });

    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
    jest.clearAllMocks();

    // Create a fresh queue manager instance
    queueManager = new OfflineQueueManager();
  });

  /**
   * Property 24: Offline Operation Queueing
   * 
   * For any operation attempted while the app is offline, the system should 
   * display an offline indicator and queue the operation for retry when 
   * connectivity is restored.
   * 
   * Validates: Requirements 9.6
   */
  test('Property 24: Offline Operation Queueing - operations queued when offline', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          OperationType.E_INVOICE_GENERATE,
          OperationType.E_WAY_BILL_GENERATE,
          OperationType.TDS_CALCULATE,
          OperationType.CANCEL_DOCUMENT,
          OperationType.UPDATE_VEHICLE
        ),
        fc.record({
          voucherId: fc.string({ minLength: 1, maxLength: 50 }),
          amount: fc.float({ min: 0, max: 1000000 })
        }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (operationType, payload, voucherId) => {
          // Create an operation
          const operation = new OfflineOperation({
            type: operationType,
            payload,
            voucherId
          });

          // Enqueue the operation
          await queueManager.enqueue(operation);

          // Verify operation is in queue
          const queueSize = queueManager.getQueueSize();
          expect(queueSize).toBeGreaterThan(0);

          // Verify operation is persisted
          const storedQueue = await AsyncStorage.getItem('@app/offline_queue');
          expect(storedQueue).toBeTruthy();

          const parsedQueue = JSON.parse(storedQueue);
          expect(parsedQueue.length).toBeGreaterThan(0);

          // Verify operation details are preserved
          const storedOperation = parsedQueue.find(op => op.id === operation.id);
          expect(storedOperation).toBeTruthy();
          expect(storedOperation.type).toBe(operationType);
          expect(storedOperation.voucherId).toBe(voucherId);
        }
      ),
      { numRuns: 50 } // Reduced runs for async tests
    );
  });

  /**
   * Property: Queue Persistence Across Restarts
   * 
   * For any queued operations, they should be persisted and restored
   * when the queue manager is reinitialized.
   */
  test('Property: Queue Persistence Across Restarts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom(
              OperationType.E_INVOICE_GENERATE,
              OperationType.E_WAY_BILL_GENERATE,
              OperationType.TDS_CALCULATE
            ),
            voucherId: fc.string({ minLength: 1, maxLength: 50 }),
            payload: fc.record({
              amount: fc.float({ min: 0, max: 100000 })
            })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          // Clear storage at the start of each property test iteration
          // This ensures test isolation across property test runs
          Object.keys(storage).forEach(key => delete storage[key]);
          
          // Create a fresh queue manager for this iteration
          const freshQueueManager = new OfflineQueueManager();
          
          // Enqueue all operations
          for (const opData of operations) {
            const operation = new OfflineOperation({
              type: opData.type,
              payload: opData.payload,
              voucherId: opData.voucherId
            });
            await freshQueueManager.enqueue(operation);
          }

          const originalQueueSize = freshQueueManager.getQueueSize();
          expect(originalQueueSize).toBe(operations.length);

          // Create a new queue manager instance (simulating app restart)
          const newQueueManager = new OfflineQueueManager();
          await newQueueManager.initialize();

          // Verify queue is restored
          const restoredQueueSize = newQueueManager.getQueueSize();
          expect(restoredQueueSize).toBe(originalQueueSize);

          // Verify all operations are restored
          const restoredQueue = newQueueManager.getQueue();
          expect(restoredQueue.length).toBe(operations.length);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Queue Processing When Online
   * 
   * For any queued operations, when connectivity is restored, the queue
   * should be processed successfully.
   */
  test('Property: Queue Processing When Online', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom(
              OperationType.E_INVOICE_GENERATE,
              OperationType.E_WAY_BILL_GENERATE,
              OperationType.TDS_CALCULATE
            ),
            voucherId: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear storage at the start of each property test iteration
          // This ensures test isolation across property test runs
          Object.keys(storage).forEach(key => delete storage[key]);
          
          // Create a fresh queue manager for this iteration
          const freshQueueManager = new OfflineQueueManager();
          
          // Mock network as online
          Network.getNetworkStateAsync.mockResolvedValue({
            type: 'WIFI',
            isConnected: true,
            isInternetReachable: true
          });

          // Enqueue all operations
          for (const opData of operations) {
            const operation = new OfflineOperation({
              type: opData.type,
              payload: { voucherId: opData.voucherId },
              voucherId: opData.voucherId
            });
            await freshQueueManager.enqueue(operation);
          }

          const initialQueueSize = freshQueueManager.getQueueSize();
          expect(initialQueueSize).toBe(operations.length);

          // Mock services that always succeed
          const mockServices = {
            eInvoiceService: {
              generateEInvoice: jest.fn().mockResolvedValue({ status: 'GENERATED' })
            },
            eWayBillService: {
              generateEWayBill: jest.fn().mockResolvedValue({ status: 'GENERATED' })
            },
            tdsService: {
              calculateTDS: jest.fn().mockResolvedValue({ amount: 1000 })
            }
          };

          // Process the queue
          await freshQueueManager.processQueue(mockServices);

          // Verify queue is empty after successful processing
          const finalQueueSize = freshQueueManager.getQueueSize();
          expect(finalQueueSize).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Queue Processing Skipped When Offline
   * 
   * For any queued operations, when the device is offline, queue processing
   * should be skipped.
   */
  test('Property: Queue Processing Skipped When Offline', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom(
              OperationType.E_INVOICE_GENERATE,
              OperationType.E_WAY_BILL_GENERATE
            ),
            voucherId: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear storage at the start of each property test iteration
          // This ensures test isolation across property test runs
          Object.keys(storage).forEach(key => delete storage[key]);
          
          // Create a fresh queue manager for this iteration
          const freshQueueManager = new OfflineQueueManager();
          
          // Mock network as offline
          Network.getNetworkStateAsync.mockResolvedValue({
            type: 'NONE',
            isConnected: false,
            isInternetReachable: false
          });

          // Enqueue all operations
          for (const opData of operations) {
            const operation = new OfflineOperation({
              type: opData.type,
              payload: { voucherId: opData.voucherId },
              voucherId: opData.voucherId
            });
            await freshQueueManager.enqueue(operation);
          }

          const initialQueueSize = freshQueueManager.getQueueSize();
          expect(initialQueueSize).toBe(operations.length);

          // Mock services
          const mockServices = {
            eInvoiceService: {
              generateEInvoice: jest.fn().mockResolvedValue({ status: 'GENERATED' })
            },
            eWayBillService: {
              generateEWayBill: jest.fn().mockResolvedValue({ status: 'GENERATED' })
            }
          };

          // Attempt to process the queue
          await freshQueueManager.processQueue(mockServices);

          // Verify queue is NOT processed (still has operations)
          const finalQueueSize = freshQueueManager.getQueueSize();
          expect(finalQueueSize).toBe(initialQueueSize);

          // Verify services were not called
          expect(mockServices.eInvoiceService.generateEInvoice).not.toHaveBeenCalled();
          expect(mockServices.eWayBillService.generateEWayBill).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Failed Operations Retry Logic
   * 
   * For any operation that fails, it should be retried up to maxRetries times
   * before being removed from the queue.
   */
  test('Property: Failed Operations Retry Logic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // maxRetries
        fc.constantFrom(
          OperationType.E_INVOICE_GENERATE,
          OperationType.E_WAY_BILL_GENERATE
        ),
        async (maxRetries, operationType) => {
          // Mock network as online
          Network.getNetworkStateAsync.mockResolvedValue({
            type: 'WIFI',
            isConnected: true,
            isInternetReachable: true
          });

          // Create an operation with specific maxRetries
          const operation = new OfflineOperation({
            type: operationType,
            payload: { voucherId: 'test-voucher' },
            voucherId: 'test-voucher',
            maxRetries
          });

          await queueManager.enqueue(operation);

          // Mock service that always fails
          const mockServices = {
            eInvoiceService: {
              generateEInvoice: jest.fn().mockRejectedValue(new Error('Service unavailable'))
            },
            eWayBillService: {
              generateEWayBill: jest.fn().mockRejectedValue(new Error('Service unavailable'))
            }
          };

          // Process queue multiple times (more than maxRetries)
          for (let i = 0; i <= maxRetries + 1; i++) {
            await queueManager.processQueue(mockServices);
          }

          // Verify operation was removed after maxRetries
          const finalQueueSize = queueManager.getQueueSize();
          expect(finalQueueSize).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Operation ID Uniqueness
   * 
   * For any set of operations, each operation should have a unique ID.
   */
  test('Property: Operation ID Uniqueness', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom(
              OperationType.E_INVOICE_GENERATE,
              OperationType.E_WAY_BILL_GENERATE,
              OperationType.TDS_CALCULATE
            ),
            voucherId: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (operations) => {
          const createdOperations = operations.map(opData =>
            new OfflineOperation({
              type: opData.type,
              payload: {},
              voucherId: opData.voucherId
            })
          );

          // Extract all IDs
          const ids = createdOperations.map(op => op.id);

          // Verify all IDs are unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Queue Clear Removes All Operations
   * 
   * For any queue with operations, clearing the queue should remove all
   * operations and persist the empty state.
   */
  test('Property: Queue Clear Removes All Operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom(
              OperationType.E_INVOICE_GENERATE,
              OperationType.E_WAY_BILL_GENERATE
            ),
            voucherId: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          // Enqueue all operations
          for (const opData of operations) {
            const operation = new OfflineOperation({
              type: opData.type,
              payload: {},
              voucherId: opData.voucherId
            });
            await queueManager.enqueue(operation);
          }

          const initialQueueSize = queueManager.getQueueSize();
          expect(initialQueueSize).toBe(operations.length);

          // Clear the queue
          await queueManager.clearQueue();

          // Verify queue is empty
          const finalQueueSize = queueManager.getQueueSize();
          expect(finalQueueSize).toBe(0);

          // Verify empty state is persisted
          const storedQueue = await AsyncStorage.getItem('@app/offline_queue');
          expect(storedQueue).toBeTruthy();
          const parsedQueue = JSON.parse(storedQueue);
          expect(parsedQueue.length).toBe(0);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Singleton Instance Consistency
   * 
   * For any number of calls to getOfflineQueueManager, the same instance
   * should be returned.
   */
  test('Property: Singleton Instance Consistency', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (numCalls) => {
          const instances = [];
          for (let i = 0; i < numCalls; i++) {
            instances.push(getOfflineQueueManager());
          }

          // Verify all instances are the same
          for (let i = 1; i < instances.length; i++) {
            expect(instances[i]).toBe(instances[0]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
