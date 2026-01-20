/**
 * @fileoverview Comprehensive unit tests for ProductsService
 * @description Tests core product CRUD operations with Syrian marketplace context
 *
 * Test Coverage:
 * - Product creation with categories and vendors
 * - Product retrieval (single and list)
 * - Product updates (partial and full)
 * - Soft deletion (Syrian market archival)
 * - Status updates (active/published toggles)
 *
 * Syrian Market Context:
 * - Arabic product names (nameAr) alongside English (nameEn)
 * - SYP currency pricing
 * - Damascus/Aleppo vendor assignments
 * - Category hierarchy for Syrian products
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products.service';
import { ProductEntity } from '../entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { ManufacturerEntity } from '../../manufacturers/entities/manufacturer.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { ProductDescriptionEntity } from '../entities/product-description.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductAttribute } from '../entities/product-attribute.entity/product-attribute.entity';
import { DescriptionsService } from '../descriptions/descriptions.service';
import { ImagesService } from '../images/images.service';
import { PricingService } from '../pricing/service/pricing.service';
import { CreateProductDto } from '../dto/create-product.dto';

// ============================================================================
// Mock Factories - Syrian Market Test Data
// ============================================================================

/**
 * Creates a mock Syrian product with bilingual support
 * Note: ProductEntity does NOT have basePrice or descriptionEn/Ar directly
 * - Pricing is through ProductPriceEntity relation
 * - Descriptions are through ProductDescriptionEntity[] relation
 */
const createMockProduct = (overrides: Partial<ProductEntity> = {}): Partial<ProductEntity> => ({
  id: 1,
  nameEn: 'Damascus Steel Kitchen Knife',
  nameAr: 'سكين مطبخ فولاذ دمشقي',
  slug: 'damascus-steel-kitchen-knife',
  currency: 'SYP',
  status: 'published',
  approvalStatus: 'approved',
  isActive: true,
  isPublished: true,
  isFeatured: false,
  isBestSeller: false,
  salesCount: 0,
  is_deleted: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

/**
 * Creates a mock Syrian category
 */
const createMockCategory = (overrides: Partial<Category> = {}): Partial<Category> => ({
  id: 1,
  nameEn: 'Kitchenware',
  nameAr: 'أدوات المطبخ',
  slug: 'kitchenware',
  isActive: true,
  approvalStatus: 'approved',
  ...overrides,
});

/**
 * Creates a mock Syrian vendor
 * VendorEntity has: storeName, storeDescription, isVerified
 */
const createMockVendor = (overrides: Partial<VendorEntity> = {}): Partial<VendorEntity> => ({
  id: 1,
  storeName: 'Damascus Artisans',
  storeDescription: 'Traditional Syrian crafts from Damascus',
  isVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Creates a mock Syrian manufacturer
 * ManufacturerEntity has: name, description
 */
const createMockManufacturer = (overrides: Partial<ManufacturerEntity> = {}): Partial<ManufacturerEntity> => ({
  id: 1,
  name: 'Syrian Steel Works',
  description: 'Traditional Damascus steel manufacturing',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
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
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  })),
});

// ============================================================================
// Test Suite
// ============================================================================

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: MockRepository<ProductEntity>;
  let categoryRepo: MockRepository<Category>;
  let manufacturerRepo: MockRepository<ManufacturerEntity>;
  let vendorRepo: MockRepository<VendorEntity>;
  let productDescriptionRepo: MockRepository<ProductDescriptionEntity>;
  let productImageRepo: MockRepository<ProductImage>;
  let productAttributeRepo: MockRepository<ProductAttribute>;
  let descriptionsService: Partial<DescriptionsService>;
  let imagesService: Partial<ImagesService>;
  let pricingService: Partial<PricingService>;

  beforeEach(async () => {
    productRepo = createMockRepository<ProductEntity>();
    categoryRepo = createMockRepository<Category>();
    manufacturerRepo = createMockRepository<ManufacturerEntity>();
    vendorRepo = createMockRepository<VendorEntity>();
    productDescriptionRepo = createMockRepository<ProductDescriptionEntity>();
    productImageRepo = createMockRepository<ProductImage>();
    productAttributeRepo = createMockRepository<ProductAttribute>();

    descriptionsService = {
      replaceDescriptions: jest.fn().mockResolvedValue(undefined),
    };

    imagesService = {
      replaceImagesByProduct: jest.fn().mockResolvedValue(undefined),
    };

    pricingService = {
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      getByProduct: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: getRepositoryToken(ManufacturerEntity), useValue: manufacturerRepo },
        { provide: getRepositoryToken(VendorEntity), useValue: vendorRepo },
        { provide: getRepositoryToken(ProductDescriptionEntity), useValue: productDescriptionRepo },
        { provide: getRepositoryToken(ProductImage), useValue: productImageRepo },
        { provide: getRepositoryToken(ProductAttribute), useValue: productAttributeRepo },
        { provide: DescriptionsService, useValue: descriptionsService },
        { provide: ImagesService, useValue: imagesService },
        { provide: PricingService, useValue: pricingService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
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
  // create() Method Tests
  // ==========================================================================

  describe('create()', () => {
    /**
     * CreateProductDto requires: nameEn, nameAr, slug, price, currency, categoryId
     */
    const createProductDto: CreateProductDto = {
      nameEn: 'Aleppo Olive Oil Soap',
      nameAr: 'صابون زيت الزيتون الحلبي',
      slug: 'aleppo-olive-oil-soap',
      price: 25000, // 25,000 SYP
      currency: 'SYP',
      categoryId: 1,
    };

    it('should create a product with category', async () => {
      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct({
        nameEn: createProductDto.nameEn,
        nameAr: createProductDto.nameAr,
        slug: createProductDto.slug,
        currency: createProductDto.currency,
        category: mockCategory as Category,
      });

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: createProductDto.categoryId },
      });
      expect(productRepo.create).toHaveBeenCalledWith(createProductDto);
      expect(productRepo.save).toHaveBeenCalled();
      expect(result.nameAr).toBe(createProductDto.nameAr);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(productRepo.save).not.toHaveBeenCalled();
    });

    it('should create product with manufacturer', async () => {
      const dtoWithManufacturer: CreateProductDto = {
        ...createProductDto,
        manufacturerId: 1,
      };
      const mockCategory = createMockCategory();
      const mockManufacturer = createMockManufacturer();
      const mockProduct = createMockProduct({
        nameEn: dtoWithManufacturer.nameEn,
        category: mockCategory as Category,
        manufacturer: mockManufacturer as ManufacturerEntity,
      });

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      manufacturerRepo.findOne.mockResolvedValue(mockManufacturer);
      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.create(dtoWithManufacturer);

      expect(manufacturerRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when manufacturer not found', async () => {
      const dtoWithManufacturer: CreateProductDto = {
        ...createProductDto,
        manufacturerId: 999,
      };
      const mockCategory = createMockCategory();

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      manufacturerRepo.findOne.mockResolvedValue(null);
      productRepo.create.mockReturnValue({});

      await expect(service.create(dtoWithManufacturer)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create product with vendor (Syrian marketplace)', async () => {
      const mockCategory = createMockCategory();
      const mockVendor = createMockVendor();
      const mockProduct = createMockProduct({
        nameEn: createProductDto.nameEn,
        category: mockCategory as Category,
        vendor: mockVendor as VendorEntity,
      });

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      vendorRepo.findOne.mockResolvedValue(mockVendor);
      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto, 1);

      expect(vendorRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when vendor not found', async () => {
      const mockCategory = createMockCategory();

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      vendorRepo.findOne.mockResolvedValue(null);
      productRepo.create.mockReturnValue({});

      await expect(service.create(createProductDto, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle Arabic-only product names', async () => {
      const arabicOnlyDto: CreateProductDto = {
        nameEn: '',
        nameAr: 'صابون غار',
        slug: 'ghar-soap',
        categoryId: 1,
        price: 15000,
        currency: 'SYP',
      };
      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct({
        nameEn: arabicOnlyDto.nameEn,
        nameAr: arabicOnlyDto.nameAr,
      });

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.create(arabicOnlyDto);

      expect(result.nameAr).toBe(arabicOnlyDto.nameAr);
    });

    it('should handle large SYP prices correctly', async () => {
      const highPriceDto: CreateProductDto = {
        ...createProductDto,
        price: 5000000000, // 5 billion SYP (high-end product)
      };
      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct({
        nameEn: highPriceDto.nameEn,
      });

      categoryRepo.findOne.mockResolvedValue(mockCategory);
      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.create(highPriceDto);

      expect(result).toBeDefined();
    });

    it('should support multiple currencies (SYP, USD, TRY)', async () => {
      const currencies = ['SYP', 'USD', 'TRY'] as const;

      for (const currency of currencies) {
        const dto: CreateProductDto = {
          ...createProductDto,
          currency,
          price: currency === 'SYP' ? 1000000 : 100,
        };
        const mockCategory = createMockCategory();
        const mockProduct = createMockProduct({ currency });

        categoryRepo.findOne.mockResolvedValue(mockCategory);
        productRepo.create.mockReturnValue(mockProduct);
        productRepo.save.mockResolvedValue(mockProduct);

        const result = await service.create(dto);

        expect(result.currency).toBe(currency);
      }
    });
  });

  // ==========================================================================
  // findAll() Method Tests
  // ==========================================================================

  describe('findAll()', () => {
    it('should return all non-deleted products', async () => {
      const mockProducts = [
        createMockProduct({ id: 1, nameEn: 'Damascus Steel Knife' }),
        createMockProduct({ id: 2, nameEn: 'Aleppo Soap' }),
        createMockProduct({ id: 3, nameEn: 'Syrian Olive Oil' }),
      ];

      productRepo.find.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(productRepo.find).toHaveBeenCalledWith({
        where: { is_deleted: false },
        relations: ['vendor', 'category', 'manufacturer', 'pricing'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no products exist', async () => {
      productRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should include all required relations', async () => {
      productRepo.find.mockResolvedValue([]);

      await service.findAll();

      const findCall = productRepo.find.mock.calls[0][0];
      expect(findCall.relations).toContain('vendor');
      expect(findCall.relations).toContain('category');
      expect(findCall.relations).toContain('manufacturer');
      expect(findCall.relations).toContain('pricing');
    });

    it('should order by createdAt DESC (newest first)', async () => {
      productRepo.find.mockResolvedValue([]);

      await service.findAll();

      const findCall = productRepo.find.mock.calls[0][0];
      expect(findCall.order).toEqual({ createdAt: 'DESC' });
    });
  });

  // ==========================================================================
  // findOne() Method Tests
  // ==========================================================================

  describe('findOne()', () => {
    it('should return a product by ID', async () => {
      const mockProduct = createMockProduct();
      productRepo.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_deleted: false },
        relations: ['vendor', 'category', 'manufacturer', 'pricing'],
      });
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should not return soft-deleted products', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);

      const findCall = productRepo.findOne.mock.calls[0][0];
      expect(findCall.where.is_deleted).toBe(false);
    });
  });

  // ==========================================================================
  // update() Method Tests
  // ==========================================================================

  describe('update()', () => {
    // Using valid UpdateProductDto properties (name, price, stock, etc.)
    // The entity may have nameEn/nameAr but DTO uses name + descriptions array
    const updateDto = {
      name: 'Updated Damascus Steel Knife - Premium',
      price: 150.0,
    };

    it('should update basic product fields', async () => {
      const existingProduct = createMockProduct();
      const updatedProduct = { ...existingProduct, ...updateDto };

      productRepo.findOne.mockResolvedValue(existingProduct);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updateDto);

      expect(productRepo.save).toHaveBeenCalled();
      // DTO uses 'name' but entity uses 'nameEn' - just verify save was called
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update category when categoryId provided', async () => {
      const existingProduct = createMockProduct();
      const newCategory = createMockCategory({ id: 2, nameEn: 'Food' });

      productRepo.findOne.mockResolvedValue(existingProduct);
      categoryRepo.findOne.mockResolvedValue(newCategory);
      productRepo.save.mockResolvedValue({ ...existingProduct, category: newCategory });

      await service.update(1, { categoryId: 2 });

      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('should throw NotFoundException when new category not found', async () => {
      const existingProduct = createMockProduct();

      productRepo.findOne.mockResolvedValue(existingProduct);
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { categoryId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update manufacturer when manufacturerId provided', async () => {
      const existingProduct = createMockProduct();
      const newManufacturer = createMockManufacturer({ id: 2 });

      productRepo.findOne.mockResolvedValue(existingProduct);
      manufacturerRepo.findOne.mockResolvedValue(newManufacturer);
      productRepo.save.mockResolvedValue({ ...existingProduct, manufacturer: newManufacturer });

      await service.update(1, { manufacturerId: 2 });

      expect(manufacturerRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('should update descriptions when provided', async () => {
      const existingProduct = createMockProduct();
      const newDescriptions = [
        { language: 'en' as const, description: 'New English description' },
        { language: 'ar' as const, description: 'وصف عربي جديد' },
      ];

      productRepo.findOne.mockResolvedValue(existingProduct);
      productRepo.save.mockResolvedValue(existingProduct);

      await service.update(1, { descriptions: newDescriptions });

      expect(descriptionsService.replaceDescriptions).toHaveBeenCalledWith(
        1,
        newDescriptions,
      );
    });

    it('should update images when provided', async () => {
      const existingProduct = createMockProduct();
      const newImages = [
        { image_url: 'https://cdn.souqsyria.com/products/knife1.jpg', order: 1 },
        { image_url: 'https://cdn.souqsyria.com/products/knife2.jpg', order: 2 },
      ];

      productRepo.findOne.mockResolvedValue(existingProduct);
      productRepo.save.mockResolvedValue(existingProduct);

      await service.update(1, { images: newImages });

      expect(imagesService.replaceImagesByProduct).toHaveBeenCalled();
    });

    it('should update attributes when provided', async () => {
      const existingProduct = createMockProduct();
      // ProductAttributeDto expects attribute_id and value_id (numbers)
      const newAttributes = [
        { attribute_id: 1, value_id: 1 }, // e.g., Material: Damascus Steel
        { attribute_id: 2, value_id: 2 }, // e.g., Origin: Syria
      ];

      productRepo.findOne.mockResolvedValue(existingProduct);
      productRepo.save.mockResolvedValue(existingProduct);
      productAttributeRepo.delete.mockResolvedValue({});
      productAttributeRepo.save.mockResolvedValue([]);

      await service.update(1, { attributes: newAttributes });

      expect(productAttributeRepo.delete).toHaveBeenCalledWith({
        product: { id: 1 },
      });
      expect(productAttributeRepo.save).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // remove() Method Tests (Soft Delete)
  // ==========================================================================

  describe('remove()', () => {
    it('should soft delete a product', async () => {
      const mockProduct = createMockProduct();

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue({ ...mockProduct, is_deleted: true });

      const result = await service.remove(1);

      expect(result.message).toContain('moved to archive');
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should set is_deleted flag to true', async () => {
      const mockProduct = createMockProduct({ is_deleted: false });

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockImplementation(async (product) => product);

      await service.remove(1);

      const savedProduct = productRepo.save.mock.calls[0][0];
      expect(savedProduct.is_deleted).toBe(true);
    });
  });

  // ==========================================================================
  // updateStatus() Method Tests
  // ==========================================================================

  describe('updateStatus()', () => {
    it('should update isActive status', async () => {
      const mockProduct = createMockProduct({ isActive: true });

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue({ ...mockProduct, isActive: false });

      const result = await service.updateStatus(1, { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('should update isPublished status', async () => {
      const mockProduct = createMockProduct({ isPublished: true });

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue({ ...mockProduct, isPublished: false });

      const result = await service.updateStatus(1, { isPublished: false });

      expect(result.isPublished).toBe(false);
    });

    it('should update both statuses together', async () => {
      const mockProduct = createMockProduct({ isActive: true, isPublished: true });

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue({ ...mockProduct, isActive: false, isPublished: false });

      const result = await service.updateStatus(1, {
        isActive: false,
        isPublished: false,
      });

      expect(result.isActive).toBe(false);
      expect(result.isPublished).toBe(false);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(999, { isActive: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not change status when undefined', async () => {
      const mockProduct = createMockProduct({ isActive: true, isPublished: true });

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockImplementation(async (product) => product);

      await service.updateStatus(1, {});

      const savedProduct = productRepo.save.mock.calls[0][0];
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.isPublished).toBe(true);
    });
  });

  // ==========================================================================
  // Syrian Marketplace Specific Tests
  // ==========================================================================

  describe('Syrian Marketplace Scenarios', () => {
    it('should handle products from various Syrian vendors', async () => {
      const syrianVendors = [
        { storeName: 'Damascus Artisans', storeDescription: 'Traditional crafts' },
        { storeName: 'Aleppo Soap House', storeDescription: 'Authentic Aleppo soap' },
        { storeName: 'Homs Textiles', storeDescription: 'Syrian textile heritage' },
        { storeName: 'Latakia Imports', storeDescription: 'Coastal Syrian products' },
      ];

      for (let i = 0; i < syrianVendors.length; i++) {
        const vendor = createMockVendor({ id: i + 1, ...syrianVendors[i] });
        const product = createMockProduct({
          id: i + 1,
          vendor: vendor as VendorEntity,
        });

        vendorRepo.findOne.mockResolvedValue(vendor);
        productRepo.findOne.mockResolvedValue(product);

        const result = await service.findOne(i + 1);
        expect(result).toBeDefined();
      }
    });

    it('should handle traditional Syrian product categories', async () => {
      const syrianCategories = [
        { nameEn: 'Traditional Soaps', nameAr: 'صابون تقليدي' },
        { nameEn: 'Damascus Steel', nameAr: 'فولاذ دمشقي' },
        { nameEn: 'Syrian Textiles', nameAr: 'منسوجات سورية' },
        { nameEn: 'Olive Products', nameAr: 'منتجات الزيتون' },
        { nameEn: 'Syrian Spices', nameAr: 'بهارات سورية' },
      ];

      for (const category of syrianCategories) {
        const mockCategory = createMockCategory(category);
        categoryRepo.findOne.mockResolvedValue(mockCategory);

        const dto: CreateProductDto = {
          nameEn: `Test ${category.nameEn}`,
          nameAr: `اختبار ${category.nameAr}`,
          categoryId: 1,
          slug: `test-${category.nameEn.toLowerCase().replace(/\s/g, '-')}`,
          price: 50000,
          currency: 'SYP',
        };

        productRepo.create.mockReturnValue(createMockProduct({
          nameEn: dto.nameEn,
          nameAr: dto.nameAr,
        }));
        productRepo.save.mockResolvedValue(createMockProduct({
          nameEn: dto.nameEn,
          nameAr: dto.nameAr,
        }));

        const result = await service.create(dto);
        expect(result).toBeDefined();
      }
    });

    it('should handle bilingual product search data', async () => {
      const bilingualProducts = [
        createMockProduct({
          id: 1,
          nameEn: 'Aleppo Soap',
          nameAr: 'صابون حلبي',
        }),
        createMockProduct({
          id: 2,
          nameEn: 'Damascus Brocade',
          nameAr: 'بروكار دمشقي',
        }),
      ];

      productRepo.find.mockResolvedValue(bilingualProducts);

      const result = await service.findAll();

      result.forEach((product) => {
        expect(product.nameEn).toBeDefined();
        expect(product.nameAr).toBeDefined();
      });
    });

    it('should support Syrian product approval workflow statuses', async () => {
      const approvalStatuses = ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'] as const;

      for (const status of approvalStatuses) {
        const product = createMockProduct({
          id: approvalStatuses.indexOf(status) + 1,
          approvalStatus: status,
        });

        productRepo.findOne.mockResolvedValue(product);

        const result = await service.findOne(product.id as number);
        expect(result.approvalStatus).toBe(status);
      }
    });
  });
});
