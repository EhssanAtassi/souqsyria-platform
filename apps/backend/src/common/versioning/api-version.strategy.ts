/**
 * API Versioning Strategy for SouqSyria
 *
 * Defines the comprehensive versioning approach for all APIs
 * including backward compatibility, deprecation, and migration paths.
 */

/**
 * API Version Configuration
 */
export interface ApiVersionConfig {
  version: string;
  isDefault?: boolean;
  deprecatedAt?: Date;
  sunsetAt?: Date;
  description: string;
  compatibilityNotes?: string[];
}

/**
 * SouqSyria API Versioning Strategy
 */
export class ApiVersionStrategy {
  /**
   * Supported API versions
   */
  static readonly SUPPORTED_VERSIONS: ApiVersionConfig[] = [
    {
      version: 'v1',
      isDefault: true,
      description: 'Initial stable API version',
      compatibilityNotes: [
        'Legacy endpoints without /api prefix supported for backward compatibility',
        'Syrian market features fully supported',
        'Mobile-optimized endpoints available',
      ],
    },
    {
      version: 'v2',
      description: 'Enhanced API with improved consistency and new features',
      compatibilityNotes: [
        'All endpoints use consistent /api/v2 prefix',
        'Enhanced error responses with detailed codes',
        'Improved pagination and filtering',
        'New bulk operations support',
      ],
    },
  ];

  /**
   * API endpoint categories and their migration status
   */
  static readonly ENDPOINT_CATEGORIES = {
    // Already versioned (keep as-is)
    MOBILE: {
      current: 'api/mobile/v1',
      pattern: /^api\/mobile\/v\d+/,
      status: 'versioned',
      description: 'Mobile-specific APIs for React Native/Flutter apps',
    },

    // Admin APIs (needs standardization)
    ADMIN: {
      current: ['api/admin', 'admin'],
      target: 'api/v1/admin',
      pattern: /^(api\/)?admin/,
      status: 'needs_migration',
      description: 'Administrative APIs for staff and management',
    },

    // Public APIs (needs versioning)
    PUBLIC: {
      current: ['/', 'api/'],
      target: 'api/v1',
      pattern: /^(?!api\/mobile|admin|seed)/,
      status: 'needs_versioning',
      description: 'Public APIs for customers and external integrations',
    },

    // Seeding APIs (internal, no versioning needed)
    SEEDING: {
      current: 'seed',
      pattern: /^seed\//,
      status: 'internal',
      description: 'Development and testing data seeding endpoints',
    },
  };

  /**
   * Version compatibility matrix
   */
  static readonly COMPATIBILITY_MATRIX = {
    v1: {
      supportedUntil: new Date('2025-12-31'),
      backwardCompatible: true,
      legacySupport: true,
    },
    v2: {
      introducedAt: new Date('2025-09-01'),
      backwardCompatible: true,
      legacySupport: false,
    },
  };

  /**
   * Get default API version
   */
  static getDefaultVersion(): string {
    const defaultVersion = this.SUPPORTED_VERSIONS.find((v) => v.isDefault);
    return defaultVersion?.version || 'v1';
  }

  /**
   * Check if version is supported
   */
  static isSupportedVersion(version: string): boolean {
    return this.SUPPORTED_VERSIONS.some((v) => v.version === version);
  }

  /**
   * Get version configuration
   */
  static getVersionConfig(version: string): ApiVersionConfig | undefined {
    return this.SUPPORTED_VERSIONS.find((v) => v.version === version);
  }

  /**
   * Check if version is deprecated
   */
  static isDeprecated(version: string): boolean {
    const config = this.getVersionConfig(version);
    return config?.deprecatedAt ? new Date() > config.deprecatedAt : false;
  }

  /**
   * Check if version is sunset (no longer supported)
   */
  static isSunset(version: string): boolean {
    const config = this.getVersionConfig(version);
    return config?.sunsetAt ? new Date() > config.sunsetAt : false;
  }

  /**
   * Get migration path for legacy endpoints
   */
  static getMigrationPath(legacyPath: string): string {
    // Mobile APIs - already versioned
    if (this.ENDPOINT_CATEGORIES.MOBILE.pattern.test(legacyPath)) {
      return legacyPath; // Keep as-is
    }

    // Admin APIs
    if (this.ENDPOINT_CATEGORIES.ADMIN.pattern.test(legacyPath)) {
      return legacyPath.replace(/^(api\/)?admin/, 'api/v1/admin');
    }

    // Seeding APIs - internal, no change
    if (this.ENDPOINT_CATEGORIES.SEEDING.pattern.test(legacyPath)) {
      return legacyPath; // Keep as-is
    }

    // Public APIs - add versioning
    const hasApiPrefix = legacyPath.startsWith('api/');
    if (hasApiPrefix) {
      return legacyPath.replace('api/', 'api/v1/');
    } else {
      // Remove leading slash and add versioning prefix
      const cleanPath = legacyPath.startsWith('/')
        ? legacyPath.substring(1)
        : legacyPath;
      return `api/v1/${cleanPath}`;
    }
  }

  /**
   * Generate versioning report for current endpoints
   */
  static generateMigrationReport(): {
    category: string;
    current: string;
    target: string;
    status: string;
    priority: 'high' | 'medium' | 'low';
  }[] {
    return [
      {
        category: 'Public APIs',
        current: 'vendors, products, payments, orders',
        target:
          'api/v1/vendors, api/v1/products, api/v1/payments, api/v1/orders',
        status: 'needs_versioning',
        priority: 'high',
      },
      {
        category: 'Admin APIs',
        current: 'admin/brands, admin/stock, api/admin/commissions',
        target:
          'api/v1/admin/brands, api/v1/admin/stock, api/v1/admin/commissions',
        status: 'needs_standardization',
        priority: 'medium',
      },
      {
        category: 'Mobile APIs',
        current: 'api/mobile/v1/*',
        target: 'No change needed',
        status: 'compliant',
        priority: 'low',
      },
      {
        category: 'Seeding APIs',
        current: 'seed/*, */seeding',
        target: 'Standardize to seed/* pattern',
        status: 'internal_cleanup',
        priority: 'low',
      },
    ];
  }
}
