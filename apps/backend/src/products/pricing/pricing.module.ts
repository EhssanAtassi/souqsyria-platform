import { forwardRef, Module } from '@nestjs/common';
import { PricingService } from './service/pricing.service';
import { PricingController } from './controller/pricing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductPriceEntity } from './entities/product-price.entity';
import { ProductEntity } from '../entities/product.entity';
import { ProductsModule } from '../products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductPriceEntity, ProductEntity]),
    forwardRef(() => ProductsModule),
  ],
  providers: [PricingService],
  controllers: [PricingController],
  exports: [PricingService], // ✅ <-- this is the key part
})
export class PricingModule {}
