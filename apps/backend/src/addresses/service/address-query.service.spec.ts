/**
 * @file address-query.service.spec.ts
 * @description Unit tests for AddressQueryService
 *
 * Tests cover:
 * - Service instantiation
 * - findAllByUser - Returns addresses for a user
 * - findOneById - Returns a single address by ID
 * - findDefaultAddress - Returns the default address for a type
 * - countUserAddresses - Returns the count of user addresses
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 God Service Refactor
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressQueryService } from './address-query.service';
import { Address } from '../entities/address.entity';

describe('AddressQueryService', () => {
  let service: AddressQueryService;
  let addressRepo: jest.Mocked<Repository<Address>>;

  const mockAddress = {
    id: 1,
    user: { id: 1 },
    label: 'home',
    addressType: 'shipping',
    isDefault: true,
    createdAt: new Date(),
  } as unknown as Address;

  beforeEach(async () => {
    const mockAddressRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressQueryService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepo,
        },
      ],
    }).compile();

    service = module.get<AddressQueryService>(AddressQueryService);
    addressRepo = module.get(getRepositoryToken(Address));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return addresses for a user sorted by default and creation date', async () => {
      // Arrange
      const userId = 1;
      const addresses = [mockAddress];
      addressRepo.find.mockResolvedValue(addresses);

      // Act
      const result = await service.findAllByUser(userId);

      // Assert
      expect(result).toEqual(addresses);
      expect(addressRepo.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['country', 'region', 'city'],
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });

    it('should return empty array if user has no addresses', async () => {
      // Arrange
      addressRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAllByUser(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findOneById', () => {
    it('should return an address by ID with relations', async () => {
      // Arrange
      addressRepo.findOne.mockResolvedValue(mockAddress);

      // Act
      const result = await service.findOneById(1);

      // Assert
      expect(result).toEqual(mockAddress);
      expect(addressRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'country', 'region', 'city'],
      });
    });

    it('should return null if address not found', async () => {
      // Arrange
      addressRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findOneById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findDefaultAddress', () => {
    it('should return the default shipping address for a user', async () => {
      // Arrange
      addressRepo.findOne.mockResolvedValue(mockAddress);

      // Act
      const result = await service.findDefaultAddress(1, 'shipping');

      // Assert
      expect(result).toEqual(mockAddress);
      expect(addressRepo.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: 1 },
          addressType: 'shipping',
          isDefault: true,
        },
        relations: ['country', 'region', 'city'],
      });
    });

    it('should return null if no default address exists', async () => {
      // Arrange
      addressRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findDefaultAddress(1, 'billing');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('countUserAddresses', () => {
    it('should return the count of user addresses', async () => {
      // Arrange
      addressRepo.count.mockResolvedValue(3);

      // Act
      const result = await service.countUserAddresses(1);

      // Assert
      expect(result).toBe(3);
      expect(addressRepo.count).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
    });

    it('should return 0 if user has no addresses', async () => {
      // Arrange
      addressRepo.count.mockResolvedValue(0);

      // Act
      const result = await service.countUserAddresses(999);

      // Assert
      expect(result).toBe(0);
    });
  });
});
