/**
 * @file syrian-address-crud.service.spec.ts
 * @description Unit tests for SyrianAddressCrudService
 *
 * Tests cover:
 * - Service instantiation
 * - createSyrianAddress - Creates a Syrian address with hierarchy validation
 * - deleteSyrianAddress - Soft-deletes with business rule checks
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 God Service Refactor
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SyrianAddressCrudService } from './syrian-address-crud.service';
import { AddressQueryService } from './address-query.service';
import { GovernorateCityValidator } from '../validators/valid-governorate-city.validator';
import { Address } from '../entities/address.entity';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';
import { User } from '../../users/entities/user.entity';
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';

describe('SyrianAddressCrudService', () => {
  let service: SyrianAddressCrudService;
  let addressRepo: jest.Mocked<Repository<Address>>;
  let govRepo: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let syrianCityRepo: jest.Mocked<Repository<SyrianCityEntity>>;
  let districtRepo: jest.Mocked<Repository<SyrianDistrictEntity>>;
  let mockValidator: jest.Mocked<GovernorateCityValidator>;
  let mockAddressQueryService: jest.Mocked<AddressQueryService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
  } as User;

  const mockGovernorate = {
    id: 1,
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    code: 'DIM',
    isActive: true,
  } as SyrianGovernorateEntity;

  const mockCity = {
    id: 5,
    nameEn: 'Damascus City',
    nameAr: 'دمشق',
    governorate: mockGovernorate,
    isActive: true,
  } as SyrianCityEntity;

  const mockAddress = {
    id: 1,
    user: mockUser,
    fullName: 'Ahmad',
    phone: '+963912345678',
    governorate: mockGovernorate,
    syrianCity: mockCity,
    district: null,
    addressLine1: 'Al-Thawra St',
    isDefault: false,
    label: 'home',
    addressType: 'shipping',
  } as unknown as Address;

  beforeEach(async () => {
    const mockAddressRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
    };

    const mockGovRepo = {
      findOne: jest.fn(),
    };

    const mockSyrianCityRepo = {
      findOne: jest.fn(),
    };

    const mockDistrictRepo = {
      findOne: jest.fn(),
    };

    mockValidator = {
      validate: jest.fn(),
    } as any;

    mockAddressQueryService = {
      countUserAddresses: jest.fn(),
    } as any;

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          update: jest.fn(),
          save: jest.fn(),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyrianAddressCrudService,
        { provide: getRepositoryToken(Address), useValue: mockAddressRepo },
        { provide: getRepositoryToken(SyrianGovernorateEntity), useValue: mockGovRepo },
        { provide: getRepositoryToken(SyrianCityEntity), useValue: mockSyrianCityRepo },
        { provide: getRepositoryToken(SyrianDistrictEntity), useValue: mockDistrictRepo },
        { provide: GovernorateCityValidator, useValue: mockValidator },
        { provide: DataSource, useValue: mockDataSource },
        { provide: AddressQueryService, useValue: mockAddressQueryService },
      ],
    }).compile();

    service = module.get<SyrianAddressCrudService>(SyrianAddressCrudService);
    addressRepo = module.get(getRepositoryToken(Address));
    govRepo = module.get(getRepositoryToken(SyrianGovernorateEntity));
    syrianCityRepo = module.get(getRepositoryToken(SyrianCityEntity));
    districtRepo = module.get(getRepositoryToken(SyrianDistrictEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSyrianAddress', () => {
    const dto: CreateSyrianAddressDto = {
      fullName: 'Ahmad',
      phone: '+963912345678',
      governorateId: 1,
      cityId: 5,
      street: 'Al-Thawra St',
      isDefault: false,
      label: 'home',
    };

    it('should create a Syrian address when validation passes', async () => {
      // Arrange
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [] });
      govRepo.findOne.mockResolvedValue(mockGovernorate);
      syrianCityRepo.findOne.mockResolvedValue(mockCity);
      addressRepo.create.mockReturnValue(mockAddress);

      // Mock the DataSource's queryRunner to return the saved address
      const mockDataSource = (service as any).dataSource;
      const mockQueryRunner = mockDataSource.createQueryRunner();
      mockQueryRunner.manager.save.mockResolvedValue(mockAddress);

      // Act
      const result = await service.createSyrianAddress(mockUser, dto);

      // Assert
      expect(result).toEqual(mockAddress);
      expect(mockValidator.validate).toHaveBeenCalledWith(1, 5, undefined);
      expect(govRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(syrianCityRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when validation fails', async () => {
      // Arrange
      mockValidator.validate.mockResolvedValue({
        valid: false,
        errors: ['City does not belong to governorate'],
      });

      // Act & Assert
      await expect(
        service.createSyrianAddress(mockUser, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should unset other defaults when isDefault is true', async () => {
      // Arrange
      const defaultDto = { ...dto, isDefault: true };
      const defaultAddress = { ...mockAddress, isDefault: true };
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [] });
      govRepo.findOne.mockResolvedValue(mockGovernorate);
      syrianCityRepo.findOne.mockResolvedValue(mockCity);
      addressRepo.create.mockReturnValue(defaultAddress);

      // Mock the DataSource's queryRunner to return the saved address
      const mockDataSource = (service as any).dataSource;
      const mockQueryRunner = mockDataSource.createQueryRunner();
      mockQueryRunner.manager.save.mockResolvedValue(defaultAddress);

      // Act
      await service.createSyrianAddress(mockUser, defaultDto);

      // Assert - should update other addresses to not be default within transaction
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        Address,
        { user: { id: 1 } },
        { isDefault: false },
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('deleteSyrianAddress', () => {
    it('should soft-delete an address when business rules pass', async () => {
      // Arrange
      const nonDefaultAddress = { ...mockAddress, isDefault: false };
      addressRepo.findOne.mockResolvedValue(nonDefaultAddress);
      mockAddressQueryService.countUserAddresses.mockResolvedValue(2);

      // Act
      await service.deleteSyrianAddress(mockUser, 1);

      // Assert
      expect(addressRepo.softRemove).toHaveBeenCalledWith(nonDefaultAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      // Arrange
      addressRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteSyrianAddress(mockUser, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if it is the only address', async () => {
      // Arrange
      const nonDefaultAddress = { ...mockAddress, isDefault: false };
      addressRepo.findOne.mockResolvedValue(nonDefaultAddress);
      mockAddressQueryService.countUserAddresses.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.deleteSyrianAddress(mockUser, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if address is default', async () => {
      // Arrange
      const defaultAddress = { ...mockAddress, isDefault: true };
      addressRepo.findOne.mockResolvedValue(defaultAddress);
      mockAddressQueryService.countUserAddresses.mockResolvedValue(2);

      // Act & Assert
      await expect(
        service.deleteSyrianAddress(mockUser, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
