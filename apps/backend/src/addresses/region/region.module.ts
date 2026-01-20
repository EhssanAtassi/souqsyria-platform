import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessControlModule } from '../../access-control/access-control.module';
import { Country } from '../country/entities/country.entity';
import { Region } from './entities/region.entity';
import { RegionService } from './service/region.service';
import { RegionController } from './controller/region.controller';
import { Route } from '../../access-control/entities/route.entity';
import { User } from '../../users/entities/user.entity'; // Import your ACL module!

@Module({
  imports: [
    TypeOrmModule.forFeature([Region, Country, User, Route]),
    AccessControlModule,
  ],
  providers: [RegionService],
  controllers: [RegionController],
  exports: [RegionService],
})
export class RegionModule {}
