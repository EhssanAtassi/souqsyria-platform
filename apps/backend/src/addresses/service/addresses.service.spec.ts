/**
 * @file addresses.service.spec.ts
 * @description Comprehensive unit tests for Addresses Service
 *
 * Tests cover:
 * - Address CRUD operations
 * - Default address management
 * - Address validation
 * - User address relationships
 * - Geographic data handling
 * - Syrian localization features
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressesService } from './addresses.service';
import { Address } from '../entities/address.entity';
import { User } from '../../users/entities/user.entity';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { City } from '../city/entities/city.entity';
import { SyrianAddressEntity } from '../entities/syrian-address-main.entity';
import { SyrianGovernorateEntity } from '../entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../entities/syrian-city.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { SetDefaultAddressDto } from '../dto/set-default-address.dto';
import { AddressType } from '../dto/create-address.dto';

describe('AddressesService', () => {
  let service: AddressesService;
  let addressRepository: Repository<Address>;
  let syrianAddressRepository: Repository<SyrianAddressEntity>;
  let userRepository: Repository<User>;
  let countryRepository: Repository<Country>;
  let regionRepository: Repository<Region>;
  let cityRepository: Repository<City>;

  const mockAddressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockSyrianAddressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockCountryRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockRegionRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockCityRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
        },
        {
          provide: getRepositoryToken(SyrianAddressEntity),
          useValue: mockSyrianAddressRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Country),
          useValue: mockCountryRepository,
        },
        {
          provide: getRepositoryToken(Region),
          useValue: mockRegionRepository,
        },
        {
          provide: getRepositoryToken(City),
          useValue: mockCityRepository,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
    addressRepository = module.get<Repository<Address>>(
      getRepositoryToken(Address),
    );
    syrianAddressRepository = module.get<Repository<SyrianAddressEntity>>(
      getRepositoryToken(SyrianAddressEntity),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    countryRepository = module.get<Repository<Country>>(
      getRepositoryToken(Country),
    );
    regionRepository = module.get<Repository<Region>>(
      getRepositoryToken(Region),
    );
    cityRepository = module.get<Repository<City>>(getRepositoryToken(City));

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required repositories injected', () => {
      expect(addressRepository).toBeDefined();
      expect(syrianAddressRepository).toBeDefined();
      expect(userRepository).toBeDefined();
      expect(countryRepository).toBeDefined();
      expect(regionRepository).toBeDefined();
      expect(cityRepository).toBeDefined();
    });
  });

  describe('Address Creation', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      addresses: [],
    } as any;

    const mockCountry = {
      id: 1,
      name: 'Syria',
      code: 'SY',
    } as Country;

    const mockRegion = {
      id: 1,
      name: 'Damascus',
      country: mockCountry,
    } as Region;

    const mockCity = {
      id: 1,
      name: 'Damascus',
      region: mockRegion,
    } as City;

    it('should create a new address successfully', async () => {
      const createAddressDto: CreateAddressDto = {
        label: 'Home',
        addressType: AddressType.SHIPPING,
        countryId: 1,
        regionId: 1,
        cityId: 1,
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        postalCode: '12345',
        phone: '+963-11-123456',
        notes: 'Ring the bell twice',
        isDefault: true,
        latitude: 33.5138,
        longitude: 36.2765,
      };

      const expectedAddress = {
        id: 1,
        user: mockUser,
        label: createAddressDto.label,
        addressType: createAddressDto.addressType,
        country: mockCountry,
        region: mockRegion,
        city: mockCity,
        addressLine1: createAddressDto.addressLine1,
        addressLine2: createAddressDto.addressLine2,
        postalCode: createAddressDto.postalCode,
        phone: createAddressDto.phone,
        notes: createAddressDto.notes,
        isDefault: createAddressDto.isDefault,
        latitude: createAddressDto.latitude,
        longitude: createAddressDto.longitude,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockCountryRepository.findOne.mockResolvedValue(mockCountry);
      mockRegionRepository.findOne.mockResolvedValue(mockRegion);
      mockCityRepository.findOne.mockResolvedValue(mockCity);
      mockAddressRepository.create.mockReturnValue(expectedAddress);
      mockAddressRepository.save.mockResolvedValue(expectedAddress);

      const result = await service.createAddress(createAddressDto, mockUser);

      expect(result).toEqual(expectedAddress);
      expect(mockAddressRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        label: createAddressDto.label,
        addressType: createAddressDto.addressType,
        country: mockCountry,
        region: mockRegion,
        city: mockCity,
        addressLine1: createAddressDto.addressLine1,
        addressLine2: createAddressDto.addressLine2,
        postalCode: createAddressDto.postalCode,
        phone: createAddressDto.phone,
        notes: createAddressDto.notes,
        isDefault: createAddressDto.isDefault,
        latitude: createAddressDto.latitude,
        longitude: createAddressDto.longitude,
      });
      expect(mockAddressRepository.save).toHaveBeenCalledWith(expectedAddress);
    });

    it('should handle Syrian-specific address fields', async () => {
      const createAddressDto: CreateAddressDto = {
        label: 'منزل', // Home in Arabic
        addressType: AddressType.SHIPPING,
        countryId: 1,
        regionId: 1,
        cityId: 1,
        addressLine1: 'شارع الثورة، بناء رقم 15',
        postalCode: '11001',
        phone: '+963-11-234567',
        isDefault: false,
        latitude: 33.5138,
        longitude: 36.2765,
      };

      const expectedAddress = {
        id: 2,
        user: mockUser,
        ...createAddressDto,
        country: mockCountry,
        region: mockRegion,
        city: mockCity,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address;

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockCountryRepository.findOne.mockResolvedValue(mockCountry);
      mockRegionRepository.findOne.mockResolvedValue(mockRegion);
      mockCityRepository.findOne.mockResolvedValue(mockCity);
      mockAddressRepository.create.mockReturnValue(expectedAddress);
      mockAddressRepository.save.mockResolvedValue(expectedAddress);

      const result = await service.createAddress(createAddressDto, mockUser);

      expect(result.label).toBe('منزل');
      expect(result.addressLine1).toBe('شارع الثورة، بناء رقم 15');
      expect(result.postalCode).toBe('11001');
      expect(mockAddressRepository.save).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const createAddressDto: CreateAddressDto = {
        label: 'Home',
        addressType: AddressType.SHIPPING,
        countryId: 1,
        addressLine1: '123 Main Street',
        phone: '+963-11-123456',
        isDefault: false,
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.createAddress(createAddressDto, mockUser),
      ).rejects.toThrow();
    });

    it('should throw error when country not found', async () => {
      const createAddressDto: CreateAddressDto = {
        label: 'Home',
        addressType: AddressType.SHIPPING,
        countryId: 999,
        addressLine1: '123 Main Street',
        phone: '+963-11-123456',
        isDefault: false,
      };

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockCountryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createAddress(createAddressDto, mockUser),
      ).rejects.toThrow();
    });
  });

  describe('Address Retrieval', () => {
    const mockAddresses = [
      {
        id: 1,
        label: 'Home',
        addressType: AddressType.SHIPPING,
        addressLine1: '123 Main Street',
        phone: '+963-11-123456',
        isDefault: true,
        user: { id: 1 },
      },
      {
        id: 2,
        label: 'Work',
        addressType: AddressType.BILLING,
        addressLine1: '456 Business Ave',
        phone: '+963-11-234567',
        isDefault: false,
        user: { id: 1 },
      },
    ] as Address[];

    it('should find all user addresses', async () => {
      mockAddressRepository.find.mockResolvedValue(mockAddresses);

      const result = await service.findAllByUser(1);

      expect(result).toEqual(mockAddresses);
      expect(mockAddressRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        relations: ['country', 'region', 'city'],
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });

    it('should find address by ID', async () => {
      const mockAddress = mockAddresses[0];
      mockAddressRepository.findOne.mockResolvedValue(mockAddress);

      const result = await service.findOneById(1);

      expect(result).toEqual(mockAddress);
      expect(mockAddressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'country', 'region', 'city'],
      });
    });

    it('should find default shipping address', async () => {
      const defaultShippingAddress = mockAddresses[0];
      mockAddressRepository.findOne.mockResolvedValue(defaultShippingAddress);

      const result = await service.findDefaultAddress(1, AddressType.SHIPPING);

      expect(result).toEqual(defaultShippingAddress);
      expect(mockAddressRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: 1 },
          addressType: AddressType.SHIPPING,
          isDefault: true,
        },
        relations: ['country', 'region', 'city'],
      });
    });

    it('should find addresses by type', async () => {
      const shippingAddresses = [mockAddresses[0]];
      mockAddressRepository.find.mockResolvedValue(shippingAddresses);

      const result = await service.findByType(1, AddressType.SHIPPING);

      expect(result).toEqual(shippingAddresses);
      expect(mockAddressRepository.find).toHaveBeenCalledWith({
        where: {
          user: { id: 1 },
          addressType: AddressType.SHIPPING,
        },
        relations: ['country', 'region', 'city'],
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });

    it('should return empty array when no addresses found', async () => {
      mockAddressRepository.find.mockResolvedValue([]);

      const result = await service.findAllByUser(999);

      expect(result).toEqual([]);
      expect(mockAddressRepository.find).toHaveBeenCalled();
    });
  });

  describe('Address Updates', () => {
    const mockAddress = {
      id: 1,
      label: 'Home',
      addressType: 'shipping',
      addressLine1: '123 Main Street',
      phone: '+963-11-123456',
      isDefault: false,
      user: { id: 1 },
    } as Address;

    it('should update address successfully', async () => {
      const updateAddressDto: UpdateAddressDto = {
        label: 'New Home',
        addressLine1: '456 New Street',
        phone: '+963-11-987654',
        notes: 'Updated notes',
      };

      const updatedAddress = {
        ...mockAddress,
        ...updateAddressDto,
      };

      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.save.mockResolvedValue(updatedAddress);

      const result = await service.updateById(1, updateAddressDto);

      expect(result).toEqual(updatedAddress);
      expect(mockAddressRepository.save).toHaveBeenCalledWith({
        ...mockAddress,
        ...updateAddressDto,
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateAddressDto = {
        notes: 'Only updating notes',
      };

      const updatedAddress = {
        ...mockAddress,
        notes: partialUpdate.notes,
      };

      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.save.mockResolvedValue(updatedAddress);

      const result = await service.updateById(1, partialUpdate);

      expect(result.notes).toBe('Only updating notes');
      expect(result.label).toBe(mockAddress.label); // Unchanged
      expect(mockAddressRepository.save).toHaveBeenCalled();
    });

    it('should update geographic coordinates', async () => {
      const updateWithCoordinates: UpdateAddressDto = {
        latitude: 36.2021,
        longitude: 37.1343,
      };

      const updatedAddress = {
        ...mockAddress,
        ...updateWithCoordinates,
      };

      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.save.mockResolvedValue(updatedAddress);

      const result = await service.updateById(1, updateWithCoordinates);

      expect(result.latitude).toBe(36.2021);
      expect(result.longitude).toBe(37.1343);
      expect(mockAddressRepository.save).toHaveBeenCalled();
    });

    it('should throw error when address not found for update', async () => {
      const updateAddressDto: UpdateAddressDto = {
        label: 'Non-existent',
      };

      mockAddressRepository.findOne.mockResolvedValue(null);

      await expect(service.updateById(999, updateAddressDto)).rejects.toThrow();
    });
  });

  describe('Default Address Management', () => {
    it('should set address as default successfully', async () => {
      const setDefaultDto: SetDefaultAddressDto = {
        addressType: AddressType.SHIPPING,
      };

      const mockAddress = {
        id: 1,
        user: { id: 1 },
        addressType: AddressType.SHIPPING,
        isDefault: false,
      } as Address;

      const updatedAddress = {
        ...mockAddress,
        isDefault: true,
      };

      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.update.mockResolvedValue({ affected: 2 });
      mockAddressRepository.save.mockResolvedValue(updatedAddress);

      const result = await service.setAsDefault(1, setDefaultDto);

      expect(result.isDefault).toBe(true);

      // Should first unset all defaults for this address type
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        {
          user: { id: 1 },
          addressType: AddressType.SHIPPING,
        },
        { isDefault: false },
      );

      // Then set the specified address as default
      expect(mockAddressRepository.save).toHaveBeenCalledWith({
        ...mockAddress,
        isDefault: true,
      });
    });

    it('should handle setting billing address as default', async () => {
      const setDefaultDto: SetDefaultAddressDto = {
        addressType: AddressType.BILLING,
      };

      const billingAddress = {
        id: 2,
        user: { id: 1 },
        addressType: AddressType.BILLING,
        isDefault: false,
      } as Address;

      mockAddressRepository.findOne.mockResolvedValue(billingAddress);
      mockAddressRepository.update.mockResolvedValue({ affected: 1 });
      mockAddressRepository.save.mockResolvedValue({
        ...billingAddress,
        isDefault: true,
      });

      const result = await service.setAsDefault(2, setDefaultDto);

      expect(result.isDefault).toBe(true);
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        {
          user: { id: 1 },
          addressType: AddressType.BILLING,
        },
        { isDefault: false },
      );
    });

    it('should throw error when setting non-existent address as default', async () => {
      const setDefaultDto: SetDefaultAddressDto = {
        addressType: AddressType.SHIPPING,
      };

      mockAddressRepository.findOne.mockResolvedValue(null);

      await expect(service.setAsDefault(999, setDefaultDto)).rejects.toThrow();
    });
  });

  describe('Address Deletion', () => {
    const mockAddress = {
      id: 1,
      user: { id: 1 },
      isDefault: false,
    } as Address;

    it('should soft delete address successfully', async () => {
      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.removeById(1);

      expect(result).toBe(true);
      expect(mockAddressRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should handle default address deletion appropriately', async () => {
      const defaultAddress = {
        ...mockAddress,
        isDefault: true,
      };

      mockAddressRepository.findOne.mockResolvedValue(defaultAddress);
      mockAddressRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.removeById(1);

      expect(result).toBe(true);
      expect(mockAddressRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw error when trying to delete non-existent address', async () => {
      mockAddressRepository.findOne.mockResolvedValue(null);

      await expect(service.removeById(999)).rejects.toThrow();
    });

    it('should handle deletion failure', async () => {
      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await service.removeById(1);

      expect(result).toBe(false);
    });
  });

  describe('Address Validation', () => {
    it('should validate Syrian phone numbers', async () => {
      const validSyrianPhones = [
        '+963-11-123456',
        '+963-21-234567',
        '+963-99-345678',
        '011-123456',
        '021-234567',
      ];

      validSyrianPhones.forEach((phone) => {
        expect(service.validateSyrianPhone(phone)).toBe(true);
      });
    });

    it('should reject invalid Syrian phone numbers', async () => {
      const invalidPhones = [
        '+1-555-123456', // US number
        '+44-20-123456', // UK number
        '123456', // Too short
        '+963-123', // Too short
        'invalid-phone', // Not a number
      ];

      invalidPhones.forEach((phone) => {
        expect(service.validateSyrianPhone(phone)).toBe(false);
      });
    });

    it('should validate Syrian postal codes', async () => {
      const validPostalCodes = [
        '11001',
        '11002',
        '12001',
        '21001',
        '21002',
        '22001',
        '31001',
        '32001',
        '41001',
        '42001',
      ];

      validPostalCodes.forEach((code) => {
        expect(service.validateSyrianPostalCode(code)).toBe(true);
      });
    });

    it('should reject invalid postal codes', async () => {
      const invalidCodes = [
        '00001', // Invalid region
        '99999', // Invalid format
        '1234', // Too short
        '123456', // Too long
        'ABCDE', // Non-numeric
      ];

      invalidCodes.forEach((code) => {
        expect(service.validateSyrianPostalCode(code)).toBe(false);
      });
    });
  });

  describe('Geographic Operations', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance from Damascus to Aleppo
      const damascusCoords = { lat: 33.5138, lon: 36.2765 };
      const aleppoCoords = { lat: 36.2021, lon: 37.1343 };

      const distance = service.calculateDistance(
        damascusCoords.lat,
        damascusCoords.lon,
        aleppoCoords.lat,
        aleppoCoords.lon,
      );

      expect(distance).toBeGreaterThan(300); // ~350km
      expect(distance).toBeLessThan(400);
    });

    it('should find addresses within radius', async () => {
      const centerCoords = { lat: 33.5138, lon: 36.2765 };
      const radiusKm = 50;

      const mockNearbyAddresses = [
        {
          id: 1,
          latitude: 33.52,
          longitude: 36.28,
          addressLine1: 'Near Damascus',
        },
        {
          id: 2,
          latitude: 33.51,
          longitude: 36.27,
          addressLine1: 'Also near Damascus',
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNearbyAddresses),
        getOne: jest.fn(),
        getCount: jest.fn(),
      };

      mockAddressRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAddressesNearby(
        centerCoords.lat,
        centerCoords.lon,
        radiusKm,
      );

      expect(result).toEqual(mockNearbyAddresses);
      expect(mockAddressRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('Bulk Operations', () => {
    it('should count user addresses', async () => {
      mockAddressRepository.count.mockResolvedValue(5);

      const result = await service.countUserAddresses(1);

      expect(result).toBe(5);
      expect(mockAddressRepository.count).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
    });

    it('should find addresses by governorate', async () => {
      const damascusAddresses = [
        { id: 1, region: { name: 'Damascus' } },
        { id: 2, region: { name: 'Damascus' } },
      ];

      mockAddressRepository.find.mockResolvedValue(damascusAddresses);

      const result = await service.findByGovernorate('Damascus');

      expect(result).toEqual(damascusAddresses);
      expect(mockAddressRepository.find).toHaveBeenCalledWith({
        where: { region: { name: 'Damascus' } },
        relations: ['user', 'country', 'region', 'city'],
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockAddressRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.findAllByUser(1)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle validation errors gracefully', async () => {
      const invalidDto = {
        countryId: 999, // Non-existent country
        addressLine1: 'Test Address',
        phone: '+963-11-123456',
      } as CreateAddressDto;

      mockUserRepository.findOneBy.mockResolvedValue({ id: 1 } as User);
      mockCountryRepository.findOne.mockResolvedValue(null); // Country not found

      await expect(
        service.createAddress(invalidDto, { id: 1 } as User),
      ).rejects.toThrow();
    });

    it('should handle concurrent default address updates', async () => {
      const mockAddress = {
        id: 1,
        user: { id: 1 },
        addressType: AddressType.SHIPPING,
        isDefault: false,
      } as Address;

      mockAddressRepository.findOne.mockResolvedValue(mockAddress);
      mockAddressRepository.update.mockRejectedValue(
        new Error('Concurrent modification'),
      );

      await expect(
        service.setAsDefault(1, { addressType: AddressType.SHIPPING }),
      ).rejects.toThrow('Concurrent modification');
    });
  });
});
