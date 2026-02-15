/**
 * @file addresses.service.ts
 * @description Core address service for generic address CRUD operations.
 *
 * Handles generic (non-Syrian-specific) address management:
 * - Creating addresses with country/region/city relations
 * - Updating addresses with ownership verification
 * - Removing addresses (soft-delete)
 * - Finding all/single addresses for a user
 * - Setting default address (transactional)
 * - Admin/testing utility methods (createAddress, updateById, setAsDefault, removeById)
 *
 * Syrian-specific operations are handled by SyrianAddressCrudService.
 * Query-only operations are handled by AddressQueryService.
 * Validation/geospatial utilities are handled by AddressValidationService.
 *
 * @author SouqSyria Development Team
 * @version 2.0.0 - MVP1 God Service Refactor
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Address } from '../entities/address.entity';
import { User } from '../../users/entities/user.entity';
import { CreateAddressDto, AddressType } from '../dto/create-address.dto';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { City } from '../city/entities/city.entity';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { SetDefaultAddressDto } from '../dto/set-default-address.dto';

/**
 * @class AddressesService
 * @description Core service for generic address CRUD operations.
 *
 * After the God Service refactor, this service retains only generic
 * address operations that use the country/region/city hierarchy.
 * Syrian-specific, query-only, and validation methods have been
 * extracted into dedicated services.
 */
@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new address for a user, handling relations and default flag.
   *
   * @description Validates country, region, and city references, then
   * creates the address. If isDefault is set, unsets previous defaults
   * for the same user and address type.
   *
   * @param user - The authenticated user
   * @param dto - Address creation data
   * @returns The created address entity
   *
   * @throws BadRequestException if country, region, or city is invalid
   */
  async create(user: User, dto: CreateAddressDto): Promise<Address> {
    const country = await this.countryRepo.findOne({
      where: { id: dto.countryId },
    });
    if (!country) throw new BadRequestException('Invalid country');

    let region = null;
    if (dto.regionId) {
      region = await this.regionRepo.findOne({
        where: { id: dto.regionId, country: { id: country.id } },
      });
      if (!region) throw new BadRequestException('Invalid region for country');
    }

    let city = null;
    if (dto.cityId) {
      city = await this.cityRepo.findOne({
        where: { id: dto.cityId, country: { id: country.id } },
      });
      if (!city) throw new BadRequestException('Invalid city for country');
    }

    // If isDefault, unset default for this user/type
    if (dto.isDefault) {
      await this.addressRepo.update(
        {
          user: { id: user.id },
          addressType: dto.addressType || AddressType.SHIPPING,
        },
        { isDefault: false },
      );
    }

    const address = this.addressRepo.create({
      ...dto,
      user,
      country,
      region,
      city,
      isDefault: dto.isDefault || false,
      addressType: dto.addressType || AddressType.SHIPPING,
    });

    return this.addressRepo.save(address);
  }

  /**
   * Update an existing address (only if user owns it).
   *
   * @description Verifies user ownership, re-validates changed relations,
   * maps safe fields to prevent mass assignment, and handles default
   * address toggling.
   *
   * @param user - The authenticated user
   * @param addressId - The address ID to update
   * @param dto - Updated address fields
   * @returns The updated address entity
   *
   * @throws NotFoundException if address not found or not owned by user
   * @throws BadRequestException if country, region, or city is invalid
   */
  async update(
    user: User,
    addressId: number,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: user.id } },
      relations: ['country', 'region', 'city'],
    });
    if (!address) throw new NotFoundException('Address not found');

    // If updating country, region, city, revalidate them
    if (dto.countryId) {
      const country = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });
      if (!country) throw new BadRequestException('Invalid country');
      address.country = country;
    }
    if (dto.regionId) {
      const region = await this.regionRepo.findOne({
        where: { id: dto.regionId },
      });
      if (!region) throw new BadRequestException('Invalid region');
      address.region = region;
    }
    if (dto.cityId) {
      const city = await this.cityRepo.findOne({ where: { id: dto.cityId } });
      if (!city) throw new BadRequestException('Invalid city');
      address.city = city;
    }

    // Explicitly map safe fields to prevent mass assignment
    if (dto.label !== undefined) address.label = dto.label;
    if (dto.addressLine1 !== undefined) address.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) address.addressLine2 = dto.addressLine2;
    if (dto.postalCode !== undefined) address.postalCode = dto.postalCode;
    if (dto.phone !== undefined) address.phone = dto.phone;
    if (dto.notes !== undefined) address.notes = dto.notes;
    if (dto.latitude !== undefined) address.latitude = dto.latitude;
    if (dto.longitude !== undefined) address.longitude = dto.longitude;

    // If isDefault is being set, unset others
    if (dto.isDefault) {
      await this.addressRepo.update(
        { user: { id: user.id }, addressType: address.addressType },
        { isDefault: false },
      );
      address.isDefault = true;
    }

    return this.addressRepo.save(address);
  }

  /**
   * Remove (soft-delete) an address (only if user owns it).
   *
   * @description Verifies user ownership then performs a soft delete.
   *
   * @param user - The authenticated user
   * @param addressId - The address ID to remove
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async remove(user: User, addressId: number): Promise<void> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: user.id } },
    });
    if (!address) throw new NotFoundException('Address not found');
    await this.addressRepo.softRemove(address);
  }

  /**
   * Get all addresses for a user (optionally filter by type).
   *
   * @description Retrieves all addresses for the authenticated user,
   * including both generic and Syrian relations. Sorted by default
   * status then creation date.
   *
   * @param user - The authenticated user
   * @param type - Optional address type filter (shipping/billing)
   * @returns Array of addresses with all relations loaded
   */
  async findAll(user: User, type?: AddressType): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user: { id: user.id }, ...(type ? { addressType: type } : {}) },
      relations: ['country', 'region', 'city', 'governorate', 'syrianCity', 'district'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Set an address as default for a user (per type).
   *
   * @description Uses a database transaction to ensure atomicity when
   * unsetting previous defaults and setting the new default address.
   *
   * @param user - The authenticated user
   * @param addressId - The address ID to set as default
   * @returns The updated default address
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async setDefault(user: User, addressId: number): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(Address, {
        where: { id: addressId, user: { id: user.id } },
      });
      if (!address) throw new NotFoundException('Address not found');

      await queryRunner.manager.update(
        Address,
        { user: { id: user.id }, addressType: address.addressType },
        { isDefault: false },
      );
      address.isDefault = true;
      const saved = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get a single address by ID (if owned by user).
   *
   * @description Retrieves one address with all relations (generic and
   * Syrian) loaded, verifying user ownership.
   *
   * @param user - The authenticated user
   * @param addressId - The address ID to retrieve
   * @returns The address entity with all relations
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async findOne(user: User, addressId: number): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: user.id } },
      relations: ['country', 'region', 'city', 'governorate', 'syrianCity', 'district'],
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  /**
   * Create address with entity objects or IDs (backward-compatible utility).
   *
   * @description Supports both entity object and ID-based address creation
   * for backward compatibility. Used primarily in testing and seeding.
   *
   * @param createAddressDto - Address creation data (loosely typed for flexibility)
   * @param user - The user to associate the address with
   * @returns The created address entity
   *
   * @throws BadRequestException if country, region, or city ID is invalid
   */
  async createAddress(createAddressDto: any, user: User): Promise<Address> {
    const country = createAddressDto.countryId
      ? await this.countryRepo.findOne({
          where: { id: createAddressDto.countryId },
        })
      : null;

    const region = createAddressDto.regionId
      ? await this.regionRepo.findOne({
          where: { id: createAddressDto.regionId },
        })
      : null;

    const city = createAddressDto.cityId
      ? await this.cityRepo.findOne({ where: { id: createAddressDto.cityId } })
      : null;

    if (createAddressDto.countryId && !country) {
      throw new BadRequestException('Invalid country ID');
    }

    if (createAddressDto.regionId && !region) {
      throw new BadRequestException('Invalid region ID');
    }

    if (createAddressDto.cityId && !city) {
      throw new BadRequestException('Invalid city ID');
    }

    const address = this.addressRepo.create({
      user,
      country,
      region,
      city,
      label: createAddressDto.label,
      addressType: createAddressDto.addressType || AddressType.SHIPPING,
      addressLine1: createAddressDto.addressLine1,
      addressLine2: createAddressDto.addressLine2,
      postalCode: createAddressDto.postalCode,
      phone: createAddressDto.phone,
      notes: createAddressDto.notes,
      isDefault: createAddressDto.isDefault || false,
      latitude: createAddressDto.latitude,
      longitude: createAddressDto.longitude,
    });

    // Handle default address logic
    if (createAddressDto.isDefault) {
      await this.addressRepo.update(
        { user: { id: user.id }, addressType: address.addressType },
        { isDefault: false },
      );
    }

    return this.addressRepo.save(address);
  }

  /**
   * Update address by ID without user ownership check (admin/testing).
   *
   * @description Updates an address by its primary key. Does not verify
   * user ownership, intended for admin operations and testing.
   *
   * @param id - The address primary key
   * @param updateAddressDto - Updated address fields
   * @returns The updated address entity
   *
   * @throws NotFoundException if address not found
   */
  async updateById(
    id: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id },
      relations: ['user', 'country', 'region', 'city'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Explicitly map safe fields to prevent mass assignment
    if (updateAddressDto.label !== undefined) address.label = updateAddressDto.label;
    if (updateAddressDto.addressLine1 !== undefined) address.addressLine1 = updateAddressDto.addressLine1;
    if (updateAddressDto.addressLine2 !== undefined) address.addressLine2 = updateAddressDto.addressLine2;
    if (updateAddressDto.postalCode !== undefined) address.postalCode = updateAddressDto.postalCode;
    if (updateAddressDto.phone !== undefined) address.phone = updateAddressDto.phone;
    if (updateAddressDto.notes !== undefined) address.notes = updateAddressDto.notes;
    if (updateAddressDto.latitude !== undefined) address.latitude = updateAddressDto.latitude;
    if (updateAddressDto.longitude !== undefined) address.longitude = updateAddressDto.longitude;

    return this.addressRepo.save(address);
  }

  /**
   * Set address as default by ID and type (admin/testing).
   *
   * @description Sets an address as default for the specified type.
   * Does not use transactions (admin/testing convenience method).
   *
   * @param id - The address primary key
   * @param setDefaultDto - Contains the addressType
   * @returns The updated address entity
   *
   * @throws NotFoundException if address not found
   */
  async setAsDefault(
    id: number,
    setDefaultDto: SetDefaultAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Unset all defaults for this address type
    await this.addressRepo.update(
      {
        user: { id: address.user.id },
        addressType: setDefaultDto.addressType,
      },
      { isDefault: false },
    );

    // Set this address as default
    address.isDefault = true;
    return this.addressRepo.save(address);
  }

  /**
   * Remove address by ID (admin/testing - returns boolean).
   *
   * @description Soft-deletes an address by its primary key without
   * user ownership verification. Returns whether the deletion affected
   * any rows.
   *
   * @param id - The address primary key
   * @returns true if the address was deleted
   *
   * @throws NotFoundException if address not found
   */
  async removeById(id: number): Promise<boolean> {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const result = await this.addressRepo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
