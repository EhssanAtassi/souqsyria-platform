import { Module } from '@nestjs/common';
import { AddressesService } from './service/addresses.service';
import { AddressesController } from './controller/addresses.controller';
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
@Module({
  providers: [AddressesService],
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
  exports: [AddressesService],
})
export class AddressesModule {}
