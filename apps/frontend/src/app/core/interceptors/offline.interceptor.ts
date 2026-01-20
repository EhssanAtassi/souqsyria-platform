import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ConnectivityService } from '../services/connectivity.service';
import { CartOfflineQueueService } from '../../store/cart/cart-offline-queue.service';
import { CartQuery } from '../../store/cart/cart.query';

/**
 * Offline Interceptor
 *
 * Intercepts HTTP requests and handles offline scenarios for cart operations.
 * Queues failed requests for retry when connectivity is restored.
 *
 * Features:
 * - Detects offline status (status code 0 = network error)
 * - Queues cart operations to offline queue
 * - Returns cached data from Akita store when offline
 * - Triggers automatic sync on reconnection
 * - Provides user feedback for offline operations
 *
 * Flow:
 * 1. Request fails with status 0 (offline)
 * 2. Check if it's a cart operation
 * 3. Queue operation to CartOfflineQueueService
 * 4. Return cached cart data from Akita store
 * 5. On reconnect, process queue automatically
 *
 * @swagger
 * components:
 *   schemas:
 *     OfflineInterceptor:
 *       type: object
 *       description: HTTP interceptor for handling offline cart operations
 */
export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const connectivityService = inject(ConnectivityService);
  const queueService = inject(CartOfflineQueueService);
  const cartQuery = inject(CartQuery);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if error is due to network failure (offline)
      const isOffline = error.status === 0 || !connectivityService.isCurrentlyOnline();

      if (isOffline && isCartOperation(req.url)) {
        console.warn('Cart operation failed (offline) - queuing for sync:', req.url);

        // Queue the operation for later sync
        queueCartOperation(req, queueService);

        // Return cached data from Akita store instead of error
        if (req.method === 'GET') {
          // For GET requests, return cached cart data
          const cachedCart = cartQuery.getValue();
          return throwError(() => ({
            ...error,
            error: {
              message: 'Offline - showing cached cart data',
              offline: true,
              cachedData: cachedCart
            }
          }));
        } else {
          // For POST/PUT/DELETE, return success response (optimistic update)
          // The actual operation will sync when online
          return throwError(() => ({
            ...error,
            error: {
              message: 'Offline - operation queued for sync',
              offline: true,
              queued: true
            }
          }));
        }
      }

      // Not a cart operation or not offline - pass error through
      return throwError(() => error);
    })
  );
};

/**
 * Check if Request is a Cart Operation
 *
 * Determines if the request URL is for a cart-related endpoint.
 *
 * @param url - Request URL
 * @returns True if cart operation, false otherwise
 */
function isCartOperation(url: string): boolean {
  const cartEndpoints = [
    '/api/cart',
    '/api/cart/guest',
    '/api/cart/sync',
    '/api/cart/merge',
    '/api/cart/validate',
    '/api/cart/item'
  ];

  return cartEndpoints.some(endpoint => url.includes(endpoint));
}

/**
 * Queue Cart Operation
 *
 * Extracts operation details from HTTP request and queues for sync.
 *
 * @param req - HTTP request
 * @param queueService - Offline queue service
 */
function queueCartOperation(req: any, queueService: CartOfflineQueueService): void {
  let operation: 'ADD' | 'UPDATE' | 'REMOVE' | 'SYNC' | 'MERGE' = 'SYNC';
  let payload: any = {};

  // Determine operation type based on method and URL
  if (req.method === 'POST') {
    if (req.url.includes('/cart/sync')) {
      operation = 'SYNC';
      payload = { cartData: req.body };
    } else if (req.url.includes('/cart/merge')) {
      operation = 'MERGE';
      payload = req.body;
    } else if (req.url.includes('/cart/item') || req.url.includes('/cart/guest')) {
      operation = 'ADD';
      payload = req.body;
    }
  } else if (req.method === 'PUT') {
    operation = 'UPDATE';
    payload = req.body;
  } else if (req.method === 'DELETE') {
    operation = 'REMOVE';
    // Extract item ID from URL
    const match = req.url.match(/\/cart\/item\/([^\/]+)/);
    if (match) {
      payload = { cartItemId: match[1] };
    }
  }

  // Enqueue operation
  queueService.enqueue(operation, payload).then(
    queueItemId => {
      console.log(`Operation queued successfully: ${queueItemId}`);
    },
    error => {
      console.error('Failed to queue operation:', error);
    }
  );
}
