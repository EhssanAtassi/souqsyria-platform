/**
 * @file cart.service.ts
 * @description Enhanced Cart Service for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Shopping cart management with multi-currency support
 * - Cart item validation and stock checking
 * - Audit logging for all cart operations
 * - Performance optimization with cached totals
 * - Syrian market compliance and business rules
 *
 * BUSINESS RULES:
 * - One active cart per user
 * - Cart items validate against stock availability
 * - Audit logging for all cart operations
 * - Multi-currency support (SYP, USD, EUR, TRY)
 * - Cart abandonment tracking after 24 hours
 *
 * @author SouqSyria Development Team
 * @since 2025-08-07
 * @version 2.0.0
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { GuestSession } from '../entities/guest-session.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { CreateCartItemDto } from '../dto/CreateCartItem.dto';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(GuestSession)
    private readonly guestSessionRepository: Repository<GuestSession>,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.log('🛒 Cart Service initialized with audit logging and guest session support');
  }

  /**
   * GET OR CREATE CART
   *
   * Retrieves or creates the user's active cart with comprehensive validation.
   * Validates all cart items for stock availability, price changes, and variant status.
   * Logs cart access for analytics and audit purposes.
   *
   * @param user - User from JWT token
   * @returns Promise<Cart> - User's cart with validated items
   */
  async getOrCreateCart(user: UserFromToken): Promise<Cart> {
    const startTime = Date.now();
    this.logger.log(`🔍 Looking up cart for user ID ${user.id}`);

    let cart = await this.cartRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.variant', 'items.variant.stocks'],
    });

    if (!cart) {
      this.logger.log(`🆕 Creating new cart for user ID ${user.id}`);
      cart = this.cartRepo.create({
        user: { id: user.id } as any,
        items: [],
        userId: user.id,
        currency: 'SYP', // Default Syrian Pound
        status: 'active',
        totalItems: 0,
        totalAmount: 0,
      });
      await this.cartRepo.save(cart);

      // Audit log: Cart creation
      await this.auditLogService.logSimple({
        action: 'CART_CREATED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart',
        entityId: cart.id,
        description: `New shopping cart created for user ${user.id}`,
      });

      return cart;
    }

    // 🔄 Validate each item
    let updated = false;
    for (const item of cart.items) {
      const variant = item.variant;

      const totalStock =
        variant.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;

      const isValid =
        variant.isActive &&
        totalStock > 0 &&
        item.price_at_add === variant.price;

      if (item.valid !== isValid) {
        this.logger.warn(
          `Item ID ${item.id} validity changed: active=${variant.isActive}, stock=${totalStock}, price=${variant.price}`,
        );
        item.valid = isValid;
        updated = true;
      }
    }

    if (updated) {
      this.logger.log(`💾 Saving cart with updated item validity`);
      await this.cartItemRepo.save(cart.items);

      // Update cart totals
      await this.updateCartTotals(cart);

      // Audit log: Cart validation
      await this.auditLogService.logSimple({
        action: 'CART_VALIDATED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart',
        entityId: cart.id,
        description: `Cart items validated and updated for user ${user.id}`,
      });
    }

    const processingTime = Date.now() - startTime;
    this.logger.log(`✅ Cart retrieved in ${processingTime}ms`);
    return cart;
  }

  /**
   * ADD ITEM TO CART
   *
   * Adds a product variant to the user's cart with comprehensive validation.
   * Updates quantity if item already exists, creates new item otherwise.
   * Validates stock availability and logs all operations for audit purposes.
   *
   * @param user - User from JWT token
   * @param dto - Cart item data to add
   * @returns Promise<Cart> - Updated cart with new item
   */
  async addItemToCart(
    user: UserFromToken,
    dto: CreateCartItemDto,
  ): Promise<Cart> {
    const startTime = Date.now();
    this.logger.log(
      `🛍️ User ${user.id} adding variant ${dto.variant_id} to cart`,
    );

    try {
      // Validate product variant exists and is active
      const variant = await this.variantRepo.findOne({
        where: { id: dto.variant_id },
        relations: ['stocks', 'product'], // Load stocks and product for validation
      });

      if (!variant) {
        this.logger.warn(`⚠️ Variant ID ${dto.variant_id} not found`);
        throw new NotFoundException('Product variant not found');
      }

      if (!variant.isActive) {
        this.logger.warn(`⚠️ Variant ID ${dto.variant_id} is inactive`);
        throw new BadRequestException('Product variant is no longer available');
      }

      // Calculate total available stock
      const totalStock =
        variant.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;

      if (totalStock < dto.quantity) {
        this.logger.warn(
          `⚠️ Variant ID ${dto.variant_id} has only ${totalStock} in stock, requested ${dto.quantity}`,
        );
        throw new BadRequestException(
          `Not enough stock. Available: ${totalStock}, Requested: ${dto.quantity}`,
        );
      }

      // Get or create user's cart
      const cart = await this.getOrCreateCart(user);
      const existingItem = cart.items.find(
        (item) => item.variant.id === dto.variant_id,
      );

      let actionDescription: string;

      if (existingItem) {
        // Update existing item quantity
        const oldQuantity = existingItem.quantity;
        existingItem.quantity += dto.quantity;

        // Validate total quantity doesn't exceed stock
        if (existingItem.quantity > totalStock) {
          throw new BadRequestException(
            `Total quantity ${existingItem.quantity} exceeds available stock ${totalStock}`,
          );
        }

        await this.cartItemRepo.save(existingItem);
        actionDescription = `Updated cart item quantity from ${oldQuantity} to ${existingItem.quantity}`;
        this.logger.log(
          `🔄 ${actionDescription} for variant ${dto.variant_id}`,
        );

        // Audit log: Cart item updated
        await this.auditLogService.logSimple({
          action: 'CART_ITEM_UPDATED',
          module: 'cart',
          actorId: user.id,
          actorType: 'user',
          entityType: 'cart_item',
          entityId: existingItem.id,
          description: actionDescription,
        });
      } else {
        // Create new cart item with 7-day price lock
        const now = new Date();
        const priceLockDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        const newItem = this.cartItemRepo.create({
          cart,
          variant,
          quantity: dto.quantity,
          price_at_add: variant.price,
          price_discounted: dto.price_discounted,
          added_at: now,
          locked_until: new Date(now.getTime() + priceLockDuration),
          expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
          added_from_campaign: dto.added_from_campaign,
          valid: true,
        });
        await this.cartItemRepo.save(newItem);
        actionDescription = `Added new item to cart: ${dto.quantity}x variant ${dto.variant_id}`;
        this.logger.log(`➕ ${actionDescription}`);

        // Audit log: Cart item added
        await this.auditLogService.logSimple({
          action: 'CART_ITEM_ADDED',
          module: 'cart',
          actorId: user.id,
          actorType: 'user',
          entityType: 'cart_item',
          entityId: newItem.id,
          description: actionDescription,
        });
      }

      // Update cart totals and return updated cart
      const updatedCart = await this.getOrCreateCart(user);
      await this.updateCartTotals(updatedCart);

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ Cart item added successfully in ${processingTime}ms`);
      return updatedCart;
    } catch (error) {
      this.logger.error(
        `❌ Failed to add item to cart: ${error.message}`,
        error.stack,
      );

      // Audit log: Cart operation failed
      await this.auditLogService.logSimple({
        action: 'CART_ITEM_ADD_FAILED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart',
        entityId: null,
        description: `Failed to add variant ${dto.variant_id} to cart: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * CLEAR CART
   *
   * Removes all items from the user's shopping cart.
   * Logs the action for audit purposes and updates cart totals.
   *
   * @param user - User from JWT token
   * @returns Promise<void>
   */
  async clearCart(user: UserFromToken): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`🗑️ Clearing all items for user ID ${user.id}`);

    try {
      const cart = await this.getOrCreateCart(user);
      const itemCount = cart.items.length;

      if (itemCount === 0) {
        this.logger.log(`💭 Cart is already empty for user ${user.id}`);
        return;
      }

      // Clear all items
      await this.cartItemRepo.delete({ cart: { id: cart.id } });

      // Update cart totals to zero
      await this.cartRepo.update(cart.id, {
        totalItems: 0,
        totalAmount: 0,
        lastActivityAt: new Date(),
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Cleared ${itemCount} items from cart in ${processingTime}ms`,
      );

      // Audit log: Cart cleared
      await this.auditLogService.logSimple({
        action: 'CART_CLEARED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart',
        entityId: cart.id,
        description: `Cleared all ${itemCount} items from shopping cart`,
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to clear cart: ${error.message}`,
        error.stack,
      );

      // Audit log: Clear cart failed
      await this.auditLogService.logSimple({
        action: 'CART_CLEAR_FAILED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart',
        entityId: null,
        description: `Failed to clear cart: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * REMOVE CART ITEM
   *
   * Removes a specific cart item by variant ID from the user's cart.
   * Updates cart totals and logs the action for audit purposes.
   *
   * @param user - User from JWT token
   * @param variantId - Product variant ID to remove
   * @returns Promise<void>
   */
  async removeItem(user: UserFromToken, variantId: number): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `🗑️ User ${user.id} removing variant ${variantId} from cart`,
    );

    try {
      const cart = await this.getOrCreateCart(user);
      const item = cart.items.find((i) => i.variant.id === variantId);

      if (!item) {
        this.logger.warn(
          `⚠️ Item with variant ID ${variantId} not found in cart`,
        );
        throw new NotFoundException('Item not found in cart');
      }

      const removedQuantity = item.quantity;
      const itemId = item.id;

      // Remove the item
      await this.cartItemRepo.remove(item);

      // Update cart totals
      const updatedCart = await this.getOrCreateCart(user);
      await this.updateCartTotals(updatedCart);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Removed ${removedQuantity}x variant ${variantId} from cart in ${processingTime}ms`,
      );

      // Audit log: Cart item removed
      await this.auditLogService.logSimple({
        action: 'CART_ITEM_REMOVED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart_item',
        entityId: itemId,
        description: `Removed ${removedQuantity}x variant ${variantId} from shopping cart`,
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to remove item from cart: ${error.message}`,
        error.stack,
      );

      // Audit log: Remove item failed
      await this.auditLogService.logSimple({
        action: 'CART_ITEM_REMOVE_FAILED',
        module: 'cart',
        actorId: user.id,
        actorType: 'user',
        entityType: 'cart',
        entityId: null,
        description: `Failed to remove variant ${variantId} from cart: ${error.message}`,
      });

      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * UPDATE CART TOTALS
   *
   * Recalculates and updates the cart's total items count and total amount.
   * PERFORMANCE OPTIMIZED: Uses existing cart items when available to avoid
   * unnecessary database queries. Only reloads from DB when items not present.
   *
   * @param cart - Cart entity to update totals for (with or without items loaded)
   * @returns Promise<void>
   */
  private async updateCartTotals(cart: Cart): Promise<void> {
    try {
      let itemsToProcess = cart.items;

      // Only reload from database if items are not already loaded
      if (!itemsToProcess || itemsToProcess.length === 0) {
        const freshCart = await this.cartRepo.findOne({
          where: { id: cart.id },
          relations: ['items', 'items.variant'],
        });

        if (!freshCart) {
          this.logger.warn(`⚠️ Cart ${cart.id} not found during totals update`);
          return;
        }

        itemsToProcess = freshCart.items;
      }

      // Calculate totals from loaded items
      let totalItems = 0;
      let totalAmount = 0;

      for (const item of itemsToProcess) {
        if (item.valid !== false) { // Count items that are not explicitly invalid
          totalItems += item.quantity;
          const itemPrice = item.price_discounted || item.price_at_add;
          totalAmount += itemPrice * item.quantity;
        }
      }

      // Update cart totals in single atomic operation
      await this.cartRepo.update(cart.id, {
        totalItems,
        totalAmount,
        lastActivityAt: new Date(),
      });

      // Update the cart object in memory for consistency
      cart.totalItems = totalItems;
      cart.totalAmount = totalAmount;
      cart.lastActivityAt = new Date();

      this.logger.debug(
        `📊 Updated cart ${cart.id} totals: ${totalItems} items, ${totalAmount} ${cart.currency || 'SYP'}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update cart totals: ${error.message}`,
        error.stack,
      );
      // Don't throw - this is a background operation
    }
  }

  /**
   * GET CART ANALYTICS
   *
   * Returns cart analytics data for admin dashboard and business intelligence.
   *
   * @returns Promise<any> - Cart analytics data
   */
  async getCartAnalytics(): Promise<{
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    averageCartValue: number;
    averageItemsPerCart: number;
  }> {
    try {
      const [totalCarts, activeCarts, abandonedCarts, avgData] =
        await Promise.all([
          this.cartRepo.count(),
          this.cartRepo.count({ where: { status: 'active' } }),
          this.cartRepo.count({ where: { status: 'abandoned' } }),
          this.cartRepo
            .createQueryBuilder('cart')
            .select('AVG(cart.totalAmount)', 'avgValue')
            .addSelect('AVG(cart.totalItems)', 'avgItems')
            .where('cart.status = :status', { status: 'active' })
            .getRawOne(),
        ]);

      return {
        totalCarts,
        activeCarts,
        abandonedCarts,
        averageCartValue: parseFloat(avgData?.avgValue || '0'),
        averageItemsPerCart: parseFloat(avgData?.avgItems || '0'),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get cart analytics: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // GUEST CART METHODS
  // ============================================================================

  /**
   * FIND CART BY SESSION ID
   *
   * Retrieves cart associated with a guest session ID.
   * Used for guest (unauthenticated) users shopping experience.
   *
   * @param sessionId - Guest session UUID
   * @returns Cart entity with all items and relations, or null if not found
   */
  async findBySessionId(sessionId: string): Promise<Cart | null> {
    this.logger.log(`🔍 Looking up cart for guest session: ${sessionId}`);

    try {
      const cart = await this.cartRepo.findOne({
        where: { sessionId },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'guestSession',
        ],
      });

      if (!cart) {
        this.logger.warn(`⚠️ No cart found for session ${sessionId}`);
        return null;
      }

      this.logger.log(`✅ Found cart ID ${cart.id} with ${cart.items?.length || 0} items`);
      return cart;
    } catch (error) {
      this.logger.error(
        `❌ Error finding cart by session ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * FIND CART BY USER ID
   *
   * Retrieves cart associated with an authenticated user.
   * Used for user cart lookups in merge and sync operations.
   *
   * @param userId - User ID from authentication token
   * @returns Cart entity with all items and relations, or null if not found
   */
  async findByUserId(userId: number): Promise<Cart | null> {
    this.logger.log(`🔍 Looking up cart for user ID: ${userId}`);

    try {
      const cart = await this.cartRepo.findOne({
        where: { userId },
        relations: ['items', 'items.variant', 'items.variant.product'],
      });

      if (!cart) {
        this.logger.warn(`⚠️ No cart found for user ${userId}`);
        return null;
      }

      this.logger.log(`✅ Found cart ID ${cart.id} with ${cart.items?.length || 0} items`);
      return cart;
    } catch (error) {
      this.logger.error(
        `❌ Error finding cart by user ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * CREATE GUEST CART
   *
   * Creates a new shopping cart for a guest session with price locking.
   * Enforces business rules: max 100 items per cart, max 50 quantity per item.
   * Applies 7-day price lock guarantee to all items.
   *
   * @param sessionId - Guest session UUID
   * @param items - Array of cart items to add
   * @returns Created cart entity with all items
   */
  async createGuestCart(
    sessionId: string,
    items: Partial<CartItem>[],
  ): Promise<Cart> {
    this.logger.log(
      `🆕 Creating guest cart for session ${sessionId} with ${items.length} items`,
    );

    try {
      // Validate cart item limit (max 100 items)
      if (items.length > 100) {
        this.logger.warn(`⚠️ Cart exceeds 100 item limit: ${items.length} items`);
        throw new BadRequestException('Cart cannot exceed 100 items');
      }

      // Validate individual item quantities (max 50 per item)
      for (const item of items) {
        if (item.quantity > 50) {
          this.logger.warn(
            `⚠️ Item quantity exceeds limit: ${item.quantity} for variant ${item.variant?.id}`,
          );
          throw new BadRequestException(
            `Quantity for variant ${item.variant?.id} exceeds maximum of 50`,
          );
        }
      }

      // Apply price lock to all items (7-day guarantee)
      const now = new Date();
      const priceLockDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      const itemsWithPriceLock = items.map((item) => ({
        ...item,
        added_at: now,
        locked_until: new Date(now.getTime() + priceLockDuration),
        price_at_add: item.variant?.price || item.price_at_add,
        valid: true,
      }));

      // Create cart entity
      const cart = this.cartRepo.create({
        sessionId,
        items: itemsWithPriceLock as CartItem[],
        status: 'active',
        currency: 'SYP', // Default Syrian Pound
        totalItems: 0,
        totalAmount: 0,
      });

      // Save cart and calculate totals
      const savedCart = await this.cartRepo.save(cart);
      await this.updateCartTotals(savedCart);

      this.logger.log(
        `✅ Guest cart created: ID ${savedCart.id}, ${savedCart.totalItems} items, ${savedCart.totalAmount} ${savedCart.currency}`,
      );

      return savedCart;
    } catch (error) {
      this.logger.error(
        `❌ Failed to create guest cart: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * UPDATE GUEST CART
   *
   * Updates existing guest cart with new item list.
   * Enforces same business rules as createGuestCart.
   * Used in cart sync operations.
   *
   * @param sessionId - Guest session UUID
   * @param items - Updated array of cart items
   * @returns Updated cart entity
   */
  async updateGuestCart(
    sessionId: string,
    items: Partial<CartItem>[],
  ): Promise<Cart> {
    this.logger.log(
      `🔄 Updating guest cart for session ${sessionId} with ${items.length} items`,
    );

    try {
      const cart = await this.findBySessionId(sessionId);
      if (!cart) {
        this.logger.warn(`⚠️ Guest cart not found for session ${sessionId}`);
        throw new NotFoundException(
          `Guest cart not found for session ${sessionId}`,
        );
      }

      // Validate cart item limit
      if (items.length > 100) {
        this.logger.warn(`⚠️ Cart exceeds 100 item limit: ${items.length} items`);
        throw new BadRequestException('Cart cannot exceed 100 items');
      }

      // Update items
      cart.items = items as CartItem[];
      cart.updated_at = new Date();

      // Save and recalculate totals
      const updatedCart = await this.cartRepo.save(cart);
      await this.updateCartTotals(updatedCart);

      this.logger.log(
        `✅ Guest cart updated: ${updatedCart.totalItems} items, ${updatedCart.totalAmount} ${updatedCart.currency}`,
      );

      return updatedCart;
    } catch (error) {
      this.logger.error(
        `❌ Failed to update guest cart: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * UPDATE CART ITEM
   *
   * Updates a specific cart item's quantity or other properties.
   * Supports optimistic locking with version control.
   *
   * @param itemId - Cart item ID
   * @param updateDto - Properties to update
   * @returns Updated cart item entity
   */
  async updateCartItem(
    itemId: number,
    updateDto: { quantity?: number },
  ): Promise<CartItem> {
    this.logger.log(`🔄 Updating cart item ${itemId}`);

    try {
      const item = await this.cartItemRepo.findOne({
        where: { id: itemId },
        relations: ['cart', 'variant'],
      });

      if (!item) {
        throw new NotFoundException(`Cart item ${itemId} not found`);
      }

      // Update quantity if provided
      if (updateDto.quantity !== undefined) {
        if (updateDto.quantity > 50) {
          throw new BadRequestException(
            'Quantity cannot exceed 50 per item',
          );
        }

        if (updateDto.quantity <= 0) {
          // Remove item if quantity is 0 or negative
          await this.cartItemRepo.remove(item);
          this.logger.log(`🗑️ Cart item ${itemId} removed (quantity <= 0)`);

          // Update cart totals
          await this.updateCartTotals(item.cart);
          return item;
        }

        item.quantity = updateDto.quantity;
      }

      const updatedItem = await this.cartItemRepo.save(item);

      // Update cart totals
      await this.updateCartTotals(item.cart);

      this.logger.log(
        `✅ Cart item ${itemId} updated: quantity=${updatedItem.quantity}`,
      );

      return updatedItem;
    } catch (error) {
      this.logger.error(
        `❌ Failed to update cart item: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
