/**
 * @file orders.seeder.service.ts
 * @description Orders Seeder Service for SouqSyria
 *
 * Creates comprehensive test data for orders including:
 * - Orders with various statuses and payment methods
 * - Multi-vendor order distribution
 * - Syrian market specific data (governorates, Arabic text, SYP currency)
 * - Order status progression with logs
 * - Return and refund scenarios
 * - Realistic order patterns and timing
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';
import { ReturnRequest } from '../entities/return-request.entity';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';

interface OrderSeederResult {
  success: boolean;
  ordersCreated: number;
  orderItemsCreated: number;
  statusLogsCreated: number;
  returnRequestsCreated?: number;
  executionTime: number;
  error?: string;
}

interface SeederOptions {
  batchSize?: number;
  includeReturns?: boolean;
  governorateDistribution?: boolean;
}

@Injectable()
export class OrdersSeederService {
  private readonly logger = new Logger(OrdersSeederService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderStatusLog)
    private readonly statusLogRepository: Repository<OrderStatusLog>,

    @InjectRepository(ReturnRequest)
    private readonly returnRequestRepository: Repository<ReturnRequest>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Seeds comprehensive order data with Syrian market features
   */
  async seedOrders(options: SeederOptions = {}): Promise<OrderSeederResult> {
    const startTime = Date.now();
    const {
      batchSize = 50,
      includeReturns = true,
      governorateDistribution = true,
    } = options;

    this.logger.log('🌱 Starting orders seeding process...');

    try {
      // Validate prerequisites
      const users = await this.userRepository.find({ take: 20 });
      const variants = await this.variantRepository.find({
        take: 30,
        relations: ['product'],
      });

      if (users.length === 0) {
        return {
          success: false,
          ordersCreated: 0,
          orderItemsCreated: 0,
          statusLogsCreated: 0,
          executionTime: Date.now() - startTime,
          error: 'No users found in database. Please seed users first.',
        };
      }

      if (variants.length === 0) {
        return {
          success: false,
          ordersCreated: 0,
          orderItemsCreated: 0,
          statusLogsCreated: 0,
          executionTime: Date.now() - startTime,
          error:
            'No product variants found in database. Please seed products first.',
        };
      }

      this.logger.log(
        `Found ${users.length} users and ${variants.length} variants for seeding`,
      );

      // Generate order data
      const orderData = this.generateOrderSeedData(
        users,
        variants,
        batchSize,
        governorateDistribution,
      );

      let ordersCreated = 0;
      let orderItemsCreated = 0;
      let statusLogsCreated = 0;

      // Create orders in batches
      for (const orderInfo of orderData) {
        try {
          // Create order
          const order = this.orderRepository.create({
            user: orderInfo.user,
            payment_method: orderInfo.payment_method,
            payment_status: orderInfo.payment_status,
            status: orderInfo.status,
            total_amount: orderInfo.total_amount,
            buyer_note: orderInfo.buyer_note,
            gift_message: orderInfo.gift_message,
            shippingName: orderInfo.shipping_address.name,
            shippingPhone: orderInfo.shipping_address.phone,
            shippingAddressLine1: orderInfo.shipping_address.address_line1,
            shippingAddressLine2: orderInfo.shipping_address.address_line2,
            shippingCity: orderInfo.shipping_address.city,
            shippingRegion: orderInfo.shipping_address.region,
            shippingCountry: orderInfo.shipping_address.country,
            shippingPostalCode: orderInfo.shipping_address.postal_code,
            created_at: orderInfo.created_at,
            updated_at: orderInfo.updated_at,
          });

          const savedOrder = await this.orderRepository.save(order);
          ordersCreated++;

          // Create order items
          for (const itemInfo of orderInfo.items) {
            const orderItem = this.orderItemRepository.create({
              order: savedOrder,
              variant: itemInfo.variant,
              quantity: itemInfo.quantity,
              price: itemInfo.price,
            });

            await this.orderItemRepository.save(orderItem);
            orderItemsCreated++;
          }

          // Create status progression logs
          for (const statusLog of orderInfo.status_logs) {
            const log = this.statusLogRepository.create({
              order: savedOrder,
              status: statusLog.status,
              changedBy: statusLog.changedBy,
              comment: statusLog.comment,
              changedAt: statusLog.changedAt,
            });

            await this.statusLogRepository.save(log);
            statusLogsCreated++;
          }
        } catch (error) {
          this.logger.error(`Failed to create order: ${error.message}`);
          throw error;
        }
      }

      let returnRequestsCreated = 0;
      if (includeReturns) {
        const returnResult = await this.seedReturnRequests();
        returnRequestsCreated = returnResult.returnRequestsCreated || 0;
      }

      const executionTime = Date.now() - startTime;

      this.logger.log(`✅ Orders seeding completed successfully:`);
      this.logger.log(`   📦 Orders created: ${ordersCreated}`);
      this.logger.log(`   📋 Order items created: ${orderItemsCreated}`);
      this.logger.log(`   📊 Status logs created: ${statusLogsCreated}`);
      if (includeReturns) {
        this.logger.log(
          `   ↩️ Return requests created: ${returnRequestsCreated}`,
        );
      }
      this.logger.log(`   ⏱️ Execution time: ${executionTime}ms`);

      return {
        success: true,
        ordersCreated,
        orderItemsCreated,
        statusLogsCreated,
        returnRequestsCreated,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Orders seeding failed: ${error.message}`);

      return {
        success: false,
        ordersCreated: 0,
        orderItemsCreated: 0,
        statusLogsCreated: 0,
        executionTime,
        error: error.message,
      };
    }
  }

  /**
   * Seeds return requests for delivered orders
   */
  async seedReturnRequests(): Promise<{
    success: boolean;
    returnRequestsCreated: number;
    error?: string;
  }> {
    this.logger.log('🔄 Seeding return requests...');

    try {
      // Find delivered orders for return requests
      const deliveredOrders = await this.orderRepository.find({
        where: { status: 'delivered' },
        relations: ['user'],
        take: 10,
      });

      if (deliveredOrders.length === 0) {
        this.logger.warn('No delivered orders found for return seeding');
        return { success: true, returnRequestsCreated: 0 };
      }

      const returnReasons = [
        'Product damaged',
        'Wrong item received',
        'Size/color mismatch',
        'Quality issues',
        'Not as described',
        'Defective product',
        'المنتج تالف',
        'تم استلام منتج خاطئ',
        'عدم تطابق الحجم أو اللون',
        'مشاكل في الجودة',
      ];

      const returnStatuses = ['pending', 'approved', 'rejected', 'processing'];

      let returnRequestsCreated = 0;

      // Create return requests for some delivered orders
      const ordersToReturn = deliveredOrders.slice(
        0,
        Math.ceil(deliveredOrders.length * 0.3),
      );

      for (const order of ordersToReturn) {
        const returnRequest = this.returnRequestRepository.create({
          user: order.user,
          order: order,
          reason: this.getRandomItem(returnReasons),
          status: this.getRandomItem(returnStatuses) as any,
          evidence_images: this.generateEvidenceImages(),
          created_at: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ), // Within last 7 days
        });

        await this.returnRequestRepository.save(returnRequest);
        returnRequestsCreated++;
      }

      this.logger.log(`✅ Created ${returnRequestsCreated} return requests`);

      return { success: true, returnRequestsCreated };
    } catch (error) {
      this.logger.error(`❌ Return requests seeding failed: ${error.message}`);
      return { success: false, returnRequestsCreated: 0, error: error.message };
    }
  }

  /**
   * Generates comprehensive order seed data with Syrian market features
   */
  private generateOrderSeedData(
    users: User[],
    variants: ProductVariant[],
    count: number,
    governorateDistribution: boolean,
  ): any[] {
    const orders = [];
    const syrianGovernorates = [
      'Damascus',
      'Aleppo',
      'Homs',
      'Latakia',
      'Hama',
      'Idlib',
      'Daraa',
      'Deir ez-Zor',
      'Raqqa',
      'As-Suwayda',
      'Quneitra',
      'Tartus',
      'Al-Hasakah',
      'Damascus Countryside',
    ];

    const paymentMethods = [
      'cash_on_delivery',
      'bank_transfer',
      'credit_card',
      'mobile_payment',
    ];

    const orderStatuses = [
      'pending',
      'confirmed',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];

    const arabicNotes = [
      'يرجى الاتصال قبل التسليم',
      'تسليم سريع مطلوب',
      'هدية عيد ميلاد سعيد',
      'بضائع حساسة - يرجى التعامل بحذر',
      'تسليم في ساعات المساء فقط',
      'يرجى التأكد من حالة المنتج',
      'طلب عاجل للغاية',
      'يرجى تغليف المنتج بعناية',
    ];

    const arabicGiftMessages = [
      'هدية من الأصدقاء - كل عام وأنتم بخير',
      'بمناسبة عيد الميلاد السعيد',
      'هدية زفاف مباركة',
      'بمناسبة النجاح والتفوق',
      'هدية من العائلة مع أطيب التمنيات',
    ];

    for (let i = 0; i < count; i++) {
      const user = this.getRandomItem(users);
      const governorate = governorateDistribution
        ? this.getRandomItem(syrianGovernorates)
        : 'Damascus';

      // Generate 1-4 items per order
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const orderItems = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const variant = this.getRandomItem(variants);
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = variant.price;

        orderItems.push({
          variant,
          quantity,
          price,
        });

        totalAmount += price * quantity;
      }

      const status = this.getRandomItem(orderStatuses);
      const paymentMethod = this.getRandomItem(paymentMethods);
      const hasArabicNote = Math.random() > 0.6;
      const hasGiftMessage = Math.random() > 0.8;

      // Create realistic timestamps
      const createdAt = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      );
      const updatedAt = new Date(
        createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
      );

      const order = {
        user,
        payment_method: paymentMethod,
        payment_status: this.getPaymentStatus(status, paymentMethod),
        status,
        total_amount: totalAmount,
        buyer_note: hasArabicNote
          ? this.getRandomItem(arabicNotes)
          : 'Please handle with care',
        gift_message: hasGiftMessage
          ? this.getRandomItem(arabicGiftMessages)
          : null,
        shipping_address: {
          name: user.fullName || 'Anonymous User',
          phone: user.phone || '+963987654321',
          address_line1: this.generateSyrianAddress(governorate),
          address_line2: this.generateBuildingInfo(),
          city: governorate,
          region: governorate,
          country: 'Syria',
          postal_code: this.generatePostalCode(governorate),
        },
        items: orderItems,
        status_logs: this.generateStatusLogs(
          status,
          user,
          createdAt,
          updatedAt,
        ),
        created_at: createdAt,
        updated_at: updatedAt,
      };

      orders.push(order);
    }

    return orders;
  }

  /**
   * Generates realistic status progression logs
   */
  private generateStatusLogs(
    finalStatus: string,
    user: User,
    createdAt: Date,
    updatedAt: Date,
  ): any[] {
    const statusProgression = {
      pending: ['pending'],
      confirmed: ['pending', 'confirmed'],
      paid: ['pending', 'confirmed', 'paid'],
      processing: ['pending', 'confirmed', 'paid', 'processing'],
      shipped: ['pending', 'confirmed', 'paid', 'processing', 'shipped'],
      delivered: [
        'pending',
        'confirmed',
        'paid',
        'processing',
        'shipped',
        'delivered',
      ],
      cancelled: ['pending', 'cancelled'],
    };

    const progression = statusProgression[finalStatus] || ['pending'];
    const logs = [];

    const currentTime = createdAt;
    const timeIncrement =
      (updatedAt.getTime() - createdAt.getTime()) / progression.length;

    for (let i = 0; i < progression.length; i++) {
      const status = progression[i];

      logs.push({
        status,
        changedBy: user,
        comment: this.getStatusComment(status),
        changedAt: new Date(currentTime.getTime() + i * timeIncrement),
      });
    }

    return logs;
  }

  /**
   * Generates Syrian-specific addresses
   */
  private generateSyrianAddress(governorate: string): string {
    const damascusStreets = [
      'شارع الثورة',
      'شارع بغداد',
      'شارع المالكي',
      'شارع الزهراء',
      'شارع القصور',
      'شارع البرامكة',
      'شارع أبو رمانة',
      'شارع المزة',
    ];

    const aleppoStreets = [
      'شارع الملك فيصل',
      'شارع الخانقة',
      'شارع الجميلية',
      'شارع السليمانية',
      'شارع العزيزية',
      'شارع الصالحية',
      'شارع الحيدرية',
    ];

    const genericStreets = [
      'الشارع الرئيسي',
      'شارع الجامعة',
      'شارع الوحدة',
      'شارع العروبة',
      'شارع الحرية',
      'شارع السلام',
      'شارع النصر',
    ];

    let streets = genericStreets;
    if (governorate === 'Damascus') streets = damascusStreets;
    if (governorate === 'Aleppo') streets = aleppoStreets;

    return this.getRandomItem(streets);
  }

  /**
   * Generates building and apartment information
   */
  private generateBuildingInfo(): string {
    const buildingTypes = ['بناء رقم', 'مجمع', 'برج', 'عمارة'];

    const buildingNumber = Math.floor(Math.random() * 200) + 1;
    const floor = Math.floor(Math.random() * 10) + 1;
    const buildingType = this.getRandomItem(buildingTypes);

    return `${buildingType} ${buildingNumber}، الطابق ${floor}`;
  }

  /**
   * Generates postal codes based on governorate
   */
  private generatePostalCode(governorate: string): string {
    const codes = {
      Damascus: '11000',
      Aleppo: '21000',
      Homs: '31000',
      Latakia: '41000',
      Hama: '35000',
    };

    return codes[governorate] || '10000';
  }

  /**
   * Determines payment status based on order status and payment method
   */
  private getPaymentStatus(orderStatus: string, paymentMethod: string): string {
    if (paymentMethod === 'cash_on_delivery') {
      return ['delivered'].includes(orderStatus) ? 'paid' : 'unpaid';
    }

    return ['paid', 'processing', 'shipped', 'delivered'].includes(orderStatus)
      ? 'paid'
      : 'unpaid';
  }

  /**
   * Generates status change comments
   */
  private getStatusComment(status: string): string {
    const comments = {
      pending: 'Order placed successfully',
      confirmed: 'Order confirmed by vendor',
      paid: 'Payment processed successfully',
      processing: 'Order is being prepared',
      shipped: 'Order shipped to customer',
      delivered: 'Order delivered successfully',
      cancelled: 'Order cancelled by customer',
    };

    return comments[status] || `Order status updated to ${status}`;
  }

  /**
   * Generates evidence image URLs for return requests
   */
  private generateEvidenceImages(): string[] {
    const imageCount = Math.floor(Math.random() * 3) + 1;
    const images = [];

    for (let i = 0; i < imageCount; i++) {
      images.push(
        `https://souqsyria.com/evidence/return_${Date.now()}_${i}.jpg`,
      );
    }

    return images;
  }

  /**
   * Gets a random item from an array
   */
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
