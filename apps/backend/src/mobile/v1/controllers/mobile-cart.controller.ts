import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  MobileCartService,
  QuickAddRequest,
  UpdateCartItemRequest,
} from '../services/mobile-cart.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

/**
 * Mobile Cart Controller
 *
 * Provides optimized cart operations for mobile applications
 * with quick actions, lightweight responses, and mobile-specific features.
 */
@ApiTags('📱 Mobile Cart API v1')
@Controller('api/mobile/v1/cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MobileCartController {
  constructor(private readonly mobileCartService: MobileCartService) {}

  /**
   * GET /api/mobile/v1/cart
   * Get mobile-optimized cart summary with all items and calculations
   */
  @Get()
  @ApiOperation({
    summary: 'Get mobile cart summary',
    description:
      'Retrieves complete cart information optimized for mobile apps with pricing, shipping options, and payment methods.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    schema: {
      example: {
        id: 456,
        userId: 123,
        items: [
          {
            id: 789,
            productId: 123,
            productSlug: 'samsung-galaxy-s24',
            productName: {
              en: 'Samsung Galaxy S24',
              ar: 'سامسونج جالاكسي إس 24',
            },
            productImage: {
              original: 'https://cdn.souqsyria.com/products/galaxy-s24.jpg',
              thumbnail:
                'https://cdn.souqsyria.com/optimized/galaxy-s24_thumbnail_150x150.webp',
              medium:
                'https://cdn.souqsyria.com/optimized/galaxy-s24_medium_400x400.webp',
              large:
                'https://cdn.souqsyria.com/optimized/galaxy-s24_large_800x800.webp',
            },
            pricing: {
              unitPrice: 2750000,
              totalPrice: 5500000,
              currency: 'SYP',
            },
            quantity: 2,
            maxQuantity: 15,
            availability: {
              inStock: true,
            },
            vendor: {
              id: 10,
              businessName: 'TechSyria Store',
            },
          },
        ],
        summary: {
          itemCount: 2,
          subtotal: 5500000,
          discount: 0,
          shipping: 75000,
          tax: 605000,
          total: 6180000,
          currency: 'SYP',
        },
        shipping: {
          methods: [
            {
              id: 'standard',
              name: 'Standard Shipping',
              cost: 75000,
              estimatedDays: 3,
            },
          ],
        },
        payment: {
          methods: [
            {
              id: 'cod',
              name: 'Cash on Delivery',
              type: 'cod',
              available: true,
            },
          ],
        },
      },
    },
  })
  async getMobileCart(@Request() req) {
    const userId = req.user.id;
    return await this.mobileCartService.getMobileCart(userId);
  }

  /**
   * POST /api/mobile/v1/cart/quick-add
   * Quick add product to cart (mobile-optimized)
   */
  @Post('quick-add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick add product to cart',
    description:
      'Quickly add a product to cart with minimal data exchange. Perfect for mobile "Add to Cart" buttons.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: { type: 'number', example: 123 },
        variantId: {
          type: 'number',
          example: 456,
          description: 'Optional product variant ID',
        },
        quantity: { type: 'number', example: 1, default: 1 },
        deviceId: {
          type: 'string',
          example: 'device-uuid-123',
          description: 'Device identifier for analytics',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product added to cart successfully',
    schema: {
      example: {
        success: true,
        cartItemCount: 3,
        message: 'Product added to cart successfully',
      },
    },
  })
  async quickAddToCart(@Request() req, @Body() request: QuickAddRequest) {
    const userId = req.user.id;
    return await this.mobileCartService.quickAddToCart(userId, request);
  }

  /**
   * PUT /api/mobile/v1/cart/items/:itemId
   * Update cart item quantity
   */
  @Put('items/:itemId')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description:
      'Update quantity of a specific cart item. Set quantity to 0 to remove item.',
  })
  @ApiParam({ name: 'itemId', type: 'number', description: 'Cart item ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['quantity'],
      properties: {
        quantity: {
          type: 'number',
          example: 2,
          description: 'New quantity (0 to remove)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Cart updated successfully',
      },
    },
  })
  async updateCartItem(
    @Request() req,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() request: UpdateCartItemRequest,
  ) {
    const userId = req.user.id;
    return await this.mobileCartService.updateCartItem(userId, itemId, request);
  }

  /**
   * DELETE /api/mobile/v1/cart
   * Clear entire cart
   */
  @Delete()
  @ApiOperation({
    summary: 'Clear entire cart',
    description: 'Remove all items from the cart.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
    schema: {
      example: {
        success: true,
        message: 'Cart cleared successfully',
      },
    },
  })
  async clearCart(@Request() req) {
    const userId = req.user.id;
    return await this.mobileCartService.clearCart(userId);
  }
}
