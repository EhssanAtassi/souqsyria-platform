import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessControlModule } from '../../access-control/access-control.module';
import { CityController } from './controller/city.controller';
import { City } from './entities/city.entity';
import { Country } from '../country/entities/country.entity';
import { Region } from '../region/entities/region.entity';
import { CityService } from './service/city.service';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../access-control/entities/route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([City, Country, Region, User, Route]),
    AccessControlModule,
  ],
  providers: [CityService],
  controllers: [CityController],
  exports: [CityService],
})
export class CityModule {}
