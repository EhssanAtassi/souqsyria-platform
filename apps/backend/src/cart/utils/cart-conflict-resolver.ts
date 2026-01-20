/**
 * @file cart-conflict-resolver.ts
 * @description Cart Conflict Resolution Utility for Multi-Device Synchronization
 *
 * ALGORITHM:
 * - Last-Write-Wins (LWW) conflict resolution based on updated_at timestamps
 * - Server timestamp is authoritative (avoids client clock skew issues)
 * - If timestamps within 5 seconds: merge by taking max quantity per item
 * - Comprehensive conflict logging for analytics and debugging
 *
 * USE CASES:
 * - User adds items on Device A
 * - User adds different items on Device B
 * - User syncs Device A → Conflicts detected → Resolve automatically
 *
 * BUSINESS RULES:
 * - Customer-friendly: Always take max quantity when ambiguous
 * - Price lock preserved from earliest addition
 * - No data loss: All items from both carts preserved
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { Logger } from '@nestjs/common';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';

/**
 * Conflict type enumeration for analytics
 */
export enum ConflictType {
  VERSION_MISMATCH = 'VERSION_MISMATCH', // Client and server versions differ
  TIMESTAMP_DRIFT = 'TIMESTAMP_DRIFT', // Client clock skew detected
  ITEM_QUANTITY_CONFLICT = 'ITEM_QUANTITY_CONFLICT', // Same item different quantity
  ITEM_ADDED_BOTH_SIDES = 'ITEM_ADDED_BOTH_SIDES', // Item added on both devices
  ITEM_REMOVED_ONE_SIDE = 'ITEM_REMOVED_ONE_SIDE', // Item removed on one device
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  resolvedCart: Cart; // Merged cart after conflict resolution
  conflicts: ConflictLog[]; // Detailed conflict log for analytics
  strategy: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGED'; // Resolution strategy used
  itemsAdded: number; // Number of items added during merge
  itemsUpdated: number; // Number of items with quantity updated
  itemsRemoved: number; // Number of items removed
}

/**
 * Individual conflict log entry
 */
export interface ConflictLog {
  type: ConflictType; // Type of conflict detected
  variantId: number; // Product variant involved
  clientValue: any; // Client's value (quantity, timestamp, etc.)
  serverValue: any; // Server's value
  resolvedValue: any; // Final resolved value
  resolution: string; // Human-readable explanation
  timestamp: Date; // When conflict was detected
}

/**
 * Cart Conflict Resolver - Handles multi-device synchronization conflicts
 */
export class CartConflictResolver {
  private static readonly logger = new Logger(CartConflictResolver.name);

  /**
   * SIMULTANEOUS EDIT THRESHOLD
   * If client and server timestamps within this window, treat as simultaneous edit
   * Use merge strategy instead of last-write-wins
   */
  private static readonly SIMULTANEOUS_EDIT_WINDOW_MS = 5000; // 5 seconds

  /**
   * RESOLVE CONFLICT
   *
   * Main conflict resolution entry point. Compares client and server carts,
   * detects conflicts, and returns merged cart with resolution strategy.
   *
   * Algorithm:
   * 1. Compare updated_at timestamps
   * 2. If timestamps within 5 seconds → Simultaneous edit → Merge
   * 3. If server newer → Server wins (client out of date)
   * 4. If client newer → Client wins (server out of date)
   * 5. Merge cart items using quantity maximization
   * 6. Preserve earliest price lock timestamps
   *
   * @param clientCart - Cart from client device
   * @param serverCart - Cart from server database
   * @param clientTimestamp - Client's local timestamp (for clock skew detection)
   * @returns ConflictResolution - Merged cart with conflict log
   */
  static resolveConflict(
    clientCart: Partial<Cart>,
    serverCart: Cart,
    clientTimestamp: Date,
  ): ConflictResolution {
    const startTime = Date.now();
    this.logger.log(
      `🔀 Resolving conflicts: Client version ${clientCart.version}, Server version ${serverCart.version}`,
    );

    const conflicts: ConflictLog[] = [];
    let strategy: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGED' = 'MERGED';

    // Calculate time difference between client and server
    const serverTime = serverCart.updated_at.getTime();
    const clientTime = clientTimestamp.getTime();
    const timeDiff = Math.abs(serverTime - clientTime);

    // Detect clock skew (client clock more than 10 seconds off)
    if (timeDiff > 10000) {
      this.logger.warn(
        `⚠️ Client clock skew detected: ${timeDiff}ms difference`,
      );
      conflicts.push({
        type: ConflictType.TIMESTAMP_DRIFT,
        variantId: null,
        clientValue: new Date(clientTime),
        serverValue: new Date(serverTime),
        resolvedValue: new Date(serverTime), // Server time authoritative
        resolution: `Client clock ${timeDiff}ms off, using server time as authoritative`,
        timestamp: new Date(),
      });
    }

    // Check for version conflict
    if (clientCart.version !== serverCart.version) {
      conflicts.push({
        type: ConflictType.VERSION_MISMATCH,
        variantId: null,
        clientValue: clientCart.version,
        serverValue: serverCart.version,
        resolvedValue: serverCart.version + 1, // Increment after merge
        resolution: `Version mismatch detected, will increment to ${serverCart.version + 1} after merge`,
        timestamp: new Date(),
      });
    }

    // Determine resolution strategy based on timestamps
    if (timeDiff <= this.SIMULTANEOUS_EDIT_WINDOW_MS) {
      // Simultaneous edit detected - merge both sides
      strategy = 'MERGED';
      this.logger.log(
        `🔄 Simultaneous edit detected (${timeDiff}ms), merging both sides`,
      );
    } else if (serverTime > clientTime) {
      // Server cart is newer - server wins
      strategy = 'SERVER_WINS';
      this.logger.log(`📥 Server cart newer, server wins`);
      return {
        resolvedCart: serverCart,
        conflicts,
        strategy,
        itemsAdded: 0,
        itemsUpdated: 0,
        itemsRemoved: 0,
      };
    } else {
      // Client cart is newer - client wins
      strategy = 'CLIENT_WINS';
      this.logger.log(`📤 Client cart newer, client wins`);
    }

    // Merge cart items
    const mergeResult = this.mergeCartItems(
      clientCart.items || [],
      serverCart.items || [],
      conflicts,
    );

    // Create resolved cart using Object.assign to preserve entity methods
    const resolvedCart: Cart = Object.assign(new Cart(), {
      ...serverCart,
      items: mergeResult.items,
      version: serverCart.version + 1, // Increment version after merge
      totalItems: mergeResult.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      totalAmount: mergeResult.items.reduce(
        (sum, item) => sum + item.effectivePrice() * item.quantity,
        0,
      ),
      updated_at: new Date(), // Update timestamp to now
    });

    const processingTime = Date.now() - startTime;
    this.logger.log(
      `✅ Conflict resolved in ${processingTime}ms: ${mergeResult.itemsAdded} added, ${mergeResult.itemsUpdated} updated, ${mergeResult.itemsRemoved} removed`,
    );

    return {
      resolvedCart,
      conflicts,
      strategy,
      itemsAdded: mergeResult.itemsAdded,
      itemsUpdated: mergeResult.itemsUpdated,
      itemsRemoved: mergeResult.itemsRemoved,
    };
  }

  /**
   * MERGE CART ITEMS
   *
   * Merges items from client and server carts using quantity maximization.
   * Preserves earliest price lock timestamps and item metadata.
   *
   * Algorithm:
   * 1. Create map of server items by variant ID
   * 2. For each client item:
   *    - If exists on server → Take max quantity, earliest added_at
   *    - If new → Add to result
   * 3. Add remaining server items not in client
   *
   * @param clientItems - Items from client cart
   * @param serverItems - Items from server cart
   * @param conflicts - Conflict log to append to
   * @returns Merge result with items and statistics
   */
  private static mergeCartItems(
    clientItems: Partial<CartItem>[],
    serverItems: CartItem[],
    conflicts: ConflictLog[],
  ): {
    items: CartItem[];
    itemsAdded: number;
    itemsUpdated: number;
    itemsRemoved: number;
  } {
    const mergedItems = new Map<number, CartItem>();
    let itemsAdded = 0;
    let itemsUpdated = 0;
    let itemsRemoved = 0;

    // Index server items by variant ID for fast lookup
    const serverItemsMap = new Map<number, CartItem>();
    for (const item of serverItems) {
      serverItemsMap.set(item.variant.id, item);
    }

    // Process client items
    for (const clientItem of clientItems) {
      const variantId = clientItem.variant?.id;
      if (!variantId) continue;

      const serverItem = serverItemsMap.get(variantId);

      if (serverItem) {
        // Item exists on both sides - merge
        const mergedItem = this.mergeItem(
          clientItem,
          serverItem,
          conflicts,
        );
        mergedItems.set(variantId, mergedItem);

        if (mergedItem.quantity !== serverItem.quantity) {
          itemsUpdated++;
        }
      } else {
        // Item only on client - add to cart
        mergedItems.set(variantId, clientItem as CartItem);
        itemsAdded++;
        this.logger.debug(`➕ Added item ${variantId} from client`);
      }
    }

    // Add remaining server items not in client
    for (const serverItem of serverItems) {
      const variantId = serverItem.variant.id;
      if (!mergedItems.has(variantId)) {
        mergedItems.set(variantId, serverItem);
        // Item was on server but not client - might be removed by client
        // For safety, keep server version (don't delete without confirmation)
        this.logger.debug(`📦 Kept item ${variantId} from server`);
      }
    }

    return {
      items: Array.from(mergedItems.values()),
      itemsAdded,
      itemsUpdated,
      itemsRemoved,
    };
  }

  /**
   * MERGE SINGLE ITEM
   *
   * Merges a single cart item that exists on both client and server.
   * Uses quantity maximization and earliest timestamps.
   *
   * @param clientItem - Item from client
   * @param serverItem - Item from server
   * @param conflicts - Conflict log to append to
   * @returns Merged cart item
   */
  private static mergeItem(
    clientItem: Partial<CartItem>,
    serverItem: CartItem,
    conflicts: ConflictLog[],
  ): CartItem {
    const variantId = serverItem.variant.id;

    // Take maximum quantity (customer-friendly)
    const mergedQuantity = Math.max(
      clientItem.quantity || 0,
      serverItem.quantity,
    );

    // Preserve earliest added_at timestamp (for longest price lock)
    const earliestAddedAt =
      clientItem.added_at &&
      serverItem.added_at &&
      clientItem.added_at < serverItem.added_at
        ? clientItem.added_at
        : serverItem.added_at;

    // Log conflict if quantities differ
    if (clientItem.quantity !== serverItem.quantity) {
      conflicts.push({
        type: ConflictType.ITEM_QUANTITY_CONFLICT,
        variantId,
        clientValue: clientItem.quantity,
        serverValue: serverItem.quantity,
        resolvedValue: mergedQuantity,
        resolution: `Took maximum quantity (${mergedQuantity}) for variant ${variantId}`,
        timestamp: new Date(),
      });

      this.logger.debug(
        `🔄 Merged item ${variantId}: Client qty=${clientItem.quantity}, Server qty=${serverItem.quantity}, Resolved qty=${mergedQuantity}`,
      );
    }

    // Return merged item with server item as base (has relationships)
    // Use Object.assign to preserve entity methods
    return Object.assign(new CartItem(), {
      ...serverItem,
      quantity: mergedQuantity,
      added_at: earliestAddedAt,
      locked_until: earliestAddedAt
        ? new Date(earliestAddedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        : serverItem.locked_until,
    });
  }

  /**
   * VALIDATE CONFLICT RESOLUTION
   *
   * Validates that resolved cart meets all business rules:
   * - Maximum 100 items per cart
   * - Maximum 50 quantity per product
   * - All price locks valid
   * - No duplicate variants
   *
   * @param resolution - Conflict resolution result to validate
   * @returns Validation errors (empty if valid)
   */
  static validateResolution(
    resolution: ConflictResolution,
  ): string[] {
    const errors: string[] = [];
    const cart = resolution.resolvedCart;

    // Check total items limit (100)
    const totalItems = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (totalItems > 100) {
      errors.push(
        `Cart exceeds 100 item limit: ${totalItems} items after merge`,
      );
    }

    // Check per-product quantity limit (50)
    for (const item of cart.items) {
      if (item.quantity > 50) {
        errors.push(
          `Item ${item.variant.id} exceeds 50 quantity limit: ${item.quantity}`,
        );
      }
    }

    // Check for duplicate variants
    const variantIds = cart.items.map((item) => item.variant.id);
    const uniqueVariantIds = new Set(variantIds);
    if (variantIds.length !== uniqueVariantIds.size) {
      errors.push(`Duplicate variants detected in resolved cart`);
    }

    // Check price lock validity
    for (const item of cart.items) {
      if (!item.added_at || !item.locked_until) {
        errors.push(
          `Item ${item.variant.id} missing price lock timestamps`,
        );
      }
    }

    return errors;
  }

  /**
   * GET CONFLICT SUMMARY
   *
   * Generates human-readable summary of conflicts for logging and UI display.
   *
   * @param resolution - Conflict resolution result
   * @returns Human-readable conflict summary
   */
  static getConflictSummary(resolution: ConflictResolution): string {
    const { conflicts, strategy, itemsAdded, itemsUpdated, itemsRemoved } =
      resolution;

    const lines: string[] = [];
    lines.push(`Conflict Resolution Summary:`);
    lines.push(`Strategy: ${strategy}`);
    lines.push(
      `Changes: ${itemsAdded} added, ${itemsUpdated} updated, ${itemsRemoved} removed`,
    );
    lines.push(`Conflicts detected: ${conflicts.length}`);

    if (conflicts.length > 0) {
      lines.push(`\nConflict Details:`);
      for (const conflict of conflicts) {
        lines.push(
          `  - ${conflict.type}: ${conflict.resolution}`,
        );
      }
    }

    return lines.join('\n');
  }
}
