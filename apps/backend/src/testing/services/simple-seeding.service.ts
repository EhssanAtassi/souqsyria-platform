/**
 * @file simple-seeding.service.ts
 * @description Simple Working Database Seeding Service
 *
 * This service provides basic seeding functionality that actually works
 * without complex entity relationships and field assumptions.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Core entities - using only what we know works
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';

export interface SimpleSeedingOptions {
  createRoles?: boolean;
  createUsers?: boolean;
  createCategories?: boolean;
  createBrands?: boolean;
  userCount?: number;
  categoryCount?: number;
  brandCount?: number;
}

@Injectable()
export class SimpleSeedingService {
  private readonly logger = new Logger(SimpleSeedingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  /**
   * Simple seeding that actually works
   */
  async seedBasicData(options: SimpleSeedingOptions = {}): Promise<void> {
    this.logger.log('🌱 Starting simple database seeding...');
    const startTime = Date.now();

    try {
      // Seed roles first
      if (options.createRoles !== false) {
        await this.seedRoles();
      }

      // Seed users
      if (options.createUsers !== false) {
        await this.seedUsers(options.userCount || 10);
      }

      // Seed categories
      if (options.createCategories !== false) {
        await this.seedCategories(options.categoryCount || 5);
      }

      // Seed brands
      if (options.createBrands !== false) {
        await this.seedBrands(options.brandCount || 5);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Simple seeding completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('❌ Simple seeding failed:', error.message);
      throw error;
    }
  }

  /**
   * Seed basic roles
   */
  private async seedRoles(): Promise<void> {
    this.logger.log('👥 Seeding roles...');

    const roles = [
      { name: 'admin', description: 'System administrator' },
      { name: 'vendor', description: 'Vendor user' },
      { name: 'customer', description: 'Regular customer' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.debug(`Created role: ${roleData.name}`);
      }
    }
  }

  /**
   * Seed basic users
   */
  private async seedUsers(count: number): Promise<void> {
    this.logger.log(`👤 Seeding ${count} users...`);

    // Get customer role
    const customerRole = await this.roleRepository.findOne({
      where: { name: 'customer' },
    });

    for (let i = 0; i < count; i++) {
      const userData = {
        email: `user${i + 1}@test.com`,
        fullName: `Test User ${i + 1}`,
        firebaseUid: `test-firebase-uid-${i + 1}`,
        phone: `+963-99-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        isVerified: true,
        role: customerRole,
      };

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = this.userRepository.create(userData);
        await this.userRepository.save(user);
        this.logger.debug(`Created user: ${userData.email}`);
      }
    }
  }

  /**
   * Seed basic categories
   */
  private async seedCategories(count: number): Promise<void> {
    this.logger.log(`📂 Seeding ${count} categories...`);

    const categoryNames = [
      { en: 'Electronics', ar: 'إلكترونيات' },
      { en: 'Fashion', ar: 'أزياء' },
      { en: 'Home & Garden', ar: 'المنزل والحديقة' },
      { en: 'Books', ar: 'كتب' },
      { en: 'Sports', ar: 'رياضة' },
      { en: 'Automotive', ar: 'السيارات' },
      { en: 'Health & Beauty', ar: 'الصحة والجمال' },
      { en: 'Toys & Games', ar: 'ألعاب وألعاب' },
    ];

    for (let i = 0; i < count && i < categoryNames.length; i++) {
      const categoryData = {
        nameEn: categoryNames[i].en,
        nameAr: categoryNames[i].ar,
        slug: categoryNames[i].en
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
        descriptionEn: `${categoryNames[i].en} products and accessories`,
        descriptionAr: `منتجات وإكسسوارات ${categoryNames[i].ar}`,
        isActive: true,
        approvalStatus: 'approved' as const,
      };

      // Check if category already exists
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: categoryData.slug },
      });

      if (!existingCategory) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
        this.logger.debug(`Created category: ${categoryData.nameEn}`);
      }
    }
  }

  /**
   * Seed basic brands
   */
  private async seedBrands(count: number): Promise<void> {
    this.logger.log(`🏷️ Seeding ${count} brands...`);

    const brandNames = [
      { name: 'Samsung', nameAr: 'سامسونغ' },
      { name: 'Apple', nameAr: 'آبل' },
      { name: 'Nike', nameAr: 'نايكي' },
      { name: 'Adidas', nameAr: 'أديداس' },
      { name: 'Sony', nameAr: 'سوني' },
      { name: 'LG', nameAr: 'إل جي' },
      { name: 'Dell', nameAr: 'ديل' },
      { name: 'HP', nameAr: 'إتش بي' },
    ];

    for (let i = 0; i < count && i < brandNames.length; i++) {
      const brandData = {
        name: brandNames[i].name,
        nameAr: brandNames[i].nameAr,
        slug: brandNames[i].name.toLowerCase(),
        descriptionEn: `${brandNames[i].name} - Premium brand products`,
        descriptionAr: `${brandNames[i].nameAr} - منتجات علامة تجارية فاخرة`,
        isActive: true,
        approvalStatus: 'approved' as const,
        isVerified: true,
      };

      // Check if brand already exists
      const existingBrand = await this.brandRepository.findOne({
        where: { slug: brandData.slug },
      });

      if (!existingBrand) {
        const brand = this.brandRepository.create(brandData);
        await this.brandRepository.save(brand);
        this.logger.debug(`Created brand: ${brandData.name}`);
      }
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    this.logger.log('🧹 Cleaning up test data...');

    try {
      // Delete test users
      await this.userRepository.delete({
        email: { $like: '%@test.com' } as any,
      });

      // Delete test categories
      await this.categoryRepository.delete({
        slug: { $like: '%test%' } as any,
      });

      this.logger.log('✅ Test data cleanup completed');
    } catch (error) {
      this.logger.error('❌ Test data cleanup failed:', error.stack);
      throw error;
    }
  }

  /**
   * Get seeding statistics
   */
  async getStats(): Promise<any> {
    const stats = {
      users: await this.userRepository.count(),
      roles: await this.roleRepository.count(),
      categories: await this.categoryRepository.count(),
      brands: await this.brandRepository.count(),
    };

    this.logger.log(`📊 Database stats: ${JSON.stringify(stats)}`);
    return stats;
  }
}
