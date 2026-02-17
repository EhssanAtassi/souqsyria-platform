/**
 * @file syrian-address-crud.service.ts
 * @description Service responsible for Syrian-specific address CRUD operations.
 *
 * Handles the full lifecycle of Syrian addresses:
 * - Creating Syrian addresses with hierarchy validation
 * - Updating Syrian addresses with re-validation
 * - Deleting Syrian addresses with business rule checks
 * - Setting default Syrian address (transactional)
 * - Finding all/single Syrian addresses with full relations
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 God Service Refactor
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
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';
import { UpdateSyrianAddressDto } from '../dto/update-syrian-address.dto';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';
import { GovernorateCityValidator } from '../validators/valid-governorate-city.validator';
import { AddressQueryService } from './address-query.service';

/**
 * @class SyrianAddressCrudService
 * @description Manages Syrian-specific address CRUD operations with full
 * validation of the Syrian administrative hierarchy (governorate -> city -> district).
 *
 * Extracted from AddressesService to isolate Syrian-specific business logic
 * from generic address operations. Uses the GovernorateCityValidator for
 * hierarchy validation and AddressQueryService for count checks.
 */
@Injectable()
export class SyrianAddressCrudService {
  private readonly logger = new Logger(SyrianAddressCrudService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(SyrianGovernorateEntity)
    private readonly govRepo: Repository<SyrianGovernorateEntity>,
    @InjectRepository(SyrianCityEntity)
    private readonly syrianCityRepo: Repository<SyrianCityEntity>,
    @InjectRepository(SyrianDistrictEntity)
    private readonly districtRepo: Repository<SyrianDistrictEntity>,
    private readonly validator: GovernorateCityValidator,
    private readonly dataSource: DataSource,
    private readonly addressQueryService: AddressQueryService,
  ) {}

  /**
   * Create a Syrian address with full validation.
   *
   * @description Creates a new address using the Syrian administrative
   * hierarchy. Validates the governorate -> city -> district chain,
   * ensures delivery is supported in the area, validates phone format,
   * and handles default address logic atomically in a transaction.
   *
   * @param user - The user creating the address
   * @param dto - Syrian address data including governorateId, cityId, etc.
   * @returns Created address entity with Syrian relations
   *
   * @throws BadRequestException if hierarchy validation fails
   *
   * @example
   * ```typescript
   * const address = await service.createSyrianAddress(user, {
   *   fullName: 'Ahmad',
   *   phone: '+963912345678',
   *   governorateId: 1,
   *   cityId: 5,
   *   street: 'Al-Thawra Street',
   *   isDefault: true,
   * });
   * ```
   */
  async createSyrianAddress(
    user: User,
    dto: CreateSyrianAddressDto,
  ): Promise<Address> {
    // Step 1: Validate Syrian administrative hierarchy
    const validationResult = await this.validator.validate(
      dto.governorateId,
      dto.cityId,
      dto.districtId,
    );

    if (!validationResult.valid) {
      throw new BadRequestException(
        `Address validation failed: ${validationResult.errors.join(', ')}`,
      );
    }

    // Step 2: Fetch Syrian entities
    const governorate = await this.govRepo.findOne({
      where: { id: dto.governorateId },
    });
    const syrianCity = await this.syrianCityRepo.findOne({
      where: { id: dto.cityId },
    });
    const district = dto.districtId
      ? await this.districtRepo.findOne({ where: { id: dto.districtId } })
      : null;

    // Step 3: Handle default address logic and creation inside a transaction
    // to prevent race conditions when setting default addresses
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear existing default address if this address should be the default
      if (dto.isDefault) {
        await queryRunner.manager.update(
          Address,
          { user: { id: user.id } },
          { isDefault: false },
        );
      }

      // Create address entity using repository create method
      const address = this.addressRepo.create({
        user,
        fullName: dto.fullName,
        phone: dto.phone,
        governorate,
        syrianCity,
        district,
        addressLine1: dto.street, // Map street to addressLine1 for backward compatibility
        building: dto.building,
        floor: dto.floor,
        additionalDetails: dto.additionalDetails,
        isDefault: dto.isDefault || false,
        label: dto.label || 'home',
        addressType: 'shipping', // Default for Syrian addresses
      });

      // Save using the queryRunner manager to ensure it's part of the transaction
      const savedAddress = await queryRunner.manager.save(Address, address);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Created Syrian address ${savedAddress.id} for user ${user.id} ` +
          `in ${governorate?.nameEn} -> ${syrianCity?.nameEn}`,
      );

      return savedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update a Syrian address with re-validation if geographic fields change.
   *
   * @description Updates an existing Syrian address. If governorate, city,
   * or district IDs are being changed, re-validates the hierarchy. Handles
   * default address toggling logic atomically in a transaction.
   *
   * @param user - The user updating the address
   * @param id - Address ID to update
   * @param dto - Updated Syrian address data (partial)
   * @returns Updated address entity
   *
   * @throws NotFoundException if address not found or not owned by user
   * @throws BadRequestException if hierarchy validation fails
   */
  async updateSyrianAddress(
    user: User,
    id: number,
    dto: UpdateSyrianAddressDto,
  ): Promise<Address> {
    // Step 1: Find and verify ownership
    const address = await this.addressRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['governorate', 'syrianCity', 'district'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Step 2: Validate hierarchy if geographic fields are being updated
    if (dto.governorateId || dto.cityId || dto.districtId) {
      const governorateId = dto.governorateId || address.governorate?.id;
      const cityId = dto.cityId || address.syrianCity?.id;
      const districtId = dto.districtId || address.district?.id;

      if (governorateId && cityId) {
        const validationResult = await this.validator.validate(
          governorateId,
          cityId,
          districtId,
        );

        if (!validationResult.valid) {
          throw new BadRequestException(
            `Address validation failed: ${validationResult.errors.join(', ')}`,
          );
        }
      }
    }

    // Step 3: Update Syrian entity relations if provided
    if (dto.governorateId) {
      address.governorate = await this.govRepo.findOne({
        where: { id: dto.governorateId },
      });
    }
    if (dto.cityId) {
      address.syrianCity = await this.syrianCityRepo.findOne({
        where: { id: dto.cityId },
      });
    }
    if (dto.districtId) {
      address.district = await this.districtRepo.findOne({
        where: { id: dto.districtId },
      });
    }

    // Step 4: Update simple fields
    if (dto.fullName !== undefined) address.fullName = dto.fullName;
    if (dto.phone !== undefined) address.phone = dto.phone;
    if (dto.street !== undefined) {
      address.addressLine1 = dto.street; // Map street to addressLine1 for backward compatibility
    }
    if (dto.building !== undefined) address.building = dto.building;
    if (dto.floor !== undefined) address.floor = dto.floor;
    if (dto.additionalDetails !== undefined)
      address.additionalDetails = dto.additionalDetails;
    if (dto.label !== undefined) address.label = dto.label;

    // Step 5: Handle default address logic inside a transaction
    // to prevent race conditions when setting default addresses
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear existing default address if this address should be set as default
      if (dto.isDefault === true) {
        await queryRunner.manager.update(
          Address,
          { user: { id: user.id } },
          { isDefault: false },
        );
        address.isDefault = true;
      } else if (dto.isDefault === false) {
        address.isDefault = false;
      }

      const updatedAddress = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();

      this.logger.log(`Updated Syrian address ${id} for user ${user.id}`);

      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a Syrian address with business rule checks (soft delete).
   *
   * @description Soft-deletes a Syrian address after verifying:
   * 1. The address exists and is owned by the user
   * 2. It is not the user's only remaining address
   * 3. It is not the current default address
   *
   * @param user - The user deleting the address
   * @param id - Address ID to delete
   *
   * @throws NotFoundException if address not found or not owned by user
   * @throws BadRequestException if it is the only address or the default address
   */
  async deleteSyrianAddress(user: User, id: number): Promise<void> {
    // Step 1: Find and verify ownership
    const address = await this.addressRepo.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Step 2: Check if this is the only address
    const addressCount = await this.addressQueryService.countUserAddresses(
      user.id,
    );
    if (addressCount === 1) {
      throw new BadRequestException(
        'Cannot delete your only address. Please add another address first.',
      );
    }

    // Step 3: Prevent deletion of default address
    if (address.isDefault) {
      throw new BadRequestException(
        'Cannot delete default address. Please set another address as default first.',
      );
    }

    // Step 4: Soft delete
    await this.addressRepo.softRemove(address);

    this.logger.log(`Deleted Syrian address ${id} for user ${user.id}`);
  }

  /**
   * Set a Syrian address as the default using a database transaction.
   *
   * @description Atomically unsets all other default addresses for the user
   * and sets the specified address as default. Uses a QueryRunner transaction
   * to ensure consistency.
   *
   * @param user - The user setting the default address
   * @param id - Address ID to set as default
   * @returns Updated address entity with Syrian relations
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async setDefaultSyrianAddress(user: User, id: number): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(Address, {
        where: { id, user: { id: user.id } },
        relations: ['governorate', 'syrianCity', 'district'],
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }

      await queryRunner.manager.update(
        Address,
        { user: { id: user.id } },
        { isDefault: false },
      );

      address.isDefault = true;
      const updatedAddress = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();

      this.logger.log(`Set address ${id} as default for user ${user.id}`);

      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all Syrian addresses for a user with full relations.
   *
   * @description Retrieves all addresses belonging to the user with
   * governorate, syrianCity, and district relations loaded. Sorted
   * by default status (default first) then creation date (newest first).
   * Uses QueryBuilder to ensure a single JOIN query and prevent N+1 issues.
   *
   * @param user - The user whose addresses to retrieve
   * @returns Array of addresses sorted by default status and creation date
   */
  async findAllSyrianAddresses(user: User): Promise<Address[]> {
    return this.addressRepo
      .createQueryBuilder('address')
      .leftJoinAndSelect('address.governorate', 'governorate')
      .leftJoinAndSelect('address.syrianCity', 'syrianCity')
      .leftJoinAndSelect('address.district', 'district')
      .where('address.user = :userId', { userId: user.id })
      .orderBy('address.isDefault', 'DESC')
      .addOrderBy('address.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find a single Syrian address by ID with full relations.
   *
   * @description Retrieves one address by ID, verifying user ownership.
   * Loads governorate, syrianCity, and district relations.
   * Uses QueryBuilder to ensure a single JOIN query and prevent N+1 issues.
   *
   * @param user - The user requesting the address
   * @param id - Address ID
   * @returns Address entity with Syrian relations
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async findOneSyrianAddress(user: User, id: number): Promise<Address> {
    const address = await this.addressRepo
      .createQueryBuilder('address')
      .leftJoinAndSelect('address.governorate', 'governorate')
      .leftJoinAndSelect('address.syrianCity', 'syrianCity')
      .leftJoinAndSelect('address.district', 'district')
      .where('address.id = :id', { id })
      .andWhere('address.user = :userId', { userId: user.id })
      .getOne();

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }
}
