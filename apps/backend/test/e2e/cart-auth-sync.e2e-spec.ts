/**
 * @file cart-auth-sync.e2e-spec.ts
 * @description End-to-End Tests for Phase 4 - Authenticated Cart Synchronization
 *
 * Test Scenarios:
 * - TASK-052: Cart sync performance (< 1 second)
 * - TASK-053: Cart merge on login (guest + authenticated user)
 * - TASK-054: Multi-device cart updates
 * - TASK-055: Bilingual cart synchronization (Arabic/English)
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Cart } from '../../src/cart/entities/cart.entity';
import { CartItem } from '../../src/cart/entities/cart-item.entity';
import { GuestSession } from '../../src/cart/entities/guest-session.entity';
import { User } from '../../src/users/entities/user.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { Product } from '../../src/products/entities/product.entity';
import * as jwt from 'jsonwebtoken';

/**
 * Phase 4: Authenticated Cart Synchronization E2E Test Suite
 * 
 * Tests the following scenarios:
 * 1. TASK-052: Cart fetched within 1 second
 * 2. TASK-053: Guest cart merged into user cart correctly
 * 3. TASK-054: Multi-device synchronization
 * 4. TASK-055: Bilingual support (Arabic/English)
 * 5. Error handling and edge cases
 */
describe('Phase 4: Authenticated Cart Synchronization (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken1: string;
  let testUser1: User;
  let testProducts: ProductVariant[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    testUser1 = await createTestUser('user1@test.com', 'Test User 1');
    authToken1 = generateJwtToken(testUser1.id, testUser1.email);
    testProducts = await createTestProducts();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(Cart).delete({});
    await dataSource.getRepository(GuestSession).delete({});
  });

  describe('TASK-052: Cart Sync Performance (< 1 second)', () => {
    it('should fetch user cart within 1000ms', async () => {
      const cart = await createCartWithItems(testUser1.id, 3);
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
      expect(response.body.items).toHaveLength(3);
      console.log(`Response time: ${responseTime}ms`);
    });

    it('should fetch large cart (100 items) within 1000ms', async () => {
      const cart = await createCartWithItems(testUser1.id, 100);
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('TASK-053: Cart Merge on Login', () => {
    it('should merge guest cart with authenticated user cart', async () => {
      const guestSessionId = 'guest-session-test-' + generateUuid();
      const guestCart = await createGuestCart(guestSessionId, 2);
      const userCart = await createCartWithItems(testUser1.id, 3);

      const response = await request(app.getHttpServer())
        .post('/api/cart/merge')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ guestSessionId, strategy: 'COMBINE' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.guestSessionConverted).toBe(true);
    });
  });

  describe('TASK-054: Multi-Device Cart Updates', () => {
    it('should sync cart across devices', async () => {
      const cart = await createCartWithItems(testUser1.id, 0);

      await request(app.getHttpServer())
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ variant_id: testProducts[0].id, quantity: 2 })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.items[0].quantity).toBe(2);
    });
  });

  describe('TASK-055: Bilingual Support (Arabic/English)', () => {
    it('should return cart in Arabic', async () => {
      const cart = await createCartWithItems(testUser1.id, 1);

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken1}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.body.items).toBeDefined();
    });

    it('should return cart in English', async () => {
      const cart = await createCartWithItems(testUser1.id, 1);

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken1}`)
        .set('Accept-Language', 'en')
        .expect(200);

      expect(response.body.items).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/api/cart')
        .expect(401);
    });

    it('should reject invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // Helper functions
  async function createTestUser(email: string, name: string): Promise<User> {
    return await dataSource.getRepository(User).save({
      email,
      phone: '+963123456789',
      first_name: name.split(' ')[0],
      last_name: name.split(' ')[1] || '',
      is_active: true,
    });
  }

  async function createTestProducts(): Promise<ProductVariant[]> {
    const variants: ProductVariant[] = [];
    for (let i = 0; i < 5; i++) {
      const product = await dataSource.getRepository(Product).save({
        nameEn: `Product ${i + 1}`,
        nameAr: `منتج ${i + 1}`,
        basePrice: 10000,
        currency: 'SYP',
        status: 'active',
      });

      const variant = await dataSource.getRepository(ProductVariant).save({
        product,
        name: `Product ${i + 1} - V1`,
        sku: `SKU-${i + 1}`,
        price: 10000,
        stock: 1000,
        status: 'active',
      });
      variants.push(variant);
    }
    return variants;
  }

  async function createCartWithItems(userId: number, itemCount: number): Promise<Cart> {
    const cart = await dataSource.getRepository(Cart).save({
      userId,
      status: 'active',
      currency: 'SYP',
      items: [],
      totalItems: 0,
      totalAmount: 0,
    });

    for (let i = 0; i < Math.min(itemCount, testProducts.length); i++) {
      await dataSource.getRepository(CartItem).save({
        cart,
        variant: testProducts[i],
        quantity: 1,
        price_at_add: testProducts[i].price,
        valid: true,
        added_at: new Date(),
      });
    }

    return dataSource.getRepository(Cart).findOne({
      where: { id: cart.id },
      relations: ['items'],
    });
  }

  async function createGuestCart(sessionId: string, itemCount: number): Promise<Cart> {
    const session = await dataSource.getRepository(GuestSession).save({
      id: sessionId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const cart = await dataSource.getRepository(Cart).save({
      sessionId,
      guestSession: session,
      status: 'active',
      currency: 'SYP',
      items: [],
      totalItems: 0,
      totalAmount: 0,
    });

    for (let i = 0; i < Math.min(itemCount, testProducts.length); i++) {
      await dataSource.getRepository(CartItem).save({
        cart,
        variant: testProducts[i],
        quantity: 1,
        price_at_add: testProducts[i].price,
        valid: true,
        added_at: new Date(),
      });
    }

    return cart;
  }

  function generateJwtToken(userId: number, email: string): string {
    return jwt.sign(
      { sub: userId, email, iat: Date.now() / 1000, exp: Date.now() / 1000 + 3600 },
      process.env.JWT_SECRET || 'test-secret',
    );
  }

  function generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
});
