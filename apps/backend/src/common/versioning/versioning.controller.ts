import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VersioningService } from './versioning.service';
import { VersionedApi } from './version.decorator';

/**
 * Versioning Controller
 *
 * Provides endpoints for API version information, migration guidance,
 * and compatibility checking. Used by developers and automated tools.
 */
@ApiTags('🔄 API Versioning')
@Controller('versioning')
@VersionedApi('v1')
export class VersioningController {
  constructor(private readonly versioningService: VersioningService) {}

  /**
   * Get all supported API versions
   */
  @Get('versions')
  @ApiOperation({
    summary: 'Get supported API versions',
    description:
      'Returns information about all supported API versions, compatibility matrix, and default version.',
  })
  @ApiResponse({
    status: 200,
    description: 'API version information retrieved successfully',
    schema: {
      example: {
        versions: [
          {
            version: 'v1',
            isDefault: true,
            description: 'Initial stable API version',
            compatibilityNotes: [
              'Legacy endpoints without /api prefix supported for backward compatibility',
              'Syrian market features fully supported',
            ],
          },
          {
            version: 'v2',
            description:
              'Enhanced API with improved consistency and new features',
            compatibilityNotes: [
              'All endpoints use consistent /api/v2 prefix',
              'Enhanced error responses with detailed codes',
            ],
          },
        ],
        default: 'v1',
        compatibility: {
          v1: {
            supportedUntil: '2025-12-31T00:00:00.000Z',
            backwardCompatible: true,
          },
        },
      },
    },
  })
  getSupportedVersions() {
    return this.versioningService.getSupportedVersions();
  }

  /**
   * Get version-specific information
   */
  @Get('versions/:version')
  @ApiOperation({
    summary: 'Get specific version information',
    description:
      'Returns detailed information about a specific API version including deprecation status and compatibility notes.',
  })
  @ApiParam({
    name: 'version',
    description: 'API version to get information for',
    example: 'v1',
  })
  @ApiResponse({
    status: 200,
    description: 'Version information retrieved successfully',
    schema: {
      example: {
        version: 'v1',
        description: 'Initial stable API version',
        isDefault: true,
        isDeprecated: false,
        isSunset: false,
        compatibilityNotes: [
          'Legacy endpoints without /api prefix supported for backward compatibility',
          'Syrian market features fully supported',
          'Mobile-optimized endpoints available',
        ],
        supportedUntil: '2025-12-31T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found',
    schema: {
      example: {
        error: 'Version Not Found',
        message: 'API version "v3" is not supported',
        supportedVersions: ['v1', 'v2', 'mobile/v1'],
      },
    },
  })
  getVersionInfo(@Param('version') version: string) {
    const versionInfo = this.versioningService.getVersionInfo(version);

    if (!versionInfo) {
      const supportedVersions = this.versioningService.getSupportedVersions();
      return {
        error: 'Version Not Found',
        message: `API version "${version}" is not supported`,
        supportedVersions: supportedVersions.versions.map((v) => v.version),
      };
    }

    return versionInfo;
  }

  /**
   * Get migration information between versions
   */
  @Get('migration/:fromVersion/to/:toVersion')
  @ApiOperation({
    summary: 'Get migration information',
    description:
      'Returns detailed migration guide for upgrading from one API version to another.',
  })
  @ApiParam({
    name: 'fromVersion',
    description: 'Current API version',
    example: 'v1',
  })
  @ApiParam({
    name: 'toVersion',
    description: 'Target API version',
    example: 'v2',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration information retrieved successfully',
    schema: {
      example: {
        fromVersion: 'v1',
        toVersion: 'v2',
        breaking: true,
        changes: {
          added: ['Consistent /api/v2 prefix for all endpoints'],
          modified: ['Error responses include structured error codes'],
          deprecated: ['Legacy endpoints without /api prefix'],
          removed: ['Legacy authentication methods'],
        },
        migrationSteps: [
          '1. Update all API calls to use /api/v2 prefix',
          '2. Modify error handling to parse structured error responses',
        ],
        examples: {
          before: { url: '/products?page=1&limit=20' },
          after: { url: '/api/v2/products?cursor=eyJpZCI6MTAwfQ&limit=20' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Migration path not found',
  })
  getMigrationInfo(
    @Param('fromVersion') fromVersion: string,
    @Param('toVersion') toVersion: string,
  ) {
    const migrationInfo = this.versioningService.getMigrationInfo(
      fromVersion,
      toVersion,
    );

    if (!migrationInfo) {
      return {
        error: 'Migration Path Not Found',
        message: `No migration path defined from ${fromVersion} to ${toVersion}`,
        availablePaths: ['v1-to-v2'],
      };
    }

    return migrationInfo;
  }

  /**
   * Get endpoint migration path
   */
  @Get('migrate-endpoint')
  @ApiOperation({
    summary: 'Get endpoint migration path',
    description: 'Returns the new versioned path for a legacy endpoint.',
  })
  @ApiQuery({
    name: 'path',
    description: 'Legacy endpoint path to migrate',
    example: 'products',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration path retrieved successfully',
    schema: {
      example: {
        originalPath: 'products',
        newPath: 'api/v1/products',
        deprecated: true,
        migrationRequired: true,
        recommendations: [
          'Update client to use new versioned path',
          'Add X-API-Version header for explicit versioning',
          'Consider upgrading to v2 for enhanced features',
        ],
      },
    },
  })
  getEndpointMigrationPath(@Query('path') path: string) {
    if (!path) {
      return {
        error: 'Missing Path Parameter',
        message: 'Please provide a path parameter to get migration information',
      };
    }

    const migrationPath = this.versioningService.getEndpointMigrationPath(path);

    return {
      originalPath: path,
      ...migrationPath,
      recommendations: migrationPath.migrationRequired
        ? [
            'Update client to use new versioned path',
            'Add X-API-Version header for explicit versioning',
            'Consider upgrading to v2 for enhanced features',
          ]
        : ['Endpoint is already properly versioned'],
    };
  }

  /**
   * Get version usage statistics
   */
  @Get('usage/stats')
  @ApiOperation({
    summary: 'Get API version usage statistics',
    description:
      'Returns analytics about API version usage across all clients and endpoints.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully',
    schema: {
      example: {
        totalRequests: 150000,
        versionBreakdown: {
          v1: { requests: 120000, percentage: 80 },
          'mobile/v1': { requests: 25000, percentage: 16.67 },
          v2: { requests: 3000, percentage: 2 },
        },
        deprecatedUsage: {
          v1: {
            requests: 5000,
            uniqueClients: 23,
            topEndpoints: ['/products', '/orders', '/admin/brands'],
          },
        },
      },
    },
  })
  getVersionUsageStats() {
    return this.versioningService.getVersionUsageStats();
  }

  /**
   * Get endpoint migration report
   */
  @Get('migration/report')
  @ApiOperation({
    summary: 'Generate endpoint migration report',
    description:
      'Returns a comprehensive report of all endpoints that need migration to versioned paths.',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration report generated successfully',
    schema: {
      example: {
        summary: {
          totalEndpoints: 150,
          needsMigration: 85,
          alreadyVersioned: 35,
          internalOnly: 30,
        },
        categories: [
          {
            category: 'Public APIs',
            current: 'vendors, products, payments, orders',
            target:
              'api/v1/vendors, api/v1/products, api/v1/payments, api/v1/orders',
            status: 'needs_versioning',
            priority: 'high',
          },
        ],
        timeline: {
          'Phase 1 (Week 1-2)':
            'Version public APIs (products, orders, payments)',
          'Phase 2 (Week 3-4)':
            'Standardize admin APIs with /api/v1/admin prefix',
        },
      },
    },
  })
  getEndpointMigrationReport() {
    return this.versioningService.generateEndpointMigrationReport();
  }

  /**
   * Check client upgrade requirements
   */
  @Get('check-upgrade')
  @ApiOperation({
    summary: 'Check client upgrade requirements',
    description:
      'Checks if a client version requires upgrading and provides recommendations.',
  })
  @ApiQuery({
    name: 'clientVersion',
    description: 'Client API version to check',
    example: 'v1',
  })
  @ApiResponse({
    status: 200,
    description: 'Upgrade check completed successfully',
    schema: {
      example: {
        upgradeRequired: false,
        currentVersion: 'v1',
        latestVersion: 'v2',
        deprecationWarning:
          'Version v1 is deprecated and will be sunset soon. Please upgrade to v2 or later.',
        recommendations: [
          'Upgrade to v2 for enhanced features and better performance',
          'Review migration guide at /api/versioning/migration/v1/to/v2',
          'Test integration with v2 endpoints before full migration',
        ],
      },
    },
  })
  checkClientUpgrade(@Query('clientVersion') clientVersion: string) {
    if (!clientVersion) {
      return {
        error: 'Missing Client Version',
        message: 'Please provide clientVersion parameter',
      };
    }

    const upgradeCheck =
      this.versioningService.checkClientUpgradeRequired(clientVersion);

    return {
      ...upgradeCheck,
      recommendations: upgradeCheck.upgradeRequired
        ? [
            `Immediate upgrade to ${upgradeCheck.latestVersion} required`,
            'Current version is no longer supported',
            'Contact support if upgrade assistance is needed',
          ]
        : upgradeCheck.deprecationWarning
          ? [
              `Consider upgrading to ${upgradeCheck.latestVersion} for enhanced features`,
              'Review migration guide for upgrade path',
              'Test integration with newer version before full migration',
            ]
          : [
              'Your client version is up to date',
              'Monitor for new version releases',
            ],
    };
  }
}
