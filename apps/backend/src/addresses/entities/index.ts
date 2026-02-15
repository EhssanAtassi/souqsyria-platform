/**
 * @file index.ts
 * @description Export all Syrian address entities and enums
 *
 * This file provides a centralized export point for all address-related
 * entities and enums to simplify imports throughout the application.
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

// Main address entities
export { SyrianGovernorateEntity } from './syrian-governorate.entity';
export { SyrianCityEntity } from './syrian-city.entity';
export { SyrianDistrictEntity } from './syrian-district.entity';
export { SyrianAddressEntity } from './syrian-address-main.entity';

// Address enums and types
export {
  PropertyType,
  AddressStatus,
  AccessibilityLevel,
  EconomicStatus,
  InfrastructureLevel,
  LastMileOptions,
  VerificationMethod,
  ContactPreference,
} from './address-enums';

// Legacy exports for backward compatibility
export { SyrianAddressEntity as SyrianAddressMainEntity } from './syrian-address-main.entity';

/**
 * Type definitions for better type safety
 */
export type SyrianAddressEntities =
  | 'SyrianGovernorateEntity'
  | 'SyrianCityEntity'
  | 'SyrianDistrictEntity'
  | 'SyrianAddressEntity';

/**
 * Entity names for dynamic usage
 */
export const ENTITY_NAMES = {
  GOVERNORATE: 'SyrianGovernorateEntity',
  CITY: 'SyrianCityEntity',
  DISTRICT: 'SyrianDistrictEntity',
  ADDRESS: 'SyrianAddressEntity',
} as const;
