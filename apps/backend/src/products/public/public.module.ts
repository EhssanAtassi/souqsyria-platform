import { Module } from '@nestjs/common';
import { PublicProductsController } from './controller/public-products.controller';
import { PublicProductsService } from './service/public-products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductsSearchService } from '../services/products-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [PublicProductsController],
  providers: [PublicProductsService, ProductsSearchService],
  exports: [PublicProductsService], // Export for use in other modules (e.g., CategoriesModule)
})
export class PublicModule {}
