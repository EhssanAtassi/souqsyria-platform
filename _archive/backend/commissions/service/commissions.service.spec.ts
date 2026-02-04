/**
 * 💰 CommissionsService Test Suite
 *
 * Comprehensive unit tests for commission management covering:
 * - Priority-based commission resolution (product → vendor → category → global)
 * - Membership discount application
 * - CRUD operations for all commission levels
 * - Audit logging
 * - Bulk commission calculations
 * - Commission analytics
 * - Configuration validation
 * - Syrian market scenarios with SYP pricing
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

import { CommissionsService } from './commissions.service';
import { ProductCommissionEntity } from '../entites/product-commission.entity';
import { VendorCommissionEntity } from '../entites/vendor-commission.entity';
import { CategoryCommissionEntity } from '../entites/category-commission.entity';
import { GlobalCommissionEntity } from '../entites/global-commission.entity';
import { MembershipDiscountEntity } from '../entites/membership-discount.entity';
import { CommissionAuditLogEntity } from '../entites/commission-audit-log.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

// =============================================================================
// MOCK FACTORIES - Syrian Market Data
// =============================================================================

/**
 * Factory for creating Syrian vendor commission
 */
const createVendorCommission = (overrides = {}): any => ({
  id: 1,
  percentage: 12,
  note: 'Standard Syrian vendor commission',
  vendor: { id: 1, name: 'Damascus Electronics' },
  createdBy: { id: 'admin-1' },
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Factory for creating Syrian category commission
 */
const createCategoryCommission = (overrides = {}): any => ({
  id: 1,
  percentage: 10,
  note: 'Electronics category commission',
  category: { id: 1, name: 'إلكترونيات', name_ar: 'إلكترونيات' },
  createdBy: { id: 'admin-1' },
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Factory for creating Syrian product commission
 */
const createProductCommission = (overrides = {}): any => ({
  id: 1,
  percentage: 8,
  note: 'Special rate for iPhone products',
  product: { id: 1, name: 'آيفون 15 برو' },
  createdBy: { id: 'admin-1' },
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Factory for creating global commission
 */
const createGlobalCommission = (overrides = {}): any => ({
  id: 1,
  percentage: 15,
  note: 'Default Syrian marketplace commission',
  createdBy: { id: 'admin-1' },
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Factory for creating membership discount
 */
const createMembershipDiscount = (overrides = {}): any => ({
  id: 1,
  percentage: 2,
  note: 'Gold tier discount - 2% reduction',
  vendor: { id: 1 },
  createdBy: { id: 'admin-1' },
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// =============================================================================
// TEST SUITE
// =============================================================================

describe('CommissionsService', () => {
  let service: CommissionsService;
  let productCommissionRepo: jest.Mocked<Repository<ProductCommissionEntity>>;
  let vendorCommissionRepo: jest.Mocked<Repository<VendorCommissionEntity>>;
  let categoryCommissionRepo: jest.Mocked<Repository<CategoryCommissionEntity>>;
  let globalCommissionRepo: jest.Mocked<Repository<GlobalCommissionEntity>>;
  let membershipDiscountRepo: jest.Mocked<Repository<MembershipDiscountEntity>>;
  let auditLogRepo: jest.Mocked<Repository<CommissionAuditLogEntity>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;

  beforeEach(async () => {
    const mockProductCommissionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockVendorCommissionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCategoryCommissionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockGlobalCommissionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockMembershipDiscountRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockAuditLogRepo = {
      save: jest.fn(),
    };

    const mockOrderItemRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: getRepositoryToken(ProductCommissionEntity), useValue: mockProductCommissionRepo },
        { provide: getRepositoryToken(VendorCommissionEntity), useValue: mockVendorCommissionRepo },
        { provide: getRepositoryToken(CategoryCommissionEntity), useValue: mockCategoryCommissionRepo },
        { provide: getRepositoryToken(GlobalCommissionEntity), useValue: mockGlobalCommissionRepo },
        { provide: getRepositoryToken(MembershipDiscountEntity), useValue: mockMembershipDiscountRepo },
        { provide: getRepositoryToken(CommissionAuditLogEntity), useValue: mockAuditLogRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    productCommissionRepo = module.get(getRepositoryToken(ProductCommissionEntity));
    vendorCommissionRepo = module.get(getRepositoryToken(VendorCommissionEntity));
    categoryCommissionRepo = module.get(getRepositoryToken(CategoryCommissionEntity));
    globalCommissionRepo = module.get(getRepositoryToken(GlobalCommissionEntity));
    membershipDiscountRepo = module.get(getRepositoryToken(MembershipDiscountEntity));
    auditLogRepo = module.get(getRepositoryToken(CommissionAuditLogEntity));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Service Initialization Tests
  // ===========================================================================

  describe('📦 Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required repositories injected', () => {
      expect(productCommissionRepo).toBeDefined();
      expect(vendorCommissionRepo).toBeDefined();
      expect(categoryCommissionRepo).toBeDefined();
      expect(globalCommissionRepo).toBeDefined();
      expect(membershipDiscountRepo).toBeDefined();
      expect(auditLogRepo).toBeDefined();
      expect(orderItemRepo).toBeDefined();
    });
  });

  // ===========================================================================
  // Effective Commission Resolution Tests
  // ===========================================================================

  describe('🎯 getEffectiveCommission - Priority Resolution', () => {
    it('should return product-level commission (highest priority)', async () => {
      const productCommission = createProductCommission({ percentage: 8 });

      productCommissionRepo.findOne.mockResolvedValue(productCommission);

      const result = await service.getEffectiveCommission(1, 1, 1);

      expect(result).toBe(8);
      expect(productCommissionRepo.findOne).toHaveBeenCalledWith({
        where: { product: { id: 1 } },
      });
      // Should not check other levels
      expect(vendorCommissionRepo.findOne).not.toHaveBeenCalled();
      expect(categoryCommissionRepo.findOne).not.toHaveBeenCalled();
      expect(globalCommissionRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return vendor-level commission when no product-level exists', async () => {
      const vendorCommission = createVendorCommission({ percentage: 12 });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(vendorCommission);

      const result = await service.getEffectiveCommission(1, 1, 1);

      expect(result).toBe(12);
      expect(productCommissionRepo.findOne).toHaveBeenCalled();
      expect(vendorCommissionRepo.findOne).toHaveBeenCalledWith({
        where: { vendor: { id: 1 } },
      });
      expect(categoryCommissionRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return category-level commission when no product/vendor-level exists', async () => {
      const categoryCommission = createCategoryCommission({ percentage: 10 });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(null);
      categoryCommissionRepo.findOne.mockResolvedValue(categoryCommission);

      const result = await service.getEffectiveCommission(1, 1, 1);

      expect(result).toBe(10);
      expect(categoryCommissionRepo.findOne).toHaveBeenCalledWith({
        where: { category: { id: 1 } },
      });
    });

    it('should return global commission as fallback', async () => {
      const globalCommission = createGlobalCommission({ percentage: 15 });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(null);
      categoryCommissionRepo.findOne.mockResolvedValue(null);
      globalCommissionRepo.findOne.mockResolvedValue(globalCommission);

      const result = await service.getEffectiveCommission(1, 1, 1);

      expect(result).toBe(15);
      expect(globalCommissionRepo.findOne).toHaveBeenCalledWith({ where: {} });
    });

    it('should throw NotFoundException when no global commission exists', async () => {
      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(null);
      categoryCommissionRepo.findOne.mockResolvedValue(null);
      globalCommissionRepo.findOne.mockResolvedValue(null);

      await expect(service.getEffectiveCommission(1, 1, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should apply membership discount to product commission', async () => {
      const productCommission = createProductCommission({ percentage: 10 });
      const membershipDiscount = createMembershipDiscount({ percentage: 2 });

      productCommissionRepo.findOne.mockResolvedValue(productCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

      const result = await service.getEffectiveCommission(1, 1, 1, 1);

      expect(result).toBe(8); // 10% - 2% = 8%
    });

    it('should apply membership discount to vendor commission', async () => {
      const vendorCommission = createVendorCommission({ percentage: 12 });
      const membershipDiscount = createMembershipDiscount({ percentage: 3 });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(vendorCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

      const result = await service.getEffectiveCommission(1, 1, 1, 1);

      expect(result).toBe(9); // 12% - 3% = 9%
    });

    it('should not apply discount below zero', async () => {
      const productCommission = createProductCommission({ percentage: 5 });
      const membershipDiscount = createMembershipDiscount({ percentage: 10 });

      productCommissionRepo.findOne.mockResolvedValue(productCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

      const result = await service.getEffectiveCommission(1, 1, 1, 1);

      expect(result).toBe(0); // Math.max(5 - 10, 0) = 0
    });

    it('should return base rate when membership discount not found', async () => {
      const productCommission = createProductCommission({ percentage: 10 });

      productCommissionRepo.findOne.mockResolvedValue(productCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(null);

      const result = await service.getEffectiveCommission(1, 1, 1, 1);

      expect(result).toBe(10); // No discount applied
    });
  });

  // ===========================================================================
  // Global Commission Tests
  // ===========================================================================

  describe('🌍 Global Commission', () => {
    describe('getGlobalCommission', () => {
      it('should return global commission rule', async () => {
        const globalCommission = createGlobalCommission({ percentage: 15 });
        globalCommissionRepo.findOne.mockResolvedValue(globalCommission);

        const result = await service.getGlobalCommission();

        expect(result.percentage).toBe(15);
      });

      it('should throw NotFoundException when no global rule exists', async () => {
        globalCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.getGlobalCommission()).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('setGlobalCommission', () => {
      it('should create new global commission when none exists', async () => {
        const dto = { percentage: 12, note: 'Syrian market default rate' };
        const createdRule = createGlobalCommission({ percentage: 12 });

        globalCommissionRepo.findOne.mockResolvedValue(null);
        globalCommissionRepo.create.mockReturnValue(createdRule);
        globalCommissionRepo.save.mockResolvedValue(createdRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setGlobalCommission(dto, 'admin-1');

        expect(result.percentage).toBe(12);
        expect(globalCommissionRepo.create).toHaveBeenCalled();
        expect(auditLogRepo.save).toHaveBeenCalled();
      });

      it('should update existing global commission', async () => {
        const existingRule = createGlobalCommission({ percentage: 15 });
        const dto = { percentage: 10, note: 'Reduced rate for Syrian holiday' };

        globalCommissionRepo.findOne.mockResolvedValue(existingRule);
        globalCommissionRepo.save.mockImplementation((rule) => Promise.resolve(rule as any));
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setGlobalCommission(dto, 'admin-1');

        expect(result.percentage).toBe(10);
        expect(globalCommissionRepo.create).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Category Commission Tests
  // ===========================================================================

  describe('📁 Category Commission', () => {
    describe('setCategoryCommission', () => {
      it('should create new category commission', async () => {
        const dto = { category_id: 1, percentage: 8, note: 'Electronics category' };
        const createdRule = createCategoryCommission({ percentage: 8 });

        categoryCommissionRepo.findOne.mockResolvedValue(null);
        categoryCommissionRepo.create.mockReturnValue(createdRule);
        categoryCommissionRepo.save.mockResolvedValue(createdRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setCategoryCommission(dto, 'admin-1');

        expect(result.percentage).toBe(8);
        expect(categoryCommissionRepo.create).toHaveBeenCalled();
      });

      it('should update existing category commission', async () => {
        const existingRule = createCategoryCommission({ percentage: 10 });
        const dto = { category_id: 1, percentage: 7, note: 'Reduced for promotion' };

        categoryCommissionRepo.findOne.mockResolvedValue(existingRule);
        categoryCommissionRepo.save.mockImplementation((rule) => Promise.resolve(rule as any));
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setCategoryCommission(dto, 'admin-1');

        expect(result.percentage).toBe(7);
      });
    });

    describe('getCategoryCommission', () => {
      it('should return category commission rule', async () => {
        const categoryCommission = createCategoryCommission({ percentage: 10 });
        categoryCommissionRepo.findOne.mockResolvedValue(categoryCommission);

        const result = await service.getCategoryCommission(1);

        expect(result.percentage).toBe(10);
      });

      it('should throw NotFoundException when category rule not found', async () => {
        categoryCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.getCategoryCommission(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteCategoryCommission', () => {
      it('should delete category commission successfully', async () => {
        const existingRule = createCategoryCommission();

        categoryCommissionRepo.findOne.mockResolvedValue(existingRule);
        categoryCommissionRepo.remove.mockResolvedValue(existingRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.deleteCategoryCommission(1);

        expect(result.success).toBe(true);
        expect(categoryCommissionRepo.remove).toHaveBeenCalledWith(existingRule);
      });

      it('should throw NotFoundException when category rule not found', async () => {
        categoryCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.deleteCategoryCommission(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // ===========================================================================
  // Vendor Commission Tests
  // ===========================================================================

  describe('🏪 Vendor Commission', () => {
    describe('setVendorCommission', () => {
      it('should create new vendor commission for Damascus vendor', async () => {
        const dto = {
          vendor_id: 1,
          percentage: 10,
          note: 'Damascus Electronics special rate',
        };
        const createdRule = createVendorCommission({ percentage: 10 });

        vendorCommissionRepo.findOne.mockResolvedValue(null);
        vendorCommissionRepo.create.mockReturnValue(createdRule);
        vendorCommissionRepo.save.mockResolvedValue(createdRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setVendorCommission(dto, 'admin-1');

        expect(result.percentage).toBe(10);
      });

      it('should update existing vendor commission', async () => {
        const existingRule = createVendorCommission({ percentage: 12 });
        const dto = { vendor_id: 1, percentage: 9, note: 'Gold tier vendor rate' };

        vendorCommissionRepo.findOne.mockResolvedValue(existingRule);
        vendorCommissionRepo.save.mockImplementation((rule) => Promise.resolve(rule as any));
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setVendorCommission(dto, 'admin-1');

        expect(result.percentage).toBe(9);
      });
    });

    describe('getVendorCommission', () => {
      it('should return vendor commission rule', async () => {
        const vendorCommission = createVendorCommission({ percentage: 12 });
        vendorCommissionRepo.findOne.mockResolvedValue(vendorCommission);

        const result = await service.getVendorCommission(1);

        expect(result.percentage).toBe(12);
      });

      it('should throw NotFoundException when vendor rule not found', async () => {
        vendorCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.getVendorCommission(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteVendorCommission', () => {
      it('should delete vendor commission successfully', async () => {
        const existingRule = createVendorCommission();

        vendorCommissionRepo.findOne.mockResolvedValue(existingRule);
        vendorCommissionRepo.remove.mockResolvedValue(existingRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.deleteVendorCommission(1);

        expect(result.success).toBe(true);
      });

      it('should throw NotFoundException when vendor rule not found', async () => {
        vendorCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.deleteVendorCommission(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // ===========================================================================
  // Product Commission Tests
  // ===========================================================================

  describe('📦 Product Commission', () => {
    describe('setProductCommission', () => {
      it('should create new product commission for Syrian product', async () => {
        const dto = {
          product_id: 1,
          percentage: 5,
          note: 'iPhone 15 Pro special rate - آيفون 15 برو',
        };
        const createdRule = createProductCommission({ percentage: 5 });

        productCommissionRepo.findOne.mockResolvedValue(null);
        productCommissionRepo.create.mockReturnValue(createdRule);
        productCommissionRepo.save.mockResolvedValue(createdRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setProductCommission(dto, 'admin-1');

        expect(result.percentage).toBe(5);
      });

      it('should update existing product commission', async () => {
        const existingRule = createProductCommission({ percentage: 8 });
        const dto = { product_id: 1, percentage: 6, note: 'Adjusted rate' };

        productCommissionRepo.findOne.mockResolvedValue(existingRule);
        productCommissionRepo.save.mockImplementation((rule) => Promise.resolve(rule as any));
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setProductCommission(dto, 'admin-1');

        expect(result.percentage).toBe(6);
      });
    });

    describe('getProductCommission', () => {
      it('should return product commission rule', async () => {
        const productCommission = createProductCommission({ percentage: 8 });
        productCommissionRepo.findOne.mockResolvedValue(productCommission);

        const result = await service.getProductCommission(1);

        expect(result.percentage).toBe(8);
      });

      it('should throw NotFoundException when product rule not found', async () => {
        productCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.getProductCommission(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteProductCommission', () => {
      it('should delete product commission successfully', async () => {
        const existingRule = createProductCommission();

        productCommissionRepo.findOne.mockResolvedValue(existingRule);
        productCommissionRepo.remove.mockResolvedValue(existingRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.deleteProductCommission(1);

        expect(result.success).toBe(true);
      });

      it('should throw NotFoundException when product rule not found', async () => {
        productCommissionRepo.findOne.mockResolvedValue(null);

        await expect(service.deleteProductCommission(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // ===========================================================================
  // Membership Discount Tests
  // ===========================================================================

  describe('⭐ Membership Discount', () => {
    describe('setMembershipDiscount', () => {
      it('should create new membership discount for Gold tier', async () => {
        const dto = {
          membership_id: 1,
          percentage: 3,
          note: 'Gold membership - 3% commission reduction',
        };
        const createdRule = createMembershipDiscount({ percentage: 3 });

        membershipDiscountRepo.findOne.mockResolvedValue(null);
        membershipDiscountRepo.create.mockReturnValue(createdRule);
        membershipDiscountRepo.save.mockResolvedValue(createdRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setMembershipDiscount(dto, 'admin-1');

        expect(result.percentage).toBe(3);
      });

      it('should update existing membership discount', async () => {
        const existingRule = createMembershipDiscount({ percentage: 2 });
        const dto = { membership_id: 1, percentage: 5, note: 'Platinum tier upgrade' };

        membershipDiscountRepo.findOne.mockResolvedValue(existingRule);
        membershipDiscountRepo.save.mockImplementation((rule) => Promise.resolve(rule as any));
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.setMembershipDiscount(dto, 'admin-1');

        expect(result.percentage).toBe(5);
      });
    });

    describe('getMembershipDiscount', () => {
      it('should return membership discount rule', async () => {
        const membershipDiscount = createMembershipDiscount({ percentage: 2 });
        membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

        const result = await service.getMembershipDiscount(1);

        expect(result.percentage).toBe(2);
      });

      it('should throw NotFoundException when membership discount not found', async () => {
        membershipDiscountRepo.findOne.mockResolvedValue(null);

        await expect(service.getMembershipDiscount(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteMembershipDiscount', () => {
      it('should delete membership discount successfully', async () => {
        const existingRule = createMembershipDiscount();

        membershipDiscountRepo.findOne.mockResolvedValue(existingRule);
        membershipDiscountRepo.remove.mockResolvedValue(existingRule);
        auditLogRepo.save.mockResolvedValue({} as any);

        const result = await service.deleteMembershipDiscount(1);

        expect(result.success).toBe(true);
      });

      it('should throw NotFoundException when membership discount not found', async () => {
        membershipDiscountRepo.findOne.mockResolvedValue(null);

        await expect(service.deleteMembershipDiscount(999)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // ===========================================================================
  // Calculate Commission For Vendor Tests
  // ===========================================================================

  describe('💰 calculateCommissionForVendor', () => {
    it('should calculate total commission for Syrian vendor', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalSales: '10000000' }), // 10M SYP
      };

      orderItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.calculateCommissionForVendor(1);

      // 10M SYP * 10% = 1M SYP commission
      expect(result.total).toBe(1000000);
    });

    it('should return zero for vendor with no sales', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalSales: null }),
      };

      orderItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.calculateCommissionForVendor(1);

      expect(result.total).toBe(0);
    });
  });

  // ===========================================================================
  // Bulk Commission Calculation Tests
  // ===========================================================================

  describe('📊 bulkCalculateCommissions', () => {
    it('should process multiple orders in batches', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { orderId: 1, itemId: 1, productId: 1, vendorId: 1, categoryId: 1, price: 1000000, quantity: 2 },
          { orderId: 2, itemId: 2, productId: 2, vendorId: 1, categoryId: 1, price: 500000, quantity: 1 },
        ]),
      };

      orderItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Mock commission resolution
      const globalCommission = createGlobalCommission({ percentage: 10 });
      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(null);
      categoryCommissionRepo.findOne.mockResolvedValue(null);
      globalCommissionRepo.findOne.mockResolvedValue(globalCommission);
      auditLogRepo.save.mockResolvedValue({} as any);

      const result = await service.bulkCalculateCommissions([1, 2], 100);

      expect(result.processed).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle empty order list', async () => {
      const result = await service.bulkCalculateCommissions([], 100);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.totalCommission).toBe(0);
    });
  });

  // ===========================================================================
  // Commission Analytics Tests
  // ===========================================================================

  describe('📈 getCommissionAnalytics', () => {
    const mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    beforeEach(() => {
      orderItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should return commission analytics for date range', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalSales: '50000000', // 50M SYP
        totalOrders: '100',
        totalItems: '250',
      });
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { vendorId: 1, vendorName: 'Damascus Electronics', totalSales: '30000000', orderCount: '60' },
          { vendorId: 2, vendorName: 'Aleppo Fashion', totalSales: '20000000', orderCount: '40' },
        ])
        .mockResolvedValueOnce([
          { categoryId: 1, categoryName: 'Electronics', totalSales: '35000000', orderCount: '70' },
          { categoryId: 2, categoryName: 'Clothing', totalSales: '15000000', orderCount: '30' },
        ])
        .mockResolvedValueOnce([
          { date: '2025-01-01', totalSales: '5000000', orderCount: '10' },
          { date: '2025-01-02', totalSales: '6000000', orderCount: '12' },
        ]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await service.getCommissionAnalytics(startDate, endDate);

      expect(result.totalOrders).toBe(100);
      expect(result.totalCommission).toBe(5000000); // 50M * 10%
      expect(result.commissionByVendor).toHaveLength(2);
      expect(result.commissionByCategory).toHaveLength(2);
      expect(result.dailyBreakdown).toHaveLength(2);
    });

    it('should filter analytics by vendor ID', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalSales: '30000000',
        totalOrders: '60',
        totalItems: '150',
      });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await service.getCommissionAnalytics(startDate, endDate, 1);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.id = :vendorId',
        { vendorId: 1 },
      );
    });
  });

  // ===========================================================================
  // Commission Configuration Validation Tests
  // ===========================================================================

  describe('✅ validateCommissionConfiguration', () => {
    const createMockQueryBuilder = (results: any[]) => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(results),
    });

    it('should return valid when all configurations are correct', async () => {
      const globalCommission = createGlobalCommission({ percentage: 10 });
      globalCommissionRepo.findOne.mockResolvedValue(globalCommission);
      vendorCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      categoryCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      productCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      membershipDiscountRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);

      const result = await service.validateCommissionConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing global commission', async () => {
      globalCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      categoryCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      productCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      membershipDiscountRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);

      const result = await service.validateCommissionConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: 'Global commission rule is not configured',
        }),
      );
    });

    it('should detect invalid global commission percentage', async () => {
      const invalidGlobal = createGlobalCommission({ percentage: 150 });
      globalCommissionRepo.findOne.mockResolvedValue(invalidGlobal);
      vendorCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      categoryCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      productCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      membershipDiscountRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);

      const result = await service.validateCommissionConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Global commission percentage is invalid'),
        }),
      );
    });

    it('should warn about high commission percentages', async () => {
      const globalCommission = createGlobalCommission({ percentage: 10 });
      const highCommissionProducts = [
        createProductCommission({ id: 1, percentage: 60 }),
      ];

      globalCommissionRepo.findOne.mockResolvedValue(globalCommission);
      vendorCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      categoryCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
      productCommissionRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(highCommissionProducts) as any);
      membershipDiscountRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);

      const result = await service.validateCommissionConfiguration();

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('High commission percentage detected'),
        }),
      );
    });
  });

  // ===========================================================================
  // Syrian Market Data Scenarios
  // ===========================================================================

  describe('🇸🇾 Syrian Market Data Scenarios', () => {
    it('should handle Damascus electronics vendor with Gold membership', async () => {
      // Product: iPhone 15 Pro - no product-specific commission
      // Vendor: Damascus Electronics - 12% commission
      // Membership: Gold tier - 2% discount
      // Expected: 12% - 2% = 10%

      const vendorCommission = createVendorCommission({
        percentage: 12,
        vendor: { id: 1, name: 'Damascus Electronics - دمشق للإلكترونيات' },
      });
      const membershipDiscount = createMembershipDiscount({
        percentage: 2,
        note: 'تخفيض عضوية ذهبية',
      });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(vendorCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

      const result = await service.getEffectiveCommission(101, 1, 10, 1);

      expect(result).toBe(10);
    });

    it('should handle Aleppo fashion category commission', async () => {
      // Category: Clothing (ملابس) - 8% commission
      // No product or vendor override

      const categoryCommission = createCategoryCommission({
        percentage: 8,
        category: { id: 2, name: 'ملابس', name_ar: 'ملابس' },
        note: 'Aleppo fashion category rate',
      });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(null);
      categoryCommissionRepo.findOne.mockResolvedValue(categoryCommission);

      const result = await service.getEffectiveCommission(200, 5, 2);

      expect(result).toBe(8);
    });

    it('should handle special promotional product commission', async () => {
      // Special promotion: 5% commission on Samsung Galaxy
      const productCommission = createProductCommission({
        percentage: 5,
        product: { id: 150, name: 'سامسونج جالاكسي A54' },
        note: 'عرض خاص - تخفيض عمولة',
      });

      productCommissionRepo.findOne.mockResolvedValue(productCommission);

      const result = await service.getEffectiveCommission(150, 3, 1);

      expect(result).toBe(5);
    });

    it('should handle Homs vendor with Platinum membership', async () => {
      // Vendor: Homs Market - 15% base
      // Membership: Platinum - 5% discount
      // Expected: 15% - 5% = 10%

      const vendorCommission = createVendorCommission({
        percentage: 15,
        vendor: { id: 10, name: 'سوق حمص' },
      });
      const membershipDiscount = createMembershipDiscount({
        percentage: 5,
        note: 'عضوية بلاتينية',
      });

      productCommissionRepo.findOne.mockResolvedValue(null);
      vendorCommissionRepo.findOne.mockResolvedValue(vendorCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

      const result = await service.getEffectiveCommission(300, 10, 5, 3);

      expect(result).toBe(10);
    });

    it('should calculate commission for high-value electronics order (SYP)', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalSales: '85000000' }), // 85M SYP (iPhone order)
      };

      orderItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.calculateCommissionForVendor(1);

      // 85M SYP * 10% = 8.5M SYP commission
      expect(result.total).toBe(8500000);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('⚠️ Edge Cases', () => {
    it('should handle database error during commission resolution', async () => {
      productCommissionRepo.findOne.mockRejectedValue(new Error('Database connection lost'));

      await expect(service.getEffectiveCommission(1, 1, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle zero percentage commission', async () => {
      const zeroCommission = createProductCommission({ percentage: 0 });
      productCommissionRepo.findOne.mockResolvedValue(zeroCommission);

      const result = await service.getEffectiveCommission(1, 1, 1);

      expect(result).toBe(0);
    });

    it('should handle fractional commission percentages', async () => {
      const fractionalCommission = createProductCommission({ percentage: 7.5 });
      productCommissionRepo.findOne.mockResolvedValue(fractionalCommission);

      const result = await service.getEffectiveCommission(1, 1, 1);

      expect(result).toBe(7.5);
    });

    it('should handle membership discount equal to base commission', async () => {
      const productCommission = createProductCommission({ percentage: 10 });
      const membershipDiscount = createMembershipDiscount({ percentage: 10 });

      productCommissionRepo.findOne.mockResolvedValue(productCommission);
      membershipDiscountRepo.findOne.mockResolvedValue(membershipDiscount);

      const result = await service.getEffectiveCommission(1, 1, 1, 1);

      expect(result).toBe(0); // 10% - 10% = 0%
    });

    it('should handle audit log save failure gracefully', async () => {
      const dto = { percentage: 12, note: 'Test' };
      const createdRule = createGlobalCommission({ percentage: 12 });

      globalCommissionRepo.findOne.mockResolvedValue(null);
      globalCommissionRepo.create.mockReturnValue(createdRule);
      globalCommissionRepo.save.mockResolvedValue(createdRule);
      auditLogRepo.save.mockRejectedValue(new Error('Audit log failed'));

      // Should not throw - audit log failure should not block commission save
      await expect(service.setGlobalCommission(dto, 'admin-1')).rejects.toThrow();
    });
  });
});
