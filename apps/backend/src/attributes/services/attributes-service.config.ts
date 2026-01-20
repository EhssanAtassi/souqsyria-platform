/**
 * @file attributes-service.config.ts
 * @description Configuration constants and settings for AttributesService
 *
 * Why needed: Centralizes all configuration values used by the service,
 * making it easier to adjust behavior without code changes and
 * enabling environment-specific configurations.
 */

export const ATTRIBUTES_SERVICE_CONFIG = {
  // ============================================================================
  // PAGINATION SETTINGS
  // ============================================================================

  /** Default page size for attribute listings */
  DEFAULT_PAGE_SIZE: 20,

  /** Maximum page size to prevent performance issues */
  MAX_PAGE_SIZE: 100,

  /** Default sort field for attribute queries */
  DEFAULT_SORT_FIELD: 'displayOrder',

  /** Default sort direction */
  DEFAULT_SORT_ORDER: 'ASC' as 'ASC' | 'DESC',

  // ============================================================================
  // VALIDATION LIMITS
  // ============================================================================

  /** Maximum number of values per attribute */
  MAX_VALUES_PER_ATTRIBUTE: 100,

  /** Minimum search term length */
  MIN_SEARCH_LENGTH: 2,

  /** Maximum search term length */
  MAX_SEARCH_LENGTH: 100,

  /** Maximum number of search results */
  MAX_SEARCH_RESULTS: 50,

  /** Maximum display order value */
  MAX_DISPLAY_ORDER: 999,

  // ============================================================================
  // BUSINESS RULES
  // ============================================================================

  /** Minimum number of active values required per attribute */
  MIN_ACTIVE_VALUES: 1,

  /** Warn if attribute has more than this many values */
  PERFORMANCE_WARNING_THRESHOLD: 50,

  /** Default validation rules for different attribute types */
  DEFAULT_VALIDATION_RULES: {
    text: {
      minLength: 1,
      maxLength: 255,
    },
    number: {
      min: 0,
      max: 999999,
    },
    color: {
      pattern: '^#[0-9A-Fa-f]{6}$', // Hex color pattern
    },
    email: {
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    },
    url: {
      pattern: '^https?:\\/\\/.+',
    },
    phone: {
      pattern: '^\\+?[1-9]\\d{1,14}$', // E.164 format
    },
  },

  // ============================================================================
  // CACHING SETTINGS
  // ============================================================================

  /** Cache TTL for filterable attributes (seconds) */
  FILTERABLE_ATTRIBUTES_CACHE_TTL: 3600 as number, // 1 hour

  /** Cache TTL for required attributes (seconds) */
  REQUIRED_ATTRIBUTES_CACHE_TTL: 7200 as number, // 2 hours

  /** Cache TTL for attribute statistics (seconds) */
  STATISTICS_CACHE_TTL: 1800 as number, // 30 minutes

  /** Cache TTL for individual attributes (seconds) */
  ATTRIBUTE_CACHE_TTL: 1800 as number, // 30 minutes

  /** Cache key prefixes */
  CACHE_KEYS: {
    FILTERABLE_ATTRIBUTES: 'attributes:filterable',
    REQUIRED_ATTRIBUTES: 'attributes:required',
    ATTRIBUTE_STATS: 'attributes:stats',
    ATTRIBUTE_BY_ID: 'attribute:id',
    ATTRIBUTE_VALUES: 'attribute:values',
    ATTRIBUTE_SEARCH: 'attributes:search',
  },

  // ============================================================================
  // LOCALIZATION SETTINGS
  // ============================================================================

  /** Supported languages */
  SUPPORTED_LANGUAGES: ['en', 'ar'] as readonly string[],

  /** Default language */
  DEFAULT_LANGUAGE: 'en' as 'en' | 'ar',

  /** RTL languages */
  RTL_LANGUAGES: ['ar'] as readonly string[],

  // ============================================================================
  // AUDIT AND LOGGING
  // ============================================================================

  /** Log levels for different operations */
  LOG_LEVELS: {
    CREATE: 'log',
    UPDATE: 'log',
    DELETE: 'warn',
    VALIDATION_ERROR: 'error',
    PERFORMANCE_WARNING: 'warn',
  },

  /** Operations that require audit logging */
  AUDIT_OPERATIONS: [
    'CREATE_ATTRIBUTE',
    'UPDATE_ATTRIBUTE',
    'DELETE_ATTRIBUTE',
    'CREATE_VALUE',
    'UPDATE_VALUE',
    'DELETE_VALUE',
    'BULK_UPDATE_ORDER',
  ],

  // ============================================================================
  // PERFORMANCE SETTINGS
  // ============================================================================

  /** Query timeout in milliseconds */
  QUERY_TIMEOUT_MS: 30000, // 30 seconds

  /** Bulk operation batch size */
  BULK_BATCH_SIZE: 100,

  /** Enable query result caching */
  ENABLE_QUERY_CACHE: true,

  /** Enable performance monitoring */
  ENABLE_PERFORMANCE_MONITORING: true,

  /** Slow query threshold in milliseconds */
  SLOW_QUERY_THRESHOLD_MS: 1000 as number, // 1 second

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /** Retry attempts for transient failures */
  MAX_RETRY_ATTEMPTS: 3,

  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: 1000 as number,

  /** Circuit breaker threshold */
  CIRCUIT_BREAKER_THRESHOLD: 5,

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================

  /** Enable advanced validation */
  ENABLE_ADVANCED_VALIDATION: true,

  /** Enable attribute usage analytics */
  ENABLE_USAGE_ANALYTICS: true,

  /** Enable automatic cache warming */
  ENABLE_CACHE_WARMING: true,

  /** Enable soft delete protection */
  ENABLE_SOFT_DELETE_PROTECTION: true,
};

/**
 * Type definitions for configuration
 */
export type AttributesServiceConfig = typeof ATTRIBUTES_SERVICE_CONFIG;
export type SupportedLanguage = 'en' | 'ar';
export type CacheKey = keyof typeof ATTRIBUTES_SERVICE_CONFIG.CACHE_KEYS;

/**
 * Environment-specific configuration override
 *
 * Why needed: Different environments (dev, staging, prod) may need
 * different settings for performance, caching, and feature flags.
 */
export function getAttributesServiceConfig(
  environment: string = 'production',
): AttributesServiceConfig {
  const baseConfig = { ...ATTRIBUTES_SERVICE_CONFIG };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        // Shorter cache TTLs for development
        FILTERABLE_ATTRIBUTES_CACHE_TTL: 300, // 5 minutes
        REQUIRED_ATTRIBUTES_CACHE_TTL: 600, // 10 minutes
        STATISTICS_CACHE_TTL: 180, // 3 minutes
        // More verbose logging
        ENABLE_PERFORMANCE_MONITORING: true,
        SLOW_QUERY_THRESHOLD_MS: 500, // 500ms
      };

    case 'staging':
      return {
        ...baseConfig,
        // Moderate cache TTLs for staging
        FILTERABLE_ATTRIBUTES_CACHE_TTL: 1800, // 30 minutes
        REQUIRED_ATTRIBUTES_CACHE_TTL: 3600, // 1 hour
        STATISTICS_CACHE_TTL: 900, // 15 minutes
      };

    case 'production':
    default:
      return baseConfig;
  }
}

/**
 * Validation helper for configuration values
 *
 * Why needed: Ensures configuration values are valid during
 * application startup to prevent runtime errors.
 */
export function validateServiceConfig(config: AttributesServiceConfig): void {
  // Validate page size limits
  if (config.DEFAULT_PAGE_SIZE > config.MAX_PAGE_SIZE) {
    throw new Error('DEFAULT_PAGE_SIZE cannot be greater than MAX_PAGE_SIZE');
  }

  // Validate search length limits
  if (config.MIN_SEARCH_LENGTH >= config.MAX_SEARCH_LENGTH) {
    throw new Error('MIN_SEARCH_LENGTH must be less than MAX_SEARCH_LENGTH');
  }

  // Validate cache TTL values
  if (config.FILTERABLE_ATTRIBUTES_CACHE_TTL <= 0) {
    throw new Error('Cache TTL values must be positive');
  }

  // Validate retry settings
  if (config.MAX_RETRY_ATTEMPTS < 0) {
    throw new Error('MAX_RETRY_ATTEMPTS must be non-negative');
  }

  if (config.RETRY_DELAY_MS <= 0) {
    throw new Error('RETRY_DELAY_MS must be positive');
  }
}
