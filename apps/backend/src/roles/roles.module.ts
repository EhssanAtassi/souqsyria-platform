import { forwardRef, Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from '../access-control/entities/role-permission.entity';
import { Permission } from '../access-control/entities/permission.entity';
import { RolesController } from './roles.controller';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

// Seeding Components
import { RolesSeederService } from './seeds/roles-seeder.service';
import { RolesSeederController } from './seeds/roles-seeder.controller';

import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, RolePermission, Permission]),
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
