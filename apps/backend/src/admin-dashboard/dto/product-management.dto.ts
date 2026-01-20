/**
 * @file product-management.dto.ts
 * @description DTOs for product management including listing, approval workflow,
 *              and bulk operations.
 * @module AdminDashboard/DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from './user-management.dto';

/**
 * Product approval status enumeration
 */
export enum ProductApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes',
}

/**
 * Product status enumeration
 */
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

/**
 * Product sort field enumeration
 */
export enum ProductSortField {
  ID = 'id',
  CREATED_AT = 'createdAt',
  NAME = 'name',
  PRICE = 'price',
  STOCK = 'stock',
  SALES = 'sales',
  APPROVAL_STATUS = 'approvalStatus',
}

// =============================================================================
// QUERY DTOs
// =============================================================================

/**
 * Product list query parameters
 */
export class ProductListQueryDto {
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
    description: 'Search term for product name or SKU',
    example: 'damascus knife',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: ProductApprovalStatus,
  })
  @IsEnum(ProductApprovalStatus)
  @IsOptional()
  approvalStatus?: ProductApprovalStatus;

  @ApiPropertyOptional({
    description: 'Filter by product status',
    enum: ProductStatus,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  vendorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by brand ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  brandId?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum price',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum price',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by low stock (stock < threshold)',
  })
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ProductSortField,
    default: ProductSortField.CREATED_AT,
  })
  @IsEnum(ProductSortField)
  @IsOptional()
  sortBy?: ProductSortField = ProductSortField.CREATED_AT;

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
 * Pending products query parameters
 */
export class PendingProductsQueryDto {
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
    description: 'Filter by vendor ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  vendorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Sort by submission date',
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
 * Approve product DTO
 */
export class ApproveProductDto {
  @ApiPropertyOptional({
    description: 'Approval notes for vendor',
    maxLength: 500,
    example: 'Product approved. Great quality images and description.',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Featured product flag',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean = false;
}

/**
 * Reject product DTO
 */
export class RejectProductDto {
  @ApiProperty({
    description: 'Rejection reason',
    maxLength: 1000,
    example: 'Product images do not meet quality standards. Please upload clearer images.',
  })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'Specific issues to address',
    type: [String],
    example: ['low_quality_images', 'incomplete_description'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  issues?: string[];

  @ApiPropertyOptional({
    description: 'Allow vendor to resubmit',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;
}

/**
 * Bulk product approval DTO
 */
export class BulkProductApprovalDto {
  @ApiProperty({
    description: 'Array of product IDs to approve/reject',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  @Type(() => Number)
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  productIds: number[];

  @ApiProperty({
    description: 'Action to perform',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({
    description: 'Reason (required for rejection)',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Notify vendors via email',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyVendors?: boolean = true;
}

/**
 * Update product status DTO
 */
export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'New product status',
    enum: ProductStatus,
    example: 'active',
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Product vendor summary
 */
export class ProductVendorSummaryDto {
  @ApiProperty({ description: 'Vendor ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Shop name', example: 'Al-Hamra Crafts' })
  shopName: string;

  @ApiProperty({ description: 'Vendor rating', example: 4.5 })
  rating: number;

  @ApiProperty({ description: 'Vendor verified status', example: true })
  isVerified: boolean;
}

/**
 * Product category summary
 */
export class ProductCategorySummaryDto {
  @ApiProperty({ description: 'Category ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Category name in English', example: 'Damascus Steel' })
  nameEn: string;

  @ApiProperty({ description: 'Category name in Arabic', example: 'الفولاذ الدمشقي' })
  nameAr: string;
}

/**
 * Product list item response DTO
 */
export class ProductListItemDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Product SKU', example: 'DSK-001' })
  sku: string;

  @ApiProperty({ description: 'Product name in English', example: 'Damascus Steel Chef Knife' })
  nameEn: string;

  @ApiProperty({ description: 'Product name in Arabic', example: 'سكين طبخ فولاذ دمشقي' })
  nameAr: string;

  @ApiProperty({ description: 'Product slug', example: 'damascus-steel-chef-knife' })
  slug: string;

  @ApiPropertyOptional({ description: 'Thumbnail image URL' })
  thumbnail?: string;

  @ApiProperty({ description: 'Price in SYP', example: 150000 })
  price: number;

  @ApiPropertyOptional({ description: 'Sale price in SYP' })
  salePrice?: number;

  @ApiProperty({ description: 'Stock quantity', example: 25 })
  stock: number;

  @ApiProperty({
    description: 'Approval status',
    enum: ProductApprovalStatus,
    example: 'approved',
  })
  approvalStatus: ProductApprovalStatus;

  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: 'active',
  })
  status: ProductStatus;

  @ApiProperty({ description: 'Vendor information', type: ProductVendorSummaryDto })
  vendor: ProductVendorSummaryDto;

  @ApiProperty({ description: 'Category information', type: ProductCategorySummaryDto })
  category: ProductCategorySummaryDto;

  @ApiProperty({ description: 'Total units sold', example: 45 })
  totalSold: number;

  @ApiProperty({ description: 'Average rating', example: 4.7 })
  averageRating: number;

  @ApiProperty({ description: 'Number of reviews', example: 23 })
  reviewCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Last approval date' })
  approvedAt?: Date;
}

/**
 * Pending product item DTO
 * @description For approval queue
 */
export class PendingProductItemDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Product SKU', example: 'DSK-001' })
  sku: string;

  @ApiProperty({ description: 'Product name', example: 'Damascus Steel Chef Knife' })
  name: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnail?: string;

  @ApiProperty({ description: 'Price in SYP', example: 150000 })
  price: number;

  @ApiProperty({ description: 'Vendor name', example: 'Al-Hamra Crafts' })
  vendorName: string;

  @ApiProperty({ description: 'Vendor ID', example: 1 })
  vendorId: number;

  @ApiProperty({ description: 'Category name', example: 'Damascus Steel' })
  categoryName: string;

  @ApiProperty({ description: 'Submission date' })
  submittedAt: Date;

  @ApiProperty({ description: 'Days pending', example: 2 })
  daysPending: number;

  @ApiProperty({ description: 'Is resubmission', example: false })
  isResubmission: boolean;

  @ApiPropertyOptional({ description: 'Previous rejection reason' })
  previousRejectionReason?: string;

  @ApiProperty({ description: 'Number of images', example: 5 })
  imageCount: number;

  @ApiProperty({ description: 'Has variants', example: true })
  hasVariants: boolean;
}

/**
 * Product approval result DTO
 */
export class ProductApprovalResultDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Action performed', example: 'approved' })
  action: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

/**
 * Bulk approval result DTO
 */
export class BulkApprovalResultDto {
  @ApiProperty({ description: 'Total products processed', example: 5 })
  totalProcessed: number;

  @ApiProperty({ description: 'Successful operations', example: 4 })
  successful: number;

  @ApiProperty({ description: 'Failed operations', example: 1 })
  failed: number;

  @ApiProperty({
    description: 'Individual results',
    type: [ProductApprovalResultDto],
  })
  results: ProductApprovalResultDto[];
}

/**
 * Paginated product list response
 */
export class PaginatedProductListDto {
  @ApiProperty({ description: 'List of products', type: [ProductListItemDto] })
  items: ProductListItemDto[];

  @ApiProperty({ description: 'Total count', example: 892 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 45 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;
}

// =============================================================================
// PRODUCT DETAILS DTOs
// =============================================================================

/**
 * Product image item for details view
 */
export class ProductImageItemDto {
  @ApiProperty({ description: 'Image ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Image URL', example: 'https://cdn.souqsyria.com/products/123/image1.jpg' })
  url: string;

  @ApiProperty({ description: 'Is primary image', example: true })
  isPrimary: boolean;

  @ApiProperty({ description: 'Sort order for display', example: 0 })
  sortOrder: number;
}

/**
 * Product variant item for details view
 */
export class ProductVariantItemDto {
  @ApiProperty({ description: 'Variant ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Variant name (from variantData)', example: 'Color: Red, Size: XL' })
  name: string;

  @ApiProperty({ description: 'Variant SKU', example: 'DSK-001-RED-XL' })
  sku: string;

  @ApiProperty({ description: 'Variant price', example: 150000 })
  price: number;

  @ApiProperty({ description: 'Variant stock quantity', example: 25 })
  stock: number;
}

/**
 * Product sales metrics
 */
export class ProductSalesMetricsDto {
  @ApiProperty({ description: 'Total orders containing this product', example: 45 })
  totalOrders: number;

  @ApiProperty({ description: 'Total units sold', example: 120 })
  totalUnitsSold: number;

  @ApiProperty({ description: 'Total revenue generated in SYP', example: 18000000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Average order value in SYP', example: 400000 })
  averageOrderValue: number;
}

/**
 * Product approval history entry
 */
export class ProductApprovalHistoryEntryDto {
  @ApiProperty({ description: 'Action performed', example: 'product_approved' })
  action: string;

  @ApiProperty({ description: 'Timestamp of action' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Additional details about the action' })
  details?: any;
}

/**
 * Product details response DTO
 * @description Extended product information including images, variants, and metrics
 */
export class ProductDetailsDto extends ProductListItemDto {
  @ApiProperty({ description: 'Product description in English' })
  descriptionEn: string;

  @ApiProperty({ description: 'Product description in Arabic' })
  descriptionAr: string;

  @ApiProperty({
    description: 'Product images',
    type: [ProductImageItemDto],
  })
  images: ProductImageItemDto[];

  @ApiProperty({
    description: 'Product variants',
    type: [ProductVariantItemDto],
  })
  variants: ProductVariantItemDto[];

  @ApiProperty({
    description: 'Sales metrics for this product',
    type: ProductSalesMetricsDto,
  })
  salesMetrics: ProductSalesMetricsDto;

  @ApiProperty({
    description: 'Approval history entries',
    type: [ProductApprovalHistoryEntryDto],
  })
  approvalHistory: ProductApprovalHistoryEntryDto[];
}
