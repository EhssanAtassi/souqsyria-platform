/**
 * @file valid-governorate-city.validator.spec.ts
 * @description Unit tests for Syrian administrative hierarchy validator
 *
 * Tests cover:
 * - Valid governorate, city, and district combinations
 * - Invalid hierarchies (city not belonging to governorate, etc.)
 * - Inactive entities
 * - Delivery support validation
 * - Optional district handling
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GovernorateCityValidator,
  GovernorateCityValidationResult,
} from './valid-governorate-city.validator';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';

describe('GovernorateCityValidator', () => {
  let validator: GovernorateCityValidator;
  let mockGovRepo: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let mockCityRepo: jest.Mocked<Repository<SyrianCityEntity>>;
  let mockDistrictRepo: jest.Mocked<Repository<SyrianDistrictEntity>>;

  const mockGovernorate: SyrianGovernorateEntity = {
    id: 1,
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    code: 'DM',
    isActive: true,
    displayOrder: 1,
    status: {
      deliverySupported: true,
      accessibilityLevel: 'full',
      lastUpdated: new Date(),
    },
  } as SyrianGovernorateEntity;

  const mockGovernorateInactive: SyrianGovernorateEntity = {
    ...mockGovernorate,
    isActive: false,
  };

  const mockGovernorateNoDelivery: SyrianGovernorateEntity = {
    ...mockGovernorate,
    status: {
      deliverySupported: false,
      accessibilityLevel: 'restricted',
      lastUpdated: new Date(),
    },
  };

  const mockCity: SyrianCityEntity = {
    id: 5,
    nameEn: 'Damascus City',
    nameAr: 'دمشق',
    governorate: mockGovernorate,
    isActive: true,
    displayOrder: 1,
    logistics: { deliverySupported: true, averageDeliveryTime: 24 },
  } as SyrianCityEntity;

  const mockCityInactive: SyrianCityEntity = {
    ...mockCity,
    isActive: false,
  };

  const mockCityDifferentGovernorate: SyrianCityEntity = {
    ...mockCity,
    id: 6,
    governorate: { ...mockGovernorate, id: 2, nameEn: 'Aleppo' },
  };

  const mockCityNoDelivery: SyrianCityEntity = {
    ...mockCity,
    logistics: { deliverySupported: false, averageDeliveryTime: 0 },
  };

  const mockDistrict: SyrianDistrictEntity = {
    id: 10,
    nameEn: 'Al-Mezzeh',
    nameAr: 'المزة',
    city: mockCity,
    isActive: true,
    displayOrder: 1,
  } as SyrianDistrictEntity;

  const mockDistrictInactive: SyrianDistrictEntity = {
    ...mockDistrict,
    isActive: false,
  };

  const mockDistrictDifferentCity: SyrianDistrictEntity = {
    ...mockDistrict,
    id: 11,
    city: { ...mockCity, id: 6, nameEn: 'Aleppo City' },
  };

  beforeEach(async () => {
    mockGovRepo = {
      findOne: jest.fn(),
    } as any;

    mockCityRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockDistrictRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernorateCityValidator,
        { provide: getRepositoryToken(SyrianGovernorateEntity), useValue: mockGovRepo },
        { provide: getRepositoryToken(SyrianCityEntity), useValue: mockCityRepo },
        { provide: getRepositoryToken(SyrianDistrictEntity), useValue: mockDistrictRepo },
      ],
    }).compile();

    validator = module.get<GovernorateCityValidator>(GovernorateCityValidator);
  });

  describe('validate', () => {
    it('should return valid result for valid governorate + city + district', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(mockDistrict);

      // Act
      const result = await validator.validate(1, 5, 10);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(mockGovRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockCityRepo.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: ['governorate'],
      });
      expect(mockDistrictRepo.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['city', 'city.governorate'],
      });
    });

    it('should return valid result for governorate + city without district', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await validator.validate(1, 5);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(mockDistrictRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return error for non-existent governorate', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await validator.validate(999, 5, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Governorate with ID 999 does not exist');
    });

    it('should return error for non-existent city', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await validator.validate(1, 999, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('City with ID 999 does not exist');
    });

    it('should return error for city not belonging to governorate', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCityDifferentGovernorate);

      // Act
      const result = await validator.validate(1, 6, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) =>
        e.includes('does not belong to governorate'),
      )).toBe(true);
    });

    it('should return error for non-existent district', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await validator.validate(1, 5, 999);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('District with ID 999 does not exist');
    });

    it('should return error for district not belonging to city', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(mockDistrictDifferentCity);

      // Act
      const result = await validator.validate(1, 5, 11);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) =>
        e.includes('does not belong to city'),
      )).toBe(true);
    });

    it('should return error for inactive governorate', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorateInactive);
      mockCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(mockDistrict);

      // Act
      const result = await validator.validate(1, 5, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('inactive'))).toBe(true);
    });

    it('should return error for inactive city', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCityInactive);
      mockDistrictRepo.findOne.mockResolvedValue(mockDistrict);

      // Act
      const result = await validator.validate(1, 5, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('inactive'))).toBe(true);
    });

    it('should return error for inactive district', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(mockDistrictInactive);

      // Act
      const result = await validator.validate(1, 5, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('inactive'))).toBe(true);
    });

    it('should return error when governorate does not support delivery', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorateNoDelivery);
      mockCityRepo.findOne.mockResolvedValue(mockCity);

      // Act
      const result = await validator.validate(1, 5);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) =>
        e.includes('Delivery is not supported'),
      )).toBe(true);
    });

    it('should return error when city does not support delivery', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockCityRepo.findOne.mockResolvedValue(mockCityNoDelivery);

      // Act
      const result = await validator.validate(1, 5);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) =>
        e.includes('Delivery is not supported'),
      )).toBe(true);
    });

    it('should return multiple errors for multiple invalid conditions', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorateInactive);
      mockCityRepo.findOne.mockResolvedValue(mockCityDifferentGovernorate);

      // Act
      const result = await validator.validate(1, 6);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockGovRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await validator.validate(1, 5, 10);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'An error occurred during address validation. Please try again.',
      );
    });
  });

  describe('isDeliverySupported', () => {
    it('should return true for active governorate with delivery support', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);

      // Act
      const result = await validator.isDeliverySupported(1);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for inactive governorate', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorateInactive);

      // Act
      const result = await validator.isDeliverySupported(1);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for governorate without delivery support', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(mockGovernorateNoDelivery);

      // Act
      const result = await validator.isDeliverySupported(1);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for non-existent governorate', async () => {
      // Arrange
      mockGovRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await validator.isDeliverySupported(999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAvailableGovernorates', () => {
    it('should return only active governorates with delivery support', async () => {
      // Arrange
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockGovernorate]),
      };

      mockGovRepo.createQueryBuilder = jest.fn(() => queryBuilder as any);

      // Act
      const result = await validator.getAvailableGovernorates();

      // Assert
      expect(result).toEqual([mockGovernorate]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'gov.isActive = :isActive',
        { isActive: true },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getCitiesForGovernorate', () => {
    it('should return active cities for a governorate', async () => {
      // Arrange
      mockCityRepo.find.mockResolvedValue([mockCity]);

      // Act
      const result = await validator.getCitiesForGovernorate(1);

      // Assert
      expect(result).toEqual([mockCity]);
      expect(mockCityRepo.find).toHaveBeenCalledWith({
        where: { governorate: { id: 1 }, isActive: true },
        order: { displayOrder: 'ASC' },
      });
    });

    it('should return empty array for governorate with no cities', async () => {
      // Arrange
      mockCityRepo.find.mockResolvedValue([]);

      // Act
      const result = await validator.getCitiesForGovernorate(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getDistrictsForCity', () => {
    it('should return active districts for a city', async () => {
      // Arrange
      mockDistrictRepo.find.mockResolvedValue([mockDistrict]);

      // Act
      const result = await validator.getDistrictsForCity(5);

      // Assert
      expect(result).toEqual([mockDistrict]);
      expect(mockDistrictRepo.find).toHaveBeenCalledWith({
        where: { city: { id: 5 }, isActive: true },
        order: { displayOrder: 'ASC' },
      });
    });

    it('should return empty array for city with no districts', async () => {
      // Arrange
      mockDistrictRepo.find.mockResolvedValue([]);

      // Act
      const result = await validator.getDistrictsForCity(999);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
