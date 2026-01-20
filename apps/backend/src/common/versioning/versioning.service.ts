import { Injectable, Logger } from '@nestjs/common';
import { ApiVersionStrategy } from './api-version.strategy';

/**
 * Version Migration Information
 */
export interface VersionMigrationInfo {
  fromVersion: string;
  toVersion: string;
  breaking: boolean;
  changes: {
    added: string[];
    modified: string[];
    deprecated: string[];
    removed: string[];
  };
  migrationSteps: string[];
  examples?: {
    before: any;
    after: any;
  };
}

/**
 * Versioning Service
 *
 * Provides centralized version management, migration guidance,
 * and compatibility checking for the SouqSyria API.
 */
@Injectable()
export class VersioningService {
  private readonly logger = new Logger(VersioningService.name);

  /**
   * Get all supported API versions
   */
  getSupportedVersions() {
    return {
      versions: ApiVersionStrategy.SUPPORTED_VERSIONS,
      default: ApiVersionStrategy.getDefaultVersion(),
      compatibility: ApiVersionStrategy.COMPATIBILITY_MATRIX,
    };
  }

  /**
   * Get version information for a specific version
   */
  getVersionInfo(version: string) {
    const config = ApiVersionStrategy.getVersionConfig(version);

    if (!config) {
      return null;
    }

    return {
      version: config.version,
      description: config.description,
      isDefault: config.isDefault,
      isDeprecated: ApiVersionStrategy.isDeprecated(version),
      isSunset: ApiVersionStrategy.isSunset(version),
      deprecatedAt: config.deprecatedAt,
      sunsetAt: config.sunsetAt,
      compatibilityNotes: config.compatibilityNotes,
      supportedUntil:
        ApiVersionStrategy.COMPATIBILITY_MATRIX[version]?.supportedUntil,
    };
  }

  /**
   * Get migration information between versions
   */
  getMigrationInfo(
    fromVersion: string,
    toVersion: string,
  ): VersionMigrationInfo | null {
    // Define migration paths
    const migrations: Record<string, VersionMigrationInfo> = {
      'v1-to-v2': {
        fromVersion: 'v1',
        toVersion: 'v2',
        breaking: true,
        changes: {
          added: [
            'Consistent /api/v2 prefix for all endpoints',
            'Enhanced error responses with detailed error codes',
            'Improved pagination with cursor-based navigation',
            'Bulk operations for products, orders, and users',
            'Real-time WebSocket endpoints for live updates',
            'GraphQL endpoint for complex queries',
          ],
          modified: [
            'All endpoints now use /api/v2 prefix',
            'Error responses include structured error codes and details',
            'Pagination uses cursor-based approach instead of offset',
            'Date formats standardized to ISO 8601',
            'Syrian address format enhanced with postal codes',
            'Currency amounts now include decimal precision',
          ],
          deprecated: [
            'Legacy endpoints without /api prefix',
            'Offset-based pagination (?page=1&limit=10)',
            'Simplified error responses',
            'Non-standard date formats',
          ],
          removed: [
            'Legacy authentication methods',
            'Deprecated Syrian governorate codes',
            'Old product category structure',
          ],
        },
        migrationSteps: [
          '1. Update all API calls to use /api/v2 prefix',
          '2. Modify error handling to parse structured error responses',
          '3. Update pagination logic to use cursor-based navigation',
          '4. Ensure date parsing handles ISO 8601 format',
          '5. Update Syrian address handling for new postal code format',
          '6. Test all integrations with v2 endpoints',
          '7. Update client-side error handling for new error structure',
        ],
        examples: {
          before: {
            url: '/products?page=1&limit=20',
            errorResponse: {
              message: 'Product not found',
              statusCode: 404,
            },
            pagination: {
              page: 1,
              limit: 20,
              total: 100,
            },
          },
          after: {
            url: '/api/v2/products?cursor=eyJpZCI6MTAwfQ&limit=20',
            errorResponse: {
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: 'Product not found',
                details: {
                  productId: '12345',
                  reason: 'Product may have been deleted or is not available',
                },
              },
              statusCode: 404,
              timestamp: '2025-08-19T17:30:00.000Z',
            },
            pagination: {
              cursor: 'eyJpZCI6MTIwfQ',
              limit: 20,
              hasNext: true,
              count: 20,
            },
          },
        },
      },
    };

    const migrationKey = `${fromVersion}-to-${toVersion}`;
    return migrations[migrationKey] || null;
  }

  /**
   * Get endpoint migration path for legacy URLs
   */
  getEndpointMigrationPath(legacyPath: string): {
    newPath: string;
    deprecated: boolean;
    migrationRequired: boolean;
  } {
    const newPath = ApiVersionStrategy.getMigrationPath(legacyPath);

    return {
      newPath,
      deprecated: newPath !== legacyPath,
      migrationRequired:
        !legacyPath.startsWith('api/mobile/v1') &&
        !legacyPath.startsWith('seed/'),
    };
  }

  /**
   * Get version usage statistics (mock implementation)
   */
  getVersionUsageStats() {
    return {
      totalRequests: 150000,
      versionBreakdown: {
        v1: { requests: 120000, percentage: 80 },
        'mobile/v1': { requests: 25000, percentage: 16.67 },
        v2: { requests: 3000, percentage: 2 },
        unversioned: { requests: 2000, percentage: 1.33 },
      },
      deprecatedUsage: {
        v1: {
          requests: 5000,
          uniqueClients: 23,
          topEndpoints: ['/products', '/orders', '/admin/brands'],
        },
      },
      clientVersions: {
        'React Native App': { version: 'mobile/v1', requests: 25000 },
        'Flutter App': { version: 'mobile/v1', requests: 0 },
        'Web Dashboard': { version: 'v1', requests: 80000 },
        'Third-party Integrations': { version: 'v1', requests: 40000 },
        'Beta Testers': { version: 'v2', requests: 3000 },
      },
    };
  }

  /**
   * Generate migration report for current API endpoints
   */
  generateEndpointMigrationReport() {
    return {
      summary: {
        totalEndpoints: 150,
        needsMigration: 85,
        alreadyVersioned: 35,
        internalOnly: 30,
      },
      categories: ApiVersionStrategy.generateMigrationReport(),
      recommendations: [
        'Start with high-traffic public APIs (products, orders, payments)',
        'Maintain backward compatibility for 6 months minimum',
        'Provide clear migration documentation and examples',
        'Monitor deprecated endpoint usage and notify clients',
        'Consider gradual rollout with feature flags',
      ],
      timeline: {
        'Phase 1 (Week 1-2)':
          'Version public APIs (products, orders, payments)',
        'Phase 2 (Week 3-4)':
          'Standardize admin APIs with /api/v1/admin prefix',
        'Phase 3 (Week 5-6)':
          'Clean up seeding endpoints to use consistent /seed prefix',
        'Phase 4 (Week 7-8)': 'Implement v2 endpoints with enhanced features',
        'Deprecation (Month 6)':
          'Begin deprecation notices for legacy endpoints',
        'Sunset (Month 12)': 'Remove deprecated endpoints',
      },
    };
  }

  /**
   * Log version usage for analytics
   */
  logVersionUsage(
    endpoint: string,
    version: string,
    clientInfo: {
      userAgent?: string;
      clientIp?: string;
      clientVersion?: string;
    },
  ): void {
    this.logger.log(`Version Usage: ${version} - ${endpoint}`, {
      version,
      endpoint,
      ...clientInfo,
      timestamp: new Date().toISOString(),
    });

    // In production, this would send data to analytics service
  }

  /**
   * Check if client needs to upgrade
   */
  checkClientUpgradeRequired(clientVersion: string): {
    upgradeRequired: boolean;
    currentVersion: string;
    latestVersion: string;
    deprecationWarning?: string;
  } {
    const defaultVersion = ApiVersionStrategy.getDefaultVersion();
    const isDeprecated = ApiVersionStrategy.isDeprecated(clientVersion);
    const isSunset = ApiVersionStrategy.isSunset(clientVersion);

    return {
      upgradeRequired: isSunset,
      currentVersion: clientVersion,
      latestVersion: 'v2',
      deprecationWarning: isDeprecated
        ? `Version ${clientVersion} is deprecated and will be sunset soon. Please upgrade to ${defaultVersion} or later.`
        : undefined,
    };
  }
}
