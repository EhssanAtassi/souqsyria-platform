import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { ManufacturerEntity } from './entities/manufacturer.entity';

@Injectable()
export class ManufacturersService {
  private readonly logger = new Logger(ManufacturersService.name);

  constructor(
    @InjectRepository(ManufacturerEntity)
    private readonly manufacturerRepository: Repository<ManufacturerEntity>,
  ) {}

  async create(createDto: CreateManufacturerDto): Promise<ManufacturerEntity> {
    const manufacturer = this.manufacturerRepository.create(createDto);
    const saved = await this.manufacturerRepository.save(manufacturer);
    this.logger.log(`Manufacturer created: ${saved.name}`);
    return saved;
  }

  async findAll(): Promise<ManufacturerEntity[]> {
    return this.manufacturerRepository.find();
  }

  async findOne(id: number): Promise<ManufacturerEntity> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { id },
    });
    if (!manufacturer)
      throw new NotFoundException('ManufacturerEntity not found');
    return manufacturer;
  }

  async update(
    id: number,
    updateDto: UpdateManufacturerDto,
  ): Promise<ManufacturerEntity> {
    const manufacturer = await this.findOne(id);
    Object.assign(manufacturer, updateDto);
    const updated = await this.manufacturerRepository.save(manufacturer);
    this.logger.log(`Manufacturer updated: ${updated.name}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const manufacturer = await this.findOne(id);
    await this.manufacturerRepository.remove(manufacturer);
    this.logger.log(`Manufacturer deleted: ID ${id}`);
  }
}
