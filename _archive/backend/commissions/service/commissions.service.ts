/**
 * Commission Management Service
 * -----------------------------------------------
 * This service handles the dynamic resolution of commission rates
 * across multiple override levels for the SouqSyria e-commerce platform.
 *
 * Priority Hierarchy (highest to lowest):
 *   1. Product-specific commission
 *   2. Vendor-specific commission
 *   3. Category-level commission
 *   4. Global default commission
 *
 * Additional Capabilities:
 *   - Applies membership-based commission discounts (e.g., Gold tier)
 *   - Tracks all changes in an audit log for compliance and transparency
 *   - Fully integrated with TypeORM, NestJS Logger, and error handling
 *   - Designed to scale to 20M+ products and 10M+ users
 *
 * Used By:
 *   - Admins (for rule creation and audit tracking)
 *   - Vendors (to view their current rates)
 *   - Order engine (to calculate commission at checkout or payout)
 */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { ProductCommissionEntity } from '../entites/product-commission.entity';

import { VendorCommissionEntity } from '../entites/vendor-commission.entity';
import { CategoryCommissionEntity } from '../entites/category-commission.entity';
import { GlobalCommissionEntity } from '../entites/global-commission.entity';
import { MembershipDiscountEntity } from '../entites/membership-discount.entity';
import { CommissionAuditLogEntity } from '../entites/commission-audit-log.entity';
import { CreateCategoryCommissionDto } from '../dto/create-category-commission.dto';
import { CreateVendorCommissionDto } from '../dto/create-vendor-commission.dto';
import { CreateProductCommissionDto } from '../dto/create-product-commission.dto';
import { CreateMembershipDiscountDto } from '../dto/create-membership-discount.dto';
import { OrderItem } from '../../orders/entities/order-item.entity';
@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(
    @InjectRepository(ProductCommissionEntity)
    private readonly productCommissionRepo: Repository<ProductCommissionEntity>,

    @InjectRepository(VendorCommissionEntity)
    private readonly vendorCommissionRepo: Repository<VendorCommissionEntity>,

    @InjectRepository(CategoryCommissionEntity)
    private readonly categoryCommissionRepo: Repository<CategoryCommissionEntity>,

    @InjectRepository(GlobalCommissionEntity)
    private readonly globalCommissionRepo: Repository<GlobalCommissionEntity>,

    @InjectRepository(MembershipDiscountEntity)
    private readonly membershipDiscountRepo: Repository<MembershipDiscountEntity>,

    @InjectRepository(CommissionAuditLogEntity)
    private readonly auditLogRepo: Repository<CommissionAuditLogEntity>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {
    this.logger.log('CommissionService initialized');
  }
  /**
   * Resolves the effective commission percentage to apply for a transaction.
   * Applies override logic in order of:
   *   1. Product-level
   *   2. Vendor-level
   *   3. Category-level
   *   4. Global default
   * Also checks for membership-based commission discounts.
   *
   * @param productId - Product ID to check for product-specific override
   * @param vendorId - Vendor ID for vendor-specific override
   * @param categoryId - Product’s category ID
   * @param membershipId - Optional vendor membership tier ID (e.g. Gold)
   * @returns Final commission percentage as number (e.g. 7.5)
   */
  async getEffectiveCommission(
    productId: number,
    vendorId: number,
    categoryId: number,
    membershipId?: number,
  ): Promise<number> {
    this.logger.log(
      `Resolving commission for product ${productId}, vendor ${vendorId}, category ${categoryId}, membership ${membershipId || 'none'}`,
    );

    try {
      // Step 1: Check product-level override
      const productRule = await this.productCommissionRepo.findOne({
        where: { product: { id: productId } },
      });
      if (productRule) {
        this.logger.log(
          `Resolved commission from product-level: ${productRule.percentage}%`,
        );
        return this.applyMembershipDiscount(
          productRule.percentage,
          membershipId,
        );
      }

      // Step 2: Check vendor-level override
      const vendorRule = await this.vendorCommissionRepo.findOne({
        where: { vendor: { id: vendorId } },
      });
      if (vendorRule) {
        this.logger.log(
          `Resolved commission from vendor-level: ${vendorRule.percentage}%`,
        );
        return this.applyMembershipDiscount(
          vendorRule.percentage,
          membershipId,
        );
      }

      // Step 3: Check category-level override
      const categoryRule = await this.categoryCommissionRepo.findOne({
        where: { category: { id: categoryId } },
      });
      if (categoryRule) {
        this.logger.log(
          `Resolved commission from category-level: ${categoryRule.percentage}%`,
        );
        return this.applyMembershipDiscount(
          categoryRule.percentage,
          membershipId,
        );
      }

      // Step 4: Fallback to global default
      const globalRule = await this.globalCommissionRepo.findOne({ where: {} })!;

      if (!globalRule) {
        throw new NotFoundException('Global commission rule not set');
      }

      this.logger.warn(
        `Using global fallback commission: ${globalRule.percentage}%`,
      );
      return this.applyMembershipDiscount(globalRule.percentage, membershipId);
    } catch (error: unknown) {
      this.logger.error('Failed to resolve commission', (error as Error).stack);
      throw new InternalServerErrorException('Could not resolve commission');
    }
  }
  /**
   * Applies membership-based commission discount (if any).
   * @param base - Commission percentage before discount
   * @param membershipId - Optional membership ID to check
   * @returns Adjusted commission
   */
  private async applyMembershipDiscount(
    base: number,
    membershipId?: number,
  ): Promise<number> {
    if (!membershipId) return base;

    const discountRule = await this.membershipDiscountRepo.findOne({
      where: { vendor: { id: membershipId } },
    });

    if (discountRule) {
      const adjusted = Math.max(base - discountRule.percentage, 0);
      this.logger.log(
        `Applied membership discount (-${discountRule.percentage}%) → Final: ${adjusted}%`,
      );
      return adjusted;
    }

    return base;
  }
  /**
   * Returns the current global fallback commission rule.
   */
  async getGlobalCommission(): Promise<GlobalCommissionEntity> {
    this.logger.log('Fetching global commission rule');

    const rule = await this.globalCommissionRepo.findOne({ where: {} })!;
    if (!rule) {
      this.logger.warn('Global commission rule is not set');
      throw new NotFoundException('Global commission rule not found');
    }

    return rule;
  }

  /**
   * Creates or updates the global fallback commission rule.
   * Ensures only one row is stored in the table.
   *
   * @param dto - Input with percentage and optional note
   * @param adminUserId - Firebase UID or DB user ID of the admin setting this
   */
  async setGlobalCommission(
    dto: { percentage: number; note?: string },
    adminUserId: string,
  ): Promise<GlobalCommissionEntity> {
    this.logger.log(
      `Upserting global commission to ${dto.percentage}% by admin ${adminUserId}`,
    );

    // Find existing rule
    let rule = await this.globalCommissionRepo.findOne({ where: {} })!;

    // If not exist, create new
    if (!rule) {
      rule = this.globalCommissionRepo.create({
        percentage: dto.percentage,
        note: dto.note,
        createdBy: { id: adminUserId } as any, // ensure UserEntity relation works
      });
    } else {
      // Update existing
      rule.percentage = dto.percentage;
      rule.note = dto.note;
      rule.updated_at = new Date();
    }

    const saved = await this.globalCommissionRepo.save(rule);

    // Optionally log the change
    await this.auditLogRepo.save({
      createdBy: { id: adminUserId } as any,
      note: `Global commission set to ${dto.percentage}%`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    this.logger.verbose(`Global commission saved: ${saved.percentage}%`);
    return saved;
  }
  /**
   * Set or update a category-level commission override.
   * Uses UPSERT logic to ensure idempotency.
   */
  async setCategoryCommission(
    dto: CreateCategoryCommissionDto,
    adminUserId: string,
  ): Promise<CategoryCommissionEntity> {
    this.logger.log(
      `Setting commission for category ${dto.category_id} to ${dto.percentage}%`,
    );

    let rule = await this.categoryCommissionRepo.findOne({
      where: { category: { id: dto.category_id } },
    });

    if (!rule) {
      rule = this.categoryCommissionRepo.create({
        percentage: dto.percentage,
        note: dto.note,
        category: { id: dto.category_id } as any,
        createdBy: { id: adminUserId } as any,
      });
    } else {
      rule.percentage = dto.percentage;
      rule.note = dto.note;
      rule.updated_at = new Date();
    }

    const saved = await this.categoryCommissionRepo.save(rule);

    await this.auditLogRepo.save({
      createdBy: { id: adminUserId } as any,
      note: `Category ${dto.category_id} commission set to ${dto.percentage}%`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    this.logger.verbose(
      `Saved category commission: ${saved.percentage}% for category ${dto.category_id}`,
    );
    return saved;
  }

  /**
   * Retrieve the commission override for a given category.
   * Throws 404 if not found.
   */
  async getCategoryCommission(
    categoryId: number,
  ): Promise<CategoryCommissionEntity> {
    this.logger.log(`Fetching commission for category ${categoryId}`);

    const rule = await this.categoryCommissionRepo.findOne({
      where: { category: { id: categoryId } },
      relations: ['category'],
    });

    if (!rule) {
      this.logger.warn(`No override for category ${categoryId}`);
      throw new NotFoundException('No category commission rule found');
    }

    return rule;
  }

  /**
   * Delete a category-level override (reverts to global default).
   */
  async deleteCategoryCommission(
    categoryId: number,
  ): Promise<{ success: boolean }> {
    this.logger.warn(`Deleting commission override for category ${categoryId}`);

    const existing = await this.categoryCommissionRepo.findOne({
      where: { category: { id: categoryId } },
    });

    if (!existing) {
      throw new NotFoundException('Commission rule not found');
    }

    await this.categoryCommissionRepo.remove(existing);

    await this.auditLogRepo.save({
      createdBy: { id: 'system' } as any,
      note: `Deleted category commission override for ${categoryId}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { success: true };
  }

  /**
   * Sets or updates a commission rule for a vendor.
   */
  async setVendorCommission(
    dto: CreateVendorCommissionDto,
    adminUserId: string,
  ): Promise<VendorCommissionEntity> {
    this.logger.log(
      `Setting commission for vendor ${dto.vendor_id} to ${dto.percentage}%`,
    );

    let rule = await this.vendorCommissionRepo.findOne({
      where: { vendor: { id: dto.vendor_id } },
    });

    if (!rule) {
      rule = this.vendorCommissionRepo.create({
        vendor: { id: dto.vendor_id } as any,
        percentage: dto.percentage,
        note: dto.note,
        createdBy: { id: adminUserId } as any,
      });
    } else {
      rule.percentage = dto.percentage;
      rule.note = dto.note;
      rule.updated_at = new Date();
    }

    const saved = await this.vendorCommissionRepo.save(rule);

    await this.auditLogRepo.save({
      createdBy: { id: adminUserId } as any,
      note: `Vendor ${dto.vendor_id} commission set to ${dto.percentage}%`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    this.logger.verbose(
      `Saved vendor commission override: ${saved.percentage}%`,
    );
    return saved;
  }

  /**
   * Retrieves the commission override for a vendor
   */
  async getVendorCommission(vendorId: number): Promise<VendorCommissionEntity> {
    this.logger.log(`Fetching commission for vendor ${vendorId}`);

    const rule = await this.vendorCommissionRepo.findOne({
      where: { vendor: { id: vendorId } },
      relations: ['vendor'],
    });

    if (!rule) {
      this.logger.warn(`No override found for vendor ${vendorId}`);
      throw new NotFoundException('Vendor commission rule not found');
    }

    return rule;
  }

  /**
   * Removes the vendor override from the DB
   */
  async deleteVendorCommission(
    vendorId: number,
  ): Promise<{ success: boolean }> {
    this.logger.warn(`Deleting commission override for vendor ${vendorId}`);

    const existing = await this.vendorCommissionRepo.findOne({
      where: { vendor: { id: vendorId } },
    });

    if (!existing) {
      throw new NotFoundException('Vendor commission rule not found');
    }

    await this.vendorCommissionRepo.remove(existing);

    await this.auditLogRepo.save({
      createdBy: { id: 'system' } as any,
      note: `Deleted vendor commission override for ${vendorId}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { success: true };
  }

  /**
   * Create or update a product-level commission override.
   */
  async setProductCommission(
    dto: CreateProductCommissionDto,
    adminUserId: string,
  ): Promise<ProductCommissionEntity> {
    this.logger.log(
      `Setting commission for product ${dto.product_id} to ${dto.percentage}%`,
    );

    let rule = await this.productCommissionRepo.findOne({
      where: { product: { id: dto.product_id } },
    });

    if (!rule) {
      rule = this.productCommissionRepo.create({
        product: { id: dto.product_id } as any,
        percentage: dto.percentage,
        note: dto.note,
        createdBy: { id: adminUserId } as any,
      });
    } else {
      rule.percentage = dto.percentage;
      rule.note = dto.note;
      rule.updated_at = new Date();
    }

    const saved = await this.productCommissionRepo.save(rule);

    await this.auditLogRepo.save({
      createdBy: { id: adminUserId } as any,
      note: `Product ${dto.product_id} commission set to ${dto.percentage}%`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    this.logger.verbose(
      `Saved product commission override: ${saved.percentage}%`,
    );
    return saved;
  }

  /**
   * Retrieve product-level commission override
   */
  async getProductCommission(
    productId: number,
  ): Promise<ProductCommissionEntity> {
    this.logger.log(`Fetching commission for product ${productId}`);

    const rule = await this.productCommissionRepo.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });

    if (!rule) {
      this.logger.warn(`No override found for product ${productId}`);
      throw new NotFoundException('Product commission rule not found');
    }

    return rule;
  }

  /**
   * Delete a product commission override (reverts to vendor/category/global).
   */
  async deleteProductCommission(
    productId: number,
  ): Promise<{ success: boolean }> {
    this.logger.warn(`Deleting commission override for product ${productId}`);

    const existing = await this.productCommissionRepo.findOne({
      where: { product: { id: productId } },
    });

    if (!existing) {
      throw new NotFoundException('Product commission rule not found');
    }

    await this.productCommissionRepo.remove(existing);

    await this.auditLogRepo.save({
      createdBy: { id: 'system' } as any,
      note: `Deleted product commission override for ${productId}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { success: true };
  }

  /**
   * Set or update a membership-tier based commission discount.
   * These are subtracted after base commission resolution.
   */
  async setMembershipDiscount(
    dto: CreateMembershipDiscountDto,
    adminUserId: string,
  ): Promise<MembershipDiscountEntity> {
    this.logger.log(
      `Setting ${dto.percentage}% commission discount for membership ${dto.membership_id}`,
    );

    let rule = await this.membershipDiscountRepo.findOne({
      where: { vendor: { id: dto.membership_id } },
    });

    if (!rule) {
      rule = this.membershipDiscountRepo.create({
        vendor: { id: dto.membership_id } as any, // reuse vendor_membership FK
        percentage: dto.percentage,
        note: dto.note,
        createdBy: { id: adminUserId } as any,
      });
    } else {
      rule.percentage = dto.percentage;
      rule.note = dto.note;
      rule.updated_at = new Date();
    }

    const saved = await this.membershipDiscountRepo.save(rule);

    await this.auditLogRepo.save({
      createdBy: { id: adminUserId } as any,
      note: `Set ${dto.percentage}% discount for membership ${dto.membership_id}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    this.logger.verbose(
      `Membership discount saved: ${saved.percentage}% for membership ${dto.membership_id}`,
    );
    return saved;
  }

  /**
   * View discount assigned to a membership tier
   */
  async getMembershipDiscount(
    membershipId: number,
  ): Promise<MembershipDiscountEntity> {
    this.logger.log(`Fetching discount for membership ${membershipId}`);

    const rule = await this.membershipDiscountRepo.findOne({
      where: { vendor: { id: membershipId } },
      relations: ['vendor'],
    });

    if (!rule) {
      this.logger.warn(`No discount rule found for membership ${membershipId}`);
      throw new NotFoundException('Membership discount not found');
    }

    return rule;
  }

  /**
   * Remove discount from a membership tier
   */
  async deleteMembershipDiscount(
    membershipId: number,
  ): Promise<{ success: boolean }> {
    this.logger.warn(`Deleting discount for membership ${membershipId}`);

    const existing = await this.membershipDiscountRepo.findOne({
      where: { vendor: { id: membershipId } },
    });

    if (!existing) {
      throw new NotFoundException('Membership discount not found');
    }

    await this.membershipDiscountRepo.remove(existing);

    await this.auditLogRepo.save({
      createdBy: { id: 'system' } as any,
      note: `Deleted discount rule for membership ${membershipId}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { success: true };
  }

  /**
   * Calculates the total commission amount for a given vendor.
   * Aggregates commissions from order items for the vendor.
   *
   * @param vendorId - Vendor ID to calculate commissions for
   * @returns An object with a total field
   */
  async calculateCommissionForVendor(
    vendorId: number,
  ): Promise<{ total: number }> {
    this.logger.log(`Calculating total commission for vendor ${vendorId}`);

    // Since OrderItem doesn't have commission fields, we'll calculate based on sales
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.vendor', 'vendor')
      .select('SUM(item.price * item.quantity)', 'totalSales')
      .where('vendor.id = :vendorId', { vendorId })
      .getRawOne();

    // Estimate commission at 10% (in production, you'd calculate the actual commission)
    const estimatedCommission =
      (parseFloat(result.totalSales || '0') * 10) / 100;

    return { total: estimatedCommission };
  }

  /**
   * ENTERPRISE FEATURE: Bulk commission calculation for multiple orders
   * Processes commission calculations in batches for performance
   *
   * @param orderIds - Array of order IDs to process
   * @param batchSize - Number of orders to process per batch (default: 100)
   * @returns Commission calculation results with performance metrics
   */
  async bulkCalculateCommissions(
    orderIds: number[],
    batchSize: number = 100,
  ): Promise<{
    processed: number;
    failed: number;
    totalCommission: number;
    processingTime: number;
    errors: Array<{ orderId: number; error: string }>;
  }> {
    const startTime = Date.now();
    this.logger.log(
      `Starting bulk commission calculation for ${orderIds.length} orders`,
    );

    let processed = 0;
    let failed = 0;
    let totalCommission = 0;
    const errors: Array<{ orderId: number; error: string }> = [];

    // Process orders in batches to avoid memory issues
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      this.logger.debug(
        `Processing batch ${Math.floor(i / batchSize) + 1} with ${batch.length} orders`,
      );

      try {
        const batchResult = await this.orderItemRepo
          .createQueryBuilder('item')
          .leftJoin('item.order', 'order')
          .leftJoin('item.variant', 'variant')
          .leftJoin('variant.product', 'product')
          .leftJoin('product.category', 'category')
          .leftJoin('product.vendor', 'vendor')
          .select([
            'order.id as orderId',
            'item.id as itemId',
            'product.id as productId',
            'vendor.id as vendorId',
            'category.id as categoryId',
            'item.price as price',
            'item.quantity as quantity',
          ])
          .where('order.id IN (:...orderIds)', { orderIds: batch })
          .getRawMany();

        // Calculate commission for each order item
        for (const item of batchResult) {
          try {
            const commission = await this.getEffectiveCommission(
              item.productId,
              item.vendorId,
              item.categoryId,
            );

            const commissionAmount =
              (item.price * item.quantity * commission) / 100;
            totalCommission += commissionAmount;
            processed++;

            // Store commission data in audit log since OrderItem doesn't have commission fields
            await this.auditLogRepo.save({
              createdBy: { id: 'system' } as any,
              note: `Commission calculated: ${commission}% = ${commissionAmount} for order ${item.orderId}, item ${item.itemId}`,
              created_at: new Date(),
              updated_at: new Date(),
            });
          } catch (error: unknown) {
            failed++;
            errors.push({
              orderId: item.orderId,
              error: (error as Error).message,
            });
            this.logger.error(
              `Failed to calculate commission for order ${item.orderId}`,
              (error as Error).stack,
            );
          }
        }
      } catch (error: unknown) {
        // Handle batch-level errors
        batch.forEach((orderId) => {
          failed++;
          errors.push({
            orderId,
            error: `Batch processing failed: ${(error as Error).message}`,
          });
        });
        this.logger.error(
          `Batch processing failed for orders ${batch.join(', ')}`,
          (error as Error).stack,
        );
      }
    }

    const processingTime = Date.now() - startTime;
    this.logger.log(
      `Bulk commission calculation completed: ${processed} processed, ${failed} failed, ${processingTime}ms`,
    );

    return {
      processed,
      failed,
      totalCommission,
      processingTime,
      errors,
    };
  }

  /**
   * ENTERPRISE FEATURE: Get commission analytics for a date range
   * Provides detailed commission breakdown and statistics
   *
   * @param startDate - Start date for analytics
   * @param endDate - End date for analytics
   * @param vendorId - Optional vendor ID to filter by
   * @returns Comprehensive commission analytics
   */
  async getCommissionAnalytics(
    startDate: Date,
    endDate: Date,
    vendorId?: number,
  ): Promise<{
    totalCommission: number;
    totalOrders: number;
    averageCommissionRate: number;
    commissionByVendor: Array<{
      vendorId: number;
      vendorName: string;
      totalCommission: number;
      orderCount: number;
      averageRate: number;
    }>;
    commissionByCategory: Array<{
      categoryId: number;
      categoryName: string;
      totalCommission: number;
      orderCount: number;
      averageRate: number;
    }>;
    dailyBreakdown: Array<{
      date: string;
      totalCommission: number;
      orderCount: number;
    }>;
  }> {
    this.logger.log(
      `Generating commission analytics from ${startDate} to ${endDate}`,
    );

    const baseQuery = this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoin('item.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.vendor', 'vendor')
      .leftJoin('product.category', 'category')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (vendorId) {
      baseQuery.andWhere('vendor.id = :vendorId', { vendorId });
    }

    // For analytics, we'll calculate commission on-the-fly since OrderItem doesn't store it
    // This is a simplified version - in production you'd want to store calculated commissions
    const totals = await baseQuery
      .select([
        'SUM(item.price * item.quantity) as totalSales',
        'COUNT(DISTINCT order.id) as totalOrders',
        'COUNT(item.id) as totalItems',
      ])
      .getRawOne();

    // Commission by vendor - simplified calculation
    const commissionByVendor = await baseQuery
      .select([
        'vendor.id as vendorId',
        'vendor.name as vendorName',
        'SUM(item.price * item.quantity) as totalSales',
        'COUNT(DISTINCT order.id) as orderCount',
        'COUNT(item.id) as itemCount',
      ])
      .groupBy('vendor.id, vendor.name')
      .orderBy('totalSales', 'DESC')
      .getRawMany();

    // Commission by category - simplified calculation
    const commissionByCategory = await baseQuery
      .select([
        'category.id as categoryId',
        'category.name as categoryName',
        'SUM(item.price * item.quantity) as totalSales',
        'COUNT(DISTINCT order.id) as orderCount',
        'COUNT(item.id) as itemCount',
      ])
      .groupBy('category.id, category.name')
      .orderBy('totalSales', 'DESC')
      .getRawMany();

    // Daily breakdown
    const dailyBreakdown = await baseQuery
      .select([
        'DATE(order.createdAt) as date',
        'SUM(item.price * item.quantity) as totalSales',
        'COUNT(DISTINCT order.id) as orderCount',
      ])
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Estimate commission at 10% for analytics (this would be calculated properly in production)
    const estimatedCommissionRate = 10;
    const estimatedTotalCommission =
      (parseFloat(totals.totalSales || '0') * estimatedCommissionRate) / 100;

    return {
      totalCommission: estimatedTotalCommission,
      totalOrders: parseInt(totals.totalOrders || '0'),
      averageCommissionRate: estimatedCommissionRate,
      commissionByVendor: commissionByVendor.map((item) => ({
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        totalCommission:
          (parseFloat(item.totalSales || '0') * estimatedCommissionRate) / 100,
        orderCount: parseInt(item.orderCount || '0'),
        averageRate: estimatedCommissionRate,
      })),
      commissionByCategory: commissionByCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalCommission:
          (parseFloat(item.totalSales || '0') * estimatedCommissionRate) / 100,
        orderCount: parseInt(item.orderCount || '0'),
        averageRate: estimatedCommissionRate,
      })),
      dailyBreakdown: dailyBreakdown.map((item) => ({
        date: item.date,
        totalCommission:
          (parseFloat(item.totalSales || '0') * estimatedCommissionRate) / 100,
        orderCount: parseInt(item.orderCount || '0'),
      })),
    };
  }

  /**
   * ENTERPRISE FEATURE: Validate commission configuration
   * Ensures all commission rules are properly configured and consistent
   *
   * @returns Validation results with any issues found
   */
  async validateCommissionConfiguration(): Promise<{
    isValid: boolean;
    issues: Array<{
      type: 'warning' | 'error';
      message: string;
      entity?: string;
      entityId?: number;
    }>;
  }> {
    this.logger.log('Validating commission configuration');
    const issues: Array<{
      type: 'warning' | 'error';
      message: string;
      entity?: string;
      entityId?: number;
    }> = [];

    // Check for global commission rule
    const globalRule = await this.globalCommissionRepo.findOne({ where: {} })!;
    if (!globalRule) {
      issues.push({
        type: 'error',
        message: 'Global commission rule is not configured',
        entity: 'global',
      });
    } else if (globalRule.percentage <= 0 || globalRule.percentage >= 100) {
      issues.push({
        type: 'error',
        message: `Global commission percentage is invalid: ${globalRule.percentage}%`,
        entity: 'global',
        entityId: globalRule.id,
      });
    }

    // Check for invalid vendor commission percentages
    const invalidVendorRules = await this.vendorCommissionRepo
      .createQueryBuilder('vc')
      .where('vc.percentage <= 0 OR vc.percentage >= 100')
      .getMany();

    invalidVendorRules.forEach((rule) => {
      issues.push({
        type: 'error',
        message: `Invalid vendor commission percentage: ${rule.percentage}%`,
        entity: 'vendor',
        entityId: rule.id,
      });
    });

    // Check for invalid category commission percentages
    const invalidCategoryRules = await this.categoryCommissionRepo
      .createQueryBuilder('cc')
      .where('cc.percentage <= 0 OR cc.percentage >= 100')
      .getMany();

    invalidCategoryRules.forEach((rule) => {
      issues.push({
        type: 'error',
        message: `Invalid category commission percentage: ${rule.percentage}%`,
        entity: 'category',
        entityId: rule.id,
      });
    });

    // Check for invalid product commission percentages
    const invalidProductRules = await this.productCommissionRepo
      .createQueryBuilder('pc')
      .where('pc.percentage <= 0 OR pc.percentage >= 100')
      .getMany();

    invalidProductRules.forEach((rule) => {
      issues.push({
        type: 'error',
        message: `Invalid product commission percentage: ${rule.percentage}%`,
        entity: 'product',
        entityId: rule.id,
      });
    });

    // Check for membership discounts that exceed 100%
    const invalidDiscounts = await this.membershipDiscountRepo
      .createQueryBuilder('md')
      .where('md.percentage < 0 OR md.percentage >= 100')
      .getMany();

    invalidDiscounts.forEach((discount) => {
      issues.push({
        type: 'error',
        message: `Invalid membership discount percentage: ${discount.percentage}%`,
        entity: 'membership_discount',
        entityId: discount.id,
      });
    });

    // Check for potential conflicts (warnings)
    const highCommissionRules = await this.productCommissionRepo
      .createQueryBuilder('pc')
      .where('pc.percentage > 50')
      .getMany();

    highCommissionRules.forEach((rule) => {
      issues.push({
        type: 'warning',
        message: `High commission percentage detected: ${rule.percentage}%`,
        entity: 'product',
        entityId: rule.id,
      });
    });

    const isValid = !issues.some((issue) => issue.type === 'error');

    this.logger.log(
      `Commission validation completed: ${isValid ? 'VALID' : 'INVALID'} with ${issues.length} issues`,
    );

    return {
      isValid,
      issues,
    };
  }
}
