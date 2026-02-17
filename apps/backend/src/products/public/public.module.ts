import { Module, forwardRef } from '@nestjs/common';
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
import { ReviewsModule } from '../reviews/reviews.module';
import { Category } from '../../categories/entities/category.entity';
/**
 * @description Public-facing products API module
 *
 * Provides customer-facing product endpoints:
 * - Product catalog browsing with filters
 * - Product detail retrieval with category breadcrumbs
 * - Product search and suggestions
 * - Product view count tracking
 * - Variant listing
 *
 * Integrates with:
 * - ReviewsModule for product ratings and reviews
 * - Category entity (via TypeORM) for breadcrumb hierarchy queries
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductVariant,
      Attribute,
      AttributeValue,
      Category, // For category breadcrumb queries (direct repo, avoids circular dep with CategoriesModule)
    ]),
    forwardRef(() => ReviewsModule),
  ],
  controllers: [PublicProductsController, PublicVariantsController],
  providers: [
    PublicProductsService,
    PublicVariantsService,
    ProductsSearchService,
  ],
  exports: [PublicProductsService], // Export for use in other modules (e.g., CategoriesModule)
})
export class PublicModule {}
