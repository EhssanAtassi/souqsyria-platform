#!/usr/bin/env ts-node
/**
 * @file seed-test-users.ts
 * @description Seeds test users with working passwords for development/testing
 *
 * This script creates or updates test users with known passwords so you can
 * login and test different permission levels.
 *
 * Usage:
 *   npx ts-node src/scripts/seed-test-users.ts
 *   # or
 *   npm run seed:test-users
 *
 * @author SouqSyria Development Team
 * @since 2026-01-28
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

/**
 * Test user configuration with known passwords
 */
interface TestUserConfig {
  email: string;
  password: string;
  fullName: string;
  roleName: string;
  assignedRoleName?: string;
  userType: 'admin' | 'staff' | 'vendor' | 'customer' | 'system';
  isVerified: boolean;
  isBanned: boolean;
  isSuspended: boolean;
  description: string;
}

/**
 * All test users with their passwords
 *
 * Password Convention:
 * - Admins: Admin123!
 * - Staff: Staff123!
 * - Vendors: Vendor123!
 * - Customers: Customer123!
 * - Special: Special123!
 */
const TEST_USERS: TestUserConfig[] = [
  // ==========================================
  // ADMIN USERS
  // ==========================================
  {
    email: 'owner@souqsyria.com',
    password: 'Owner123!',
    fullName: 'System Owner - مالك النظام',
    roleName: 'owner',
    userType: 'admin',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'System owner with FULL access to everything'
  },
  {
    email: 'admin@souqsyria.com',
    password: 'Admin123!',
    fullName: 'محمد العلي - Mohammed Al-Ali',
    roleName: 'super_admin',
    userType: 'admin',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Super admin with comprehensive permissions'
  },
  {
    email: 'admin2@souqsyria.com',
    password: 'Admin123!',
    fullName: 'سارة الأحمد - Sara Al-Ahmad',
    roleName: 'admin',
    userType: 'admin',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Regular admin with standard admin permissions'
  },

  // ==========================================
  // STAFF USERS
  // ==========================================
  {
    email: 'marketing@souqsyria.com',
    password: 'Staff123!',
    fullName: 'فاطمة الشامي - Fatima Al-Shami',
    roleName: 'staff',
    assignedRoleName: 'marketing_manager',
    userType: 'staff',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Marketing manager - campaigns, promotions, analytics'
  },
  {
    email: 'support@souqsyria.com',
    password: 'Staff123!',
    fullName: 'أحمد حمود - Ahmad Hammoud',
    roleName: 'staff',
    assignedRoleName: 'staff',
    userType: 'staff',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Customer support - orders, refunds, disputes'
  },
  {
    email: 'moderator@souqsyria.com',
    password: 'Staff123!',
    fullName: 'ليلى الحسن - Layla Al-Hassan',
    roleName: 'staff',
    assignedRoleName: 'moderator',
    userType: 'staff',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Content moderator - reviews, products, listings'
  },
  {
    email: 'analyst@souqsyria.com',
    password: 'Staff123!',
    fullName: 'عمر الخالد - Omar Al-Khaled',
    roleName: 'staff',
    assignedRoleName: 'analyst',
    userType: 'staff',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Data analyst - read-only analytics access'
  },
  {
    email: 'inventory@souqsyria.com',
    password: 'Staff123!',
    fullName: 'حسن المصري - Hassan Al-Masri',
    roleName: 'staff',
    assignedRoleName: 'inventory_manager',
    userType: 'staff',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Inventory manager - stock, warehouses, shipping'
  },
  {
    email: 'finance@souqsyria.com',
    password: 'Staff123!',
    fullName: 'نادية السوري - Nadia Al-Souri',
    roleName: 'staff',
    assignedRoleName: 'financial_manager',
    userType: 'staff',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Financial manager - payments, refunds, commissions'
  },

  // ==========================================
  // VENDOR USERS
  // ==========================================
  {
    email: 'vendor.electronics@souqsyria.com',
    password: 'Vendor123!',
    fullName: 'سامر التقني - Samer Al-Taqani',
    roleName: 'vendor',
    userType: 'vendor',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Electronics vendor - full vendor permissions'
  },
  {
    email: 'vendor.fashion@souqsyria.com',
    password: 'Vendor123!',
    fullName: 'ليلى الأزياء - Layla Al-Azyaa',
    roleName: 'vendor',
    userType: 'vendor',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Fashion vendor - traditional Syrian clothing'
  },
  {
    email: 'vendor.food@souqsyria.com',
    password: 'Vendor123!',
    fullName: 'خالد الطعام - Khaled Al-Taam',
    roleName: 'vendor',
    userType: 'vendor',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Food vendor - Syrian specialties'
  },
  {
    email: 'seller@souqsyria.com',
    password: 'Vendor123!',
    fullName: 'رامي البائع - Rami Al-Bayea',
    roleName: 'seller',
    userType: 'vendor',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Individual seller - limited vendor permissions'
  },

  // ==========================================
  // CUSTOMER USERS
  // ==========================================
  {
    email: 'customer@souqsyria.com',
    password: 'Customer123!',
    fullName: 'نور الهدى - Nour Al-Huda',
    roleName: 'buyer',
    userType: 'customer',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Regular customer - basic shopping permissions'
  },
  {
    email: 'premium@souqsyria.com',
    password: 'Customer123!',
    fullName: 'عمار السوري - Ammar Al-Souri',
    roleName: 'premium_buyer',
    userType: 'customer',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Premium customer - enhanced features'
  },
  {
    email: 'customer.damascus@example.com',
    password: 'Customer123!',
    fullName: 'دمشقي العريق - Dimashqi Al-Ariq',
    roleName: 'buyer',
    userType: 'customer',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Damascus-based customer'
  },
  {
    email: 'customer.diaspora@example.com',
    password: 'Customer123!',
    fullName: 'سارة الألمانية - Sara Al-Almaniya',
    roleName: 'buyer',
    userType: 'customer',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    description: 'Diaspora customer in Germany'
  },

  // ==========================================
  // SPECIAL TEST USERS (Edge Cases)
  // ==========================================
  {
    email: 'suspended@souqsyria.com',
    password: 'Special123!',
    fullName: 'المستخدم المعلق - Suspended User',
    roleName: 'buyer',
    userType: 'customer',
    isVerified: true,
    isBanned: false,
    isSuspended: true,
    description: 'Suspended user - for testing suspension flow'
  },
  {
    email: 'banned@souqsyria.com',
    password: 'Special123!',
    fullName: 'المستخدم المحظور - Banned User',
    roleName: 'buyer',
    userType: 'customer',
    isVerified: true,
    isBanned: true,
    isSuspended: false,
    description: 'Banned user - for testing ban flow'
  },
  {
    email: 'unverified@souqsyria.com',
    password: 'Special123!',
    fullName: 'غير مؤكد - Unverified User',
    roleName: 'buyer',
    userType: 'customer',
    isVerified: false,
    isBanned: false,
    isSuspended: false,
    description: 'Unverified user - for testing email verification'
  },
];

/**
 * Main seeding function
 */
async function seedTestUsers(): Promise<void> {
  console.log('🚀 Starting test user seeding...\n');

  let app;
  try {
    // Bootstrap NestJS application
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });

    const dataSource = app.get(DataSource);

    // Get repositories
    const userRepository = dataSource.getRepository('User');
    const roleRepository = dataSource.getRepository('Role');

    // Track results
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    console.log('📊 Processing', TEST_USERS.length, 'test users...\n');

    for (const userConfig of TEST_USERS) {
      try {
        // Find role by name
        const role = await roleRepository.findOne({
          where: { name: userConfig.roleName },
        });

        if (!role) {
          results.errors.push(`Role not found: ${userConfig.roleName} for ${userConfig.email}`);
          console.log(`❌ ${userConfig.email} - Role not found: ${userConfig.roleName}`);
          continue;
        }

        // Find assigned role if specified
        let assignedRole = null;
        if (userConfig.assignedRoleName) {
          assignedRole = await roleRepository.findOne({
            where: { name: userConfig.assignedRoleName },
          });
          if (!assignedRole) {
            console.log(`⚠️  Assigned role not found: ${userConfig.assignedRoleName}, continuing without it`);
          }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userConfig.password, 10);

        // Check if user exists
        let user = await userRepository.findOne({
          where: { email: userConfig.email },
        });

        if (user) {
          // Update existing user
          await userRepository.update(user.id, {
            passwordHash,
            fullName: userConfig.fullName,
            role: role,
            assignedRole: assignedRole,
            isVerified: userConfig.isVerified,
            isBanned: userConfig.isBanned,
            isSuspended: userConfig.isSuspended,
            passwordChangedAt: new Date(),
          });
          results.updated++;
          console.log(`🔄 Updated: ${userConfig.email} (${userConfig.roleName})`);
        } else {
          // Create new user
          const newUser = userRepository.create({
            email: userConfig.email,
            passwordHash,
            fullName: userConfig.fullName,
            firebaseUid: `test-${userConfig.email.replace(/[@.]/g, '-')}`,
            role: role,
            assignedRole: assignedRole,
            isVerified: userConfig.isVerified,
            isBanned: userConfig.isBanned,
            isSuspended: userConfig.isSuspended,
            failedLoginAttempts: 0,
            passwordChangedAt: new Date(),
            lastActivityAt: new Date(),
          });
          await userRepository.save(newUser);
          results.created++;
          console.log(`✅ Created: ${userConfig.email} (${userConfig.roleName})`);
        }
      } catch (error) {
        results.errors.push(`${userConfig.email}: ${error.message}`);
        console.log(`❌ Error for ${userConfig.email}: ${error.message}`);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${results.created}`);
    console.log(`🔄 Updated: ${results.updated}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Errors:  ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️  Error Details:');
      results.errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔑 TEST CREDENTIALS');
    console.log('='.repeat(60));
    console.log('See: apps/backend/AUTH_TEST_USERS.md for full list');
    console.log('\nQuick Reference:');
    console.log('  Admin:    admin@souqsyria.com / Admin123!');
    console.log('  Staff:    support@souqsyria.com / Staff123!');
    console.log('  Vendor:   vendor.electronics@souqsyria.com / Vendor123!');
    console.log('  Customer: customer@souqsyria.com / Customer123!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Run the seeder
seedTestUsers()
  .then(() => {
    console.log('✅ Test user seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test user seeding failed:', error);
    process.exit(1);
  });
