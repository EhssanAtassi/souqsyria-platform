/**
 * @file order-management.dto.ts
 * @description DTOs for order management including listing, status updates,
 *              timeline visualization, and refund processing.
 * @module AdminDashboard/DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from './user-management.dto';

/**
 * Order status enumeration
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  FAILED = 'failed',
}

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Refund status enumeration
 */
export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

/**
 * Order sort field enumeration
 */
export enum OrderSortField {
  ID = 'id',
  CREATED_AT = 'createdAt',
  TOTAL_AMOUNT = 'totalAmount',
  STATUS = 'status',
  CUSTOMER_NAME = 'customerName',
}

// =============================================================================
// QUERY DTOs
// =============================================================================

/**
 * Order list query parameters
 */
export class OrderListQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search by order number or customer name',
    example: 'ORD-2024',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  vendorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter orders created after this date',
    example: '2024-01-01',
  })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter orders created before this date',
    example: '2024-12-31',
  })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum total amount',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum total amount',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter orders with refund requests',
  })
  @IsBoolean()
  @IsOptional()
  hasRefundRequest?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: OrderSortField,
    default: OrderSortField.CREATED_AT,
  })
  @IsEnum(OrderSortField)
  @IsOptional()
  sortBy?: OrderSortField = OrderSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}

/**
 * Pending refunds query parameters
 */
export class PendingRefundsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by request date',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.ASC;
}

// =============================================================================
// ACTION DTOs
// =============================================================================

/**
 * Update order status DTO
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
    example: 'confirmed',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({
    description: 'Status change notes',
    maxLength: 500,
    example: 'Order confirmed and sent to warehouse for processing.',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Notify customer via email',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyCustomer?: boolean = true;

  @ApiPropertyOptional({
    description: 'Tracking number (for shipped status)',
    example: 'TRK-123456789',
  })
  @IsString()
  @IsOptional()
  trackingNumber?: string;
}

/**
 * Process refund DTO
 */
export class ProcessRefundDto {
  @ApiProperty({
    description: 'Refund decision',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  decision: 'approve' | 'reject';

  @ApiPropertyOptional({
    description: 'Refund amount (if partial refund)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Reason or notes for the decision',
    maxLength: 1000,
    example: 'Refund approved. Product was defective.',
  })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'Restock refunded items',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  restockItems?: boolean = true;

  @ApiPropertyOptional({
    description: 'Notify customer via email',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyCustomer?: boolean = true;
}

/**
 * Cancel order DTO
 */
export class CancelOrderDto {
  @ApiProperty({
    description: 'Cancellation reason',
    maxLength: 500,
    example: 'Customer requested cancellation.',
  })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Process refund automatically',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  processRefund?: boolean = true;

  @ApiPropertyOptional({
    description: 'Restock cancelled items',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  restockItems?: boolean = true;

  @ApiPropertyOptional({
    description: 'Notify customer via email',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyCustomer?: boolean = true;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Order customer summary
 */
export class OrderCustomerDto {
  @ApiProperty({ description: 'Customer ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Customer full name', example: 'Ahmad Al-Hassan' })
  fullName: string;

  @ApiProperty({ description: 'Customer email', example: 'ahmad@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Customer phone', example: '+963912345678' })
  phone?: string;

  @ApiProperty({ description: 'Total orders by customer', example: 12 })
  totalOrders: number;
}

/**
 * Order item summary
 */
export class OrderItemSummaryDto {
  @ApiProperty({ description: 'Order item ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Product ID', example: 5 })
  productId: number;

  @ApiProperty({ description: 'Product name', example: 'Damascus Steel Chef Knife' })
  productName: string;

  @ApiPropertyOptional({ description: 'Product thumbnail' })
  thumbnail?: string;

  @ApiProperty({ description: 'Vendor name', example: 'Al-Hamra Crafts' })
  vendorName: string;

  @ApiProperty({ description: 'Quantity ordered', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Unit price in SYP', example: 150000 })
  unitPrice: number;

  @ApiProperty({ description: 'Total price in SYP', example: 300000 })
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Selected variant', example: '8 inch' })
  variant?: string;
}

/**
 * Order timeline event
 */
export class OrderTimelineEventDto {
  @ApiProperty({ description: 'Event ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Event status',
    enum: OrderStatus,
    example: 'confirmed',
  })
  status: OrderStatus;

  @ApiProperty({ description: 'Event title', example: 'Order Confirmed' })
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  description?: string;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'User who triggered the event' })
  triggeredBy?: string;
}

/**
 * Order shipping address
 */
export class OrderShippingAddressDto {
  @ApiProperty({ description: 'Address line 1', example: '123 Damascus Street' })
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  addressLine2?: string;

  @ApiProperty({ description: 'City', example: 'Damascus' })
  city: string;

  @ApiProperty({ description: 'State/Province', example: 'Damascus' })
  state: string;

  @ApiProperty({ description: 'Country', example: 'Syria' })
  country: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  instructions?: string;
}

/**
 * Order list item response DTO
 */
export class OrderListItemDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Order number', example: 'ORD-2024-001234' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer information', type: OrderCustomerDto })
  customer: OrderCustomerDto;

  @ApiProperty({ description: 'Total amount in SYP', example: 450000 })
  totalAmount: number;

  @ApiProperty({ description: 'Number of items', example: 3 })
  itemsCount: number;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: 'processing',
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: 'paid',
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Payment method', example: 'cash_on_delivery' })
  paymentMethod: string;

  @ApiProperty({ description: 'Has refund request', example: false })
  hasRefundRequest: boolean;

  @ApiProperty({ description: 'Order date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Delivery date' })
  deliveredAt?: Date;
}

/**
 * Order details response DTO
 */
export class OrderDetailsDto extends OrderListItemDto {
  @ApiProperty({ description: 'Order items', type: [OrderItemSummaryDto] })
  items: OrderItemSummaryDto[];

  @ApiProperty({ description: 'Shipping address', type: OrderShippingAddressDto })
  shippingAddress: OrderShippingAddressDto;

  @ApiProperty({ description: 'Subtotal in SYP', example: 420000 })
  subtotal: number;

  @ApiProperty({ description: 'Shipping cost in SYP', example: 15000 })
  shippingCost: number;

  @ApiProperty({ description: 'Tax amount in SYP', example: 15000 })
  taxAmount: number;

  @ApiPropertyOptional({ description: 'Discount amount in SYP' })
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Applied coupon code' })
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  trackingNumber?: string;

  @ApiProperty({ description: 'Order timeline', type: [OrderTimelineEventDto] })
  timeline: OrderTimelineEventDto[];

  @ApiPropertyOptional({ description: 'Order notes' })
  notes?: string;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}

/**
 * Refund request item DTO
 */
export class RefundRequestItemDto {
  @ApiProperty({ description: 'Refund request ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Order ID', example: 123 })
  orderId: number;

  @ApiProperty({ description: 'Order number', example: 'ORD-2024-001234' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer name', example: 'Ahmad Al-Hassan' })
  customerName: string;

  @ApiProperty({ description: 'Customer email', example: 'ahmad@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'Requested amount in SYP', example: 150000 })
  requestedAmount: number;

  @ApiProperty({ description: 'Order total in SYP', example: 450000 })
  orderTotal: number;

  @ApiProperty({ description: 'Refund reason', example: 'Product was defective' })
  reason: string;

  @ApiProperty({
    description: 'Refund status',
    enum: RefundStatus,
    example: 'pending',
  })
  status: RefundStatus;

  @ApiProperty({ description: 'Request date' })
  requestedAt: Date;

  @ApiProperty({ description: 'Days pending', example: 2 })
  daysPending: number;

  @ApiProperty({
    description: 'Affected items count',
    example: 1,
  })
  affectedItemsCount: number;
}

/**
 * Paginated order list response
 */
export class PaginatedOrderListDto {
  @ApiProperty({ description: 'List of orders', type: [OrderListItemDto] })
  items: OrderListItemDto[];

  @ApiProperty({ description: 'Total count', example: 1543 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 78 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;
}
