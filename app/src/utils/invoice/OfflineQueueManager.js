/**
 * OfflineQueueManager - Manages operation queueing for offline scenarios
 * 
 * This module queues operations when the device is offline and processes them
 * when connectivity is restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

/**
 * Storage key for offline queue
 */
const OFFLINE_QUEUE_KEY = '@app/offline_queue';

/**
 * Operation types that can be queued
 */
export const OperationType = {
  E_INVOICE_GENERATE: 'E_INVOICE_GENERATE',
  E_WAY_BILL_GENERATE: 'E_WAY_BILL_GENERATE',
  TDS_CALCULATE: 'TDS_CALCULATE',
  CANCEL_DOCUMENT: 'CANCEL_DOCUMENT',
  UPDATE_VEHICLE: 'UPDATE_VEHICLE'
};

/**
 * Offline operation structure
 */
export class OfflineOperation {
  constructor({
    id = null,
    type,
    payload,
    voucherId,
    createdAt = new Date(),
    retryCount = 0,
    maxRetries = 3
  }) {
    this.id = id || this.generateId();
    this.type = type;
    this.payload = payload;
    this.voucherId = voucherId;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.retryCount = retryCount;
    this.maxRetries = maxRetries;
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      voucherId: this.voucherId,
      createdAt: this.createdAt.toISOString(),
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }

  static fromJSON(json) {
    return new OfflineOperation(json);
  }
}

/**
 * OfflineQueueManager - Manages offline operation queue
 */
export class OfflineQueueManager {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.listeners = [];
    this.initialized = false;
  }

  /**
   * Initialize the queue manager by loading persisted queue
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        const parsedQueue = JSON.parse(queueData);
        this.queue = parsedQueue.map(item => OfflineOperation.fromJSON(item));
        console.log(`Loaded ${this.queue.length} operations from offline queue`);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      this.queue = [];
      this.initialized = true;
    }
  }

  /**
   * Enqueue an operation
   * @param {OfflineOperation} operation - The operation to enqueue
   */
  async enqueue(operation) {
    await this.initialize();

    this.queue.push(operation);
    await this.persistQueue();
    this.notifyListeners('enqueued', operation);

    console.log(`Enqueued operation: ${operation.type} for voucher ${operation.voucherId}`);
  }

  /**
   * Process the queue
   * @param {Object} services - Service instances for executing operations
   * @returns {Promise<void>}
   */
  async processQueue(services = {}) {
    await this.initialize();

    if (this.processing || this.queue.length === 0) {
      return;
    }

    // Check network connectivity
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      console.log('Device is offline, skipping queue processing');
      return;
    }

    this.processing = true;
    console.log(`Processing offline queue with ${this.queue.length} operations`);

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        await this.executeOperation(operation, services);
        this.queue.shift(); // Remove successful operation
        await this.persistQueue();
        this.notifyListeners('processed', operation);
        console.log(`Successfully processed operation: ${operation.type}`);
      } catch (error) {
        console.error(`Failed to process operation: ${operation.type}`, error);

        if (operation.retryCount >= operation.maxRetries) {
          console.log(`Max retries reached for operation: ${operation.type}, removing from queue`);
          this.queue.shift(); // Remove failed operation after max retries
          await this.persistQueue();
          this.notifyListeners('failed', operation, error);
        } else {
          operation.retryCount++;
          await this.persistQueue();
          console.log(`Retry count increased to ${operation.retryCount} for operation: ${operation.type}`);
          break; // Stop processing on failure, will retry later
        }
      }
    }

    this.processing = false;
    console.log('Queue processing completed');
  }

  /**
   * Execute a single operation
   * @param {OfflineOperation} operation - The operation to execute
   * @param {Object} services - Service instances
   * @returns {Promise<any>}
   */
  async executeOperation(operation, services) {
    const { type, payload } = operation;

    switch (type) {
      case OperationType.E_INVOICE_GENERATE:
        if (!services.eInvoiceService) {
          throw new Error('eInvoiceService not provided');
        }
        return await services.eInvoiceService.generateEInvoice(payload);

      case OperationType.E_WAY_BILL_GENERATE:
        if (!services.eWayBillService) {
          throw new Error('eWayBillService not provided');
        }
        return await services.eWayBillService.generateEWayBill(payload);

      case OperationType.TDS_CALCULATE:
        if (!services.tdsService) {
          throw new Error('tdsService not provided');
        }
        return await services.tdsService.calculateTDS(payload);

      case OperationType.CANCEL_DOCUMENT:
        return await this.cancelDocument(payload, services);

      case OperationType.UPDATE_VEHICLE:
        if (!services.eWayBillService) {
          throw new Error('eWayBillService not provided');
        }
        return await services.eWayBillService.updateVehicleDetails(payload);

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Cancel a document (e-invoice or e-way bill)
   * @param {Object} payload - Cancellation payload
   * @param {Object} services - Service instances
   * @returns {Promise<any>}
   */
  async cancelDocument(payload, services) {
    const { documentType, ...cancelPayload } = payload;

    if (documentType === 'E_INVOICE') {
      if (!services.eInvoiceService) {
        throw new Error('eInvoiceService not provided');
      }
      return await services.eInvoiceService.cancelEInvoice(cancelPayload);
    } else if (documentType === 'E_WAY_BILL') {
      if (!services.eWayBillService) {
        throw new Error('eWayBillService not provided');
      }
      return await services.eWayBillService.cancelEWayBill(cancelPayload);
    } else {
      throw new Error(`Unknown document type: ${documentType}`);
    }
  }

  /**
   * Check network connectivity
   * @returns {Promise<boolean>}
   */
  async checkConnectivity() {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected && networkState.isInternetReachable;
    } catch (error) {
      console.error('Failed to check network connectivity:', error);
      return false;
    }
  }

  /**
   * Persist queue to AsyncStorage
   * @returns {Promise<void>}
   */
  async persistQueue() {
    try {
      const queueData = JSON.stringify(this.queue.map(op => op.toJSON()));
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, queueData);
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Clear the queue
   * @returns {Promise<void>}
   */
  async clearQueue() {
    this.queue = [];
    await this.persistQueue();
    this.notifyListeners('cleared');
    console.log('Offline queue cleared');
  }

  /**
   * Get queue size
   * @returns {number}
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Get all operations in the queue
   * @returns {OfflineOperation[]}
   */
  getQueue() {
    return [...this.queue];
  }

  /**
   * Remove a specific operation from the queue
   * @param {string} operationId - The operation ID to remove
   * @returns {Promise<boolean>}
   */
  async removeOperation(operationId) {
    const index = this.queue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      const operation = this.queue[index];
      this.queue.splice(index, 1);
      await this.persistQueue();
      this.notifyListeners('removed', operation);
      console.log(`Removed operation: ${operationId}`);
      return true;
    }
    return false;
  }

  /**
   * Add a listener for queue events
   * @param {Function} listener - Callback function (event, operation, error)
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   * @param {Function} listener - The listener to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event type
   * @param {OfflineOperation} operation - The operation
   * @param {Error} error - Optional error
   */
  notifyListeners(event, operation = null, error = null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, operation, error);
      } catch (err) {
        console.error('Error in queue listener:', err);
      }
    });
  }
}

// Singleton instance
let instance = null;

/**
 * Get the singleton instance of OfflineQueueManager
 * @returns {OfflineQueueManager}
 */
export function getOfflineQueueManager() {
  if (!instance) {
    instance = new OfflineQueueManager();
  }
  return instance;
}

export default OfflineQueueManager;
