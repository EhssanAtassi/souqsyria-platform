import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessControlModule } from '../../access-control/access-control.module';
import { CountryService } from './service/country.service';
import { CountryController } from './controller/country.controller';
import { Country } from './entities/country.entity';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../access-control/entities/route.entity'; // Import your ACL module!

@Module({
  imports: [
    TypeOrmModule.forFeature([Country, User, Route]),
    AccessControlModule, // <-- Fix: Import here!
  ],
  providers: [CountryService],
  controllers: [CountryController],
  exports: [CountryService],
})
export class CountryModule {}
