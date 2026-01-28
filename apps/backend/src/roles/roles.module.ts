import { forwardRef, Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from '../access-control/entities/role-permission.entity';
import { Permission } from '../access-control/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { RolesController } from './roles.controller';

// Seeding Components
import { RolesSeederService } from './seeds/roles-seeder.service';
import { RolesSeederController } from './seeds/roles-seeder.controller';

import { AccessControlModule } from '../access-control/access-control.module';

/**
 * RolesModule
 * 
 * Provides comprehensive role management capabilities including:
 * - CRUD operations for roles
 * - Role templates for quick creation
 * - Bulk permission assignment
 * - User tracking and assignment
 * - Role hierarchy and priority
 * - Security audit integration
 * 
 * Dependencies:
 * - AccessControlModule: For permissions and security audit
 * - TypeORM entities: Role, RolePermission, Permission, User
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, RolePermission, Permission, User]),
    forwardRef(() => AccessControlModule),
  ],
  controllers: [
    RolesController,
    RolesSeederController,
  ],
  providers: [
    RolesService,
    RolesSeederService,
  ],
  exports: [
    RolesService,
    RolesSeederService,
    TypeOrmModule,
  ],
})
export class RolesModule {}
