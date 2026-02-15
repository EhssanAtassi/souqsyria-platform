/**
 * @file addresses.service.spec.ts
 * @description Unit tests for AddressesService (generic address operations)
 *
 * After the God Service refactor, this spec covers only the generic
 * address operations that remain in AddressesService:
 * - Address CRUD operations (create, update, remove, findAll, findOne)
 * - Default address management (setDefault, setAsDefault)
 * - Admin/testing utilities (createAddress, updateById, removeById)
 *
 * Syrian-specific, query, and validation tests are in their respective
 * service spec files.
 *
 * @author SouqSyria Development Team
 * @version 2.0.0 - Updated for God Service Refactor
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AddressesService } from './addresses.service';
import { Address } from '../entities/address.entity';
import { User } from '../../users/entities/user.entity';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { City } from '../city/entities/city.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { SetDefaultAddressDto } from '../dto/set-default-address.dto';
import { AddressType } from '../dto/create-address.dto';

describe('AddressesService', () => {
  let service: AddressesService;
  let addressRepository: Repository<Address>;

  const mockAddressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
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
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
    addressRepository = module.get<Repository<Address>>(
      getRepositoryToken(Address),
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
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
        label: '\u0645\u0646\u0632\u0644', // Home in Arabic
        addressType: AddressType.SHIPPING,
        countryId: 1,
        regionId: 1,
        cityId: 1,
        addressLine1: '\u0634\u0627\u0631\u0639 \u0627\u0644\u062b\u0648\u0631\u0629\u060c \u0628\u0646\u0627\u0621 \u0631\u0642\u0645 15',
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
      } as unknown as Address;

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockCountryRepository.findOne.mockResolvedValue(mockCountry);
      mockRegionRepository.findOne.mockResolvedValue(mockRegion);
      mockCityRepository.findOne.mockResolvedValue(mockCity);
      mockAddressRepository.create.mockReturnValue(expectedAddress);
      mockAddressRepository.save.mockResolvedValue(expectedAddress);

      const result = await service.createAddress(createAddressDto, mockUser);

      expect(result.postalCode).toBe('11001');
      expect(mockAddressRepository.save).toHaveBeenCalled();
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

  describe('Error Handling', () => {
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
