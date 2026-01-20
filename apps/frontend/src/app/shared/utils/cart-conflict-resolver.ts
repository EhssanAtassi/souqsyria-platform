import { Cart, CartItem } from '../interfaces/cart.interface';

/**
 * Cart Conflict Resolver
 *
 * Resolves conflicts when local cart and server cart have diverged.
 * Used in multi-device scenarios or after offline sync.
 *
 * Strategy:
 * - Compare version numbers (last-write-wins)
 * - If versions match, no conflict
 * - If server version newer, accept server cart
 * - Detect item-level conflicts (quantity differences, added/removed items)
 * - Generate detailed conflict reports for user notification
 *
 * Features:
 * - Version-based conflict detection
 * - Automatic server-wins resolution
 * - Item-level conflict tracking
 * - User notification generation with details
 * - Conflict logging for analytics
 *
 * Usage:
 * ```typescript
 * const resolved = resolveConflict(localCart, serverCart);
 * if (resolved.notification.type !== 'info') {
 *   toastr.warning(resolved.notification.message, resolved.notification.details);
 * }
 * cartStore.update(resolved.cart);
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ResolvedCart:
 *       type: object
 *       required:
 *         - cart
 *         - notification
 *         - conflicts
 *       properties:
 *         cart:
 *           $ref: '#/components/schemas/Cart'
 *         notification:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [info, warning, error]
 *             message:
 *               type: string
 *             details:
 *               type: string
 *         conflicts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartConflict'
 */

/**
 * Resolved Cart Result
 *
 * Contains the resolved cart and notification details after conflict resolution.
 */
export interface ResolvedCart {
  /** Resolved cart state (server version preferred) */
  cart: Cart;

  /** User notification for conflict resolution */
  notification: {
    /** Notification severity */
    type: 'info' | 'warning' | 'error';

    /** Main notification message */
    message: string;

    /** Optional detailed explanation */
    details?: string;
  };

  /** List of detected conflicts */
  conflicts: Array<{
    productId: number;
    productName: string;
    localQuantity: number;
    serverQuantity: number;
    resolution: 'SERVER_WINS' | 'MERGED';
  }>;
}

/**
 * Legacy interface for backward compatibility
 * @deprecated Use ResolvedCart instead
 */
export interface ConflictResolution {
  /** The resolved cart to use */
  resolvedCart: Cart;

  /** Notification message for user (null if no conflict) */
  notification: string | null;

  /** Type of conflict resolution applied */
  conflictType: 'no_conflict' | 'server_wins' | 'local_wins' | 'merged';

  /** Whether cart was modified during resolution */
  wasModified: boolean;
}

/**
 * Resolve Cart Conflict (New API)
 *
 * Compares local and server carts and resolves conflicts with detailed item-level analysis.
 *
 * @param localCart - Cart from Akita store (client)
 * @param serverCart - Cart from backend API
 * @returns ResolvedCart object with detailed conflict information
 */
export function resolveConflict(localCart: Cart, serverCart: Cart): ResolvedCart {
  console.log('[CartConflictResolver] Resolving cart conflict...', {
    localVersion: localCart.version,
    serverVersion: serverCart.version,
    localItemCount: localCart.items.length,
    serverItemCount: serverCart.items.length,
  });

  // Detect item-level conflicts
  const conflicts = detectItemConflicts(localCart, serverCart);

  // No conflicts detected
  if (conflicts.length === 0 && localCart.version === serverCart.version) {
    console.log('[CartConflictResolver] No conflicts detected');
    return {
      cart: localCart,
      notification: {
        type: 'info',
        message: 'Cart is up to date',
      },
      conflicts: [],
    };
  }

  // Server version wins (most common case)
  console.warn('[CartConflictResolver] Accepting server version:', {
    conflictCount: conflicts.length,
    serverVersion: serverCart.version,
  });

  return {
    cart: {
      ...serverCart,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    },
    notification: {
      type: conflicts.length > 0 ? 'warning' : 'info',
      message:
        conflicts.length > 0
          ? `Cart synchronized (${conflicts.length} ${conflicts.length === 1 ? 'item' : 'items'} updated)`
          : 'Cart synchronized across devices',
      details: conflicts.length > 0 ? generateConflictDetails(conflicts) : undefined,
    },
    conflicts,
  };
}

/**
 * Detect Item-Level Conflicts
 *
 * Compares cart items between local and server carts to identify conflicts.
 *
 * @param localCart - Local cart state
 * @param serverCart - Server cart state
 * @returns Array of cart conflicts
 */
function detectItemConflicts(
  localCart: Cart,
  serverCart: Cart
): Array<{
  productId: number;
  productName: string;
  localQuantity: number;
  serverQuantity: number;
  resolution: 'SERVER_WINS' | 'MERGED';
}> {
  const conflicts: Array<{
    productId: number;
    productName: string;
    localQuantity: number;
    serverQuantity: number;
    resolution: 'SERVER_WINS' | 'MERGED';
  }> = [];

  // Build maps for efficient lookup
  const localItemsMap = new Map(
    localCart.items.map((item) => [getItemKey(item), item])
  );
  const serverItemsMap = new Map(
    serverCart.items.map((item) => [getItemKey(item), item])
  );

  // Check for conflicts in items present in both carts
  localItemsMap.forEach((localItem, key) => {
    const serverItem = serverItemsMap.get(key);

    if (serverItem) {
      // Item exists in both carts - check for quantity mismatch
      if (localItem.quantity !== serverItem.quantity) {
        conflicts.push({
          productId: extractProductId(localItem),
          productName: localItem.product?.name || 'Unknown Product',
          localQuantity: localItem.quantity,
          serverQuantity: serverItem.quantity,
          resolution: 'SERVER_WINS',
        });
      }
    } else {
      // Item exists in local cart but not in server cart (removed on server)
      conflicts.push({
        productId: extractProductId(localItem),
        productName: localItem.product?.name || 'Unknown Product',
        localQuantity: localItem.quantity,
        serverQuantity: 0,
        resolution: 'SERVER_WINS',
      });
    }
  });

  // Check for items in server cart but not in local cart (added on server)
  serverItemsMap.forEach((serverItem, key) => {
    if (!localItemsMap.has(key)) {
      conflicts.push({
        productId: extractProductId(serverItem),
        productName: serverItem.product?.name || 'Unknown Product',
        localQuantity: 0,
        serverQuantity: serverItem.quantity,
        resolution: 'SERVER_WINS',
      });
    }
  });

  return conflicts;
}

/**
 * Generate Conflict Details String
 *
 * Creates detailed explanation of conflicts for notification.
 *
 * @param conflicts - Array of detected conflicts
 * @returns Formatted details string
 */
function generateConflictDetails(
  conflicts: Array<{
    productId: number;
    productName: string;
    localQuantity: number;
    serverQuantity: number;
    resolution: 'SERVER_WINS' | 'MERGED';
  }>
): string {
  const details = conflicts.map((conflict) => {
    if (conflict.localQuantity === 0) {
      return `Added "${conflict.productName}" (${conflict.serverQuantity})`;
    } else if (conflict.serverQuantity === 0) {
      return `Removed "${conflict.productName}"`;
    } else {
      return `"${conflict.productName}": ${conflict.localQuantity} → ${conflict.serverQuantity}`;
    }
  });

  return details.slice(0, 3).join(', ') + (conflicts.length > 3 ? '...' : '');
}

/**
 * Get Item Unique Key
 *
 * Generates unique identifier for cart item based on product and variant.
 *
 * @param item - Cart item
 * @returns Unique key string
 */
function getItemKey(item: CartItem): string {
  const productId = extractProductId(item);
  const variantId = item.selectedVariant?.id || 'default';
  return `${productId}_${variantId}`;
}

/**
 * Extract Product ID from Cart Item
 *
 * Safely extracts product ID handling different data formats.
 *
 * @param item - Cart item
 * @returns Product ID as number
 */
function extractProductId(item: CartItem): number {
  // Handle product ID as string or number
  const productId = item.product?.id || 0;
  return typeof productId === 'string' ? parseInt(productId, 10) : productId;
}

/**
 * Resolve Cart Conflict (Legacy API)
 *
 * @deprecated Use resolveConflict instead which returns ResolvedCart
 *
 * @param localCart - Cart from Akita store (client)
 * @param serverCart - Cart from backend API
 * @returns ConflictResolution object
 */
export function resolveConflictLegacy(localCart: Cart, serverCart: Cart): ConflictResolution {
  const resolved = resolveConflict(localCart, serverCart);

  return {
    resolvedCart: resolved.cart,
    notification: resolved.notification.message,
    conflictType: resolved.conflicts.length > 0 ? 'server_wins' : 'no_conflict',
    wasModified: resolved.conflicts.length > 0,
  };
}

/**
 * Detect Cart Changes
 *
 * Compares two carts and lists specific changes.
 *
 * @param oldCart - Previous cart state
 * @param newCart - New cart state
 * @returns Array of change descriptions
 */
export function detectCartChanges(oldCart: Cart, newCart: Cart): string[] {
  const changes: string[] = [];

  // Check item count change
  if (oldCart.items.length !== newCart.items.length) {
    changes.push(
      `Item count changed: ${oldCart.items.length} → ${newCart.items.length}`
    );
  }

  // Check for added items
  const addedItems = newCart.items.filter(
    newItem => !oldCart.items.some(oldItem => oldItem.id === newItem.id)
  );
  if (addedItems.length > 0) {
    changes.push(`${addedItems.length} item(s) added`);
  }

  // Check for removed items
  const removedItems = oldCart.items.filter(
    oldItem => !newCart.items.some(newItem => newItem.id === oldItem.id)
  );
  if (removedItems.length > 0) {
    changes.push(`${removedItems.length} item(s) removed`);
  }

  // Check for quantity changes
  oldCart.items.forEach(oldItem => {
    const newItem = newCart.items.find(item => item.id === oldItem.id);
    if (newItem && newItem.quantity !== oldItem.quantity) {
      changes.push(
        `${oldItem.product.name}: quantity changed ${oldItem.quantity} → ${newItem.quantity}`
      );
    }
  });

  // Check total change
  if (oldCart.totals.total !== newCart.totals.total) {
    changes.push(
      `Total changed: ${oldCart.totals.currency} ${oldCart.totals.total.toFixed(2)} → ${newCart.totals.currency} ${newCart.totals.total.toFixed(2)}`
    );
  }

  return changes;
}

/**
 * Log Conflict (Analytics)
 *
 * Logs cart conflict for analytics tracking.
 *
 * @param resolution - Conflict resolution result
 */
export function logConflict(resolution: ConflictResolution): void {
  if (resolution.conflictType !== 'no_conflict') {
    console.log('[Analytics] cart.conflict.resolved', {
      type: resolution.conflictType,
      modified: resolution.wasModified,
      timestamp: new Date().toISOString()
    });

    // Send to analytics service
    if ((window as any).analytics) {
      (window as any).analytics.track('cart_conflict_resolved', {
        conflictType: resolution.conflictType,
        wasModified: resolution.wasModified,
        timestamp: new Date().toISOString()
      });
    }
  }
}
