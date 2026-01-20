/**
 * @file coupons.service.ts
 * @description Comprehensive coupon management service for SouqSyria platform
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';

import {
  CouponEntity,
  CouponStatus,
  CouponType,
} from '../entities/coupon.entity';
import { CouponUsage, UsageStatus } from '../entities/coupon-usage.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';

import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { CouponQueryDto } from '../dto/coupon-query.dto';
import { BulkCouponActionDto, BulkAction } from '../dto/bulk-coupon-action.dto';
import { CouponResponseDto } from '../dto/coupon-response.dto';
import { CouponValidationResponseDto } from '../dto/coupon-validation-response.dto';
import { PaginatedCouponsResponseDto } from '../dto/paginated-coupons-response.dto';
import { CouponAnalyticsDto } from '../dto/coupon-analytics.dto';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,
  ) {}

  async createCoupon(
    createCouponDto: CreateCouponDto,
    createdByUserId: number,
  ): Promise<CouponResponseDto> {
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) {
      throw new ConflictException(
        `Coupon code '${createCouponDto.code}' already exists`,
      );
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      valid_from: new Date(createCouponDto.valid_from),
      valid_to: new Date(createCouponDto.valid_to),
      status: CouponStatus.DRAFT,
      usage_count: 0,
    });

    const savedCoupon = await this.couponRepository.save(coupon);
    return this.mapToResponseDto(savedCoupon);
  }

  async getAllCoupons(
    query: CouponQueryDto,
  ): Promise<PaginatedCouponsResponseDto> {
    const { page = 1, limit = 20, search, status, type } = query;

    const options: FindManyOptions<CouponEntity> = {
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    };

    const where: any = {};
    if (search) where.code = Like(`%${search}%`);
    if (status) where.status = status;
    if (type) where.coupon_type = type;

    options.where = where;
    const [coupons, total] = await this.couponRepository.findAndCount(options);

    return {
      data: coupons.map((coupon) => this.mapToResponseDto(coupon)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getCouponById(id: number): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return this.mapToResponseDto(coupon);
  }

  async getCouponByCode(code: string): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with code '${code}' not found`);
    }
    return this.mapToResponseDto(coupon);
  }

  async updateCoupon(
    id: number,
    updateCouponDto: UpdateCouponDto,
    updatedByUserId: number,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    Object.assign(coupon, updateCouponDto);
    const savedCoupon = await this.couponRepository.save(coupon);
    return this.mapToResponseDto(savedCoupon);
  }

  async deleteCoupon(id: number, deletedByUserId: number): Promise<void> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.status = CouponStatus.CANCELLED;
    await this.couponRepository.save(coupon);
  }

  async validateCoupon(
    validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResponseDto> {
    const { code, order_amount } = validateCouponDto;

    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) {
      return {
        is_valid: false,
        error_message: 'Coupon not found',
        error_code: 'COUPON_NOT_FOUND',
        coupon_code: code,
      };
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      return {
        is_valid: false,
        error_message: 'Coupon is not active',
        error_code: 'COUPON_INACTIVE',
        coupon_code: code,
      };
    }

    const discountAmount = this.calculateDiscountAmount(coupon, order_amount);
    return {
      is_valid: true,
      discount_amount: discountAmount,
      final_amount: order_amount - discountAmount,
      coupon_code: code,
    };
  }

  async applyCoupon(
    applyCouponDto: any,
  ): Promise<{ discount_amount: number; final_amount: number }> {
    throw new Error('Not implemented yet');
  }

  async activateCoupon(id: number, activatedByUserId: number): Promise<void> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.status = CouponStatus.ACTIVE;
    await this.couponRepository.save(coupon);
  }

  async deactivateCoupon(
    id: number,
    deactivatedByUserId: number,
  ): Promise<void> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.status = CouponStatus.PAUSED;
    await this.couponRepository.save(coupon);
  }

  async bulkAction(
    bulkActionDto: BulkCouponActionDto,
    performedByUserId: number,
  ): Promise<{ affected_count: number }> {
    const { coupon_ids, action } = bulkActionDto;
    const coupons = await this.couponRepository.findByIds(coupon_ids);

    for (const coupon of coupons) {
      switch (action) {
        case BulkAction.ACTIVATE:
          coupon.status = CouponStatus.ACTIVE;
          break;
        case BulkAction.DEACTIVATE:
          coupon.status = CouponStatus.PAUSED;
          break;
        case BulkAction.DELETE:
          coupon.status = CouponStatus.CANCELLED;
          break;
      }
    }

    await this.couponRepository.save(coupons);
    return { affected_count: coupons.length };
  }

  async getCouponAnalytics(id: number): Promise<CouponAnalyticsDto> {
    throw new Error('Not implemented yet');
  }

  async getCouponAnalyticsSummary(period: string): Promise<any> {
    throw new Error('Not implemented yet');
  }

  private calculateDiscountAmount(
    coupon: CouponEntity,
    orderAmount: number,
  ): number {
    let discountAmount = 0;

    switch (coupon.coupon_type) {
      case CouponType.PERCENTAGE:
        discountAmount = (orderAmount * coupon.discount_value) / 100;
        if (
          coupon.max_discount_amount &&
          discountAmount > coupon.max_discount_amount
        ) {
          discountAmount = coupon.max_discount_amount;
        }
        break;
      case CouponType.FIXED_AMOUNT:
        discountAmount = coupon.discount_value;
        if (discountAmount > orderAmount) {
          discountAmount = orderAmount;
        }
        break;
      default:
        discountAmount = 0;
    }

    return Math.round(discountAmount * 100) / 100;
  }

  private mapToResponseDto(coupon: CouponEntity): CouponResponseDto {
    return {
      id: coupon.id,
      code: coupon.code,
      title_en: coupon.title_en,
      title_ar: coupon.title_ar,
      description_en: coupon.description_en,
      description_ar: coupon.description_ar,
      coupon_type: coupon.coupon_type,
      discount_value: coupon.discount_value,
      max_discount_amount: coupon.max_discount_amount,
      min_order_amount: coupon.min_order_amount,
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to,
      usage_limit: coupon.usage_limit,
      usage_limit_per_user: coupon.usage_limit_per_user,
      usage_count: coupon.usage_count,
      status: coupon.status,
      allowed_user_tiers: coupon.allowed_user_tiers,
      is_stackable: coupon.is_stackable,
      is_public: coupon.is_public,
      is_first_time_user_only: coupon.is_first_time_user_only,
      created_at: coupon.created_at,
      updated_at: coupon.updated_at,
    };
  }
}
