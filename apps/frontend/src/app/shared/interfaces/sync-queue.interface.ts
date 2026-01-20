/**
 * Offline Sync Queue Interfaces
 *
 * Manages cart operations when offline, queuing them for sync when connection returns.
 * Implements exponential backoff retry strategy for failed sync operations.
 *
 * @swagger
 * components:
 *   schemas:
 *     OfflineQueueItem:
 *       type: object
 *       required:
 *         - id
 *         - operation
 *         - payload
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: Unique queue item identifier
 *         operation:
 *           type: string
 *           enum: [ADD, UPDATE, REMOVE, SYNC, MERGE]
 *           description: Type of cart operation
 *         payload:
 *           type: object
 *           description: Operation data (product ID, quantity, etc.)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When operation was queued
 *         retryCount:
 *           type: number
 *           description: Number of sync retry attempts
 *         status:
 *           type: string
 *           enum: [PENDING, SYNCING, SYNCED, FAILED]
 *           description: Current operation status
 */

/**
 * Queue status enum
 * Tracks the current state of a queued operation
 */
export type QueueStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

/**
 * Cart operation types
 * Defines the types of cart operations that can be queued
 */
export type CartOperationType = 'ADD' | 'UPDATE' | 'REMOVE' | 'SYNC' | 'MERGE';

/**
 * Offline Queue Item
 *
 * Represents a single cart operation queued for sync when offline.
 * Includes retry logic and status tracking.
 */
export interface OfflineQueueItem {
  /** Unique identifier for this queue item */
  id: string;

  /** Type of cart operation (add, update, remove, etc.) */
  operation: CartOperationType;

  /** Operation-specific data (product ID, quantity, cart data, etc.) */
  payload: OfflineQueuePayload;

  /** When this operation was queued */
  timestamp: Date;

  /** Number of times sync has been retried (max 5) */
  retryCount: number;

  /** Current status of this operation */
  status: QueueStatus;

  /** Last error message if sync failed */
  errorMessage?: string;

  /** Next retry time (for exponential backoff) */
  nextRetryAt?: Date;

  /** Idempotency key to prevent duplicate operations */
  idempotencyKey: string;
}

/**
 * Queue Payload for Different Operations
 *
 * Contains operation-specific data for cart operations
 */
export interface OfflineQueuePayload {
  /** Product ID (for ADD/REMOVE operations) */
  productId?: string;

  /** Cart item ID (for UPDATE/REMOVE operations) */
  cartItemId?: string;

  /** Quantity (for ADD/UPDATE operations) */
  quantity?: number;

  /** Full cart data (for SYNC operations) */
  cartData?: any;

  /** Session ID (for guest operations) */
  sessionId?: string;

  /** User ID (for authenticated operations) */
  userId?: string;

  /** Additional operation-specific data */
  metadata?: Record<string, any>;
}

/**
 * Queue Statistics
 *
 * Provides metrics about the offline queue state
 */
export interface QueueStatistics {
  /** Total number of queued operations */
  totalItems: number;

  /** Number of operations pending sync */
  pendingCount: number;

  /** Number of operations currently syncing */
  syncingCount: number;

  /** Number of successfully synced operations */
  syncedCount: number;

  /** Number of failed operations */
  failedCount: number;

  /** Oldest queued operation timestamp */
  oldestItemTimestamp?: Date;

  /** IndexedDB storage usage estimate */
  storageUsed?: number;
}

/**
 * Sync Result
 *
 * Result of a queue sync operation
 */
export interface SyncResult {
  /** Whether sync was successful */
  success: boolean;

  /** Number of items successfully synced */
  syncedCount: number;

  /** Number of items failed to sync */
  failedCount: number;

  /** List of failed queue item IDs */
  failedItems: string[];

  /** Error messages for failed items */
  errors: SyncError[];

  /** Sync duration in milliseconds */
  duration: number;
}

/**
 * Sync Error
 *
 * Error details for a failed sync operation
 */
export interface SyncError {
  /** Queue item ID that failed */
  queueItemId: string;

  /** Error message */
  message: string;

  /** HTTP status code if applicable */
  statusCode?: number;

  /** Whether retry is possible */
  isRetryable: boolean;
}

/**
 * Queue Configuration
 *
 * Configuration options for the offline queue service
 */
export interface QueueConfig {
  /** Maximum number of retry attempts (default: 5) */
  maxRetries: number;

  /** Base retry delay in milliseconds (default: 1000) */
  baseRetryDelay: number;

  /** Maximum retry delay in milliseconds (default: 16000) */
  maxRetryDelay: number;

  /** IndexedDB database name */
  dbName: string;

  /** IndexedDB object store name */
  storeName: string;

  /** Maximum queue size (default: 1000) */
  maxQueueSize: number;

  /** Auto-process queue on reconnect (default: true) */
  autoProcessOnReconnect: boolean;
}
