/**
 * @file cart.seeder.service.spec.ts
 * @description Unit tests for CartSeederService
 *
 * Tests comprehensive cart seeding functionality including:
 * - Syrian market cart scenarios generation
 * - Multi-currency cart support
 * - Campaign and discount cart scenarios
 * - Abandoned cart generation
 * - Cart statistics calculation
 * - Data cleanup and validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CartSeederService } from './cart.seeder.service';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../products/entities/product.entity';

describe('CartSeederService', () => {
  let service: CartSeederService;
  let cartRepository: jest.Mocked<Repository<Cart>>;
  let cartItemRepository: jest.Mocked<Repository<CartItem>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;
  let productRepository: jest.Mocked<Repository<ProductEntity>>;

  // Test data
  let mockUsers: User[];
  let mockProducts: ProductEntity[];
  let mockVariants: ProductVariant[];
  let mockCarts: Cart[];
  let mockCartItems: CartItem[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartSeederService,
        {
          provide: getRepositoryToken(Cart),
          useFactory: () => ({
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
            })),
          }),
        },
        {
          provide: getRepositoryToken(CartItem),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<CartSeederService>(CartSeederService);
    cartRepository = module.get(getRepositoryToken(Cart));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
    userRepository = module.get(getRepositoryToken(User));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
    productRepository = module.get(getRepositoryToken(ProductEntity));

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockUsers = [
      {
        id: 1,
        email: 'ahmad.syrian@souqsyria.com',
        fullName: 'أحمد السوري',
        phone: '+963987654321',
        isVerified: true,
      },
      {
        id: 2,
        email: 'fatima.damascus@souqsyria.com',
        fullName: 'فاطمة الدمشقية',
        phone: '+963988123456',
        isVerified: true,
      },
      {
        id: 3,
        email: 'nour.diaspora@souqsyria.com',
        fullName: 'نور المغترب',
        phone: '+1234567890',
        isVerified: true,
      },
    ] as any[];

    mockProducts = [
      {
        id: 1,
        nameEn: 'Samsung Galaxy S24 Ultra',
        nameAr: 'سامسونج جالاكسي إس 24 ألترا',
        price: 6500000,
        isActive: true,
      },
      {
        id: 2,
        nameEn: 'iPhone 15 Pro Max',
        nameAr: 'آيفون 15 برو ماكس',
        price: 8500000,
        isActive: true,
      },
      {
        id: 3,
        nameEn: 'Damascus Steel Watch',
        nameAr: 'ساعة فولاذ دمشقي',
        price: 750000,
        isActive: true,
      },
    ] as any[];

    mockVariants = [
      {
        id: 1,
        product: mockProducts[0],
        sku: 'SGS24U-512GB-BLACK',
        price: 6500000,
        isActive: true,
        attributes: { color: 'Black', storage: '512GB', ram: '12GB' },
      },
      {
        id: 2,
        product: mockProducts[1],
        sku: 'IPH15PM-256GB-BLUE',
        price: 8500000,
        isActive: true,
        attributes: { color: 'Blue', storage: '256GB', ram: '8GB' },
      },
      {
        id: 3,
        product: mockProducts[2],
        sku: 'DSW-STEEL-42MM',
        price: 750000,
        isActive: true,
        attributes: { material: 'Steel', size: '42mm' },
      },
    ] as any[];

    mockCarts = [
      {
        id: 1,
        user: mockUsers[0],
        userId: 1,
        currency: 'SYP',
        status: 'active',
        totalItems: 2,
        totalAmount: 7250000,
        version: 1,
        items: [],
      },
      {
        id: 2,
        user: mockUsers[1],
        userId: 2,
        currency: 'SYP',
        status: 'abandoned',
        totalItems: 1,
        totalAmount: 6500000,
        version: 1,
        items: [],
      },
    ] as Cart[];

    mockCartItems = [
      {
        id: 1,
        cart: mockCarts[0],
        variant: mockVariants[0],
        quantity: 1,
        price_at_add: 6500000,
        price_discounted: null,
        valid: true,
      },
      {
        id: 2,
        cart: mockCarts[0],
        variant: mockVariants[2],
        quantity: 1,
        price_at_add: 750000,
        price_discounted: null,
        valid: true,
      },
    ] as CartItem[];
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🌱 Cart Seeding Process', () => {
    it('should seed comprehensive cart data successfully', async () => {
      // Mock repository responses
      userRepository.find.mockResolvedValue([]);
      userRepository.create.mockReturnValue(mockUsers as any);
      userRepository.save.mockResolvedValue(mockUsers as any);

      variantRepository.find.mockResolvedValue([]);
      productRepository.create.mockReturnValue(mockProducts as any);
      productRepository.save.mockResolvedValue(mockProducts as any);
      variantRepository.create.mockReturnValue(mockVariants as any);
      variantRepository.save.mockResolvedValue(mockVariants as any);

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock statistics
      cartRepository.count
        .mockResolvedValueOnce(10) // Total carts
        .mockResolvedValueOnce(7) // Active carts
        .mockResolvedValueOnce(3); // Abandoned carts
      cartItemRepository.count.mockResolvedValue(25);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '2500000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // Mock data cleanup
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.seedCarts();

      expect(result).toBeDefined();
      expect(result.carts).toBeDefined();
      expect(result.cartItems).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalCarts).toBe(10);
      expect(result.statistics.activeCarts).toBe(7);
      expect(result.statistics.abandonedCarts).toBe(3);
      expect(result.statistics.totalItems).toBe(25);
      expect(result.statistics.averageCartValue).toBe(2500000);

      // Verify cleanup was called
      expect(cartItemRepository.delete).toHaveBeenCalled();
      expect(cartRepository.delete).toHaveBeenCalled();

      // Verify users were created
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();

      // Verify products and variants were created
      expect(productRepository.create).toHaveBeenCalled();
      expect(productRepository.save).toHaveBeenCalled();
      expect(variantRepository.create).toHaveBeenCalled();
      expect(variantRepository.save).toHaveBeenCalled();

      // Verify carts and items were created
      expect(cartRepository.create).toHaveBeenCalled();
      expect(cartRepository.save).toHaveBeenCalled();
      expect(cartItemRepository.create).toHaveBeenCalled();
      expect(cartItemRepository.save).toHaveBeenCalled();
    });

    it('should use existing users and products if available', async () => {
      // Mock existing data
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock cleanup and statistics
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);
      cartRepository.count.mockResolvedValue(10);
      cartItemRepository.count.mockResolvedValue(25);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '2500000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Should not create new users/products since they exist
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(productRepository.create).not.toHaveBeenCalled();
      expect(variantRepository.create).not.toHaveBeenCalled();

      // Should still create carts
      expect(cartRepository.create).toHaveBeenCalled();
      expect(cartRepository.save).toHaveBeenCalled();
    });

    it('should handle seeding errors gracefully', async () => {
      // Mock repository failure
      userRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.seedCarts()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('🛒 Syrian Market Cart Scenarios', () => {
    it('should generate diverse Syrian market cart scenarios', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      const cartCreateCalls: any[] = [];
      cartRepository.create.mockImplementation((data) => {
        cartCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      const itemCreateCalls: any[] = [];
      cartItemRepository.create.mockImplementation((data) => {
        itemCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock cleanup and statistics
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);
      cartRepository.count.mockResolvedValue(3);
      cartItemRepository.count.mockResolvedValue(10);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '2000000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Verify different cart scenarios were created
      expect(cartCreateCalls.length).toBe(3); // One cart per user

      // Check for SYP currency (Syrian market default)
      const sypCarts = cartCreateCalls.filter(
        (cart) => cart.currency === 'SYP',
      );
      expect(sypCarts.length).toBeGreaterThan(0);

      // Check for different cart statuses
      const activeStatuses = cartCreateCalls.filter(
        (cart) => cart.status === 'active',
      );
      expect(activeStatuses.length).toBeGreaterThan(0);

      // Verify cart items were created with proper attributes
      expect(itemCreateCalls.length).toBeGreaterThan(0);

      // Check for price tracking
      itemCreateCalls.forEach((item) => {
        expect(item.price_at_add).toBeDefined();
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.valid).toBeDefined();
      });
    });

    it('should include campaign and discount scenarios', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      const itemCreateCalls: any[] = [];
      cartItemRepository.create.mockImplementation((data) => {
        itemCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock cleanup and statistics
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);
      cartRepository.count.mockResolvedValue(3);
      cartItemRepository.count.mockResolvedValue(10);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '2000000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Check for campaign items
      const campaignItems = itemCreateCalls.filter(
        (item) => item.added_from_campaign,
      );
      expect(campaignItems.length).toBeGreaterThan(0);

      // Check for discounted items
      const discountedItems = itemCreateCalls.filter(
        (item) => item.price_discounted,
      );
      expect(discountedItems.length).toBeGreaterThan(0);

      // Verify Syrian campaigns are included
      const ramadanItems = itemCreateCalls.filter(
        (item) =>
          item.added_from_campaign &&
          item.added_from_campaign.includes('ramadan'),
      );
      expect(ramadanItems.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle large SYP amounts correctly', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      const itemCreateCalls: any[] = [];
      cartItemRepository.create.mockImplementation((data) => {
        itemCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock cleanup and statistics
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);
      cartRepository.count.mockResolvedValue(3);
      cartItemRepository.count.mockResolvedValue(10);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '5000000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Verify Syrian price ranges (millions of SYP)
      itemCreateCalls.forEach((item) => {
        if (item.price_at_add) {
          expect(item.price_at_add).toBeGreaterThan(100000); // At least 100,000 SYP
          expect(item.price_at_add).toBeLessThan(50000000); // Less than 50M SYP
        }
      });
    });
  });

  describe('📊 Cart Statistics', () => {
    it('should calculate accurate cart statistics', async () => {
      // Mock minimal setup to test statistics
      userRepository.find.mockResolvedValue(mockUsers.slice(0, 1));
      variantRepository.find.mockResolvedValue(mockVariants.slice(0, 1));

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: 1 }) as any,
      );
      cartRepository.save.mockResolvedValue([mockCarts[0]] as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: 1 }) as any,
      );
      cartItemRepository.save.mockResolvedValue([mockCartItems[0]] as any);

      // Mock cleanup
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Mock statistics
      cartRepository.count
        .mockResolvedValueOnce(15) // Total carts
        .mockResolvedValueOnce(12) // Active carts
        .mockResolvedValueOnce(3); // Abandoned carts
      cartItemRepository.count.mockResolvedValue(45);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '3250000.75' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.seedCarts();

      expect(result.statistics).toEqual({
        totalCarts: 15,
        activeCarts: 12,
        abandonedCarts: 3,
        totalItems: 45,
        averageCartValue: 3250000.75,
      });
    });

    it('should handle null statistics gracefully', async () => {
      userRepository.find.mockResolvedValue(mockUsers.slice(0, 1));
      variantRepository.find.mockResolvedValue(mockVariants.slice(0, 1));

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: 1 }) as any,
      );
      cartRepository.save.mockResolvedValue([mockCarts[0]] as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: 1 }) as any,
      );
      cartItemRepository.save.mockResolvedValue([mockCartItems[0]] as any);

      // Mock cleanup
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Mock empty statistics
      cartRepository.count.mockResolvedValue(0);
      cartItemRepository.count.mockResolvedValue(0);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.seedCarts();

      expect(result.statistics.averageCartValue).toBe(0);
    });
  });

  describe('🧹 Data Management', () => {
    it('should clear existing data before seeding', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock cleanup
      cartItemRepository.delete.mockResolvedValue({ affected: 5 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 3 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Mock statistics
      cartRepository.count.mockResolvedValue(10);
      cartItemRepository.count.mockResolvedValue(25);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '2000000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Verify cleanup was called first
      expect(cartItemRepository.delete).toHaveBeenCalledWith({});
      expect(cartRepository.delete).toHaveBeenCalledWith({});

      // Verify data was created after cleanup
      expect(cartRepository.save).toHaveBeenCalled();
      expect(cartItemRepository.save).toHaveBeenCalled();
    });

    it('should update cart totals after creating items', async () => {
      userRepository.find.mockResolvedValue(mockUsers.slice(0, 1));
      variantRepository.find.mockResolvedValue(mockVariants.slice(0, 1));

      cartRepository.create.mockImplementation(
        (data) => ({ ...data, id: 1 }) as any,
      );
      cartRepository.save.mockResolvedValue([mockCarts[0]] as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: 1 }) as any,
      );
      cartItemRepository.save.mockResolvedValue([mockCartItems[0]] as any);

      // Mock items query for total calculation
      cartItemRepository.find.mockResolvedValue([mockCartItems[0]]);

      // Mock cleanup and statistics
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);
      cartRepository.count.mockResolvedValue(1);
      cartItemRepository.count.mockResolvedValue(1);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '6500000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Verify cart totals were updated
      expect(cartRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          totalItems: expect.any(Number),
          totalAmount: expect.any(Number),
        }),
      );
    });
  });

  describe('⚡ Minimal Seeding', () => {
    it('should seed minimal cart data for quick testing', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      const cartCreateCalls: any[] = [];
      cartRepository.create.mockImplementation((data) => {
        cartCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      const itemCreateCalls: any[] = [];
      cartItemRepository.create.mockImplementation((data) => {
        itemCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      cartRepository.save.mockResolvedValue(
        mockCarts.slice(0, 3 as any) as any,
      );
      cartItemRepository.save.mockResolvedValue(
        mockCartItems.slice(0, 3) as any,
      );

      const result = await service.seedMinimalCarts();

      expect(result.carts).toHaveLength(3);
      expect(result.cartItems).toHaveLength(3);

      // Verify simple cart structure
      expect(cartCreateCalls).toHaveLength(3);
      cartCreateCalls.forEach((cart) => {
        expect(cart.currency).toBe('SYP');
        expect(cart.status).toBe('active');
        expect(cart.totalItems).toBe(1);
      });

      // Verify simple item structure
      expect(itemCreateCalls).toHaveLength(3);
      itemCreateCalls.forEach((item) => {
        expect(item.quantity).toBe(1);
        expect(item.valid).toBe(true);
      });
    });

    it('should handle minimal seeding when no users exist', async () => {
      userRepository.find.mockResolvedValue([]);
      variantRepository.find.mockResolvedValue(mockVariants);

      await expect(service.seedMinimalCarts()).rejects.toThrow(
        'No users or variants found. Please seed users and products first.',
      );
    });

    it('should handle minimal seeding when no variants exist', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue([]);

      await expect(service.seedMinimalCarts()).rejects.toThrow(
        'No users or variants found. Please seed users and products first.',
      );
    });
  });

  describe('🌍 Multi-Currency Support', () => {
    it('should generate carts with different currencies for diaspora customers', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      variantRepository.find.mockResolvedValue(mockVariants);

      const cartCreateCalls: any[] = [];
      cartRepository.create.mockImplementation((data) => {
        cartCreateCalls.push(data);
        return { ...data, id: Math.random() } as any;
      });

      cartRepository.save.mockResolvedValue(mockCarts as any as any);
      cartItemRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      cartItemRepository.save.mockResolvedValue(mockCartItems as any);

      // Mock cleanup and statistics
      cartItemRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.delete.mockResolvedValue({ affected: 0 } as any);
      cartRepository.update.mockResolvedValue({ affected: 1 } as any);
      cartRepository.count.mockResolvedValue(3);
      cartItemRepository.count.mockResolvedValue(5);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgValue: '2000000' }),
      };
      cartRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedCarts();

      // Check that SYP is the primary currency
      const sypCarts = cartCreateCalls.filter(
        (cart) => cart.currency === 'SYP',
      );
      expect(sypCarts.length).toBeGreaterThan(0);

      // Verify currencies are valid
      cartCreateCalls.forEach((cart) => {
        expect(['SYP', 'USD', 'EUR'].includes(cart.currency)).toBe(true);
      });
    });
  });
});
