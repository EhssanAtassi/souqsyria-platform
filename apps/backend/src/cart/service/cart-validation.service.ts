/**
 * @file cart-validation.service.ts
 * @description Cart Validation Service for Pre-Checkout Validation
 *
 * RESPONSIBILITIES:
 * - Validate cart items before checkout initiation
 * - Check stock availability across all warehouses (batch query)
 * - Detect price changes (increases and decreases)
 * - Enforce price lock rules (7-day guarantee)
 * - Identify deleted/inactive products
 * - Auto-update cart items when beneficial to customer
 * - Provide actionable feedback (warnings and errors)
 *
 * BUSINESS LOGIC:
 * - Stock validation: Query all variants in single batch query (no N+1)
 * - Price changes: If price decreased → Auto-update (customer benefit)
 * - Price changes: If price increased → Keep locked price (customer protection)
 * - Price lock expired: Use current price
 * - Out of stock: Remove from cart + error
 * - Inactive product: Remove from cart + error
 *
 * VALIDATION TYPES:
 * - Warnings (non-blocking): Price decreases, low stock, expired locks
 * - Errors (blocking): Out of stock, insufficient stock, inactive products
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import {
  ValidateCartResponse,
  ValidationWarning,
  ValidationError,
  ValidationWarningType,
  ValidationErrorType,
  UpdatedCartItem,
} from '../dto/ValidateCartResponse.dto';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

@Injectable()
export class CartValidationService {
  private readonly logger = new Logger(CartValidationService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.log('✅ Cart Validation Service initialized');
  }

  /**
   * VALIDATE CART
   *
   * Comprehensively validates all cart items before checkout.
   * Checks stock, prices, availability, and enforces business rules.
   *
   * Algorithm:
   * 1. Batch query all variant IDs for stock and current data
   * 2. For each cart item:
   *    a. Validate stock availability
   *    b. Check price changes (apply price lock rules)
   *    c. Check product/variant active status
   *    d. Check price lock expiration
   * 3. Auto-update items when beneficial to customer
   * 4. Remove items that are invalid (out of stock, deleted)
   * 5. Generate warnings and errors
   * 6. Calculate totals and savings
   * 7. Return comprehensive validation response
   *
   * @param cart - Cart to validate
   * @returns ValidateCartResponse - Validation results with warnings/errors
   */
  async validateCart(cart: Cart): Promise<ValidateCartResponse> {
    const startTime = Date.now();
    this.logger.log(`🔍 Validating cart ${cart.id} with ${cart.items.length} items`);

    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];
    const updatedItems: UpdatedCartItem[] = [];
    let totalSavings = 0;
    let validItems = 0;
    let invalidItems = 0;

    try {
      // Step 1: Batch query all variants and stocks (no N+1)
      const variantIds = cart.items.map((item) => item.variant.id);
      const variants = await this.variantRepo.find({
        where: { id: In(variantIds) },
        relations: ['stocks', 'product'],
      });

      // Create variant map for fast lookup
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // Step 2: Validate each cart item
      const itemsToRemove: CartItem[] = [];

      for (const item of cart.items) {
        const variant = variantMap.get(item.variant.id);

        // Check if variant exists and is active
        if (!variant || !variant.isActive || !variant.product?.isActive) {
          errors.push({
            type: ValidationErrorType.PRODUCT_INACTIVE,
            cartItemId: item.id,
            variantId: item.variant.id,
            productName: variant?.product?.nameEn || variant?.product?.nameAr || 'Unknown Product',
            message: 'This product is no longer available',
            suggestedAction: 'Item has been removed from your cart',
          });

          itemsToRemove.push(item);
          invalidItems++;
          continue;
        }

        // Calculate total stock across all warehouses
        const totalStock = variant.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;

        // Check stock availability
        if (totalStock === 0) {
          errors.push({
            type: ValidationErrorType.OUT_OF_STOCK,
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            message: 'This product is currently out of stock',
            availableStock: 0,
            requestedQuantity: item.quantity,
            suggestedAction: 'Item has been removed from your cart',
          });

          itemsToRemove.push(item);
          invalidItems++;
          continue;
        }

        // Check insufficient stock
        if (totalStock < item.quantity) {
          errors.push({
            type: ValidationErrorType.INSUFFICIENT_STOCK,
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            message: `Only ${totalStock} units available`,
            availableStock: totalStock,
            requestedQuantity: item.quantity,
            suggestedAction: `Reduce quantity to ${totalStock} or remove item`,
          });

          // Auto-adjust quantity to available stock
          const oldQuantity = item.quantity;
          item.quantity = totalStock;
          updatedItems.push({
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            oldQuantity,
            newQuantity: totalStock,
            updateReason: 'Quantity reduced to available stock',
            removed: false,
          });
        }

        // Check low stock warning
        if (totalStock < 5 && totalStock >= item.quantity) {
          warnings.push({
            type: ValidationWarningType.LOW_STOCK,
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            message: `Only ${totalStock} units left in stock`,
            suggestedAction: 'Consider ordering soon',
          });
        }

        // Check price lock expiration
        if (item.isLockExpired()) {
          warnings.push({
            type: ValidationWarningType.PRICE_LOCK_EXPIRED,
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            message: 'Price lock has expired (7 days)',
            oldValue: item.price_at_add,
            newValue: variant.price,
            suggestedAction: item.price_at_add < variant.price
              ? `Price increased to ${variant.price} SYP`
              : 'Current price applied',
          });
        }

        // Check price changes
        const currentPrice = variant.price;
        const lockedPrice = item.price_at_add;
        const priceDiff = currentPrice - lockedPrice;

        if (priceDiff < 0) {
          // Price decreased - customer saves money
          const savings = Math.abs(priceDiff) * item.quantity;
          totalSavings += savings;

          warnings.push({
            type: ValidationWarningType.PRICE_DECREASED,
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            message: `Price decreased from ${lockedPrice} to ${currentPrice} SYP`,
            oldValue: lockedPrice,
            newValue: currentPrice,
            suggestedAction: `You save ${savings} SYP on this item!`,
          });

          // Auto-update to lower price (customer benefit)
          if (!item.isLockExpired()) {
            updatedItems.push({
              cartItemId: item.id,
              variantId: variant.id,
              productName: variant.product.nameEn || variant.product.nameAr,
              oldPrice: lockedPrice,
              newPrice: currentPrice,
              updateReason: 'Price decreased - automatically updated',
              removed: false,
            });
          }
        } else if (priceDiff > 0 && item.isLockExpired()) {
          // Price increased and lock expired
          const increase = priceDiff * item.quantity;
          warnings.push({
            type: ValidationWarningType.PRICE_LOCK_EXPIRED,
            cartItemId: item.id,
            variantId: variant.id,
            productName: variant.product.nameEn || variant.product.nameAr,
            message: `Price increased from ${lockedPrice} to ${currentPrice} SYP (lock expired)`,
            oldValue: lockedPrice,
            newValue: currentPrice,
            suggestedAction: `Price increased by ${increase} SYP`,
          });
        }

        validItems++;
      }

      // Step 3: Remove invalid items
      if (itemsToRemove.length > 0) {
        await this.cartItemRepo.remove(itemsToRemove);
        this.logger.log(`🗑️ Removed ${itemsToRemove.length} invalid items from cart`);

        for (const item of itemsToRemove) {
          updatedItems.push({
            cartItemId: item.id,
            variantId: item.variant.id,
            productName: item.variant?.product?.nameEn || item.variant?.product?.nameAr || 'Unknown Product',
            updateReason: 'Item no longer available',
            removed: true,
          });
        }
      }

      // Step 4: Update modified items
      const itemsToSave = cart.items.filter(item => !itemsToRemove.includes(item));
      if (itemsToSave.length > 0) {
        await this.cartItemRepo.save(itemsToSave);
      }

      // Step 5: Update cart totals
      await this.updateCartTotals(cart.id);

      // Reload cart for fresh totals
      const updatedCart = await this.cartRepo.findOne({
        where: { id: cart.id },
        relations: ['items'],
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Cart validation completed in ${processingTime}ms: ${validItems} valid, ${invalidItems} invalid, ${totalSavings} SYP savings`,
      );

      // Log audit event
      await this.auditLogService.logSimple({
        action: 'CART_VALIDATED',
        module: 'cart',
        actorId: cart.userId || null,
        actorType: cart.userId ? 'user' : 'system',
        entityType: 'cart',
        entityId: cart.id,
        description: `Cart validated: ${validItems} valid items, ${errors.length} errors, ${warnings.length} warnings`,
      });

      // Generate summary message
      const summary = this.generateSummary(validItems, invalidItems, warnings, errors, totalSavings);

      return {
        valid: errors.length === 0,
        cartId: cart.id,
        totalItems: updatedCart?.totalItems || 0,
        validItems: updatedCart?.items?.filter(item =>
          !errors.some(error => error.cartItemId === item.id)
        ) || [],
        totalAmount: updatedCart?.totalAmount || 0,
        currency: cart.currency,
        warnings,
        errors,
        updatedItems,
        totalSavings,
        validatedAt: new Date().toISOString(),
        requiresConfirmation: updatedItems.length > 0,
        summary,
      };

    } catch (error: unknown) {
      this.logger.error(`❌ Cart validation failed: ${(error as Error).message}`, (error as Error).stack);

      await this.auditLogService.logSimple({
        action: 'CART_VALIDATION_FAILED',
        module: 'cart',
        actorId: cart.userId || null,
        actorType: cart.userId ? 'user' : 'system',
        entityType: 'cart',
        entityId: cart.id,
        description: `Cart validation failed: ${(error as Error).message}`,
      });

      throw error;
    }
  }

  /**
   * UPDATE CART TOTALS
   *
   * Recalculates and updates cart totals after validation.
   *
   * @param cartId - Cart ID to update
   */
  private async updateCartTotals(cartId: number): Promise<void> {
    const cart = await this.cartRepo.findOne({
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

    await this.cartRepo.save(cart);
  }

  /**
   * GENERATE SUMMARY
   *
   * Creates human-readable summary of validation results.
   *
   * @param validItems - Count of valid items
   * @param invalidItems - Count of invalid items
   * @param warnings - Array of warnings
   * @param errors - Array of errors
   * @param totalSavings - Total savings from price decreases
   * @returns Summary message
   */
  private generateSummary(
    validItems: number,
    invalidItems: number,
    warnings: ValidationWarning[],
    errors: ValidationError[],
    totalSavings: number,
  ): string {
    const parts: string[] = [];

    if (errors.length === 0) {
      parts.push('Cart validated successfully');
    } else {
      parts.push(`${errors.length} item(s) had issues and were removed`);
    }

    if (totalSavings > 0) {
      parts.push(`You save ${totalSavings.toLocaleString()} SYP from price decreases`);
    }

    if (warnings.length > 0) {
      const lowStockWarnings = warnings.filter(w => w.type === ValidationWarningType.LOW_STOCK);
      if (lowStockWarnings.length > 0) {
        parts.push(`${lowStockWarnings.length} item(s) have low stock`);
      }
    }

    return parts.join('. ') + '.';
  }
}
