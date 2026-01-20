import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { VersionInterceptor } from './version.interceptor';
import { VersionGuard } from './version.guard';
import { VersioningService } from './versioning.service';
import { VersioningController } from './versioning.controller';

/**
 * Versioning Module
 *
 * Provides comprehensive API versioning capabilities including:
 * - Version detection and routing
 * - Deprecation warnings and sunset enforcement
 * - Client compatibility checking
 * - Migration guidance and documentation
 * - Analytics and monitoring
 */
@Global()
@Module({
  controllers: [VersioningController],
  providers: [
    VersioningService,
    {
      provide: APP_INTERCEPTOR,
      useClass: VersionInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: VersionGuard,
    },
  ],
  exports: [VersioningService],
})
export class VersioningModule {}
