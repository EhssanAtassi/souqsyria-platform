import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';
import { User } from '../../users/entities/user.entity';
import { CreateAddressDto, AddressType } from '../dto/create-address.dto';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { City } from '../city/entities/city.entity';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { SetDefaultAddressDto } from '../dto/set-default-address.dto';
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';
import { UpdateSyrianAddressDto } from '../dto/update-syrian-address.dto';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';
import { GovernorateCityValidator } from '../validators/valid-governorate-city.validator';

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
    @InjectRepository(SyrianGovernorateEntity)
    private readonly govRepo: Repository<SyrianGovernorateEntity>,
    @InjectRepository(SyrianCityEntity)
    private readonly syrianCityRepo: Repository<SyrianCityEntity>,
    @InjectRepository(SyrianDistrictEntity)
    private readonly districtRepo: Repository<SyrianDistrictEntity>,
    private readonly validator: GovernorateCityValidator,
  ) {}

  /**
   * Create a new address for a user, handling relations and default flag.
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
      const city = await this.cityRepo.findOne({ where: { id: dto.cityId } })!;
      if (!city) throw new BadRequestException('Invalid city');
      address.city = city;
    }

    Object.assign(address, dto);

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
   */
  async setDefault(user: User, addressId: number): Promise<Address> {
    return this.addressRepo.manager.transaction(async (manager) => {
      const address = await manager.findOne(Address, {
        where: { id: addressId, user: { id: user.id } },
      });
      if (!address) throw new NotFoundException('Address not found');

      await manager.update(
        Address,
        { user: { id: user.id }, addressType: address.addressType },
        { isDefault: false },
      );
      address.isDefault = true;
      return manager.save(address);
    });
  }

  /**
   * Get a single address by ID (if owned by user).
   */
  async findOne(user: User, addressId: number): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: user.id } },
      relations: ['country', 'region', 'city', 'governorate', 'syrianCity', 'district'],
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  // Additional utility methods for testing and seeding

  /**
   * Get all addresses for a user by ID (for testing/seeding)
   */
  async findAllByUser(userId: number): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user: { id: userId } },
      relations: ['country', 'region', 'city'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find address by ID without user restriction.
   * @internal Admin/testing only - not exposed via any controller route.
   * Do NOT call from user-facing code without adding ownership checks.
   */
  async findOneById(id: number): Promise<Address | null> {
    return this.addressRepo.findOne({
      where: { id },
      relations: ['user', 'country', 'region', 'city'],
    });
  }

  /**
   * Create address with entity objects or IDs (supports both patterns for backward compatibility)
   */
  async createAddress(createAddressDto: any, user: User): Promise<Address> {
    // Get country, region, city from the dto
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
   * Update address by ID without user restriction.
   * @internal Admin/testing only - not exposed via any controller route.
   * Do NOT call from user-facing code without adding ownership checks.
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

    // Update fields
    Object.assign(address, updateAddressDto);

    return this.addressRepo.save(address);
  }

  /**
   * Find default address by type
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
   * Find addresses by type
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
   * Set address as default
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
   * Remove address by ID without user restriction.
   * @internal Admin/testing only - not exposed via any controller route.
   * Do NOT call from user-facing code without adding ownership checks.
   */
  async removeById(id: number): Promise<boolean> {
    const address = await this.addressRepo.findOne({ where: { id } })!;
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const result = await this.addressRepo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Validate Syrian phone number
   */
  validateSyrianPhone(phone: string): boolean {
    // Syrian phone number patterns
    const syrianPatterns = [
      /^\+963-\d{2}-\d{6,7}$/, // +963-11-123456
      /^0\d{2}-\d{6,7}$/, // 011-123456
      /^\+963\d{8,9}$/, // +963111234567
    ];

    return syrianPatterns.some((pattern) => pattern.test(phone));
  }

  /**
   * Validate Syrian postal code
   */
  validateSyrianPostalCode(postalCode: string): boolean {
    // Syrian postal codes: 5 digits, first 2 digits indicate region
    const validRegions = [
      '11',
      '12',
      '21',
      '22',
      '31',
      '32',
      '33',
      '41',
      '42',
      '43',
      '51',
      '53',
      '61',
      '63',
    ];

    if (!/^\d{5}$/.test(postalCode)) {
      return false;
    }

    const regionCode = postalCode.substring(0, 2);
    return validRegions.includes(regionCode);
  }

  /**
   * Calculate distance between coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) *
        Math.cos(this.degToRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Find addresses within radius (geo-proximity search).
   * @internal Admin/testing only - not exposed via any controller route.
   * Do NOT call from user-facing code without adding ownership checks.
   */
  async findAddressesNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Address[]> {
    // Using a simple bounding box approach for database efficiency
    const latDiff = radiusKm / 111; // Rough conversion: 1 degree lat ≈ 111 km
    const lonDiff = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    return this.addressRepo
      .createQueryBuilder('address')
      .where('address.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDiff,
        maxLat: latitude + latDiff,
      })
      .andWhere('address.longitude BETWEEN :minLon AND :maxLon', {
        minLon: longitude - lonDiff,
        maxLon: longitude + lonDiff,
      })
      .getMany();
  }

  /**
   * Count user addresses
   */
  async countUserAddresses(userId: number): Promise<number> {
    return this.addressRepo.count({
      where: { user: { id: userId } },
    });
  }

  /**
   * Find addresses by governorate name.
   * @internal Admin/testing only - not exposed via any controller route.
   * Do NOT call from user-facing code without adding ownership checks.
   */
  async findByGovernorate(governorateName: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { region: { name: governorateName } },
      relations: ['user', 'country', 'region', 'city'],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SYRIAN ADDRESS METHODS (MVP1)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create a Syrian address with full validation
   *
   * @param user - The user creating the address
   * @param dto - Syrian address data
   * @returns Created address entity with Syrian relations
   *
   * VALIDATION:
   * - Validates governorate → city → district hierarchy
   * - Ensures delivery is supported in the area
   * - Validates Syrian phone number format
   * - Handles default address logic
   *
   * @example
   * ```typescript
   * const address = await service.createSyrianAddress(user, {
   *   fullName: 'أحمد محمد',
   *   phone: '+963912345678',
   *   governorateId: 1,
   *   cityId: 5,
   *   street: 'شارع الثورة',
   *   isDefault: true
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

    // Step 3: Create address within a transaction to prevent default-flag race conditions
    const savedAddress = await this.addressRepo.manager.transaction(
      async (manager) => {
        // Unset existing defaults if new address should be default
        if (dto.isDefault) {
          await manager.update(
            Address,
            { user: { id: user.id } },
            { isDefault: false },
          );
        }

        // Create address entity
        const address = manager.create(Address, {
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

        return manager.save(address);
      },
    );

    this.logger.log(
      `Created Syrian address ${savedAddress.id} for user ${user.id} ` +
        `in ${governorate?.nameEn} → ${syrianCity?.nameEn}`,
    );

    return savedAddress;
  }

  /**
   * Update a Syrian address
   *
   * @param user - The user updating the address
   * @param id - Address ID to update
   * @param dto - Updated Syrian address data
   * @returns Updated address entity
   *
   * VALIDATION:
   * - Verifies user ownership
   * - Re-validates hierarchy if governorate/city/district changed
   * - Handles default address logic
   *
   * @throws NotFoundException if address not found or not owned by user
   * @throws BadRequestException if validation fails
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

    // Step 5: Handle default address logic within a transaction
    const updatedAddress = await this.addressRepo.manager.transaction(
      async (manager) => {
        if (dto.isDefault === true) {
          await manager.update(
            Address,
            { user: { id: user.id } },
            { isDefault: false },
          );
          address.isDefault = true;
        } else if (dto.isDefault === false) {
          address.isDefault = false;
        }

        return manager.save(address);
      },
    );

    this.logger.log(`Updated Syrian address ${id} for user ${user.id}`);

    return updatedAddress;
  }

  /**
   * Delete a Syrian address (soft delete)
   *
   * @param user - The user deleting the address
   * @param id - Address ID to delete
   *
   * VALIDATION:
   * - Verifies user ownership
   * - Prevents deletion if it's the only address
   * - Prevents deletion of default address (must set another as default first)
   *
   * @throws NotFoundException if address not found
   * @throws BadRequestException if validation fails
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
    const addressCount = await this.countUserAddresses(user.id);
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
   * Set a Syrian address as default
   *
   * @param user - The user setting the default address
   * @param id - Address ID to set as default
   * @returns Updated address entity
   *
   * LOGIC:
   * - Unsets all other default addresses for the user
   * - Sets the specified address as default
   * - Returns the updated address
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async setDefaultSyrianAddress(user: User, id: number): Promise<Address> {
    return this.addressRepo.manager.transaction(async (manager) => {
      // Step 1: Find and verify ownership
      const address = await manager.findOne(Address, {
        where: { id, user: { id: user.id } },
        relations: ['governorate', 'syrianCity', 'district'],
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }

      // Step 2: Unset all other defaults for this user (atomic within transaction)
      await manager.update(
        Address,
        { user: { id: user.id } },
        { isDefault: false },
      );

      // Step 3: Set this address as default
      address.isDefault = true;
      const updatedAddress = await manager.save(address);

      this.logger.log(`Set address ${id} as default for user ${user.id}`);

      return updatedAddress;
    });
  }

  /**
   * Find all Syrian addresses for a user with full relations
   *
   * @param user - The user whose addresses to retrieve
   * @returns Array of addresses sorted by default status and creation date
   */
  async findAllSyrianAddresses(user: User): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user: { id: user.id } },
      relations: ['governorate', 'syrianCity', 'district'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find a single Syrian address by ID with full relations
   *
   * @param user - The user requesting the address
   * @param id - Address ID
   * @returns Address entity with Syrian relations
   *
   * @throws NotFoundException if address not found or not owned by user
   */
  async findOneSyrianAddress(user: User, id: number): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['governorate', 'syrianCity', 'district'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }
}
