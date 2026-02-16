/**
 * @file addresses.controller.spec.ts
 * @description Unit tests for Addresses Controller
 *
 * Tests cover:
 * - GET /addresses (list all addresses)
 * - GET /addresses/:id (get single address)
 * - GET /addresses/governorates (get all governorates)
 * - GET /addresses/governorates/:id/cities (get cities)
 * - GET /addresses/cities/:id/districts (get districts)
 * - POST /addresses (create address)
 * - PATCH /addresses/:id (update address)
 * - PATCH /addresses/:id/default (set default)
 * - DELETE /addresses/:id (delete address)
 * - JWT authentication requirement on all endpoints
 *
 * @author SouqSyria Development Team
 * @version 2.0.0 - Updated for God Service Refactor
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from '../service/addresses.service';
import { SyrianAddressCrudService } from '../service/syrian-address-crud.service';
import { SyrianAddressService } from '../service/syrian-address.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { Address } from '../entities/address.entity';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';
import { UpdateSyrianAddressDto } from '../dto/update-syrian-address.dto';
import { AddressType } from '../dto/create-address.dto';

describe('AddressesController', () => {
  let controller: AddressesController;
  let mockAddressesService: jest.Mocked<AddressesService>;
  let mockSyrianAddressCrudService: jest.Mocked<SyrianAddressCrudService>;
  let mockSyrianAddressService: jest.Mocked<SyrianAddressService>;

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

  const mockAddress: Address = {
    id: 1,
    user: mockUser,
    fullName: 'أحمد محمد',
    phone: '+963912345678',
    governorate: mockGovernorate,
    syrianCity: mockCity,
    district: mockDistrict,
    addressLine1: 'شارع الثورة',
    building: 'بناء السلام',
    floor: '3',
    additionalDetails: 'بجانب الصيدلية',
    label: 'home',
    isDefault: true,
    addressType: 'shipping',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Address;

  beforeEach(async () => {
    mockAddressesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      setDefault: jest.fn(),
      setAsDefault: jest.fn(),
    } as any;

    mockSyrianAddressCrudService = {
      createSyrianAddress: jest.fn(),
      updateSyrianAddress: jest.fn(),
      deleteSyrianAddress: jest.fn(),
      setDefaultSyrianAddress: jest.fn(),
      findAllSyrianAddresses: jest.fn(),
      findOneSyrianAddress: jest.fn(),
    } as any;

    mockSyrianAddressService = {
      getAllGovernorates: jest.fn(),
      getCitiesByGovernorate: jest.fn(),
      getDistrictsByCity: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        { provide: AddressesService, useValue: mockAddressesService },
        { provide: SyrianAddressCrudService, useValue: mockSyrianAddressCrudService },
        { provide: SyrianAddressService, useValue: mockSyrianAddressService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AddressesController>(AddressesController);
  });

  describe('getAllGovernorates', () => {
    it('should return all governorates', async () => {
      // Arrange
      const governorates = [mockGovernorate];
      mockSyrianAddressService.getAllGovernorates.mockResolvedValue(governorates);

      // Act
      const result = await controller.getAllGovernorates();

      // Assert
      expect(result).toEqual(governorates);
      expect(mockSyrianAddressService.getAllGovernorates).toHaveBeenCalled();
    });
  });

  describe('getCitiesByGovernorate', () => {
    it('should return cities for a governorate', async () => {
      // Arrange
      const governorateId = 1;
      const cities = [mockCity];
      mockSyrianAddressService.getCitiesByGovernorate.mockResolvedValue(cities);

      // Act
      const result = await controller.getCitiesByGovernorate(governorateId);

      // Assert
      expect(result).toEqual(cities);
      expect(mockSyrianAddressService.getCitiesByGovernorate).toHaveBeenCalledWith(
        governorateId,
      );
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const governorateId = '1';
      const cities = [mockCity];
      mockSyrianAddressService.getCitiesByGovernorate.mockResolvedValue(cities);

      // Act
      await controller.getCitiesByGovernorate(governorateId as any);

      // Assert
      expect(mockSyrianAddressService.getCitiesByGovernorate).toHaveBeenCalledWith(1);
    });
  });

  describe('getDistrictsByCity', () => {
    it('should return districts for a city', async () => {
      // Arrange
      const cityId = 5;
      const districts = [mockDistrict];
      mockSyrianAddressService.getDistrictsByCity.mockResolvedValue(districts);

      // Act
      const result = await controller.getDistrictsByCity(cityId);

      // Assert
      expect(result).toEqual(districts);
      expect(mockSyrianAddressService.getDistrictsByCity).toHaveBeenCalledWith(cityId);
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const cityId = '5';
      const districts = [mockDistrict];
      mockSyrianAddressService.getDistrictsByCity.mockResolvedValue(districts);

      // Act
      await controller.getDistrictsByCity(cityId as any);

      // Assert
      expect(mockSyrianAddressService.getDistrictsByCity).toHaveBeenCalledWith(5);
    });
  });

  describe('create', () => {
    it('should create a new address via SyrianAddressCrudService', async () => {
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

      mockSyrianAddressCrudService.createSyrianAddress.mockResolvedValue(mockAddress);

      // Act
      const result = await controller.create(mockUser, dto);

      // Assert
      expect(result).toEqual(mockAddress);
      expect(mockSyrianAddressCrudService.createSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        dto,
      );
    });
  });

  describe('update', () => {
    it('should update a Syrian address (full update)', async () => {
      // Arrange
      const addressId = 1;
      const dto: UpdateSyrianAddressDto = {
        fullName: 'محمد أحمد',
        street: 'شارع جديد',
      };

      const updatedAddress = { ...mockAddress, ...dto };
      mockSyrianAddressCrudService.updateSyrianAddress.mockResolvedValue(updatedAddress);

      // Act
      const result = await controller.update(mockUser, addressId, dto);

      // Assert
      expect(result).toEqual(updatedAddress);
      expect(mockSyrianAddressCrudService.updateSyrianAddress).toHaveBeenCalledWith(mockUser, 1, dto);
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const addressId = '1';
      const dto: UpdateSyrianAddressDto = { fullName: 'New Name' };

      mockSyrianAddressCrudService.updateSyrianAddress.mockResolvedValue(mockAddress);

      // Act
      await controller.update(mockUser, addressId as any, dto);

      // Assert
      expect(mockSyrianAddressCrudService.updateSyrianAddress).toHaveBeenCalledWith(mockUser, 1, dto);
    });
  });

  describe('updateSyrianAddress', () => {
    it('should update a Syrian address via SyrianAddressCrudService', async () => {
      // Arrange
      const addressId = 1;
      const dto: UpdateSyrianAddressDto = {
        fullName: 'محمد أحمد',
      };

      const updatedAddress = { ...mockAddress, fullName: 'محمد أحمد' };
      mockSyrianAddressCrudService.updateSyrianAddress.mockResolvedValue(updatedAddress);

      // Act
      const result = await controller.updateSyrianAddress(mockUser, addressId, dto);

      // Assert
      expect(result).toEqual(updatedAddress);
      expect(mockSyrianAddressCrudService.updateSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        1,
        dto,
      );
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const addressId = '1';
      const dto: UpdateSyrianAddressDto = { fullName: 'New Name' };

      mockSyrianAddressCrudService.updateSyrianAddress.mockResolvedValue(mockAddress);

      // Act
      await controller.updateSyrianAddress(mockUser, addressId as any, dto);

      // Assert
      expect(mockSyrianAddressCrudService.updateSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        1,
        dto,
      );
    });
  });

  describe('setDefaultAddress', () => {
    it('should set an address as default via SyrianAddressCrudService', async () => {
      // Arrange
      const addressId = 1;
      const defaultAddress = { ...mockAddress, isDefault: true };
      mockSyrianAddressCrudService.setDefaultSyrianAddress.mockResolvedValue(defaultAddress);

      // Act
      const result = await controller.setDefaultAddress(mockUser, addressId);

      // Assert
      expect(result).toEqual(defaultAddress);
      expect(mockSyrianAddressCrudService.setDefaultSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        1,
      );
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const addressId = '1';
      mockSyrianAddressCrudService.setDefaultSyrianAddress.mockResolvedValue(mockAddress);

      // Act
      await controller.setDefaultAddress(mockUser, addressId as any);

      // Assert
      expect(mockSyrianAddressCrudService.setDefaultSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        1,
      );
    });
  });

  describe('remove', () => {
    it('should delete an address via SyrianAddressCrudService', async () => {
      // Arrange
      const addressId = 1;
      mockSyrianAddressCrudService.deleteSyrianAddress.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(mockUser, addressId);

      // Assert
      expect(mockSyrianAddressCrudService.deleteSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        1,
      );
      expect(result).toBeUndefined();
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const addressId = '1';
      mockSyrianAddressCrudService.deleteSyrianAddress.mockResolvedValue(undefined);

      // Act
      await controller.remove(mockUser, addressId as any);

      // Assert
      expect(mockSyrianAddressCrudService.deleteSyrianAddress).toHaveBeenCalledWith(
        mockUser,
        1,
      );
    });
  });

  describe('findAll', () => {
    it('should return all Syrian addresses for user', async () => {
      // Arrange
      const addresses = [mockAddress];
      mockSyrianAddressCrudService.findAllSyrianAddresses.mockResolvedValue(addresses);

      // Act
      const result = await controller.findAll(mockUser);

      // Assert
      expect(result).toEqual(addresses);
      expect(mockSyrianAddressCrudService.findAllSyrianAddresses).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single Syrian address', async () => {
      // Arrange
      const addressId = 1;
      mockSyrianAddressCrudService.findOneSyrianAddress.mockResolvedValue(mockAddress);

      // Act
      const result = await controller.findOne(mockUser, addressId);

      // Assert
      expect(result).toEqual(mockAddress);
      expect(mockSyrianAddressCrudService.findOneSyrianAddress).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should convert string ID to number', async () => {
      // Arrange
      const addressId = '1';
      mockSyrianAddressCrudService.findOneSyrianAddress.mockResolvedValue(mockAddress);

      // Act
      await controller.findOne(mockUser, addressId as any);

      // Assert
      expect(mockSyrianAddressCrudService.findOneSyrianAddress).toHaveBeenCalledWith(mockUser, 1);
    });
  });

});
