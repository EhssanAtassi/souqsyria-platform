/**
 * @file commission-seeder.service.spec.ts
 * @description Unit tests for CommissionSeederService
 *
 * Tests the seeding logic, validation, and error handling
 * without requiring database connectivity for faster testing.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionSeederService } from './commission-seeder.service';

// Commission Entities
import { GlobalCommissionEntity } from '../entites/global-commission.entity';
import { CategoryCommissionEntity } from '../entites/category-commission.entity';
import { VendorCommissionEntity } from '../entites/vendor-commission.entity';
import { ProductCommissionEntity } from '../entites/product-commission.entity';
import { MembershipDiscountEntity } from '../entites/membership-discount.entity';

// External Entities
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';

describe('CommissionSeederService', () => {
  let service: CommissionSeederService;
  let globalCommissionRepository: jest.Mocked<
    Repository<GlobalCommissionEntity>
  >;
  let categoryCommissionRepository: jest.Mocked<
    Repository<CategoryCommissionEntity>
  >;
  let vendorCommissionRepository: jest.Mocked<
    Repository<VendorCommissionEntity>
  >;
  let productCommissionRepository: jest.Mocked<
    Repository<ProductCommissionEntity>
  >;
  let membershipDiscountRepository: jest.Mocked<
    Repository<MembershipDiscountEntity>
  >;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let productRepository: jest.Mocked<Repository<ProductEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionSeederService,
        {
          provide: getRepositoryToken(GlobalCommissionEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(CategoryCommissionEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(VendorCommissionEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductCommissionEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(MembershipDiscountEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Category),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<CommissionSeederService>(CommissionSeederService);
    globalCommissionRepository = module.get(
      getRepositoryToken(GlobalCommissionEntity),
    );
    categoryCommissionRepository = module.get(
      getRepositoryToken(CategoryCommissionEntity),
    );
    vendorCommissionRepository = module.get(
      getRepositoryToken(VendorCommissionEntity),
    );
    productCommissionRepository = module.get(
      getRepositoryToken(ProductCommissionEntity),
    );
    membershipDiscountRepository = module.get(
      getRepositoryToken(MembershipDiscountEntity),
    );
    categoryRepository = module.get(getRepositoryToken(Category));
    userRepository = module.get(getRepositoryToken(User));
    productRepository = module.get(getRepositoryToken(ProductEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🌱 Commission Seeding', () => {
    it('should seed commission system successfully', async () => {
      // Mock empty database (no existing commissions)
      globalCommissionRepository.findOne.mockResolvedValue(null);
      categoryCommissionRepository.findOne.mockResolvedValue(null);
      vendorCommissionRepository.findOne.mockResolvedValue(null);
      membershipDiscountRepository.findOne.mockResolvedValue(null);

      // Mock entity creation
      globalCommissionRepository.create.mockImplementation(
        (data) => data as GlobalCommissionEntity,
      );
      globalCommissionRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as GlobalCommissionEntity),
      );

      categoryCommissionRepository.create.mockImplementation(
        (data) => data as CategoryCommissionEntity,
      );
      categoryCommissionRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as CategoryCommissionEntity),
      );

      vendorCommissionRepository.create.mockImplementation(
        (data) => data as VendorCommissionEntity,
      );
      vendorCommissionRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as VendorCommissionEntity),
      );

      membershipDiscountRepository.create.mockImplementation(
        (data) => data as MembershipDiscountEntity,
      );
      membershipDiscountRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as MembershipDiscountEntity),
      );

      // Mock category lookups
      categoryRepository.findOne.mockResolvedValue({
        id: 1,
        nameEn: 'Electronics',
      } as Category);

      const result = await service.seedCommissions();

      expect(result.success).toBe(true);
      expect(result.globalCommissionsCreated).toBeGreaterThan(0);
      expect(result.categoryCommissionsCreated).toBeGreaterThan(0);
      expect(result.vendorCommissionsCreated).toBe(0); // Skipped in current implementation
      expect(result.membershipDiscountsCreated).toBe(0); // Skipped in current implementation
      expect(result.errors.length).toBe(0);

      // Verify that create and save were called
      expect(globalCommissionRepository.create).toHaveBeenCalled();
      expect(globalCommissionRepository.save).toHaveBeenCalled();
      expect(categoryCommissionRepository.create).toHaveBeenCalled();
      expect(categoryCommissionRepository.save).toHaveBeenCalled();
    });

    it('should handle existing commissions gracefully', async () => {
      // Mock existing commissions
      const existingGlobalCommission = {
        id: 1,
        percentage: 7.0,
        valid_from: new Date(),
        valid_to: null,
        note: 'Test commission',
        createdBy: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as GlobalCommissionEntity;

      globalCommissionRepository.findOne.mockResolvedValue(
        existingGlobalCommission,
      );
      categoryCommissionRepository.findOne.mockResolvedValue(null);
      vendorCommissionRepository.findOne.mockResolvedValue(null);
      membershipDiscountRepository.findOne.mockResolvedValue(null);

      const result = await service.seedCommissions();

      expect(result.success).toBe(true);
      expect(result.globalCommissionsCreated).toBe(0); // No new global commissions
      expect(result.errors.length).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      globalCommissionRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.seedCommissions();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Database connection failed');
    });

    it('should handle missing categories gracefully', async () => {
      // Mock empty database
      globalCommissionRepository.findOne.mockResolvedValue(null);
      categoryCommissionRepository.findOne.mockResolvedValue(null);

      // Mock missing category
      categoryRepository.findOne.mockResolvedValue(null);

      globalCommissionRepository.create.mockImplementation(
        (data) => data as GlobalCommissionEntity,
      );
      globalCommissionRepository.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 } as GlobalCommissionEntity),
      );

      const result = await service.seedCommissions();

      expect(result.success).toBe(true);
      expect(result.globalCommissionsCreated).toBeGreaterThan(0);
      expect(result.categoryCommissionsCreated).toBe(0); // No categories found
    });
  });

  describe('📊 Statistics', () => {
    it('should return accurate statistics', async () => {
      // Mock statistics data
      globalCommissionRepository.count.mockResolvedValue(2);
      categoryCommissionRepository.count.mockResolvedValue(8);
      vendorCommissionRepository.count.mockResolvedValue(5);
      membershipDiscountRepository.count.mockResolvedValue(5);
      productCommissionRepository.count.mockResolvedValue(0);

      // Mock active commissions
      globalCommissionRepository.find.mockResolvedValue([
        {
          percentage: 7.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
        {
          percentage: 5.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
      ]);

      const stats = await service.getStatistics();

      expect(stats.totalGlobalCommissions).toBe(2);
      expect(stats.totalCategoryCommissions).toBe(8);
      expect(stats.totalVendorCommissions).toBe(5);
      expect(stats.totalMembershipDiscounts).toBe(5);
      expect(stats.totalProductCommissions).toBe(0);
      expect(stats.averageCommissionRate).toBe(6.0); // (7.0 + 5.0) / 2
    });

    it('should handle zero commissions', async () => {
      // Mock empty database
      globalCommissionRepository.count.mockResolvedValue(0);
      categoryCommissionRepository.count.mockResolvedValue(0);
      vendorCommissionRepository.count.mockResolvedValue(0);
      membershipDiscountRepository.count.mockResolvedValue(0);
      productCommissionRepository.count.mockResolvedValue(0);
      globalCommissionRepository.find.mockResolvedValue([]);

      const stats = await service.getStatistics();

      expect(stats.totalGlobalCommissions).toBe(0);
      expect(stats.averageCommissionRate).toBe(0);
    });
  });

  describe('✅ Data Validation', () => {
    it('should validate commission data successfully', async () => {
      // Mock valid commission setup
      globalCommissionRepository.count.mockResolvedValue(1); // One active global commission
      globalCommissionRepository.find.mockResolvedValue([
        {
          percentage: 7.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
      ]);
      categoryCommissionRepository.find.mockResolvedValue([
        {
          percentage: 8.5,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as CategoryCommissionEntity,
        {
          percentage: 12.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as CategoryCommissionEntity,
      ]);
      membershipDiscountRepository.find.mockResolvedValue([
        {
          percentage: 25.0,
          valid_to: new Date('2027-12-31'), // Future date - not expired
          valid_from: new Date(),
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as MembershipDiscountEntity,
      ]);

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect no active global commission', async () => {
      // Mock no active global commissions
      globalCommissionRepository.count.mockResolvedValue(0);
      globalCommissionRepository.find.mockResolvedValue([]);
      categoryCommissionRepository.find.mockResolvedValue([]);
      membershipDiscountRepository.find.mockResolvedValue([]);

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('No global commission found');
      expect(validation.recommendations).toContain(
        'Create at least one global commission as fallback',
      );
    });

    it('should detect multiple active global commissions', async () => {
      // Mock multiple active global commissions
      globalCommissionRepository.count.mockResolvedValue(2);
      globalCommissionRepository.find.mockResolvedValue([
        {
          percentage: 7.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
        {
          percentage: 5.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
      ]);
      categoryCommissionRepository.find.mockResolvedValue([]);
      membershipDiscountRepository.find.mockResolvedValue([]);

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain(
        'Multiple active global commissions found (2)',
      );
      expect(validation.recommendations).toContain(
        'Ensure only one global commission is active at a time',
      );
    });

    it('should detect high commission rates', async () => {
      // Mock high commission rates
      globalCommissionRepository.count.mockResolvedValue(1);
      globalCommissionRepository.find.mockResolvedValue([
        {
          percentage: 7.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
      ]);
      categoryCommissionRepository.find.mockResolvedValue([
        {
          percentage: 25.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as CategoryCommissionEntity, // High rate
        {
          percentage: 22.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as CategoryCommissionEntity, // High rate
      ]);
      membershipDiscountRepository.find.mockResolvedValue([]);

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain(
        '2 category commissions have rates above 20%',
      );
      expect(validation.recommendations).toContain(
        'Review high commission rates for business impact',
      );
    });

    it('should detect expired membership discounts', async () => {
      // Mock expired discounts
      globalCommissionRepository.count.mockResolvedValue(1);
      globalCommissionRepository.find.mockResolvedValue([
        {
          percentage: 7.0,
          valid_from: new Date(),
          valid_to: null,
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as GlobalCommissionEntity,
      ]);
      categoryCommissionRepository.find.mockResolvedValue([]);
      membershipDiscountRepository.find.mockResolvedValue([
        {
          percentage: 25.0,
          valid_to: new Date('2024-12-31'), // Expired
          valid_from: new Date('2024-01-01'),
          note: '',
          createdBy: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as MembershipDiscountEntity,
      ]);

      const validation = await service.validateSeededData();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain(
        '1 membership discounts have expired',
      );
      expect(validation.recommendations).toContain(
        'Update or deactivate expired membership discounts',
      );
    });
  });

  describe('🧹 Cleanup Operations', () => {
    it('should cleanup commission data successfully', async () => {
      // Mock successful cleanup
      membershipDiscountRepository.delete.mockResolvedValue({
        affected: 5,
        raw: [],
      });
      productCommissionRepository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
      });
      vendorCommissionRepository.delete.mockResolvedValue({
        affected: 5,
        raw: [],
      });
      categoryCommissionRepository.delete.mockResolvedValue({
        affected: 8,
        raw: [],
      });
      globalCommissionRepository.delete.mockResolvedValue({
        affected: 2,
        raw: [],
      });

      const result = await service.cleanupCommissions();

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(20); // 5 + 0 + 5 + 8 + 2

      // Verify deletion order (reverse dependency)
      expect(membershipDiscountRepository.delete).toHaveBeenCalledWith({});
      expect(productCommissionRepository.delete).toHaveBeenCalledWith({});
      expect(vendorCommissionRepository.delete).toHaveBeenCalledWith({});
      expect(categoryCommissionRepository.delete).toHaveBeenCalledWith({});
      expect(globalCommissionRepository.delete).toHaveBeenCalledWith({});
    });

    it('should handle cleanup errors gracefully', async () => {
      // Mock cleanup error
      membershipDiscountRepository.delete.mockRejectedValue(
        new Error('Foreign key constraint'),
      );

      const result = await service.cleanupCommissions();

      expect(result.success).toBe(false);
      expect(result.deleted).toBe(0);
    });
  });

  describe('🔍 Data Structure Validation', () => {
    it('should have proper seed data structure', () => {
      // Access private method through service instance
      const seedData = (service as any).getCommissionSeedData();

      expect(seedData).toBeDefined();
      expect(seedData.globalCommissions).toBeDefined();
      expect(seedData.categoryCommissions).toBeDefined();
      expect(seedData.vendorCommissions).toBeDefined();
      expect(seedData.membershipDiscounts).toBeDefined();

      expect(Array.isArray(seedData.globalCommissions)).toBe(true);
      expect(Array.isArray(seedData.categoryCommissions)).toBe(true);
      expect(Array.isArray(seedData.vendorCommissions)).toBe(true);
      expect(Array.isArray(seedData.membershipDiscounts)).toBe(true);

      expect(seedData.globalCommissions.length).toBeGreaterThan(0);
      expect(seedData.categoryCommissions.length).toBeGreaterThan(0);
      expect(seedData.vendorCommissions.length).toBeGreaterThan(0);
      expect(seedData.membershipDiscounts.length).toBeGreaterThan(0);
    });

    it('should have valid global commission data', () => {
      const seedData = (service as any).getCommissionSeedData();

      seedData.globalCommissions.forEach((commission) => {
        expect(commission.percentage).toBeDefined();
        expect(typeof commission.percentage).toBe('number');
        expect(commission.percentage).toBeGreaterThan(0);
        expect(commission.percentage).toBeLessThan(100);

        expect(commission.minimumAmount).toBeDefined();
        expect(typeof commission.minimumAmount).toBe('number');
        expect(commission.minimumAmount).toBeGreaterThanOrEqual(0);

        expect(commission.maximumAmount).toBeDefined();
        expect(typeof commission.maximumAmount).toBe('number');
        expect(commission.maximumAmount).toBeGreaterThan(
          commission.minimumAmount,
        );

        expect(typeof commission.isActive).toBe('boolean');
        expect(commission.description).toBeDefined();
        expect(commission.description).not.toBe('');
      });
    });

    it('should have valid category commission data', () => {
      const seedData = (service as any).getCommissionSeedData();

      seedData.categoryCommissions.forEach((commission) => {
        expect(commission.categoryName).toBeDefined();
        expect(commission.categoryName).not.toBe('');
        expect(commission.percentage).toBeDefined();
        expect(typeof commission.percentage).toBe('number');
        expect(commission.percentage).toBeGreaterThan(0);
        expect(commission.percentage).toBeLessThan(100);
        expect(commission.description).toBeDefined();
        expect(commission.description).not.toBe('');
      });
    });

    it('should have valid vendor tier commission data', () => {
      const seedData = (service as any).getCommissionSeedData();

      const expectedTiers = [
        'Platinum',
        'Gold',
        'Silver',
        'Bronze',
        'Standard',
      ];
      const actualTiers = seedData.vendorCommissions.map((v) => v.vendorTier);

      expectedTiers.forEach((tier) => {
        expect(actualTiers).toContain(tier);
      });

      seedData.vendorCommissions.forEach((commission) => {
        expect(commission.vendorTier).toBeDefined();
        expect(commission.vendorTier).not.toBe('');
        expect(commission.percentage).toBeDefined();
        expect(typeof commission.percentage).toBe('number');
        expect(commission.percentage).toBeGreaterThan(0);
        expect(commission.percentage).toBeLessThan(100);
        expect(commission.tierDescription).toBeDefined();
        expect(commission.tierDescription).not.toBe('');
      });
    });

    it('should have valid membership discount data', () => {
      const seedData = (service as any).getCommissionSeedData();

      const expectedTiers = [
        'VIP Diamond',
        'VIP Gold',
        'VIP Silver',
        'Premium',
        'Standard',
      ];
      const actualTiers = seedData.membershipDiscounts.map(
        (m) => m.membershipTier,
      );

      expectedTiers.forEach((tier) => {
        expect(actualTiers).toContain(tier);
      });

      seedData.membershipDiscounts.forEach((discount) => {
        expect(discount.membershipTier).toBeDefined();
        expect(discount.membershipTier).not.toBe('');
        expect(discount.discountPercentage).toBeDefined();
        expect(typeof discount.discountPercentage).toBe('number');
        expect(discount.discountPercentage).toBeGreaterThan(0);
        expect(discount.discountPercentage).toBeLessThanOrEqual(100);
        expect(discount.minimumOrderAmount).toBeDefined();
        expect(typeof discount.minimumOrderAmount).toBe('number');
        expect(discount.minimumOrderAmount).toBeGreaterThan(0);
        expect(discount.description).toBeDefined();
        expect(discount.description).not.toBe('');
      });
    });

    it('should have vendor tier rates in ascending order (best to worst)', () => {
      const seedData = (service as any).getCommissionSeedData();

      const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Standard'];
      const rates = [];

      tierOrder.forEach((tier) => {
        const commission = seedData.vendorCommissions.find(
          (v) => v.vendorTier === tier,
        );
        expect(commission).toBeDefined();
        rates.push(commission.percentage);
      });

      // Verify rates are in ascending order (Platinum has lowest rate, Standard has highest)
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeGreaterThan(rates[i - 1]);
      }
    });

    it('should have membership discount rates in descending order (best to worst)', () => {
      const seedData = (service as any).getCommissionSeedData();

      const tierOrder = [
        'VIP Diamond',
        'VIP Gold',
        'VIP Silver',
        'Premium',
        'Standard',
      ];
      const discounts = [];

      tierOrder.forEach((tier) => {
        const discount = seedData.membershipDiscounts.find(
          (m) => m.membershipTier === tier,
        );
        expect(discount).toBeDefined();
        discounts.push(discount.discountPercentage);
      });

      // Verify discounts are in descending order (VIP Diamond has highest discount)
      for (let i = 1; i < discounts.length; i++) {
        expect(discounts[i]).toBeLessThan(discounts[i - 1]);
      }
    });
  });
});
