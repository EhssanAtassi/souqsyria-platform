#!/usr/bin/env ts-node
/**
 * @file seed-runner.ts
 * @description CLI script to seed the database with Syrian marketplace products.
 *
 * This script creates a TypeORM DataSource connection and populates the database with:
 * - 6 product categories (Damascus Steel, Beauty, Textiles, Food, Crafts, Jewelry)
 * - 50+ realistic Syrian products with pricing, images, descriptions, and variants
 * - Variant-level stock entries in warehouses
 *
 * Features:
 * - Idempotent: Can be run multiple times safely (clears existing seed data)
 * - Comprehensive error handling and logging
 * - Transaction support for data integrity
 * - Color-coded console output for better visibility
 *
 * Usage:
 * ```bash
 * npx ts-node apps/backend/src/products/seeds/seed-runner.ts
 * ```
 *
 * Environment Variables Required:
 * - DB_HOST: MySQL host (default: localhost)
 * - DB_PORT: MySQL port (default: 3306)
 * - DB_USERNAME: Database username (default: root)
 * - DB_PASSWORD: Database password
 * - DB_NAME or DB_DATABASE: Database name (default: souqsyria)
 *
 * @author SouqSyria Development Team
 * @since 2026-02-07
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { getSeedProducts, getCategorySeedData } from './product-seeds';

// Load environment variables from .env files
config({ path: ['.env.development', '.env'] });

/**
 * Console color codes for pretty output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Logger utility with color-coded output
 */
const logger = {
  info: (message: string) =>
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`),
  success: (message: string) =>
    console.log(`${colors.green}✓${colors.reset} ${message}`),
  warning: (message: string) =>
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`),
  error: (message: string) =>
    console.error(`${colors.red}✗${colors.reset} ${message}`),
  section: (title: string) =>
    console.log(
      `\n${colors.bright}${colors.cyan}═══ ${title} ═══${colors.reset}\n`,
    ),
};

/**
 * Create TypeORM DataSource for database operations
 * Uses environment variables for connection configuration
 */
const createDataSource = (): DataSource => {
  const entitiesPath = path.join(__dirname, '../../**/*.entity{.ts,.js}');

  return new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'souqsyria',
    entities: [entitiesPath],
    synchronize: false, // Never auto-sync in seed scripts
    logging: false, // Disable query logging for cleaner output
  });
};

/**
 * Main seeding function
 * Clears existing seed data and inserts fresh data in a transaction
 */
async function seed() {
  logger.section('SouqSyria Product Database Seeder');
  logger.info('Initializing database connection...');

  const dataSource = createDataSource();

  try {
    // Initialize connection
    await dataSource.initialize();
    logger.success('Database connection established');
    logger.info(
      `Connected to: ${dataSource.options.database}@${(dataSource.options as unknown as { host?: string }).host ?? 'localhost'}`,
    );

    // Start transaction for atomic operations
    await dataSource.transaction(async (transactionalEntityManager) => {
      logger.section('Step 1: Clear Existing Seed Data');

      // Clear existing data in reverse dependency order
      logger.info('Clearing product stocks...');
      await transactionalEntityManager.query(
        'DELETE FROM product_stocks WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE sku LIKE "DAM-%" OR sku LIKE "SOAP-%" OR sku LIKE "FABRIC-%" OR sku LIKE "SPICE-%" OR sku LIKE "CRAFT-%" OR sku LIKE "JEWELRY-%"))',
      );

      logger.info('Clearing product variants...');
      await transactionalEntityManager.query(
        'DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE sku LIKE "DAM-%" OR sku LIKE "SOAP-%" OR sku LIKE "FABRIC-%" OR sku LIKE "SPICE-%" OR sku LIKE "CRAFT-%" OR sku LIKE "JEWELRY-%")',
      );

      logger.info('Clearing product images...');
      await transactionalEntityManager.query(
        'DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE sku LIKE "DAM-%" OR sku LIKE "SOAP-%" OR sku LIKE "FABRIC-%" OR sku LIKE "SPICE-%" OR sku LIKE "CRAFT-%" OR sku LIKE "JEWELRY-%")',
      );

      logger.info('Clearing product descriptions...');
      await transactionalEntityManager.query(
        'DELETE FROM product_descriptions WHERE product_id IN (SELECT id FROM products WHERE sku LIKE "DAM-%" OR sku LIKE "SOAP-%" OR sku LIKE "FABRIC-%" OR sku LIKE "SPICE-%" OR sku LIKE "CRAFT-%" OR sku LIKE "JEWELRY-%")',
      );

      logger.info('Clearing product pricing...');
      await transactionalEntityManager.query(
        'DELETE FROM product_pricing WHERE product_id IN (SELECT id FROM products WHERE sku LIKE "DAM-%" OR sku LIKE "SOAP-%" OR sku LIKE "FABRIC-%" OR sku LIKE "SPICE-%" OR sku LIKE "CRAFT-%" OR sku LIKE "JEWELRY-%")',
      );

      logger.info('Clearing products...');
      await transactionalEntityManager.query(
        'DELETE FROM products WHERE sku LIKE "DAM-%" OR sku LIKE "SOAP-%" OR sku LIKE "FABRIC-%" OR sku LIKE "SPICE-%" OR sku LIKE "CRAFT-%" OR sku LIKE "JEWELRY-%"',
      );

      logger.success('Existing seed data cleared');

      // ========================================================================
      // Step 2: Seed Categories
      // ========================================================================
      logger.section('Step 2: Seed Categories');
      const categories = getCategorySeedData();

      for (const category of categories) {
        // Check if category exists
        const existingCategory = await transactionalEntityManager.query(
          'SELECT id FROM categories WHERE id = ?',
          [category.id],
        );

        if (existingCategory.length === 0) {
          // Insert new category
          await transactionalEntityManager.query(
            `INSERT INTO categories (id, name_en, name_ar, slug, approval_status, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              category.id,
              category.nameEn,
              category.nameAr,
              category.slug,
              category.approvalStatus,
              category.isActive,
            ],
          );
          logger.success(`Created category: ${category.nameEn}`);
        } else {
          logger.info(`Category already exists: ${category.nameEn}`);
        }
      }

      // ========================================================================
      // Step 3: Seed Products
      // ========================================================================
      logger.section('Step 3: Seed Products');
      const products = getSeedProducts();
      let productCount = 0;
      let variantCount = 0;
      let stockCount = 0;

      for (const product of products) {
        // Insert product
        const productResult = await transactionalEntityManager.query(
          `INSERT INTO products (
            name_en, name_ar, slug, sku, category_id, manufacturer_id, currency,
            status, approval_status, is_active, is_published, is_featured,
            featured_priority, is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            product.nameEn,
            product.nameAr,
            product.slug,
            product.sku,
            product.categoryId,
            product.manufacturerId,
            product.currency,
            product.status,
            product.approvalStatus,
            product.isActive,
            product.isPublished,
            product.isFeatured,
            product.featuredPriority || 0,
            false,
          ],
        );

        const productId = productResult.insertId;
        productCount++;

        // Insert pricing
        await transactionalEntityManager.query(
          `INSERT INTO product_pricing (
            product_id, base_price, discount_price, currency, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            productId,
            product.pricing.basePrice,
            product.pricing.discountPrice || null,
            product.currency,
            product.pricing.isActive,
          ],
        );

        // Insert images
        for (const image of product.images) {
          await transactionalEntityManager.query(
            `INSERT INTO product_images (
              product_id, image_url, alt_text, sort_order, created_at, updated_at
            ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [productId, image.imageUrl, image.altText, image.sortOrder],
          );
        }

        // Insert descriptions
        for (const description of product.descriptions) {
          await transactionalEntityManager.query(
            `INSERT INTO product_descriptions (
              product_id, language, description, created_at, updated_at
            ) VALUES (?, ?, ?, NOW(), NOW())`,
            [productId, description.language, description.description],
          );
        }

        // Insert variants and their stocks
        for (const variant of product.variants) {
          const variantResult = await transactionalEntityManager.query(
            `INSERT INTO product_variants (
              product_id, sku, variant_data, price, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              productId,
              variant.sku,
              JSON.stringify(variant.variantData),
              variant.price,
              true,
            ],
          );

          const variantId = variantResult.insertId;
          variantCount++;

          // Insert stocks for this variant
          for (const stock of variant.stocks) {
            await transactionalEntityManager.query(
              `INSERT INTO product_stocks (
                variant_id, warehouse_id, quantity, updated_at
              ) VALUES (?, ?, ?, NOW())`,
              [variantId, stock.warehouseId, stock.quantity],
            );
            stockCount++;
          }
        }

        // Log progress every 10 products
        if (productCount % 10 === 0) {
          logger.info(`Seeded ${productCount}/${products.length} products...`);
        }
      }

      logger.success(`All products seeded successfully!`);

      // ========================================================================
      // Summary Statistics
      // ========================================================================
      logger.section('Seeding Summary');
      logger.info(`Categories created/verified: ${categories.length}`);
      logger.success(`Products inserted: ${productCount}`);
      logger.success(`Variants created: ${variantCount}`);
      logger.success(`Stock entries created: ${stockCount}`);
      logger.info(
        `Average variants per product: ${(variantCount / productCount).toFixed(1)}`,
      );
      logger.info(
        `Average stock entries per variant: ${(stockCount / variantCount).toFixed(1)}`,
      );
    });

    logger.section('Seeding Complete');
    logger.success(
      'Database seeded successfully! You can now browse products via the API.',
    );
    logger.info(
      'Example: GET http://localhost:3000/api/products?page=1&limit=20',
    );
  } catch (error) {
    logger.error('Seeding failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      logger.info('Database connection closed');
    }
  }
}

/**
 * Script entry point
 * Handles process-level errors and cleanup
 */
if (require.main === module) {
  seed()
    .then(() => {
      logger.success('Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error during seeding:');
      console.error(error);
      process.exit(1);
    });
}

export { seed };
