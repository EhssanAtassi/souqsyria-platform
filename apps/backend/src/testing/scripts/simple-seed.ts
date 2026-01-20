#!/usr/bin/env npx ts-node

/**
 * @file simple-seed.ts
 * @description Simple Working Database Seeding Script
 *
 * This script provides basic seeding functionality that actually works.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SimpleSeedingService } from '../services/simple-seeding.service';

/**
 * Main seeding execution function
 */
async function runSimpleSeeding(): Promise<void> {
  const seedType = process.argv[2] || 'basic';

  console.log(`🌱 Starting SouqSyria simple seeding...`);
  console.log(`📋 Seed type: ${seedType}`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const simpleSeedingService = app.get(SimpleSeedingService);

    const startTime = Date.now();

    switch (seedType) {
      case 'basic':
        await simpleSeedingService.seedBasicData({
          createRoles: true,
          createUsers: true,
          createCategories: true,
          createBrands: true,
          userCount: 10,
          categoryCount: 5,
          brandCount: 5,
        });
        break;

      case 'roles':
        await simpleSeedingService.seedBasicData({
          createRoles: true,
          createUsers: false,
          createCategories: false,
          createBrands: false,
        });
        break;

      case 'users':
        await simpleSeedingService.seedBasicData({
          createRoles: true,
          createUsers: true,
          createCategories: false,
          createBrands: false,
          userCount: 20,
        });
        break;

      case 'categories':
        await simpleSeedingService.seedBasicData({
          createRoles: false,
          createUsers: false,
          createCategories: true,
          createBrands: false,
          categoryCount: 8,
        });
        break;

      case 'brands':
        await simpleSeedingService.seedBasicData({
          createRoles: false,
          createUsers: false,
          createCategories: false,
          createBrands: true,
          brandCount: 8,
        });
        break;

      case 'syrian':
        console.log(
          '⚠️ Syrian seeding not available yet - entities need to be created',
        );
        console.log('Creating basic data instead...');
        await simpleSeedingService.seedBasicData({
          createRoles: true,
          createUsers: true,
          createCategories: true,
          createBrands: true,
        });
        break;

      case 'clean':
        console.log('🧹 Warning: Cleaning up test data...');
        await simpleSeedingService.cleanupTestData();
        break;

      case 'stats':
        const stats = await simpleSeedingService.getStats();
        console.log('📊 Current database statistics:');
        console.table(stats);
        break;

      default:
        console.log(`❌ Unknown seed type: ${seedType}`);
        console.log(
          'Available types: basic, roles, users, categories, brands, syrian, clean, stats',
        );
        process.exit(1);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Seeding completed successfully in ${duration}ms`);
  } catch (error) {
    console.error(`❌ Seeding failed:`, error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await app.close();
  }
}

/**
 * Display usage information
 */
function displayUsage(): void {
  console.log(`
🌱 SouqSyria Simple Database Seeding Tool

Usage:
  npm run seed:simple [type]

Available seed types:
  basic      - Complete basic seeding (roles, users, categories, brands)
  roles      - Seed roles only (admin, vendor, customer)
  users      - Seed users only (with roles)
  categories - Seed categories only (Electronics, Fashion, etc.)
  brands     - Seed brands only (Samsung, Apple, Nike, etc.)
  syrian     - Seed Syrian-specific data (when entities are ready)
  clean      - Clean up test data
  stats      - Show database statistics

Examples:
  npm run seed:simple
  npm run seed:simple basic
  npm run seed:simple users
  npm run seed:simple clean
  npm run seed:simple stats
  `);
}

// Handle help requests
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayUsage();
  process.exit(0);
}

// Run the seeding process
runSimpleSeeding().catch((error) => {
  console.error('❌ Fatal error in seeding process:', error);
  process.exit(1);
});
