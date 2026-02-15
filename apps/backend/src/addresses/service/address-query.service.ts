/**
 * @file address-query.service.ts
 * @description Service responsible for address query operations.
 *
 * Handles read-only address lookups including:
 * - Finding all addresses by user ID
 * - Finding a single address by ID (admin/testing)
 * - Finding the default address for a user by type
 * - Finding addresses filtered by type
 * - Finding addresses by governorate name
 * - Counting a user's total addresses
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 God Service Refactor
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

/**
 * @class AddressQueryService
 * @description Provides read-only query methods for address lookups.
 *
 * Extracted from AddressesService to follow the Single Responsibility
 * Principle. All methods are pure queries with no side effects.
 */
@Injectable()
export class AddressQueryService {
  private readonly logger = new Logger(AddressQueryService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  /**
   * Get all addresses for a user by user ID.
   *
   * @description Retrieves all addresses belonging to a user, sorted by
   * default status (default first) then creation date (newest first).
   * Includes country, region, and city relations.
   *
   * @param userId - The user's numeric ID
   * @returns Array of addresses with relations loaded
   */
  async findAllByUser(userId: number): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user: { id: userId } },
      relations: ['country', 'region', 'city'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find a single address by its ID without user restriction.
   *
   * @description Admin/testing method that retrieves an address by its
   * primary key without verifying user ownership. Includes user, country,
   * region, and city relations.
   *
   * @param id - The address primary key
   * @returns The address entity or null if not found
   */
  async findOneById(id: number): Promise<Address | null> {
    return this.addressRepo.findOne({
      where: { id },
      relations: ['user', 'country', 'region', 'city'],
    });
  }

  /**
   * Find the default address for a user by address type.
   *
   * @description Retrieves the address marked as default for the given
   * user and address type (shipping or billing).
   *
   * @param userId - The user's numeric ID
   * @param addressType - Either 'shipping' or 'billing'
   * @returns The default address or null if none is set
   */
  async findDefaultAddress(
    userId: number,
    addressType: 'shipping' | 'billing',
  ): Promise<Address | null> {
    return this.addressRepo.findOne({
      where: {
        user: { id: userId },
        addressType,
        isDefault: true,
      },
      relations: ['country', 'region', 'city'],
    });
  }

  /**
   * Find all addresses for a user filtered by address type.
   *
   * @description Retrieves addresses matching the specified type,
   * sorted by default status then creation date.
   *
   * @param userId - The user's numeric ID
   * @param addressType - Either 'shipping' or 'billing'
   * @returns Array of addresses matching the type
   */
  async findByType(
    userId: number,
    addressType: 'shipping' | 'billing',
  ): Promise<Address[]> {
    return this.addressRepo.find({
      where: {
        user: { id: userId },
        addressType,
      },
      relations: ['country', 'region', 'city'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find addresses by governorate (region) name.
   *
   * @description Searches addresses where the region name matches
   * the provided governorate name. Useful for admin/reporting.
   *
   * @param governorateName - The governorate/region name to match
   * @returns Array of addresses in the specified governorate
   */
  async findByGovernorate(governorateName: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { region: { name: governorateName } },
      relations: ['user', 'country', 'region', 'city'],
    });
  }

  /**
   * Count the total number of addresses for a user.
   *
   * @description Returns the count of non-deleted addresses belonging
   * to the specified user. Used for business rule validation (e.g.,
   * preventing deletion of the only remaining address).
   *
   * @param userId - The user's numeric ID
   * @returns The number of addresses the user has
   */
  async countUserAddresses(userId: number): Promise<number> {
    return this.addressRepo.count({
      where: { user: { id: userId } },
    });
  }
}
