/**
 * @file cart.controller.ts
 * @description Enhanced Cart Controller for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - RESTful API endpoints for shopping cart management
 * - User authentication and authorization
 * - Input validation and error handling
 * - Comprehensive Swagger documentation
 * - Audit logging integration
 *
 * ENDPOINTS:
 * - GET /cart - Retrieve user's current cart
 * - POST /cart/add - Add item to cart
 * - DELETE /cart/item/:variantId - Remove specific item
 * - DELETE /cart/clear - Clear entire cart
 *
 * @author SouqSyria Development Team
 * @since 2025-08-07
 * @version 2.0.0
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Headers,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CartRateLimitGuard, RateLimit } from '../guards/cart-rate-limit.guard';
import { CartService } from '../service/cart.service';
import { CartSyncService } from '../service/cart-sync.service';
import { CartMergeService } from '../service/cart-merge.service';
import { CartValidationService } from '../service/cart-validation.service';
import { CreateCartItemDto } from '../dto/CreateCartItem.dto';
import { SyncCartRequest } from '../dto/SyncCartRequest.dto';
import {
  MergeCartRequest,
  MergeCartResponse,
} from '../dto/MergeCartRequest.dto';
import { ValidateCartResponse } from '../dto/ValidateCartResponse.dto';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';

@ApiTags('🛒 Shopping Cart')
@ApiBearerAuth()
@UseGuards(CartRateLimitGuard, PermissionsGuard)
@RateLimit({
  maxRequests: 100,
  windowSizeInSeconds: 3600,
  message: 'Too many cart requests. Please wait before trying again.',
})
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(
    private readonly cartService: CartService,
    private readonly cartSyncService: CartSyncService,
    private readonly cartMergeService: CartMergeService,
    private readonly cartValidationService: CartValidationService,
  ) {}

  /**
   * GET USER CART
   *
   * Retrieves the current user's shopping cart with all items,
   * validates item availability, and returns cart summary.
   */
  @Get()
  @ApiOperation({
    summary: 'Get current user shopping cart',
    description:
      'Retrieves user cart with validated items, stock status, and totals',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully with all items and totals',
    schema: {
      example: {
        id: 123,
        userId: 456,
        currency: 'SYP',
        totalItems: 3,
        totalAmount: 125000,
        status: 'active',
        items: [
          {
            id: 789,
            quantity: 2,
            price_at_add: 50000,
            valid: true,
            variant: {
              id: 101,
              name: 'iPhone 14 - 128GB - Blue',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async getCart(@CurrentUser() user: UserFromToken) {
    this.logger.log(`📋 Fetching cart for user ID: ${user.id}`);
    return this.cartService.getOrCreateCart(user);
  }

  /**
   * ADD ITEM TO CART
   *
   * Adds a product variant to the user's cart with stock validation
   * and comprehensive business rule checks.
   */
  @Post('add')
  @RateLimit({
    maxRequests: 20,
    windowSizeInSeconds: 300,
    penaltyDelayMs: 1000,
    message:
      'Too many add-to-cart requests. Please wait 5 minutes before adding more items.',
  })
  @ApiOperation({
    summary: 'Add product item to cart',
    description:
      'Adds product variant to cart with stock validation and price tracking',
  })
  @ApiBody({
    type: CreateCartItemDto,
    description: 'Cart item details to add',
    examples: {
      basic: {
        summary: 'Basic cart item',
        value: {
          variant_id: 123,
          quantity: 2,
          currency: 'SYP',
        },
      },
      withDiscount: {
        summary: 'Item with discount',
        value: {
          variant_id: 456,
          quantity: 1,
          price_discounted: 45000,
          added_from_campaign: 'summer_sale_2025',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    schema: {
      example: {
        id: 123,
        totalItems: 4,
        totalAmount: 175000,
        currency: 'SYP',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient stock',
    schema: {
      example: {
        message: 'Not enough stock. Available: 5, Requested: 10',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product variant not found',
  })
  async addItem(
    @CurrentUser() user: UserFromToken,
    @Body() dto: CreateCartItemDto,
  ) {
    this.logger.log(
      `🛒 User ${user.id} adding variant ${dto.variant_id} to cart`,
    );
    return this.cartService.addItemToCart(user, dto);
  }

  /**
   * UPDATE CART ITEM QUANTITY (IDEMPOTENT)
   *
   * Updates the quantity of a specific cart item to an ABSOLUTE value.
   * This endpoint is idempotent - sending the same quantity multiple times
   * results in the same final state (not incremental).
   *
   * Example: PUT with quantity=5 three times → final quantity is 5 (not 15)
   */
  @Put('item/:itemId')
  @RateLimit({
    maxRequests: 30,
    windowSizeInSeconds: 300,
    message:
      'Too many update requests. Please wait before updating cart items again.',
  })
  @ApiOperation({
    summary: 'Update cart item quantity (idempotent)',
    description:
      'Sets the cart item quantity to an ABSOLUTE value (not incremental). ' +
      'This endpoint is idempotent - sending the same request multiple times produces the same result. ' +
      'Example: PUT with quantity=5 three times results in quantity=5 (not 15). ' +
      'If quantity is 0, the item is removed from cart.',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Cart item ID to update',
    type: 'integer',
    example: 789,
  })
  @ApiBody({
    description: 'New absolute quantity for the cart item',
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'integer',
          minimum: 0,
          maximum: 50,
          example: 5,
          description:
            'Absolute quantity (0 to remove item, 1-50 to set quantity)',
        },
      },
      required: ['quantity'],
    },
    examples: {
      'Set quantity to 5': {
        value: {
          quantity: 5,
        },
      },
      'Remove item (set to 0)': {
        value: {
          quantity: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Cart item quantity updated successfully (idempotent operation)',
    schema: {
      example: {
        id: 789,
        cartId: 123,
        variantId: 456,
        quantity: 5,
        price_at_add: 125000,
        valid: true,
        addedAt: '2025-11-12T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid quantity or exceeds maximum (50 per item)',
    schema: {
      example: {
        message: 'Quantity cannot exceed 50 per item',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cart item not found',
    schema: {
      example: {
        message: 'Cart item 789 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async updateItemQuantity(
    @CurrentUser() user: UserFromToken,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    this.logger.log(
      `🔄 User ${user.id} updating cart item ${itemId} to quantity ${quantity}`,
    );

    // Validate quantity range
    if (quantity < 0) {
      throw new NotFoundException('Quantity cannot be negative');
    }

    if (quantity > 50) {
      throw new NotFoundException('Quantity cannot exceed 50 per item');
    }

    return this.cartService.updateCartItem(itemId, { quantity });
  }

  /**
   * REMOVE ITEM FROM CART
   *
   * Removes a specific product variant from the user's cart
   * and updates cart totals accordingly.
   */
  @Delete('item/:variantId')
  @RateLimit({
    maxRequests: 25,
    windowSizeInSeconds: 300,
    message:
      'Too many remove requests. Please wait before removing more items.',
  })
  @ApiOperation({
    summary: 'Remove specific item from cart',
    description: 'Removes cart item by variant ID and updates cart totals',
  })
  @ApiParam({
    name: 'variantId',
    description: 'Product variant ID to remove from cart',
    type: 'integer',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found in cart',
    schema: {
      example: {
        message: 'Item not found in cart',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async removeItem(
    @CurrentUser() user: UserFromToken,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    this.logger.log(
      `🗑️ User ${user.id} removing variant ${variantId} from cart`,
    );
    return this.cartService.removeItem(user, variantId);
  }

  /**
   * UNDO REMOVE ITEM
   *
   * Restores a soft-deleted cart item within the 5-second undo window.
   */
  @Post('item/:itemId/undo-remove')
  @RateLimit({
    maxRequests: 25,
    windowSizeInSeconds: 300,
    message: 'Too many undo requests. Please wait before trying again.',
  })
  @ApiOperation({
    summary: 'Undo remove cart item (5s window)',
    description:
      'Restores a recently removed cart item within 5 seconds of removal. ' +
      'Returns 400 if the undo window has expired.',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Cart item ID returned from the remove operation',
    type: 'integer',
    example: 789,
  })
  @ApiResponse({
    status: 200,
    description: 'Item restored successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Undo window expired or item not removed',
    schema: {
      example: {
        message: 'Undo window has expired (5 seconds)',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cart item not found',
  })
  async undoRemoveItem(
    @CurrentUser() user: UserFromToken,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    this.logger.log(
      `↩️ User ${user.id} undoing remove for cart item ${itemId}`,
    );
    return this.cartService.undoRemoveItem(user, itemId);
  }

  /**
   * CLEAR ENTIRE CART
   *
   * Removes all items from the user's cart and resets totals to zero.
   * This action is irreversible and will be logged for audit purposes.
   */
  @Delete('clear')
  @RateLimit({
    maxRequests: 5,
    windowSizeInSeconds: 600,
    message:
      'Too many clear cart requests. Please wait 10 minutes before clearing your cart again.',
  })
  @ApiOperation({
    summary: 'Clear entire shopping cart',
    description:
      'Removes all items from cart and resets totals (irreversible action)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async clearCart(@CurrentUser() user: UserFromToken) {
    this.logger.log(`🧹 User ${user.id} clearing their entire cart`);
    return this.cartService.clearCart(user);
  }

  /**
   * SYNC AUTHENTICATED USER CART
   *
   * Synchronizes cart between client and server for multi-device support.
   * Uses last-write-wins algorithm based on timestamps for conflict resolution.
   */
  @Post('sync')
  @UseGuards(PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync authenticated user cart from client',
    description:
      'Multi-device cart synchronization with conflict resolution using last-write-wins algorithm. ' +
      'Supports offline-first PWA applications. Validates stock and updates prices if customer benefits. ' +
      'Returns updated cart with server state.',
  })
  @ApiBody({
    type: SyncCartRequest,
    description: 'Client cart state with version and timestamp',
    examples: {
      'Sync from mobile device': {
        value: {
          items: [
            { variantId: 1, quantity: 3, priceAtAdd: 50000 },
            { variantId: 8, quantity: 1, priceAtAdd: 75000 },
          ],
          clientVersion: 4,
          clientTimestamp: '2025-11-12T14:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cart synced successfully',
    schema: {
      example: {
        id: 123,
        userId: 456,
        currency: 'SYP',
        totalItems: 4,
        totalAmount: 225000,
        version: 5,
        items: [
          {
            id: 789,
            quantity: 3,
            price_at_add: 50000,
            valid: true,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Version conflict detected - client needs to resolve',
  })
  async syncCart(
    @CurrentUser() user: UserFromToken,
    @Body() syncRequest: SyncCartRequest,
  ) {
    this.logger.log(
      `🔄 User ${user.id} syncing cart, client version: ${syncRequest.clientVersion}`,
    );
    return this.cartSyncService.syncCart(user.id, syncRequest);
  }

  /**
   * MERGE GUEST CART INTO USER CART
   *
   * Merges guest cart items into user cart when user logs in.
   * Combines quantities for duplicate items, preserves price locks.
   */
  @Post('merge')
  @UseGuards(PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Merge guest cart into user cart on login',
    description:
      'Combines guest cart items with user cart when user logs in. ' +
      'Preserves price locks from both carts (customer always gets best price). ' +
      'Default strategy combines quantities for duplicate items. ' +
      'Guest session marked as converted after successful merge.',
  })
  @ApiBody({
    type: MergeCartRequest,
    description: 'Guest session ID and merge strategy',
    examples: {
      'Merge with default strategy': {
        value: {
          guestSessionId: '550e8400-e29b-41d4-a716-446655440000',
          strategy: 'combine',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Carts merged successfully',
    type: MergeCartResponse,
    schema: {
      example: {
        success: true,
        cartId: 123,
        totalItems: 8,
        itemsAdded: 3,
        itemsCombined: 2,
        itemsSkipped: 0,
        messages: [
          '3 new items added from guest cart',
          '2 items had quantities combined',
          'Guest session marked as converted',
        ],
        guestSessionConverted: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guest cart or user cart not found',
  })
  async mergeCart(
    @CurrentUser() user: UserFromToken,
    @Body() mergeRequest: MergeCartRequest,
  ): Promise<MergeCartResponse> {
    this.logger.log(
      `🔀 User ${user.id} merging guest cart ${mergeRequest.guestSessionId}`,
    );
    return this.cartMergeService.mergeGuestIntoUserCart(
      user.id,
      mergeRequest.guestSessionId,
      mergeRequest.strategy,
    );
  }

  /**
   * VALIDATE CART BEFORE CHECKOUT
   *
   * Validates all cart items for stock availability, price changes, and product status.
   * Auto-updates prices if customer benefits (price decreased).
   */
  @Post('validate')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Validate cart before checkout',
    description:
      'Checks stock availability, price changes, and product status for all cart items. ' +
      'Automatically updates prices if customer benefits (price decreased within 7-day lock period). ' +
      'Returns validation status with warnings for out-of-stock or price-increased items. ' +
      'Works for both authenticated users and guest sessions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation complete',
    type: ValidateCartResponse,
    schema: {
      example: {
        valid: true,
        warnings: [
          'Item "iPhone 14" price increased from 50000 to 52000 SYP (price lock preserved)',
        ],
        errors: [],
        totalItems: 8,
        totalAmount: 425000,
        validItems: 8,
        invalidItems: 0,
        outOfStockItems: [],
        priceChangedItems: [
          {
            variantId: 101,
            name: 'iPhone 14 - 128GB',
            oldPrice: 50000,
            newPrice: 52000,
            priceLocked: true,
          },
        ],
        canProceedToCheckout: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cart not found',
  })
  async validateCart(@Req() request: any): Promise<ValidateCartResponse> {
    this.logger.log(`✅ Validating cart before checkout`);

    // Extract user ID or guest session ID
    const userId = request.user?.id;
    const guestSessionId =
      request.guestSessionId || request.cookies?.guest_session_id;

    let cart;
    if (userId) {
      this.logger.log(`Validating cart for user ${userId}`);
      const userFromToken: UserFromToken = { id: userId } as UserFromToken;
      cart = await this.cartService.getOrCreateCart(userFromToken);
    } else if (guestSessionId) {
      this.logger.log(`Validating cart for guest session ${guestSessionId}`);
      cart = await this.cartService.findBySessionId(guestSessionId);
    }

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const validation = await this.cartValidationService.validateCart(cart);
    this.logger.log(
      `✅ Validation complete: ${validation.validItems}/${validation.totalItems} items valid`,
    );
    return validation;
  }
}
