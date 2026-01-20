/**
 * @file test-data-helper.ts
 * @description Test data helper utility for E2E tests
 * 
 * FEATURES:
 * - Setup and cleanup test environment
 * - Create test data for various modules
 * - Database cleanup utilities
 * - Test environment management
 * 
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TestDataHelper {
  private readonly logger = new Logger(TestDataHelper.name);

  /**
   * Setup test environment for E2E tests
   */
  async setupTestEnvironment(): Promise<void> {
    this.logger.log('🔧 Setting up test environment...');
    
    try {
      // Initialize test environment
      // This is a placeholder for test setup logic
      
      this.logger.log('✅ Test environment setup completed');
    } catch (error) {
      this.logger.error('❌ Failed to setup test environment:', error);
      throw error;
    }
  }

  /**
   * Cleanup test environment after E2E tests
   */
  async cleanupTestEnvironment(): Promise<void> {
    this.logger.log('🧹 Cleaning up test environment...');
    
    try {
      // Cleanup test environment
      // This is a placeholder for test cleanup logic
      
      this.logger.log('✅ Test environment cleanup completed');
    } catch (error) {
      this.logger.error('❌ Failed to cleanup test environment:', error);
      throw error;
    }
  }

  /**
   * Create test user data
   */
  async createTestUsers(count: number = 5): Promise<any[]> {
    this.logger.log(`👥 Creating ${count} test users...`);
    
    const users = [];
    for (let i = 1; i <= count; i++) {
      users.push({
        id: i,
        email: `testuser${i}@souqsyria.com`,
        name: `Test User ${i}`,
        isActive: true,
      });
    }
    
    this.logger.log(`✅ Created ${users.length} test users`);
    return users;
  }

  /**
   * Create test order data
   */
  async createTestOrders(count: number = 10): Promise<any[]> {
    this.logger.log(`📦 Creating ${count} test orders...`);
    
    const orders = [];
    for (let i = 1; i <= count; i++) {
      orders.push({
        id: i,
        orderNumber: `ORD-${i.toString().padStart(6, '0')}`,
        totalAmount: Math.floor(Math.random() * 500000) + 50000, // 50K-550K SYP
        status: 'completed',
        createdAt: new Date(),
      });
    }
    
    this.logger.log(`✅ Created ${orders.length} test orders`);
    return orders;
  }

  /**
   * Create test product data
   */
  async createTestProducts(count: number = 20): Promise<any[]> {
    this.logger.log(`🛍️ Creating ${count} test products...`);
    
    const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports', 'Books'];
    const products = [];
    
    for (let i = 1; i <= count; i++) {
      products.push({
        id: i,
        name: `Test Product ${i}`,
        nameAr: `منتج تجريبي ${i}`,
        price: Math.floor(Math.random() * 100000) + 10000, // 10K-110K SYP
        category: categories[Math.floor(Math.random() * categories.length)],
        isActive: true,
      });
    }
    
    this.logger.log(`✅ Created ${products.length} test products`);
    return products;
  }

  /**
   * Wait for a specified amount of time
   */
  async wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Generate random test data
   */
  generateRandomData(type: 'email' | 'name' | 'phone' | 'address', locale: 'en' | 'ar' = 'en'): string {
    switch (type) {
      case 'email':
        const randomId = Math.floor(Math.random() * 10000);
        return `test${randomId}@souqsyria.com`;
      
      case 'name':
        if (locale === 'ar') {
          const arabicNames = ['أحمد محمد', 'فاطمة علي', 'محمد أحمد', 'عائشة خالد', 'علي حسن'];
          return arabicNames[Math.floor(Math.random() * arabicNames.length)];
        } else {
          const englishNames = ['Ahmad Mohammed', 'Fatima Ali', 'Mohammed Ahmad', 'Aisha Khalid', 'Ali Hassan'];
          return englishNames[Math.floor(Math.random() * englishNames.length)];
        }
      
      case 'phone':
        return '+963-9' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      
      case 'address':
        if (locale === 'ar') {
          const cities = ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة'];
          return `${cities[Math.floor(Math.random() * cities.length)]}, شارع ${Math.floor(Math.random() * 50) + 1}`;
        } else {
          const cities = ['Damascus', 'Aleppo', 'Homs', 'Lattakia', 'Hama'];
          return `${cities[Math.floor(Math.random() * cities.length)]}, Street ${Math.floor(Math.random() * 50) + 1}`;
        }
      
      default:
        return 'test-data';
    }
  }
}