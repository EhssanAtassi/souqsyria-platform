import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './service/audit-log.service';
import { AuditLogController } from './controller/audit-log.controller';

// Seeding Components
import { AuditLogSeederService } from './seeds/audit-log-seeder.service';
import { AuditLogSeederController } from './seeds/audit-log-seeder.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity';
import { ProductionLoggerService } from '../common/services/logger.service';
import { SentryService } from '../common/services/sentry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Route]),
    AccessControlModule,
  ],
  providers: [
    AuditLogService,
    AuditLogSeederService,
    ProductionLoggerService,
    SentryService,
  ],
  controllers: [
    AuditLogController,
    AuditLogSeederController,
  ],
  exports: [
    AuditLogService,
    AuditLogSeederService,
  ],
})
export class AuditLogModule {}
