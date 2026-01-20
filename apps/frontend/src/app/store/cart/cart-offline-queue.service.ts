import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import {
  OfflineQueueItem,
  QueueStatus,
  CartOperationType,
  OfflineQueuePayload,
  QueueStatistics,
  SyncResult,
  SyncError,
  QueueConfig
} from '../../shared/interfaces/sync-queue.interface';

/**
 * Cart Offline Queue Service
 *
 * Manages offline cart operations using IndexedDB for persistence.
 * Implements exponential backoff retry strategy and automatic sync on reconnect.
 *
 * Features:
 * - IndexedDB persistence for offline operations
 * - FIFO queue processing
 * - Exponential backoff retry (1s → 2s → 4s → 8s → 16s, max 5 retries)
 * - Idempotency key support to prevent duplicates
 * - Queue size monitoring and storage quota checks
 * - Real-time queue statistics
 *
 * Usage:
 * ```typescript
 * // Enqueue operation when offline
 * await queueService.enqueue('ADD', { productId: 'abc', quantity: 1 });
 *
 * // Process queue on reconnect
 * const result = await queueService.processQueue();
 * console.log(`Synced ${result.syncedCount} operations`);
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     CartOfflineQueueService:
 *       type: object
 *       description: Service for managing offline cart operations with IndexedDB
 */
@Injectable({ providedIn: 'root' })
export class CartOfflineQueueService {
  /** IndexedDB database instance */
  private db: IDBDatabase | null = null;

  /** Queue configuration */
  private config: QueueConfig = {
    maxRetries: 5,
    baseRetryDelay: 1000, // 1 second
    maxRetryDelay: 16000, // 16 seconds
    dbName: 'souqsyria_offline_queue',
    storeName: 'cart_operations',
    maxQueueSize: 1000,
    autoProcessOnReconnect: true
  };

  /** Queue size observable */
  private queueSizeSubject = new BehaviorSubject<number>(0);
  public queueSize$: Observable<number> = this.queueSizeSubject.asObservable();

  /** Queue statistics observable */
  private statsSubject = new BehaviorSubject<QueueStatistics>({
    totalItems: 0,
    pendingCount: 0,
    syncingCount: 0,
    syncedCount: 0,
    failedCount: 0
  });
  public stats$: Observable<QueueStatistics> = this.statsSubject.asObservable();

  /** Processing flag to prevent concurrent sync */
  private isProcessing = false;

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB Database
   *
   * Creates database and object store for queue persistence.
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, 1);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        this.updateStatistics(); // Load initial stats
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;

        // Create object store with auto-incrementing key
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const objectStore = db.createObjectStore(this.config.storeName, {
            keyPath: 'id'
          });

          // Create indexes for efficient querying
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('operation', 'operation', { unique: false });
          objectStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        }
      };
    });
  }

  /**
   * Enqueue Cart Operation
   *
   * Adds a cart operation to the offline queue for later sync.
   *
   * @param operation - Type of cart operation (ADD, UPDATE, REMOVE, SYNC, MERGE)
   * @param payload - Operation-specific data
   * @returns Queue item ID
   */
  async enqueue(
    operation: CartOperationType,
    payload: OfflineQueuePayload
  ): Promise<string> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    // Check queue size limit
    const stats = await this.getStatistics();
    if (stats.totalItems >= this.config.maxQueueSize) {
      throw new Error('Queue size limit exceeded. Clear old operations first.');
    }

    // Check storage quota
    await this.checkStorageQuota();

    // Create queue item
    const queueItem: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      payload,
      timestamp: new Date(),
      retryCount: 0,
      status: 'PENDING',
      idempotencyKey: this.generateIdempotencyKey(operation, payload)
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);

      const request = store.add(queueItem);

      request.onsuccess = () => {
        console.log(`Queued ${operation} operation:`, queueItem.id);
        this.updateStatistics();
        resolve(queueItem.id);
      };

      request.onerror = () => {
        // Check if duplicate idempotency key
        if (request.error?.name === 'ConstraintError') {
          console.warn('Operation already queued (duplicate idempotency key)');
          resolve(queueItem.id);
        } else {
          console.error('Failed to enqueue operation:', request.error);
          reject(request.error);
        }
      };
    });
  }

  /**
   * Process Queue
   *
   * Processes all pending operations in FIFO order with exponential backoff retry.
   * Called automatically on connectivity restoration.
   *
   * @returns Sync result with success/failure counts
   */
  async processQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        failedItems: [],
        errors: [],
        duration: 0
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      failedItems: [],
      errors: [],
      duration: 0
    };

    try {
      // Get all pending and failed items (sorted by timestamp - FIFO)
      const queueItems = await this.getQueueItems(['PENDING', 'FAILED']);

      console.log(`Processing ${queueItems.length} queued operations...`);

      // Process each item sequentially
      for (const item of queueItems) {
        try {
          // Check if retry delay has passed
          if (item.nextRetryAt && new Date() < item.nextRetryAt) {
            console.log(`Skipping ${item.id} - retry delay not expired`);
            continue;
          }

          // Mark as syncing
          await this.updateItemStatus(item.id, 'SYNCING');

          // Simulate sync operation (replace with actual CartSyncService call)
          await this.syncOperation(item);

          // Mark as synced and remove from queue
          await this.removeItem(item.id);
          result.syncedCount++;

          console.log(`Successfully synced ${item.operation} operation:`, item.id);
        } catch (error: any) {
          // Increment retry count
          const retryCount = item.retryCount + 1;

          if (retryCount >= this.config.maxRetries) {
            // Max retries exceeded - mark as failed
            await this.updateItemStatus(item.id, 'FAILED', error.message);
            result.failedCount++;
            result.failedItems.push(item.id);
            result.errors.push({
              queueItemId: item.id,
              message: error.message,
              statusCode: error.status,
              isRetryable: false
            });

            console.error(`Max retries exceeded for ${item.id}:`, error);
          } else {
            // Calculate exponential backoff delay
            const delay = Math.min(
              this.config.baseRetryDelay * Math.pow(2, retryCount),
              this.config.maxRetryDelay
            );
            const nextRetryAt = new Date(Date.now() + delay);

            // Update item with retry info
            await this.updateItemForRetry(item.id, retryCount, nextRetryAt, error.message);

            console.warn(
              `Sync failed for ${item.id}. Retry ${retryCount}/${this.config.maxRetries} in ${delay}ms`
            );
          }
        }
      }

      result.success = result.failedCount === 0;
    } catch (error: any) {
      console.error('Queue processing error:', error);
      result.success = false;
    } finally {
      this.isProcessing = false;
      result.duration = Date.now() - startTime;
      this.updateStatistics();
    }

    console.log(`Queue processing complete. Synced: ${result.syncedCount}, Failed: ${result.failedCount}`);
    return result;
  }

  /**
   * Process Queue on Reconnect
   *
   * Automatically triggered when connectivity is restored.
   */
  async processQueueOnReconnect(): Promise<void> {
    if (!this.config.autoProcessOnReconnect) {
      return;
    }

    console.log('Connectivity restored - processing offline queue...');
    await this.processQueue();
  }

  /**
   * Retry Failed Operations
   *
   * Attempts to retry all failed operations immediately.
   */
  async retryFailed(): Promise<SyncResult> {
    const failedItems = await this.getQueueItems(['FAILED']);

    // Reset failed items to pending
    for (const item of failedItems) {
      await this.updateItemStatus(item.id, 'PENDING');
    }

    return this.processQueue();
  }

  /**
   * Get Queue Items
   *
   * Retrieves queue items by status(es), sorted by timestamp (FIFO).
   *
   * @param statuses - Array of statuses to filter by
   * @returns Array of queue items
   */
  private async getQueueItems(statuses: QueueStatus[]): Promise<OfflineQueueItem[]> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('timestamp');

      const request = index.openCursor();
      const items: OfflineQueueItem[] = [];

      request.onsuccess = (event: any) => {
        const cursor = event.target.result as IDBCursorWithValue;

        if (cursor) {
          const item = cursor.value as OfflineQueueItem;
          if (statuses.includes(item.status)) {
            items.push(item);
          }
          cursor.continue();
        } else {
          resolve(items);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Update Item Status
   *
   * Updates the status of a queue item.
   */
  private async updateItemStatus(
    itemId: string,
    status: QueueStatus,
    errorMessage?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);

      const getRequest = store.get(itemId);

      getRequest.onsuccess = () => {
        const item = getRequest.result as OfflineQueueItem;
        if (item) {
          item.status = status;
          if (errorMessage) {
            item.errorMessage = errorMessage;
          }

          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error(`Queue item ${itemId} not found`));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Update Item for Retry
   *
   * Updates item with retry count and next retry time.
   */
  private async updateItemForRetry(
    itemId: string,
    retryCount: number,
    nextRetryAt: Date,
    errorMessage: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);

      const getRequest = store.get(itemId);

      getRequest.onsuccess = () => {
        const item = getRequest.result as OfflineQueueItem;
        if (item) {
          item.retryCount = retryCount;
          item.nextRetryAt = nextRetryAt;
          item.errorMessage = errorMessage;
          item.status = 'PENDING';

          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error(`Queue item ${itemId} not found`));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove Item from Queue
   *
   * Deletes a successfully synced item from the queue.
   */
  private async removeItem(itemId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);

      const request = store.delete(itemId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear Queue
   *
   * Removes all items from the queue (use with caution).
   */
  async clearQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);

      const request = store.clear();

      request.onsuccess = () => {
        console.log('Queue cleared');
        this.updateStatistics();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get Queue Statistics
   *
   * Returns current queue statistics.
   */
  async getStatistics(): Promise<QueueStatistics> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);

      const request = store.openCursor();

      const stats: QueueStatistics = {
        totalItems: 0,
        pendingCount: 0,
        syncingCount: 0,
        syncedCount: 0,
        failedCount: 0
      };

      request.onsuccess = (event: any) => {
        const cursor = event.target.result as IDBCursorWithValue;

        if (cursor) {
          const item = cursor.value as OfflineQueueItem;
          stats.totalItems++;

          switch (item.status) {
            case 'PENDING':
              stats.pendingCount++;
              break;
            case 'SYNCING':
              stats.syncingCount++;
              break;
            case 'SYNCED':
              stats.syncedCount++;
              break;
            case 'FAILED':
              stats.failedCount++;
              break;
          }

          // Track oldest item
          if (!stats.oldestItemTimestamp || item.timestamp < stats.oldestItemTimestamp) {
            stats.oldestItemTimestamp = item.timestamp;
          }

          cursor.continue();
        } else {
          resolve(stats);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update Statistics
   *
   * Refreshes queue statistics and emits to subscribers.
   */
  private async updateStatistics(): Promise<void> {
    try {
      const stats = await this.getStatistics();
      this.statsSubject.next(stats);
      this.queueSizeSubject.next(stats.pendingCount + stats.syncingCount);
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  /**
   * Check Storage Quota
   *
   * Checks IndexedDB storage quota and warns if nearly full.
   */
  private async checkStorageQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usagePercent = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

      if (usagePercent > 80) {
        console.warn(
          `IndexedDB storage ${usagePercent.toFixed(1)}% full. Consider clearing old synced operations.`
        );
      }
    }
  }

  /**
   * Generate Idempotency Key
   *
   * Creates a unique key to prevent duplicate operations.
   */
  private generateIdempotencyKey(operation: CartOperationType, payload: OfflineQueuePayload): string {
    const data = JSON.stringify({ operation, ...payload });
    return `${operation}_${this.hashCode(data)}`;
  }

  /**
   * Hash Code Utility
   *
   * Simple string hash for idempotency keys.
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Sync Operation (Placeholder)
   *
   * Executes the actual sync operation via CartSyncService.
   * This should be replaced with actual HTTP calls in production.
   *
   * @param item - Queue item to sync
   */
  private async syncOperation(item: OfflineQueueItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, this should call CartSyncService methods:
    // - ADD → cartSyncService.addToCart()
    // - UPDATE → cartSyncService.updateCartItem()
    // - REMOVE → cartSyncService.removeFromCart()
    // - SYNC → cartSyncService.syncCart()
    // - MERGE → cartSyncService.mergeGuestCart()

    console.log(`Syncing ${item.operation} operation:`, item.payload);

    // For now, just simulate success
    // In production, this would throw errors that trigger retry logic
  }
}
