/**
 * @file categories-public.controller.spec.ts
 * @description Unit tests for the CategoriesPublicController
 *
 * TEST COVERAGE:
 * - getCategoryTree endpoint (GET /categories/tree)
 * - getFeaturedCategories endpoint (GET /categories/featured)
 * - Response format and status code validation
 * - Query parameter acceptance
 * - Error response handling
 *
 * @author SouqSyria Development Team
 * @since 2026-02-07
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CategoriesPublicController } from './categories-public.controller';
import { CategoriesService } from '../services/categories.service';
import { CategorySearchService } from '../services/category-search.service';
import { CategoryHierarchyService } from '../services/category-hierarchy.service';
import { PublicProductsService } from '../../products/public/service/public-products.service';
import { Category } from '../entities/category.entity';
import { Request, Response } from 'express';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Creates a mock Category entity with entity methods
 * @param overrides - Partial category properties to override defaults
 * @returns Partial Category with sensible defaults
 */
const createMockCategory = (overrides?: Partial<Category>): Partial<Category> => ({
  id: 1,
  nameEn: 'Electronics',
  nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
  slug: 'electronics',
  descriptionEn: 'Electronic devices and gadgets',
  descriptionAr: '\u0623\u062C\u0647\u0632\u0629 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629',
  iconUrl: 'https://cdn.souqsyria.com/icons/electronics.svg',
  bannerUrl: 'https://cdn.souqsyria.com/banners/electronics.jpg',
  themeColor: '#2196F3',
  isActive: true,
  isFeatured: true,
  featuredPriority: 10,
  featuredImageUrl: 'https://cdn.souqsyria.com/featured/electronics.jpg',
  featuredDiscount: '15%',
  approvalStatus: 'approved' as const,
  sortOrder: 100,
  productCount: 150,
  children: [],
  ...overrides,
});

/**
 * Creates a mock Express Response object
 * @returns Jest-mocked Express Response
 */
const createMockResponse = (): jest.Mocked<Response> => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;
  return response;
};

/**
 * Creates a mock Express Request object
 * @param overrides - Optional request property overrides
 * @returns Jest-mocked Express Request
 */
const createMockRequest = (overrides?: Partial<Request>): jest.Mocked<Request> => {
  return {
    headers: {
      'user-agent': 'test-agent',
      'accept-language': 'en',
    },
    connection: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1',
    ...overrides,
  } as unknown as jest.Mocked<Request>;
};

// =============================================================================
// TEST SUITE
// =============================================================================

/** @description Unit tests for the public-facing categories controller */
describe('CategoriesPublicController', () => {
  let controller: CategoriesPublicController;
  let categoriesService: jest.Mocked<CategoriesService>;
  let categorySearchService: jest.Mocked<CategorySearchService>;
  let categoryHierarchyService: jest.Mocked<CategoryHierarchyService>;
  let publicProductsService: jest.Mocked<PublicProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesPublicController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            getTree: jest.fn(),
            getFeaturedCategories: jest.fn(),
            find: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: CategorySearchService,
          useValue: {
            searchCategories: jest.fn(),
          },
        },
        {
          provide: CategoryHierarchyService,
          useValue: {
            generateBreadcrumbs: jest.fn(),
          },
        },
        {
          provide: PublicProductsService,
          useValue: {
            getFeaturedProducts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesPublicController>(CategoriesPublicController);
    categoriesService = module.get(CategoriesService) as jest.Mocked<CategoriesService>;
    categorySearchService = module.get(CategorySearchService) as jest.Mocked<CategorySearchService>;
    categoryHierarchyService = module.get(CategoryHierarchyService) as jest.Mocked<CategoryHierarchyService>;
    publicProductsService = module.get(PublicProductsService) as jest.Mocked<PublicProductsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // CONTROLLER INITIALIZATION
  // ===========================================================================

  /** @description Verifies controller initializes with all required dependencies */
  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ===========================================================================
  // GET CATEGORY TREE (GET /categories/tree)
  // ===========================================================================

  /** @description Tests for the getCategoryTree endpoint */
  describe('getCategoryTree', () => {
    /**
     * Should return 200 with tree data
     * Validates: Successful response with proper HTTP status
     */
    it('should return 200 with tree data', async () => {
      const mockResponse = createMockResponse();

      const mockTreeData = [
        createMockCategory({
          id: 1,
          nameEn: 'Electronics',
          nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
          slug: 'electronics',
          iconUrl: 'devices',
          bannerUrl: 'electronics.jpg',
          productCount: 45,
          children: [
            createMockCategory({
              id: 10,
              nameEn: 'Smartphones',
              nameAr: '\u0647\u0648\u0627\u062A\u0641 \u0630\u0643\u064A\u0629',
              slug: 'smartphones',
              iconUrl: 'smartphone',
              bannerUrl: 'phones.jpg',
              productCount: 20,
              children: [],
            }) as Category,
          ],
        }),
      ] as Category[];

      categoriesService.getTree.mockResolvedValue(mockTreeData);

      await controller.getCategoryTree('en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              name: 'Electronics',
              slug: 'electronics',
              children: expect.arrayContaining([
                expect.objectContaining({
                  id: 10,
                  name: 'Smartphones',
                  slug: 'smartphones',
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    /**
     * Should return correct response shape with data array
     * Validates: The response envelope contains a data property with an array
     */
    it('should return correct response shape with data array', async () => {
      const mockResponse = createMockResponse();

      categoriesService.getTree.mockResolvedValue([]);

      await controller.getCategoryTree('en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
        }),
      );
    });

    /**
     * Should return Arabic names when language is 'ar'
     * Validates: Language parameter controls name selection
     */
    it('should return Arabic names when language is ar', async () => {
      const mockResponse = createMockResponse();

      const mockTreeData = [
        createMockCategory({
          id: 1,
          nameEn: 'Electronics',
          nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
          slug: 'electronics',
          children: [],
        }),
      ] as Category[];

      categoriesService.getTree.mockResolvedValue(mockTreeData);

      await controller.getCategoryTree('ar', mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              name: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
            }),
          ]),
        }),
      );
    });

    /**
     * Should set cache headers for performance
     * Validates: Cache-Control header is set on the response
     */
    it('should set cache headers for performance', async () => {
      const mockResponse = createMockResponse();

      categoriesService.getTree.mockResolvedValue([]);

      await controller.getCategoryTree('en', mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'public, max-age=1800',
        }),
      );
    });

    /**
     * Should default to 'en' for invalid language parameter
     * Validates: Language sanitization fallback
     */
    it('should default to en for invalid language parameter', async () => {
      const mockResponse = createMockResponse();

      const mockTreeData = [
        createMockCategory({
          id: 1,
          nameEn: 'Electronics',
          nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
          slug: 'electronics',
          children: [],
        }),
      ] as Category[];

      categoriesService.getTree.mockResolvedValue(mockTreeData);

      await controller.getCategoryTree('invalid' as 'en' | 'ar', mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              name: 'Electronics',
            }),
          ]),
        }),
      );
    });

    /**
     * Should return 500 when service throws an error
     * Validates: Internal server error handling
     */
    it('should return 500 when service throws an error', async () => {
      const mockResponse = createMockResponse();

      categoriesService.getTree.mockRejectedValue(new Error('Database connection failed'));

      await controller.getCategoryTree('en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve category tree',
        }),
      );
    });
  });

  // ===========================================================================
  // GET FEATURED CATEGORIES (GET /categories/featured)
  // ===========================================================================

  /** @description Tests for the getFeaturedCategories endpoint */
  describe('getFeaturedCategories', () => {
    /**
     * Should return 200 with featured categories
     * Validates: Successful response with correct HTTP status and data
     */
    it('should return 200 with featured categories', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      const featuredCategories = [
        createMockCategory({
          id: 1,
          nameEn: 'Electronics',
          nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
          slug: 'electronics',
          isFeatured: true,
          featuredPriority: 10,
          productCount: 45,
        }),
        createMockCategory({
          id: 2,
          nameEn: 'Fashion',
          nameAr: '\u0623\u0632\u064A\u0627\u0621',
          slug: 'fashion',
          isFeatured: true,
          featuredPriority: 8,
          productCount: 38,
        }),
      ] as Category[];

      categoriesService.getFeaturedCategories.mockResolvedValue(featuredCategories);

      await controller.getFeaturedCategories('en', 8, mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              name_en: 'Electronics',
              name_ar: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
              slug: 'electronics',
              is_featured: true,
              product_count: 45,
            }),
          ]),
          meta: expect.objectContaining({
            total: 2,
          }),
        }),
      );
    });

    /**
     * Should accept language and limit query parameters
     * Validates: Query params are forwarded to the service correctly
     */
    it('should accept language and limit query parameters', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categoriesService.getFeaturedCategories.mockResolvedValue([]);

      await controller.getFeaturedCategories('ar', 12, mockRequest, mockResponse);

      // Service should be called with sanitized limit (12 is within bounds)
      expect(categoriesService.getFeaturedCategories).toHaveBeenCalledWith(12);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Language': 'ar',
        }),
      );
    });

    /**
     * Should sanitize limit to maximum of 20
     * Validates: Upper bound limit enforcement
     */
    it('should sanitize limit to maximum of 20', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categoriesService.getFeaturedCategories.mockResolvedValue([]);

      await controller.getFeaturedCategories('en', 100, mockRequest, mockResponse);

      expect(categoriesService.getFeaturedCategories).toHaveBeenCalledWith(20);
    });

    /**
     * Should return response in snake_case format
     * Validates: Response transformation to frontend-expected format
     */
    it('should return response in snake_case format', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      const featuredCategories = [
        createMockCategory({
          id: 1,
          nameEn: 'Damascus Steel',
          nameAr: '\u0627\u0644\u0641\u0648\u0644\u0627\u0630 \u0627\u0644\u062F\u0645\u0634\u0642\u064A',
          slug: 'damascus-steel',
          featuredImageUrl: 'steel.jpg',
          featuredDiscount: '15%',
          featuredPriority: 10,
        }),
      ] as Category[];

      categoriesService.getFeaturedCategories.mockResolvedValue(featuredCategories);

      await controller.getFeaturedCategories('en', 8, mockRequest, mockResponse);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      const firstItem = jsonCall.data[0];

      expect(firstItem).toHaveProperty('name_en');
      expect(firstItem).toHaveProperty('name_ar');
      expect(firstItem).toHaveProperty('icon_url');
      expect(firstItem).toHaveProperty('theme_color');
      expect(firstItem).toHaveProperty('featured_image_url');
      expect(firstItem).toHaveProperty('featured_discount');
      expect(firstItem).toHaveProperty('is_featured');
      expect(firstItem).toHaveProperty('featured_priority');
      expect(firstItem).toHaveProperty('is_active');
      expect(firstItem).toHaveProperty('product_count');
    });

    /**
     * Should set cache headers (15 minute cache)
     * Validates: Cache-Control header for featured content
     */
    it('should set cache headers for featured content', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categoriesService.getFeaturedCategories.mockResolvedValue([]);

      await controller.getFeaturedCategories('en', 8, mockRequest, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'public, max-age=900',
        }),
      );
    });

    /**
     * Should return 500 when service throws an error
     * Validates: Internal server error handling
     */
    it('should return 500 when service throws an error', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categoriesService.getFeaturedCategories.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await controller.getFeaturedCategories('en', 8, mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve featured categories',
        }),
      );
    });

    /**
     * Should return empty data array when no featured categories exist
     * Validates: Graceful empty state handling
     */
    it('should return empty data array when no featured categories exist', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categoriesService.getFeaturedCategories.mockResolvedValue([]);

      await controller.getFeaturedCategories('en', 8, mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          meta: expect.objectContaining({
            total: 0,
          }),
        }),
      );
    });
  });
});
