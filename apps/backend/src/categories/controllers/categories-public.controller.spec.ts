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
import { HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
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
            findById: jest.fn(),
            searchWithinCategory: jest.fn(),
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
            getCategoryChildren: jest.fn(),
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
              name: 'Electronics',
              nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
              slug: 'electronics',
              productCount: 45,
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
    it('should return response in camelCase format matching FE interface', async () => {
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

      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('nameAr');
      expect(firstItem).toHaveProperty('slug');
      expect(firstItem).toHaveProperty('image');
      expect(firstItem).toHaveProperty('icon');
      expect(firstItem).toHaveProperty('productCount');
      expect(firstItem).toHaveProperty('sortOrder');
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

  // ===========================================================================
  // SEARCH CATEGORIES (GET /categories/search)
  // ===========================================================================

  /** @description Tests for the searchCategories endpoint */
  describe('searchCategories', () => {
    /**
     * Should return 200 with search results for a valid query
     * Validates: Successful search response with relevance scoring
     */
    it('should return 200 with search results for valid query', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      const searchResult = {
        data: [
          {
            id: 1,
            displayName: 'Electronics',
            displayDescription: 'Electronic devices',
            slug: 'electronics',
            iconUrl: 'icon.svg',
            bannerUrl: 'banner.jpg',
            productCount: 150,
            hasChildren: true,
            parent: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      categorySearchService.searchCategories.mockResolvedValue(searchResult as any);

      await controller.searchCategories(
        'electronics',
        'en',
        10,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          meta: expect.objectContaining({
            searchQuery: 'electronics',
          }),
        }),
      );
    });

    /**
     * Should return 400 when search query is less than 2 characters
     * Validates: Minimum query length enforcement
     */
    it('should return 400 when search query is too short', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      await controller.searchCategories(
        'a',
        'en',
        10,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid request parameters',
        }),
      );
    });

    /**
     * Should return 400 when search query is empty
     * Validates: Empty string rejection
     */
    it('should return 400 when search query is empty', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      await controller.searchCategories(
        '',
        'en',
        10,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    /**
     * Should sanitize limit to maximum of 50
     * Validates: Upper bound limit enforcement for search
     */
    it('should sanitize limit to maximum of 50', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categorySearchService.searchCategories.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      } as any);

      await controller.searchCategories(
        'electronics',
        'en',
        200,
        mockRequest,
        mockResponse,
      );

      expect(categorySearchService.searchCategories).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        }),
      );
    });

    /**
     * Should return 500 when search service fails
     * Validates: Internal error is handled gracefully
     */
    it('should return 500 when search service throws an error', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categorySearchService.searchCategories.mockRejectedValue(
        new Error('Search index failure'),
      );

      await controller.searchCategories(
        'electronics',
        'en',
        10,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    /**
     * Should accept parentId filter for scoped search
     * Validates: parentId is forwarded to search service
     */
    it('should forward parentId filter to search service', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categorySearchService.searchCategories.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      } as any);

      await controller.searchCategories(
        'phones',
        'en',
        10,
        mockRequest,
        mockResponse,
        5,
      );

      expect(categorySearchService.searchCategories).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 5,
        }),
      );
    });
  });

  // ===========================================================================
  // GET ACTIVE CATEGORIES (GET /categories)
  // ===========================================================================

  /** @description Tests for the getActiveCategories endpoint */
  describe('getActiveCategories', () => {
    /**
     * Should return 200 with paginated active categories
     * Validates: Successful paginated response
     */
    it('should return 200 with paginated active categories', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      const paginatedResult = {
        data: [
          {
            id: 1,
            displayName: 'Electronics',
            displayDescription: 'Electronic devices',
            slug: 'electronics',
            iconUrl: 'icon.svg',
            bannerUrl: 'banner.jpg',
            themeColor: '#2196F3',
            url: '/categories/electronics',
            productCount: 150,
            isActive: true,
            hasChildren: true,
            parent: null,
            children: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      categorySearchService.searchCategories.mockResolvedValue(paginatedResult as any);

      await controller.getActiveCategories(
        1,
        20,
        'en',
        false,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            total: expect.any(Number),
          }),
        }),
      );
    });

    /**
     * Should set Cache-Control and Content-Language headers
     * Validates: Performance headers for public endpoint
     */
    it('should set performance headers on response', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categorySearchService.searchCategories.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      } as any);

      await controller.getActiveCategories(
        1,
        20,
        'ar',
        false,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'public, max-age=300',
          'Content-Language': 'ar',
        }),
      );
    });

    /**
     * Should return 400 for invalid parameters (BadRequestException)
     * Validates: Error response for bad input
     */
    it('should return 400 when search service throws BadRequestException', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categorySearchService.searchCategories.mockRejectedValue(
        new BadRequestException('Invalid filter'),
      );

      await controller.getActiveCategories(
        1,
        20,
        'en',
        false,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    /**
     * Should return 500 on unexpected server error
     * Validates: Graceful error handling
     */
    it('should return 500 on unexpected service error', async () => {
      const mockResponse = createMockResponse();
      const mockRequest = createMockRequest();

      categorySearchService.searchCategories.mockRejectedValue(
        new Error('Unexpected DB failure'),
      );

      await controller.getActiveCategories(
        1,
        20,
        'en',
        false,
        mockRequest,
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  // ===========================================================================
  // GET HOMEPAGE SECTIONS (GET /categories/homepage-sections)
  // ===========================================================================

  /** @description Tests for the getHomepageSections endpoint */
  describe('getHomepageSections', () => {
    /**
     * Should return 200 with homepage sections
     * Validates: Sections structure with parent, featured product, and children
     */
    it('should return 200 with homepage sections', async () => {
      const mockResponse = createMockResponse();

      const parentCategories = [
        createMockCategory({
          id: 1,
          nameEn: 'Consumer Electronics',
          nameAr: '\u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
          slug: 'consumer-electronics',
        }),
      ] as Category[];

      const childCategories = [
        createMockCategory({
          id: 10,
          nameEn: 'Smartphones',
          nameAr: '\u0647\u0648\u0627\u062A\u0641',
          slug: 'smartphones',
          productCount: 20,
        }),
      ] as Category[];

      const featuredProductResult = {
        data: [
          {
            id: 1,
            name_en: 'Marshall Speaker',
            slug: 'marshall-speaker',
            image_url: 'speaker.jpg',
            base_price: 625,
          },
        ],
      };

      // First call: parent categories
      categoriesService.find
        .mockResolvedValueOnce(parentCategories)
        .mockResolvedValueOnce(childCategories);
      publicProductsService.getFeaturedProducts.mockResolvedValue(featuredProductResult as any);

      await controller.getHomepageSections(3, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              section_id: 1,
              section_name_en: 'Consumer Electronics',
              section_slug: 'consumer-electronics',
              featured_product: expect.any(Object),
              child_categories: expect.any(Array),
            }),
          ]),
          meta: expect.objectContaining({
            total: 1,
          }),
        }),
      );
    });

    /**
     * Should return 500 when service fails
     * Validates: Error handling for homepage endpoint
     */
    it('should return 500 when service fails', async () => {
      const mockResponse = createMockResponse();

      categoriesService.find.mockRejectedValue(new Error('DB failure'));

      await controller.getHomepageSections(3, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve homepage sections',
        }),
      );
    });

    /**
     * Should return empty data when no parent categories exist
     * Validates: Graceful empty state
     */
    it('should return empty data when no parent categories exist', async () => {
      const mockResponse = createMockResponse();

      categoriesService.find.mockResolvedValue([]);

      await controller.getHomepageSections(3, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          meta: expect.objectContaining({ total: 0 }),
        }),
      );
    });
  });

  // ===========================================================================
  // SEARCH WITHIN CATEGORY (SS-CAT-006)
  // ===========================================================================

  /** @description Tests for the searchWithinCategory endpoint */
  describe('searchWithinCategory', () => {
    /**
     * Should return 200 with products for valid category
     * Validates: Response shape { success, data, meta }
     */
    it('should return 200 with products for valid category', async () => {
      const mockResponse = createMockResponse();
      const mockResult = {
        data: [
          {
            id: 1,
            nameEn: 'Damascus Steel Knife',
            nameAr: '\u0633\u0643\u064A\u0646 \u0645\u0646 \u0627\u0644\u0641\u0648\u0644\u0627\u0630 \u0627\u0644\u062F\u0645\u0634\u0642\u064A',
            slug: 'damascus-knife',
            mainImage: 'https://cdn.souqsyria.com/knife.jpg',
            basePrice: 15000,
            discountPrice: 12000,
            currency: 'SYP',
            approvalStatus: 'approved',
            isActive: true,
            isPublished: true,
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockResolvedValue(mockResult);

      await controller.searchProductsWithinCategory(1, { page: 1, limit: 20 }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          meta: expect.objectContaining({
            page: 1,
            limit: 20,
            total: 1,
          }),
        }),
      );
    });

    /**
     * Should accept search query parameter
     * Validates: Search param is passed to service
     */
    it('should accept search query parameter', async () => {
      const mockResponse = createMockResponse();
      const mockResult = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockResolvedValue(mockResult);

      await controller.searchProductsWithinCategory(1, { search: 'damascus', page: 1, limit: 20 }, mockResponse);

      expect(categoriesService.searchWithinCategory).toHaveBeenCalledWith(1, 'damascus', 1, 20);
    });

    /**
     * Should accept pagination parameters (page, limit)
     * Validates: Page and limit are passed to service
     */
    it('should accept pagination parameters (page, limit)', async () => {
      const mockResponse = createMockResponse();
      const mockResult = { data: [], meta: { page: 2, limit: 50, total: 100, totalPages: 2 } };

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockResolvedValue(mockResult);

      await controller.searchProductsWithinCategory(1, { page: 2, limit: 50 }, mockResponse);

      expect(categoriesService.searchWithinCategory).toHaveBeenCalledWith(1, undefined, 2, 50);
    });

    /**
     * Should return 404 for non-existent category
     * Validates: Service throws NotFoundException
     */
    it('should return 404 for non-existent category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockRejectedValue(new NotFoundException('Category not found'));

      await controller.searchProductsWithinCategory(99999, { page: 1, limit: 20 }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    /**
     * Should return empty data array when no products match search
     * Validates: Empty search results handled gracefully
     */
    it('should return empty data array when no products match search', async () => {
      const mockResponse = createMockResponse();
      const mockResult = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockResolvedValue(mockResult);

      await controller.searchProductsWithinCategory(1, { search: 'nonexistent', page: 1, limit: 20 }, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          meta: expect.objectContaining({
            total: 0,
          }),
        }),
      );
    });

    /**
     * Should return 400 for invalid category ID
     * Validates: Non-numeric ID rejected
     */
    it('should return 400 for invalid category ID', async () => {
      const mockResponse = createMockResponse();

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockRejectedValue(new BadRequestException('Invalid category ID'));

      await controller.searchProductsWithinCategory(NaN, { page: 1, limit: 20 }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bad Request',
        }),
      );
    });

    /**
     * Should set cache headers on response
     * Validates: Cache-Control header present
     */
    it('should set cache headers on response', async () => {
      const mockResponse = createMockResponse();
      const mockResult = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

      categoriesService.searchWithinCategory = jest
        .fn()
        .mockResolvedValue(mockResult);

      await controller.searchProductsWithinCategory(1, { page: 1, limit: 20 }, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'public, max-age=300',
        }),
      );
    });
  });

  // ===========================================================================
  // GET CATEGORY BY ID (GET /categories/:id) — SS-CAT-002
  // ===========================================================================

  /** @description Tests for the getCategoryById endpoint */
  describe('getCategoryById', () => {
    /** Mock CategoryResponseDto for public detail endpoint */
    const mockCategoryDto = {
      id: 5,
      nameEn: 'Electronics',
      nameAr: 'إلكترونيات',
      name: 'Electronics',
      slug: 'electronics',
      descriptionEn: 'Electronic devices',
      descriptionAr: 'أجهزة إلكترونية',
      description: 'Electronic devices',
      iconUrl: 'https://cdn.souqsyria.com/icons/electronics.svg',
      bannerUrl: 'https://cdn.souqsyria.com/banners/electronics.jpg',
      themeColor: '#2196F3',
      approvalStatus: 'approved',
      isActive: true,
      isFeatured: false,
      showInNav: true,
      depthLevel: 0,
      categoryPath: 'Electronics',
      sortOrder: 100,
      productCount: 150,
      viewCount: 2341,
      popularityScore: 87.5,
      createdAt: new Date(),
      updatedAt: new Date(),
      displayName: 'Electronics',
      displayDescription: 'Electronic devices',
      url: '/en/categories/electronics',
      isPublic: true,
      canBeEdited: false,
      isRootCategory: true,
      hasChildren: true,
      needsAdminAttention: false,
      breadcrumbs: [{ id: 5, name: 'Electronics', slug: 'electronics', url: '/en/categories/electronics', isActive: true, depthLevel: 0 }],
    };

    /**
     * Should return 200 with category detail
     * Validates: Successful response with correct data shape
     */
    it('should return 200 with category detail', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockResolvedValue(mockCategoryDto as any);

      await controller.getCategoryById(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 5,
            displayName: 'Electronics',
            slug: 'electronics',
          }),
        }),
      );
    });

    /**
     * Should return 404 for non-existent category
     * Validates: NotFoundException from service is handled
     */
    it('should return 404 for non-existent category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockRejectedValue(
        new NotFoundException('Category with ID 99999 not found'),
      );

      await controller.getCategoryById(99999, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Not Found',
        }),
      );
    });

    /**
     * Should return 404 for inactive category
     * Validates: Active filter is enforced
     */
    it('should return 404 for inactive category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockResolvedValue({
        ...mockCategoryDto,
        isActive: false,
      } as any);

      await controller.getCategoryById(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    /**
     * Should return 404 for unapproved category
     * Validates: Approval status filter is enforced
     */
    it('should return 404 for unapproved category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockResolvedValue({
        ...mockCategoryDto,
        approvalStatus: 'pending',
      } as any);

      await controller.getCategoryById(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    /**
     * Should return 400 for invalid category ID
     * Validates: NaN and negative IDs are rejected
     */
    it('should return 400 for invalid category ID', async () => {
      const mockResponse = createMockResponse();

      await controller.getCategoryById(NaN, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bad Request',
        }),
      );
    });

    /**
     * Should set cache headers (5 min)
     * Validates: Cache-Control header is set
     */
    it('should set cache headers on response', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockResolvedValue(mockCategoryDto as any);

      await controller.getCategoryById(5, 'en', mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'public, max-age=300',
        }),
      );
    });

    /**
     * Should pass language parameter to service
     * Validates: Language is forwarded correctly
     */
    it('should pass language parameter to service', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockResolvedValue(mockCategoryDto as any);

      await controller.getCategoryById(5, 'ar', mockResponse);

      expect(categoriesService.findById).toHaveBeenCalledWith(5, 'ar');
    });

    /**
     * Should return 500 on unexpected error
     * Validates: Graceful error handling
     */
    it('should return 500 on unexpected service error', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await controller.getCategoryById(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
        }),
      );
    });
  });

  // ===========================================================================
  // GET CATEGORY HIERARCHY (GET /categories/:id/hierarchy) — SS-CAT-003
  // ===========================================================================

  /** @description Tests for the getCategoryHierarchy endpoint */
  describe('getCategoryHierarchy', () => {
    /** Mock category entity for hierarchy tests */
    const mockCategoryEntity = createMockCategory({
      id: 5,
      nameEn: 'Smartphones',
      nameAr: 'هواتف ذكية',
      slug: 'smartphones',
      isActive: true,
      approvalStatus: 'approved' as const,
      depthLevel: 1,
    });

    /** Mock breadcrumbs */
    const mockBreadcrumbs = [
      { id: 1, name: 'Electronics', slug: 'electronics', url: '/en/categories/electronics', isActive: true, depthLevel: 0 },
      { id: 5, name: 'Smartphones', slug: 'smartphones', url: '/en/categories/smartphones', isActive: true, depthLevel: 1 },
    ];

    /** Mock children */
    const mockChildren = [
      createMockCategory({ id: 20, nameEn: 'iPhones', nameAr: 'آيفون', slug: 'iphones', productCount: 15 }),
      createMockCategory({ id: 21, nameEn: 'Android', nameAr: 'أندرويد', slug: 'android', productCount: 25 }),
    ] as Category[];

    /**
     * Should return 200 with breadcrumbs and children
     * Validates: Successful hierarchy response
     */
    it('should return 200 with breadcrumbs and children', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockResolvedValue(mockCategoryEntity as Category);
      categoryHierarchyService.generateBreadcrumbs.mockResolvedValue(mockBreadcrumbs as any);
      categoryHierarchyService.getCategoryChildren.mockResolvedValue(mockChildren);

      await controller.getCategoryHierarchy(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            breadcrumbs: expect.arrayContaining([
              expect.objectContaining({ id: 1, name: 'Electronics' }),
              expect.objectContaining({ id: 5, name: 'Smartphones' }),
            ]),
            children: expect.arrayContaining([
              expect.objectContaining({ id: 20, name: 'iPhones' }),
              expect.objectContaining({ id: 21, name: 'Android' }),
            ]),
            depthLevel: 1,
          }),
        }),
      );
    });

    /**
     * Should return 404 for non-existent category
     * Validates: NotFoundException from findOne is handled
     */
    it('should return 404 for non-existent category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockRejectedValue(
        new NotFoundException('Category with ID 99999 not found'),
      );

      await controller.getCategoryHierarchy(99999, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    /**
     * Should return 404 for inactive category
     * Validates: Active status is checked after fetch
     */
    it('should return 404 for inactive category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockResolvedValue(
        createMockCategory({ id: 5, isActive: false, approvalStatus: 'approved' as const }) as Category,
      );

      await controller.getCategoryHierarchy(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    /**
     * Should return empty children for leaf category
     * Validates: Leaf nodes return empty children array
     */
    it('should return empty children for leaf category', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockResolvedValue(mockCategoryEntity as Category);
      categoryHierarchyService.generateBreadcrumbs.mockResolvedValue(mockBreadcrumbs as any);
      categoryHierarchyService.getCategoryChildren.mockResolvedValue([]);

      await controller.getCategoryHierarchy(5, 'en', mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            children: [],
          }),
        }),
      );
    });

    /**
     * Should set 10-minute cache headers
     * Validates: Cache-Control header for hierarchy data
     */
    it('should set 10-minute cache headers', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockResolvedValue(mockCategoryEntity as Category);
      categoryHierarchyService.generateBreadcrumbs.mockResolvedValue(mockBreadcrumbs as any);
      categoryHierarchyService.getCategoryChildren.mockResolvedValue([]);

      await controller.getCategoryHierarchy(5, 'en', mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'public, max-age=600',
        }),
      );
    });

    /**
     * Should pass language to breadcrumb service
     * Validates: Language parameter forwarding
     */
    it('should pass language to breadcrumb service', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockResolvedValue(mockCategoryEntity as Category);
      categoryHierarchyService.generateBreadcrumbs.mockResolvedValue(mockBreadcrumbs as any);
      categoryHierarchyService.getCategoryChildren.mockResolvedValue([]);

      await controller.getCategoryHierarchy(5, 'ar', mockResponse);

      expect(categoryHierarchyService.generateBreadcrumbs).toHaveBeenCalledWith(
        expect.objectContaining({ id: 5 }),
        'ar',
      );
    });

    /**
     * Should return 500 on unexpected error
     * Validates: Graceful error handling
     */
    it('should return 500 on unexpected service error', async () => {
      const mockResponse = createMockResponse();

      categoriesService.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await controller.getCategoryHierarchy(5, 'en', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
        }),
      );
    });
  });
});
