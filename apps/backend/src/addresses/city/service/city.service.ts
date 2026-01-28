import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../entities/city.entity';
import { Country } from '../../country/entities/country.entity';
import { Region } from '../../region/entities/region.entity';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
  ) {}

  async create(dto: CreateCityDto): Promise<City> {
    const country = await this.countryRepo.findOne({
      where: { id: dto.countryId },
    });
    if (!country) throw new NotFoundException('Country not found');
    let region = null;
    if (dto.regionId) {
      region = await this.regionRepo.findOne({ where: { id: dto.regionId } })!;
      if (!region) throw new NotFoundException('Region not found');
    }
    const city = this.cityRepo.create({
      ...dto,
      country,
      region,
    });
    return this.cityRepo.save(city);
  }

  async findAll(): Promise<City[]> {
    return this.cityRepo.find({
      relations: ['country', 'region'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<City> {
    const city = await this.cityRepo.findOne({
      where: { id },
      relations: ['country', 'region'],
    });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async update(id: number, dto: UpdateCityDto): Promise<City> {
    const city = await this.findOne(id);
    if (dto.countryId && dto.countryId !== city.country.id) {
      const country = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });
      if (!country) throw new NotFoundException('Country not found');
      city.country = country;
    }
    if (dto.regionId && (!city.region || dto.regionId !== city.region.id)) {
      const region = await this.regionRepo.findOne({
        where: { id: dto.regionId },
      });
      if (!region) throw new NotFoundException('Region not found');
      city.region = region;
    }
    Object.assign(city, dto);
    return this.cityRepo.save(city);
  }

  async remove(id: number): Promise<void> {
    const city = await this.findOne(id);
    await this.cityRepo.remove(city);
  }
}
