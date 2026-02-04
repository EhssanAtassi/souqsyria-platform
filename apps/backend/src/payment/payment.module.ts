import { forwardRef, Module } from '@nestjs/common';

import { PaymentService } from './service/payment.service';
import { PaymentController } from './controller/payment.controller';
import { RefundTransaction } from '../refund/entities/refund-transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { RefundModule } from '../refund/refund.module';

// Financial Reporting Services
import { FinancialReportingService } from './services/financial-reporting.service';

// Customer Payment Processing
import { CustomerPaymentController } from './controllers/customer-payment.controller';

// Financial Analytics & Reporting
import { FinancialAnalyticsController } from './controllers/financial-analytics.controller';

// Syrian Payment Methods Integration
import { SyrianPaymentMethodsService } from './services/syrian-payment-methods.service';
import { SyrianBankEntity } from './entities/syrian-bank.entity';
import { SyrianPaymentMethodEntity } from './entities/syrian-payment-method.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      Order,
      User,
      RefundTransaction,
      // Syrian Payment Method Entities
      SyrianBankEntity,
      SyrianPaymentMethodEntity,
    ]),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
    UsersModule,
    AccessControlModule,
    forwardRef(() => RefundModule),
  ],
  providers: [
    PaymentService,
    FinancialReportingService,
    SyrianPaymentMethodsService,
  ],
  controllers: [
    PaymentController,
    CustomerPaymentController,
    FinancialAnalyticsController,
  ],
  exports: [
    PaymentService,
    FinancialReportingService,
    SyrianPaymentMethodsService,
    TypeOrmModule,
  ],
})
export class PaymentModule {}
