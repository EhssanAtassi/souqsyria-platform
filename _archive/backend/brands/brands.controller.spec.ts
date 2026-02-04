/**
 * STEP 5 FINAL: Controller Tests with Mocked Guards
 *
 * Replace your brands.controller.spec.ts with this working version
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FilterBrandDto } from './dto/filter-brand.dto';
import { User } from '../users/entities/user.entity';

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: BrandsService;

  // Mock user data
  const mockUser: User = {
    id: 1,
    email: 'admin@souqsyria.com',
    fullName: 'Admin User',
  } as any;

  // Mock brand data
  const mockBrand = {
    id: 1,
    name: 'Samsung',
    slug: 'samsung',
    isActive: true,
    approvalStatus: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    // ✅ Mock the guards to bypass dependency issues
    const mockJwtAuthGuard = {
      canActivate: jest.fn(() => true),
    };

    const mockPermissionsGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [
        {
          provide: BrandsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<BrandsController>(BrandsController);
    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Health', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have service injected', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    const createBrandDto: CreateBrandDto = {
      name: 'Test Brand',
      slug: 'test-brand',
      countryOfOrigin: 'Syria',
    };

    it('should create a brand successfully', async () => {
      // Arrange
      jest.spyOn(service, 'create').mockResolvedValue(mockBrand as any);

      // Act
      const result = await controller.create(createBrandDto, mockUser);

      // Assert
      expect(result).toEqual(mockBrand);
      expect(service.create).toHaveBeenCalledWith(createBrandDto, mockUser);
    });

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Service error');
      jest.spyOn(service, 'create').mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.create(createBrandDto, mockUser)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated brands list', async () => {
      // Arrange
      const mockResult = {
        data: [mockBrand],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      const filters: FilterBrandDto = { page: 1, limit: 20 };
      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(filters);
    });

    it('should handle empty filters', async () => {
      // Arrange
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.findAll({});

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a brand by ID', async () => {
      // Arrange
      const brandId = 1;
      const language = 'en';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBrand as any);

      // Act
      const result = await controller.findOne(brandId, language);

      // Assert
      expect(result).toEqual(mockBrand);
      expect(service.findOne).toHaveBeenCalledWith(
        brandId,
        language,
        true,
        false,
      );
    });

    it('should use default language when not specified', async () => {
      // Arrange
      const brandId = 1;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBrand as any);

      // Act
      await controller.findOne(brandId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(brandId, 'en', true, false);
    });

    it('should handle not found error', async () => {
      // Arrange
      const brandId = 999;
      const notFoundError = new Error('Brand not found');
      jest.spyOn(service, 'findOne').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.findOne(brandId)).rejects.toThrow(
        'Brand not found',
      );
    });
  });

  describe('update', () => {
    const updateBrandDto: UpdateBrandDto = {
      name: 'Updated Brand Name',
      isActive: false,
    };

    it('should update a brand successfully', async () => {
      // Arrange
      const brandId = 1;
      const updatedBrand = { ...mockBrand, ...updateBrandDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedBrand as any);

      // Act
      const result = await controller.update(brandId, updateBrandDto, mockUser);

      // Assert
      expect(result).toEqual(updatedBrand);
      expect(service.update).toHaveBeenCalledWith(
        brandId,
        updateBrandDto,
        mockUser,
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const brandId = 1;
      const validationError = new Error('Validation failed');
      jest.spyOn(service, 'update').mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        controller.update(brandId, updateBrandDto, mockUser),
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('remove', () => {
    it('should remove a brand successfully', async () => {
      // Arrange
      const brandId = 1;
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      // Act
      await controller.remove(brandId, mockUser);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(brandId);
    });

    it('should handle not found error when removing', async () => {
      // Arrange
      const brandId = 999;
      const notFoundError = new Error('Brand not found');
      jest.spyOn(service, 'remove').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.remove(brandId, mockUser)).rejects.toThrow(
        'Brand not found',
      );
    });
  });
});
