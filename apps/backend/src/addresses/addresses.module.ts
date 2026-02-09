import { Module } from '@nestjs/common';
import { AddressesService } from './service/addresses.service';
import { SyrianAddressService } from './service/syrian-address.service';
import { AddressesController } from './controller/addresses.controller';
import { GovernorateCityValidator } from './validators/valid-governorate-city.validator';
import { CountryModule } from './country/country.module';
import { RegionModule } from './region/region.module';
import { CityModule } from './city/city.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { SyrianAddressEntity } from './entities';
import { SyrianGovernorateEntity } from './entities';
import { SyrianCityEntity } from './entities';
import { SyrianDistrictEntity } from './entities';
import { User } from '../users/entities/user.entity';
import { Country } from './country/entities/country.entity';
import { Region } from './region/entities/region.entity';
import { City } from './city/entities/city.entity';
import { Route } from '../access-control/entities/route.entity';

/**
 * @module AddressesModule
 * @description Address management module with Syrian localization support
 *
 * FEATURES:
 * - Generic address management (country, region, city)
 * - Syrian-specific address structure (governorate, city, district)
 * - Address validation and hierarchy checks
 * - Default address management
 * - Delivery zone support
 *
 * SERVICES:
 * - AddressesService: Main address CRUD operations
 * - SyrianAddressService: Syrian-specific address operations
 * - GovernorateCityValidator: Validates Syrian administrative hierarchy
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */
@Module({
  providers: [
    AddressesService,
    SyrianAddressService,
    GovernorateCityValidator,
  ],
  controllers: [AddressesController],
  imports: [
    TypeOrmModule.forFeature([
      Address,
      SyrianAddressEntity,
      SyrianGovernorateEntity,
      SyrianCityEntity,
      SyrianDistrictEntity,
      User,
      Route,
      Country,
      Region,
      City,
    ]),
    CountryModule,
    RegionModule,
    CityModule,
  ],
  exports: [AddressesService, SyrianAddressService, GovernorateCityValidator],
})
export class AddressesModule {}
