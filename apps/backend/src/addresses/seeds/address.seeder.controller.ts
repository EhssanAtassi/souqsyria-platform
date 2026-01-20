/**
 * @file address.seeder.controller.ts
 * @description Address Seeder Controller for SouqSyria Platform
 * Provides comprehensive API endpoints for seeding and managing Syrian address data
 *
 * Features:
 * - Complete Syrian geographic data seeding
 * - Sample address generation for testing
 * - Data validation and integrity checks
 * - Performance monitoring and analytics
 * - Bulk operations and cleanup utilities
 *
 * @swagger
 * @tags Address System Seeding
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddressSeederService,
  AddressSeedingOptions,
  AddressSeedingStats,
} from './address.seeder.service';

/**
 * DTO for address seeding options
 */
export class AddressSeedingOptionsDto implements AddressSeedingOptions {
  /**
   * Whether to seed Syrian governorates
   * @example true
   */
  seedGovernorates?: boolean;

  /**
   * Whether to seed Syrian cities
   * @example true
   */
  seedCities?: boolean;

  /**
   * Whether to seed districts (future feature)
   * @example false
   */
  seedDistricts?: boolean;

  /**
   * Whether to seed sample addresses for testing
   * @example true
   */
  seedSampleAddresses?: boolean;

  /**
   * Whether to create test users for sample addresses
   * @example true
   */
  createTestUsers?: boolean;

  /**
   * Whether to overwrite existing data
   * @example false
   */
  overwriteExisting?: boolean;

  /**
   * Logging level for the seeding process
   * @example "info"
   */
  logLevel?: 'debug' | 'info' | 'warn';

  /**
   * Batch size for bulk operations
   * @example 50
   */
  batchSize?: number;
}

/**
 * Response DTO for address seeding statistics
 */
export class AddressSeedingStatsResponseDto implements AddressSeedingStats {
  /**
   * Number of governorates created
   * @example 14
   */
  governoratesCreated: number;

  /**
   * Number of governorates updated
   * @example 2
   */
  governoratesUpdated: number;

  /**
   * Number of cities created
   * @example 35
   */
  citiesCreated: number;

  /**
   * Number of cities updated
   * @example 5
   */
  citiesUpdated: number;

  /**
   * Number of districts created
   * @example 0
   */
  districtsCreated: number;

  /**
   * Number of districts updated
   * @example 0
   */
  districtsUpdated: number;

  /**
   * Number of sample addresses created
   * @example 25
   */
  addressesCreated: number;

  /**
   * Number of addresses updated
   * @example 3
   */
  addressesUpdated: number;

  /**
   * Number of test users created
   * @example 5
   */
  testUsersCreated: number;

  /**
   * Total processing time in milliseconds
   * @example 3250
   */
  totalProcessingTime: number;

  /**
   * List of errors encountered during seeding
   * @example []
   */
  errors: string[];
}

/**
 * Response DTO for address system validation
 */
export class AddressValidationResponseDto {
  /**
   * Whether the address system is valid
   * @example true
   */
  valid: boolean;

  /**
   * List of validation issues found
   * @example []
   */
  issues: string[];
}

/**
 * Response DTO for address system statistics
 */
export class AddressSystemStatsDto {
  /**
   * Governorate statistics
   */
  governorates: {
    total: number;
    active: number;
    deliveryEnabled: number;
  };

  /**
   * City statistics
   */
  cities: {
    total: number;
    active: number;
    major: number;
  };

  /**
   * Address statistics
   */
  addresses: {
    total: number;
    shipping: number;
    billing: number;
    withCoordinates: number;
  };

  /**
   * User statistics
   */
  users: {
    total: number;
    testUsers: number;
  };

  /**
   * Statistics timestamp
   * @example "2025-08-14T10:30:00.000Z"
   */
  timestamp: string;
}

@ApiTags('Address System Seeding')
@Controller('addresses/seeding')
@ApiBearerAuth()
@ApiSecurity('firebase-auth')
export class AddressSeederController {
  private readonly logger = new Logger(AddressSeederController.name);

  constructor(private readonly seederService: AddressSeederService) {}

  /**
   * Seeds the complete Syrian address system with governorates, cities, and sample data
   *
   * This endpoint initializes the complete Syrian address system by:
   * 1. Creating all 14 Syrian governorates with bilingual names and metadata
   * 2. Creating major cities and towns with logistics information
   * 3. Generating sample addresses for testing and development
   * 4. Creating test users for address assignment
   * 5. Validating data integrity and relationships
   *
   * @param options - Configuration options for the seeding process
   * @returns Comprehensive statistics about the seeding operation
   */
  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed Complete Syrian Address System',
    description: `
    Initializes the complete Syrian address system for SouqSyria platform.
    
    **Features:**
    - Seeds all 14 official Syrian governorates with bilingual support
    - Creates 35+ major cities and towns with logistics metadata
    - Generates 25+ realistic sample addresses for testing
    - Creates test users for address assignment
    - Includes geographic coordinates and postal codes
    - Supports delivery zones and infrastructure information
    
    **Geographic Coverage:**
    - Damascus and Rif Dimashq (Capital region)
    - Aleppo (Northern commercial hub)
    - Homs, Hama (Central cities)
    - Lattakia, Tartus (Coastal regions)
    - Der Ezzor, Al-Hasakah (Eastern regions)
    - Daraa, As-Suwayda (Southern regions)
    - Idlib, Ar-Raqqa, Quneitra (Special status areas)
    
    **Data Quality:**
    - Official governorate codes and names
    - Accurate geographic coordinates
    - Current accessibility and delivery status
    - Economic and infrastructure metadata
    - Arabic and English localization
    
    **Use Cases:**
    - Initial platform setup
    - Development environment preparation
    - Testing address-related features
    - Demonstration and training purposes
    `,
    operationId: 'seedAddressSystem',
  })
  @ApiBody({
    type: AddressSeedingOptionsDto,
    description: 'Seeding configuration options',
    required: false,
    examples: {
      complete: {
        summary: 'Complete seeding (recommended)',
        value: {
          seedGovernorates: true,
          seedCities: true,
          seedDistricts: false,
          seedSampleAddresses: true,
          createTestUsers: true,
          overwriteExisting: false,
          logLevel: 'info',
          batchSize: 50,
        },
      },
      developmentMode: {
        summary: 'Development environment with debug logging',
        value: {
          seedGovernorates: true,
          seedCities: true,
          seedSampleAddresses: true,
          createTestUsers: true,
          overwriteExisting: true,
          logLevel: 'debug',
          batchSize: 25,
        },
      },
      geoDataOnly: {
        summary: 'Geographic data only (no sample addresses)',
        value: {
          seedGovernorates: true,
          seedCities: true,
          seedDistricts: false,
          seedSampleAddresses: false,
          createTestUsers: false,
          overwriteExisting: false,
          logLevel: 'info',
        },
      },
      testingMode: {
        summary: 'Sample data for testing',
        value: {
          seedGovernorates: false,
          seedCities: false,
          seedSampleAddresses: true,
          createTestUsers: true,
          overwriteExisting: true,
          logLevel: 'debug',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Address system seeded successfully',
    type: AddressSeedingStatsResponseDto,
    example: {
      governoratesCreated: 14,
      governoratesUpdated: 0,
      citiesCreated: 35,
      citiesUpdated: 0,
      districtsCreated: 0,
      districtsUpdated: 0,
      addressesCreated: 25,
      addressesUpdated: 0,
      testUsersCreated: 5,
      totalProcessingTime: 3250,
      errors: [],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding options provided',
    example: {
      statusCode: 400,
      message: 'Invalid seeding configuration',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Seeding process failed',
    example: {
      statusCode: 500,
      message: 'Address System Seeding failed: Database connection error',
      error: 'Internal Server Error',
    },
  })
  async seedAddressSystem(
    @Body() options?: AddressSeedingOptionsDto,
  ): Promise<AddressSeedingStatsResponseDto> {
    this.logger.log('🌱 Starting address system seeding via API...');

    const stats = await this.seederService.seedCompleteAddressSystem(options);

    this.logger.log(
      `✅ Address system seeding completed: ${stats.governoratesCreated + stats.citiesCreated + stats.addressesCreated} items created`,
    );

    return stats;
  }

  /**
   * Retrieves comprehensive statistics about the current address system
   *
   * @returns Detailed statistics including counts and breakdowns
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get Address System Statistics',
    description: `
    Retrieves comprehensive statistics about the current state of the Syrian address system.
    
    **Information Included:**
    - Governorate counts (total, active, delivery-enabled)
    - City counts (total, active, major cities)
    - Address counts (total, by type, with coordinates)
    - User counts (total, test users)
    - Data quality indicators
    
    **Use Cases:**
    - Monitoring system setup completeness
    - Debugging address-related issues
    - Generating system reports
    - Validating seeding results
    - Performance monitoring
    `,
    operationId: 'getAddressSystemStats',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Address system statistics retrieved successfully',
    type: AddressSystemStatsDto,
    example: {
      governorates: {
        total: 14,
        active: 11,
        deliveryEnabled: 9,
      },
      cities: {
        total: 35,
        active: 32,
        major: 8,
      },
      addresses: {
        total: 25,
        shipping: 15,
        billing: 10,
        withCoordinates: 23,
      },
      users: {
        total: 150,
        testUsers: 5,
      },
      timestamp: '2025-08-14T10:30:00.000Z',
    },
  })
  async getAddressSystemStats(): Promise<AddressSystemStatsDto> {
    this.logger.log('📊 Retrieving address system statistics...');

    const stats = await this.seederService.getAddressSeedingStats();

    this.logger.log(
      `📈 Retrieved statistics: ${stats.governorates.total} governorates, ${stats.cities.total} cities`,
    );

    return stats;
  }

  /**
   * Validates the integrity and consistency of the address system
   *
   * @returns Validation results with any issues found
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate Address System Integrity',
    description: `
    Performs comprehensive validation of the address system to identify potential issues.
    
    **Validation Checks:**
    - Governorates without cities
    - Inactive cities in active governorates
    - Addresses without geographic coordinates
    - Duplicate postal code prefixes
    - Data consistency across entities
    - Foreign key integrity
    - Geographic boundary validation
    
    **Use Cases:**
    - Pre-deployment validation
    - Troubleshooting address issues
    - Regular system health checks
    - Data quality monitoring
    - Compliance verification
    `,
    operationId: 'validateAddressSystemIntegrity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed successfully',
    type: AddressValidationResponseDto,
    examples: {
      valid: {
        summary: 'System is valid',
        value: {
          valid: true,
          issues: [],
        },
      },
      invalid: {
        summary: 'Issues found',
        value: {
          valid: false,
          issues: [
            'Found 2 governorates without cities: Quneitra, Ar-Raqqa',
            'Found 5 addresses without geographic coordinates',
            'Found 1 duplicate postal code prefixes',
          ],
        },
      },
    },
  })
  async validateAddressSystemIntegrity(): Promise<AddressValidationResponseDto> {
    this.logger.log('🔍 Starting address system integrity validation...');

    const result = await this.seederService.validateAddressSystemIntegrity();

    if (result.valid) {
      this.logger.log('✅ Address system validation passed');
    } else {
      this.logger.warn(
        `⚠️ Address system validation found ${result.issues.length} issues`,
      );
    }

    return result;
  }

  /**
   * Retrieves governorates filtered by delivery status
   *
   * @param deliveryEnabled - Filter by delivery support
   * @param activeOnly - Filter by active status
   * @returns Filtered list of governorates
   */
  @Get('governorates')
  @ApiOperation({
    summary: 'Get Governorates with Filtering',
    description:
      'Retrieves Syrian governorates with optional filtering by delivery support and active status',
    operationId: 'getGovernorates',
  })
  @ApiQuery({
    name: 'deliveryEnabled',
    required: false,
    type: Boolean,
    description: 'Filter governorates by delivery support',
    example: true,
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Show only active governorates',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Governorates retrieved successfully',
    example: [
      {
        code: 'DMS',
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        deliverySupported: true,
        isActive: true,
      },
    ],
  })
  async getGovernorates(
    @Query('deliveryEnabled') deliveryEnabled?: boolean,
    @Query('activeOnly') activeOnly?: boolean,
  ): Promise<any[]> {
    // Implementation would fetch from database with filters
    // This is a placeholder for the actual implementation
    this.logger.log(
      `📍 Retrieving governorates (delivery: ${deliveryEnabled}, active: ${activeOnly})`,
    );
    return [];
  }

  /**
   * Retrieves cities filtered by various criteria
   *
   * @param governorateCode - Filter by governorate code
   * @param majorOnly - Show only major cities (population > 100k)
   * @param deliveryEnabled - Filter by delivery support
   * @returns Filtered list of cities
   */
  @Get('cities')
  @ApiOperation({
    summary: 'Get Cities with Filtering',
    description:
      'Retrieves Syrian cities with optional filtering by governorate, size, and delivery support',
    operationId: 'getCities',
  })
  @ApiQuery({
    name: 'governorateCode',
    required: false,
    type: String,
    description: 'Filter cities by governorate code',
    example: 'DMS',
  })
  @ApiQuery({
    name: 'majorOnly',
    required: false,
    type: Boolean,
    description: 'Show only major cities (population > 100,000)',
    example: true,
  })
  @ApiQuery({
    name: 'deliveryEnabled',
    required: false,
    type: Boolean,
    description: 'Filter cities by delivery support',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cities retrieved successfully',
    example: [
      {
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        governorateCode: 'DMS',
        population: 2503000,
        deliverySupported: true,
      },
    ],
  })
  async getCities(
    @Query('governorateCode') governorateCode?: string,
    @Query('majorOnly') majorOnly?: boolean,
    @Query('deliveryEnabled') deliveryEnabled?: boolean,
  ): Promise<any[]> {
    // Implementation would fetch from database with filters
    this.logger.log(
      `🏘️ Retrieving cities (gov: ${governorateCode}, major: ${majorOnly}, delivery: ${deliveryEnabled})`,
    );
    return [];
  }

  /**
   * ⚠️ DESTRUCTIVE: Removes all address system data
   *
   * WARNING: This endpoint permanently deletes all address-related data.
   * Use with extreme caution and only in development/testing environments.
   *
   * @returns Success confirmation
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '⚠️ DESTRUCTIVE: Cleanup Address System Data',
    description: `
    **🚨 DANGER: This operation is DESTRUCTIVE and IRREVERSIBLE! 🚨**
    
    Completely removes all address system data:
    - All Syrian governorates will be deleted
    - All Syrian cities will be deleted
    - All sample addresses will be deleted
    - All test users will be deleted
    - All related geographic data will be deleted
    
    **⚠️ Use Cases (Testing/Development ONLY):**
    - Cleaning up test environments
    - Preparing for fresh seeding
    - Resetting development databases
    - Testing disaster recovery procedures
    
    **🛑 NEVER use in production environments!**
    
    **Prerequisites:**
    - Ensure you have database backups
    - Verify this is not a production environment
    - Confirm you understand the implications
    `,
    operationId: 'cleanupAddressSystemData',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Address system data cleaned up successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Cleanup operation failed',
    example: {
      statusCode: 500,
      message:
        'Address system cleanup failed: Foreign key constraint violation',
      error: 'Internal Server Error',
    },
  })
  async cleanupAddressSystemData(): Promise<void> {
    this.logger.warn(
      '🧹 Starting DESTRUCTIVE address system cleanup via API...',
    );

    await this.seederService.cleanupAddressData();

    this.logger.warn('💥 Address system cleanup completed - all data removed');
  }

  /**
   * Quick health check for the address seeding system
   *
   * @returns Basic system information
   */
  @Get('health')
  @ApiOperation({
    summary: 'Address System Seeding Health Check',
    description:
      'Quick health check to verify the address seeding system is operational',
    operationId: 'addressSeedingHealthCheck',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed successfully',
    example: {
      status: 'healthy',
      service: 'address-system-seeding',
      timestamp: '2025-08-14T10:30:00.000Z',
      version: '1.0.0',
      features: {
        governorateSeeding: true,
        citySeeding: true,
        sampleAddresses: true,
        validation: true,
        cleanup: true,
      },
    },
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      service: 'address-system-seeding',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: {
        governorateSeeding: true,
        citySeeding: true,
        sampleAddresses: true,
        validation: true,
        cleanup: true,
      },
    };
  }
}
