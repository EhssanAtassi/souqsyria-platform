import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [TypeOrmModule],
})
export class WarehousesModule {}
