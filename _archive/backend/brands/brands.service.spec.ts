/**
 * STEP 4 FIXED: Unit Tests for BrandsService with Complete Mocks
 *
 * Replace your brands.service.spec.ts with this fixed version
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../audit-log/service/audit-log.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

describe('BrandsService', () => {
  let service: BrandsService;
  let brandRepository: jest.Mocked<Repository<Brand>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  // ✅ FIXED: Complete mock User object
  const mockUser: User = {
    id: 1,
    email: 'admin@souqsyria.com',
    fullName: 'Admin User',
    firebaseUid: 'test-firebase-uid',
    phone: '+963123456789',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  // ✅ FIXED: Complete mock Brand object with all required methods
  const createMockBrand = (overrides: Partial<Brand> = {}): Brand => {
    const baseBrand = {
      id: 1,
      name: 'Samsung',
      slug: 'samsung',
      isActive: true,
      approvalStatus: 'draft' as const,
      verificationStatus: 'unverified' as const,
      isVerified: false,
      productCount: 0,
      popularityScore: 0,
      totalSalesSyp: 0,
      viewCount: 0,
      createdBy: 1,
      updatedBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),

      // ✅ Required entity methods
      getDisplayName: jest.fn((lang: 'en' | 'ar' = 'en') =>
        lang === 'ar' ? 'سامسونغ' : 'Samsung',
      ),
      getDisplayDescription: jest.fn((lang: 'en' | 'ar' = 'en') =>
        lang === 'ar' ? 'شركة تقنية رائدة' : 'Leading tech company',
      ),
      isPublic: jest.fn(() => false),
      canBeEdited: jest.fn(() => true),
      isSyrian: jest.fn(() => false),

      // Apply any overrides
      ...overrides,
    } as Brand;

    return baseBrand;
  };

  beforeEach(async () => {
    // Create mocks
    const mockBrandRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockAuditLogService = {
      logSimple: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getRepositoryToken(Brand),
          useValue: mockBrandRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    brandRepository = module.get(getRepositoryToken(Brand));
    userRepository = module.get(getRepositoryToken(User));
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBrandDto: CreateBrandDto = {
      name: 'Test Brand',
      slug: 'test-brand',
      countryOfOrigin: 'Syria',
    };

    it('should create a brand successfully', async () => {
      // Arrange
      const mockBrand = createMockBrand();
      brandRepository.findOne.mockResolvedValueOnce(null); // No existing slug
      brandRepository.findOne.mockResolvedValueOnce(null); // No existing name
      brandRepository.create.mockReturnValue(mockBrand);
      brandRepository.save.mockResolvedValue(mockBrand);
      auditLogService.logSimple.mockResolvedValue(undefined);

      // Act
      const result = await service.create(createBrandDto, mockUser);

      // Assert
      expect(result).toEqual(mockBrand);
      expect(brandRepository.findOne).toHaveBeenCalledTimes(2); // slug + name check
      expect(brandRepository.create).toHaveBeenCalled();
      expect(brandRepository.save).toHaveBeenCalled();
      expect(auditLogService.logSimple).toHaveBeenCalledWith({
        action: 'CREATE_BRAND',
        module: 'brands',
        actorId: mockUser.id,
        actorType: 'admin',
        entityType: 'brand',
        entityId: mockBrand.id,
        description: `Brand "${mockBrand.name}" created successfully`,
      });
    });

    it('should throw ConflictException if slug already exists', async () => {
      // Arrange
      const existingBrand = createMockBrand();
      brandRepository.findOne.mockResolvedValueOnce(existingBrand); // Existing slug found

      // Act & Assert
      await expect(service.create(createBrandDto, mockUser)).rejects.toThrow(
        new ConflictException(
          `Brand with slug '${createBrandDto.slug}' already exists`,
        ),
      );
      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { slug: createBrandDto.slug },
      });
    });

    it('should throw ConflictException if name already exists', async () => {
      // Arrange
      const existingBrand = createMockBrand();
      brandRepository.findOne.mockResolvedValueOnce(null); // No existing slug
      brandRepository.findOne.mockResolvedValueOnce(existingBrand); // Existing name found

      // Act & Assert
      await expect(service.create(createBrandDto, mockUser)).rejects.toThrow(
        new ConflictException(
          `Brand with name '${createBrandDto.name}' already exists`,
        ),
      );
    });
  });

  describe('findOneSimple', () => {
    it('should return a brand when found', async () => {
      // Arrange
      const mockBrand = createMockBrand();
      brandRepository.findOne.mockResolvedValue(mockBrand);

      // Act
      const result = await service.findOneSimple(1);

      // Assert
      expect(result).toEqual(mockBrand);
      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when brand not found', async () => {
      // Arrange
      brandRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneSimple(999)).rejects.toThrow(
        new NotFoundException('Brand with ID 999 not found'),
      );
    });
  });

  describe('remove', () => {
    it('should remove a brand successfully', async () => {
      // Arrange
      const mockBrand = createMockBrand();
      brandRepository.findOne.mockResolvedValue(mockBrand);
      brandRepository.remove.mockResolvedValue(mockBrand);

      // Act
      await service.remove(1);

      // Assert
      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(brandRepository.remove).toHaveBeenCalledWith(mockBrand);
    });

    it('should throw NotFoundException when trying to remove non-existent brand', async () => {
      // Arrange
      brandRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Brand with ID 999 not found'),
      );
    });
  });

  describe('Business Logic Validation', () => {
    it('should allow update for draft brands', async () => {
      // Arrange
      const draftBrand = createMockBrand({ approvalStatus: 'draft' });
      const updateDto: UpdateBrandDto = {
        descriptionEn: 'Updated description',
      };

      brandRepository.findOne.mockResolvedValue(draftBrand);
      brandRepository.update.mockResolvedValue({ affected: 1 } as any);
      brandRepository.findOne.mockResolvedValue(draftBrand); // For reload after update
      auditLogService.logSimple.mockResolvedValue(undefined);

      // Act & Assert - Should not throw
      const result = await service.update(1, updateDto, mockUser);
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for archived brands', async () => {
      // Arrange
      const archivedBrand = createMockBrand({ approvalStatus: 'archived' });
      const updateDto: UpdateBrandDto = { name: 'Updated Name' };

      brandRepository.findOne.mockResolvedValue(archivedBrand);

      // Act & Assert
      await expect(service.update(1, updateDto, mockUser)).rejects.toThrow(
        new BadRequestException('Cannot update archived brands'),
      );
    });

    it('should restrict core field updates for approved brands', async () => {
      // Arrange
      const approvedBrand = createMockBrand({ approvalStatus: 'approved' });
      const updateDto: UpdateBrandDto = { name: 'New Name' };

      brandRepository.findOne.mockResolvedValue(approvedBrand);

      // Act & Assert
      await expect(service.update(1, updateDto, mockUser)).rejects.toThrow(
        new BadRequestException(
          'Approved brands cannot have core fields (name, slug, trademark) modified',
        ),
      );
    });
  });

  describe('Service Health', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required dependencies injected', () => {
      expect(brandRepository).toBeDefined();
      expect(userRepository).toBeDefined();
      expect(auditLogService).toBeDefined();
    });

    it('should handle entity methods correctly', () => {
      const mockBrand = createMockBrand();

      expect(mockBrand.getDisplayName('en')).toBe('Samsung');
      expect(mockBrand.getDisplayName('ar')).toBe('سامسونغ');
      expect(mockBrand.isPublic()).toBe(false);
      expect(mockBrand.canBeEdited()).toBe(true);
      expect(mockBrand.isSyrian()).toBe(false);
    });
  });
});
