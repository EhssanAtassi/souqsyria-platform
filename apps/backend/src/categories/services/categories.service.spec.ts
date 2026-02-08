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
  role: { id: 1, name: 'admin', permissions: ['category:create', 'category:update', 'category:delete'] },
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
     * Validates: Lower bound sanitization
     */
    it('should enforce minimum limit of 1', async () => {
      categoryRepository.find.mockResolvedValue([]);

      await service.getFeaturedCategories(0);

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

    it('should throw NotFoundException for non-existent category', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(99999)).rejects.toThrow(NotFoundException);
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
      const approvedCategory = createSyrianCategory({
        id: 1,
        approvalStatus: 'approved',
      });

      const updateDto = {
        nameEn: 'Electronics Updated',
        nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0645\u062D\u062F\u062B\u0629',
        slug: 'electronics',
      };

      categoryRepository.findOne.mockResolvedValue(approvedCategory as Category);

      await expect(service.update(1, updateDto as never, adminUser as User))
        .rejects.toThrow(BadRequestException);
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
});
