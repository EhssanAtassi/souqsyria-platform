import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiVersionStrategy } from './api-version.strategy';
import { API_VERSION_METADATA, VersionConfig } from './version.decorator';

/**
 * Version Guard
 *
 * Validates API version compatibility and enforces version requirements.
 * Handles version validation, sunset enforcement, and client compatibility.
 */
@Injectable()
export class VersionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Get version metadata from controller/method
    const versionConfig = this.reflector.getAllAndOverride<VersionConfig>(
      API_VERSION_METADATA,
      [context.getHandler(), context.getClass()],
    );

    // If no version metadata, allow request (backward compatibility)
    if (!versionConfig) {
      return true;
    }

    // Detect client version
    const clientVersion = this.detectClientVersion(request);
    const requiredVersion = versionConfig.version;

    // Validate version compatibility
    this.validateVersionCompatibility(
      clientVersion,
      requiredVersion,
      versionConfig,
    );

    // Check if version is sunset (no longer supported)
    if (ApiVersionStrategy.isSunset(requiredVersion)) {
      throw new HttpException(
        {
          error: 'API Version Sunset',
          message: `API version ${requiredVersion} is no longer supported. Please upgrade to a supported version.`,
          supportedVersions: ApiVersionStrategy.SUPPORTED_VERSIONS.map(
            (v) => v.version,
          ),
          upgradeGuide: '/docs/api-migration',
        },
        HttpStatus.GONE, // 410 Gone
      );
    }

    return true;
  }

  /**
   * Detect client API version from request
   */
  private detectClientVersion(request: Request): string | undefined {
    // 1. Check X-API-Version header (highest priority)
    const headerVersion = request.headers['x-api-version'] as string;
    if (headerVersion) {
      return headerVersion;
    }

    // 2. Extract from URL path
    const pathMatch = request.path.match(/\/api\/v(\d+)\//);
    if (pathMatch) {
      return `v${pathMatch[1]}`;
    }

    // 3. Extract from mobile API path
    const mobilePathMatch = request.path.match(/\/api\/mobile\/v(\d+)\//);
    if (mobilePathMatch) {
      return `v${mobilePathMatch[1]}`;
    }

    // 4. Check query parameter
    const queryVersion = request.query.version as string;
    if (queryVersion) {
      return queryVersion;
    }

    // 5. Check Accept header for version
    const acceptHeader = request.headers.accept as string;
    if (acceptHeader && acceptHeader.includes('version=')) {
      const versionMatch = acceptHeader.match(/version=([^,;]+)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    }

    return undefined;
  }

  /**
   * Validate version compatibility
   */
  private validateVersionCompatibility(
    clientVersion: string | undefined,
    requiredVersion: string,
    versionConfig: VersionConfig,
  ): void {
    // If no client version specified, allow for backward compatibility
    if (!clientVersion) {
      return;
    }

    // Check if client version is supported
    if (!ApiVersionStrategy.isSupportedVersion(clientVersion)) {
      throw new BadRequestException({
        error: 'Unsupported API Version',
        message: `API version '${clientVersion}' is not supported.`,
        supportedVersions: ApiVersionStrategy.SUPPORTED_VERSIONS.map(
          (v) => v.version,
        ),
        requestedVersion: clientVersion,
      });
    }

    // Handle version mismatch warnings (but allow request)
    if (clientVersion !== requiredVersion) {
      // Log version mismatch for analytics
      console.warn(
        `Version mismatch: Client requested ${clientVersion}, endpoint expects ${requiredVersion}`,
      );
    }

    // Check if client is using a deprecated version
    if (ApiVersionStrategy.isDeprecated(clientVersion)) {
      const config = ApiVersionStrategy.getVersionConfig(clientVersion);

      // Add deprecation info to request for interceptor to use
      // Temporarily disabled due to TypeScript scoping issue
      // (request as any).deprecationInfo = {
      //   version: clientVersion,
      //   deprecatedAt: config?.deprecatedAt,
      //   sunsetAt: config?.sunsetAt,
      //   migrationGuide: '/docs/api-migration',
      // };
    }

    // For strict version enforcement (can be enabled via configuration)
    const strictVersioning = process.env.STRICT_API_VERSIONING === 'true';
    if (strictVersioning && clientVersion !== requiredVersion) {
      throw new BadRequestException({
        error: 'Version Mismatch',
        message: `This endpoint requires API version '${requiredVersion}', but client specified '${clientVersion}'.`,
        requiredVersion,
        clientVersion,
        compatibilityMode: false,
      });
    }
  }
}
