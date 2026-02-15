/**
 * @file addresses.service.syrian.spec.ts
 * @description Unit tests for Syrian-specific address management methods
 *
 * Tests cover:
 * - createSyrianAddress with validation and default flag handling
 * - updateSyrianAddress with ownership and hierarchy validation
 * - deleteSyrianAddress with business rule constraints
 * - setDefaultSyrianAddress with default flag management
 * - findAllSyrianAddresses and findOneSyrianAddress queries
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { Address } from '../entities/address.entity';
import { User } from '../../users/entities/user.entity';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { City } from '../city/entities/city.entity';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';
import { GovernorateCityValidator } from '../validators/valid-governorate-city.validator';
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';
import { UpdateSyrianAddressDto } from '../dto/update-syrian-address.dto';

describe('AddressesService - Syrian Methods', () => {
  let service: AddressesService;
  let mockAddressRepo: jest.Mocked<Repository<Address>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockCountryRepo: jest.Mocked<Repository<Country>>;
  let mockRegionRepo: jest.Mocked<Repository<Region>>;
  let mockCityRepo: jest.Mocked<Repository<City>>;
  let mockGovRepo: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let mockSyrianCityRepo: jest.Mocked<Repository<SyrianCityEntity>>;
  let mockDistrictRepo: jest.Mocked<Repository<SyrianDistrictEntity>>;
  let mockValidator: jest.Mocked<GovernorateCityValidator>;
  /** Mock EntityManager returned inside addressRepo.manager.transaction() */
  let mockManager: {
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+963912345678',
    isEmailVerified: true,
    isMerchant: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as User;

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
    },
  } as SyrianGovernorateEntity;

  const mockCity: SyrianCityEntity = {
    id: 5,
    nameEn: 'Damascus City',
    nameAr: 'دمشق',
    governorate: mockGovernorate,
    isActive: true,
    displayOrder: 1,
    logistics: { deliverySupported: true },
  } as SyrianCityEntity;

  const mockDistrict: SyrianDistrictEntity = {
    id: 10,
    nameEn: 'Al-Mezzeh',
    nameAr: 'المزة',
    city: mockCity,
    isActive: true,
    displayOrder: 1,
  } as SyrianDistrictEntity;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockAddressRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
      count: jest.fn(),
      manager: {
        transaction: jest.fn((cb: any) => cb(mockManager)),
      },
    } as any;

    mockUserRepo = {
      findOne: jest.fn(),
    } as any;

    mockCountryRepo = {
      findOne: jest.fn(),
    } as any;

    mockRegionRepo = {
      findOne: jest.fn(),
    } as any;

    mockCityRepo = {
      findOne: jest.fn(),
    } as any;

    mockGovRepo = {
      findOne: jest.fn(),
    } as any;

    mockSyrianCityRepo = {
      findOne: jest.fn(),
    } as any;

    mockDistrictRepo = {
      findOne: jest.fn(),
    } as any;

    mockValidator = {
      validate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: getRepositoryToken(Address), useValue: mockAddressRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Country), useValue: mockCountryRepo },
        { provide: getRepositoryToken(Region), useValue: mockRegionRepo },
        { provide: getRepositoryToken(City), useValue: mockCityRepo },
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useValue: mockGovRepo,
        },
        {
          provide: getRepositoryToken(SyrianCityEntity),
          useValue: mockSyrianCityRepo,
        },
        {
          provide: getRepositoryToken(SyrianDistrictEntity),
          useValue: mockDistrictRepo,
        },
        { provide: GovernorateCityValidator, useValue: mockValidator },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  describe('createSyrianAddress', () => {
    it('should create a Syrian address with valid hierarchy', async () => {
      // Arrange
      const dto: CreateSyrianAddressDto = {
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorateId: 1,
        cityId: 5,
        districtId: 10,
        street: 'شارع الثورة',
        building: 'بناء السلام',
        floor: '3',
        additionalDetails: 'بجانب الصيدلية',
        label: 'home',
        isDefault: false,
      };

      mockValidator.validate.mockResolvedValue({ valid: true, errors: [] });
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockSyrianCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(mockDistrict);

      const savedAddress: Address = {
        id: 1,
        user: mockUser,
        fullName: dto.fullName,
        phone: dto.phone,
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: dto.street,
        building: dto.building,
        floor: dto.floor,
        additionalDetails: dto.additionalDetails,
        label: dto.label,
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockManager.create.mockReturnValue(savedAddress);
      mockManager.save.mockResolvedValue(savedAddress);

      // Act
      const result = await service.createSyrianAddress(mockUser, dto);

      // Assert
      expect(mockValidator.validate).toHaveBeenCalledWith(1, 5, 10);
      expect(mockGovRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockSyrianCityRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(mockDistrictRepo.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(result.id).toBe(1);
      expect(result.fullName).toBe('أحمد محمد');
      expect(result.isDefault).toBe(false);
    });

    it('should throw BadRequestException on invalid hierarchy', async () => {
      // Arrange
      const dto: CreateSyrianAddressDto = {
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorateId: 1,
        cityId: 5,
        street: 'شارع الثورة',
      };

      mockValidator.validate.mockResolvedValue({
        valid: false,
        errors: ['City does not belong to governorate'],
      });

      // Act & Assert
      await expect(service.createSyrianAddress(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should unset previous default when isDefault is true', async () => {
      // Arrange
      const dto: CreateSyrianAddressDto = {
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorateId: 1,
        cityId: 5,
        street: 'شارع الثورة',
        isDefault: true,
      };

      mockValidator.validate.mockResolvedValue({ valid: true, errors: [] });
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockSyrianCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(null);

      const savedAddress: Address = {
        id: 1,
        user: mockUser,
        fullName: dto.fullName,
        phone: dto.phone,
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: null,
        addressLine1: dto.street,
        isDefault: true,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockManager.create.mockReturnValue(savedAddress);
      mockManager.save.mockResolvedValue(savedAddress);

      // Act
      await service.createSyrianAddress(mockUser, dto);

      // Assert — update runs inside the transaction manager
      expect(mockManager.update).toHaveBeenCalledWith(
        Address,
        { user: { id: mockUser.id } },
        { isDefault: false },
      );
    });

    it('should set default label when not provided', async () => {
      // Arrange
      const dto: CreateSyrianAddressDto = {
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorateId: 1,
        cityId: 5,
        street: 'شارع الثورة',
      };

      mockValidator.validate.mockResolvedValue({ valid: true, errors: [] });
      mockGovRepo.findOne.mockResolvedValue(mockGovernorate);
      mockSyrianCityRepo.findOne.mockResolvedValue(mockCity);
      mockDistrictRepo.findOne.mockResolvedValue(null);

      const savedAddress: Address = {
        id: 1,
        user: mockUser,
        fullName: dto.fullName,
        phone: dto.phone,
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: null,
        addressLine1: dto.street,
        label: 'home',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockManager.create.mockReturnValue(savedAddress);
      mockManager.save.mockResolvedValue(savedAddress);

      // Act
      const result = await service.createSyrianAddress(mockUser, dto);

      // Assert
      expect(result.label).toBe('home');
    });
  });

  describe('updateSyrianAddress', () => {
    it('should update a Syrian address successfully', async () => {
      // Arrange
      const addressId = 1;
      const dto: UpdateSyrianAddressDto = {
        fullName: 'محمد أحمد',
        street: 'شارع جديد',
      };

      const existingAddress: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      const updatedAddress: Address = {
        ...existingAddress,
        fullName: dto.fullName,
        addressLine1: dto.street,
      };

      mockAddressRepo.findOne.mockResolvedValue(existingAddress);
      mockManager.save.mockResolvedValue(updatedAddress);

      // Act
      const result = await service.updateSyrianAddress(mockUser, addressId, dto);

      // Assert
      expect(mockAddressRepo.findOne).toHaveBeenCalledWith({
        where: { id: addressId, user: { id: mockUser.id } },
        relations: ['governorate', 'syrianCity', 'district'],
      });
      expect(result.fullName).toBe('محمد أحمد');
      expect(result.addressLine1).toBe('شارع جديد');
    });

    it('should throw NotFoundException for non-existent address', async () => {
      // Arrange
      const addressId = 999;
      const dto: UpdateSyrianAddressDto = { fullName: 'New Name' };

      mockAddressRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateSyrianAddress(mockUser, addressId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for address owned by different user', async () => {
      // Arrange
      const otherUser = { ...mockUser, id: 2 } as unknown as User;
      const addressId = 1;
      const dto: UpdateSyrianAddressDto = { fullName: 'New Name' };

      mockAddressRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateSyrianAddress(otherUser, addressId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate hierarchy if geographic fields change', async () => {
      // Arrange
      const addressId = 1;
      const dto: UpdateSyrianAddressDto = {
        governorateId: 2,
        cityId: 6,
      };

      const existingAddress: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockAddressRepo.findOne.mockResolvedValue(existingAddress);
      mockValidator.validate.mockResolvedValue({
        valid: false,
        errors: ['City does not belong to governorate'],
      });

      // Act & Assert
      await expect(
        service.updateSyrianAddress(mockUser, addressId, dto),
      ).rejects.toThrow(BadRequestException);
      expect(mockValidator.validate).toHaveBeenCalledWith(2, 6, 10);
    });

    it('should handle default address logic when isDefault changes', async () => {
      // Arrange
      const addressId = 1;
      const dto: UpdateSyrianAddressDto = {
        isDefault: true,
      };

      const existingAddress: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      const updatedAddress: Address = {
        ...existingAddress,
        isDefault: true,
      };

      mockAddressRepo.findOne.mockResolvedValue(existingAddress);
      mockManager.save.mockResolvedValue(updatedAddress);

      // Act
      const result = await service.updateSyrianAddress(mockUser, addressId, dto);

      // Assert — update runs inside the transaction manager
      expect(mockManager.update).toHaveBeenCalledWith(
        Address,
        { user: { id: mockUser.id } },
        { isDefault: false },
      );
      expect(result.isDefault).toBe(true);
    });
  });

  describe('deleteSyrianAddress', () => {
    it('should delete a non-default non-only address successfully', async () => {
      // Arrange
      const addressId = 1;

      const address: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockAddressRepo.findOne.mockResolvedValue(address);
      mockAddressRepo.count.mockResolvedValue(2);

      // Act
      await service.deleteSyrianAddress(mockUser, addressId);

      // Assert
      expect(mockAddressRepo.findOne).toHaveBeenCalledWith({
        where: { id: addressId, user: { id: mockUser.id } },
      });
      expect(mockAddressRepo.count).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
      });
      expect(mockAddressRepo.softRemove).toHaveBeenCalledWith(address);
    });

    it('should throw BadRequestException when deleting only address', async () => {
      // Arrange
      const addressId = 1;

      const address: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockAddressRepo.findOne.mockResolvedValue(address);
      mockAddressRepo.count.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.deleteSyrianAddress(mockUser, addressId),
      ).rejects.toThrow(BadRequestException);
      expect(mockAddressRepo.softRemove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting default address', async () => {
      // Arrange
      const addressId = 1;

      const address: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: true,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockAddressRepo.findOne.mockResolvedValue(address);
      mockAddressRepo.count.mockResolvedValue(2);

      // Act & Assert
      await expect(
        service.deleteSyrianAddress(mockUser, addressId),
      ).rejects.toThrow(BadRequestException);
      expect(mockAddressRepo.softRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent address', async () => {
      // Arrange
      const addressId = 999;

      mockAddressRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteSyrianAddress(mockUser, addressId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefaultSyrianAddress', () => {
    it('should set an address as default successfully', async () => {
      // Arrange
      const addressId = 1;

      const address: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      const updatedAddress: Address = {
        ...address,
        isDefault: true,
      };

      // All operations happen inside the transaction manager
      mockManager.findOne.mockResolvedValue(address);
      mockManager.save.mockResolvedValue(updatedAddress);

      // Act
      const result = await service.setDefaultSyrianAddress(mockUser, addressId);

      // Assert
      expect(mockManager.update).toHaveBeenCalledWith(
        Address,
        { user: { id: mockUser.id } },
        { isDefault: false },
      );
      expect(result.isDefault).toBe(true);
    });

    it('should unmark previous default address', async () => {
      // Arrange
      const addressId = 2;

      const address: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'محمد أحمد',
        phone: '+963987654321',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع جديد',
        isDefault: false,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      const updatedAddress: Address = {
        ...address,
        isDefault: true,
      };

      // All operations happen inside the transaction manager
      mockManager.findOne.mockResolvedValue(address);
      mockManager.save.mockResolvedValue(updatedAddress);

      // Act
      await service.setDefaultSyrianAddress(mockUser, addressId);

      // Assert
      expect(mockManager.update).toHaveBeenCalledWith(
        Address,
        { user: { id: mockUser.id } },
        { isDefault: false },
      );
    });

    it('should throw NotFoundException for non-existent address', async () => {
      // Arrange
      const addressId = 999;

      // findOne is inside the transaction manager
      mockManager.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.setDefaultSyrianAddress(mockUser, addressId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllSyrianAddresses', () => {
    it('should find all addresses for user with Syrian relations', async () => {
      // Arrange
      const addresses: Address[] = [
        {
          id: 1,
          user: mockUser,
          fullName: 'أحمد محمد',
          phone: '+963912345678',
          governorate: mockGovernorate,
          syrianCity: mockCity,
          district: mockDistrict,
          addressLine1: 'شارع الثورة',
          isDefault: true,
          addressType: 'shipping',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Address,
        {
          id: 2,
          user: mockUser,
          fullName: 'محمد أحمد',
          phone: '+963987654321',
          governorate: mockGovernorate,
          syrianCity: mockCity,
          district: null,
          addressLine1: 'شارع جديد',
          isDefault: false,
          addressType: 'shipping',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Address,
      ];

      mockAddressRepo.find.mockResolvedValue(addresses);

      // Act
      const result = await service.findAllSyrianAddresses(mockUser);

      // Assert
      expect(mockAddressRepo.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
        relations: ['governorate', 'syrianCity', 'district'],
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].isDefault).toBe(true);
    });

    it('should return empty array when user has no addresses', async () => {
      // Arrange
      mockAddressRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAllSyrianAddresses(mockUser);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findOneSyrianAddress', () => {
    it('should find a single Syrian address by ID', async () => {
      // Arrange
      const addressId = 1;
      const address: Address = {
        id: addressId,
        user: mockUser,
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorate: mockGovernorate,
        syrianCity: mockCity,
        district: mockDistrict,
        addressLine1: 'شارع الثورة',
        isDefault: true,
        addressType: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockAddressRepo.findOne.mockResolvedValue(address);

      // Act
      const result = await service.findOneSyrianAddress(mockUser, addressId);

      // Assert
      expect(mockAddressRepo.findOne).toHaveBeenCalledWith({
        where: { id: addressId, user: { id: mockUser.id } },
        relations: ['governorate', 'syrianCity', 'district'],
      });
      expect(result.id).toBe(addressId);
    });

    it('should throw NotFoundException for non-existent address', async () => {
      // Arrange
      const addressId = 999;

      mockAddressRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOneSyrianAddress(mockUser, addressId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for address owned by different user', async () => {
      // Arrange
      const otherUser = { ...mockUser, id: 2 } as unknown as User;
      const addressId = 1;

      mockAddressRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOneSyrianAddress(otherUser, addressId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
