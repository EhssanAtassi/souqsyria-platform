import { Module } from '@nestjs/common';
import { PublicProductsController } from './controller/public-products.controller';
import { PublicProductsService } from './service/public-products.service';
import { PublicVariantsController } from './controller/public-variants.controller';
import { PublicVariantsService } from './service/public-variants.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariant } from '../variants/entities/product-variant.entity';
import { Attribute } from '../../attributes/entities/attribute.entity';
import { AttributeValue } from '../../attributes/entities/attribute-value.entity';
import { ProductsSearchService } from '../services/products-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductVariant,
      Attribute,
      AttributeValue,
    ]),
  ],
  controllers: [PublicProductsController, PublicVariantsController],
  providers: [PublicProductsService, PublicVariantsService, ProductsSearchService],
  exports: [PublicProductsService], // Export for use in other modules (e.g., CategoriesModule)
})
export class PublicModule {}
