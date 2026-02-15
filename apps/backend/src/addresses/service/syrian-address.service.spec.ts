/**
 * @file syrian-address.service.spec.ts
 * @description Unit tests for SyrianAddressService
 *
 * Tests cover:
 * - getAllGovernorates - Returns all active governorates
 * - getCitiesByGovernorate - Returns cities for a governorate
 * - getDistrictsByCity - Returns districts for a city
 * - validateAddress - Validates Syrian address structure
 * - getDeliveryZoneInfo - Returns delivery zone information
 * - searchAddresses - Searches addresses by text (Arabic/English)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyrianAddressService } from './syrian-address.service';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
  SyrianAddressEntity,
  AddressStatus,
  PropertyType,
  VerificationMethod,
} from '../entities';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SyrianAddressService', () => {
  let service: SyrianAddressService;
  let governorateRepo: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let cityRepo: jest.Mocked<Repository<SyrianCityEntity>>;
  let districtRepo: jest.Mocked<Repository<SyrianDistrictEntity>>;
  let addressRepo: jest.Mocked<Repository<SyrianAddressEntity>>;

  const mockGovernorate = {
    id: 1,
    code: 'DIM',
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    isActive: true,
    status: {
      accessibilityLevel: 'full',
      deliverySupported: true,
    },
  } as unknown as SyrianGovernorateEntity;

  const mockCity = {
    id: 1,
    nameEn: 'Old Damascus',
    nameAr: 'دمشق القديمة',
    governorate: mockGovernorate,
    isActive: true,
    logistics: {
      deliverySupported: true,
      averageDeliveryTime: 2,
      lastMileOptions: ['standard', 'express'],
    },
  } as unknown as SyrianCityEntity;

  const mockDistrict = {
    id: 1,
    nameEn: 'Al-Mezzeh',
    nameAr: 'المزة',
    city: mockCity,
    isActive: true,
  } as unknown as SyrianDistrictEntity;

  beforeEach(async () => {
    // Create mock repositories
    const mockGovernorateRepo = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCityRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDistrictRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockAddressRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyrianAddressService,
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useValue: mockGovernorateRepo,
        },
        {
          provide: getRepositoryToken(SyrianCityEntity),
          useValue: mockCityRepo,
        },
        {
          provide: getRepositoryToken(SyrianDistrictEntity),
          useValue: mockDistrictRepo,
        },
        {
          provide: getRepositoryToken(SyrianAddressEntity),
          useValue: mockAddressRepo,
        },
      ],
    }).compile();

    service = module.get<SyrianAddressService>(SyrianAddressService);
    governorateRepo = module.get(getRepositoryToken(SyrianGovernorateEntity));
    cityRepo = module.get(getRepositoryToken(SyrianCityEntity));
    districtRepo = module.get(getRepositoryToken(SyrianDistrictEntity));
    addressRepo = module.get(getRepositoryToken(SyrianAddressEntity));

    // Mock count to prevent initialization
    governorateRepo.count.mockResolvedValue(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGovernorates', () => {
    it('should return all active governorates ordered by displayOrder', async () => {
      // Arrange
      const governorates = [mockGovernorate];
      governorateRepo.find.mockResolvedValue(governorates);

      // Act
      const result = await service.getAllGovernorates();

      // Assert
      expect(result).toEqual(governorates);
      expect(governorateRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { displayOrder: 'ASC' },
      });
    });

    it('should return empty array if no governorates exist', async () => {
      // Arrange
      governorateRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.getAllGovernorates();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getCitiesByGovernorate', () => {
    it('should return cities for a governorate', async () => {
      // Arrange
      const governorateId = 1;
      const cities = [mockCity];
      cityRepo.find.mockResolvedValue(cities);

      // Act
      const result = await service.getCitiesByGovernorate(governorateId);

      // Assert
      expect(result).toEqual(cities);
      expect(cityRepo.find).toHaveBeenCalledWith({
        where: {
          governorate: { id: governorateId },
          isActive: true,
        },
        order: { displayOrder: 'ASC' },
        relations: ['governorate'],
      });
    });

    it('should return empty array if no cities exist for governorate', async () => {
      // Arrange
      cityRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.getCitiesByGovernorate(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getDistrictsByCity', () => {
    it('should return districts for a city', async () => {
      // Arrange
      const cityId = 1;
      const districts = [mockDistrict];
      districtRepo.find.mockResolvedValue(districts);

      // Act
      const result = await service.getDistrictsByCity(cityId);

      // Assert
      expect(result).toEqual(districts);
      expect(districtRepo.find).toHaveBeenCalledWith({
        where: {
          city: { id: cityId },
          isActive: true,
        },
        order: { displayOrder: 'ASC' },
        relations: ['city', 'city.governorate'],
      });
    });

    it('should return empty array if no districts exist for city', async () => {
      // Arrange
      districtRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.getDistrictsByCity(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('validateAddress', () => {
    it('should validate address with valid governorate and city', async () => {
      // Arrange
      const addressData = {
        governorate: { id: 1 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
      };

      governorateRepo.findOne.mockResolvedValue(mockGovernorate);
      cityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await service.validateAddress(addressData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.issues).toBeUndefined();
    });

    it('should fail validation with invalid governorate', async () => {
      // Arrange
      const addressData = {
        governorate: { id: 999 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
      };

      governorateRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateAddress(addressData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(100);
      expect(result.issues).toContain('Invalid governorate');
    });

    it('should fail validation with governorate that does not support delivery', async () => {
      // Arrange
      const noDeliveryGov = {
        ...mockGovernorate,
        status: {
          accessibilityLevel: 'full' as const,
          deliverySupported: false,
          lastUpdated: new Date(),
        },
      };

      const addressData = {
        governorate: { id: 1 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
      };

      governorateRepo.findOne.mockResolvedValue(noDeliveryGov);
      cityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await service.validateAddress(addressData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Delivery not supported in this governorate');
    });

    it('should fail validation with invalid city', async () => {
      // Arrange
      const addressData = {
        governorate: { id: 1 } as SyrianGovernorateEntity,
        city: { id: 999 } as SyrianCityEntity,
      };

      governorateRepo.findOne.mockResolvedValue(mockGovernorate);
      cityRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateAddress(addressData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid city');
    });

    it('should fail validation with coordinates outside Syria', async () => {
      // Arrange
      const addressData = {
        governorate: { id: 1 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
        latitude: 50.0, // Outside Syria
        longitude: 50.0, // Outside Syria
      };

      governorateRepo.findOne.mockResolvedValue(mockGovernorate);
      cityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await service.validateAddress(addressData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Coordinates outside Syrian territory');
    });

    it('should fail validation with invalid postal code format', async () => {
      // Arrange
      const addressData = {
        governorate: { id: 1 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
        postalCode: '123', // Invalid format (should be 5 digits)
      };

      governorateRepo.findOne.mockResolvedValue(mockGovernorate);
      cityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await service.validateAddress(addressData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid postal code format (should be 5 digits)');
    });
  });

  describe('createSyrianAddress', () => {
    it('should create address with valid data', async () => {
      // Arrange
      const addressData: Partial<SyrianAddressEntity> = {
        governorate: { id: 1 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
      };

      const savedAddress = {
        id: 1,
        propertyType: PropertyType.RESIDENTIAL,
        governorate: mockGovernorate,
        city: mockCity,
        district: null,
        streetEn: null,
        streetAr: null,
        buildingNumber: null,
        status: AddressStatus.VERIFIED,
        validation: {
          verificationMethod: VerificationMethod.AUTOMATED,
          confidenceScore: 90,
        },
      } as unknown as SyrianAddressEntity;

      governorateRepo.findOne.mockResolvedValue(mockGovernorate);
      cityRepo.findOne.mockResolvedValue(mockCity);
      addressRepo.create.mockReturnValue(savedAddress);
      addressRepo.save.mockResolvedValue(savedAddress);

      // Act
      const result = await service.createSyrianAddress(addressData);

      // Assert
      expect(result).toEqual(savedAddress);
      expect(result.status).toBe(AddressStatus.VERIFIED);
    });

    it('should throw BadRequestException with invalid address data', async () => {
      // Arrange
      const addressData = {
        governorate: { id: 999 } as SyrianGovernorateEntity,
        city: { id: 1 } as SyrianCityEntity,
      };

      governorateRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createSyrianAddress(addressData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDeliveryZoneInfo', () => {
    it('should return delivery info for supported governorate', async () => {
      // Arrange
      governorateRepo.findOne.mockResolvedValue(mockGovernorate);
      cityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await service.getDeliveryZoneInfo(1, 1);

      // Assert
      expect(result.isSupported).toBe(true);
      expect(result.estimatedDeliveryTime).toBeGreaterThan(0);
      expect(result.deliveryFee).toBeGreaterThan(0);
      expect(result.availableOptions).toContain('standard');
    });

    it('should throw NotFoundException for invalid governorate', async () => {
      // Arrange
      governorateRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDeliveryZoneInfo(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return unsupported for governorate without delivery', async () => {
      // Arrange
      const noDeliveryGov = {
        ...mockGovernorate,
        status: {
          accessibilityLevel: 'limited' as const,
          deliverySupported: false,
          lastUpdated: new Date(),
        },
      };

      governorateRepo.findOne.mockResolvedValue(noDeliveryGov);

      // Act
      const result = await service.getDeliveryZoneInfo(1);

      // Assert
      expect(result.isSupported).toBe(false);
    });

    it('should include restrictions for limited accessibility areas', async () => {
      // Arrange
      const limitedGov = {
        ...mockGovernorate,
        status: {
          accessibilityLevel: 'limited' as const,
          deliverySupported: true,
          lastUpdated: new Date(),
        },
      };

      governorateRepo.findOne.mockResolvedValue(limitedGov);

      // Act
      const result = await service.getDeliveryZoneInfo(1);

      // Assert
      expect(result.restrictions).toBeDefined();
      expect(result.restrictions?.length).toBeGreaterThan(0);
    });
  });

  describe('searchAddresses', () => {
    it('should search governorates in English', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockGovernorate]),
      };

      governorateRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const mockCityQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      cityRepo.createQueryBuilder = jest.fn().mockReturnValue(mockCityQueryBuilder);

      // Act
      const result = await service.searchAddresses('Damascus', 'en');

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('governorate');
      expect(result[0].name).toBe('Damascus');
    });

    it('should search cities in Arabic', async () => {
      // Arrange
      const mockGovQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      governorateRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockGovQueryBuilder);

      const mockCityQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCity]),
      };

      cityRepo.createQueryBuilder = jest.fn().mockReturnValue(mockCityQueryBuilder);

      // Act
      const result = await service.searchAddresses('دمشق', 'ar');

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('city');
      expect(result[0].nameAr).toBe('دمشق القديمة');
    });

    it('should return empty array for no matches', async () => {
      // Arrange
      const mockGovQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockCityQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      governorateRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockGovQueryBuilder);
      cityRepo.createQueryBuilder = jest.fn().mockReturnValue(mockCityQueryBuilder);

      // Act
      const result = await service.searchAddresses('NonExistent', 'en');

      // Assert
      expect(result).toEqual([]);
    });
  });
});
