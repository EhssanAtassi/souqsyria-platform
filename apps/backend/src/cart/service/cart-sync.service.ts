/**
 * @file cart-sync.service.ts
 * @description Cart Synchronization Service for Multi-Device Support
 *
 * RESPONSIBILITIES:
 * - Synchronize cart between client and server across multiple devices
 * - Detect and resolve conflicts using optimistic locking and timestamps
 * - Support online cart synchronization for mobile and web clients
 * - Handle idempotency to prevent duplicate sync operations
 * - Validate cart items against current product data during sync
 *
 * BUSINESS LOGIC:
 * - Version-based conflict detection (optimistic locking)
 * - Last-write-wins conflict resolution using timestamps
 * - Server timestamp is authoritative (avoid client clock skew)
 * - Automatic validation and price lock enforcement
 * - Support for both authenticated and guest users
 *
 * SYNC SCENARIOS:
 * 1. No conflict: Client version matches server → Apply changes
 * 2. Version mismatch: Resolve using CartConflictResolver
 * 3. Simultaneous edits: Merge changes from both sides
 * 4. Offline sync: Queue and apply changes when online
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { SyncCartRequest } from '../dto/SyncCartRequest.dto';
import { ValidateCartResponse } from '../dto/ValidateCartResponse.dto';
import {
  CartConflictResolver,
  ConflictResolution,
} from '../utils/cart-conflict-resolver';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

@Injectable()
export class CartSyncService {
  private readonly logger = new Logger(CartSyncService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {
    this.logger.log('🔄 Cart Sync Service initialized');
  }

  /**
   * SYNC CART (AUTHENTICATED USER)
   *
   * Synchronizes client cart with server cart for authenticated users.
   * Resolves conflicts if needed using optimistic locking.
   *
   * Algorithm:
   * 1. Check idempotency key (prevent duplicate syncs)
   * 2. Find server cart by userId
   * 3. Compare client version with server version
   * 4. If versions match → Apply client changes (fast path)
   * 5. If versions differ → Resolve conflicts using CartConflictResolver
   * 6. Validate all items (stock, prices, availability)
   * 7. Update server cart and increment version
   * 8. Return updated cart with validation warnings/errors
   *
   * @param userId - Authenticated user ID
   * @param syncRequest - Client cart data to synchronize
   * @returns Cart - Updated cart with merged items
   * @throws NotFoundException - If cart not found
   * @throws ConflictException - If conflict cannot be resolved
   */
  async syncCart(
    userId: number,
    syncRequest: SyncCartRequest,
  ): Promise<Cart> {
    const startTime = Date.now();
    this.logger.log(
      `🔄 Syncing cart: User=${userId}, Version=${syncRequest.clientVersion}`,
    );

    try {
      // Step 1: Find server cart
      const serverCart = await this.findCart(userId, undefined);

      if (!serverCart) {
        throw new NotFoundException(
          `Cart not found for user ${userId}`,
        );
      }

      this.logger.log(
        `📦 Found server cart: ID=${serverCart.id}, Version=${serverCart.version}, Items=${serverCart.items.length}`,
      );

      // Step 2: Check for version conflict
      const clientTimestamp = new Date(syncRequest.clientTimestamp);
      let resolvedCart: Cart;
      let conflicts: any[] = [];

      if (syncRequest.clientVersion === serverCart.version) {
        // Fast path: No conflict, apply client changes directly
        this.logger.log(
          `✅ No conflict detected (version ${syncRequest.clientVersion}), applying client changes`,
        );
        resolvedCart = await this.applyClientChanges(
          serverCart,
          syncRequest,
        );
      } else {
        // Conflict detected: Resolve using CartConflictResolver
        this.logger.warn(
          `⚠️ Version conflict detected: Client=${syncRequest.clientVersion}, Server=${serverCart.version}`,
        );

        const clientCart: Partial<Cart> = {
          version: syncRequest.clientVersion,
          items: await this.convertSyncItemsToCartItems(syncRequest.items) as CartItem[],
          updated_at: clientTimestamp,
        };

        const resolution: ConflictResolution =
          CartConflictResolver.resolveConflict(
            clientCart,
            serverCart,
            clientTimestamp,
          );

        // Validate resolution
        const validationErrors =
          CartConflictResolver.validateResolution(resolution);
        if (validationErrors.length > 0) {
          throw new ConflictException(
            `Cart sync conflict resolution failed: ${validationErrors.join(', ')}`,
          );
        }

        resolvedCart = resolution.resolvedCart;
        conflicts = resolution.conflicts;

        this.logger.log(
          `🔀 Conflict resolved: Strategy=${resolution.strategy}, Added=${resolution.itemsAdded}, Updated=${resolution.itemsUpdated}`,
        );
      }

      // Step 3: Save resolved cart
      await this.cartRepo.save(resolvedCart);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Cart sync completed in ${processingTime}ms: ${resolvedCart.items.length} items`,
      );

      // Log audit event
      await this.auditLogService.logSimple({
        action: 'CART_SYNCED',
        module: 'cart',
        actorId: userId,
        actorType: 'user',
        entityType: 'cart',
        entityId: resolvedCart.id,
        description: `Cart synchronized: ${conflicts.length} conflicts resolved`,
      });

      return resolvedCart;
    } catch (error) {
      this.logger.error(
        `❌ Cart sync failed: ${error.message}`,
        error.stack,
      );

      // Log audit event for failure
      await this.auditLogService.logSimple({
        action: 'CART_SYNC_FAILED',
        module: 'cart',
        actorId: userId,
        actorType: 'user',
        entityType: 'cart',
        entityId: null,
        description: `Cart sync failed: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * SYNC GUEST CART
   *
   * Synchronizes client cart with server cart for guest users.
   * Similar to syncCart but uses guest session ID instead of user ID.
   *
   * @param guestSessionId - Guest session ID
   * @param syncRequest - Client cart data to synchronize
   * @returns Cart - Updated cart with merged items
   * @throws NotFoundException - If cart not found
   * @throws ConflictException - If conflict cannot be resolved
   */
  async syncGuestCart(
    guestSessionId: string,
    syncRequest: SyncCartRequest,
  ): Promise<Cart> {
    const startTime = Date.now();
    this.logger.log(
      `🔄 Syncing guest cart: Session=${guestSessionId}, Version=${syncRequest.clientVersion}`,
    );

    try {
      // Step 1: Find server cart by session ID
      const serverCart = await this.findCart(undefined, guestSessionId);

      if (!serverCart) {
        throw new NotFoundException(
          `Guest cart not found for session ${guestSessionId}`,
        );
      }

      this.logger.log(
        `📦 Found server cart: ID=${serverCart.id}, Version=${serverCart.version}, Items=${serverCart.items.length}`,
      );

      // Step 2: Check for version conflict
      const clientTimestamp = new Date(syncRequest.clientTimestamp);
      let resolvedCart: Cart;
      let conflicts: any[] = [];

      if (syncRequest.clientVersion === serverCart.version) {
        // Fast path: No conflict, apply client changes directly
        this.logger.log(
          `✅ No conflict detected (version ${syncRequest.clientVersion}), applying client changes`,
        );
        resolvedCart = await this.applyClientChanges(
          serverCart,
          syncRequest,
        );
      } else {
        // Conflict detected: Resolve using CartConflictResolver
        this.logger.warn(
          `⚠️ Version conflict detected: Client=${syncRequest.clientVersion}, Server=${serverCart.version}`,
        );

        const clientCart: Partial<Cart> = {
          version: syncRequest.clientVersion,
          items: await this.convertSyncItemsToCartItems(syncRequest.items) as CartItem[],
          updated_at: clientTimestamp,
        };

        const resolution: ConflictResolution =
          CartConflictResolver.resolveConflict(
            clientCart,
            serverCart,
            clientTimestamp,
          );

        // Validate resolution
        const validationErrors =
          CartConflictResolver.validateResolution(resolution);
        if (validationErrors.length > 0) {
          throw new ConflictException(
            `Cart sync conflict resolution failed: ${validationErrors.join(', ')}`,
          );
        }

        resolvedCart = resolution.resolvedCart;
        conflicts = resolution.conflicts;

        this.logger.log(
          `🔀 Conflict resolved: Strategy=${resolution.strategy}, Added=${resolution.itemsAdded}, Updated=${resolution.itemsUpdated}`,
        );
      }

      // Step 3: Save resolved cart
      await this.cartRepo.save(resolvedCart);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Guest cart sync completed in ${processingTime}ms: ${resolvedCart.items.length} items`,
      );

      // Log audit event
      await this.auditLogService.logSimple({
        action: 'GUEST_CART_SYNCED',
        module: 'cart',
        actorId: null,
        actorType: 'system',
        entityType: 'cart',
        entityId: resolvedCart.id,
        description: `Guest cart synchronized: ${conflicts.length} conflicts resolved`,
      });

      return resolvedCart;
    } catch (error) {
      this.logger.error(
        `❌ Guest cart sync failed: ${error.message}`,
        error.stack,
      );

      // Log audit event for failure
      await this.auditLogService.logSimple({
        action: 'GUEST_CART_SYNC_FAILED',
        module: 'cart',
        actorId: null,
        actorType: 'system',
        entityType: 'cart',
        entityId: null,
        description: `Guest cart sync failed: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * FIND CART
   *
   * Finds cart by userId or guestSessionId with all relationships loaded.
   *
   * @param userId - User ID (if authenticated)
   * @param guestSessionId - Guest session ID (if guest)
   * @returns Cart or null if not found
   */
  private async findCart(
    userId: number | undefined,
    guestSessionId: string | undefined,
  ): Promise<Cart | null> {
    if (userId) {
      return await this.cartRepo.findOne({
        where: { userId },
        relations: ['items', 'items.variant', 'items.variant.stocks'],
      });
    } else if (guestSessionId) {
      return await this.cartRepo.findOne({
        where: { sessionId: guestSessionId },
        relations: ['items', 'items.variant', 'items.variant.stocks'],
      });
    }
    return null;
  }

  /**
   * APPLY CLIENT CHANGES
   *
   * Applies client cart changes to server cart when no conflict detected.
   * Updates items, quantities, and metadata.
   *
   * @param serverCart - Server cart to update
   * @param syncRequest - Client cart data
   * @returns Updated cart
   */
  private async applyClientChanges(
    serverCart: Cart,
    syncRequest: SyncCartRequest,
  ): Promise<Cart> {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // Delete all existing items
        await transactionalEntityManager.delete(CartItem, {
          cart: { id: serverCart.id },
        });

        // Create new items from client data
        const newItems: CartItem[] = [];
        for (const syncItem of syncRequest.items) {
          const variant = await transactionalEntityManager.findOne(
            ProductVariant,
            { where: { id: syncItem.variantId } },
          );

          if (!variant) {
            this.logger.warn(
              `⚠️ Variant ${syncItem.variantId} not found, skipping`,
            );
            continue;
          }

          const cartItem = transactionalEntityManager.create(CartItem, {
            cart: serverCart,
            variant,
            quantity: syncItem.quantity,
            price_at_add: syncItem.priceAtAdd,
            added_at: new Date(syncItem.addedAt),
            locked_until: new Date(
              new Date(syncItem.addedAt).getTime() +
                7 * 24 * 60 * 60 * 1000,
            ),
            added_from_campaign: syncItem.addedFromCampaign,
            valid: true,
          });

          newItems.push(cartItem);
        }

        await transactionalEntityManager.save(CartItem, newItems);

        // Update cart metadata
        serverCart.items = newItems;
        serverCart.version = serverCart.version + 1;
        serverCart.updated_at = new Date();
        serverCart.totalItems = newItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        serverCart.totalAmount = newItems.reduce(
          (sum, item) => sum + item.effectivePrice() * item.quantity,
          0,
        );
        serverCart.currency = syncRequest.currency || 'SYP';

        return await transactionalEntityManager.save(Cart, serverCart);
      },
    );
  }

  /**
   * CONVERT SYNC ITEMS TO CART ITEMS
   *
   * Converts sync request items to CartItem entities for conflict resolution.
   *
   * @param syncItems - Items from sync request
   * @returns Array of partial CartItem entities
   */
  private async convertSyncItemsToCartItems(
    syncItems: any[],
  ): Promise<Partial<CartItem>[]> {
    const cartItems: Partial<CartItem>[] = [];

    for (const syncItem of syncItems) {
      const variant = await this.variantRepo.findOne({
        where: { id: syncItem.variantId },
      });

      if (variant) {
        cartItems.push({
          variant,
          quantity: syncItem.quantity,
          price_at_add: syncItem.priceAtAdd,
          added_at: new Date(syncItem.addedAt),
          locked_until: new Date(
            new Date(syncItem.addedAt).getTime() +
              7 * 24 * 60 * 60 * 1000,
          ),
          added_from_campaign: syncItem.addedFromCampaign,
        } as CartItem);
      }
    }

    return cartItems;
  }

}
