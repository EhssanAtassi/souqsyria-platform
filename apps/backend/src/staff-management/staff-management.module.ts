import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffManagementService } from './staff-management.service';
import { StaffManagementController } from './staff-management.controller';

// Seeding Components
import { StaffManagementSeederService } from './seeds/staff-management-seeder.service';
import { StaffManagementSeederController } from './seeds/staff-management-seeder.controller';

import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { ActivityLog } from '../access-control/entities/activity-log.entity';
import { Route } from '../access-control/entities/route.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, ActivityLog, Route]),
    AccessControlModule,
    UsersModule,
  ],
  controllers: [
    StaffManagementController,
    StaffManagementSeederController,
  ],
  providers: [
    StaffManagementService,
    StaffManagementSeederService,
  ],
  exports: [
    StaffManagementService,
    StaffManagementSeederService,
  ],
})
export class StaffManagementModule {}
