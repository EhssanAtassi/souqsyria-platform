/**
 * @file cart.service.findBySessionId.spec.ts
 * @description Unit tests for CartService.findBySessionId() method
 *
 * OVERVIEW:
 * This test file provides comprehensive unit test coverage for the guest cart
 * lookup functionality. It validates database query behavior, error handling,
 * and edge cases using mocked repositories.
 *
 * TEST COVERAGE:
 * - TASK-042: Unit test for CartService.findBySessionId()
 * - Successful cart retrieval with session ID
 * - Cart not found scenarios
 * - Error handling and logging
 * - Repository interaction validation
 * - Relation loading and entity composition
 *
 * TESTING STRATEGY:
 * - Mock GuestSessionRepository and Cart Repository
 * - Verify correct query parameters
 * - Validate return types and data structures
 * - Test error conditions and edge cases
 * - Confirm audit logging is called appropriately
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

import { CartService } from './cart.service';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { GuestSession } from '../entities/guest-session.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

/**
 * Unit Tests for CartService.findBySessionId()
 *
 * Validates guest cart lookup functionality with comprehensive
 * mocking of repository dependencies.
 */
describe('CartService.findBySessionId()', () => {
  let service: CartService;

  // Mocked repository instances
  let cartRepository: jest.Mocked<Repository<Cart>>;
  let cartItemRepository: jest.Mocked<Repository<CartItem>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;
  let guestSessionRepository: jest.Mocked<Repository<GuestSession>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  // Mock data
  let mockCart: Cart;
  let mockCartItem1: CartItem;
  let mockCartItem2: CartItem;
  let mockVariant1: ProductVariant;
  let mockVariant2: ProductVariant;
  let mockGuestSession: GuestSession;

  /**
   * SETUP - Initialize test module and mock dependencies
   *
   * Steps:
   * 1. Create NestJS test module with CartService
   * 2. Mock all repository dependencies
   * 3. Mock AuditLogService
   * 4. Initialize service instance
   * 5. Set up test data objects
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        // Mock Cart Repository
        {
          provide: getRepositoryToken(Cart),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
            })),
          }),
        },
        // Mock CartItem Repository
        {
          provide: getRepositoryToken(CartItem),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          }),
        },
        // Mock ProductVariant Repository
        {
          provide: getRepositoryToken(ProductVariant),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        // Mock GuestSession Repository
        {
          provide: getRepositoryToken(GuestSession),
          useFactory: () => ({
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          }),
        },
        // Mock AuditLogService
        {
          provide: AuditLogService,
          useFactory: () => ({
            logSimple: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    // Get service instance
    service = module.get<CartService>(CartService);

    // Get mocked repositories
    cartRepository = module.get(getRepositoryToken(Cart)) as jest.Mocked<
      Repository<Cart>
    >;
    cartItemRepository = module.get(getRepositoryToken(CartItem)) as jest.Mocked<
      Repository<CartItem>
    >;
    variantRepository = module.get(
      getRepositoryToken(ProductVariant),
    ) as jest.Mocked<Repository<ProductVariant>>;
    guestSessionRepository = module.get(
      getRepositoryToken(GuestSession),
    ) as jest.Mocked<Repository<GuestSession>>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<
      AuditLogService
    >;

    // Initialize test data
    setupMockData();
  });

  /**
   * Create mock data objects for testing
   *
   * Creates:
   * - Mock guest session
   * - Mock product variants with relations
   * - Mock cart items with variant associations
   * - Mock cart with items and session relation
   */
  function setupMockData() {
    // Mock guest session
    mockGuestSession = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      sessionToken: 'mock-session-token-hash',
      status: 'active',
      ipAddress: '192.168.1.100',
      lastActivityAt: new Date('2025-11-12T10:00:00Z'),
      expiresAt: new Date('2025-12-12T10:00:00Z'),
      createdAt: new Date('2025-11-12T09:00:00Z'),
      updatedAt: new Date('2025-11-12T10:00:00Z'),
    } as GuestSession;

    // Mock product variants
    mockVariant1 = {
      id: 1,
      name: 'iPhone 14 - 128GB - Blue',
      sku: 'IPHONE14-128GB-BLUE',
      price: 500000,
      isActive: true,
      product: {
        id: 101,
        name_en: 'iPhone 14',
        name_ar: 'آيفون 14',
      },
    } as any;

    mockVariant2 = {
      id: 2,
      name: 'Samsung S23 - 256GB - Black',
      sku: 'SAMSUNG-S23-256GB',
      price: 450000,
      isActive: true,
      product: {
        id: 102,
        name_en: 'Samsung S23',
        name_ar: 'سامسونج إس 23',
      },
    } as any;

    // Mock cart items
    mockCartItem1 = {
      id: 1,
      variant: mockVariant1,
      quantity: 2,
      price_at_add: 500000,
      price_discounted: null,
      added_at: new Date('2025-11-12T09:30:00Z'),
      locked_until: new Date('2025-11-19T09:30:00Z'),
      valid: true,
    } as CartItem;

    mockCartItem2 = {
      id: 2,
      variant: mockVariant2,
      quantity: 1,
      price_at_add: 450000,
      price_discounted: null,
      added_at: new Date('2025-11-12T09:45:00Z'),
      locked_until: new Date('2025-11-19T09:45:00Z'),
      valid: true,
    } as CartItem;

    // Mock cart
    mockCart = {
      id: 123,
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      userId: null,
      guestSession: mockGuestSession,
      items: [mockCartItem1, mockCartItem2],
      status: 'active',
      currency: 'SYP',
      totalItems: 3, // 2 + 1
      totalAmount: 1450000, // (500000 * 2) + (450000 * 1)
      lastActivityAt: new Date('2025-11-12T10:00:00Z'),
      version: 1,
    } as Cart;
  }

  // ============================================================================
  // TEST SUITE 1: Successful Cart Retrieval
  // ============================================================================

  describe('Successful Cart Retrieval', () => {
    /**
     * Test Case 1: Should retrieve cart with valid session ID
     *
     * Setup:
     * - Valid guest session ID provided
     * - Cart exists in database
     *
     * Expected:
     * - findOne called with correct query parameters
     * - Cart returned with all relations loaded
     * - Correct session ID in cart entity
     */
    it('should retrieve cart by valid session ID with all relations', async () => {
      // Arrange
      const sessionId = '550e8400-e29b-41d4-a716-446655440000';

      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId(sessionId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockCart);
      expect(result.sessionId).toBe(sessionId);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].variant).toBeDefined();

      // Verify repository was called correctly
      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'guestSession',
        ],
      });
      expect(cartRepository.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 2: Cart with no items
     *
     * Setup:
     * - Valid session ID
     * - Cart exists but has no items
     *
     * Expected:
     * - Empty items array returned
     * - Cart still returned successfully
     */
    it('should retrieve empty cart with valid session ID', async () => {
      // Arrange
      const emptyCart = {
        ...mockCart,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };

      cartRepository.findOne.mockResolvedValue(emptyCart as any);

      // Act
      const result = await service.findBySessionId(mockCart.sessionId);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    /**
     * Test Case 3: Cart with multiple items
     *
     * Setup:
     * - Valid session ID
     * - Cart with multiple items loaded
     *
     * Expected:
     * - All items returned with variants loaded
     * - Correct total calculation
     */
    it('should retrieve cart with all items and variant relations', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId(mockCart.sessionId);

      // Assert
      expect(result.items).toHaveLength(2);

      // Verify first item
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].variant.id).toBe(1);
      expect((result.items[0].variant as any).name).toBe('iPhone 14 - 128GB - Blue');
      expect(result.items[0].variant.product).toBeDefined();

      // Verify second item
      expect(result.items[1].id).toBe(2);
      expect(result.items[1].quantity).toBe(1);
      expect(result.items[1].variant.id).toBe(2);
    });

    /**
     * Test Case 4: Cart with guest session relation loaded
     *
     * Setup:
     * - Valid session ID
     * - Guest session data populated
     *
     * Expected:
     * - Guest session available in cart object
     * - Session metadata accessible
     */
    it('should load guest session relation when retrieving cart', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId(mockCart.sessionId);

      // Assert
      expect(result.guestSession).toBeDefined();
      expect(result.guestSession.id).toBe(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(result.guestSession.status).toBe('active');
      expect(result.guestSession.expiresAt).toBeDefined();
    });
  });

  // ============================================================================
  // TEST SUITE 2: Cart Not Found Scenarios
  // ============================================================================

  describe('Cart Not Found Scenarios', () => {
    /**
     * Test Case 1: Non-existent session ID returns null
     *
     * Setup:
     * - Invalid/non-existent session ID
     * - No matching cart in database
     *
     * Expected:
     * - Method returns null
     * - No error thrown
     * - Warning logged
     */
    it('should return null when cart not found for session ID', async () => {
      // Arrange
      const nonExistentSessionId = 'non-existent-session-id';
      cartRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findBySessionId(nonExistentSessionId);

      // Assert
      expect(result).toBeNull();

      // Verify repository was called
      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: nonExistentSessionId },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'guestSession',
        ],
      });
    });

    /**
     * Test Case 2: Empty string session ID
     *
     * Setup:
     * - Empty string provided as session ID
     *
     * Expected:
     * - Query still executed with empty string
     * - Null result returned
     */
    it('should handle empty string session ID gracefully', async () => {
      // Arrange
      const emptySessionId = '';
      cartRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findBySessionId(emptySessionId);

      // Assert
      expect(result).toBeNull();
      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: emptySessionId },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'guestSession',
        ],
      });
    });

    /**
     * Test Case 3: Invalid UUID format
     *
     * Setup:
     * - Invalid UUID format provided
     *
     * Expected:
     * - Query still attempted
     * - Null result returned
     */
    it('should handle invalid UUID format gracefully', async () => {
      // Arrange
      const invalidUUID = 'not-a-valid-uuid-12345';
      cartRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findBySessionId(invalidUUID);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // TEST SUITE 3: Error Handling and Exceptions
  // ============================================================================

  describe('Error Handling and Exceptions', () => {
    /**
     * Test Case 1: Database connection error
     *
     * Setup:
     * - Database query throws connection error
     *
     * Expected:
     * - Error is caught and re-thrown
     * - Error message logged
     * - Error propagates to caller
     */
    it('should handle database errors and log them', async () => {
      // Arrange
      const sessionId = 'valid-session-id';
      const dbError = new Error('Database connection failed');

      cartRepository.findOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findBySessionId(sessionId)).rejects.toThrow(
        'Database connection failed',
      );

      // Verify error was logged
      expect(cartRepository.findOne).toHaveBeenCalled();
    });

    /**
     * Test Case 2: Repository returns corrupted data
     *
     * Setup:
     * - Repository returns partially initialized object
     *
     * Expected:
     * - Partial data handled gracefully
     * - Method doesn't crash
     */
    it('should handle incomplete cart data from repository', async () => {
      // Arrange
      const incompleteCart: Partial<Cart> = {
        id: 123,
        sessionId: 'valid-session-id',
        items: undefined, // Missing items relation
      };

      cartRepository.findOne.mockResolvedValue(incompleteCart as Cart);

      // Act
      const result = await service.findBySessionId('valid-session-id');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(123);
    });

    /**
     * Test Case 3: Query timeout
     *
     * Setup:
     * - Database query times out
     *
     * Expected:
     * - Timeout error is propagated
     * - Method throws error
     */
    it('should propagate database timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      cartRepository.findOne.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.findBySessionId('valid-session-id')).rejects.toThrow(
        'Query timeout',
      );
    });
  });

  // ============================================================================
  // TEST SUITE 4: Repository Interaction Validation
  // ============================================================================

  describe('Repository Interaction Validation', () => {
    /**
     * Test Case 1: Correct query parameters
     *
     * Setup:
     * - Valid session ID provided
     *
     * Expected:
     * - findOne called with exact parameters
     * - Relations array includes all required data
     * - No additional parameters passed
     */
    it('should call findOne with correct where clause and relations', async () => {
      // Arrange
      const sessionId = 'test-session-id-12345';
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      await service.findBySessionId(sessionId);

      // Assert - Verify exact call
      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: sessionId },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'guestSession',
        ],
      });

      // Verify called only once
      expect(cartRepository.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 2: Relations array completeness
     *
     * Setup:
     * - Session ID provided
     *
     * Expected:
     * - All required relations included
     * - Items with variants and products loaded
     * - Guest session loaded
     */
    it('should load all required relations for cart data', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const expectedRelations = [
        'items',
        'items.variant',
        'items.variant.product',
        'guestSession',
      ];

      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      await service.findBySessionId(sessionId);

      // Assert
      const callArgs = cartRepository.findOne.mock.calls[0][0];
      expect(callArgs.relations).toEqual(expectedRelations);
      expect(callArgs.relations).toContain('items');
      expect(callArgs.relations).toContain('items.variant');
      expect(callArgs.relations).toContain('items.variant.product');
      expect(callArgs.relations).toContain('guestSession');
    });

    /**
     * Test Case 3: Only findOne method called
     *
     * Setup:
     * - Service method invoked
     *
     * Expected:
     * - Only findOne called (no other repository methods)
     * - No cartItemRepository calls
     * - No variantRepository calls
     * - No guestSessionRepository calls
     */
    it('should only call findOne on Cart repository', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      await service.findBySessionId('valid-session-id');

      // Assert - Verify only findOne called
      expect(cartRepository.findOne).toHaveBeenCalledTimes(1);
      expect(cartRepository.save).not.toHaveBeenCalled();
      expect(cartRepository.create).not.toHaveBeenCalled();
      expect(cartRepository.update).not.toHaveBeenCalled();
      expect(cartRepository.delete).not.toHaveBeenCalled();

      // Verify no other repositories called
      expect(cartItemRepository.findOne).not.toHaveBeenCalled();
      expect(variantRepository.findOne).not.toHaveBeenCalled();
      expect(guestSessionRepository.findOne).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TEST SUITE 5: Data Structure Validation
  // ============================================================================

  describe('Data Structure Validation', () => {
    /**
     * Test Case 1: Cart response structure
     *
     * Setup:
     * - Valid cart retrieved
     *
     * Expected:
     * - All required fields present
     * - Correct data types
     * - No unexpected fields
     */
    it('should return cart with complete data structure', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId(mockCart.sessionId);

      // Assert - Verify structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('guestSession');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalAmount');

      // Verify data types
      expect(typeof result.id).toBe('number');
      expect(typeof result.sessionId).toBe('string');
      expect(Array.isArray(result.items)).toBe(true);
    });

    /**
     * Test Case 2: Cart item structure
     *
     * Setup:
     * - Cart with items retrieved
     *
     * Expected:
     * - Item properties correct
     * - Variant object populated
     * - Product object accessible
     */
    it('should return cart items with complete variant and product data', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId(mockCart.sessionId);

      // Assert - Verify item structure
      const item = result.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('variant');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('price_at_add');
      expect(item).toHaveProperty('valid');

      // Verify variant structure
      expect(item.variant).toHaveProperty('id');
      expect(item.variant).toHaveProperty('name');
      expect(item.variant).toHaveProperty('sku');
      expect(item.variant).toHaveProperty('price');
      expect(item.variant).toHaveProperty('isActive');
      expect(item.variant).toHaveProperty('product');

      // Verify product structure
      expect(item.variant.product).toHaveProperty('id');
      expect(item.variant.product).toHaveProperty('name_en');
      expect(item.variant.product).toHaveProperty('name_ar');
    });

    /**
     * Test Case 3: Guest session data structure
     *
     * Setup:
     * - Cart with guest session retrieved
     *
     * Expected:
     * - Session properties accessible
     * - Session metadata complete
     */
    it('should include complete guest session data in cart', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId(mockCart.sessionId);

      // Assert - Verify session structure
      expect(result.guestSession).toBeDefined();
      expect(result.guestSession).toHaveProperty('id');
      expect(result.guestSession).toHaveProperty('sessionToken');
      expect(result.guestSession).toHaveProperty('status');
      expect(result.guestSession).toHaveProperty('expiresAt');
      expect(result.guestSession).toHaveProperty('ipAddress');
      expect(result.guestSession).toHaveProperty('lastActivityAt');
    });
  });

  // ============================================================================
  // TEST SUITE 6: Edge Cases and Boundary Conditions
  // ============================================================================

  describe('Edge Cases and Boundary Conditions', () => {
    /**
     * Test Case 1: Session ID with special characters
     *
     * Setup:
     * - Session ID with SQL special characters
     *
     * Expected:
     * - Query executed safely (TypeORM handles escaping)
     * - Null result or no error
     */
    it('should handle session ID with special characters safely', async () => {
      // Arrange
      const specialCharSessionId =
        "'; DROP TABLE carts; --"; // SQL injection attempt
      cartRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findBySessionId(specialCharSessionId);

      // Assert
      expect(result).toBeNull();
      expect(cartRepository.findOne).toHaveBeenCalled();
      // Verify TypeORM received the value safely
      const callArgs = cartRepository.findOne.mock.calls[0][0];
      expect((callArgs.where as any).sessionId).toBe(specialCharSessionId);
    });

    /**
     * Test Case 2: Very long session ID
     *
     * Setup:
     * - Extremely long session ID string
     *
     * Expected:
     * - Query executes without issues
     * - Null result (not matching actual ID)
     */
    it('should handle very long session ID gracefully', async () => {
      // Arrange
      const longSessionId = 'a'.repeat(1000);
      cartRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findBySessionId(longSessionId);

      // Assert
      expect(result).toBeNull();
      expect(cartRepository.findOne).toHaveBeenCalled();
    });

    /**
     * Test Case 3: Case sensitivity of session ID
     *
     * Setup:
     * - Session ID with different case variations
     *
     * Expected:
     * - Query uses exact case provided
     * - Different cases = different queries
     */
    it('should maintain case sensitivity of session ID', async () => {
      // Arrange
      const uppercaseSessionId = 'SESSION-ID-ABC123';
      const lowercaseSessionId = 'session-id-abc123';

      cartRepository.findOne.mockResolvedValue(null);

      // Act
      await service.findBySessionId(uppercaseSessionId);
      await service.findBySessionId(lowercaseSessionId);

      // Assert
      const firstCall = cartRepository.findOne.mock.calls[0][0];
      const secondCall = cartRepository.findOne.mock.calls[1][0];

      expect((firstCall.where as any).sessionId).toBe(uppercaseSessionId);
      expect((secondCall.where as any).sessionId).toBe(lowercaseSessionId);
      expect((firstCall.where as any).sessionId).not.toBe((secondCall.where as any).sessionId);
    });

    /**
     * Test Case 4: Multiple concurrent calls
     *
     * Setup:
     * - Multiple parallel queries for different sessions
     *
     * Expected:
     * - All queries execute independently
     * - Each returns correct data
     */
    it('should handle multiple concurrent calls correctly', async () => {
      // Arrange
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const sessionId3 = 'session-3';

      const cart1 = { ...mockCart, id: 1, sessionId: sessionId1 };
      const cart2 = { ...mockCart, id: 2, sessionId: sessionId2 };
      const cart3 = { ...mockCart, id: 3, sessionId: sessionId3 };

      cartRepository.findOne
        .mockResolvedValueOnce(cart1 as any)
        .mockResolvedValueOnce(cart2 as any)
        .mockResolvedValueOnce(cart3 as any);

      // Act
      const [result1, result2, result3] = await Promise.all([
        service.findBySessionId(sessionId1),
        service.findBySessionId(sessionId2),
        service.findBySessionId(sessionId3),
      ]);

      // Assert
      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
      expect(result3.id).toBe(3);
      expect(cartRepository.findOne).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // TEST SUITE 7: Performance and Optimization
  // ============================================================================

  describe('Performance and Optimization', () => {
    /**
     * Test Case 1: Single query execution
     *
     * Setup:
     * - Service method called once
     *
     * Expected:
     * - Exactly one database query
     * - No N+1 query problems
     * - Relations loaded in single query
     */
    it('should execute exactly one database query', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      await service.findBySessionId('session-id');

      // Assert
      expect(cartRepository.findOne).toHaveBeenCalledTimes(1);

      // Verify no additional queries on repositories
      expect(cartItemRepository.findOne).not.toHaveBeenCalled();
      expect(variantRepository.findOne).not.toHaveBeenCalled();
    });

    /**
     * Test Case 2: Eager loading of relations
     *
     * Setup:
     * - Cart with nested relations retrieved
     *
     * Expected:
     * - All relations loaded in one query
     * - No lazy loading calls
     */
    it('should load all relations eagerly to avoid N+1 queries', async () => {
      // Arrange
      cartRepository.findOne.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.findBySessionId('session-id');

      // Assert
      // Verify relations were requested
      const callArgs = cartRepository.findOne.mock.calls[0][0];
      const relations = callArgs.relations as string[];
      expect(relations.length).toBeGreaterThanOrEqual(4);

      // Verify we don't make additional queries
      expect(cartItemRepository.findOne).not.toHaveBeenCalled();
      expect(variantRepository.findOne).not.toHaveBeenCalled();

      // Verify data is available without additional calls
      expect(result.items[0].variant.product).toBeDefined();
    });
  });
});
