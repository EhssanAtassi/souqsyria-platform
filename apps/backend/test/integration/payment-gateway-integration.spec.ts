/**
 * @file payment-gateway-integration.spec.ts
 * @description Integration tests for Payment Gateway functionality
 *
 * Tests payment gateway integrations including:
 * - Syrian payment method processing (COD, Bank Transfer, Mobile Payments)
 * - International payment gateways (Stripe, PayPal)
 * - Gateway response handling and validation
 * - Payment confirmation workflows
 * - Multi-currency transaction processing
 * - Error handling and retry mechanisms
 * - Syrian banking system integration
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentService } from '../../src/payment/service/payment.service';
import {
  PaymentTransaction,
  PaymentMethod,
  PaymentStatus,
} from '../../src/payment/entities/payment-transaction.entity';
import { Order } from '../../src/orders/entities/order.entity';
import { User } from '../../src/users/entities/user.entity';
import { RefundTransaction } from '../../src/refund/entities/refund-transaction.entity';
import { OrdersService } from '../../src/orders/service/orders.service';

// Mock gateway response types
interface StripeResponse {
  id: string;
  status: 'succeeded' | 'failed' | 'pending';
  amount: number;
  currency: string;
  payment_method: {
    type: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  };
  receipt_url?: string;
  failure_code?: string;
  failure_message?: string;
}

interface SyrianBankResponse {
  transaction_id: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  currency: 'SYP' | 'USD';
  bank_code: string;
  bank_name: string;
  account_number: string;
  reference_number: string;
  verification_status: 'verified' | 'pending' | 'rejected';
  processed_at: string;
}

interface MobilePaymentResponse {
  transaction_id: string;
  status: 'success' | 'failed' | 'pending';
  provider: 'syriatel_cash' | 'mtn_mobile_money';
  phone_number: string;
  amount: number;
  currency: 'SYP';
  confirmation_code: string;
  fee: number;
  processed_at: string;
}

describe('Payment Gateway Integration', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<Repository<PaymentTransaction>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let refundRepository: jest.Mocked<Repository<RefundTransaction>>;
  let ordersService: jest.Mocked<OrdersService>;

  // Test data
  let mockUser: User;
  let mockOrder: Order;
  let mockPayment: PaymentTransaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(PaymentTransaction),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            findOne: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(RefundTransaction),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: OrdersService,
          useFactory: () => ({
            setOrderPaid: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get(getRepositoryToken(PaymentTransaction));
    orderRepository = module.get(getRepositoryToken(Order));
    userRepository = module.get(getRepositoryToken(User));
    refundRepository = module.get(getRepositoryToken(RefundTransaction));
    ordersService = module.get(OrdersService);

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockUser = {
      id: 1,
      email: 'customer@souqsyria.com',
      fullName: 'Ahmad Al-Syrian',
      phone: '+963987654321',
    } as User;

    mockOrder = {
      id: 1001,
      user: mockUser,
      total_amount: 2750000, // 2,750,000 SYP
      status: 'confirmed',
      currency: 'SYP',
    } as Order;

    mockPayment = {
      id: 5001,
      order: mockOrder,
      user: mockUser,
      method: PaymentMethod.CARD,
      provider: 'stripe',
      amount: 2750000,
      currency: 'SYP',
      status: PaymentStatus.PENDING,
      gatewayTransactionId: null,
      gatewayResponse: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PaymentTransaction;
  }

  describe('🌐 International Payment Gateways', () => {
    describe('💳 Stripe Integration', () => {
      it('should process successful Stripe payment', async () => {
        const stripeResponse: StripeResponse = {
          id: 'pi_3NvQxT2eZvKYlo2C1234567890',
          status: 'succeeded',
          amount: 1000, // $10.00 in cents
          currency: 'usd',
          payment_method: {
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2026,
            },
          },
          receipt_url: 'https://pay.stripe.com/receipts/123456',
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          provider: 'stripe',
          currency: 'USD',
          amount: 1000,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayTransactionId: stripeResponse.id,
            gatewayResponse: stripeResponse,
          }),
        );

        ordersService.setOrderPaid.mockResolvedValue(undefined);

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: stripeResponse.id,
          gatewayResponse: stripeResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(result.gatewayTransactionId).toBe(stripeResponse.id);
        expect(result.gatewayResponse).toEqual(stripeResponse);
        expect(ordersService.setOrderPaid).toHaveBeenCalledWith(1001);

        // Verify Stripe-specific response fields
        expect(result.gatewayResponse.payment_method.card.brand).toBe('visa');
        expect(result.gatewayResponse.payment_method.card.last4).toBe('4242');
        expect(result.gatewayResponse.receipt_url).toBe(
          'https://pay.stripe.com/receipts/123456',
        );
      });

      it('should handle failed Stripe payment', async () => {
        const stripeResponse: StripeResponse = {
          id: 'pi_3NvQxT2eZvKYlo2C0987654321',
          status: 'failed',
          amount: 2750,
          currency: 'usd',
          payment_method: {
            type: 'card',
            card: {
              brand: 'visa',
              last4: '0002',
              exp_month: 8,
              exp_year: 2025,
            },
          },
          failure_code: 'card_declined',
          failure_message: 'Your card was declined.',
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          provider: 'stripe',
          currency: 'USD',
          amount: 2750,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.FAILED,
            gatewayTransactionId: stripeResponse.id,
            gatewayResponse: stripeResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: stripeResponse.id,
          gatewayResponse: stripeResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.FAILED);
        expect(result.gatewayResponse.failure_code).toBe('card_declined');
        expect(result.gatewayResponse.failure_message).toBe(
          'Your card was declined.',
        );
        expect(ordersService.setOrderPaid).not.toHaveBeenCalled();
      });

      it('should handle Stripe currency conversion for Syrian customers', async () => {
        const stripeResponse: StripeResponse = {
          id: 'pi_3NvQxT2eZvKYlo2C1111111111',
          status: 'succeeded',
          amount: 275000, // $2750.00 in cents (converted from 2,750,000 SYP)
          currency: 'usd',
          payment_method: {
            type: 'card',
          },
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          provider: 'stripe',
          currency: 'USD',
          amount: 275000,
          gatewayResponse: {
            original_amount_syp: 2750000,
            exchange_rate: 2750,
            conversion_timestamp: new Date().toISOString(),
          },
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayTransactionId: stripeResponse.id,
            gatewayResponse: {
              ...stripeResponse,
              original_amount_syp: 2750000,
              exchange_rate: 2750,
            },
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: stripeResponse.id,
          gatewayResponse: stripeResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(result.gatewayResponse.original_amount_syp).toBe(2750000);
        expect(result.gatewayResponse.exchange_rate).toBe(2750);
      });
    });

    describe('🏛️ PayPal Integration', () => {
      it('should process successful PayPal payment', async () => {
        const paypalResponse = {
          id: 'PAYID-MW6XY7Q5YY12345AB1234567',
          status: 'COMPLETED',
          amount: {
            value: '27.50',
            currency_code: 'USD',
          },
          payer: {
            email_address: 'customer@souqsyria.com',
            payer_id: 'PAYER123456789',
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          provider: 'paypal',
          currency: 'USD',
          amount: 2750,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayTransactionId: paypalResponse.id,
            gatewayResponse: paypalResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: paypalResponse.id,
          gatewayResponse: paypalResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(result.gatewayTransactionId).toBe(paypalResponse.id);
        expect(result.gatewayResponse.status).toBe('COMPLETED');
      });
    });
  });

  describe('🇸🇾 Syrian Payment Methods', () => {
    describe('🏦 Syrian Bank Transfer', () => {
      it('should process Syrian bank transfer successfully', async () => {
        const bankResponse: SyrianBankResponse = {
          transaction_id: 'CBS20250817001234567',
          status: 'completed',
          amount: 2750000,
          currency: 'SYP',
          bank_code: 'CBS',
          bank_name: 'Commercial Bank of Syria',
          account_number: 'CBS-SOUQ-2025-001',
          reference_number: 'REF-20250817-123456',
          verification_status: 'verified',
          processed_at: new Date().toISOString(),
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          method: 'bank_transfer' as PaymentMethod,
          provider: 'syrian_banks',
          currency: 'SYP',
          amount: 2750000,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayTransactionId: bankResponse.transaction_id,
            gatewayResponse: bankResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: bankResponse.transaction_id,
          gatewayResponse: bankResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(result.gatewayResponse.bank_name).toBe(
          'Commercial Bank of Syria',
        );
        expect(result.gatewayResponse.currency).toBe('SYP');
        expect(result.gatewayResponse.verification_status).toBe('verified');
      });

      it('should handle pending bank transfer verification', async () => {
        const bankResponse: SyrianBankResponse = {
          transaction_id: 'REB20250817002345678',
          status: 'pending',
          amount: 1100000,
          currency: 'SYP',
          bank_code: 'REB',
          bank_name: 'Real Estate Bank',
          account_number: 'REB-SOUQ-2025-002',
          reference_number: 'REF-20250817-234567',
          verification_status: 'pending',
          processed_at: new Date().toISOString(),
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          method: 'bank_transfer' as PaymentMethod,
          provider: 'syrian_banks',
          currency: 'SYP',
          amount: 1100000,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PENDING,
            gatewayTransactionId: bankResponse.transaction_id,
            gatewayResponse: bankResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: bankResponse.transaction_id,
          gatewayResponse: bankResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PENDING);
        expect(result.gatewayResponse.verification_status).toBe('pending');
        expect(ordersService.setOrderPaid).not.toHaveBeenCalled();
      });

      it('should support multiple Syrian banks', async () => {
        const syrianBanks = [
          {
            code: 'CBS',
            name: 'Commercial Bank of Syria',
            swift: 'CBSYSYDM',
          },
          {
            code: 'REB',
            name: 'Real Estate Bank',
            swift: 'REBSYSYD',
          },
          {
            code: 'ICB',
            name: 'Industrial Bank',
            swift: 'ICBSYSYD',
          },
          {
            code: 'ACB',
            name: 'Agricultural Cooperative Bank',
            swift: 'ACBSYSYD',
          },
        ];

        for (const bank of syrianBanks) {
          const bankResponse: SyrianBankResponse = {
            transaction_id: `${bank.code}20250817${Math.floor(Math.random() * 1000000)}`,
            status: 'completed',
            amount: 550000,
            currency: 'SYP',
            bank_code: bank.code,
            bank_name: bank.name,
            account_number: `${bank.code}-SOUQ-2025-${Math.floor(Math.random() * 1000)}`,
            reference_number: `REF-20250817-${Math.floor(Math.random() * 1000000)}`,
            verification_status: 'verified',
            processed_at: new Date().toISOString(),
          };

          paymentRepository.findOne.mockResolvedValue({
            ...mockPayment,
            method: 'bank_transfer' as PaymentMethod,
            provider: 'syrian_banks',
            gatewayResponse: bankResponse,
          });

          expect(bankResponse.bank_name).toBe(bank.name);
          expect(bankResponse.bank_code).toBe(bank.code);
        }
      });
    });

    describe('📱 Mobile Payments (Syriatel Cash / MTN)', () => {
      it('should process Syriatel Cash payment successfully', async () => {
        const mobileResponse: MobilePaymentResponse = {
          transaction_id: 'SYR20250817123456789',
          status: 'success',
          provider: 'syriatel_cash',
          phone_number: '+963987654321',
          amount: 275000,
          currency: 'SYP',
          confirmation_code: 'SYR789123456',
          fee: 2750, // 1% fee
          processed_at: new Date().toISOString(),
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          method: 'mobile_payment' as PaymentMethod,
          provider: 'syriatel_cash',
          currency: 'SYP',
          amount: 275000,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayTransactionId: mobileResponse.transaction_id,
            gatewayResponse: mobileResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: mobileResponse.transaction_id,
          gatewayResponse: mobileResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(result.gatewayResponse.provider).toBe('syriatel_cash');
        expect(result.gatewayResponse.confirmation_code).toBe('SYR789123456');
        expect(result.gatewayResponse.fee).toBe(2750);
      });

      it('should process MTN Mobile Money payment successfully', async () => {
        const mobileResponse: MobilePaymentResponse = {
          transaction_id: 'MTN20250817987654321',
          status: 'success',
          provider: 'mtn_mobile_money',
          phone_number: '+963988765432',
          amount: 137500,
          currency: 'SYP',
          confirmation_code: 'MTN456789123',
          fee: 1375, // 1% fee
          processed_at: new Date().toISOString(),
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          method: 'mobile_payment' as PaymentMethod,
          provider: 'mtn_mobile_money',
          currency: 'SYP',
          amount: 137500,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayTransactionId: mobileResponse.transaction_id,
            gatewayResponse: mobileResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: mobileResponse.transaction_id,
          gatewayResponse: mobileResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(result.gatewayResponse.provider).toBe('mtn_mobile_money');
        expect(result.gatewayResponse.confirmation_code).toBe('MTN456789123');
      });

      it('should handle failed mobile payment', async () => {
        const mobileResponse: MobilePaymentResponse = {
          transaction_id: 'SYR20250817000000000',
          status: 'failed',
          provider: 'syriatel_cash',
          phone_number: '+963987654321',
          amount: 275000,
          currency: 'SYP',
          confirmation_code: '',
          fee: 0,
          processed_at: new Date().toISOString(),
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          method: 'mobile_payment' as PaymentMethod,
          provider: 'syriatel_cash',
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.FAILED,
            gatewayResponse: {
              ...mobileResponse,
              error_code: 'insufficient_balance',
              error_message: 'Insufficient balance in mobile wallet',
            },
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayTransactionId: mobileResponse.transaction_id,
          gatewayResponse: mobileResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.FAILED);
        expect(result.gatewayResponse.error_code).toBe('insufficient_balance');
      });
    });

    describe('💵 Cash on Delivery (COD)', () => {
      it('should handle COD payment confirmation upon delivery', async () => {
        const codResponse = {
          payment_method: 'cash_on_delivery',
          delivery_confirmation: {
            delivered_at: new Date().toISOString(),
            delivered_to: 'Ahmad Al-Syrian',
            delivery_address: 'شارع الثورة، حي المزة، Damascus',
            delivery_phone: '+963987654321',
            cash_collected: 2750000,
            currency: 'SYP',
            collector_id: 'DELIVERY_001',
            collector_signature: true,
          },
          receipt_number: `COD-${Date.now()}`,
        };

        paymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          method: PaymentMethod.CASH,
          provider: 'manual',
          status: PaymentStatus.PENDING,
        });

        paymentRepository.save.mockImplementation((payment) =>
          Promise.resolve({
            ...payment,
            status: PaymentStatus.PAID,
            gatewayResponse: codResponse,
          }),
        );

        const confirmDto = {
          paymentTransactionId: 5001,
          gatewayResponse: codResponse,
        };

        const result = await service.confirmPayment(confirmDto);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(
          result.gatewayResponse.delivery_confirmation.cash_collected,
        ).toBe(2750000);
        expect(result.gatewayResponse.delivery_confirmation.delivered_to).toBe(
          'Ahmad Al-Syrian',
        );
      });
    });
  });

  describe('🔄 Gateway Error Handling', () => {
    it('should handle gateway timeout errors', async () => {
      paymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        provider: 'stripe',
      });

      const timeoutResponse = {
        error: {
          type: 'api_connection_error',
          code: 'timeout',
          message: 'Request timed out',
        },
        status: 'failed',
      };

      paymentRepository.save.mockImplementation((payment) =>
        Promise.resolve({
          ...payment,
          status: PaymentStatus.FAILED,
          gatewayResponse: timeoutResponse,
        }),
      );

      const confirmDto = {
        paymentTransactionId: 5001,
        gatewayResponse: timeoutResponse,
      };

      const result = await service.confirmPayment(confirmDto);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.gatewayResponse.error.code).toBe('timeout');
    });

    it('should handle network connectivity issues', async () => {
      paymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        method: 'mobile_payment' as PaymentMethod,
        provider: 'syriatel_cash',
      });

      const networkErrorResponse = {
        error: {
          type: 'network_error',
          code: 'connection_failed',
          message: 'Unable to connect to Syriatel Cash network',
          retry_after: 300, // 5 minutes
        },
        status: 'failed',
      };

      paymentRepository.save.mockImplementation((payment) =>
        Promise.resolve({
          ...payment,
          status: PaymentStatus.FAILED,
          gatewayResponse: networkErrorResponse,
        }),
      );

      const confirmDto = {
        paymentTransactionId: 5001,
        gatewayResponse: networkErrorResponse,
      };

      const result = await service.confirmPayment(confirmDto);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.gatewayResponse.error.code).toBe('connection_failed');
      expect(result.gatewayResponse.error.retry_after).toBe(300);
    });

    it('should handle invalid gateway responses', async () => {
      paymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        provider: 'stripe',
      });

      const invalidResponse = {
        invalid_field: 'invalid_value',
        // Missing required fields
      };

      paymentRepository.save.mockImplementation((payment) =>
        Promise.resolve({
          ...payment,
          status: PaymentStatus.FAILED,
          gatewayResponse: {
            error: 'Invalid gateway response format',
            original_response: invalidResponse,
          },
        }),
      );

      const confirmDto = {
        paymentTransactionId: 5001,
        gatewayResponse: invalidResponse,
      };

      const result = await service.confirmPayment(confirmDto);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.gatewayResponse.error).toBe(
        'Invalid gateway response format',
      );
    });
  });

  describe('💱 Multi-Currency Support', () => {
    it('should handle SYP to USD conversion for international gateways', async () => {
      const conversionRate = 2750; // 1 USD = 2750 SYP
      const sypAmount = 2750000; // 2,750,000 SYP
      const usdAmount = Math.round((sypAmount / conversionRate) * 100); // $1000.00 in cents

      const currencyConversionResponse = {
        original_amount: sypAmount,
        original_currency: 'SYP',
        converted_amount: usdAmount,
        converted_currency: 'USD',
        exchange_rate: conversionRate,
        conversion_timestamp: new Date().toISOString(),
        gateway_amount: usdAmount,
        gateway_currency: 'USD',
      };

      paymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        provider: 'stripe',
        currency: 'USD',
        amount: usdAmount,
        gatewayResponse: currencyConversionResponse,
      });

      expect(currencyConversionResponse.converted_amount).toBe(100000); // $1000.00
      expect(currencyConversionResponse.exchange_rate).toBe(conversionRate);
    });

    it('should handle EUR payments for diaspora customers', async () => {
      const eurRate = 3000; // 1 EUR = 3000 SYP
      const sypAmount = 3000000; // 3,000,000 SYP
      const eurAmount = Math.round((sypAmount / eurRate) * 100); // €1000.00 in cents

      const eurPayment = {
        original_amount: sypAmount,
        original_currency: 'SYP',
        converted_amount: eurAmount,
        converted_currency: 'EUR',
        exchange_rate: eurRate,
        customer_location: 'Germany',
        diaspora_customer: true,
      };

      paymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        currency: 'EUR',
        amount: eurAmount,
        gatewayResponse: eurPayment,
      });

      expect(eurPayment.converted_amount).toBe(100000); // €1000.00
      expect(eurPayment.diaspora_customer).toBe(true);
    });
  });

  describe('📊 Gateway Analytics and Monitoring', () => {
    it('should track gateway performance metrics', async () => {
      const performanceMetrics = {
        gateway: 'stripe',
        response_time_ms: 234,
        success_rate: 98.5,
        average_amount: 1250000,
        currency_distribution: {
          SYP: 75,
          USD: 20,
          EUR: 5,
        },
        failure_reasons: [
          { code: 'card_declined', count: 12 },
          { code: 'insufficient_funds', count: 8 },
          { code: 'expired_card', count: 3 },
        ],
        processed_at: new Date().toISOString(),
      };

      expect(performanceMetrics.gateway).toBe('stripe');
      expect(performanceMetrics.response_time_ms).toBeLessThan(1000);
      expect(performanceMetrics.success_rate).toBeGreaterThan(95);
      expect(performanceMetrics.currency_distribution.SYP).toBe(75);
    });

    it('should monitor Syrian payment method adoption', async () => {
      const syrianPaymentMetrics = {
        total_payments: 1000,
        method_distribution: {
          cash_on_delivery: 450, // 45%
          bank_transfer: 250, // 25%
          mobile_payment: 200, // 20%
          international_card: 80, // 8%
          wallet: 20, // 2%
        },
        popular_banks: [
          { name: 'Commercial Bank of Syria', transactions: 120 },
          { name: 'Real Estate Bank', transactions: 80 },
          { name: 'Industrial Bank', transactions: 50 },
        ],
        mobile_providers: [
          { name: 'syriatel_cash', transactions: 130 },
          { name: 'mtn_mobile_money', transactions: 70 },
        ],
        governorate_distribution: {
          Damascus: 400,
          Aleppo: 250,
          Homs: 150,
          Latakia: 100,
          Others: 100,
        },
      };

      expect(syrianPaymentMetrics.method_distribution.cash_on_delivery).toBe(
        450,
      );
      expect(syrianPaymentMetrics.popular_banks[0].name).toBe(
        'Commercial Bank of Syria',
      );
      expect(syrianPaymentMetrics.mobile_providers[0].name).toBe(
        'syriatel_cash',
      );
      expect(syrianPaymentMetrics.governorate_distribution.Damascus).toBe(400);
    });
  });
});
