import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminDashboardService } from './services/admin-dashboard.service';

import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolePermission } from '../access-control/entities/role-permission.entity';
import { TokenBlacklist } from '../auth/entity/token-blacklist.entity';
import { Order } from '../orders/entities/order.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { StockAlertEntity } from '../stock/entities/stock-alert.entity';

// Import User Management Module
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      Role,
      RolePermission,
      TokenBlacklist,
      Order,
      VendorEntity,
      StockAlertEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    // Add User Management Module
    UserManagementModule,
  ],
  controllers: [AdminAuthController, AdminDashboardController],
  providers: [AdminAuthService, AdminDashboardService],
  exports: [AdminAuthService, AdminDashboardService],
})
export class AdminModule {}
