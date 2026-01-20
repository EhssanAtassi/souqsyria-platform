/**
 * @file payment-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Payment API endpoints
 *
 * Tests complete payment processing workflow including:
 * - Payment creation and processing
 * - Payment confirmation and status management
 * - Payment method retrieval and validation
 * - Payment history and filtering
 * - Refund processing
 * - Syrian market specific features
 * - Gateway integration scenarios
 * - Authentication and authorization
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import {
  PaymentTransaction,
  PaymentStatus,
  PaymentMethod,
} from '../../src/payment/entities/payment-transaction.entity';
import { RefundTransaction } from '../../src/refund/entities/refund-transaction.entity';
import { Order } from '../../src/orders/entities/order.entity';
import { OrderItem } from '../../src/orders/entities/order-item.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';

describe('Payment API (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testAdmin: any;
  let testOrder: any;
  let testProduct: any;
  let testVariant: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            PaymentTransaction,
            RefundTransaction,
            Order,
            OrderItem,
            ProductVariant,
            Product,
            User,
          ],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Creates test users, products, orders and authentication tokens
   */
  async function createTestData() {
    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'customer@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'Ahmad',
        last_name: 'Al-Syrian',
        phone: '+963987654321',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create test admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@souqsyria.com',
        password: 'AdminPassword123!',
        first_name: 'Admin',
        last_name: 'User',
        role_id: 1, // Admin role
      });

    testAdmin = adminResponse.body.user;
    adminToken = adminResponse.body.access_token;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name_en: 'iPhone 15 Pro',
        name_ar: 'آيفون 15 برو',
        description_en: 'Latest iPhone with advanced features',
        description_ar: 'أحدث آيفون مع ميزات متقدمة',
        category_id: 1,
        vendor_id: 1,
        price: 5500000, // 5,500,000 SYP
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create test variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'IPH15P-256GB-TITANIUM',
        price: 5500000,
        stock_quantity: 50,
        attributes: {
          color: 'Natural Titanium',
          storage: '256GB',
        },
      });

    testVariant = variantResponse.body.variant;

    // Create test order
    const orderResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 5500000,
          },
        ],
        payment_method: 'cash_on_delivery',
        buyer_note: 'Test order for payment testing',
      });

    testOrder = orderResponse.body.order;
  }

  describe('💳 Payment Processing', () => {
    it('should process COD payment successfully', async () => {
      const paymentDto = {
        orderId: testOrder.id,
        method: PaymentMethod.CASH,
        amount: 5500000,
        currency: 'SYP',
        channel: 'web',
        payment_details: {
          cod_phone: '+963987654321',
          delivery_instructions: 'Please call before delivery',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentDto)
        .expect(201);

      expect(response.body.message).toBe(
        'Payment processing initiated successfully',
      );
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.id).toBeDefined();
      expect(response.body.payment.method).toBe(PaymentMethod.CASH);
      expect(response.body.payment.amount).toBe(5500000);
      expect(response.body.payment.currency).toBe('SYP');
      expect(response.body.payment.status).toBe(PaymentStatus.PENDING);
      expect(response.body.payment.payment_instructions).toBeDefined();
      expect(response.body.payment.payment_instructions.cod).toBeDefined();
      expect(response.body.next_steps).toBeDefined();
      expect(response.body.next_steps.action).toBe('wait_for_delivery');
    });

    it('should process bank transfer payment successfully', async () => {
      const paymentDto = {
        orderId: testOrder.id,
        method: 'bank_transfer',
        amount: 5500000,
        currency: 'SYP',
        channel: 'web',
        payment_details: {
          bank_name: 'Commercial Bank of Syria',
          account_number: 'CBS-123456789',
          transfer_reference: 'TXN-20250817-001',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentDto)
        .expect(201);

      expect(
        response.body.payment.payment_instructions.bank_transfer,
      ).toBeDefined();
      expect(
        response.body.payment.payment_instructions.bank_transfer.bank_details,
      ).toBeDefined();
      expect(
        response.body.payment.payment_instructions.bank_transfer.reference,
      ).toContain('ORDER-');
      expect(response.body.next_steps.action).toBe('complete_transfer');
      expect(response.body.next_steps.upload_url).toContain('/receipt');
    });

    it('should process mobile payment successfully', async () => {
      const paymentDto = {
        orderId: testOrder.id,
        method: 'mobile_payment',
        amount: 5500000,
        currency: 'SYP',
        channel: 'mobile',
        payment_details: {
          provider: 'syriatel_cash',
          mobile_number: '+963987654321',
          transaction_id: 'SYR-TXN-12345',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentDto)
        .expect(201);

      expect(
        response.body.payment.payment_instructions.mobile_payment,
      ).toBeDefined();
      expect(
        response.body.payment.payment_instructions.mobile_payment.provider,
      ).toBe('syriatel_cash');
      expect(response.body.next_steps.action).toBe('confirm_mobile_payment');
    });

    it('should reject payment with invalid amount', async () => {
      const paymentDto = {
        orderId: testOrder.id,
        method: PaymentMethod.CASH,
        amount: 10000000, // Exceeds order total
        currency: 'SYP',
        channel: 'web',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentDto)
        .expect(400);

      expect(response.body.message).toContain('amount');
    });

    it('should reject payment for non-existent order', async () => {
      const paymentDto = {
        orderId: 99999,
        method: PaymentMethod.CASH,
        amount: 5500000,
        currency: 'SYP',
        channel: 'web',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentDto)
        .expect(404);

      expect(response.body.message).toContain('Order not found');
    });

    it('should require authentication for payment processing', async () => {
      const paymentDto = {
        orderId: testOrder.id,
        method: PaymentMethod.CASH,
        amount: 5500000,
        currency: 'SYP',
      };

      await request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentDto)
        .expect(401);
    });
  });

  describe('🔍 Payment Methods', () => {
    it('should get available payment methods successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/methods')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payment_methods).toBeDefined();
      expect(Array.isArray(response.body.payment_methods)).toBe(true);
      expect(response.body.payment_methods.length).toBeGreaterThan(0);
      expect(response.body.recommendations).toBeDefined();
      expect(response.body.currency).toBe('SYP');
      expect(response.body.retrieved_at).toBeDefined();

      // Check COD method exists
      const codMethod = response.body.payment_methods.find(
        (m: any) => m.id === 'cod',
      );
      expect(codMethod).toBeDefined();
      expect(codMethod.name).toBe('Cash on Delivery');
      expect(codMethod.name_ar).toBe('الدفع عند الاستلام');
      expect(codMethod.supported_currencies).toContain('SYP');
    });

    it('should filter payment methods by currency', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/methods?currency=USD')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.currency).toBe('USD');

      // Bank transfer should support USD
      const bankMethod = response.body.payment_methods.find(
        (m: any) => m.id === 'bank_transfer',
      );
      if (bankMethod) {
        expect(bankMethod.supported_currencies).toContain('USD');
      }
    });

    it('should filter payment methods by order amount', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/methods?order_amount=10000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recommendations.for_large_orders).toBe(
        'bank_transfer',
      );
      expect(response.body.recommendations.recommended).toBe('bank_transfer');
    });

    it('should require authentication for payment methods', async () => {
      await request(app.getHttpServer()).get('/payments/methods').expect(401);
    });
  });

  describe('📊 Payment Status', () => {
    let testPaymentId: number;

    beforeAll(async () => {
      // Create a test payment for status tests
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          method: PaymentMethod.CASH,
          amount: 5500000,
          currency: 'SYP',
          channel: 'web',
        });

      testPaymentId = paymentResponse.body.payment.id;
    });

    it('should get payment status successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/status/${testPaymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.id).toBe(testPaymentId);
      expect(response.body.payment.status).toBe(PaymentStatus.PENDING);
      expect(response.body.payment.method).toBe(PaymentMethod.CASH);
      expect(response.body.payment.amount).toBe(5500000);
      expect(response.body.payment.currency).toBe('SYP');
      expect(response.body.payment.status_history).toBeDefined();
      expect(Array.isArray(response.body.payment.status_history)).toBe(true);

      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(testOrder.id);

      expect(response.body.current_status).toBeDefined();
      expect(response.body.current_status.stage).toBe('awaiting_delivery');
      expect(response.body.current_status.progress_percentage).toBe(25);

      expect(response.body.checked_at).toBeDefined();
    });

    it('should reject access to other user payment status', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser@souqsyria.com',
          password: 'Password123!',
          first_name: 'Other',
          last_name: 'User',
        });

      const otherUserToken = otherUserResponse.body.access_token;

      await request(app.getHttpServer())
        .get(`/payments/status/${testPaymentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent payment', async () => {
      await request(app.getHttpServer())
        .get('/payments/status/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should require authentication for payment status', async () => {
      await request(app.getHttpServer())
        .get(`/payments/status/${testPaymentId}`)
        .expect(401);
    });
  });

  describe('📜 Payment History', () => {
    beforeAll(async () => {
      // Create multiple test payments for history tests
      const paymentStatuses = [
        PaymentMethod.CASH,
        'bank_transfer',
        'mobile_payment',
      ];

      for (const method of paymentStatuses) {
        await request(app.getHttpServer())
          .post('/payments/process')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: testOrder.id,
            method: method,
            amount: 5500000,
            currency: 'SYP',
            channel: 'web',
          });
      }
    });

    it('should get user payment history successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments).toBeDefined();
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeGreaterThan(0);

      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.total_payments).toBeGreaterThan(0);
      expect(response.body.summary.pending_payments).toBeGreaterThan(0);
      expect(response.body.summary.success_rate).toBeGreaterThanOrEqual(0);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.offset).toBe(0);

      expect(response.body.retrieved_at).toBeDefined();

      // Check payment structure
      const payment = response.body.payments[0];
      expect(payment.id).toBeDefined();
      expect(payment.order_id).toBeDefined();
      expect(payment.method).toBeDefined();
      expect(payment.amount).toBeDefined();
      expect(payment.currency).toBe('SYP');
      expect(payment.status).toBeDefined();
      expect(payment.created_at).toBeDefined();
      expect(payment.order_summary).toBeDefined();
    });

    it('should filter payment history by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/history?status=pending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments).toBeDefined();

      // All returned payments should have pending status
      response.body.payments.forEach((payment: any) => {
        expect(payment.status).toBe(PaymentStatus.PENDING);
      });
    });

    it('should support pagination in payment history', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/history?limit=2&offset=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should limit maximum results per page', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/history?limit=100')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should be limited to 50 maximum
      expect(response.body.pagination.limit).toBeLessThanOrEqual(50);
    });

    it('should require authentication for payment history', async () => {
      await request(app.getHttpServer()).get('/payments/history').expect(401);
    });
  });

  describe('✅ Payment Confirmation', () => {
    let bankTransferPaymentId: number;

    beforeAll(async () => {
      // Create a bank transfer payment for confirmation tests
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          method: 'bank_transfer',
          amount: 5500000,
          currency: 'SYP',
          channel: 'web',
          payment_details: {
            bank_name: 'Commercial Bank of Syria',
            account_number: 'CBS-123456789',
          },
        });

      bankTransferPaymentId = paymentResponse.body.payment.id;
    });

    it('should confirm payment successfully', async () => {
      const confirmationData = {
        confirmation_code: 'TXN-20250817-12345',
        receipt_url: 'https://souqsyria.com/receipts/payment-receipt.jpg',
        notes: 'Transferred from CBS account ending in 1234',
      };

      const response = await request(app.getHttpServer())
        .put(`/payments/confirm/${bankTransferPaymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(confirmationData)
        .expect(200);

      expect(response.body.message).toBe(
        'Payment confirmation submitted successfully',
      );
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.id).toBe(bankTransferPaymentId);
      expect(response.body.payment.confirmation_submitted).toBe(true);
      expect(response.body.payment.confirmation_code).toBe(
        'TXN-20250817-12345',
      );
      expect(response.body.payment.updated_at).toBeDefined();

      expect(response.body.next_steps).toBeDefined();
      expect(
        response.body.next_steps.estimated_verification_time,
      ).toBeDefined();
    });

    it('should reject confirmation of already confirmed payment', async () => {
      const confirmationData = {
        confirmation_code: 'TXN-20250817-67890',
      };

      await request(app.getHttpServer())
        .put(`/payments/confirm/${bankTransferPaymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(confirmationData)
        .expect(400);
    });

    it('should reject confirmation of other user payment', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser2@souqsyria.com',
          password: 'Password123!',
          first_name: 'Other2',
          last_name: 'User2',
        });

      const otherUserToken = otherUserResponse.body.access_token;

      const confirmationData = {
        confirmation_code: 'TXN-20250817-INVALID',
      };

      await request(app.getHttpServer())
        .put(`/payments/confirm/${bankTransferPaymentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(confirmationData)
        .expect(404);
    });

    it('should require authentication for payment confirmation', async () => {
      const confirmationData = {
        confirmation_code: 'TXN-20250817-NOAUTH',
      };

      await request(app.getHttpServer())
        .put(`/payments/confirm/${bankTransferPaymentId}`)
        .send(confirmationData)
        .expect(401);
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should handle SYP currency calculations correctly', async () => {
      const largeAmountPayment = {
        orderId: testOrder.id,
        method: PaymentMethod.CASH,
        amount: 27500000, // 27,500,000 SYP (approximately $1000 USD)
        currency: 'SYP',
        channel: 'web',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(largeAmountPayment)
        .expect(201);

      expect(response.body.payment.amount).toBe(27500000);
      expect(response.body.payment.currency).toBe('SYP');
    });

    it('should support Syrian bank transfer details', async () => {
      const syrianBankPayment = {
        orderId: testOrder.id,
        method: 'bank_transfer',
        amount: 5500000,
        currency: 'SYP',
        channel: 'web',
        payment_details: {
          bank_name: 'Real Estate Bank',
          account_number: 'REB-987654321',
          transfer_reference: 'REF-20250817-002',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(syrianBankPayment)
        .expect(201);

      const bankInstructions =
        response.body.payment.payment_instructions.bank_transfer;
      expect(bankInstructions).toBeDefined();
      expect(bankInstructions.bank_details).toBeDefined();
      expect(bankInstructions.bank_details.bank_name).toBe(
        'Commercial Bank of Syria',
      );
      expect(bankInstructions.bank_details.swift_code).toBe('CBSYSYDM');
      expect(bankInstructions.bank_details.iban).toContain('SY21CBS');
      expect(bankInstructions.reference).toContain('ORDER-');
    });

    it('should support Syriatel Cash mobile payments', async () => {
      const syriateLCashPayment = {
        orderId: testOrder.id,
        method: 'mobile_payment',
        amount: 2750000, // 2,750,000 SYP
        currency: 'SYP',
        channel: 'mobile',
        payment_details: {
          provider: 'syriatel_cash',
          mobile_number: '+963987654321',
          transaction_id: 'SYR-20250817-001',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(syriateLCashPayment)
        .expect(201);

      const mobileInstructions =
        response.body.payment.payment_instructions.mobile_payment;
      expect(mobileInstructions).toBeDefined();
      expect(mobileInstructions.provider).toBe('syriatel_cash');
      expect(mobileInstructions.confirmation_required).toBe(true);
    });

    it('should provide Arabic payment method names', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/methods?currency=SYP')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const codMethod = response.body.payment_methods.find(
        (m: any) => m.id === 'cod',
      );
      expect(codMethod.name_ar).toBe('الدفع عند الاستلام');
      expect(codMethod.description_ar).toContain('عند توصيل');

      const bankMethod = response.body.payment_methods.find(
        (m: any) => m.id === 'bank_transfer',
      );
      expect(bankMethod.name_ar).toBe('حوالة مصرفية');
      expect(bankMethod.description_ar).toContain('حسابك المصرفي');
    });

    it('should support Syrian governorate delivery for COD', async () => {
      const syrianGovernorates = [
        'Damascus',
        'Aleppo',
        'Homs',
        'Latakia',
        'Hama',
      ];

      for (const governorate of syrianGovernorates.slice(0, 3)) {
        const codPayment = {
          orderId: testOrder.id,
          method: PaymentMethod.CASH,
          amount: 5500000,
          currency: 'SYP',
          channel: 'web',
          payment_details: {
            cod_phone: '+963987654321',
            delivery_governorate: governorate,
            delivery_instructions: `Delivery to ${governorate} governorate`,
          },
        };

        const response = await request(app.getHttpServer())
          .post('/payments/process')
          .set('Authorization', `Bearer ${userToken}`)
          .send(codPayment)
          .expect(201);

        expect(response.body.payment.method).toBe(PaymentMethod.CASH);
        expect(response.body.next_steps.action).toBe('wait_for_delivery');
      }
    });
  });

  describe('👨‍💼 Admin Payment Operations', () => {
    let adminPaymentId: number;

    beforeAll(async () => {
      // Create a payment for admin operations
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          method: PaymentMethod.CASH,
          amount: 5500000,
          currency: 'SYP',
          channel: 'web',
        });

      adminPaymentId = paymentResponse.body.payment.id;
    });

    it('should allow admin to override payment status', async () => {
      const overrideDto = {
        paymentTransactionId: adminPaymentId,
        status: PaymentStatus.PAID,
        comment: 'Manual verification completed',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/admin/override')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(overrideDto)
        .expect(200);

      expect(response.body.status).toBe(PaymentStatus.PAID);
    });

    it('should allow admin to search payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/admin/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter admin payment search by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/admin/search?status=paid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.length > 0) {
        response.body.forEach((payment: any) => {
          expect(payment.status).toBe(PaymentStatus.PAID);
        });
      }
    });

    it('should reject non-admin access to admin operations', async () => {
      const overrideDto = {
        paymentTransactionId: adminPaymentId,
        status: PaymentStatus.PAID,
      };

      await request(app.getHttpServer())
        .post('/payments/admin/override')
        .set('Authorization', `Bearer ${userToken}`)
        .send(overrideDto)
        .expect(403);

      await request(app.getHttpServer())
        .get('/payments/admin/search')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('🔒 Security and Authorization', () => {
    it('should protect all endpoints with authentication', async () => {
      const protectedEndpoints = [
        { method: 'post', path: '/payments/process' },
        { method: 'get', path: '/payments/methods' },
        { method: 'get', path: '/payments/status/1' },
        { method: 'get', path: '/payments/history' },
        { method: 'put', path: '/payments/confirm/1' },
        { method: 'post', path: '/payments/admin/override' },
        { method: 'get', path: '/payments/admin/search' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())[endpoint.method](
          endpoint.path,
        );
        expect([401, 403]).toContain(response.status);
      }
    });

    it('should validate request data properly', async () => {
      const invalidPaymentDto = {
        orderId: 'invalid',
        method: 'invalid_method',
        amount: -1000,
        currency: 'INVALID',
      };

      await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidPaymentDto)
        .expect(400);
    });

    it('should handle malformed request data', async () => {
      const malformedData = {
        orderId: null,
        method: 123,
        amount: 'not_a_number',
      };

      await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(malformedData)
        .expect(400);
    });

    it('should prevent payment amount manipulation', async () => {
      const manipulatedPayment = {
        orderId: testOrder.id,
        method: PaymentMethod.CASH,
        amount: 1, // Trying to pay 1 SYP for 5.5M SYP order
        currency: 'SYP',
        channel: 'web',
      };

      await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(manipulatedPayment)
        .expect(400);
    });

    it('should prevent cross-user payment access', async () => {
      // This is already tested in individual sections, but worth emphasizing
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'securitytest@souqsyria.com',
          password: 'Password123!',
          first_name: 'Security',
          last_name: 'Test',
        });

      const otherUserToken = otherUserResponse.body.access_token;

      // Try to access the first user's payment
      await request(app.getHttpServer())
        .get(`/payments/status/${adminPaymentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });
  });

  describe('💰 Refund Integration', () => {
    let paidPaymentId: number;

    beforeAll(async () => {
      // Create and confirm a payment for refund testing
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          method: PaymentMethod.CARD,
          amount: 5500000,
          currency: 'SYP',
          channel: 'web',
        });

      paidPaymentId = paymentResponse.body.payment.id;

      // Admin confirms the payment
      await request(app.getHttpServer())
        .post('/payments/admin/override')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentTransactionId: paidPaymentId,
          status: PaymentStatus.PAID,
        });
    });

    it('should process refund for paid payment (admin only)', async () => {
      const refundDto = {
        paymentTransactionId: paidPaymentId,
        amount: 2750000, // Partial refund
        method: 'bank_transfer',
        reason: 'Partial return approved by admin',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundDto)
        .expect(201);

      expect(response.body).toBeDefined();
    });

    it('should reject refund request from non-admin', async () => {
      const refundDto = {
        paymentTransactionId: paidPaymentId,
        amount: 1000000,
        reason: 'User trying to refund',
      };

      await request(app.getHttpServer())
        .post('/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundDto)
        .expect(403);
    });

    it('should validate refund amount', async () => {
      const refundDto = {
        paymentTransactionId: paidPaymentId,
        amount: 10000000, // Exceeds payment amount
        reason: 'Invalid refund amount',
      };

      await request(app.getHttpServer())
        .post('/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundDto)
        .expect(400);
    });
  });
});
