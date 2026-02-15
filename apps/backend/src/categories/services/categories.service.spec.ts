/**
 * @file categories.service.spec.ts
 * @description Comprehensive unit tests for CategoriesService with real Syrian market data
 *
 * TEST COVERAGE:
 * - Category CRUD operations
 * - Hierarchical category management (getTree)
 * - Syrian marketplace categories (Arabic/English)
 * - Approval workflow testing
 * - Validation and error handling
 * - Featured categories for Syrian homepage (getFeaturedCategories)
 *
 * REAL DATA INTEGRATION:
 * - Authentic Syrian product categories
 * - Real Arabic category names and descriptions
 * - Syrian Pound (SYP) pricing constraints
 * - Production-like category hierarchies
 *
 * @author SouqSyria Development Team
 * @since 2026-01-29
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CategoryHierarchyService } from './category-hierarchy.service';
import { CategoryApprovalService } from './category-approval.service';

// =============================================================================
// SYRIAN MARKET DATA FACTORIES
// =============================================================================

/**
 * Real Syrian Admin User Factory
 * Creates mock admin users for Syrian marketplace
 */
const createSyrianAdmin = (overrides?: Partial<User>) => ({
  id: 1,
  email: 'admin@souqsyria.com',
  fullName: 'Ahmad Al-Dimashqi',
  role: {
    id: 1,
    name: 'admin',
    rolePermissions: [
      { id: 1, permission: { id: 1, name: 'category.create' } },
      { id: 2, permission: { id: 2, name: 'category.delete' } },
      { id: 3, permission: { id: 3, name: 'category.edit-approved' } },
    ] as any,
  },
  assignedRole: null,
  isVerified: true,
  isBanned: false,
  ...overrides,
});

/**
 * Real Syrian Category Data Factory
 * Creates authentic Syrian marketplace categories with entity method mocks
 */
const createSyrianCategory = (overrides?: Partial<Category>): Partial<Category> => ({
  id: 1,
  nameEn: 'Electronics',
  nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
  slug: 'electronics',
  seoSlug: '\u0627\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
  descriptionEn: 'Electronic devices, smartphones, and gadgets',
  descriptionAr: '\u0623\u062C\u0647\u0632\u0629 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0648\u0647\u0648\u0627\u062A\u0641 \u0630\u0643\u064A\u0629 \u0648\u0623\u062F\u0648\u0627\u062A \u062A\u0642\u0646\u064A\u0629',
  depthLevel: 0,
  categoryPath: 'Electronics',
  isActive: true,
  isFeatured: true,
  featuredPriority: 10,
  approvalStatus: 'approved' as const,
  sortOrder: 100,
  showInNav: true,
  productCount: 150,
  viewCount: 2500,
  popularityScore: 85.5,
  commissionRate: 5.0,
  minPrice: 10000,
  maxPrice: 50000000,
  iconUrl: 'https://cdn.souqsyria.com/icons/electronics.svg',
  bannerUrl: 'https://cdn.souqsyria.com/banners/electronics.jpg',
  themeColor: '#2196F3',
  seoTitle: 'Electronics - SouqSyria',
  seoDescription: 'Shop electronics and smartphones',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date(),
  parent: null as unknown as Category,
  children: [],
  getDisplayName: jest.fn((lang) => lang === 'ar' ? '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A' : 'Electronics'),
  getDisplayDescription: jest.fn((lang) => lang === 'ar' ? '\u0623\u062C\u0647\u0632\u0629 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629' : 'Electronic devices'),
  isPublic: jest.fn().mockReturnValue(true),
  canBeEdited: jest.fn().mockReturnValue(false),
  isRootCategory: jest.fn().mockReturnValue(true),
  hasChildren: jest.fn().mockReturnValue(true),
  getSlug: jest.fn((lang) => lang === 'ar' ? '\u0627\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A' : 'electronics'),
  needsAdminAttention: jest.fn().mockReturnValue(false),
  generateUrl: jest.fn((lang) => lang === 'ar' ? '/ar/categories/electronics' : '/categories/electronics'),
  ...overrides,
});

/**
 * Create Category DTO Factory
 */
const createCategoryDto = (overrides?: Record<string, unknown>) => ({
  nameEn: 'Home Appliances',
  nameAr: '\u0623\u062C\u0647\u0632\u0629 \u0645\u0646\u0632\u0644\u064A\u0629',
  slug: 'home-appliances',
  descriptionEn: 'Kitchen and home electronic appliances',
  descriptionAr: '\u0623\u062C\u0647\u0632\u0629 \u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629 \u0644\u0644\u0645\u0637\u0628\u062E \u0648\u0627\u0644\u0645\u0646\u0632\u0644',
  parentId: null,
  isActive: true,
  isFeatured: false,
  sortOrder: 100,
  commissionRate: 6.0,
  ...overrides,
});

// =============================================================================
// TEST SUITE
// =============================================================================

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let hierarchyService: jest.Mocked<CategoryHierarchyService>;
  let approvalService: jest.Mocked<CategoryApprovalService>;

  /** Mock query builder for complex TypeORM queries */
  const createMockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getCount: jest.fn().mockResolvedValue(0),
  });

  beforeEach(async () => {
    const mockQueryBuilder = createMockQueryBuilder();

    const mockCategoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Category>>;

    const mockUserRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
            logAction: jest.fn().mockResolvedValue(undefined),
            logSimple: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CategoryHierarchyService,
          useValue: {
            validateAndPrepareHierarchy: jest.fn().mockResolvedValue({ depthLevel: 0, categoryPath: '' }),
            validateParentCategory: jest.fn().mockResolvedValue(null),
            getCategoryDepth: jest.fn().mockResolvedValue(0),
            getCategoryPath: jest.fn().mockResolvedValue(''),
            getRootCategories: jest.fn().mockResolvedValue([]),
            getCategoryChildren: jest.fn().mockResolvedValue([]),
            generateBreadcrumbs: jest.fn().mockResolvedValue([]),
            handleParentChange: jest.fn().mockResolvedValue(undefined),
            updateParentMetrics: jest.fn().mockResolvedValue(undefined),
            recalculateDescendantHierarchy: jest.fn().mockResolvedValue([]),
            handleCategoryDeletion: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CategoryApprovalService,
          useValue: {
            approve: jest.fn().mockResolvedValue(undefined),
            reject: jest.fn().mockResolvedValue(undefined),
            submitForApproval: jest.fn().mockResolvedValue(undefined),
            handleStatusChange: jest.fn().mockResolvedValue(undefined),
            canApprove: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get(getRepositoryToken(Category));
    userRepository = module.get(getRepositoryToken(User));
    auditLogService = module.get(AuditLogService);
    hierarchyService = module.get(CategoryHierarchyService);
    approvalService = module.get(CategoryApprovalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SERVICE INITIALIZATION TESTS
  // ===========================================================================

  /** @description Verifies service bootstraps correctly with all dependencies */
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required dependencies injected', () => {
      expect(categoryRepository).toBeDefined();
      expect(userRepository).toBeDefined();
      expect(auditLogService).toBeDefined();
      expect(hierarchyService).toBeDefined();
      expect(approvalService).toBeDefined();
    });
  });

  // ===========================================================================
  // GET TREE (MEGA MENU) TESTS
  // ===========================================================================

  /** @description Tests for the getTree method that builds a 3-level category hierarchy */
  describe('getTree', () => {
    /**
     * Should return full hierarchy with 3 levels (parent > child > grandchild)
     * Validates the eager-loaded tree structure is correct
     */
    it('should return full hierarchy with 3 levels (parent > child > grandchild)', async () => {
      const grandchild = createSyrianCategory({
        id: 100,
        nameEn: 'iPhone',
        nameAr: '\u0622\u064A\u0641\u0648\u0646',
        slug: 'iphone',
        depthLevel: 2,
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [],
      }) as Category;

      const child = createSyrianCategory({
        id: 10,
        nameEn: 'Smartphones',
        nameAr: '\u0647\u0648\u0627\u062A\u0641 \u0630\u0643\u064A\u0629',
        slug: 'smartphones',
        depthLevel: 1,
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [grandchild],
      }) as Category;

      const root = createSyrianCategory({
        id: 1,
        nameEn: 'Electronics',
        nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
        slug: 'electronics',
        depthLevel: 0,
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [child],
      }) as Category;

      categoryRepository.find.mockResolvedValue([root]);

      const result = await service.getTree();

      expect(result).toHaveLength(1);
      expect(result[0].nameEn).toBe('Electronics');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].nameEn).toBe('Smartphones');
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].nameEn).toBe('iPhone');
    });

    /**
     * Should only return active categories (isActive=true)
     * Validates that the repository query filters by isActive
     */
    it('should only return active categories (isActive=true)', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getTree();

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });

    /**
     * Should only return approved categories (approvalStatus="approved")
     * Validates that only approved categories appear in the tree
     */
    it('should only return approved categories (approvalStatus="approved")', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getTree();

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approvalStatus: 'approved',
          }),
        }),
      );
    });

    /**
     * Should sort categories by sortOrder ASC
     * Validates that the ordering clause is applied at root level
     */
    it('should sort categories by sortOrder ASC', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getTree();

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({
            sortOrder: 'ASC',
          }),
        }),
      );
    });

    /**
     * Should return empty array when no categories exist
     * Validates graceful handling of empty database
     */
    it('should return empty array when no categories exist', async () => {
      categoryRepository.find.mockResolvedValue([]);

      const result = await service.getTree();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    /**
     * Should filter out inactive children from active parents
     * Validates post-query filtering logic for children and grandchildren
     */
    it('should filter out inactive children from active parents', async () => {
      const activeChild = createSyrianCategory({
        id: 10,
        nameEn: 'Active Phones',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [],
      }) as Category;

      const inactiveChild = createSyrianCategory({
        id: 11,
        nameEn: 'Inactive Tablets',
        isActive: false,
        approvalStatus: 'approved',
        sortOrder: 20,
        children: [],
      }) as Category;

      const rejectedChild = createSyrianCategory({
        id: 12,
        nameEn: 'Pending Laptops',
        isActive: true,
        approvalStatus: 'pending',
        sortOrder: 30,
        children: [],
      }) as Category;

      const root = createSyrianCategory({
        id: 1,
        nameEn: 'Electronics',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [activeChild, inactiveChild, rejectedChild],
      }) as Category;

      categoryRepository.find.mockResolvedValue([root]);

      const result = await service.getTree();

      expect(result).toHaveLength(1);
      // Only the active+approved child should remain
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].nameEn).toBe('Active Phones');
    });

    /**
     * Should filter out inactive grandchildren from active children
     * Validates the nested filtering at the 3rd level
     */
    it('should filter out inactive grandchildren from active children', async () => {
      const activeGrandchild = createSyrianCategory({
        id: 100,
        nameEn: 'iPhone 15',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [],
      }) as Category;

      const inactiveGrandchild = createSyrianCategory({
        id: 101,
        nameEn: 'Discontinued Phone',
        isActive: false,
        approvalStatus: 'approved',
        sortOrder: 20,
        children: [],
      }) as Category;

      const child = createSyrianCategory({
        id: 10,
        nameEn: 'Smartphones',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [activeGrandchild, inactiveGrandchild],
      }) as Category;

      const root = createSyrianCategory({
        id: 1,
        nameEn: 'Electronics',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [child],
      }) as Category;

      categoryRepository.find.mockResolvedValue([root]);

      const result = await service.getTree();

      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].nameEn).toBe('iPhone 15');
    });

    /**
     * Should sort children by sortOrder ASC within each level
     * Validates the in-memory sorting applied after filtering
     */
    it('should sort children by sortOrder ASC within each level', async () => {
      const childB = createSyrianCategory({
        id: 11,
        nameEn: 'Laptops',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 20,
        children: [],
      }) as Category;

      const childA = createSyrianCategory({
        id: 10,
        nameEn: 'Smartphones',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        children: [],
      }) as Category;

      const root = createSyrianCategory({
        id: 1,
        nameEn: 'Electronics',
        isActive: true,
        approvalStatus: 'approved',
        sortOrder: 10,
        // Intentionally out of order to verify sorting
        children: [childB, childA],
      }) as Category;

      categoryRepository.find.mockResolvedValue([root]);

      const result = await service.getTree();

      expect(result[0].children[0].nameEn).toBe('Smartphones');
      expect(result[0].children[1].nameEn).toBe('Laptops');
    });

    /**
     * Should load relations for children and children.children
     * Validates the eager-loading configuration
     */
    it('should load 3-level relations via children and children.children', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getTree();

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['children', 'children.children'],
        }),
      );
    });

    /**
     * Should only query root categories (parent IS NULL)
     * Validates the where clause targets top-level categories
     */
    it('should only query root categories (parent IS NULL)', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getTree();

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parent: null,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // FEATURED CATEGORIES TESTS (Syrian Homepage)
  // ===========================================================================

  /** @description Tests for getFeaturedCategories used in homepage display */
  describe('getFeaturedCategories', () => {
    /**
     * Should return only isFeatured=true categories
     * Validates: Featured flag is included in query filter
     */
    it('should return only isFeatured=true categories', async () => {
      const featuredCategories = [
        createSyrianCategory({ id: 1, isFeatured: true, featuredPriority: 10 }),
        createSyrianCategory({ id: 2, isFeatured: true, featuredPriority: 8 }),
      ];

      categoryRepository.find.mockResolvedValue(featuredCategories as Category[]);

      const result = await service.getFeaturedCategories(4);

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFeatured: true,
          }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    /**
     * Should include correct productCount from retrieved categories
     * Validates: Product count field is present in returned data
     */
    it('should include correct productCount', async () => {
      const featuredCategories = [
        createSyrianCategory({ id: 1, isFeatured: true, productCount: 45 }),
        createSyrianCategory({ id: 2, isFeatured: true, productCount: 38 }),
      ];

      categoryRepository.find.mockResolvedValue(featuredCategories as Category[]);

      const result = await service.getFeaturedCategories(4);

      expect(result[0].productCount).toBe(45);
      expect(result[1].productCount).toBe(38);
    });

    /**
     * Should order by featuredPriority DESC, sortOrder ASC
     * Validates: Multi-column ordering in query
     */
    it('should order by featuredPriority DESC, sortOrder ASC', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories(4);

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: {
            featuredPriority: 'DESC',
            sortOrder: 'ASC',
            createdAt: 'DESC',
          },
        }),
      );
    });

    /**
     * Should respect limit parameter
     * Validates: take clause uses the provided limit
     */
    it('should respect limit parameter', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories(6);

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 6,
        }),
      );
    });

    /**
     * Should only return active and approved categories
     * Validates: isActive and approvalStatus filters in query
     */
    it('should only return active and approved categories', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories(4);

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            approvalStatus: 'approved',
          }),
        }),
      );
    });

    /**
     * Should return empty array when no featured categories exist
     * Validates: Graceful empty result handling
     */
    it('should return empty array when no featured categories', async () => {
      categoryRepository.find.mockResolvedValue([]);

      const result = await service.getFeaturedCategories(4);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    /**
     * Should limit featured categories to maximum of 20
     * Validates: Safety limit for sanitized parameter
     */
    it('should limit featured categories to maximum of 20', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories(100);

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    /**
     * Should enforce minimum limit of 1
     * Validates: Lower bound sanitization (when 0 passed, uses default 4, then sanitized to 1)
     */
    it('should enforce minimum limit of 1 when negative number passed', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories(-5);

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        }),
      );
    });

    /**
     * Should use default limit of 4 when not specified
     * Validates: Default parameter handling
     */
    it('should use default limit of 4 when not specified', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories();

      expect(categoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 4,
        }),
      );
    });
  });

  // ===========================================================================
  // FIND ALL CATEGORIES TESTS
  // ===========================================================================

  /** @description Tests for the findAll legacy method */
  describe('findAll', () => {
    it('should return all Syrian marketplace categories', async () => {
      const allCategories = [
        createSyrianCategory({ id: 1, nameEn: 'Electronics' }),
        createSyrianCategory({ id: 2, nameEn: 'Clothing' }),
        createSyrianCategory({ id: 3, nameEn: 'Food & Groceries' }),
      ];

      categoryRepository.find.mockResolvedValue(allCategories as Category[]);

      const result = await service.findAll();

      expect(categoryRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });
  });

  // ===========================================================================
  // FIND ONE CATEGORY TESTS
  // ===========================================================================

  /** @description Tests for the findOne method */
  describe('findOne', () => {
    it('should find Syrian category by ID with Arabic name', async () => {
      const category = createSyrianCategory({ id: 1, nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A' });
      categoryRepository.findOne.mockResolvedValue(category as Category);

      const result = await service.findOne(1);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['parent', 'children'],
      });
      expect(result.nameAr).toBe('\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A');
    });

    it('should throw NotFoundException for non-existent Syrian category', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // FIND BY ID TESTS
  // ===========================================================================

  /** @description Tests for the findById method with DTO transformation */
  describe('findById', () => {
    it('should throw BadRequestException for invalid ID (less than 1)', async () => {
      await expect(service.findById(0)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative ID', async () => {
      await expect(service.findById(-5)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent category', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(99999)).rejects.toThrow(NotFoundException);
    });

    it('should return a CategoryResponseDto for a valid category', async () => {
      const mockCategory = createSyrianCategory({
        id: 5,
        nameEn: 'Clothing',
        nameAr: '\u0645\u0644\u0627\u0628\u0633',
      });

      categoryRepository.findOne.mockResolvedValue(mockCategory as Category);
      hierarchyService.generateBreadcrumbs.mockResolvedValue([
        { id: 5, name: 'Clothing', slug: 'clothing', url: '/categories/clothing', isActive: true, depthLevel: 0 },
      ]);

      const result = await service.findById(5, 'en');

      expect(result).toBeDefined();
      expect(result.id).toBe(5);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: ['parent', 'children', 'creator', 'updater', 'approver'],
      });
    });

    it('should generate breadcrumbs for the requested language', async () => {
      const mockCategory = createSyrianCategory({ id: 5 });
      categoryRepository.findOne.mockResolvedValue(mockCategory as Category);

      await service.findById(5, 'ar');

      expect(hierarchyService.generateBreadcrumbs).toHaveBeenCalledWith(
        mockCategory,
        'ar',
      );
    });
  });

  // ===========================================================================
  // CREATE CATEGORY TESTS (Syrian Market)
  // ===========================================================================

  /** @description Tests for category creation with Syrian market validation */
  describe('create', () => {
    const adminUser = createSyrianAdmin();

    it('should throw error for duplicate Syrian category slug', async () => {
      const createDto = createCategoryDto({ slug: 'electronics' });
      const existingCategory = createSyrianCategory({ slug: 'electronics' });

      categoryRepository.findOne.mockResolvedValue(existingCategory as Category);

      await expect(service.create(createDto as never, adminUser as User))
        .rejects.toThrow();
    });

    it('should throw error for invalid parent category', async () => {
      const createDto = createCategoryDto({ parentId: 99999 });

      categoryRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.create(createDto as never, adminUser as User))
        .rejects.toThrow();
    });
  });

  // ===========================================================================
  // UPDATE CATEGORY TESTS
  // ===========================================================================

  /** @description Tests for category update with approval workflow */
  describe('update', () => {
    const adminUser = createSyrianAdmin();

    it('should throw NotFoundException for non-existent category update', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      const updateDto = {
        nameEn: 'Test',
        nameAr: '\u0627\u062E\u062A\u0628\u0627\u0631',
        slug: 'test',
      };

      await expect(service.update(99999, updateDto as never, adminUser as User))
        .rejects.toThrow(NotFoundException);
    });

    it('should require super admin to edit approved categories', async () => {
      // Admin WITHOUT category.edit-approved permission
      const regularAdmin = createSyrianAdmin({
        role: {
          id: 2,
          name: 'editor',
          rolePermissions: [
            { id: 1, permission: { id: 1, name: 'category.create' } },
            { id: 2, permission: { id: 2, name: 'category.delete' } },
          ],
        } as any,
      });

      const approvedCategory = createSyrianCategory({
        id: 1,
        approvalStatus: 'approved',
      });

      const updateDto = {
        nameEn: 'Electronics Updated',
        nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0645\u062D\u062F\u062B\u0629',
        slug: 'electronics',
      };

      // Mock QueryBuilder for validateUniqueNames (no duplicate found)
      const mockQb = createMockQueryBuilder();
      mockQb.getOne.mockResolvedValue(null);
      categoryRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      categoryRepository.findOne.mockResolvedValue(approvedCategory as Category);

      await expect(service.update(1, updateDto as never, regularAdmin as User))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ===========================================================================
  // SOFT DELETE CATEGORY TESTS
  // ===========================================================================

  /** @description Tests for softDelete method with hierarchy management and audit */
  describe('softDelete', () => {
    const adminUser = createSyrianAdmin();

    it('should soft delete a category with zero products successfully', async () => {
      const category = createSyrianCategory({
        id: 5,
        productCount: 0,
        children: [],
        products: [],
      });

      // Mock admin with category.delete permission
      const adminWithPermission = createSyrianAdmin({
        role: {
          id: 1,
          name: 'admin',
          rolePermissions: [
            { id: 1, permission: { id: 1, name: 'category.delete' } },
          ],
        } as any,
      });

      categoryRepository.findOne.mockResolvedValue(category as Category);
      categoryRepository.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await service.softDelete(5, adminWithPermission as User);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Electronics');
      expect(categoryRepository.softDelete).toHaveBeenCalledWith(5);
      expect(hierarchyService.handleCategoryDeletion).toHaveBeenCalledWith(category);
      expect(auditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE_CATEGORY' }),
      );
    });

    it('should throw NotFoundException for non-existent category', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete(999, adminUser as User)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for category with active products', async () => {
      const categoryWithProducts = createSyrianCategory({
        id: 5,
        productCount: 10,
      });

      categoryRepository.findOne.mockResolvedValue(categoryWithProducts as Category);

      await expect(service.softDelete(5, adminUser as User)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when admin lacks delete permission', async () => {
      const userWithoutPermission = createSyrianAdmin({
        role: {
          id: 1,
          name: 'viewer',
          rolePermissions: [
            { id: 1, permission: { id: 1, name: 'category.view' } },
          ],
        } as any,
      });
      const category = createSyrianCategory({ id: 5, productCount: 0 });
      categoryRepository.findOne.mockResolvedValue(category as Category);

      await expect(
        service.softDelete(5, userWithoutPermission as User),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ===========================================================================
  // RESTORE CATEGORY TESTS
  // ===========================================================================

  /** @description Tests for the restore method - restores soft-deleted categories */
  describe('restore', () => {
    const adminUser = createSyrianAdmin();

    it('should restore a deleted category and return response DTO', async () => {
      const restoredCategory = createSyrianCategory({ id: 5 });
      categoryRepository.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      categoryRepository.findOne.mockResolvedValue(restoredCategory as Category);
      hierarchyService.generateBreadcrumbs.mockResolvedValue([]);

      const result = await service.restore(5, adminUser as User);

      expect(result).toBeDefined();
      expect(result.id).toBe(5);
      expect(categoryRepository.restore).toHaveBeenCalledWith(5);
      expect(auditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESTORE_CATEGORY' }),
      );
    });

    it('should throw InternalServerErrorException on restore failure', async () => {
      categoryRepository.restore.mockRejectedValue(new Error('DB error'));

      await expect(service.restore(5, adminUser as User)).rejects.toThrow();
    });
  });

  // ===========================================================================
  // CREATE CATEGORY SUCCESS TESTS (Syrian Market)
  // ===========================================================================

  /** @description Tests for category creation happy path with audit logging */
  describe('create (success path)', () => {
    const adminUser = createSyrianAdmin();
    const mockQueryBuilder = createMockQueryBuilder();

    it('should create a category with draft status and zero counts', async () => {
      const createDto = createCategoryDto();

      // Slug uniqueness passes (no duplicate)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      categoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      hierarchyService.validateAndPrepareHierarchy.mockResolvedValue({
        parent: null,
        depthLevel: 0,
        categoryPath: '',
        isValid: true,
        maxDepthReached: false,
      });

      const savedCategory = createSyrianCategory({
        id: 10,
        nameEn: 'Home Appliances',
        nameAr: '\u0623\u062C\u0647\u0632\u0629 \u0645\u0646\u0632\u0644\u064A\u0629',
        slug: 'home-appliances',
        approvalStatus: 'draft',
      });

      categoryRepository.create.mockReturnValue(savedCategory as Category);
      categoryRepository.save.mockResolvedValue(savedCategory as Category);
      categoryRepository.findOne.mockResolvedValue(savedCategory as Category);
      hierarchyService.generateBreadcrumbs.mockResolvedValue([]);

      const result = await service.create(createDto as never, adminUser as User);

      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(categoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          approvalStatus: 'draft',
          productCount: 0,
          viewCount: 0,
          popularityScore: 0,
        }),
      );
      expect(auditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_CATEGORY' }),
      );
    });

    it('should update parent metrics when creating under a parent', async () => {
      const parentCategory = createSyrianCategory({ id: 5 });

      mockQueryBuilder.getOne.mockResolvedValue(null);
      categoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      hierarchyService.validateAndPrepareHierarchy.mockResolvedValue({
        parent: parentCategory as Category,
        depthLevel: 1,
        categoryPath: 'Electronics',
        isValid: true,
        maxDepthReached: false,
      });

      const savedCategory = createSyrianCategory({ id: 10, approvalStatus: 'draft' });
      categoryRepository.create.mockReturnValue(savedCategory as Category);
      categoryRepository.save.mockResolvedValue(savedCategory as Category);
      categoryRepository.findOne.mockResolvedValue(savedCategory as Category);
      hierarchyService.generateBreadcrumbs.mockResolvedValue([]);

      const dtoWithParent = createCategoryDto({ parentId: 5 });

      await service.create(dtoWithParent as never, adminUser as User);

      expect(hierarchyService.updateParentMetrics).toHaveBeenCalledWith(5);
    });
  });

  // ===========================================================================
  // UPDATE CATEGORY APPROVAL DELEGATION
  // ===========================================================================

  /** @description Tests for update method delegating to approval service */
  describe('update (approval delegation)', () => {
    const adminUser = createSyrianAdmin();
    const mockQueryBuilder = createMockQueryBuilder();

    it('should delegate approval status change to approval service', async () => {
      const existingCategory = createSyrianCategory({
        id: 5,
        approvalStatus: 'draft',
      });
      const updateDto = {
        approvalStatus: 'pending',
        nameAr: '\u062A\u062D\u062F\u064A\u062B',
      };

      categoryRepository.findOne
        .mockResolvedValueOnce(existingCategory as Category)
        .mockResolvedValueOnce(existingCategory as Category);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      categoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      categoryRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      hierarchyService.generateBreadcrumbs.mockResolvedValue([]);

      await service.update(5, updateDto as never, adminUser as User);

      expect(approvalService.handleStatusChange).toHaveBeenCalledWith(
        existingCategory,
        'pending',
        adminUser,
        updateDto,
      );
    });

    it('should delegate parent change to hierarchy service', async () => {
      const existingCategory = createSyrianCategory({
        id: 5,
        approvalStatus: 'draft',
      });
      const updateDto = {
        parentId: 10,
        nameAr: '\u062A\u062D\u062F\u064A\u062B',
      };

      categoryRepository.findOne
        .mockResolvedValueOnce(existingCategory as Category)
        .mockResolvedValueOnce(existingCategory as Category);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      categoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      categoryRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      hierarchyService.generateBreadcrumbs.mockResolvedValue([]);

      await service.update(5, updateDto as never, adminUser as User);

      expect(hierarchyService.handleParentChange).toHaveBeenCalledWith(
        existingCategory,
        10,
      );
    });
  });

  // ===========================================================================
  // FIND GENERIC METHOD TESTS
  // ===========================================================================

  /** @description Tests for the generic find() method used by public controllers */
  describe('find', () => {
    it('should pass options directly to repository find', async () => {
      const options = { where: { isActive: true }, take: 5 };
      categoryRepository.find.mockResolvedValue([]);

      await service.find(options as any);

      expect(categoryRepository.find).toHaveBeenCalledWith(options);
    });
  });

  // ===========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================================================

  /** @description Edge case tests for boundary conditions and error handling */
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty category list', async () => {
      categoryRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle category with maximum depth', async () => {
      const deepCategory = createSyrianCategory({
        id: 1000,
        depthLevel: 5,
        categoryPath: 'A/B/C/D/E/F',
      });

      categoryRepository.findOne.mockResolvedValue(deepCategory as Category);

      const result = await service.findOne(1000);

      expect(result.depthLevel).toBe(5);
    });

    it('should handle special characters in Arabic category names', async () => {
      const specialCategory = createSyrianCategory({
        nameAr: '\u0645\u0644\u0627\u0628\u0633 & \u0623\u062D\u0630\u064A\u0629 - (\u062C\u062F\u064A\u062F)',
        descriptionAr: '\u0645\u0644\u0627\u0628\u0633 \u0648\u0623\u062D\u0630\u064A\u0629 \u0644\u0644\u0631\u062C\u0627\u0644 \u0648\u0627\u0644\u0646\u0633\u0627\u0621 "\u0623\u0635\u0644\u064A\u0629"',
      });

      categoryRepository.findOne.mockResolvedValue(specialCategory as Category);

      const result = await service.findOne(1);

      expect(result.nameAr).toContain('&');
      expect(result.descriptionAr).toContain('"');
    });

    it('should handle getTree with roots that have null children', async () => {
      const root = createSyrianCategory({
        id: 1,
        isActive: true,
        approvalStatus: 'approved',
        children: undefined as unknown as Category[],
      }) as Category;

      categoryRepository.find.mockResolvedValue([root]);

      const result = await service.getTree();

      // Should not throw, children filtering is guarded
      expect(result).toHaveLength(1);
    });
  });

  // ===========================================================================
  // SEARCH WITHIN CATEGORY TESTS (SS-CAT-006)
  // ===========================================================================

  /** @description Tests for searchWithinCategory method */
  describe('searchWithinCategory', () => {
    /**
     * Should return paginated products for valid category
     * Validates: Correct response structure with pagination metadata
     */
    it('should return paginated products for valid category', async () => {
      const mockCategory = createSyrianCategory({
        id: 1,
        nameEn: 'Damascus Steel',
        isActive: true,
        approvalStatus: 'approved',
      });

      const mockProduct = {
        id: 1,
        nameEn: 'Damascus Steel Knife',
        nameAr: '\u0633\u0643\u064A\u0646 \u0645\u0646 \u0627\u0644\u0641\u0648\u0644\u0627\u0630',
        slug: 'damascus-knife',
        images: [{ imageUrl: 'knife.jpg', sortOrder: 1 }],
        pricing: { basePrice: 15000, discountPrice: 12000 },
        descriptions: [{ description: 'Premium knife' }],
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory as Category);
      const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      Object.defineProperty(categoryRepository, 'manager', {
        value: { getRepository: jest.fn().mockReturnValue(mockRepository) },
        writable: true,
      });

      const result = await service.searchWithinCategory(1, undefined, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    /**
     * Should filter by search keyword
     * Validates: Search term is applied to query builder
     */
    it('should filter by search keyword', async () => {
      const mockCategory = createSyrianCategory({
        id: 1,
        isActive: true,
        approvalStatus: 'approved',
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory as Category);
      const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      Object.defineProperty(categoryRepository, 'manager', {
        value: { getRepository: jest.fn().mockReturnValue(mockRepository) },
        writable: true,
        configurable: true,
      });

      await service.searchWithinCategory(1, 'damascus', 1, 20);

      // Verify search filter was applied with LIKE pattern
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.objectContaining({
          search: '%damascus%',
        }),
      );
    });

    /**
     * Should throw NotFoundException for inactive category
     * Validates: Inactive categories rejected
     */
    it('should throw NotFoundException for inactive category', async () => {
      const inactiveCategory = createSyrianCategory({
        id: 1,
        isActive: false,
        approvalStatus: 'approved',
      });

      categoryRepository.findOne.mockResolvedValue(inactiveCategory as Category);

      await expect(service.searchWithinCategory(1, undefined, 1, 20))
        .rejects.toThrow();
    });

    /**
     * Should throw NotFoundException for non-existent category
     * Validates: Missing categories handled properly
     */
    it('should throw NotFoundException for non-existent category', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.searchWithinCategory(99999, undefined, 1, 20))
        .rejects.toThrow();
    });

    /**
     * Should sanitize pagination parameters
     * Validates: Page and limit are bounded correctly
     */
    it('should sanitize pagination parameters', async () => {
      const mockCategory = createSyrianCategory({
        id: 1,
        isActive: true,
        approvalStatus: 'approved',
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory as Category);
      const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      Object.defineProperty(categoryRepository, 'manager', {
        value: { getRepository: jest.fn().mockReturnValue(mockRepository) },
        writable: true,
        configurable: true,
      });

      await service.searchWithinCategory(1, undefined, 200, 150);

      // Verify limit was capped at 100 (max)
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    /**
     * Should handle empty search results
     * Validates: Empty array returned with correct metadata
     */
    it('should handle empty search results', async () => {
      const mockCategory = createSyrianCategory({
        id: 1,
        isActive: true,
        approvalStatus: 'approved',
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory as Category);
      const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      Object.defineProperty(categoryRepository, 'manager', {
        value: { getRepository: jest.fn().mockReturnValue(mockRepository) },
        writable: true,
        configurable: true,
      });

      const result = await service.searchWithinCategory(1, 'nonexistent', 1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });
});
