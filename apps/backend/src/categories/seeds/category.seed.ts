/**
 * @file category.seed.ts
 * @description Category seed data for Syrian market e-commerce platform
 *
 * PURPOSE:
 * - Populate initial category structure for development and testing
 * - Syrian market-specific categories with Arabic/English names
 * - 3-level hierarchy (Parent > Child > Grandchild)
 * - Featured categories marked for homepage display
 *
 * USAGE:
 * - Development environment setup
 * - Testing category navigation
 * - Demo data for presentations
 *
 * INSTRUCTIONS:
 * 1. Run this seed after creating the categories table
 * 2. Execute via TypeORM CLI or custom seed script
 * 3. Safe to run multiple times (uses upsert logic)
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { DataSource, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

/**
 * Category seed data interface
 * Matches the Category entity structure
 */
interface CategorySeedData {
  id?: number;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  iconUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  isFeatured: boolean;
  featuredPriority?: number;
  featuredImageUrl?: string;
  featuredDiscount?: string;
  isActive: boolean;
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';
  sortOrder: number;
  showInNav: boolean;
  productCount: number;
  depthLevel: number;
  parentId?: number;
  commissionRate?: number;
}

/**
 * Syrian Market Category Seed Data
 * 6 featured root categories with children and grandchildren
 */
const categorySeedData: CategorySeedData[] = [
  // ============================================================================
  // ROOT CATEGORY 1: ELECTRONICS (إلكترونيات)
  // ============================================================================
  {
    id: 1,
    nameEn: 'Electronics',
    nameAr: 'إلكترونيات',
    slug: 'electronics',
    descriptionEn: 'Electronic devices, gadgets, and home electronics',
    descriptionAr: 'أجهزة إلكترونية ومنزلية وأدوات ذكية',
    iconUrl: 'devices',
    bannerUrl:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
    themeColor: '#2196F3',
    seoTitle: 'Electronics - Shop Online in Syria | SouqSyria',
    seoDescription:
      'Buy electronics, smartphones, laptops & more with fast delivery across Syria',
    seoSlug: 'الكترونيات',
    isFeatured: true,
    featuredPriority: 10,
    featuredImageUrl:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 45,
    depthLevel: 0,
    commissionRate: 5.0,
  },
  {
    id: 10,
    nameEn: 'Mobile Phones',
    nameAr: 'هواتف محمولة',
    slug: 'mobile-phones',
    descriptionEn: 'Smartphones and mobile devices',
    descriptionAr: 'هواتف ذكية وأجهزة محمولة',
    iconUrl: 'smartphone',
    bannerUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 28,
    depthLevel: 1,
    parentId: 1,
  },
  {
    id: 11,
    nameEn: 'Laptops',
    nameAr: 'لابتوبات',
    slug: 'laptops',
    descriptionEn: 'Laptops and portable computers',
    descriptionAr: 'أجهزة كمبيوتر محمولة',
    iconUrl: 'laptop',
    bannerUrl:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 12,
    depthLevel: 1,
    parentId: 1,
  },
  // Grandchildren of Mobile Phones (id: 10)
  {
    id: 100,
    nameEn: 'Samsung',
    nameAr: 'سامسونج',
    slug: 'samsung-phones',
    descriptionEn: 'Samsung Galaxy smartphones',
    descriptionAr: 'هواتف سامسونج جالاكسي',
    iconUrl: 'phone_android',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 12,
    depthLevel: 2,
    parentId: 10,
  },
  {
    id: 101,
    nameEn: 'iPhone',
    nameAr: 'آيفون',
    slug: 'iphone',
    descriptionEn: 'Apple iPhone smartphones',
    descriptionAr: 'هواتف آبل آيفون',
    iconUrl: 'phone_iphone',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 10,
    depthLevel: 2,
    parentId: 10,
  },
  {
    id: 102,
    nameEn: 'Huawei',
    nameAr: 'هواوي',
    slug: 'huawei-phones',
    descriptionEn: 'Huawei smartphones',
    descriptionAr: 'هواتف هواوي',
    iconUrl: 'phone_android',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 30,
    showInNav: true,
    productCount: 6,
    depthLevel: 2,
    parentId: 10,
  },
  {
    id: 12,
    nameEn: 'Accessories',
    nameAr: 'إكسسوارات',
    slug: 'electronics-accessories',
    descriptionEn: 'Cables, chargers, and electronic accessories',
    descriptionAr: 'كابلات وشواحن وإكسسوارات إلكترونية',
    iconUrl: 'headphones',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 30,
    showInNav: true,
    productCount: 5,
    depthLevel: 1,
    parentId: 1,
  },

  // ============================================================================
  // ROOT CATEGORY 2: FASHION (أزياء)
  // ============================================================================
  {
    id: 2,
    nameEn: 'Fashion',
    nameAr: 'أزياء',
    slug: 'fashion',
    descriptionEn: 'Clothing, shoes, and fashion accessories',
    descriptionAr: 'ملابس وأحذية وإكسسوارات الموضة',
    iconUrl: 'checkroom',
    bannerUrl:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop',
    themeColor: '#E91E63',
    seoTitle: 'Fashion - Shop Latest Trends in Syria | SouqSyria',
    seoDescription:
      'Discover latest fashion trends, clothing, and accessories with delivery across Syria',
    seoSlug: 'ازياء',
    isFeatured: true,
    featuredPriority: 9,
    featuredImageUrl:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 38,
    depthLevel: 0,
    commissionRate: 7.5,
  },
  {
    id: 20,
    nameEn: 'Men',
    nameAr: 'رجالي',
    slug: 'men-fashion',
    descriptionEn: "Men's clothing and accessories",
    descriptionAr: 'ملابس وإكسسوارات رجالية',
    iconUrl: 'man',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 18,
    depthLevel: 1,
    parentId: 2,
  },
  // Grandchildren of Men's Fashion (id: 20)
  {
    id: 200,
    nameEn: 'T-Shirts',
    nameAr: 'تيشيرتات',
    slug: 'men-tshirts',
    descriptionEn: "Men's t-shirts and casual tops",
    descriptionAr: 'تيشيرتات وملابس كاجوال رجالية',
    iconUrl: 'dry_cleaning',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 8,
    depthLevel: 2,
    parentId: 20,
  },
  {
    id: 201,
    nameEn: 'Shoes',
    nameAr: 'أحذية رجالية',
    slug: 'men-shoes',
    descriptionEn: "Men's footwear and shoes",
    descriptionAr: 'أحذية رجالية',
    iconUrl: 'steps',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 10,
    depthLevel: 2,
    parentId: 20,
  },
  {
    id: 21,
    nameEn: 'Women',
    nameAr: 'نسائي',
    slug: 'women-fashion',
    descriptionEn: "Women's clothing and accessories",
    descriptionAr: 'ملابس وإكسسوارات نسائية',
    iconUrl: 'woman',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 15,
    depthLevel: 1,
    parentId: 2,
  },
  {
    id: 22,
    nameEn: 'Kids',
    nameAr: 'أطفال',
    slug: 'kids-fashion',
    descriptionEn: "Children's clothing and accessories",
    descriptionAr: 'ملابس وإكسسوارات للأطفال',
    iconUrl: 'child_care',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 30,
    showInNav: true,
    productCount: 5,
    depthLevel: 1,
    parentId: 2,
  },

  // ============================================================================
  // ROOT CATEGORY 3: HOME & GARDEN (المنزل والحديقة)
  // ============================================================================
  {
    id: 3,
    nameEn: 'Home & Garden',
    nameAr: 'المنزل والحديقة',
    slug: 'home-garden',
    descriptionEn: 'Furniture, home decor, and garden supplies',
    descriptionAr: 'أثاث وديكور منزلي ومستلزمات الحديقة',
    iconUrl: 'home',
    bannerUrl:
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&h=400&fit=crop',
    themeColor: '#4CAF50',
    seoTitle: 'Home & Garden - Furniture & Decor in Syria | SouqSyria',
    seoDescription:
      'Shop furniture, home decor, and garden supplies with delivery across Syria',
    seoSlug: 'المنزل-والحديقة',
    isFeatured: true,
    featuredPriority: 8,
    featuredImageUrl:
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=600&h=400&fit=crop',
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 30,
    showInNav: true,
    productCount: 22,
    depthLevel: 0,
    commissionRate: 6.0,
  },
  {
    id: 30,
    nameEn: 'Furniture',
    nameAr: 'أثاث',
    slug: 'furniture',
    descriptionEn: 'Living room, bedroom, and office furniture',
    descriptionAr: 'أثاث غرف المعيشة والنوم والمكاتب',
    iconUrl: 'chair',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 14,
    depthLevel: 1,
    parentId: 3,
  },
  {
    id: 31,
    nameEn: 'Kitchen',
    nameAr: 'مطبخ',
    slug: 'kitchen',
    descriptionEn: 'Kitchen appliances and utensils',
    descriptionAr: 'أجهزة وأدوات المطبخ',
    iconUrl: 'kitchen',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 8,
    depthLevel: 1,
    parentId: 3,
  },

  // ============================================================================
  // ROOT CATEGORY 4: BEAUTY (جمال)
  // ============================================================================
  {
    id: 4,
    nameEn: 'Beauty',
    nameAr: 'جمال',
    slug: 'beauty',
    descriptionEn: 'Skincare, makeup, and beauty products',
    descriptionAr: 'منتجات العناية بالبشرة والمكياج والجمال',
    iconUrl: 'spa',
    bannerUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=400&fit=crop',
    themeColor: '#FF69B4',
    seoTitle: 'Beauty Products - Skincare & Makeup in Syria | SouqSyria',
    seoDescription:
      'Shop skincare, makeup, and beauty products with delivery across Syria',
    seoSlug: 'جمال',
    isFeatured: true,
    featuredPriority: 7,
    featuredImageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop',
    featuredDiscount: '20%',
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 40,
    showInNav: true,
    productCount: 35,
    depthLevel: 0,
    commissionRate: 8.0,
  },
  {
    id: 40,
    nameEn: 'Skincare',
    nameAr: 'عناية بالبشرة',
    slug: 'skincare',
    descriptionEn: 'Face creams, serums, and skincare products',
    descriptionAr: 'كريمات وسيروم ومنتجات العناية بالبشرة',
    iconUrl: 'face_retouching_natural',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 22,
    depthLevel: 1,
    parentId: 4,
  },
  // Grandchildren of Skincare (id: 40)
  {
    id: 400,
    nameEn: 'Face Creams',
    nameAr: 'كريمات الوجه',
    slug: 'face-creams',
    descriptionEn: 'Moisturizers and face creams',
    descriptionAr: 'مرطبات وكريمات للوجه',
    iconUrl: 'water_drop',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 14,
    depthLevel: 2,
    parentId: 40,
  },
  {
    id: 401,
    nameEn: 'Serums',
    nameAr: 'سيروم',
    slug: 'serums',
    descriptionEn: 'Face serums and treatments',
    descriptionAr: 'سيروم وعلاجات للبشرة',
    iconUrl: 'science',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 8,
    depthLevel: 2,
    parentId: 40,
  },
  {
    id: 41,
    nameEn: 'Makeup',
    nameAr: 'مكياج',
    slug: 'makeup',
    descriptionEn: 'Lipstick, foundation, and makeup products',
    descriptionAr: 'أحمر شفاه وأساس ومنتجات المكياج',
    iconUrl: 'brush',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 13,
    depthLevel: 1,
    parentId: 4,
  },

  // ============================================================================
  // ROOT CATEGORY 5: FOOD & GROCERY (طعام وبقالة)
  // ============================================================================
  {
    id: 5,
    nameEn: 'Food & Grocery',
    nameAr: 'طعام وبقالة',
    slug: 'food-grocery',
    descriptionEn: 'Syrian foods, spices, and grocery items',
    descriptionAr: 'أطعمة سورية وبهارات ومواد غذائية',
    iconUrl: 'restaurant',
    bannerUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop',
    themeColor: '#FF9800',
    seoTitle: 'Food & Grocery - Syrian Foods & Spices | SouqSyria',
    seoDescription:
      'Shop authentic Syrian foods, spices, and grocery items with delivery',
    seoSlug: 'طعام-وبقالة',
    isFeatured: true,
    featuredPriority: 6,
    featuredImageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
    featuredDiscount: '10%',
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 50,
    showInNav: true,
    productCount: 48,
    depthLevel: 0,
    commissionRate: 4.5,
  },
  {
    id: 50,
    nameEn: 'Syrian Foods',
    nameAr: 'أطعمة سورية',
    slug: 'syrian-foods',
    descriptionEn: 'Traditional Syrian food products',
    descriptionAr: 'منتجات غذائية سورية تقليدية',
    iconUrl: 'lunch_dining',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 32,
    depthLevel: 1,
    parentId: 5,
  },
  {
    id: 51,
    nameEn: 'Spices',
    nameAr: 'بهارات',
    slug: 'spices',
    descriptionEn: 'Syrian and Middle Eastern spices',
    descriptionAr: 'بهارات سورية وشرق أوسطية',
    iconUrl: 'local_fire_department',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 16,
    depthLevel: 1,
    parentId: 5,
  },

  // ============================================================================
  // ROOT CATEGORY 6: SPORTS (رياضة)
  // ============================================================================
  {
    id: 6,
    nameEn: 'Sports',
    nameAr: 'رياضة',
    slug: 'sports',
    descriptionEn: 'Sports equipment and athletic wear',
    descriptionAr: 'معدات رياضية وملابس رياضية',
    iconUrl: 'sports_soccer',
    bannerUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
    themeColor: '#009688',
    seoTitle: 'Sports - Equipment & Athletic Wear in Syria | SouqSyria',
    seoDescription:
      'Shop sports equipment and athletic wear with delivery across Syria',
    seoSlug: 'رياضة',
    isFeatured: true,
    featuredPriority: 5,
    featuredImageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop',
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 60,
    showInNav: true,
    productCount: 27,
    depthLevel: 0,
    commissionRate: 6.5,
  },
  {
    id: 60,
    nameEn: 'Equipment',
    nameAr: 'معدات',
    slug: 'sports-equipment',
    descriptionEn: 'Gym equipment and sports gear',
    descriptionAr: 'معدات الجيم والأدوات الرياضية',
    iconUrl: 'fitness_center',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 10,
    showInNav: true,
    productCount: 15,
    depthLevel: 1,
    parentId: 6,
  },
  {
    id: 61,
    nameEn: 'Sports Clothing',
    nameAr: 'ملابس رياضية',
    slug: 'sports-clothing',
    descriptionEn: 'Athletic wear and sports apparel',
    descriptionAr: 'ملابس رياضية وأزياء رياضية',
    iconUrl: 'dry_cleaning',
    isFeatured: false,
    isActive: true,
    approvalStatus: 'approved',
    sortOrder: 20,
    showInNav: true,
    productCount: 12,
    depthLevel: 1,
    parentId: 6,
  },
];

/**
 * Seed categories into database
 * Safe to run multiple times - uses upsert logic
 *
 * @param dataSource - TypeORM DataSource instance
 */
export async function seedCategories(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting category seeding...');

  const categoryRepository: Repository<Category> =
    dataSource.getRepository(Category);

  try {
    // First, insert/update root categories (depthLevel = 0)
    const rootCategories = categorySeedData.filter(
      (cat) => cat.depthLevel === 0,
    );
    console.log(`📦 Seeding ${rootCategories.length} root categories...`);

    for (const seedData of rootCategories) {
      const category = categoryRepository.create({
        ...seedData,
        parent: null,
      });

      await categoryRepository.save(category);
      console.log(`  ✅ Saved: ${seedData.nameEn} (${seedData.nameAr})`);
    }

    // Then, insert/update child categories (depthLevel = 1)
    const childCategories = categorySeedData.filter(
      (cat) => cat.depthLevel === 1,
    );
    console.log(`📦 Seeding ${childCategories.length} child categories...`);

    for (const seedData of childCategories) {
      const parent = await categoryRepository.findOne({
        where: { id: seedData.parentId },
      });

      if (!parent) {
        console.warn(
          `  ⚠️  Parent not found for: ${seedData.nameEn} (parentId: ${seedData.parentId})`,
        );
        continue;
      }

      const category = categoryRepository.create({
        ...seedData,
        parent: parent,
      });

      await categoryRepository.save(category);
      console.log(
        `  ✅ Saved: ${seedData.nameEn} (${seedData.nameAr}) under ${parent.nameEn}`,
      );
    }

    // Finally, insert/update grandchild categories (depthLevel = 2)
    const grandchildCategories = categorySeedData.filter(
      (cat) => cat.depthLevel === 2,
    );
    console.log(
      `📦 Seeding ${grandchildCategories.length} grandchild categories...`,
    );

    for (const seedData of grandchildCategories) {
      const parent = await categoryRepository.findOne({
        where: { id: seedData.parentId },
      });

      if (!parent) {
        console.warn(
          `  ⚠️  Parent not found for: ${seedData.nameEn} (parentId: ${seedData.parentId})`,
        );
        continue;
      }

      const category = categoryRepository.create({
        ...seedData,
        parent: parent,
      });

      await categoryRepository.save(category);
      console.log(
        `  ✅ Saved: ${seedData.nameEn} (${seedData.nameAr}) under ${parent.nameEn}`,
      );
    }

    console.log('✅ Category seeding completed successfully!');
    console.log(`📊 Total categories seeded: ${categorySeedData.length}`);
  } catch (error) {
    console.error('❌ Category seeding failed:', error);
    throw error;
  }
}

/**
 * Export seed data for external use
 */
export { categorySeedData };
