import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { WarehouseSeederService } from './seeds/warehouse-seeder.service';
import { WarehouseSeederController } from './seeds/warehouse-seeder.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  controllers: [WarehousesController, WarehouseSeederController],
  providers: [WarehousesService, WarehouseSeederService],
  exports: [TypeOrmModule, WarehouseSeederService],
})
export class WarehousesModule {}
