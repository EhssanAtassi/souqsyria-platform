import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { MobileSeederService } from '../seeds/mobile.seeder.service';

/**
 * Mobile Products E2E Tests
 *
 * Tests mobile products endpoints including:
 * - Mobile product feed
 * - Product details
 * - Quick search
 * - Featured products
 * - Category filtering
 */
describe('Mobile Products (e2e)', () => {
  let app: INestApplication;
  let seederService: MobileSeederService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    seederService = moduleFixture.get<MobileSeederService>(MobileSeederService);

    await app.init();

    // Seed test data
    await seederService.seedAll();
  });

  afterAll(async () => {
    await seederService.cleanAll(false);
    await app.close();
  });

  describe('GET /api/mobile/v1/products', () => {
    it('should return mobile-optimized product feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          page: 1,
          limit: 10,
          language: 'en',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body).toHaveProperty('performance');

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 10);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.performance).toHaveProperty(
        'optimizedForMobile',
        true,
      );

      // Check mobile-optimized product structure
      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('slug');
        expect(product).toHaveProperty('nameEn');
        expect(product).toHaveProperty('nameAr');
        expect(product).toHaveProperty('images');
        expect(product).toHaveProperty('pricing');
        expect(product).toHaveProperty('availability');
        expect(product).toHaveProperty('ratings');

        // Check mobile-optimized images
        expect(product.images).toHaveProperty('original');
        expect(product.images).toHaveProperty('thumbnail');
        expect(product.images).toHaveProperty('medium');
        expect(product.images).toHaveProperty('large');

        // Check pricing structure
        expect(product.pricing).toHaveProperty('basePrice');
        expect(product.pricing).toHaveProperty('currency');

        // Check availability
        expect(product.availability).toHaveProperty('inStock');
      }
    });

    it('should support Arabic language', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          page: 1,
          limit: 5,
          language: 'ar',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product).toHaveProperty('nameAr');
        expect(typeof product.nameAr).toBe('string');
        expect(product.nameAr.length).toBeGreaterThan(0);
      }
    });

    it('should support filtering by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          categoryId: 1,
          page: 1,
          limit: 5,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should support price filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          minPrice: 100000, // 100,000 SYP
          maxPrice: 5000000, // 5,000,000 SYP
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();

      // Check that returned products are within price range
      response.body.data.forEach((product) => {
        const price =
          product.pricing.discountPrice || product.pricing.basePrice;
        expect(price).toBeGreaterThanOrEqual(100000);
        expect(price).toBeLessThanOrEqual(5000000);
      });
    });

    it('should support sorting options', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          sortBy: 'price',
          sortOrder: 'asc',
          page: 1,
          limit: 5,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should limit mobile page size to maximum', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          page: 1,
          limit: 100, // Request more than max (50)
        })
        .expect(200);

      expect(response.body.meta.limit).toBeLessThanOrEqual(50);
    });

    it('should support in-stock filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({
          inStockOnly: true,
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();

      // Check that all returned products are in stock
      response.body.data.forEach((product) => {
        expect(product.availability.inStock).toBe(true);
      });
    });
  });

  describe('GET /api/mobile/v1/products/:slug', () => {
    it('should return mobile-optimized product details', async () => {
      // First get a product slug from the feed
      const feedResponse = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({ page: 1, limit: 1 });

      if (feedResponse.body.data.length === 0) {
        // Skip test if no products available
        return;
      }

      const productSlug = feedResponse.body.data[0].slug;

      const response = await request(app.getHttpServer())
        .get(`/api/mobile/v1/products/${productSlug}`)
        .query({ language: 'en' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('slug', productSlug);
      expect(response.body).toHaveProperty('nameEn');
      expect(response.body).toHaveProperty('nameAr');
      expect(response.body).toHaveProperty('fullDescription');
      expect(response.body).toHaveProperty('images');
      expect(response.body).toHaveProperty('imageGallery');
      expect(response.body).toHaveProperty('pricing');
      expect(response.body).toHaveProperty('availability');
      expect(response.body).toHaveProperty('variants');
      expect(response.body).toHaveProperty('vendor');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('shipping');
      expect(response.body).toHaveProperty('warranty');
      expect(response.body).toHaveProperty('ratings');

      // Check detailed image gallery
      expect(Array.isArray(response.body.imageGallery)).toBe(true);

      // Check variants structure
      expect(Array.isArray(response.body.variants)).toBe(true);

      // Check full description structure
      if (response.body.fullDescription) {
        expect(response.body.fullDescription).toHaveProperty('en');
        expect(response.body.fullDescription).toHaveProperty('ar');
      }
    });

    it('should support Arabic language for details', async () => {
      const feedResponse = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({ page: 1, limit: 1 });

      if (feedResponse.body.data.length === 0) {
        return;
      }

      const productSlug = feedResponse.body.data[0].slug;

      const response = await request(app.getHttpServer())
        .get(`/api/mobile/v1/products/${productSlug}`)
        .query({ language: 'ar' })
        .expect(200);

      expect(response.body).toHaveProperty('nameAr');
      if (response.body.fullDescription) {
        expect(response.body.fullDescription).toHaveProperty('ar');
      }
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/non-existent-product-slug')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/mobile/v1/products/search/quick', () => {
    it('should return quick search suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/search/quick')
        .query({
          q: 'samsung',
          limit: 5,
          language: 'en',
        })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('query', 'samsung');
      expect(response.body).toHaveProperty('count');

      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body.suggestions.length).toBeLessThanOrEqual(5);

      // Check suggestion structure
      if (response.body.suggestions.length > 0) {
        const suggestion = response.body.suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('slug');
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('image');
        expect(suggestion).toHaveProperty('price');
        expect(suggestion).toHaveProperty('currency');
      }
    });

    it('should limit suggestions to maximum', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/search/quick')
        .query({
          q: 'phone',
          limit: 50, // Request more than max (20)
          language: 'en',
        })
        .expect(200);

      expect(response.body.suggestions.length).toBeLessThanOrEqual(20);
    });

    it('should support Arabic search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/search/quick')
        .query({
          q: 'هاتف', // Arabic for phone
          limit: 5,
          language: 'ar',
        })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('query', 'هاتف');
    });

    it('should require search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/search/quick')
        .query({
          // Missing 'q' parameter
          limit: 5,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/mobile/v1/products/categories/:categoryId', () => {
    it('should return products filtered by category', async () => {
      const categoryId = 1;

      const response = await request(app.getHttpServer())
        .get(`/api/mobile/v1/products/categories/${categoryId}`)
        .query({
          page: 1,
          limit: 10,
          language: 'en',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Check that products belong to the category
      response.body.data.forEach((product) => {
        if (product.category) {
          expect(product.category.id).toBe(categoryId);
        }
      });
    });

    it('should support sorting for category products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/categories/1')
        .query({
          page: 1,
          limit: 5,
          sortBy: 'rating',
          language: 'en',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/mobile/v1/products/featured', () => {
    it('should return featured products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/featured')
        .query({
          limit: 5,
          language: 'en',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Check that products have featured badge
      response.body.data.forEach((product) => {
        if (product.badges) {
          expect(product.badges).toContain('featured');
        }
      });
    });

    it('should limit featured products count', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/featured')
        .query({
          limit: 100, // Request more than max (20)
          language: 'en',
        })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });

    it('should support Arabic language for featured products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/featured')
        .query({
          limit: 3,
          language: 'ar',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product).toHaveProperty('nameAr');
      }
    });
  });

  describe('Mobile Products Integration', () => {
    it('should handle complete mobile shopping flow', async () => {
      // 1. Get product feed
      const feedResponse = await request(app.getHttpServer())
        .get('/api/mobile/v1/products')
        .query({ page: 1, limit: 5, language: 'en' })
        .expect(200);

      expect(feedResponse.body.data.length).toBeGreaterThan(0);

      // 2. Search for products
      const searchResponse = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/search/quick')
        .query({ q: 'phone', limit: 3 })
        .expect(200);

      expect(searchResponse.body.suggestions).toBeDefined();

      // 3. Get featured products
      const featuredResponse = await request(app.getHttpServer())
        .get('/api/mobile/v1/products/featured')
        .query({ limit: 3 })
        .expect(200);

      expect(featuredResponse.body.data).toBeDefined();

      // 4. Get product details
      if (feedResponse.body.data.length > 0) {
        const productSlug = feedResponse.body.data[0].slug;

        const detailsResponse = await request(app.getHttpServer())
          .get(`/api/mobile/v1/products/${productSlug}`)
          .query({ language: 'en' })
          .expect(200);

        expect(detailsResponse.body).toHaveProperty('id');
        expect(detailsResponse.body).toHaveProperty('slug', productSlug);
      }
    });

    it('should maintain consistent mobile optimization across endpoints', async () => {
      const endpoints = [
        '/api/mobile/v1/products?page=1&limit=3',
        '/api/mobile/v1/products/featured?limit=3',
        '/api/mobile/v1/products/categories/1?limit=3',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);

        // Check mobile optimization marker
        if (response.body.performance) {
          expect(response.body.performance.optimizedForMobile).toBe(true);
        }

        // Check response structure consistency
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(Array.isArray(response.body.data)).toBe(true);

        // Check mobile-optimized image structure for each product
        response.body.data.forEach((product) => {
          if (product.images) {
            expect(product.images).toHaveProperty('thumbnail');
            expect(product.images).toHaveProperty('medium');
            expect(product.images).toHaveProperty('large');
          }
        });
      }
    });
  });
});
