/**
 * @file admin-products.controller.ts
 * @description Admin controller for product management operations including
 *              listing, approval workflow, and bulk operations.
 * @module AdminDashboard/Controllers
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Entities - Use correct entity names
import { ProductEntity } from '../../products/entities/product.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

// Services - Correct path for AuditLogService
import { AuditLogService } from '../../audit-log/service/audit-log.service';

// DTOs
import {
  ProductListQueryDto,
  ProductListItemDto,
  ProductDetailsDto,
  PendingProductItemDto,
  ApproveProductDto,
  RejectProductDto,
  BulkProductApprovalDto,
  PaginatedProductListDto,
  ProductApprovalStatus,
  ProductVendorSummaryDto,
  ProductCategorySummaryDto,
} from '../dto';

/**
 * Admin Products Controller
 * @description Provides API endpoints for product management in the admin dashboard.
 *              Supports listing, filtering, approval workflow, and bulk operations.
 */
@ApiTags('Admin Dashboard - Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@Controller('admin-dashboard/products')
export class AdminProductsController {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    private readonly auditLogService: AuditLogService,
  ) {}

  // ===========================================================================
  // PRODUCT LISTING
  // ===========================================================================

  /**
   * Get paginated product list
   * @description Retrieves products with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of products
   */
  @Get()
  @ApiOperation({
    summary: 'Get product list',
    description: 'Retrieves paginated list of products with support for ' +
                 'search, category filtering, approval status filtering, and sorting.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product list retrieved successfully',
    type: PaginatedProductListDto,
  })
  async getProducts(@Query() query: ProductListQueryDto): Promise<PaginatedProductListDto> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      vendorId,
      approvalStatus,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build query with required relations
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.pricing', 'pricing');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(product.nameEn LIKE :search OR product.nameAr LIKE :search OR product.sku LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.category.id = :categoryId', { categoryId });
    }

    if (vendorId) {
      queryBuilder.andWhere('product.vendor.id = :vendorId', { vendorId });
    }

    if (approvalStatus) {
      queryBuilder.andWhere('product.approvalStatus = :approvalStatus', { approvalStatus });
    }

    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // Apply sorting - map sortBy to actual entity fields
    const sortFieldMap: Record<string, string> = {
      createdAt: 'product.createdAt',
      name: 'product.nameEn',
      approvalStatus: 'product.approvalStatus',
      id: 'product.id',
    };
    const sortField = sortFieldMap[sortBy] || 'product.createdAt';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const products = await queryBuilder.getMany();

    // Map to DTOs
    const items: ProductListItemDto[] = await Promise.all(
      products.map(product => this.mapProductToListItem(product)),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get product details
   * @description Retrieves detailed information about a specific product
   * @param id - Product ID
   * @returns Product details with metrics
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product details',
    description: 'Retrieves comprehensive details about a specific product ' +
                 'including images, variants, sales metrics, and approval history.',
  })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product details retrieved successfully',
    type: ProductDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async getProductDetails(@Param('id', ParseIntPipe) id: number): Promise<ProductDetailsDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'vendor', 'images', 'variants', 'variants.stocks', 'pricing', 'descriptions'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get sales metrics
    const salesMetrics = await this.getProductSalesMetrics(id);

    // Get approval history from audit logs
    const approvalHistory = await this.getProductApprovalHistory(id);

    // Get descriptions in English and Arabic
    const descriptionEn = product.descriptions?.find(d => d.language === 'en')?.description || '';
    const descriptionAr = product.descriptions?.find(d => d.language === 'ar')?.description || '';

    const baseItem = await this.mapProductToListItem(product);

    return {
      ...baseItem,
      descriptionEn,
      descriptionAr,
      images: product.images?.map(img => ({
        id: img.id,
        url: img.imageUrl,
        isPrimary: img.sortOrder === 0,
        sortOrder: img.sortOrder || 0,
      })) || [],
      variants: product.variants?.map(v => {
        // Sum stock from stocks relation
        const totalStock = v.stocks?.reduce((sum, stock) => sum + (Number(stock.quantity) || 0), 0) || 0;
        // Build variant name from variantData JSON (e.g., "Color: Red, Size: XL")
        const variantName = v.variantData
          ? Object.entries(v.variantData).map(([key, val]) => `${key}: ${val}`).join(', ')
          : '';
        return {
          id: v.id,
          name: variantName,
          sku: v.sku || '',
          price: Number(v.price) || 0,
          stock: totalStock,
        };
      }) || [],
      salesMetrics,
      approvalHistory,
    };
  }

  // ===========================================================================
  // APPROVAL WORKFLOW
  // ===========================================================================

  /**
   * Get products pending approval
   * @description Retrieves all products awaiting approval
   * @returns List of pending products
   */
  @Get('approval/pending')
  @ApiOperation({
    summary: 'Get pending approvals',
    description: 'Retrieves all products with pending approval status, ' +
                 'sorted by submission date (oldest first).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending products retrieved successfully',
    type: [PendingProductItemDto],
  })
  async getPendingApprovals(): Promise<PendingProductItemDto[]> {
    const products = await this.productRepository.find({
      where: { approvalStatus: 'pending' },
      relations: ['category', 'vendor', 'images', 'pricing', 'variants', 'variants.stocks'],
      order: { createdAt: 'ASC' },
    });

    const now = new Date();

    return products.map(product => {
      const thumbnail = this.getProductThumbnail(product);
      const price = this.getProductPrice(product);
      const daysPending = Math.floor((now.getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: product.id,
        sku: product.sku || '',
        name: product.nameEn,
        thumbnail,
        price,
        categoryName: product.category?.nameEn || 'Uncategorized',
        vendorId: product.vendor?.id || 0,
        vendorName: product.vendor?.storeName || 'Unknown Vendor',
        submittedAt: product.createdAt,
        daysPending,
        imageCount: product.images?.length || 0,
        hasVariants: (product.variants?.length || 0) > 0,
        previousRejectionReason: product.rejectionReason || undefined,
        isResubmission: !!product.rejectionReason,
      };
    });
  }

  /**
   * Approve a product
   * @description Approves a product for listing
   * @param id - Product ID
   * @param dto - Approval details
   * @param req - Request with authenticated user
   * @returns Updated product
   */
  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve product',
    description: 'Approves a product for public listing. ' +
                 'Product status will be set to active.',
  })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiBody({ type: ApproveProductDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product approved successfully',
    type: ProductListItemDto,
  })
  async approveProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveProductDto,
    @Request() req: any,
  ): Promise<ProductListItemDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'vendor', 'images', 'pricing'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.approvalStatus !== 'pending') {
      throw new BadRequestException('Product is not pending approval');
    }

    const previousStatus = product.approvalStatus;

    // Update product
    product.approvalStatus = 'approved';
    product.status = 'published';
    product.approvedAt = new Date();
    product.approvedBy = req.user?.id;
    product.rejectionReason = null;
    product.lastActivityAt = new Date();

    // Apply featured status if specified
    if (dto.featured !== undefined) {
      product.isFeatured = dto.featured;
    }

    await this.productRepository.save(product);

    // Log the approval using correct DTO format
    await this.auditLogService.log({
      action: 'product_approved',
      actorId: req.user?.id,
      actorType: 'admin',
      entityType: 'product',
      entityId: id,
      description: `Approved product: ${product.nameEn}`,
      beforeData: { approvalStatus: previousStatus },
      afterData: { approvalStatus: 'approved', notes: dto.notes, featured: dto.featured },
    });

    // Reload product with relations for mapping
    const updatedProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'vendor', 'images', 'pricing'],
    });

    return this.mapProductToListItem(updatedProduct!);
  }

  /**
   * Reject a product
   * @description Rejects a product with reason
   * @param id - Product ID
   * @param dto - Rejection details
   * @param req - Request with authenticated user
   * @returns Updated product
   */
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject product',
    description: 'Rejects a product with a reason. ' +
                 'Vendor will be notified with the rejection reason.',
  })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiBody({ type: RejectProductDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product rejected successfully',
    type: ProductListItemDto,
  })
  async rejectProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectProductDto,
    @Request() req: any,
  ): Promise<ProductListItemDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'vendor', 'images', 'pricing'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.approvalStatus !== 'pending') {
      throw new BadRequestException('Product is not pending approval');
    }

    const previousStatus = product.approvalStatus;

    // Determine final status based on allowResubmission
    const newStatus: 'rejected' | 'draft' = dto.allowResubmission
      ? 'draft' // Allow resubmission by setting back to draft
      : 'rejected';

    // Update product
    product.approvalStatus = newStatus;
    product.status = 'draft';
    product.rejectionReason = dto.reason;
    product.lastActivityAt = new Date();

    await this.productRepository.save(product);

    // Log the rejection
    await this.auditLogService.log({
      action: 'product_rejected',
      actorId: req.user?.id,
      actorType: 'admin',
      entityType: 'product',
      entityId: id,
      description: `Rejected product: ${product.nameEn}`,
      beforeData: { approvalStatus: previousStatus },
      afterData: {
        approvalStatus: newStatus,
        reason: dto.reason,
        issues: dto.issues,
        allowResubmission: dto.allowResubmission,
      },
    });

    // Reload product with relations
    const updatedProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'vendor', 'images', 'pricing'],
    });

    return this.mapProductToListItem(updatedProduct!);
  }

  // ===========================================================================
  // BULK OPERATIONS
  // ===========================================================================

  /**
   * Bulk approve products
   * @description Approves multiple products at once
   * @param dto - Bulk approval details
   * @param req - Request with authenticated user
   * @returns Bulk operation result
   */
  @Post('bulk-approve')
  @ApiOperation({
    summary: 'Bulk approve products',
    description: 'Approves multiple products at once. ' +
                 'Returns count of successfully approved products.',
  })
  @ApiBody({ type: BulkProductApprovalDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk approval completed',
  })
  async bulkApproveProducts(
    @Body() dto: BulkProductApprovalDto,
    @Request() req: any,
  ): Promise<{ success: boolean; approved: number; failed: number; errors: string[] }> {
    if (dto.action !== 'approve') {
      throw new BadRequestException('Invalid action for bulk approval');
    }

    const errors: string[] = [];
    let approved = 0;
    let failed = 0;

    for (const productId of dto.productIds) {
      try {
        const product = await this.productRepository.findOne({
          where: { id: productId, approvalStatus: 'pending' },
        });

        if (!product) {
          errors.push(`Product ${productId}: Not found or not pending`);
          failed++;
          continue;
        }

        product.approvalStatus = 'approved';
        product.status = 'published';
        product.approvedAt = new Date();
        product.approvedBy = req.user?.id;
        product.lastActivityAt = new Date();

        await this.productRepository.save(product);

        // Log the approval
        await this.auditLogService.log({
          action: 'product_bulk_approved',
          actorId: req.user?.id,
          actorType: 'admin',
          entityType: 'product',
          entityId: productId,
          description: `Bulk approved product ID: ${productId}`,
          afterData: { bulkOperationReason: dto.reason },
        });

        approved++;
      } catch (error) {
        errors.push(`Product ${productId}: ${error.message}`);
        failed++;
      }
    }

    return {
      success: failed === 0,
      approved,
      failed,
      errors,
    };
  }

  /**
   * Bulk reject products
   * @description Rejects multiple products at once
   * @param dto - Bulk rejection details
   * @param req - Request with authenticated user
   * @returns Bulk operation result
   */
  @Post('bulk-reject')
  @ApiOperation({
    summary: 'Bulk reject products',
    description: 'Rejects multiple products at once with the same reason.',
  })
  @ApiBody({ type: BulkProductApprovalDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk rejection completed',
  })
  async bulkRejectProducts(
    @Body() dto: BulkProductApprovalDto,
    @Request() req: any,
  ): Promise<{ success: boolean; rejected: number; failed: number; errors: string[] }> {
    if (dto.action !== 'reject') {
      throw new BadRequestException('Invalid action for bulk rejection');
    }

    const errors: string[] = [];
    let rejected = 0;
    let failed = 0;

    for (const productId of dto.productIds) {
      try {
        const product = await this.productRepository.findOne({
          where: { id: productId, approvalStatus: 'pending' },
        });

        if (!product) {
          errors.push(`Product ${productId}: Not found or not pending`);
          failed++;
          continue;
        }

        product.approvalStatus = 'rejected';
        product.status = 'draft';
        product.rejectionReason = dto.reason || 'Rejected in bulk operation';
        product.lastActivityAt = new Date();

        await this.productRepository.save(product);

        // Log the rejection
        await this.auditLogService.log({
          action: 'product_bulk_rejected',
          actorId: req.user?.id,
          actorType: 'admin',
          entityType: 'product',
          entityId: productId,
          description: `Bulk rejected product ID: ${productId}`,
          afterData: { reason: dto.reason },
        });

        rejected++;
      } catch (error) {
        errors.push(`Product ${productId}: ${error.message}`);
        failed++;
      }
    }

    return {
      success: failed === 0,
      rejected,
      failed,
      errors,
    };
  }

  /**
   * Toggle product featured status
   * @description Toggles whether a product is featured on the homepage
   * @param id - Product ID
   * @param req - Request with authenticated user
   * @returns Updated product
   */
  @Patch(':id/toggle-featured')
  @ApiOperation({
    summary: 'Toggle featured status',
    description: 'Toggles whether a product appears as featured.',
  })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured status toggled successfully',
    type: ProductListItemDto,
  })
  async toggleFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ProductListItemDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'vendor', 'images', 'pricing'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const previousFeatured = product.isFeatured;
    product.isFeatured = !product.isFeatured;
    product.lastActivityAt = new Date();

    await this.productRepository.save(product);

    // Log the change
    await this.auditLogService.log({
      action: 'product_featured_toggled',
      actorId: req.user?.id,
      actorType: 'admin',
      entityType: 'product',
      entityId: id,
      description: `Toggled featured status for product: ${product.nameEn}`,
      beforeData: { isFeatured: previousFeatured },
      afterData: { isFeatured: product.isFeatured },
    });

    return this.mapProductToListItem(product);
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Get product thumbnail from images relation
   * @description Finds the primary image (sortOrder === 0) or first image by sortOrder
   * @param product - Product entity with images loaded
   * @returns Thumbnail URL or undefined
   */
  private getProductThumbnail(product: ProductEntity): string | undefined {
    if (!product.images || product.images.length === 0) {
      return undefined;
    }

    // Find primary image (sortOrder === 0) first
    const primaryImage = product.images.find(img => img.sortOrder === 0);
    if (primaryImage) {
      return primaryImage.imageUrl;
    }

    // Otherwise return first image sorted by sortOrder
    const sortedImages = [...product.images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return sortedImages[0]?.imageUrl;
  }

  /**
   * Get product price from pricing relation
   * @description Uses basePrice field from ProductPriceEntity
   * @param product - Product entity with pricing loaded
   * @returns Price value
   */
  private getProductPrice(product: ProductEntity): number {
    if (product.pricing) {
      return Number(product.pricing.basePrice) || 0;
    }
    return 0;
  }

  /**
   * Get product sale price from pricing relation
   * @description Uses discountPrice field from ProductPriceEntity
   * @param product - Product entity with pricing loaded
   * @returns Sale price value or undefined
   */
  private getProductSalePrice(product: ProductEntity): number | undefined {
    if (product.pricing && product.pricing.discountPrice) {
      return Number(product.pricing.discountPrice);
    }
    return undefined;
  }

  /**
   * Get product stock from variants' stocks relation
   * @description ProductVariant has a `stocks` relation (ProductStockEntity[]) with quantity field
   * @param product - Product entity with variants and their stocks loaded
   * @returns Total stock quantity across all variants
   */
  private getProductStock(product: ProductEntity): number {
    // Sum stock from all variants' stocks relation if available
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((total, variant) => {
        // Each variant has stocks: ProductStockEntity[] with quantity field
        const variantStock = variant.stocks?.reduce(
          (sum, stock) => sum + (Number(stock.quantity) || 0),
          0,
        ) || 0;
        return total + variantStock;
      }, 0);
    }
    return 0;
  }

  /**
   * Map product entity to list item DTO
   * @param product - Product entity
   * @returns Mapped ProductListItemDto
   */
  private async mapProductToListItem(product: ProductEntity): Promise<ProductListItemDto> {
    // Get sales data from order items
    const salesData = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('COUNT(*)', 'orderCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'unitsSold')
      .innerJoin('item.order', 'order')
      .where('item.productId = :productId', { productId: product.id })
      .andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed'],
      })
      .getRawOne();

    // Build vendor summary
    const vendor: ProductVendorSummaryDto = {
      id: product.vendor?.id || 0,
      shopName: product.vendor?.storeName || 'Unknown Vendor',
      rating: 0, // No rating field on VendorEntity
      isVerified: product.vendor?.isVerified || false,
    };

    // Build category summary
    const category: ProductCategorySummaryDto = {
      id: product.category?.id || 0,
      nameEn: product.category?.nameEn || 'Uncategorized',
      nameAr: product.category?.nameAr || 'غير مصنف',
    };

    return {
      id: product.id,
      sku: product.sku || '',
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      thumbnail: this.getProductThumbnail(product),
      price: this.getProductPrice(product),
      salePrice: this.getProductSalePrice(product),
      stock: this.getProductStock(product),
      approvalStatus: product.approvalStatus as ProductApprovalStatus,
      status: product.status as any,
      vendor,
      category,
      totalSold: parseInt(salesData?.unitsSold) || 0,
      averageRating: 0, // Would need reviews relation
      reviewCount: 0, // Would need reviews relation
      createdAt: product.createdAt,
      approvedAt: product.approvedAt || undefined,
    };
  }

  /**
   * Get product sales metrics
   * @param productId - Product ID
   * @returns Sales metrics object
   */
  private async getProductSalesMetrics(productId: number): Promise<{
    totalOrders: number;
    totalUnitsSold: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const result = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.orderId)', 'totalOrders')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'totalUnitsSold')
      .addSelect('COALESCE(SUM(item.totalPrice), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(item.totalPrice), 0)', 'averageOrderValue')
      .innerJoin('item.order', 'order')
      .where('item.productId = :productId', { productId })
      .andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed', 'refunded'],
      })
      .getRawOne();

    return {
      totalOrders: parseInt(result?.totalOrders) || 0,
      totalUnitsSold: parseInt(result?.totalUnitsSold) || 0,
      totalRevenue: parseFloat(result?.totalRevenue) || 0,
      averageOrderValue: parseFloat(result?.averageOrderValue) || 0,
    };
  }

  /**
   * Get product approval history from audit logs
   * @param productId - Product ID
   * @returns Array of approval history entries
   */
  private async getProductApprovalHistory(productId: number): Promise<
    Array<{ action: string; timestamp: Date; details: any }>
  > {
    // This would ideally query audit logs filtered by entity
    // For now, return empty array - would be implemented with proper audit log query
    // The AuditLogService doesn't have a getLogsForEntity method based on what we read
    return [];
  }
}
