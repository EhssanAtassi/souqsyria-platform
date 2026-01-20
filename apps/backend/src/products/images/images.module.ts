import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { ProductEntity } from '../entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImage } from '../entities/product-image.entity';
import { AccessControlModule } from '../../access-control/access-control.module';
import { Route } from '../../access-control/entities/route.entity';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductImage, Route, User]),
    AccessControlModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
