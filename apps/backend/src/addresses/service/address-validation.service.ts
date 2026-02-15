/**
 * @file address-validation.service.ts
 * @description Service responsible for address validation and geospatial utilities.
 *
 * Handles:
 * - Syrian phone number format validation
 * - Syrian postal code format validation
 * - Haversine distance calculation between coordinates
 * - Finding addresses within a radius (bounding box approach)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 God Service Refactor
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

/**
 * @class AddressValidationService
 * @description Provides validation utilities and geospatial helper methods
 * for address management.
 *
 * Extracted from AddressesService to separate validation/utility logic
 * from CRUD operations, following the Single Responsibility Principle.
 */
@Injectable()
export class AddressValidationService {
  private readonly logger = new Logger(AddressValidationService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  /**
   * Validate a Syrian phone number against known Syrian patterns.
   *
   * @description Checks the phone number against three accepted Syrian
   * phone formats:
   * - International with dashes: +963-11-123456
   * - Local with dashes: 011-123456
   * - International compact: +963111234567
   *
   * @param phone - The phone number string to validate
   * @returns true if the phone matches any Syrian pattern, false otherwise
   */
  validateSyrianPhone(phone: string): boolean {
    const syrianPatterns = [
      /^\+963-\d{2}-\d{6,7}$/, // +963-11-123456
      /^0\d{2}-\d{6,7}$/, // 011-123456
      /^\+963\d{8,9}$/, // +963111234567
    ];

    return syrianPatterns.some((pattern) => pattern.test(phone));
  }

  /**
   * Validate a Syrian postal code format.
   *
   * @description Syrian postal codes are 5 digits where the first 2 digits
   * indicate the region. This method validates both the format and the
   * region prefix against the known list of valid Syrian region codes.
   *
   * @param postalCode - The postal code string to validate
   * @returns true if the postal code is a valid Syrian format, false otherwise
   */
  validateSyrianPostalCode(postalCode: string): boolean {
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
   * Calculate the distance between two geographic coordinates using the Haversine formula.
   *
   * @description Computes the great-circle distance between two points on
   * the Earth's surface given their latitude/longitude pairs. Returns the
   * distance in kilometers.
   *
   * @param lat1 - Latitude of the first point in degrees
   * @param lon1 - Longitude of the first point in degrees
   * @param lat2 - Latitude of the second point in degrees
   * @param lon2 - Longitude of the second point in degrees
   * @returns Distance in kilometers between the two points
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

  /**
   * Convert degrees to radians.
   *
   * @description Private helper for the Haversine formula calculation.
   *
   * @param deg - Angle in degrees
   * @returns Angle in radians
   */
  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Find all addresses within a radius of the given coordinates.
   *
   * @description Uses a bounding box approach for database efficiency.
   * Calculates approximate latitude/longitude deltas from the radius
   * and queries addresses falling within that box. Note: this is an
   * approximation that works well for small radii but becomes less
   * accurate near the poles.
   *
   * @param latitude - Center latitude in degrees
   * @param longitude - Center longitude in degrees
   * @param radiusKm - Search radius in kilometers
   * @returns Array of addresses within the bounding box
   */
  async findAddressesNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Address[]> {
    const latDiff = radiusKm / 111; // Rough conversion: 1 degree lat ~ 111 km
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
}
