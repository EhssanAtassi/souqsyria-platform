import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './service/orders.service';
import { OrdersController } from './controller/orders.controller';

import { User } from '../users/entities/user.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';
import { ReturnRequest } from './entities/return-request.entity';

import { ShipmentsModule } from '../shipments/shipments.module';
import { StockModule } from '../stock/stock.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { PaymentModule } from '../payment/payment.module';
import { RefundModule } from '../refund/refund.module';
import { Route } from '../access-control/entities/route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderStatusLog,
      ProductVariant,
      User,
      ReturnRequest,
      Route,
    ]),
    ShipmentsModule,
    forwardRef(() => StockModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => RefundModule),
    AccessControlModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
