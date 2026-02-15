import { Module } from '@nestjs/common';
import { AddressesService } from './service/addresses.service';
import { SyrianAddressService } from './service/syrian-address.service';
import { SyrianAddressCrudService } from './service/syrian-address-crud.service';
import { AddressValidationService } from './service/address-validation.service';
import { AddressQueryService } from './service/address-query.service';
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
 * - Geospatial query utilities
 *
 * SERVICES:
 * - AddressesService: Generic address CRUD operations
 * - SyrianAddressCrudService: Syrian-specific address CRUD operations
 * - SyrianAddressService: Syrian address seeding, lookup, and delivery info
 * - AddressQueryService: Read-only address query operations
 * - AddressValidationService: Validation and geospatial utilities
 * - GovernorateCityValidator: Validates Syrian administrative hierarchy
 *
 * @author SouqSyria Development Team
 * @version 2.0.0 - MVP1 God Service Refactor
 */
@Module({
  providers: [
    AddressesService,
    SyrianAddressService,
    SyrianAddressCrudService,
    AddressValidationService,
    AddressQueryService,
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
      Country,
      Region,
      City,
    ]),
    CountryModule,
    RegionModule,
    CityModule,
  ],
  exports: [
    AddressesService,
    SyrianAddressService,
    SyrianAddressCrudService,
    AddressValidationService,
    AddressQueryService,
    GovernorateCityValidator,
  ],
})
export class AddressesModule {}
