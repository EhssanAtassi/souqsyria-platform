import { SetMetadata } from '@nestjs/common';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';

/**
 * API Version Metadata Key
 */
export const API_VERSION_METADATA = 'api_version';

/**
 * API Deprecation Metadata Key
 */
export const API_DEPRECATION_METADATA = 'api_deprecation';

/**
 * Version configuration interface
 */
export interface VersionConfig {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  migrationGuide?: string;
}

/**
 * API Version Decorator
 *
 * Marks controllers or methods with specific API version information.
 * Used for routing, deprecation notices, and documentation.
 *
 * @example
 * ```typescript
 * @ApiVersion({ version: 'v1' })
 * @Controller('api/v1/products')
 * export class ProductsV1Controller {}
 *
 * @ApiVersion({
 *   version: 'v1',
 *   deprecated: true,
 *   deprecationDate: new Date('2025-12-31'),
 *   migrationGuide: '/docs/migration/v1-to-v2'
 * })
 * @Get('legacy-endpoint')
 * async legacyMethod() {}
 * ```
 */
export const ApiVersion = (
  config: VersionConfig,
): ClassDecorator & MethodDecorator => {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    // Set version metadata
    SetMetadata(API_VERSION_METADATA, config)(target, propertyKey, descriptor);

    // Add deprecation metadata if deprecated
    if (config.deprecated) {
      SetMetadata(API_DEPRECATION_METADATA, {
        deprecationDate: config.deprecationDate,
        sunsetDate: config.sunsetDate,
        migrationGuide: config.migrationGuide,
      })(target, propertyKey, descriptor);
    }

    // Add Swagger documentation if applied to a method
    if (propertyKey && descriptor) {
      // Add version header documentation
      ApiHeader({
        name: 'X-API-Version',
        description: `API Version (current: ${config.version})`,
        required: false,
        example: config.version,
      })(target, propertyKey, descriptor);

      // Add deprecation warning if deprecated
      if (config.deprecated) {
        ApiResponse({
          status: 200,
          description: `⚠️ DEPRECATED: This endpoint is deprecated and will be removed on ${config.sunsetDate?.toDateString() || 'a future date'}. ${config.migrationGuide ? `Migration guide: ${config.migrationGuide}` : ''}`,
        })(target, propertyKey, descriptor);
      }
    }
  };
};

/**
 * Legacy API Decorator
 *
 * Shorthand for marking APIs as legacy/deprecated.
 * Automatically adds deprecation warnings and migration information.
 */
export const LegacyApi = (
  migrationPath?: string,
): ClassDecorator & MethodDecorator => {
  return ApiVersion({
    version: 'v1',
    deprecated: true,
    deprecationDate: new Date('2025-12-31'),
    sunsetDate: new Date('2026-06-30'),
    migrationGuide: migrationPath || '/docs/api-migration',
  });
};

/**
 * Versioned API Decorator
 *
 * Standard decorator for versioned APIs.
 */
export const VersionedApi = (
  version: string = 'v1',
): ClassDecorator & MethodDecorator => {
  return ApiVersion({
    version,
    deprecated: false,
  });
};

/**
 * Beta API Decorator
 *
 * Marks APIs as beta/experimental.
 */
export const BetaApi = (
  version: string = 'v2',
): ClassDecorator & MethodDecorator => {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    // Apply versioning
    ApiVersion({
      version,
      deprecated: false,
    })(target, propertyKey, descriptor);

    // Add beta warning if applied to a method
    if (propertyKey && descriptor) {
      ApiResponse({
        status: 200,
        description: `🧪 BETA: This is a beta endpoint and may change without notice. Use with caution in production.`,
      })(target, propertyKey, descriptor);

      ApiHeader({
        name: 'X-Beta-Features',
        description: 'Enable beta features (set to "true")',
        required: false,
        example: 'true',
      })(target, propertyKey, descriptor);
    }
  };
};
