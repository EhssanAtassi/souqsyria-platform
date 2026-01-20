import { Module } from '@nestjs/common';
import { DescriptionsService } from './descriptions.service';
import { DescriptionsController } from './descriptions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDescriptionEntity } from '../entities/product-description.entity';
import { ProductEntity } from '../entities/product.entity';
import { Route } from '../../access-control/entities/route.entity';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductDescriptionEntity, // ✅ required for repo injection
      ProductEntity, // ✅ needed to resolve product relation
      Route, // ✅ This fixes the PermissionsGuard dependency
      User,
    ]),
  ],
  providers: [DescriptionsService],
  controllers: [DescriptionsController],
  exports: [DescriptionsService],
})
export class DescriptionsModule {}
