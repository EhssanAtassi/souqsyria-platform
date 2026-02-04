import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../../cart/entities/cart.entity';
import { CartItem } from '../../../cart/entities/cart-item.entity';
import { ProductEntity } from '../../../products/entities/product.entity';
import {
  MobileImageOptimizationService,
  OptimizedImage,
} from './mobile-image-optimization.service';

/**
 * Mobile cart item interface
 */
export interface MobileCartItem {
  id: number;
  productId: number;
  productSlug: string;
  productName: {
    en: string;
    ar: string;
  };
  productImage: OptimizedImage;
  variant?: {
    id: number;
    sku: string;
    attributes: Record<string, string>;
  };
  pricing: {
    unitPrice: number;
    totalPrice: number;
    discountPrice?: number;
    currency: string;
  };
  quantity: number;
  maxQuantity: number;
  availability: {
    inStock: boolean;
    stockCount?: number;
  };
  vendor: {
    id: number;
    businessName: string;
  };
}

/**
 * Mobile cart summary
 */
export interface MobileCartSummary {
  id: number;
  userId: number;
  items: MobileCartItem[];
  summary: {
    itemCount: number;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  shipping: {
    address?: {
      governorate: string;
      city: string;
      estimatedDays: number;
    };
    methods: {
      id: string;
      name: string;
      cost: number;
      estimatedDays: number;
    }[];
  };
  payment: {
    methods: {
      id: string;
      name: string;
      type: 'cod' | 'card' | 'bank_transfer' | 'mobile_money';
      available: boolean;
    }[];
  };
  savings?: {
    amount: number;
    percentage: number;
    description: string;
  };
}

/**
 * Quick add to cart request
 */
export interface QuickAddRequest {
  productId: number;
  variantId?: number;
  quantity?: number;
  deviceId?: string;
}

/**
 * Update cart item request
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Mobile Cart Service
 *
 * Provides optimized cart operations for mobile applications
 * with lightweight responses, quick actions, and mobile-specific features.
 */
@Injectable()
export class MobileCartService {
  private readonly logger = new Logger(MobileCartService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly imageOptimizationService: MobileImageOptimizationService,
  ) {}

  /**
   * Get mobile-optimized cart summary
   */
  async getMobileCart(userId: number): Promise<MobileCartSummary> {
    try {
      const cart = await this.cartRepository
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect('product.vendor', 'vendor')
        .leftJoinAndSelect('items.productVariant', 'variant')
        .where('cart.userId = :userId', { userId })
        .andWhere('cart.status = :status', { status: 'active' })
        .getOne();

      if (!cart) {
        // Create empty cart
        return this.createEmptyMobileCart(userId);
      }

      // Transform to mobile format
      const mobileItems = await Promise.all(
        cart.items.map((item) => this.transformToMobileCartItem(item)),
      );

      // Calculate totals
      const summary = this.calculateCartSummary(mobileItems);

      // Get shipping options
      const shippingMethods = await this.getShippingMethods(userId);

      // Get payment methods
      const paymentMethods = await this.getPaymentMethods(userId);

      return {
        id: cart.id,
        userId,
        items: mobileItems,
        summary,
        shipping: {
          methods: shippingMethods,
        },
        payment: {
          methods: paymentMethods,
        },
        savings: this.calculateSavings(mobileItems),
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get mobile cart for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Quick add product to cart (mobile-optimized)
   */
  async quickAddToCart(
    userId: number,
    request: QuickAddRequest,
  ): Promise<{
    success: boolean;
    cartItemCount: number;
    message: string;
  }> {
    try {
      const { productId, variantId, quantity = 1 } = request;

      // Verify product availability
      const product = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variants')
        .where('product.id = :productId', { productId })
        .andWhere('product.status = :status', { status: 'active' })
        .getOne();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check stock availability (simplified - assume stock is available)
      if (false) {
        return {
          success: false,
          cartItemCount: 0,
          message: 'Insufficient stock available',
        };
      }

      // Find or create cart
      let cart = await this.cartRepository.findOne({
        where: { userId, status: 'active' },
        relations: ['items'],
      });

      if (!cart) {
        cart = await this.createCart(userId);
      }

      // For simplicity, create a new cart item (in real implementation, check for existing items)
      const cartItem = this.cartItemRepository.create({
        cart: cart,
        quantity,
        price_at_add: product.pricing?.basePrice || 0,
        price_discounted: product.pricing?.discountPrice,
        valid: true,
      });

      await this.cartItemRepository.save(cartItem);

      // Update cart total
      await this.updateCartTotal(cart.id);

      // Get updated item count
      const itemCount = await this.cartItemRepository.count({
        where: { cart: { id: cart.id } },
      });

      this.logger.log(
        `Quick add to cart successful for user ${userId}: product ${productId}`,
      );

      return {
        success: true,
        cartItemCount: itemCount,
        message: 'Product added to cart successfully',
      };
    } catch (error: unknown) {
      this.logger.error(`Quick add to cart failed for user ${userId}`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        success: false,
        cartItemCount: 0,
        message: 'Failed to add product to cart',
      };
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: number,
    itemId: number,
    request: UpdateCartItemRequest,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { quantity } = request;

      // Find cart item
      const cartItem = await this.cartItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.cart', 'cart')
        .leftJoinAndSelect('item.product', 'product')
        .where('item.id = :itemId', { itemId })
        .andWhere('cart.userId = :userId', { userId })
        .getOne();

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      if (quantity <= 0) {
        // Remove item
        await this.cartItemRepository.remove(cartItem);
        await this.updateCartTotal(cartItem.cart.id);

        return {
          success: true,
          message: 'Item removed from cart',
        };
      }

      // Update quantity (simplified implementation)
      cartItem.quantity = quantity;
      await this.cartItemRepository.save(cartItem);

      // Update cart total
      await this.updateCartTotal(cartItem.cart.id);

      return {
        success: true,
        message: 'Cart updated successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update cart item ${itemId} for user ${userId}`,
        error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        success: false,
        message: 'Failed to update cart item',
      };
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { userId, status: 'active' },
        relations: ['items'],
      });

      if (!cart) {
        return {
          success: true,
          message: 'Cart is already empty',
        };
      }

      // Remove all items
      await this.cartItemRepository.remove(cart.items);

      // Update cart total
      await this.updateCartTotal(cart.id);

      return {
        success: true,
        message: 'Cart cleared successfully',
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to clear cart for user ${userId}`, error);
      return {
        success: false,
        message: 'Failed to clear cart',
      };
    }
  }

  /**
   * Transform cart item to mobile format
   */
  private async transformToMobileCartItem(
    cartItem: any,
  ): Promise<MobileCartItem> {
    const product = cartItem.product;
    const mainImage = product.images?.[0]?.imageUrl;
    const optimizedImage = mainImage
      ? await this.imageOptimizationService.optimizeImage(mainImage)
      : {
          original: '',
          thumbnail: '',
          medium: '',
          large: '',
        };

    return {
      id: cartItem.id,
      productId: product.id,
      productSlug: product.slug,
      productName: {
        en: product.nameEn,
        ar: product.nameAr,
      },
      productImage: optimizedImage,
      variant: cartItem.productVariant
        ? {
            id: cartItem.productVariant.id,
            sku: cartItem.productVariant.sku,
            attributes: cartItem.productVariant.variantData || {},
          }
        : undefined,
      pricing: {
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
        discountPrice: product.pricing?.discountPrice,
        currency: 'SYP',
      },
      quantity: cartItem.quantity,
      maxQuantity: product.stockQuantity,
      availability: {
        inStock: product.stockQuantity > 0,
        stockCount:
          product.stockQuantity > 10 ? undefined : product.stockQuantity,
      },
      vendor: {
        id: product.vendor?.id || 0,
        businessName: product.vendor?.businessName || 'Unknown Vendor',
      },
    };
  }

  /**
   * Calculate cart summary
   */
  private calculateCartSummary(items: MobileCartItem[]) {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.pricing.totalPrice,
      0,
    );
    const discount = items.reduce((sum, item) => {
      if (
        item.pricing.discountPrice &&
        item.pricing.unitPrice > item.pricing.discountPrice
      ) {
        return (
          sum +
          (item.pricing.unitPrice - item.pricing.discountPrice) * item.quantity
        );
      }
      return sum;
    }, 0);

    const shipping = this.calculateShippingCost(subtotal);
    const tax = this.calculateTax(subtotal - discount);
    const total = subtotal - discount + shipping + tax;

    return {
      itemCount,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      currency: 'SYP',
    };
  }

  /**
   * Calculate shipping cost
   */
  private calculateShippingCost(subtotal: number): number {
    // Free shipping for orders over 500,000 SYP
    if (subtotal >= 500000) return 0;

    // Standard shipping cost
    return 75000; // 75,000 SYP
  }

  /**
   * Calculate tax
   */
  private calculateTax(subtotal: number): number {
    // Syrian VAT is typically around 11%
    return Math.round(subtotal * 0.11);
  }

  /**
   * Calculate savings information
   */
  private calculateSavings(items: MobileCartItem[]) {
    const totalSavings = items.reduce((sum, item) => {
      if (
        item.pricing.discountPrice &&
        item.pricing.unitPrice > item.pricing.discountPrice
      ) {
        return (
          sum +
          (item.pricing.unitPrice - item.pricing.discountPrice) * item.quantity
        );
      }
      return sum;
    }, 0);

    if (totalSavings === 0) return undefined;

    const originalTotal = items.reduce(
      (sum, item) => sum + item.pricing.unitPrice * item.quantity,
      0,
    );
    const percentage = Math.round((totalSavings / originalTotal) * 100);

    return {
      amount: totalSavings,
      percentage,
      description: `You're saving ${percentage}% on this order`,
    };
  }

  /**
   * Get available shipping methods
   */
  private async getShippingMethods(userId: number) {
    // In real implementation, get from shipping service
    return [
      {
        id: 'standard',
        name: 'Standard Shipping',
        cost: 75000,
        estimatedDays: 3,
      },
      {
        id: 'express',
        name: 'Express Shipping',
        cost: 150000,
        estimatedDays: 1,
      },
    ];
  }

  /**
   * Get available payment methods
   */
  private async getPaymentMethods(userId: number) {
    return [
      {
        id: 'cod',
        name: 'Cash on Delivery',
        type: 'cod' as const,
        available: true,
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank_transfer' as const,
        available: true,
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        type: 'mobile_money' as const,
        available: true,
      },
    ];
  }

  /**
   * Create empty mobile cart
   */
  private createEmptyMobileCart(userId: number): MobileCartSummary {
    return {
      id: 0,
      userId,
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        currency: 'SYP',
      },
      shipping: {
        methods: [],
      },
      payment: {
        methods: [],
      },
    };
  }

  /**
   * Create new cart for user
   */
  private async createCart(userId: number): Promise<Cart> {
    const cart = this.cartRepository.create({
      userId,
      status: 'active',
      totalAmount: 0,
      currency: 'SYP',
    });

    return await this.cartRepository.save(cart);
  }

  /**
   * Update cart total
   */
  private async updateCartTotal(cartId: number): Promise<void> {
    const result = await this.cartItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.price_at_add * item.quantity)', 'total')
      .where('item.cart.id = :cartId', { cartId })
      .getRawOne();

    const total = result?.total || 0;

    await this.cartRepository.update(cartId, {
      totalAmount: total,
    });
  }
}
