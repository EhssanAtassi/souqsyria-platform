/**
 * @file guards.module.ts
 * @description Global guards module that provides PermissionsGuard to all modules
 */
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../access-control/entities/route.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Route])],
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class GuardsModule {}
