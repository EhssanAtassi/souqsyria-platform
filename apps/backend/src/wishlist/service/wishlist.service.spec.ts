/**
 * @fileoverview Comprehensive unit tests for WishlistService
 * @description Tests wishlist operations including add, remove, move to cart, and sharing
 * 
 * Test Coverage:
 * - Adding products to wishlist
 * - Removing products from wishlist
 * - Getting user wishlist
 * - Moving items to cart
 * - Wishlist sharing via tokens
 * - Wishlist analytics
 * 
 * Syrian Market Context:
 * - Product variants with SYP pricing
 * - Bilingual product display (Arabic/English)
 * - Syrian marketplace product types
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { Wishlist } from '../entities/wishlist.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { User } from '../../users/entities/user.entity';
import { CartService } from '../../cart/cart.service';

// ============================================================================
// Mock Factories - Syrian Marketplace Data
// ============================================================================

/**
 * Creates a mock Syrian user
 */
const createMockUser = (overrides = {}): Partial<User> => ({
  id: 1,
  email: 'ahmad@souqsyria.com',
  ...overrides,
});

/**
 * Creates a mock Syrian product
 */
const createMockProduct = (overrides = {}): any => ({
  id: 1,
  nameEn: 'Aleppo Olive Oil Soap',
  nameAr: 'صابون زيت الزيتون الحلبي',
  slug: 'aleppo-olive-oil-soap',
  basePrice: 25000, // 25,000 SYP
  isActive: true,
  isPublished: true,
  is_deleted: false,
  createdAt: new Date('2024-01-10'),
  ...overrides,
});

/**
 * Creates a mock product variant
 */
const createMockVariant = (overrides = {}): any => ({
  id: 1,
  sku: 'ALEPPO-SOAP-500G',
  price: 25000,
  stockQuantity: 150,
  isActive: true,
  ...overrides,
});

/**
 * Creates a mock wishlist entry
 */
const createMockWishlistEntry = (overrides = {}): Partial<Wishlist> => ({
  id: 1,
  user: createMockUser() as User,
  product: createMockProduct() as ProductEntity,
  productVariant: createMockVariant() as ProductVariant,
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

// ============================================================================
// Mock Repository Factory
// ============================================================================

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue({ activeUsers: 0 }),
    getCount: jest.fn().mockResolvedValue(0),
  })),
});

// ============================================================================
// Test Suite
// ============================================================================

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistRepo: MockRepository<Wishlist>;
  let productRepo: MockRepository<ProductEntity>;
  let variantRepo: MockRepository<ProductVariant>;
  let userRepo: MockRepository<User>;
  let cartService: Partial<CartService>;

  beforeEach(async () => {
    wishlistRepo = createMockRepository<Wishlist>();
    productRepo = createMockRepository<ProductEntity>();
    variantRepo = createMockRepository<ProductVariant>();
    userRepo = createMockRepository<User>();

    cartService = {
      addItemToCart: jest.fn().mockResolvedValue({ success: true }),
      getCart: jest.fn().mockResolvedValue({ items: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: getRepositoryToken(Wishlist), useValue: wishlistRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: CartService, useValue: cartService },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Service Initialization
  // ==========================================================================

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==========================================================================
  // addToWishlist() Method Tests
  // ==========================================================================

  describe('addToWishlist()', () => {
    it('should add a product to wishlist', async () => {
      const mockUser = createMockUser() as User;
      const mockProduct = createMockProduct();
      const mockEntry = createMockWishlistEntry();

      productRepo.findOne.mockResolvedValue(mockProduct);
      wishlistRepo.findOne.mockResolvedValue(null); // Not already in wishlist
      wishlistRepo.create.mockReturnValue(mockEntry);
      wishlistRepo.save.mockResolvedValue(mockEntry);

      const result = await service.addToWishlist(mockUser, 1);

      expect(wishlistRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when product not found', async () => {
      const mockUser = createMockUser() as User;
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.addToWishlist(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when product already in wishlist', async () => {
      const mockUser = createMockUser() as User;
      const mockProduct = createMockProduct();
      const existingEntry = createMockWishlistEntry();

      productRepo.findOne.mockResolvedValue(mockProduct);
      wishlistRepo.findOne.mockResolvedValue(existingEntry);

      await expect(service.addToWishlist(mockUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should add product with variant', async () => {
      const mockUser = createMockUser() as User;
      const mockProduct = createMockProduct();
      const mockVariant = createMockVariant();
      const mockEntry = createMockWishlistEntry({ productVariant: mockVariant });

      productRepo.findOne.mockResolvedValue(mockProduct);
      variantRepo.findOne.mockResolvedValue(mockVariant);
      wishlistRepo.findOne.mockResolvedValue(null);
      wishlistRepo.create.mockReturnValue(mockEntry);
      wishlistRepo.save.mockResolvedValue(mockEntry);

      const result = await service.addToWishlist(mockUser, 1, 1);

      expect(variantRepo.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when variant not found', async () => {
      const mockUser = createMockUser() as User;
      const mockProduct = createMockProduct();

      productRepo.findOne.mockResolvedValue(mockProduct);
      variantRepo.findOne.mockResolvedValue(null);

      await expect(service.addToWishlist(mockUser, 1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================================================
  // removeFromWishlist() Method Tests
  // ==========================================================================

  describe('removeFromWishlist()', () => {
    it('should remove a product from wishlist', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry();

      wishlistRepo.findOne.mockResolvedValue(mockEntry);
      wishlistRepo.remove.mockResolvedValue(mockEntry);

      await service.removeFromWishlist(mockUser, 1);

      expect(wishlistRepo.remove).toHaveBeenCalledWith(mockEntry);
    });

    it('should throw NotFoundException when entry not found', async () => {
      const mockUser = createMockUser() as User;
      wishlistRepo.findOne.mockResolvedValue(null);

      await expect(service.removeFromWishlist(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove product with specific variant', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry();

      wishlistRepo.findOne.mockResolvedValue(mockEntry);
      wishlistRepo.remove.mockResolvedValue(mockEntry);

      await service.removeFromWishlist(mockUser, 1, 1);

      expect(wishlistRepo.remove).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getWishlist() Method Tests
  // ==========================================================================

  describe('getWishlist()', () => {
    it('should return user wishlist with products', async () => {
      const mockUser = createMockUser() as User;
      const mockEntries = [
        createMockWishlistEntry({ id: 1, product: createMockProduct({ id: 1 }) }),
        createMockWishlistEntry({ id: 2, product: createMockProduct({ id: 2, nameEn: 'Damascus Brocade' }) }),
        createMockWishlistEntry({ id: 3, product: createMockProduct({ id: 3, nameEn: 'Syrian Olive Oil' }) }),
      ];

      wishlistRepo.find.mockResolvedValue(mockEntries);

      const result = await service.getWishlist(mockUser);

      expect(result).toHaveLength(3);
    });

    it('should return empty array when wishlist is empty', async () => {
      const mockUser = createMockUser() as User;
      wishlistRepo.find.mockResolvedValue([]);

      const result = await service.getWishlist(mockUser);

      expect(result).toEqual([]);
    });

    it('should include product relations', async () => {
      const mockUser = createMockUser() as User;
      wishlistRepo.find.mockResolvedValue([]);

      await service.getWishlist(mockUser);

      expect(wishlistRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['product', 'productVariant']),
        }),
      );
    });

    it('should order by createdAt descending (newest first)', async () => {
      const mockUser = createMockUser() as User;
      wishlistRepo.find.mockResolvedValue([]);

      await service.getWishlist(mockUser);

      expect(wishlistRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  // ==========================================================================
  // moveToCart() Method Tests
  // ==========================================================================

  describe('moveToCart()', () => {
    it('should move wishlist item to cart', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry();

      wishlistRepo.findOne.mockResolvedValue(mockEntry);
      cartService.addItemToCart.mockResolvedValue({ success: true });
      wishlistRepo.remove.mockResolvedValue(mockEntry);

      const result = await service.moveToCart(mockUser, 1);

      expect(cartService.addItemToCart).toHaveBeenCalled();
      expect(wishlistRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when entry not found', async () => {
      const mockUser = createMockUser() as User;
      wishlistRepo.findOne.mockResolvedValue(null);

      await expect(service.moveToCart(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when no variant associated', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry({ productVariant: null });

      wishlistRepo.findOne.mockResolvedValue(mockEntry);

      await expect(service.moveToCart(mockUser, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should pass correct quantity when specified', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry();

      wishlistRepo.findOne.mockResolvedValue(mockEntry);
      cartService.addItemToCart.mockResolvedValue({ success: true });
      wishlistRepo.remove.mockResolvedValue(mockEntry);

      await service.moveToCart(mockUser, 1, 3);

      expect(cartService.addItemToCart).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ quantity: 3 }),
      );
    });
  });

  // ==========================================================================
  // generateShareToken() Method Tests
  // ==========================================================================

  describe('generateShareToken()', () => {
    it('should generate a unique share token', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry();

      wishlistRepo.findOne.mockResolvedValue(mockEntry);
      wishlistRepo.save.mockResolvedValue({ ...mockEntry, shareToken: 'abc-123' });

      const token = await service.generateShareToken(mockUser, 1);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should throw NotFoundException when wishlist item not found', async () => {
      const mockUser = createMockUser() as User;
      wishlistRepo.findOne.mockResolvedValue(null);

      await expect(service.generateShareToken(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================================================
  // getWishlistByShareToken() Method Tests
  // ==========================================================================

  describe('getWishlistByShareToken()', () => {
    it('should return shared wishlist item', async () => {
      const mockEntry = createMockWishlistEntry({ shareToken: 'valid-token' });

      wishlistRepo.findOne.mockResolvedValue(mockEntry);

      const result = await service.getWishlistByShareToken('valid-token');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException for invalid token', async () => {
      wishlistRepo.findOne.mockResolvedValue(null);

      await expect(service.getWishlistByShareToken('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================================================
  // getWishlistAnalytics() Method Tests
  // ==========================================================================

  describe('getWishlistAnalytics()', () => {
    it('should return wishlist analytics', async () => {
      const queryBuilder = wishlistRepo.createQueryBuilder();
      wishlistRepo.count.mockResolvedValue(100);
      wishlistRepo.query.mockResolvedValue([
        { productId: 1, count: 150 },
        { productId: 2, count: 120 },
      ]);
      queryBuilder.getRawOne.mockResolvedValue({ activeUsers: 50 });

      const result = await service.getWishlistAnalytics();

      expect(result).toBeDefined();
      expect(result.totalWishlists).toBe(100);
    });

    it('should return empty analytics for no data', async () => {
      wishlistRepo.count.mockResolvedValue(0);
      wishlistRepo.query.mockResolvedValue([]);
      const queryBuilder = wishlistRepo.createQueryBuilder();
      queryBuilder.getRawOne.mockResolvedValue({ activeUsers: 0 });

      const result = await service.getWishlistAnalytics();

      expect(result.totalWishlists).toBe(0);
    });
  });

  // ==========================================================================
  // Syrian Marketplace Specific Tests
  // ==========================================================================

  describe('Syrian Marketplace Features', () => {
    it('should handle traditional Syrian products', async () => {
      const mockUser = createMockUser() as User;
      const syrianProducts = [
        { id: 1, nameEn: 'Aleppo Soap', nameAr: 'صابون حلبي' },
        { id: 2, nameEn: 'Damascus Brocade', nameAr: 'بروكار دمشقي' },
        { id: 3, nameEn: 'Ghouta Apricots', nameAr: 'مشمش الغوطة' },
        { id: 4, nameEn: 'Syrian Pistachios', nameAr: 'فستق حلبي' },
        { id: 5, nameEn: 'Palmyra Dates', nameAr: 'تمر تدمري' },
      ];

      for (const product of syrianProducts) {
        const mockProduct = createMockProduct(product);
        const mockEntry = createMockWishlistEntry({ product: mockProduct });

        productRepo.findOne.mockResolvedValue(mockProduct);
        wishlistRepo.findOne.mockResolvedValue(null);
        wishlistRepo.create.mockReturnValue(mockEntry);
        wishlistRepo.save.mockResolvedValue(mockEntry);

        const result = await service.addToWishlist(mockUser, product.id);
        expect(result).toBeDefined();
      }
    });

    it('should handle bilingual wishlist display', async () => {
      const mockUser = createMockUser() as User;
      const mockEntries = [
        createMockWishlistEntry({
          product: createMockProduct({
            nameEn: 'Aleppo Soap',
            nameAr: 'صابون حلبي',
          }),
        }),
      ];

      wishlistRepo.find.mockResolvedValue(mockEntries);

      const result = await service.getWishlist(mockUser);

      expect(result[0].product.nameEn).toBe('Aleppo Soap');
      expect(result[0].product.nameAr).toBe('صابون حلبي');
    });

    it('should handle SYP pricing in wishlist items', async () => {
      const mockUser = createMockUser() as User;
      const mockEntry = createMockWishlistEntry({
        product: createMockProduct({
          basePrice: 1500000, // 1.5 million SYP
        }),
        productVariant: createMockVariant({
          price: 1750000, // 1.75 million SYP with variant
        }),
      });

      wishlistRepo.find.mockResolvedValue([mockEntry]);

      const result = await service.getWishlist(mockUser);

      expect((result[0].product as any).basePrice).toBe(1500000);
      expect(result[0].productVariant.price).toBe(1750000);
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle maximum wishlist size gracefully', async () => {
      const mockUser = createMockUser() as User;
      const maxItems = 100;
      const mockEntries = Array.from({ length: maxItems }, (_, i) =>
        createMockWishlistEntry({ id: i + 1 }),
      );

      wishlistRepo.find.mockResolvedValue(mockEntries);

      const result = await service.getWishlist(mockUser);

      expect(result).toHaveLength(maxItems);
    });

    it('should handle deleted products in wishlist', async () => {
      const mockUser = createMockUser() as User;
      const deletedProduct = createMockProduct({ is_deleted: true });
      const mockEntry = createMockWishlistEntry({ product: deletedProduct });

      wishlistRepo.find.mockResolvedValue([mockEntry]);

      const result = await service.getWishlist(mockUser);

      // Should still return the entry but product is marked deleted
      expect(result[0].product.is_deleted).toBe(true);
    });

    it('should handle out-of-stock variants', async () => {
      const mockUser = createMockUser() as User;
      const outOfStockVariant = createMockVariant({ stockQuantity: 0 });
      const mockEntry = createMockWishlistEntry({ productVariant: outOfStockVariant });

      wishlistRepo.find.mockResolvedValue([mockEntry]);

      // Should still be able to view in wishlist
      const result = await service.getWishlist(mockUser);
      expect((result[0].productVariant as any).stockQuantity).toBe(0);
    });
  });

  // ==========================================================================
  // Performance Tests
  // ==========================================================================

  describe('Performance', () => {
    it('should efficiently retrieve large wishlists', async () => {
      const mockUser = createMockUser() as User;
      const largeWishlist = Array.from({ length: 500 }, (_, i) =>
        createMockWishlistEntry({ id: i + 1 }),
      );

      wishlistRepo.find.mockResolvedValue(largeWishlist);

      const startTime = Date.now();
      const result = await service.getWishlist(mockUser);
      const endTime = Date.now();

      expect(result).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
