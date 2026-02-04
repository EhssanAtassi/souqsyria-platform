import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { FeatureEntity } from './entities/feature.entity';
import { ProductFeatureEntity } from './entities/product-feature.entity';
import { ProductEntity } from '../products/entities/product.entity';

// Services
import { FeaturesService } from './services/features.service';

// Controllers
import { FeaturesController } from './controllers/features.controller';

// Seeding Components
import { FeaturesSeederService } from './seeds/features-seeder.service';
import { FeaturesSeederController } from './seeds/features-seeder.controller';

// Modules
import { AccessControlModule } from '../access-control/access-control.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureEntity,
      ProductFeatureEntity,
      ProductEntity,
    ]),
    AccessControlModule,
    UsersModule,
  ],
  controllers: [
    FeaturesController,
    FeaturesSeederController,
  ],
  providers: [
    FeaturesService,
    FeaturesSeederService,
  ],
  exports: [
    FeaturesService,
    FeaturesSeederService,
    TypeOrmModule,
  ],
})
export class FeaturesModule {}
