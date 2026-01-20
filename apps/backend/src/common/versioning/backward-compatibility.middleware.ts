import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiVersionStrategy } from './api-version.strategy';

/**
 * Extended Request interface with version info
 */
interface VersionedRequest extends Request {
  apiVersion?: string;
  isLegacyEndpoint?: boolean;
  migrationPath?: string;
}

/**
 * Backward Compatibility Middleware
 *
 * Handles legacy API endpoints by:
 * - Detecting legacy endpoint patterns
 * - Adding deprecation warnings
 * - Providing migration guidance
 * - Logging legacy usage for analytics
 */
@Injectable()
export class BackwardCompatibilityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BackwardCompatibilityMiddleware.name);

  use(req: VersionedRequest, res: Response, next: NextFunction) {
    const originalPath = req.path;

    // Detect if this is a legacy endpoint
    const isLegacyEndpoint = this.detectLegacyEndpoint(originalPath);

    if (isLegacyEndpoint) {
      // Get migration path
      const migrationPath = ApiVersionStrategy.getMigrationPath(originalPath);

      // Add version information to request
      req.apiVersion = this.extractVersionFromPath(originalPath) || 'v1';
      req.isLegacyEndpoint = true;
      req.migrationPath = migrationPath;

      // Add deprecation headers
      this.addDeprecationHeaders(res, originalPath, migrationPath);

      // Log legacy usage
      this.logLegacyUsage(req, originalPath, migrationPath);
    }

    next();
  }

  /**
   * Detect if endpoint is using legacy pattern
   */
  private detectLegacyEndpoint(path: string): boolean {
    // Already versioned endpoints (mobile APIs) - not legacy
    if (path.startsWith('/api/mobile/v')) {
      return false;
    }

    // Internal/seeding endpoints - not legacy
    if (path.startsWith('/seed/')) {
      return false;
    }

    // New versioning endpoints - not legacy
    if (path.startsWith('/api/versioning')) {
      return false;
    }

    // Swagger docs - not legacy
    if (path.startsWith('/api/docs') || path === '/api') {
      return false;
    }

    // Health check and static endpoints - not legacy
    if (path === '/health' || path.startsWith('/assets')) {
      return false;
    }

    // Check for legacy patterns:
    // 1. No /api prefix (e.g., /products, /vendors, /orders)
    // 2. Mixed /api prefix without version (e.g., /api/admin/commissions)
    // 3. Admin endpoints without consistent prefix (e.g., /admin/brands)

    const legacyPatterns = [
      // No /api prefix - public APIs
      /^\/(?!api|seed|health|assets)[a-z-]+/,

      // Admin endpoints without version
      /^\/admin\/[a-z-]+/,

      // /api prefix but no version
      /^\/api\/(?!mobile\/v|v\d+|versioning|docs?$)[a-z-]+/,
    ];

    return legacyPatterns.some((pattern) => pattern.test(path));
  }

  /**
   * Extract version from path if present
   */
  private extractVersionFromPath(path: string): string | undefined {
    // Check for mobile version
    const mobileMatch = path.match(/\/api\/mobile\/v(\d+)\//);
    if (mobileMatch) {
      return `mobile/v${mobileMatch[1]}`;
    }

    // Check for standard version
    const versionMatch = path.match(/\/api\/v(\d+)\//);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }

    return undefined;
  }

  /**
   * Add deprecation headers to response
   */
  private addDeprecationHeaders(
    res: Response,
    originalPath: string,
    migrationPath: string,
  ): void {
    // Standard deprecation headers
    res.setHeader('X-API-Legacy-Endpoint', 'true');
    res.setHeader('X-API-Migration-Path', migrationPath);
    res.setHeader(
      'X-API-Deprecation-Notice',
      'This endpoint uses legacy format. Consider migrating to versioned API.',
    );

    // Sunset date (6 months from now)
    const sunsetDate = new Date();
    sunsetDate.setMonth(sunsetDate.getMonth() + 6);
    res.setHeader('X-API-Sunset-Date', sunsetDate.toISOString());

    // Link to migration guide
    res.setHeader(
      'X-API-Migration-Guide',
      '/api/versioning/migrate-endpoint?path=' +
        encodeURIComponent(originalPath.substring(1)),
    );

    // Warning header (RFC 7234)
    const warningMessage = `Legacy API endpoint. Migrate to ${migrationPath} by ${sunsetDate.toDateString()}.`;
    res.setHeader('Warning', `299 - "${warningMessage}"`);

    // Add CORS headers to expose deprecation headers to clients
    const exposedHeaders =
      (res.getHeader('Access-Control-Expose-Headers') as string) || '';
    const additionalHeaders = [
      'X-API-Legacy-Endpoint',
      'X-API-Migration-Path',
      'X-API-Deprecation-Notice',
      'X-API-Sunset-Date',
      'X-API-Migration-Guide',
      'Warning',
    ];

    const allExposedHeaders = exposedHeaders
      ? `${exposedHeaders}, ${additionalHeaders.join(', ')}`
      : additionalHeaders.join(', ');

    res.setHeader('Access-Control-Expose-Headers', allExposedHeaders);
  }

  /**
   * Log legacy usage for analytics
   */
  private logLegacyUsage(
    req: VersionedRequest,
    originalPath: string,
    migrationPath: string,
  ): void {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const referer = req.headers.referer || 'unknown';

    this.logger.warn(`Legacy API Usage Detected`, {
      originalPath,
      migrationPath,
      method: req.method,
      userAgent,
      clientIp,
      referer,
      timestamp: new Date().toISOString(),
      headers: {
        'x-api-version': req.headers['x-api-version'],
        'x-client-version': req.headers['x-client-version'],
      },
    });

    // In production, this would also:
    // 1. Send data to analytics service (e.g., Google Analytics, Mixpanel)
    // 2. Update usage metrics in database
    // 3. Trigger alerts if usage spikes
    // 4. Generate reports for stakeholders
  }

  /**
   * Generate migration suggestions for specific endpoints
   */
  private generateMigrationSuggestions(originalPath: string): string[] {
    const suggestions = [
      `Update API calls from '${originalPath}' to '${ApiVersionStrategy.getMigrationPath(originalPath)}'`,
      'Add X-API-Version header to explicitly specify version',
      'Review API documentation for breaking changes',
      'Test integration with new versioned endpoint',
    ];

    // Add specific suggestions based on endpoint type
    if (originalPath.includes('/admin/')) {
      suggestions.push('Admin APIs now use consistent /api/v1/admin prefix');
    }

    if (originalPath.match(/^\/[a-z-]+$/)) {
      suggestions.push('Public APIs now require /api/v1 prefix');
    }

    return suggestions;
  }
}
