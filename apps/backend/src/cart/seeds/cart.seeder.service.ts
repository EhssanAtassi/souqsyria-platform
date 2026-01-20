/**
 * @file cart.seeder.service.ts
 * @description Cart Seeding Service for SouqSyria E-commerce Platform
 *
 * Generates realistic cart test data for:
 * - User shopping carts with Syrian market items
 * - Cart items with Syrian products and pricing
 * - Multi-currency cart scenarios
 * - Abandoned cart scenarios for analytics
 * - Campaign and discount tracking
 * - Stock validation scenarios
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../products/entities/product.entity';

@Injectable()
export class CartSeederService {
  private readonly logger = new Logger(CartSeederService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Seeds comprehensive cart test data for Syrian e-commerce platform
   */
  async seedCarts(): Promise<{
    carts: Cart[];
    cartItems: CartItem[];
    statistics: {
      totalCarts: number;
      activeCarts: number;
      abandonedCarts: number;
      totalItems: number;
      averageCartValue: number;
    };
  }> {
    this.logger.log('🛒 Starting cart seeding process...');
    const startTime = Date.now();

    try {
      // Clear existing cart data
      await this.clearExistingData();

      // Create test users if they don't exist
      const users = await this.createTestUsers();

      // Create test products and variants if they don't exist
      const variants = await this.createTestProducts();

      // Generate diverse cart scenarios
      const cartScenarios = await this.generateCartScenarios(users, variants);

      // Save all carts and items
      const savedCarts = await this.cartRepository.save(cartScenarios.carts);
      const savedItems = await this.cartItemRepository.save(
        cartScenarios.items,
      );

      // Update cart totals
      await this.updateCartTotals(savedCarts);

      // Calculate statistics
      const statistics = await this.calculateCartStatistics();

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ Cart seeding completed in ${processingTime}ms`);
      this.logger.log(
        `📊 Generated ${savedCarts.length} carts with ${savedItems.length} items`,
      );

      return {
        carts: savedCarts,
        cartItems: savedItems,
        statistics,
      };
    } catch (error) {
      this.logger.error(
        `❌ Cart seeding failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Creates test users for cart scenarios
   */
  private async createTestUsers(): Promise<User[]> {
    const existingUsers = await this.userRepository.find();
    if (existingUsers.length >= 10) {
      return existingUsers.slice(0, 10);
    }

    const syrianUsers = [
      {
        email: 'ahmad.syrian@souqsyria.com',
        firstName: 'أحمد',
        lastName: 'السوري',
        phone: '+963987654321',
        isActive: true,
      },
      {
        email: 'fatima.damascus@souqsyria.com',
        firstName: 'فاطمة',
        lastName: 'الدمشقية',
        phone: '+963988123456',
        isActive: true,
      },
      {
        email: 'omar.aleppo@souqsyria.com',
        firstName: 'عمر',
        lastName: 'الحلبي',
        phone: '+963989987654',
        isActive: true,
      },
      {
        email: 'layla.homs@souqsyria.com',
        firstName: 'ليلى',
        lastName: 'الحمصية',
        phone: '+963985432109',
        isActive: true,
      },
      {
        email: 'khalil.lattakia@souqsyria.com',
        firstName: 'خليل',
        lastName: 'اللاذقاني',
        phone: '+963984567890',
        isActive: true,
      },
      {
        email: 'nour.diaspora@souqsyria.com',
        firstName: 'نور',
        lastName: 'المغترب',
        phone: '+1234567890', // Diaspora customer
        isActive: true,
      },
      {
        email: 'sara.businessowner@souqsyria.com',
        firstName: 'سارة',
        lastName: 'التاجرة',
        phone: '+963986789012',
        isActive: true,
      },
      {
        email: 'hussein.student@souqsyria.com',
        firstName: 'حسين',
        lastName: 'الطالب',
        phone: '+963983456789',
        isActive: true,
      },
      {
        email: 'rania.engineer@souqsyria.com',
        firstName: 'رانيا',
        lastName: 'المهندسة',
        phone: '+963982345678',
        isActive: true,
      },
      {
        email: 'marwan.inactive@souqsyria.com',
        firstName: 'مروان',
        lastName: 'غير_نشط',
        phone: '+963981234567',
        isActive: false, // Inactive user
      },
    ];

    const newUsers = this.userRepository.create(syrianUsers as any);
    return await this.userRepository.save(newUsers);
  }

  /**
   * Creates test products and variants for cart scenarios
   */
  private async createTestProducts(): Promise<ProductVariant[]> {
    const existingVariants = await this.variantRepository.find();
    if (existingVariants.length >= 15) {
      return existingVariants.slice(0, 15);
    }

    // Create test products first
    const syrianProducts = [
      {
        nameEn: 'Samsung Galaxy S24 Ultra',
        nameAr: 'سامسونج جالاكسي إس 24 ألترا',
        descriptionEn: 'Latest Samsung flagship smartphone',
        descriptionAr: 'أحدث هاتف ذكي رائد من سامسونج',
        price: 6500000, // 6,500,000 SYP
        isActive: true,
      },
      {
        nameEn: 'iPhone 15 Pro Max',
        nameAr: 'آيفون 15 برو ماكس',
        descriptionEn: 'Apple premium smartphone',
        descriptionAr: 'هاتف آبل المتميز',
        price: 8500000, // 8,500,000 SYP
        isActive: true,
      },
      {
        nameEn: 'Laptop Dell Inspiron',
        nameAr: 'لابتوب ديل إنسبايرون',
        descriptionEn: 'High-performance laptop',
        descriptionAr: 'لابتوب عالي الأداء',
        price: 4200000, // 4,200,000 SYP
        isActive: true,
      },
      {
        nameEn: 'Damascus Steel Watch',
        nameAr: 'ساعة فولاذ دمشقي',
        descriptionEn: 'Traditional Syrian craftsmanship',
        descriptionAr: 'حرفية سورية تقليدية',
        price: 750000, // 750,000 SYP
        isActive: true,
      },
      {
        nameEn: 'Aleppo Soap Set',
        nameAr: 'مجموعة صابون حلبي',
        descriptionEn: 'Authentic Aleppo soap collection',
        descriptionAr: 'مجموعة صابون حلبي أصلي',
        price: 125000, // 125,000 SYP
        isActive: true,
      },
      {
        nameEn: 'Expired Flash Sale Item',
        nameAr: 'منتج عرض منتهي الصلاحية',
        descriptionEn: 'Item from expired flash sale',
        descriptionAr: 'منتج من عرض منتهي الصلاحية',
        price: 500000, // 500,000 SYP
        isActive: false, // Inactive product
      },
    ];

    const savedProducts = await this.productRepository.save(
      this.productRepository.create(syrianProducts as any),
    );

    // Create variants for products
    const variants = [];
    for (let i = 0; i < savedProducts.length; i++) {
      const product = savedProducts[i];

      // Create 2-3 variants per product
      const variantCount = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < variantCount; j++) {
        variants.push({
          product,
          sku: `${product.nameEn.replace(/\s+/g, '').toUpperCase()}-VAR${j + 1}`,
          price: (product.pricing?.basePrice || 500000) + j * 100000, // Slight price variations
          stockQuantity: Math.floor(Math.random() * 100) + 10,
          isActive: product.isActive,
          attributes: this.generateVariantAttributes(product.nameEn, j),
        });
      }
    }

    const savedVariants = await this.variantRepository.save(
      this.variantRepository.create(variants as any),
    );

    return savedVariants;
  }

  /**
   * Generates variant attributes based on product type
   */
  private generateVariantAttributes(
    productName: string,
    index: number,
  ): Record<string, any> {
    if (productName.includes('Samsung') || productName.includes('iPhone')) {
      const colors = ['Black', 'Blue', 'Silver', 'Gold'];
      const storage = ['128GB', '256GB', '512GB', '1TB'];
      return {
        color: colors[index % colors.length],
        storage: storage[index % storage.length],
        ram: '12GB',
      };
    }

    if (productName.includes('Laptop')) {
      const processors = ['Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7'];
      const ram = ['8GB', '16GB', '32GB'];
      return {
        processor: processors[index % processors.length],
        ram: ram[index % ram.length],
        storage: '512GB SSD',
      };
    }

    if (productName.includes('Watch')) {
      const materials = ['Steel', 'Gold', 'Silver', 'Black'];
      const sizes = ['38mm', '42mm', '44mm'];
      return {
        material: materials[index % materials.length],
        size: sizes[index % sizes.length],
      };
    }

    if (productName.includes('Soap')) {
      const scents = ['Lavender', 'Rose', 'Natural', 'Mint'];
      const sizes = ['100g', '200g', '500g'];
      return {
        scent: scents[index % scents.length],
        size: sizes[index % sizes.length],
      };
    }

    return {
      variant: `Option ${index + 1}`,
      color: 'Default',
    };
  }

  /**
   * Generates diverse cart scenarios for testing
   */
  private async generateCartScenarios(
    users: User[],
    variants: ProductVariant[],
  ): Promise<{ carts: Cart[]; items: CartItem[] }> {
    const carts: Cart[] = [];
    const items: CartItem[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Determine cart scenario
      const scenario = this.getCartScenario(i);

      // Create cart
      const cart = this.cartRepository.create({
        user,
        userId: user.id,
        currency: scenario.currency,
        status: scenario.status,
        totalItems: 0,
        totalAmount: 0,
        created_at: scenario.createdAt,
        updated_at: scenario.updatedAt,
        lastActivityAt: scenario.lastActivityAt,
        version: 1,
      });

      carts.push(cart);

      // Add items to cart based on scenario
      if (scenario.itemCount > 0) {
        const selectedVariants = this.selectRandomVariants(
          variants,
          scenario.itemCount,
        );

        for (let j = 0; j < selectedVariants.length; j++) {
          const variant = selectedVariants[j];
          const item = this.cartItemRepository.create({
            cart,
            variant,
            quantity: Math.floor(Math.random() * 3) + 1,
            price_at_add: variant.price,
            price_discounted: scenario.hasDiscounts
              ? this.calculateDiscount(variant.price)
              : null,
            valid: scenario.validItems,
            expires_at: scenario.hasExpiration
              ? this.getExpirationDate()
              : null,
            added_from_campaign: scenario.campaign,
            selected_attributes: variant.variantData || {},
          });

          items.push(item);
        }
      }
    }

    return { carts, items };
  }

  /**
   * Gets cart scenario configuration based on index
   */
  private getCartScenario(index: number): {
    currency: string;
    status: 'active' | 'abandoned' | 'converting' | 'expired';
    itemCount: number;
    hasDiscounts: boolean;
    validItems: boolean;
    hasExpiration: boolean;
    campaign?: string;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
  } {
    const now = new Date();
    const scenarios: Array<{
      currency: string;
      status: 'active' | 'abandoned' | 'converting' | 'expired';
      itemCount: number;
      hasDiscounts: boolean;
      validItems: boolean;
      hasExpiration: boolean;
      campaign?: string;
      createdAt: Date;
      updatedAt: Date;
      lastActivityAt: Date;
    }> = [
      {
        // Active cart with Syrian items
        currency: 'SYP',
        status: 'active',
        itemCount: 3,
        hasDiscounts: false,
        validItems: true,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        lastActivityAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        // Cart with Ramadan campaign items
        currency: 'SYP',
        status: 'active',
        itemCount: 2,
        hasDiscounts: true,
        validItems: true,
        hasExpiration: true,
        campaign: 'ramadan_kareem_2025',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        lastActivityAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        // Large cart for bulk buyer
        currency: 'SYP',
        status: 'active',
        itemCount: 5,
        hasDiscounts: false,
        validItems: true,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        lastActivityAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        // Abandoned cart
        currency: 'SYP',
        status: 'abandoned',
        itemCount: 2,
        hasDiscounts: false,
        validItems: true,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        // Cart with invalid items (price changed)
        currency: 'SYP',
        status: 'active',
        itemCount: 2,
        hasDiscounts: false,
        validItems: false,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastActivityAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        // Diaspora customer USD cart
        currency: 'USD',
        status: 'active',
        itemCount: 1,
        hasDiscounts: false,
        validItems: true,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastActivityAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        // Summer sale campaign cart
        currency: 'SYP',
        status: 'active',
        itemCount: 4,
        hasDiscounts: true,
        validItems: true,
        hasExpiration: true,
        campaign: 'summer_sale_2025',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        lastActivityAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        // Student discount cart
        currency: 'SYP',
        status: 'active',
        itemCount: 1,
        hasDiscounts: true,
        validItems: true,
        hasExpiration: false,
        campaign: 'student_discount_2025',
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        lastActivityAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        // High-value cart
        currency: 'SYP',
        status: 'active',
        itemCount: 2,
        hasDiscounts: false,
        validItems: true,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastActivityAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        // Empty cart
        currency: 'SYP',
        status: 'active',
        itemCount: 0,
        hasDiscounts: false,
        validItems: true,
        hasExpiration: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        lastActivityAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ];

    return scenarios[index % scenarios.length];
  }

  /**
   * Selects random variants for cart items
   */
  private selectRandomVariants(
    variants: ProductVariant[],
    count: number,
  ): ProductVariant[] {
    const selected: ProductVariant[] = [];
    const available = [...variants.filter((v) => v.isActive)];

    for (let i = 0; i < Math.min(count, available.length); i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      selected.push(available.splice(randomIndex, 1)[0]);
    }

    return selected;
  }

  /**
   * Calculates discount price
   */
  private calculateDiscount(originalPrice: number): number {
    const discountPercent = Math.floor(Math.random() * 30) + 10; // 10-40% discount
    return Math.floor(originalPrice * (1 - discountPercent / 100));
  }

  /**
   * Gets future expiration date
   */
  private getExpirationDate(): Date {
    const now = new Date();
    const daysToAdd = Math.floor(Math.random() * 7) + 1; // 1-7 days from now
    return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  /**
   * Updates cart totals after items are created
   */
  private async updateCartTotals(carts: Cart[]): Promise<void> {
    for (const cart of carts) {
      const items = await this.cartItemRepository.find({
        where: { cart: { id: cart.id } },
        relations: ['variant'],
      });

      let totalItems = 0;
      let totalAmount = 0;

      for (const item of items) {
        if (item.valid) {
          totalItems += item.quantity;
          const itemPrice = item.price_discounted || item.price_at_add;
          totalAmount += itemPrice * item.quantity;
        }
      }

      await this.cartRepository.update(cart.id, {
        totalItems,
        totalAmount,
      });
    }
  }

  /**
   * Calculates cart statistics
   */
  private async calculateCartStatistics(): Promise<{
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    totalItems: number;
    averageCartValue: number;
  }> {
    const [totalCarts, activeCarts, abandonedCarts] = await Promise.all([
      this.cartRepository.count(),
      this.cartRepository.count({ where: { status: 'active' } }),
      this.cartRepository.count({ where: { status: 'abandoned' } }),
    ]);

    const totalItems = await this.cartItemRepository.count();

    const avgData = await this.cartRepository
      .createQueryBuilder('cart')
      .select('AVG(cart.totalAmount)', 'avgValue')
      .where('cart.status = :status', { status: 'active' })
      .getRawOne();

    return {
      totalCarts,
      activeCarts,
      abandonedCarts,
      totalItems,
      averageCartValue: parseFloat(avgData?.avgValue || '0'),
    };
  }

  /**
   * Clears existing cart test data
   */
  private async clearExistingData(): Promise<void> {
    this.logger.log('🧹 Clearing existing cart test data...');

    // Delete in correct order to respect foreign key constraints
    await this.cartItemRepository.delete({});
    await this.cartRepository.delete({});

    this.logger.log('✅ Existing cart data cleared');
  }

  /**
   * Seeds minimal cart data for quick testing
   */
  async seedMinimalCarts(): Promise<{ carts: Cart[]; cartItems: CartItem[] }> {
    this.logger.log('🛒 Seeding minimal cart data...');

    const users = await this.userRepository.find({ take: 3 });
    const variants = await this.variantRepository.find({ take: 5 });

    if (users.length === 0 || variants.length === 0) {
      throw new Error(
        'No users or variants found. Please seed users and products first.',
      );
    }

    const carts: Cart[] = [];
    const cartItems: CartItem[] = [];

    // Create 3 simple carts
    for (let i = 0; i < 3; i++) {
      const user = users[i];
      const cart = this.cartRepository.create({
        user,
        userId: user.id,
        currency: 'SYP',
        status: 'active',
        totalItems: 1,
        totalAmount: variants[i].price,
        version: 1,
      });

      const cartItem = this.cartItemRepository.create({
        cart,
        variant: variants[i],
        quantity: 1,
        price_at_add: variants[i].price,
        valid: true,
      });

      carts.push(cart);
      cartItems.push(cartItem);
    }

    const savedCarts = await this.cartRepository.save(carts);
    const savedItems = await this.cartItemRepository.save(cartItems);

    this.logger.log(
      `✅ Minimal cart seeding completed: ${savedCarts.length} carts, ${savedItems.length} items`,
    );

    return {
      carts: savedCarts,
      cartItems: savedItems,
    };
  }
}
