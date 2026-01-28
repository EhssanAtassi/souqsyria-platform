#!/usr/bin/env node
/**
 * @file seed-owner-admin-roles.ts
 * @description Standalone script to seed Owner and Full Admin roles
 * Creates the critical system administrator roles with all permissions
 *
 * Usage:
 *   npm run seed:admin-roles
 *   or
 *   ts-node src/scripts/seed-owner-admin-roles.ts
 *
 * @swagger
 * @tags Seeding Scripts
 */

// ✅ Load environment variables BEFORE importing NestJS modules
import { config } from 'dotenv';
config(); // Load .env file into process.env

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AccessControlSeederService } from '../access-control/seeds/access-control.seeder.service';
import { Logger } from '@nestjs/common';

/**
 * Main seeding function
 * Seeds the Owner and Full Admin (super_admin) roles with all necessary permissions
 */
async function seedOwnerAndAdminRoles() {
  const logger = new Logger('SeedOwnerAdminRoles');

  try {
    logger.log('🚀 Starting Owner and Full Admin roles seeding...');

    // Bootstrap NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get the seeder service
    const seederService = app.get(AccessControlSeederService);

    // Run the seeding process
    logger.log('📦 Seeding permissions, roles, and role-permissions...');
    const stats = await seederService.seedAccessControlSystem({
      seedPermissions: true,
      seedRoles: true,
      seedRolePermissions: true,
      overwriteExisting: true, // Update existing roles with new permissions
      logLevel: 'info',
    });

    // Display results
    logger.log('');
    logger.log('═══════════════════════════════════════════════════');
    logger.log('✅ Owner and Full Admin Roles Seeded Successfully!');
    logger.log('═══════════════════════════════════════════════════');
    logger.log('');
    logger.log('📊 Seeding Statistics:');
    logger.log(`   Permissions Created: ${stats.permissionsCreated}`);
    logger.log(`   Permissions Updated: ${stats.permissionsUpdated}`);
    logger.log(`   Roles Created: ${stats.rolesCreated}`);
    logger.log(`   Roles Updated: ${stats.rolesUpdated}`);
    logger.log(
      `   Role-Permissions Created: ${stats.rolePermissionsCreated}`,
    );
    logger.log(`   Processing Time: ${stats.totalProcessingTime}ms`);
    logger.log('');

    // Display role details
    logger.log('🎭 Created/Updated Roles:');
    logger.log('');
    logger.log('   1. OWNER');
    logger.log('      - Priority: 100 (Highest)');
    logger.log('      - System Role: Yes (Cannot be deleted)');
    logger.log('      - Permissions: ALL (130+ permissions)');
    logger.log('      - Description: Ultimate system authority');
    logger.log('');
    logger.log('   2. SUPER_ADMIN (Full Admin)');
    logger.log('      - Priority: 90 (Very High)');
    logger.log('      - System Role: Yes (Cannot be deleted)');
    logger.log('      - Permissions: Comprehensive (125+ permissions)');
    logger.log('      - Description: Full administrative access');
    logger.log('      - Excludes: delete_system_data, manage_system_roles');
    logger.log('');

    // Get validation results
    logger.log('🔍 Validating access control integrity...');
    const validation =
      await seederService.validateAccessControlIntegrity();

    if (validation.valid) {
      logger.log('✅ Access control system integrity validated');
    } else {
      logger.warn(
        `⚠️ Found ${validation.issues.length} integrity issues:`,
      );
      validation.issues.forEach((issue) => logger.warn(`   - ${issue}`));
    }

    logger.log('');
    logger.log('═══════════════════════════════════════════════════');
    logger.log('🎉 Seeding Complete!');
    logger.log('═══════════════════════════════════════════════════');
    logger.log('');
    logger.log('Next Steps:');
    logger.log('1. Assign "owner" role to your account');
    logger.log('2. Access the admin panel at /admin');
    logger.log('3. Manage users, roles, and permissions');
    logger.log('');

    // Close application
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error.stack);
    process.exit(1);
  }
}

// Run the seeder
seedOwnerAndAdminRoles();
