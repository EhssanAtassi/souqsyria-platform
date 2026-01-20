/**
 * @file syrian-address.entity.ts
 * @description Re-export Syrian address entities for backward compatibility
 *
 * This file maintains backward compatibility by re-exporting all Syrian address
 * entities that were previously defined in this single file. The entities have
 * been separated into individual files following NestJS best practices.
 *
 * @deprecated Use individual entity imports from their respective files
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

// Re-export all entities for backward compatibility
export { SyrianGovernorateEntity } from './syrian-governorate.entity';
export { SyrianCityEntity } from './syrian-city.entity';
export { SyrianDistrictEntity } from './syrian-district.entity';
export { SyrianAddressEntity } from './syrian-address-main.entity';

// Re-export enums
export * from './address-enums';

// Re-export everything from index for convenience
export * from './index';
