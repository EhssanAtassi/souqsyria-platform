import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Region } from '../entities/region.entity';
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';
import { Country } from '../../country/entities/country.entity';

@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
  ) {}

  async create(dto: CreateRegionDto): Promise<Region> {
    const country = await this.countryRepo.findOne({
      where: { id: dto.countryId },
    });
    if (!country) throw new NotFoundException('Country not found');
    const region = this.regionRepo.create({
      ...dto,
      country,
    });
    return this.regionRepo.save(region);
  }

  async findAll(): Promise<Region[]> {
    return this.regionRepo.find({
      relations: ['country'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Region> {
    const region = await this.regionRepo.findOne({
      where: { id },
      relations: ['country'],
    });
    if (!region) throw new NotFoundException('Region not found');
    return region;
  }

  async update(id: number, dto: UpdateRegionDto): Promise<Region> {
    const region = await this.findOne(id);
    if (dto.countryId && dto.countryId !== region.country.id) {
      const country = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });
      if (!country) throw new NotFoundException('Country not found');
      region.country = country;
    }
    Object.assign(region, dto);
    return this.regionRepo.save(region);
  }

  async remove(id: number): Promise<void> {
    const region = await this.findOne(id);
    await this.regionRepo.remove(region);
  }
}
