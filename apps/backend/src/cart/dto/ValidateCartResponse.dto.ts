/**
 * @file ValidateCartResponse.dto.ts
 * @description DTOs for cart validation responses in SouqSyria E-commerce Platform
 *
 * PURPOSE:
 * - Validate cart items before checkout
 * - Check stock availability in real-time
 * - Detect price changes (both increases and decreases)
 * - Identify deleted/inactive products
 * - Apply price lock rules (7-day guarantee)
 * - Provide actionable feedback to user
 *
 * VALIDATION CHECKS:
 * - Stock availability across all warehouses
 * - Product/variant active status
 * - Price changes since adding to cart
 * - Price lock expiration (7 days)
 * - Cart item limits (100 items, 50 per product)
 * - Currency consistency
 *
 * USAGE:
 * - POST /cart/validate endpoint
 * - Called before checkout initiation
 * - Called when user views cart after inactivity
 * - Called on price refresh button click
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Validation Warning Type
 * Non-blocking issues that user should be aware of
 */
export enum ValidationWarningType {
  PRICE_DECREASED = 'PRICE_DECREASED', // User gets lower price
  PRICE_LOCK_EXPIRED = 'PRICE_LOCK_EXPIRED', // 7-day lock expired
  LOW_STOCK = 'LOW_STOCK', // Stock below 5 units
  ITEM_UPDATED = 'ITEM_UPDATED', // Product info changed
}

/**
 * Validation Error Type
 * Blocking issues that prevent checkout
 */
export enum ValidationErrorType {
  OUT_OF_STOCK = 'OUT_OF_STOCK', // No stock available
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK', // Requested > available
  PRODUCT_INACTIVE = 'PRODUCT_INACTIVE', // Product/variant disabled
  PRODUCT_DELETED = 'PRODUCT_DELETED', // Product removed from catalog
  PRICE_INCREASED_SIGNIFICANTLY = 'PRICE_INCREASED_SIGNIFICANTLY', // >20% increase
  INVALID_CURRENCY = 'INVALID_CURRENCY', // Currency mismatch
}

/**
 * Validation Warning DTO
 * Informational messages about cart items
 */
export class ValidationWarning {
  /**
   * Warning type enum
   */
  @ApiProperty({
    description: 'Type of validation warning',
    enum: ValidationWarningType,
    example: ValidationWarningType.PRICE_DECREASED,
  })
  type: ValidationWarningType;

  /**
   * Cart item ID affected
   */
  @ApiProperty({
    description: 'ID of cart item with warning',
    example: 123,
  })
  cartItemId: number;

  /**
   * Product variant ID
   */
  @ApiProperty({
    description: 'Product variant ID',
    example: 456,
  })
  variantId: number;

  /**
   * Product name (bilingual support)
   */
  @ApiProperty({
    description: 'Product name (Arabic or English)',
    example: 'iPhone 14 Pro - 256GB - Deep Purple',
  })
  productName: string;

  /**
   * Warning message (bilingual)
   */
  @ApiProperty({
    description: 'Human-readable warning message',
    example:
      'Price decreased from 1,250,000 SYP to 1,100,000 SYP - You save 150,000 SYP!',
  })
  message: string;

  /**
   * Old value (for comparison)
   */
  @ApiProperty({
    description: 'Previous value (e.g., old price)',
    example: 1250000,
    required: false,
  })
  oldValue?: number;

  /**
   * New value (for comparison)
   */
  @ApiProperty({
    description: 'New value (e.g., current price)',
    example: 1100000,
    required: false,
  })
  newValue?: number;

  /**
   * Suggested action
   */
  @ApiProperty({
    description: 'Recommended action for user',
    example: 'Price has been automatically updated to the lower price',
  })
  suggestedAction: string;
}

/**
 * Validation Error DTO
 * Blocking issues preventing checkout
 */
export class ValidationError {
  /**
   * Error type enum
   */
  @ApiProperty({
    description: 'Type of validation error (blocks checkout)',
    enum: ValidationErrorType,
    example: ValidationErrorType.OUT_OF_STOCK,
  })
  type: ValidationErrorType;

  /**
   * Cart item ID affected
   */
  @ApiProperty({
    description: 'ID of cart item with error',
    example: 789,
  })
  cartItemId: number;

  /**
   * Product variant ID
   */
  @ApiProperty({
    description: 'Product variant ID',
    example: 101,
  })
  variantId: number;

  /**
   * Product name (bilingual support)
   */
  @ApiProperty({
    description: 'Product name (Arabic or English)',
    example: 'Samsung Galaxy S24 - 128GB - Black',
  })
  productName: string;

  /**
   * Error message (bilingual)
   */
  @ApiProperty({
    description: 'Human-readable error message',
    example:
      'This product is currently out of stock and has been removed from your cart',
  })
  message: string;

  /**
   * Available stock (for INSUFFICIENT_STOCK)
   */
  @ApiProperty({
    description: 'Available stock quantity',
    example: 3,
    required: false,
  })
  availableStock?: number;

  /**
   * Requested quantity (for INSUFFICIENT_STOCK)
   */
  @ApiProperty({
    description: 'Requested quantity in cart',
    example: 5,
    required: false,
  })
  requestedQuantity?: number;

  /**
   * Suggested action
   */
  @ApiProperty({
    description: 'Required action to resolve error',
    example: 'Remove this item from cart or reduce quantity to 3',
  })
  suggestedAction: string;
}

/**
 * Updated Cart Item DTO
 * Items that were modified during validation
 */
export class UpdatedCartItem {
  /**
   * Cart item ID
   */
  @ApiProperty({
    description: 'ID of cart item that was updated',
    example: 123,
  })
  cartItemId: number;

  /**
   * Product variant ID
   */
  @ApiProperty({
    description: 'Product variant ID',
    example: 456,
  })
  variantId: number;

  /**
   * Product name
   */
  @ApiProperty({
    description: 'Product name',
    example: 'Damascus Steel Knife - 10 inch',
  })
  productName: string;

  /**
   * Old quantity
   */
  @ApiProperty({
    description: 'Previous quantity',
    example: 5,
    required: false,
  })
  oldQuantity?: number;

  /**
   * New quantity
   */
  @ApiProperty({
    description: 'Updated quantity',
    example: 3,
    required: false,
  })
  newQuantity?: number;

  /**
   * Old price
   */
  @ApiProperty({
    description: 'Previous price',
    example: 125000,
    required: false,
  })
  oldPrice?: number;

  /**
   * New price
   */
  @ApiProperty({
    description: 'Updated price',
    example: 110000,
    required: false,
  })
  newPrice?: number;

  /**
   * Update reason
   */
  @ApiProperty({
    description: 'Reason for update',
    example: 'Price decreased - automatically updated to lower price',
  })
  updateReason: string;

  /**
   * Whether item was removed
   */
  @ApiProperty({
    description: 'Whether item was removed from cart',
    example: false,
  })
  removed: boolean;
}

/**
 * Validate Cart Response DTO
 * Complete validation result returned to client
 */
export class ValidateCartResponse {
  /**
   * Overall validation status
   */
  @ApiProperty({
    description: 'Whether cart is valid and ready for checkout',
    example: true,
  })
  valid: boolean;

  /**
   * Cart ID
   */
  @ApiProperty({
    description: 'ID of validated cart',
    example: 456,
  })
  cartId: number;

  /**
   * Total items after validation
   */
  @ApiProperty({
    description: 'Total number of items after validation (some may be removed)',
    example: 7,
  })
  totalItems: number;

  /**
   * Array of cart items that passed validation (available for checkout)
   */
  @ApiProperty({
    description:
      'Array of cart items that passed validation and are available for checkout',
    type: [Object],
    example: [
      { id: 1, variantId: 5, quantity: 2, effectivePrice: 50000 },
      { id: 2, variantId: 12, quantity: 1, effectivePrice: 125000 },
    ],
  })
  validItems: any[];

  /**
   * Total cart amount after validation
   */
  @ApiProperty({
    description: 'Total cart amount in SYP after price updates',
    example: 2750000,
  })
  totalAmount: number;

  /**
   * Currency code
   */
  @ApiProperty({
    description: 'Currency code for all prices',
    example: 'SYP',
  })
  currency: string;

  /**
   * Array of validation warnings (non-blocking)
   */
  @ApiProperty({
    description:
      'Non-blocking warnings about cart items (e.g., price decreases)',
    type: [ValidationWarning],
    example: [
      {
        type: 'PRICE_DECREASED',
        cartItemId: 123,
        variantId: 456,
        productName: 'iPhone 14 Pro',
        message: 'Price decreased - You save 150,000 SYP!',
        oldValue: 1250000,
        newValue: 1100000,
        suggestedAction: 'Price automatically updated',
      },
    ],
  })
  warnings: ValidationWarning[];

  /**
   * Array of validation errors (blocking)
   */
  @ApiProperty({
    description: 'Blocking errors preventing checkout (e.g., out of stock)',
    type: [ValidationError],
    example: [
      {
        type: 'OUT_OF_STOCK',
        cartItemId: 789,
        variantId: 101,
        productName: 'Samsung Galaxy S24',
        message: 'Product is out of stock',
        suggestedAction: 'Remove item from cart',
      },
    ],
  })
  errors: ValidationError[];

  /**
   * Array of items updated during validation
   */
  @ApiProperty({
    description: 'Cart items that were modified during validation',
    type: [UpdatedCartItem],
    example: [
      {
        cartItemId: 123,
        variantId: 456,
        productName: 'Damascus Steel Knife',
        oldPrice: 125000,
        newPrice: 110000,
        updateReason: 'Price decreased',
        removed: false,
      },
    ],
  })
  updatedItems: UpdatedCartItem[];

  /**
   * Total savings from price decreases
   */
  @ApiProperty({
    description:
      'Total amount saved from price decreases since items were added',
    example: 150000,
  })
  totalSavings: number;

  /**
   * Validation timestamp
   */
  @ApiProperty({
    description: 'ISO 8601 timestamp of validation',
    example: '2025-11-12T14:30:00.000Z',
  })
  validatedAt: string;

  /**
   * Whether user confirmation required
   */
  @ApiProperty({
    description: 'Whether user must confirm changes before proceeding',
    example: false,
  })
  requiresConfirmation: boolean;

  /**
   * Summary message
   */
  @ApiProperty({
    description: 'Human-readable summary of validation results',
    example:
      'Cart validated successfully. 1 price decrease found - you save 150,000 SYP!',
  })
  summary: string;
}
