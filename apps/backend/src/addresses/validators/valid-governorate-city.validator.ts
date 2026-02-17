/**
 * @file valid-governorate-city.validator.ts
 * @description Validates Syrian administrative hierarchy relationships
 *
 * PURPOSE:
 * Ensures data integrity in Syrian address system by validating that:
 * - Cities belong to their specified governorates
 * - Districts belong to their specified cities
 * - All entities are active and available for delivery
 *
 * VALIDATION RULES:
 * 1. Governorate must exist and be active
 * 2. City must exist, be active, and belong to the governorate
 * 3. District (if provided) must exist, be active, and belong to the city
 * 4. Entities must support delivery operations
 *
 * ERROR HANDLING:
 * Returns structured validation result with:
 * - valid: boolean indicating overall validity
 * - errors: array of human-readable error messages
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from '../entities';

/**
 * Validation result interface
 */
export interface GovernorateCityValidationResult {
  /** Overall validation status */
  valid: boolean;
  /** List of validation errors (empty if valid) */
  errors: string[];
}

/**
 * Governorate-City-District Hierarchy Validator
 *
 * Validates the relationships between Syrian administrative divisions
 * to ensure data integrity and proper address structure.
 */
@Injectable()
export class GovernorateCityValidator {
  private readonly logger = new Logger(GovernorateCityValidator.name);

  constructor(
    @InjectRepository(SyrianGovernorateEntity)
    private readonly govRepo: Repository<SyrianGovernorateEntity>,

    @InjectRepository(SyrianCityEntity)
    private readonly cityRepo: Repository<SyrianCityEntity>,

    @InjectRepository(SyrianDistrictEntity)
    private readonly districtRepo: Repository<SyrianDistrictEntity>,
  ) {}

  /**
   * Validates the Syrian administrative hierarchy
   *
   * @param governorateId - ID of the governorate (محافظة)
   * @param cityId - ID of the city (مدينة)
   * @param districtId - Optional ID of the district (حي)
   * @returns Validation result with status and errors
   *
   * @example
   * ```typescript
   * const result = await validator.validate(1, 5, 12);
   * if (!result.valid) {
   *   throw new BadRequestException(result.errors.join(', '));
   * }
   * ```
   */
  async validate(
    governorateId: number,
    cityId: number,
    districtId?: number,
  ): Promise<GovernorateCityValidationResult> {
    const errors: string[] = [];

    try {
      // ═══════════════════════════════════════════════════════════════════
      // STEP 1: Validate Governorate
      // ═══════════════════════════════════════════════════════════════════

      const governorate = await this.govRepo.findOne({
        where: { id: governorateId },
      });

      if (!governorate) {
        errors.push(`Governorate with ID ${governorateId} does not exist`);
        // Cannot proceed with further validation if governorate doesn't exist
        return { valid: false, errors };
      }

      if (!governorate.isActive) {
        errors.push(
          `Governorate "${governorate.nameEn}" (${governorate.nameAr}) is currently inactive`,
        );
      }

      // Check if delivery is supported in this governorate
      if (
        governorate.status?.deliverySupported === false ||
        governorate.status?.accessibilityLevel === 'restricted'
      ) {
        errors.push(
          `Delivery is not supported in governorate "${governorate.nameEn}" (${governorate.nameAr})`,
        );
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 2: Validate City
      // ═══════════════════════════════════════════════════════════════════

      const city = await this.cityRepo.findOne({
        where: { id: cityId },
        relations: ['governorate'],
      });

      if (!city) {
        errors.push(`City with ID ${cityId} does not exist`);
        // Cannot proceed with district validation if city doesn't exist
        return { valid: false, errors };
      }

      if (!city.isActive) {
        errors.push(
          `City "${city.nameEn}" (${city.nameAr}) is currently inactive`,
        );
      }

      // Validate that city belongs to the specified governorate
      if (city.governorate.id !== governorateId) {
        errors.push(
          `City "${city.nameEn}" does not belong to governorate "${governorate.nameEn}". ` +
            `It belongs to "${city.governorate.nameEn}"`,
        );
      }

      // Check if delivery is supported in this city
      if (city.logistics?.deliverySupported === false) {
        errors.push(
          `Delivery is not supported in city "${city.nameEn}" (${city.nameAr})`,
        );
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 3: Validate District (if provided)
      // ═══════════════════════════════════════════════════════════════════

      if (districtId) {
        const district = await this.districtRepo.findOne({
          where: { id: districtId },
          relations: ['city', 'city.governorate'],
        });

        if (!district) {
          errors.push(`District with ID ${districtId} does not exist`);
        } else {
          if (!district.isActive) {
            errors.push(
              `District "${district.nameEn}" (${district.nameAr}) is currently inactive`,
            );
          }

          // Validate that district belongs to the specified city
          if (district.city.id !== cityId) {
            errors.push(
              `District "${district.nameEn}" does not belong to city "${city.nameEn}". ` +
                `It belongs to "${district.city.nameEn}"`,
            );
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // FINAL RESULT
      // ═══════════════════════════════════════════════════════════════════

      const isValid = errors.length === 0;

      if (isValid) {
        this.logger.log(
          `✓ Valid address hierarchy: Governorate ${governorateId} → City ${cityId}` +
            (districtId ? ` → District ${districtId}` : ''),
        );
      } else {
        this.logger.warn(
          `✗ Invalid address hierarchy: ${errors.length} error(s) found`,
        );
      }

      return {
        valid: isValid,
        errors,
      };
    } catch (error) {
      // Distinguish database errors from validation logic errors
      if (error instanceof QueryFailedError) {
        this.logger.error(
          'Database error during address hierarchy validation',
          error,
        );
        throw new InternalServerErrorException(
          'Database error during address validation. Please try again later.',
        );
      }
      this.logger.error(
        'Unexpected error during address hierarchy validation',
        error,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred during address validation.',
      );
    }
  }

  /**
   * Quick check if a governorate supports delivery
   *
   * @param governorateId - ID of the governorate
   * @returns true if delivery is supported, false otherwise
   */
  async isDeliverySupported(governorateId: number): Promise<boolean> {
    const governorate = await this.govRepo.findOne({
      where: { id: governorateId },
    });

    if (!governorate || !governorate.isActive) {
      return false;
    }

    return (
      governorate.status?.deliverySupported === true &&
      governorate.status?.accessibilityLevel !== 'restricted'
    );
  }

  /**
   * Get all active governorates that support delivery
   *
   * @returns Array of governorates available for address creation
   */
  async getAvailableGovernorates(): Promise<SyrianGovernorateEntity[]> {
    return this.govRepo
      .createQueryBuilder('gov')
      .where('gov.isActive = :isActive', { isActive: true })
      .andWhere("gov.status->>'deliverySupported' = 'true'")
      .orderBy('gov.displayOrder', 'ASC')
      .getMany();
  }

  /**
   * Get all active cities for a governorate
   *
   * @param governorateId - ID of the governorate
   * @returns Array of cities in the governorate
   */
  async getCitiesForGovernorate(
    governorateId: number,
  ): Promise<SyrianCityEntity[]> {
    return this.cityRepo.find({
      where: {
        governorate: { id: governorateId },
        isActive: true,
      },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get all active districts for a city
   *
   * @param cityId - ID of the city
   * @returns Array of districts in the city
   */
  async getDistrictsForCity(cityId: number): Promise<SyrianDistrictEntity[]> {
    return this.districtRepo.find({
      where: {
        city: { id: cityId },
        isActive: true,
      },
      order: { displayOrder: 'ASC' },
    });
  }
}
