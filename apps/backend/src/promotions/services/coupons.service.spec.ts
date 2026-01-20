/**
 * @file coupons.service.spec.ts
 * @description Unit tests for CouponsService
 *
 * Tests service business logic, validation, and error handling
 * without requiring database connectivity for faster testing.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { CouponsService } from './coupons.service';
import {
  CouponEntity,
  CouponType,
  CouponStatus,
  UserTier,
} from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { BulkAction } from '../dto/bulk-coupon-action.dto';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponRepository: jest.Mocked<Repository<CouponEntity>>;
  let couponUsageRepository: jest.Mocked<Repository<CouponUsage>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let vendorRepository: jest.Mocked<Repository<VendorEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: getRepositoryToken(CouponEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findByIds: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(CouponUsage),
          useFactory: () => ({
            count: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Category),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(VendorEntity),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    couponRepository = module.get(getRepositoryToken(CouponEntity));
    couponUsageRepository = module.get(getRepositoryToken(CouponUsage));
    userRepository = module.get(getRepositoryToken(User));
    categoryRepository = module.get(getRepositoryToken(Category));
    vendorRepository = module.get(getRepositoryToken(VendorEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🎟️ Coupon Creation', () => {
    it('should create coupon successfully', async () => {
      const createCouponDto = {
        code: 'TEST2025',
        title_en: 'Test Coupon',
        title_ar: 'كوبون تجريبي',
        description_en: 'Test description',
        description_ar: 'وصف تجريبي',
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 15,
        max_discount_amount: 50000,
        min_order_amount: 25000,
        valid_from: '2025-08-16T00:00:00Z',
        valid_to: '2025-12-31T23:59:59Z',
        usage_limit: 100,
        usage_limit_per_user: 1,
        is_public: true,
      };

      const mockCoupon = {
        id: 1,
        ...createCouponDto,
        valid_from: new Date(createCouponDto.valid_from),
        valid_to: new Date(createCouponDto.valid_to),
        status: CouponStatus.DRAFT,
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(null); // No existing coupon
      couponRepository.create.mockReturnValue(mockCoupon);
      couponRepository.save.mockResolvedValue(mockCoupon);

      const result = await service.createCoupon(createCouponDto, 1);

      expect(result.code).toBe('TEST2025');
      expect(result.status).toBe('draft');
      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'TEST2025' },
      });
      expect(couponRepository.create).toHaveBeenCalled();
      expect(couponRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate coupon code', async () => {
      const createCouponDto = {
        code: 'EXISTING2025',
        title_en: 'Test Coupon',
        title_ar: 'كوبون تجريبي',
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 15,
        valid_from: '2025-08-16T00:00:00Z',
        valid_to: '2025-12-31T23:59:59Z',
      };

      const existingCoupon = { id: 1, code: 'EXISTING2025' } as CouponEntity;
      couponRepository.findOne.mockResolvedValue(existingCoupon);

      await expect(service.createCoupon(createCouponDto, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('🔍 Coupon Retrieval', () => {
    it('should get all coupons with pagination', async () => {
      const mockCoupons = [
        {
          id: 1,
          code: 'TEST1',
          title_en: 'Test 1',
          title_ar: 'تجريبي 1',
          status: CouponStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          code: 'TEST2',
          title_en: 'Test 2',
          title_ar: 'تجريبي 2',
          status: CouponStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ] as CouponEntity[];

      couponRepository.findAndCount.mockResolvedValue([mockCoupons, 2]);

      const result = await service.getAllCoupons({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total_pages).toBe(1);
    });

    it('should get coupon by ID', async () => {
      const mockCoupon = {
        id: 1,
        code: 'TEST2025',
        title_en: 'Test Coupon',
        title_ar: 'كوبون تجريبي',
        status: CouponStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.getCouponById(1);

      expect(result.id).toBe(1);
      expect(result.code).toBe('TEST2025');
      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException for non-existent coupon ID', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(service.getCouponById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should get coupon by code', async () => {
      const mockCoupon = {
        id: 1,
        code: 'WELCOME2025',
        title_en: 'Welcome Coupon',
        title_ar: 'كوبون الترحيب',
        status: CouponStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.getCouponByCode('WELCOME2025');

      expect(result.code).toBe('WELCOME2025');
      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'WELCOME2025' },
      });
    });

    it('should throw NotFoundException for non-existent coupon code', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(service.getCouponByCode('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('✅ Coupon Validation', () => {
    it('should validate active coupon successfully', async () => {
      const mockCoupon = {
        id: 1,
        code: 'WELCOME2025',
        status: CouponStatus.ACTIVE,
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 15,
        max_discount_amount: 75000,
        min_order_amount: 50000,
        valid_from: new Date('2025-01-01'),
        valid_to: new Date('2025-12-31'),
        usage_limit: 1000,
        usage_count: 50,
        usage_limit_per_user: 1,
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'WELCOME2025',
        order_amount: 100000,
      });

      expect(result.is_valid).toBe(true);
      expect(result.discount_amount).toBe(15000); // 15% of 100,000
      expect(result.final_amount).toBe(85000);
      expect(result.coupon_code).toBe('WELCOME2025');
    });

    it('should reject non-existent coupon', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      const result = await service.validateCoupon({
        code: 'NONEXISTENT',
        order_amount: 100000,
      });

      expect(result.is_valid).toBe(false);
      expect(result.error_code).toBe('COUPON_NOT_FOUND');
      expect(result.error_message).toContain('not found');
    });

    it('should reject inactive coupon', async () => {
      const mockCoupon = {
        id: 1,
        code: 'INACTIVE2025',
        status: CouponStatus.PAUSED,
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 15,
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'INACTIVE2025',
        order_amount: 100000,
      });

      expect(result.is_valid).toBe(false);
      expect(result.error_code).toBe('COUPON_INACTIVE');
    });

    it('should apply maximum discount limit for percentage coupons', async () => {
      const mockCoupon = {
        id: 1,
        code: 'LIMITED2025',
        status: CouponStatus.ACTIVE,
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 20,
        max_discount_amount: 50000, // Max 50,000 SYP
        valid_from: new Date('2025-01-01'),
        valid_to: new Date('2025-12-31'),
        usage_limit: 1000,
        usage_count: 50,
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'LIMITED2025',
        order_amount: 500000, // Large order
      });

      expect(result.is_valid).toBe(true);
      expect(result.discount_amount).toBe(50000); // Capped at max
      expect(result.final_amount).toBe(450000);
    });

    it('should handle fixed amount discount correctly', async () => {
      const mockCoupon = {
        id: 1,
        code: 'FIXED50K',
        status: CouponStatus.ACTIVE,
        coupon_type: CouponType.FIXED_AMOUNT,
        discount_value: 50000,
        valid_from: new Date('2025-01-01'),
        valid_to: new Date('2025-12-31'),
        usage_limit: 500,
        usage_count: 25,
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'FIXED50K',
        order_amount: 200000,
      });

      expect(result.is_valid).toBe(true);
      expect(result.discount_amount).toBe(50000);
      expect(result.final_amount).toBe(150000);
    });

    it('should not discount more than order amount for fixed coupons', async () => {
      const mockCoupon = {
        id: 1,
        code: 'BIGDISCOUNT',
        status: CouponStatus.ACTIVE,
        coupon_type: CouponType.FIXED_AMOUNT,
        discount_value: 100000, // Large discount
        valid_from: new Date('2025-01-01'),
        valid_to: new Date('2025-12-31'),
        usage_limit: 100,
        usage_count: 10,
      } as CouponEntity;

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'BIGDISCOUNT',
        order_amount: 75000, // Smaller order
      });

      expect(result.is_valid).toBe(true);
      expect(result.discount_amount).toBe(75000); // Limited to order amount
      expect(result.final_amount).toBe(0);
    });
  });

  describe('🔧 Coupon Management', () => {
    it('should update coupon successfully', async () => {
      const existingCoupon = {
        id: 1,
        code: 'TEST2025',
        title_en: 'Original Title',
        discount_value: 15,
      } as CouponEntity;

      const updatedCoupon = {
        ...existingCoupon,
        title_en: 'Updated Title',
        discount_value: 20,
      };

      couponRepository.findOne.mockResolvedValue(existingCoupon);
      couponRepository.save.mockResolvedValue(updatedCoupon);

      const result = await service.updateCoupon(
        1,
        {
          title_en: 'Updated Title',
          discount_value: 20,
        },
        1,
      );

      expect(result.title_en).toBe('Updated Title');
      expect(result.discount_value).toBe(20);
    });

    it('should activate coupon', async () => {
      const draftCoupon = {
        id: 1,
        code: 'DRAFT2025',
        status: CouponStatus.DRAFT,
      } as CouponEntity;

      const activatedCoupon = {
        ...draftCoupon,
        status: CouponStatus.ACTIVE,
      };

      couponRepository.findOne.mockResolvedValue(draftCoupon);
      couponRepository.save.mockResolvedValue(activatedCoupon);

      await service.activateCoupon(1, 1);

      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CouponStatus.ACTIVE }),
      );
    });

    it('should deactivate coupon', async () => {
      const activeCoupon = {
        id: 1,
        code: 'ACTIVE2025',
        status: CouponStatus.ACTIVE,
      } as CouponEntity;

      const pausedCoupon = {
        ...activeCoupon,
        status: CouponStatus.PAUSED,
      };

      couponRepository.findOne.mockResolvedValue(activeCoupon);
      couponRepository.save.mockResolvedValue(pausedCoupon);

      await service.deactivateCoupon(1, 1);

      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CouponStatus.PAUSED }),
      );
    });

    it('should delete coupon (soft delete)', async () => {
      const activeCoupon = {
        id: 1,
        code: 'TODELETE2025',
        status: CouponStatus.ACTIVE,
      } as CouponEntity;

      const cancelledCoupon = {
        ...activeCoupon,
        status: CouponStatus.CANCELLED,
      };

      couponRepository.findOne.mockResolvedValue(activeCoupon);
      couponRepository.save.mockResolvedValue(cancelledCoupon);

      await service.deleteCoupon(1, 1);

      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CouponStatus.CANCELLED }),
      );
    });
  });

  describe('📦 Bulk Operations', () => {
    it('should perform bulk activation', async () => {
      const coupons = [
        { id: 1, code: 'BULK1', status: CouponStatus.DRAFT },
        { id: 2, code: 'BULK2', status: CouponStatus.DRAFT },
        { id: 3, code: 'BULK3', status: CouponStatus.DRAFT },
      ] as CouponEntity[];

      couponRepository.findByIds.mockResolvedValue(coupons);
      couponRepository.save.mockImplementation(
        async (entities) => entities as any,
      );

      const result = await service.bulkAction(
        {
          coupon_ids: [1, 2, 3],
          action: BulkAction.ACTIVATE,
        },
        1,
      );

      expect(result.affected_count).toBe(3);
      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: CouponStatus.ACTIVE }),
          expect.objectContaining({ status: CouponStatus.ACTIVE }),
          expect.objectContaining({ status: CouponStatus.ACTIVE }),
        ]),
      );
    });

    it('should perform bulk deactivation', async () => {
      const coupons = [
        { id: 1, code: 'BULK1', status: CouponStatus.ACTIVE },
        { id: 2, code: 'BULK2', status: CouponStatus.ACTIVE },
      ] as CouponEntity[];

      couponRepository.findByIds.mockResolvedValue(coupons);
      couponRepository.save.mockImplementation(
        async (entities) => entities as any,
      );

      const result = await service.bulkAction(
        {
          coupon_ids: [1, 2],
          action: BulkAction.DEACTIVATE,
        },
        1,
      );

      expect(result.affected_count).toBe(2);
      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: CouponStatus.PAUSED }),
          expect.objectContaining({ status: CouponStatus.PAUSED }),
        ]),
      );
    });

    it('should perform bulk deletion', async () => {
      const coupons = [
        { id: 1, code: 'BULK1', status: CouponStatus.ACTIVE },
        { id: 2, code: 'BULK2', status: CouponStatus.PAUSED },
      ] as CouponEntity[];

      couponRepository.findByIds.mockResolvedValue(coupons);
      couponRepository.save.mockImplementation(
        async (entities) => entities as any,
      );

      const result = await service.bulkAction(
        {
          coupon_ids: [1, 2],
          action: BulkAction.DELETE,
        },
        1,
      );

      expect(result.affected_count).toBe(2);
      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: CouponStatus.CANCELLED }),
          expect.objectContaining({ status: CouponStatus.CANCELLED }),
        ]),
      );
    });
  });
});
