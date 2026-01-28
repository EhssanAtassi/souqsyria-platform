/**
 * @file test-factories.ts
 * @description Factory Pattern implementation for test data creation
 *
 * Provides factories for:
 * - User entities with various personas
 * - Order data with realistic amounts and dates
 * - CLV metrics for testing
 * - Business events for event-driven testing
 * - Funnel and analytics data
 *
 * @author Test Automation Team
 * @since 2026-01-24
 */

import { faker } from '@faker-js/faker';
import { CustomerSegment } from '../../apps/backend/src/business-intelligence/entities/business-event.entity';

/**
 * Base factory class with common functionality
 */
abstract class BaseFactory<T> {
  abstract create(overrides?: Partial<T>): T;

  createBatch(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * User factory for creating test users
 */
export class UserFactory extends BaseFactory<any> {
  /**
   * Create a basic user entity
   */
  static create(overrides?: Partial<any>): any {
    const user = {
      id: faker.datatype.number({ min: 1, max: 100000 }),
      email: faker.internet.email(),
      firstName: faker.person.firstName('ar'),
      lastName: faker.person.lastName('ar'),
      password: faker.internet.password(),
      phone: faker.phone.number('+963 9##-######'),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: new Date(),
      status: 'active',
      emailVerified: true,
      phoneVerified: false,
      role: 'customer'
    };

    return Object.assign(user, overrides);
  }

  /**
   * Create a NEW customer (< 30 days, 1 order)
   */
  static createNew(overrides?: Partial<any>): any {
    return this.create({
      createdAt: new Date(Date.now() - faker.datatype.number({ min: 0, max: 29 }) * 24 * 60 * 60 * 1000),
      email: `new_${faker.random.alphaNumeric(8)}@test.com`,
      ...overrides
    });
  }

  /**
   * Create an ACTIVE customer (regular purchases within 90 days)
   */
  static createActive(overrides?: Partial<any>): any {
    const daysAgo = faker.datatype.number({ min: 1, max: 60 });
    return this.create({
      createdAt: new Date(Date.now() - faker.datatype.number({ min: 30, max: 365 }) * 24 * 60 * 60 * 1000),
      lastActivityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      email: `active_${faker.random.alphaNumeric(8)}@test.com`,
      ...overrides
    });
  }

  /**
   * Create an AT_RISK customer (90-180 days no purchase)
   */
  static createAtRisk(overrides?: Partial<any>): any {
    const daysAgo = faker.datatype.number({ min: 91, max: 179 });
    return this.create({
      createdAt: new Date(Date.now() - faker.datatype.number({ min: 120, max: 365 }) * 24 * 60 * 60 * 1000),
      lastActivityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      email: `atrisk_${faker.random.alphaNumeric(8)}@test.com`,
      ...overrides
    });
  }

  /**
   * Create a CHURNED customer (> 365 days no purchase)
   */
  static createChurned(overrides?: Partial<any>): any {
    const daysAgo = faker.datatype.number({ min: 366, max: 730 });
    return this.create({
      createdAt: new Date(Date.now() - faker.datatype.number({ min: 400, max: 1000 }) * 24 * 60 * 60 * 1000),
      lastActivityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      email: `churned_${faker.random.alphaNumeric(8)}@test.com`,
      ...overrides
    });
  }

  /**
   * Create a VIP customer (high CLV, frequent orders)
   */
  static createVIP(overrides?: Partial<any>): any {
    const createdDaysAgo = faker.datatype.number({ min: 200, max: 730 });
    const lastOrderDaysAgo = faker.datatype.number({ min: 1, max: 30 });
    return this.create({
      createdAt: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000),
      lastActivityDate: new Date(Date.now() - lastOrderDaysAgo * 24 * 60 * 60 * 1000),
      email: `vip_${faker.random.alphaNumeric(8)}@test.com`,
      status: 'vip',
      ...overrides
    });
  }
}

/**
 * Order factory for creating test orders
 */
export class OrderFactory extends BaseFactory<any> {
  /**
   * Create a basic order
   */
  static create(userId: number, overrides?: Partial<any>): any {
    const order = {
      id: faker.datatype.number({ min: 1, max: 1000000 }),
      userId,
      totalAmount: faker.datatype.number({ min: 10000, max: 500000 }),
      currency: 'SYP',
      status: 'completed',
      items: faker.datatype.number({ min: 1, max: 10 }),
      shippingAddress: faker.address.streetAddress(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date(),
      discountApplied: faker.datatype.boolean({ probability: 0.3 })
    };

    return Object.assign(order, overrides);
  }

  /**
   * Create order for a user with realistic order history
   */
  static createBatchForUser(
    userId: number,
    count: number,
    options?: {
      minAmount?: number;
      maxAmount?: number;
      daysAgoStart?: number;
      daysAgoEnd?: number;
    }
  ): any[] {
    const daysAgoStart = options?.daysAgoStart || 1;
    const daysAgoEnd = options?.daysAgoEnd || 365;

    return Array.from({ length: count }, (_, index) => {
      const daysAgo = faker.datatype.number({
        min: daysAgoStart,
        max: daysAgoEnd
      });

      return this.create(userId, {
        totalAmount: faker.datatype.number({
          min: options?.minAmount || 10000,
          max: options?.maxAmount || 500000
        }),
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    });
  }

  /**
   * Create order for high-value customer
   */
  static createHighValue(userId: number, overrides?: Partial<any>): any {
    return this.create(userId, {
      totalAmount: faker.datatype.number({ min: 300000, max: 2000000 }),
      items: faker.datatype.number({ min: 5, max: 20 }),
      ...overrides
    });
  }

  /**
   * Create order for low-value customer
   */
  static createLowValue(userId: number, overrides?: Partial<any>): any {
    return this.create(userId, {
      totalAmount: faker.datatype.number({ min: 5000, max: 50000 }),
      items: faker.datatype.number({ min: 1, max: 3 }),
      ...overrides
    });
  }
}

/**
 * CLV Metrics factory
 */
export class CLVMetricsFactory {
  static create(overrides?: Partial<any>): any {
    const metrics = {
      userId: faker.datatype.number({ min: 1, max: 100000 }),
      email: faker.internet.email(),
      name: `${faker.person.firstName('ar')} ${faker.person.lastName('ar')}`,
      historicalCLV: faker.datatype.number({ min: 10000, max: 5000000 }),
      predictedCLV: faker.datatype.number({ min: 0, max: 2000000 }),
      totalCLV: faker.datatype.number({ min: 10000, max: 7000000 }),
      recency: faker.datatype.number({ min: 0, max: 400 }),
      frequency: faker.datatype.float({ min: 0.1, max: 20, precision: 0.1 }),
      monetary: faker.datatype.number({ min: 5000, max: 500000 }),
      orderCount: faker.datatype.number({ min: 1, max: 100 }),
      firstOrderDate: faker.date.past({ years: 2 }),
      lastOrderDate: faker.date.recent({ days: 180 }),
      lifespanDays: faker.datatype.number({ min: 1, max: 730 }),
      rfmScore: faker.datatype.float({ min: 1, max: 5, precision: 0.1 }),
      segment: faker.helpers.arrayElement([
        CustomerSegment.NEW,
        CustomerSegment.ACTIVE,
        CustomerSegment.HIGH_VALUE,
        CustomerSegment.AT_RISK,
        CustomerSegment.CHURNED,
        CustomerSegment.VIP
      ]),
      churnProbability: faker.datatype.float({ min: 0, max: 1, precision: 0.01 }),
      retentionAction: faker.lorem.sentence(),
      calculatedAt: new Date()
    };

    return Object.assign(metrics, overrides);
  }

  static createForSegment(segment: CustomerSegment, overrides?: Partial<any>): any {
    let baseMetrics: any = {
      segment,
      rfmScore: 3,
      churnProbability: 0.5
    };

    switch (segment) {
      case CustomerSegment.NEW:
        baseMetrics = {
          ...baseMetrics,
          historicalCLV: faker.datatype.number({ min: 10000, max: 100000 }),
          recency: faker.datatype.number({ min: 0, max: 29 }),
          orderCount: 1,
          frequency: 0,
          rfmScore: faker.datatype.float({ min: 1, max: 2.5 }),
          churnProbability: faker.datatype.float({ min: 0.3, max: 0.6 })
        };
        break;

      case CustomerSegment.ACTIVE:
        baseMetrics = {
          ...baseMetrics,
          historicalCLV: faker.datatype.number({ min: 100000, max: 1000000 }),
          recency: faker.datatype.number({ min: 0, max: 89 }),
          orderCount: faker.datatype.number({ min: 3, max: 15 }),
          frequency: faker.datatype.float({ min: 1, max: 5 }),
          rfmScore: faker.datatype.float({ min: 3, max: 4.5 }),
          churnProbability: faker.datatype.float({ min: 0.1, max: 0.4 })
        };
        break;

      case CustomerSegment.AT_RISK:
        baseMetrics = {
          ...baseMetrics,
          historicalCLV: faker.datatype.number({ min: 200000, max: 2000000 }),
          recency: faker.datatype.number({ min: 90, max: 179 }),
          orderCount: faker.datatype.number({ min: 5, max: 30 }),
          frequency: faker.datatype.float({ min: 0.5, max: 2 }),
          rfmScore: faker.datatype.float({ min: 1.5, max: 3 }),
          churnProbability: faker.datatype.float({ min: 0.5, max: 0.8 })
        };
        break;

      case CustomerSegment.CHURNED:
        baseMetrics = {
          ...baseMetrics,
          historicalCLV: faker.datatype.number({ min: 100000, max: 1500000 }),
          recency: faker.datatype.number({ min: 365, max: 730 }),
          orderCount: faker.datatype.number({ min: 1, max: 20 }),
          frequency: 0,
          rfmScore: faker.datatype.float({ min: 1, max: 2 }),
          churnProbability: faker.datatype.float({ min: 0.8, max: 1 })
        };
        break;

      case CustomerSegment.VIP:
        baseMetrics = {
          ...baseMetrics,
          historicalCLV: faker.datatype.number({ min: 2000000, max: 10000000 }),
          recency: faker.datatype.number({ min: 0, max: 30 }),
          orderCount: faker.datatype.number({ min: 20, max: 100 }),
          frequency: faker.datatype.float({ min: 5, max: 20 }),
          rfmScore: faker.datatype.float({ min: 4, max: 5 }),
          churnProbability: faker.datatype.float({ min: 0.05, max: 0.2 })
        };
        break;
    }

    return this.create(Object.assign(baseMetrics, overrides));
  }

  static createBatch(count: number, segment?: CustomerSegment, overrides?: Partial<any>): any[] {
    if (segment) {
      return Array.from({ length: count }, () => this.createForSegment(segment, overrides));
    }
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * Funnel data factory
 */
export class FunnelFactory {
  static create(overrides?: Partial<any>): any {
    const steps = ['Browse', 'Add to Cart', 'Checkout', 'Payment', 'Confirmation'];
    const users = [];
    let currentUsers = 10000;

    const conversionRates = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const rate = faker.datatype.number({ min: 30, max: 90 });
      conversionRates.push(rate);
      currentUsers = Math.floor(currentUsers * (rate / 100));
      users.push(currentUsers);
    }

    const funnel = {
      id: faker.datatype.number({ min: 1, max: 10000 }),
      name: faker.commerce.productName(),
      steps,
      users: [10000, ...users],
      conversionRates,
      dropoffAnalysis: steps.map((step, index) => ({
        step,
        usersDropped: index === 0 ? 0 : steps.length - 1 - index,
        dropoffRate: index === 0 ? 0 : faker.datatype.number({ min: 5, max: 50 })
      })),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date()
    };

    return Object.assign(funnel, overrides);
  }

  static createBatch(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * Analytics summary factory
 */
export class AnalyticsSummaryFactory {
  static create(overrides?: Partial<any>): any {
    return {
      totalRevenue: faker.datatype.number({ min: 1000000, max: 10000000 }),
      totalOrders: faker.datatype.number({ min: 100, max: 5000 }),
      averageOrderValue: faker.datatype.number({ min: 50000, max: 500000 }),
      totalCustomers: faker.datatype.number({ min: 100, max: 10000 }),
      conversionRate: faker.datatype.float({ min: 1, max: 5, precision: 0.1 }),
      cartAbandonmentRate: faker.datatype.float({ min: 20, max: 80, precision: 0.1 }),
      customerRetentionRate: faker.datatype.float({ min: 20, max: 80, precision: 0.1 }),
      period: faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'yearly']),
      dateRange: {
        start: faker.date.past({ years: 1 }),
        end: new Date()
      }
    };
  }
}

/**
 * Business event factory
 */
export class BusinessEventFactory {
  static create(overrides?: Partial<any>): any {
    return {
      id: faker.datatype.number({ min: 1, max: 1000000 }),
      eventType: faker.helpers.arrayElement(['ORDER_PLACED', 'ORDER_COMPLETED', 'CLV_CALCULATED']),
      userId: faker.datatype.number({ min: 1, max: 100000 }),
      aggregateId: `user_${faker.datatype.number()}`,
      aggregateType: 'user',
      sourceModule: 'business-intelligence',
      eventPayload: {
        clv: faker.datatype.number({ min: 10000, max: 1000000 })
      },
      createdAt: faker.date.recent({ days: 30 })
    };
  }

  static createBatch(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
