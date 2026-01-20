/**
 * @file wishlist.controller.ts
 * @description Wishlist Management Controller for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Add/remove products from wishlist
 * - View user wishlist with product details
 * - Move wishlist items to cart
 * - Share wishlist items publicly
 * - Wishlist analytics for admins
 *
 * ENDPOINTS:
 * - POST /wishlist - Add product to wishlist
 * - GET /wishlist - Get user wishlist
 * - DELETE /wishlist/:productId - Remove from wishlist
 * - POST /wishlist/:id/move-to-cart - Move to cart
 * - PATCH /wishlist/:id/share - Generate share token
 * - GET /public/wishlist/:shareToken - Public view
 * - GET /admin/wishlist/analytics - Admin analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { WishlistService } from '../service/wishlist.service';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';

@ApiTags('❤️ Wishlist Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  private readonly logger = new Logger(WishlistController.name);

  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * ADD PRODUCT TO WISHLIST
   *
   * Adds a product or specific variant to the user's wishlist
   * Prevents duplicate entries and validates product availability
   */
  @Post()
  @ApiOperation({
    summary: 'Add product to wishlist',
    description:
      "Adds a product or specific product variant to the authenticated user's wishlist with duplicate prevention",
  })
  @ApiBody({
    type: CreateWishlistDto,
    description: 'Product and optional variant to add to wishlist',
    examples: {
      addProduct: {
        summary: 'Add product to wishlist',
        value: {
          productId: 123,
        },
      },
      addProductVariant: {
        summary: 'Add specific product variant to wishlist',
        value: {
          productId: 123,
          productVariantId: 456,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Product added to wishlist successfully',
    schema: {
      example: {
        id: 789,
        product: {
          id: 123,
          nameEn: 'Samsung Galaxy S24',
          nameAr: 'سامسونج جالاكسي إس 24',
          slug: 'samsung-galaxy-s24',
        },
        productVariant: {
          id: 456,
          sku: 'SGS24-128GB-BLACK',
          price: 2750000,
          currency: 'SYP',
          attributeValues: {
            color: 'Black',
            storage: '128GB',
          },
        },
        createdAt: '2025-08-08T15:30:00.000Z',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Product already exists in wishlist',
    schema: {
      example: {
        message: 'Already in wishlist',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product or variant not found',
    schema: {
      example: {
        message: 'Product not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async addToWishlist(
    @CurrentUser() user: User,
    @Body() createWishlistDto: CreateWishlistDto,
  ) {
    this.logger.log(
      `Adding product ${createWishlistDto.productId} to wishlist for user ${user.id}`,
    );

    const wishlistItem = await this.wishlistService.addToWishlist(
      user,
      createWishlistDto.productId,
      createWishlistDto.productVariantId,
    );

    return {
      message: 'Product added to wishlist successfully',
      data: wishlistItem,
      addedAt: new Date(),
    };
  }

  /**
   * GET USER WISHLIST
   *
   * Retrieves all wishlist items for the authenticated user
   * Includes complete product and variant details for frontend display
   */
  @Get()
  @ApiOperation({
    summary: 'Get user wishlist',
    description:
      'Retrieves all wishlist items for the authenticated user with complete product and variant details',
  })
  @ApiOkResponse({
    description: 'Wishlist retrieved successfully',
    schema: {
      example: {
        wishlist: [
          {
            id: 789,
            product: {
              id: 123,
              nameEn: 'Samsung Galaxy S24',
              nameAr: 'سامسونج جالاكسي إس 24',
              slug: 'samsung-galaxy-s24',
              mainImage: 'https://example.com/images/galaxy-s24.jpg',
            },
            productVariant: {
              id: 456,
              sku: 'SGS24-128GB-BLACK',
              price: 2750000,
              currency: 'SYP',
              attributeValues: {
                color: 'Black',
                storage: '128GB',
              },
              inStock: true,
            },
            addedAt: '2025-08-08T15:30:00.000Z',
          },
        ],
        total: 1,
        isEmpty: false,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getUserWishlist(@CurrentUser() user: User) {
    this.logger.log(`Retrieving wishlist for user ${user.id}`);

    const wishlistItems = await this.wishlistService.getWishlist(user);

    return {
      wishlist: wishlistItems,
      total: wishlistItems.length,
      isEmpty: wishlistItems.length === 0,
      retrievedAt: new Date(),
    };
  }

  /**
   * REMOVE FROM WISHLIST
   *
   * Removes a product or specific variant from the user's wishlist
   * Supports both product-level and variant-level removal
   */
  @Delete(':productId')
  @ApiOperation({
    summary: 'Remove product from wishlist',
    description:
      "Removes a product or specific product variant from the authenticated user's wishlist",
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to remove',
    example: 123,
  })
  @ApiQuery({
    name: 'productVariantId',
    required: false,
    type: Number,
    description:
      'Optional: Specific variant ID to remove (if not provided, removes entire product)',
    example: 456,
  })
  @ApiOkResponse({
    description: 'Product removed from wishlist successfully',
    schema: {
      example: {
        message: 'Product removed from wishlist successfully',
        removedProduct: {
          productId: 123,
          productVariantId: 456,
        },
        removedAt: '2025-08-08T15:45:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Wishlist item not found',
    schema: {
      example: {
        message: 'Wishlist item not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Param('productId') productId: number,
    @Query('productVariantId') productVariantId?: number,
  ) {
    this.logger.log(
      `Removing product ${productId} (variant: ${productVariantId || 'none'}) from wishlist for user ${user.id}`,
    );

    await this.wishlistService.removeFromWishlist(
      user,
      Number(productId),
      productVariantId ? Number(productVariantId) : undefined,
    );

    return {
      message: 'Product removed from wishlist successfully',
      removedProduct: {
        productId: Number(productId),
        productVariantId: productVariantId ? Number(productVariantId) : null,
      },
      removedAt: new Date(),
    };
  }

  /**
   * MOVE WISHLIST ITEM TO CART
   *
   * Moves a wishlist item to the user's cart and removes it from the wishlist
   * Requires the item to have a product variant for cart compatibility
   */
  @Post(':id/move-to-cart')
  @ApiOperation({
    summary: 'Move wishlist item to cart',
    description:
      "Moves a wishlist item to the user's shopping cart with specified quantity and removes it from wishlist",
  })
  @ApiParam({
    name: 'id',
    description: 'Wishlist item ID to move to cart',
    example: 789,
  })
  @ApiQuery({
    name: 'quantity',
    required: false,
    type: Number,
    description: 'Quantity to add to cart (default: 1)',
    example: 2,
  })
  @ApiOkResponse({
    description: 'Wishlist item moved to cart successfully',
    schema: {
      example: {
        message: 'Item moved to cart successfully',
        movedItem: {
          wishlistItemId: 789,
          productId: 123,
          productVariantId: 456,
          quantity: 2,
        },
        cartUpdated: true,
        movedAt: '2025-08-08T16:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Wishlist item not found or has no variant',
    schema: {
      examples: {
        itemNotFound: {
          summary: 'Wishlist item not found',
          value: {
            message: 'Wishlist item not found',
            error: 'Not Found',
            statusCode: 404,
          },
        },
        noVariant: {
          summary: 'Item has no product variant',
          value: {
            message: 'Wishlist item has no associated product variant',
            error: 'Not Found',
            statusCode: 404,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async moveWishlistItemToCart(
    @CurrentUser() user: User,
    @Param('id') wishlistItemId: number,
    @Query('quantity') quantity: number = 1,
  ) {
    this.logger.log(
      `Moving wishlist item ${wishlistItemId} to cart for user ${user.id} with quantity ${quantity}`,
    );

    const result = await this.wishlistService.moveToCart(
      user,
      Number(wishlistItemId),
      quantity ? Number(quantity) : 1,
    );

    return {
      message: 'Item moved to cart successfully',
      movedItem: {
        wishlistItemId: Number(wishlistItemId),
        quantity: Number(quantity) || 1,
      },
      cartUpdated: result.success,
      movedAt: new Date(),
    };
  }

  /**
   * GENERATE SHARE TOKEN
   *
   * Generates a public share token for a wishlist item
   * Allows the owner to share specific wishlist items publicly
   */
  @Patch(':id/share')
  @ApiOperation({
    summary: 'Generate share token for wishlist item',
    description:
      'Generates a public share token that allows viewing the wishlist item without authentication',
  })
  @ApiParam({
    name: 'id',
    description: 'Wishlist item ID to generate share token for',
    example: 789,
  })
  @ApiOkResponse({
    description: 'Share token generated successfully',
    schema: {
      example: {
        shareToken: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        shareUrl:
          'https://souqsyria.com/wishlist/shared/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        expiresAt: null,
        generatedAt: '2025-08-08T16:15:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Wishlist item not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async generateShareToken(
    @CurrentUser() user: User,
    @Param('id') wishlistItemId: number,
  ) {
    this.logger.log(
      `Generating share token for wishlist item ${wishlistItemId} by user ${user.id}`,
    );

    const shareToken = await this.wishlistService.generateShareToken(
      user,
      Number(wishlistItemId),
    );

    return {
      shareToken,
      shareUrl: `https://souqsyria.com/wishlist/shared/${shareToken}`,
      expiresAt: null, // TODO: Add expiration if needed
      generatedAt: new Date(),
    };
  }

  /**
   * VIEW SHARED WISHLIST ITEM
   *
   * Public endpoint to view a wishlist item via share token
   * No authentication required - accessible to anyone with the token
   */
  @Get('/shared/:shareToken')
  @ApiOperation({
    summary: 'View shared wishlist item',
    description:
      'View a wishlist item using a public share token (no authentication required)',
  })
  @ApiParam({
    name: 'shareToken',
    description: 'Public share token for the wishlist item',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOkResponse({
    description: 'Shared wishlist item retrieved successfully',
    schema: {
      example: {
        item: {
          id: 789,
          product: {
            id: 123,
            nameEn: 'Samsung Galaxy S24',
            nameAr: 'سامسونج جالاكسي إس 24',
            slug: 'samsung-galaxy-s24',
            mainImage: 'https://example.com/images/galaxy-s24.jpg',
          },
          productVariant: {
            id: 456,
            sku: 'SGS24-128GB-BLACK',
            price: 2750000,
            currency: 'SYP',
          },
          sharedAt: '2025-08-08T16:15:00.000Z',
        },
        isPublicView: true,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Shared wishlist item not found or token invalid',
  })
  async getSharedWishlistItem(@Param('shareToken') shareToken: string) {
    this.logger.log(`Accessing shared wishlist item with token: ${shareToken}`);

    const wishlistItem =
      await this.wishlistService.getWishlistByShareToken(shareToken);

    return {
      item: wishlistItem,
      isPublicView: true,
      viewedAt: new Date(),
    };
  }
}

/**
 * ADMIN WISHLIST CONTROLLER
 *
 * Separate controller for admin-only wishlist analytics
 */
@ApiTags('🛡️ Admin Wishlist Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/wishlist')
export class AdminWishlistController {
  private readonly logger = new Logger(AdminWishlistController.name);

  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * GET WISHLIST ANALYTICS
   *
   * Admin endpoint for wishlist statistics and insights
   * Provides data for admin dashboards and business intelligence
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get wishlist analytics (admin only)',
    description:
      'Provides comprehensive wishlist statistics including total wishlists, top products, and active users',
  })
  @ApiOkResponse({
    description: 'Wishlist analytics retrieved successfully',
    schema: {
      example: {
        analytics: {
          totalWishlists: 15420,
          activeUsers: 3245,
          topProducts: [
            {
              productId: 123,
              count: 456,
              product: {
                nameEn: 'Samsung Galaxy S24',
                nameAr: 'سامسونج جالاكسي إس 24',
              },
            },
          ],
          trends: {
            thisMonth: 1234,
            lastMonth: 1156,
            growthRate: 6.7,
          },
        },
        generatedAt: '2025-08-08T16:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated or insufficient permissions',
  })
  async getWishlistAnalytics() {
    this.logger.log('Generating wishlist analytics for admin dashboard');

    const analytics = await this.wishlistService.getWishlistAnalytics();

    return {
      analytics,
      generatedAt: new Date(),
    };
  }
}
