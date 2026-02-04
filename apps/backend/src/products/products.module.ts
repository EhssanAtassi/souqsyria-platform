import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // ✅ Required
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductEntity } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ManufacturerEntity } from '../manufacturers/entities/manufacturer.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { ProductDescriptionEntity } from './entities/product-description.entity';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { CategoriesModule } from '../categories/categories.module';
import { VendorsModule } from '../vendors/vendors.module';
import { Route } from '../access-control/entities/route.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { Attribute } from '../attributes/entities/attribute.entity';
import { AttributeValue } from '../attributes/entities/attribute-value.entity';
import { ProductAttribute } from './entities/product-attribute.entity/product-attribute.entity';
import { ProductAttributeService } from './services/product-attribute.service';
import { ProductAttributeController } from './controllers/product-attribute.controller';
import { ProductFeatureService } from './services/product-feature.service';
import { ProductFeatureController } from './controllers/product-feature.controller';
import { ProductFeatureEntity } from '../features/entities/product-feature.entity';
import { FeatureEntity } from '../features/entities/feature.entity';
import { ProductImage } from './entities/product-image.entity';
import { ImagesModule } from './images/images.module';
import { DescriptionsModule } from './descriptions/descriptions.module';
import { VariantsModule } from './variants/variants.module';
import { AdminProductsController } from './admin/admin-products.controller';
import { AdminProductsService } from './admin/admin-products.service';
import { StockModule } from '../stock/stock.module';
import { PricingModule } from './pricing/pricing.module';
import { PublicModule } from './public/public.module';
import { User } from '../users/entities/user.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ProductApprovalService } from './services/product-approval.service';
import { ProductsAdminApprovalController } from './controllers/products-admin-approval.controller';
import { ProductSearchService } from './services/product-search.service';
import { ProductsAdminSearchController } from './controllers/products-admin-search.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductDescriptionEntity,
      Category,
      ManufacturerEntity,
      ProductImage,
      VendorEntity,
      ProductAttribute,
      Attribute, // ✅ Needed for validation / eager loading
      AttributeValue, // ✅ Needed to resolve value_id references
      Route,
      User,
      ProductFeatureEntity,
      FeatureEntity,
      Brand,
    ]),
    AccessControlModule,
    CategoriesModule,
    VendorsModule,
    ImagesModule,
    DescriptionsModule,
    VariantsModule,
    forwardRef(() => StockModule),
    forwardRef(() => PricingModule),
    PublicModule,
    AuditLogModule, // ✅ For comprehensive audit logging
    UsersModule, // ✅ For product approval permissions
  ],
  controllers: [
    ProductsController,
    // ProductDescriptionsController,
    ProductAttributeController,
    ProductFeatureController,
    AdminProductsController,
    ProductsAdminApprovalController, // ✅ Product approval workflow controller
    ProductsAdminSearchController, // ✅ Product search and analytics controller
  ],
  providers: [
    ProductsService,
    // PermissionsGuard,
    // ProductDescriptionsService,
    ProductAttributeService,
    ProductFeatureService,
    AdminProductsService,
    ProductApprovalService, // ✅ Product approval workflow service
    ProductSearchService, // ✅ Product search and analytics service
  ],
  exports: [
    TypeOrmModule,
    ProductsService,
    // ProductDescriptionsService,
    ProductAttributeService,
    ProductApprovalService, // ✅ Export for other modules to use
    ProductSearchService, // ✅ Export search service for other modules
  ],
})
export class ProductsModule {}
