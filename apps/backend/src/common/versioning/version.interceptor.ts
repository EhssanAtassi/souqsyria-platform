import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import {
  API_VERSION_METADATA,
  API_DEPRECATION_METADATA,
  VersionConfig,
} from './version.decorator';

/**
 * API Version Interceptor
 *
 * Handles API versioning concerns including:
 * - Version detection from headers/path
 * - Deprecation warnings
 * - Response headers for version information
 * - Client compatibility checks
 */
@Injectable()
export class VersionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(VersionInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get version metadata from controller/method
    const versionConfig = this.reflector.getAllAndOverride<VersionConfig>(
      API_VERSION_METADATA,
      [context.getHandler(), context.getClass()],
    );

    const deprecationConfig = this.reflector.getAllAndOverride<any>(
      API_DEPRECATION_METADATA,
      [context.getHandler(), context.getClass()],
    );

    // Detect client version
    const clientVersion = this.detectClientVersion(request);

    // Log version usage for analytics
    this.logVersionUsage(request, versionConfig?.version, clientVersion);

    // Set response headers
    this.setVersionHeaders(response, versionConfig, deprecationConfig);

    return next.handle().pipe(
      map((data) => {
        // Modify response based on version
        return this.transformResponseByVersion(
          data,
          versionConfig,
          clientVersion,
        );
      }),
    );
  }

  /**
   * Detect client API version from various sources
   */
  private detectClientVersion(request: Request): string | undefined {
    // 1. Check X-API-Version header
    const headerVersion = request.headers['x-api-version'] as string;
    if (headerVersion) {
      return headerVersion;
    }

    // 2. Check Accept header for version
    const acceptHeader = request.headers.accept as string;
    if (acceptHeader && acceptHeader.includes('version=')) {
      const versionMatch = acceptHeader.match(/version=([^,;]+)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    }

    // 3. Extract from URL path (e.g., /api/v1/products -> v1)
    const pathMatch = request.path.match(/\/api\/v(\d+)\//);
    if (pathMatch) {
      return `v${pathMatch[1]}`;
    }

    // 4. Extract from mobile API path (e.g., /api/mobile/v1/products -> mobile/v1)
    const mobilePathMatch = request.path.match(/\/api\/mobile\/v(\d+)\//);
    if (mobilePathMatch) {
      return `mobile/v${mobilePathMatch[1]}`;
    }

    // 5. Check query parameter
    const queryVersion = request.query.version as string;
    if (queryVersion) {
      return queryVersion;
    }

    return undefined;
  }

  /**
   * Set version-related response headers
   */
  private setVersionHeaders(
    response: Response,
    versionConfig?: VersionConfig,
    deprecationConfig?: any,
  ): void {
    // Set current API version
    if (versionConfig?.version) {
      response.setHeader('X-API-Version', versionConfig.version);
    }

    // Set supported versions
    response.setHeader('X-API-Supported-Versions', 'v1, v2, mobile/v1');

    // Set deprecation warning if deprecated
    if (deprecationConfig) {
      response.setHeader('X-API-Deprecated', 'true');

      if (deprecationConfig.deprecationDate) {
        response.setHeader(
          'X-API-Deprecation-Date',
          deprecationConfig.deprecationDate.toISOString(),
        );
      }

      if (deprecationConfig.sunsetDate) {
        response.setHeader(
          'X-API-Sunset-Date',
          deprecationConfig.sunsetDate.toISOString(),
        );
      }

      if (deprecationConfig.migrationGuide) {
        response.setHeader(
          'X-API-Migration-Guide',
          deprecationConfig.migrationGuide,
        );
      }

      // Add deprecation warning to response
      const warningMessage = `API endpoint deprecated. ${
        deprecationConfig.sunsetDate
          ? `Will be removed on ${deprecationConfig.sunsetDate.toDateString()}.`
          : 'Will be removed in a future version.'
      } ${
        deprecationConfig.migrationGuide
          ? `See migration guide: ${deprecationConfig.migrationGuide}`
          : ''
      }`.trim();

      response.setHeader('Warning', `299 - "${warningMessage}"`);
    }

    // Set caching headers based on version stability
    if (versionConfig?.version === 'v2') {
      // v2 is newer, shorter cache
      response.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else if (deprecationConfig) {
      // Deprecated APIs should not be cached
      response.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate',
      );
    }
  }

  /**
   * Transform response based on API version
   */
  private transformResponseByVersion(
    data: any,
    versionConfig?: VersionConfig,
    clientVersion?: string,
  ): any {
    // Add version metadata to response
    if (data && typeof data === 'object') {
      const responseWithMeta = {
        ...data,
        _meta: {
          ...((data as any)?._meta || {}),
          apiVersion: versionConfig?.version || 'v1',
          clientVersion: clientVersion || 'unknown',
          timestamp: new Date().toISOString(),
        },
      };

      // Add deprecation warning to response body if deprecated
      if (versionConfig?.deprecated) {
        responseWithMeta._meta.deprecated = true;
        responseWithMeta._meta.deprecationNotice = `This API version (${versionConfig.version}) is deprecated.`;

        if (versionConfig.sunsetDate) {
          responseWithMeta._meta.sunsetDate =
            versionConfig.sunsetDate.toISOString();
        }

        if (versionConfig.migrationGuide) {
          responseWithMeta._meta.migrationGuide = versionConfig.migrationGuide;
        }
      }

      return responseWithMeta;
    }

    return data;
  }

  /**
   * Log version usage for analytics
   */
  private logVersionUsage(
    request: Request,
    apiVersion?: string,
    clientVersion?: string,
  ): void {
    const userAgent = request.headers['user-agent'];
    const clientIp = request.ip || request.connection.remoteAddress;

    this.logger.log(`API Version Usage: ${request.method} ${request.path}`, {
      apiVersion: apiVersion || 'unversioned',
      clientVersion: clientVersion || 'not-specified',
      userAgent,
      clientIp,
      timestamp: new Date().toISOString(),
    });

    // Track deprecated API usage
    if (apiVersion && this.isDeprecatedVersion(apiVersion)) {
      this.logger.warn(
        `Deprecated API Usage: ${request.method} ${request.path}`,
        {
          apiVersion,
          clientVersion,
          userAgent,
          clientIp,
        },
      );
    }
  }

  /**
   * Check if version is deprecated
   */
  private isDeprecatedVersion(version: string): boolean {
    // Add logic to check against deprecated versions list
    // This could be loaded from configuration or database
    const deprecatedVersions = ['v0', 'beta']; // Example
    return deprecatedVersions.includes(version);
  }
}
