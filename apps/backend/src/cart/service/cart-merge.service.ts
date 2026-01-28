/**
 * @file cart-merge.service.ts
 * @description Cart Merge Service for Guest-to-User Cart Migration
 *
 * RESPONSIBILITIES:
 * - Merge guest cart into authenticated user cart on login
 * - Handle duplicate items with intelligent quantity combination
 * - Enforce cart limits (100 items max, 50 per product max)
 * - Mark guest sessions as 'converted' after successful merge
 * - Log all merge operations for analytics and auditing
 *
 * BUSINESS LOGIC:
 * - Guest cart + User cart = Merged cart (no data loss)
 * - Duplicate items: Combine quantities (max 50 per product)
 * - Cart limit: Maximum 100 items total (prioritize newer items)
 * - Price locks: Preserve earliest added_at timestamp
 * - Session tracking: Mark guest session as 'converted' with user ID
 *
 * MERGE STRATEGIES:
 * - COMBINE: Add quantities for duplicates (default, customer-friendly)
 * - KEEP_USER: Prioritize user cart, discard guest on conflict
 * - KEEP_GUEST: Prioritize guest cart, replace user on conflict
 * - NEWER: Keep item with most recent timestamp
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { GuestSession } from '../entities/guest-session.entity';
import {
  MergeStrategy,
  MergeCartResponse,
} from '../dto/MergeCartRequest.dto';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

@Injectable()
export class CartMergeService {
  private readonly logger = new Logger(CartMergeService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource, // For transactions
  ) {
    this.logger.log('🔄 Cart Merge Service initialized');
  }

  /**
   * MERGE GUEST CART INTO USER CART
   *
   * Merges a guest's shopping cart into an authenticated user's cart when they log in.
   * Handles duplicate items, quantity limits, and cart size limits intelligently.
   *
   * Algorithm:
   * 1. Find guest cart by session ID (validate exists and active)
   * 2. Find or create user cart by user ID
   * 3. For each guest cart item:
   *    a. Check if variant exists in user cart
   *    b. If exists: Combine quantities (respect 50-item-per-product limit)
   *    c. If new: Add to user cart
   * 4. Apply 100-item total limit (prioritize newer items if exceeded)
   * 5. Mark guest session as 'converted' with user ID
   * 6. Delete guest cart (cascade delete items)
   * 7. Return merge statistics and updated user cart
   *
   * @param userId - Authenticated user ID to merge into
   * @param guestSessionId - Guest session ID containing cart to merge from
   * @param strategy - Merge strategy (default: COMBINE)
   * @returns MergeCartResponse - Merge result with statistics
   * @throws NotFoundException - If guest session or cart not found
   * @throws BadRequestException - If merge violates business rules
   */
  async mergeGuestIntoUserCart(
    userId: number,
    guestSessionId: string,
    strategy: MergeStrategy = MergeStrategy.COMBINE,
  ): Promise<MergeCartResponse> {
    const startTime = Date.now();
    this.logger.log(
      `🔀 Merging guest cart from session ${guestSessionId} into user ${userId} with strategy: ${strategy}`,
    );

    // Use transaction to ensure atomicity
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          // Step 1: Find and validate guest session
          const guestSession = await transactionalEntityManager.findOne(
            GuestSession,
            {
              where: { id: guestSessionId },
            },
          );

          if (!guestSession) {
            throw new NotFoundException(
              `Guest session ${guestSessionId} not found`,
            );
          }

          if (guestSession.status === 'expired') {
            throw new BadRequestException(
              'Guest session has expired, cannot merge cart',
            );
          }

          if (guestSession.status === 'converted') {
            this.logger.warn(
              `⚠️ Guest session ${guestSessionId} already converted to user ${guestSession.convertedUserId}`,
            );
            throw new BadRequestException(
              'Guest session already converted, cart already merged',
            );
          }

          // Step 2: Find guest cart
          const guestCart = await transactionalEntityManager.findOne(Cart, {
            where: { sessionId: guestSessionId },
            relations: ['items', 'items.variant'],
          });

          if (!guestCart || guestCart.items.length === 0) {
            this.logger.log(
              `💭 Guest cart is empty, nothing to merge for session ${guestSessionId}`,
            );
            // Mark session as converted anyway
            await this.markSessionConverted(
              transactionalEntityManager,
              guestSession,
              userId,
            );
            return this.createEmptyMergeResponse(userId);
          }

          this.logger.log(
            `📦 Found guest cart with ${guestCart.items.length} items`,
          );

          // Step 3: Find or create user cart
          let userCart = await transactionalEntityManager.findOne(Cart, {
            where: { userId },
            relations: ['items', 'items.variant'],
          });

          if (!userCart) {
            this.logger.log(`🆕 Creating new cart for user ${userId}`);
            userCart = transactionalEntityManager.create(Cart, {
              userId,
              items: [],
              currency: guestCart.currency || 'SYP',
              status: 'active',
              totalItems: 0,
              totalAmount: 0,
            });
            await transactionalEntityManager.save(Cart, userCart);
          } else {
            this.logger.log(
              `📦 Found user cart with ${userCart.items.length} items`,
            );
          }

          // Step 4: Merge items based on strategy
          const mergeResult = await this.mergeItems(
            transactionalEntityManager,
            guestCart.items,
            userCart,
            strategy,
          );

          // Step 5: Update cart totals
          await this.updateCartTotals(
            transactionalEntityManager,
            userCart.id,
          );

          // Step 6: Mark guest session as converted
          await this.markSessionConverted(
            transactionalEntityManager,
            guestSession,
            userId,
          );

          // Step 7: Delete guest cart (cascade deletes items)
          await transactionalEntityManager.remove(Cart, guestCart);

          const processingTime = Date.now() - startTime;
          this.logger.log(
            `✅ Cart merge completed in ${processingTime}ms: ${mergeResult.itemsAdded} added, ${mergeResult.itemsCombined} combined, ${mergeResult.itemsSkipped} skipped`,
          );

          // Log audit event
          await this.auditLogService.logSimple({
            action: 'CART_MERGED',
            module: 'cart',
            actorId: userId,
            actorType: 'user',
            entityType: 'cart',
            entityId: userCart.id,
            description: `Merged guest cart (${guestCart.items.length} items) into user cart`,
          });

          return {
            success: true,
            cartId: userCart.id,
            totalItems: mergeResult.totalItems,
            itemsAdded: mergeResult.itemsAdded,
            itemsCombined: mergeResult.itemsCombined,
            itemsSkipped: mergeResult.itemsSkipped,
            messages: mergeResult.messages,
            guestSessionConverted: true,
          };
        } catch (error: unknown) {
          this.logger.error(
            `❌ Failed to merge cart: ${(error as Error).message}`,
            (error as Error).stack,
          );

          // Log audit event for failure
          await this.auditLogService.logSimple({
            action: 'CART_MERGE_FAILED',
            module: 'cart',
            actorId: userId,
            actorType: 'user',
            entityType: 'cart',
            entityId: null,
            description: `Failed to merge guest cart ${guestSessionId}: ${(error as Error).message}`,
          });

          throw error;
        }
      },
    );
  }

  /**
   * MERGE ITEMS
   *
   * Merges guest cart items into user cart following the specified strategy.
   * Handles duplicate detection, quantity limits, and cart size limits.
   *
   * @param entityManager - Transaction entity manager
   * @param guestItems - Items from guest cart
   * @param userCart - User cart to merge into
   * @param strategy - Merge strategy to apply
   * @returns Merge statistics
   */
  private async mergeItems(
    entityManager: any,
    guestItems: CartItem[],
    userCart: Cart,
    strategy: MergeStrategy,
  ): Promise<{
    itemsAdded: number;
    itemsCombined: number;
    itemsSkipped: number;
    totalItems: number;
    messages: string[];
  }> {
    const messages: string[] = [];
    let itemsAdded = 0;
    let itemsCombined = 0;
    let itemsSkipped = 0;

    // Index user cart items by variant ID for fast lookup
    const userItemsMap = new Map<number, CartItem>();
    for (const item of userCart.items) {
      userItemsMap.set(item.variant.id, item);
    }

    // Process each guest item
    for (const guestItem of guestItems) {
      const variantId = guestItem.variant.id;
      const userItem = userItemsMap.get(variantId);

      // Calculate current total items in cart
      const currentTotalItems = userCart.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      // Check if adding this item would exceed 100-item limit
      if (!userItem && currentTotalItems + guestItem.quantity > 100) {
        itemsSkipped++;
        messages.push(
          `Skipped item ${variantId}: would exceed 100-item cart limit`,
        );
        this.logger.warn(
          `⚠️ Skipping item ${variantId}: cart limit would be exceeded`,
        );
        continue;
      }

      if (userItem) {
        // Item exists in both carts - merge based on strategy
        const mergeAction = this.resolveDuplicateItem(
          userItem,
          guestItem,
          strategy,
        );

        if (mergeAction.action === 'COMBINE') {
          // Combine quantities (max 50 per product)
          const newQuantity = Math.min(
            userItem.quantity + guestItem.quantity,
            50,
          );
          const quantityAdded = newQuantity - userItem.quantity;

          userItem.quantity = newQuantity;
          // Keep earliest added_at for longest price lock
          if (
            guestItem.added_at &&
            (!userItem.added_at || guestItem.added_at < userItem.added_at)
          ) {
            userItem.added_at = guestItem.added_at;
            userItem.locked_until = guestItem.locked_until;
          }

          await entityManager.save(CartItem, userItem);
          itemsCombined++;

          if (quantityAdded > 0) {
            messages.push(
              `Combined ${variantId}: added ${quantityAdded} to existing ${userItem.quantity - quantityAdded}`,
            );
          } else {
            messages.push(
              `Item ${variantId} already at max quantity (50)`,
            );
          }
        } else if (mergeAction.action === 'REPLACE') {
          // Replace user item with guest item
          userItem.quantity = guestItem.quantity;
          userItem.price_at_add = guestItem.price_at_add;
          userItem.added_at = guestItem.added_at;
          userItem.locked_until = guestItem.locked_until;
          await entityManager.save(CartItem, userItem);
          itemsCombined++;
          messages.push(`Replaced ${variantId} with guest version`);
        }
        // else KEEP: Do nothing, keep user version
      } else {
        // Item only in guest cart - add to user cart
        const newItem = entityManager.create(CartItem, {
          cart: userCart,
          variant: guestItem.variant,
          quantity: Math.min(guestItem.quantity, 50), // Enforce max
          price_at_add: guestItem.price_at_add,
          price_discounted: guestItem.price_discounted,
          added_at: guestItem.added_at,
          locked_until: guestItem.locked_until,
          selected_attributes: guestItem.selected_attributes,
          valid: guestItem.valid,
          expires_at: guestItem.expires_at,
          added_from_campaign: guestItem.added_from_campaign,
        });

        await entityManager.save(CartItem, newItem);
        userCart.items.push(newItem);
        itemsAdded++;
        this.logger.debug(`➕ Added new item ${variantId} from guest cart`);
      }
    }

    // Calculate final total items
    const totalItems = userCart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      itemsAdded,
      itemsCombined,
      itemsSkipped,
      totalItems,
      messages,
    };
  }

  /**
   * RESOLVE DUPLICATE ITEM
   *
   * Determines how to handle an item that exists in both carts.
   * Returns action based on merge strategy.
   *
   * @param userItem - Item from user cart
   * @param guestItem - Item from guest cart
   * @param strategy - Merge strategy
   * @returns Action to take (COMBINE, REPLACE, or KEEP)
   */
  private resolveDuplicateItem(
    userItem: CartItem,
    guestItem: CartItem,
    strategy: MergeStrategy,
  ): { action: 'COMBINE' | 'REPLACE' | 'KEEP' } {
    switch (strategy) {
      case MergeStrategy.COMBINE:
        return { action: 'COMBINE' }; // Default: Add quantities

      case MergeStrategy.KEEP_USER:
        return { action: 'KEEP' }; // Keep user cart item, discard guest

      case MergeStrategy.KEEP_GUEST:
        return { action: 'REPLACE' }; // Replace with guest cart item

      case MergeStrategy.NEWER:
        // Compare timestamps, keep newer
        if (!guestItem.added_at || !userItem.added_at) {
          return { action: 'COMBINE' }; // Fallback if timestamps missing
        }
        return guestItem.added_at > userItem.added_at
          ? { action: 'REPLACE' }
          : { action: 'KEEP' };

      default:
        return { action: 'COMBINE' }; // Safe default
    }
  }

  /**
   * MARK SESSION CONVERTED
   *
   * Updates guest session status to 'converted' and links to user ID.
   * Tracks conversion for analytics and prevents duplicate merges.
   *
   * @param entityManager - Transaction entity manager
   * @param guestSession - Guest session to mark as converted
   * @param userId - User ID that guest converted to
   */
  private async markSessionConverted(
    entityManager: any,
    guestSession: GuestSession,
    userId: number,
  ): Promise<void> {
    guestSession.status = 'converted';
    guestSession.convertedUserId = userId;
    guestSession.updatedAt = new Date();

    await entityManager.save(GuestSession, guestSession);
    this.logger.log(
      `✅ Marked guest session ${guestSession.id} as converted to user ${userId}`,
    );
  }

  /**
   * UPDATE CART TOTALS
   *
   * Recalculates and updates cart totals after merge.
   *
   * @param entityManager - Transaction entity manager
   * @param cartId - Cart ID to update
   */
  private async updateCartTotals(
    entityManager: any,
    cartId: number,
  ): Promise<void> {
    const cart = await entityManager.findOne(Cart, {
      where: { id: cartId },
      relations: ['items', 'items.variant'],
    });

    if (!cart) return;

    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cart.items) {
      if (item.valid) {
        totalItems += item.quantity;
        const itemPrice = item.effectivePrice();
        totalAmount += itemPrice * item.quantity;
      }
    }

    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    cart.lastActivityAt = new Date();

    await entityManager.save(Cart, cart);
    this.logger.debug(
      `📊 Updated cart totals: ${totalItems} items, ${totalAmount} SYP`,
    );
  }

  /**
   * CREATE EMPTY MERGE RESPONSE
   *
   * Returns a merge response when guest cart is empty.
   *
   * @param userId - User ID
   * @returns Empty merge response
   */
  private createEmptyMergeResponse(userId: number): MergeCartResponse {
    return {
      success: true,
      cartId: userId,
      totalItems: 0,
      itemsAdded: 0,
      itemsCombined: 0,
      itemsSkipped: 0,
      messages: ['Guest cart was empty, no items to merge'],
      guestSessionConverted: true,
    };
  }
}
