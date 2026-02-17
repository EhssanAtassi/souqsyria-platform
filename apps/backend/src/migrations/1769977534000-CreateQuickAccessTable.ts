/**
 * @file 1769977534000-CreateQuickAccessTable.ts
 * @description Migration to create quick_access table and seed initial promotional cards
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateQuickAccessTable1769977534000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quick_access table
    await queryRunner.createTable(
      new Table({
        name: 'quick_access',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'categoryEn',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'categoryAr',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'titleEn',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'titleAr',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'subtitleEn',
            type: 'varchar',
            length: '300',
            isNullable: true,
            default: null,
          },
          {
            name: 'subtitleAr',
            type: 'varchar',
            length: '300',
            isNullable: true,
            default: null,
          },
          {
            name: 'badgeClass',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'image',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '300',
            isNullable: false,
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
            default: null,
          },
        ],
      }),
      true,
    );

    // Create indexes using raw SQL queries
    await queryRunner.query(`
      CREATE INDEX IDX_QUICK_ACCESS_ACTIVE_ORDER
      ON quick_access (isActive, displayOrder)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_QUICK_ACCESS_ORDER
      ON quick_access (displayOrder)
    `);

    // Seed initial promotional cards (migrated from frontend mock data)
    const seedData = [
      {
        categoryEn: 'Traditional Crafts',
        categoryAr: 'الحرف التقليدية',
        titleEn: 'Damascus Handicrafts',
        titleAr: 'حرف دمشق اليدوية',
        subtitleEn: 'Authentic Syrian artisanal products',
        subtitleAr: 'منتجات حرفية سورية أصيلة',
        badgeClass: 'badge-gold',
        image: 'https://images.unsplash.com/photo-1565608087341-404b25b5eee3?auto=format&fit=crop&q=80&w=300',
        url: '/category/traditional-crafts',
        displayOrder: 0,
      },
      {
        categoryEn: 'Food & Spices',
        categoryAr: 'الطعام والبهارات',
        titleEn: 'Syrian Delicacies',
        titleAr: 'المأكولات السورية',
        subtitleEn: 'Premium quality spices and traditional foods',
        subtitleAr: 'بهارات ومأكولات تقليدية فاخرة',
        badgeClass: 'badge-orange',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300',
        url: '/category/food-spices',
        displayOrder: 1,
      },
      {
        categoryEn: 'Natural Products',
        categoryAr: 'المنتجات الطبيعية',
        titleEn: 'Aleppo Soap & Oils',
        titleAr: 'صابون حلب والزيوت',
        subtitleEn: 'Pure organic beauty essentials',
        subtitleAr: 'مستحضرات تجميل عضوية طبيعية',
        badgeClass: 'badge-green',
        image: 'https://images.unsplash.com/photo-1607006344380-116b10e0ed1f?auto=format&fit=crop&q=80&w=300',
        url: '/category/natural-products',
        displayOrder: 2,
      },
      {
        categoryEn: 'UNESCO Heritage',
        categoryAr: 'تراث اليونسكو',
        titleEn: 'Cultural Treasures',
        titleAr: 'كنوز ثقافية',
        subtitleEn: 'Preserve Syrian heritage',
        subtitleAr: 'احفظ التراث السوري',
        badgeClass: 'badge-purple',
        image: 'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&q=80&w=300',
        url: '/unesco-heritage',
        displayOrder: 3,
      },
      {
        categoryEn: 'Artisan Sellers',
        categoryAr: 'البائعون الحرفيون',
        titleEn: 'Support Local Artisans',
        titleAr: 'ادعم الحرفيين المحليين',
        subtitleEn: 'Direct from Syrian workshops',
        subtitleAr: 'مباشرة من الورش السورية',
        badgeClass: 'badge-blue',
        image: 'https://images.unsplash.com/photo-1459908676235-d5f02d5e1e5b?auto=format&fit=crop&q=80&w=300',
        url: '/sellers/artisans',
        displayOrder: 4,
      },
      {
        categoryEn: 'Best Sellers',
        categoryAr: 'الأكثر مبيعًا',
        titleEn: 'Top Rated Products',
        titleAr: 'المنتجات الأعلى تقييمًا',
        subtitleEn: 'Customer favorites this month',
        subtitleAr: 'المفضلات لدى العملاء هذا الشهر',
        badgeClass: 'badge-red',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
        url: '/best-sellers',
        displayOrder: 5,
      },
      {
        categoryEn: 'New Arrivals',
        categoryAr: 'وصل حديثًا',
        titleEn: 'Fresh Collections',
        titleAr: 'مجموعات جديدة',
        subtitleEn: 'Latest products just added',
        subtitleAr: 'أحدث المنتجات المضافة',
        badgeClass: 'badge-teal',
        image: 'https://images.unsplash.com/photo-1519669011783-4eaa95fa1b7d?auto=format&fit=crop&q=80&w=300',
        url: '/new-arrivals',
        displayOrder: 6,
      },
      {
        categoryEn: 'Special Offers',
        categoryAr: 'عروض خاصة',
        titleEn: 'Limited Time Deals',
        titleAr: 'عروض محدودة المدة',
        subtitleEn: 'Save up to 40% today',
        subtitleAr: 'وفر حتى 40% اليوم',
        badgeClass: 'badge-pink',
        image: 'https://images.unsplash.com/photo-1607083681678-997e599cd6e8?auto=format&fit=crop&q=80&w=300',
        url: '/offers',
        displayOrder: 7,
      },
      {
        categoryEn: 'Home & Living',
        categoryAr: 'المنزل والمعيشة',
        titleEn: 'Damascus Decor',
        titleAr: 'ديكور دمشقي',
        subtitleEn: 'Traditional Syrian home accents',
        subtitleAr: 'لمسات منزلية سورية تقليدية',
        badgeClass: 'badge-gold',
        image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=300',
        url: '/category/home-living',
        displayOrder: 8,
      },
      {
        categoryEn: 'Fashion',
        categoryAr: 'الأزياء',
        titleEn: 'Syrian Textiles',
        titleAr: 'المنسوجات السورية',
        subtitleEn: 'Traditional and modern styles',
        subtitleAr: 'أنماط تقليدية وعصرية',
        badgeClass: 'badge-purple',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=300',
        url: '/category/fashion',
        displayOrder: 9,
      },
      {
        categoryEn: 'Gift Ideas',
        categoryAr: 'أفكار الهدايا',
        titleEn: 'Perfect Presents',
        titleAr: 'هدايا مثالية',
        subtitleEn: 'Unique Syrian gift options',
        subtitleAr: 'خيارات هدايا سورية فريدة',
        badgeClass: 'badge-blue',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=300',
        url: '/gift-ideas',
        displayOrder: 10,
      },
      {
        categoryEn: 'Organic Products',
        categoryAr: 'المنتجات العضوية',
        titleEn: 'Natural & Pure',
        titleAr: 'طبيعي ونقي',
        subtitleEn: '100% organic certified',
        subtitleAr: 'عضوي معتمد 100%',
        badgeClass: 'badge-green',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=300',
        url: '/organic',
        displayOrder: 11,
      },
      {
        categoryEn: 'Premium Selection',
        categoryAr: 'الاختيار المميز',
        titleEn: 'Luxury Items',
        titleAr: 'عناصر فاخرة',
        subtitleEn: 'Exclusive high-end products',
        subtitleAr: 'منتجات راقية حصرية',
        badgeClass: 'badge-gold',
        image: 'https://images.unsplash.com/photo-1571487174760-bd39e8f37f96?auto=format&fit=crop&q=80&w=300',
        url: '/premium',
        displayOrder: 12,
      },
      {
        categoryEn: 'Syrian Sweets',
        categoryAr: 'الحلويات السورية',
        titleEn: 'Traditional Desserts',
        titleAr: 'الحلويات التقليدية',
        subtitleEn: 'Authentic baklava & more',
        subtitleAr: 'بقلاوة أصلية وأكثر',
        badgeClass: 'badge-orange',
        image: 'https://images.unsplash.com/photo-1564958581485-fe0889749ac0?auto=format&fit=crop&q=80&w=300',
        url: '/category/sweets',
        displayOrder: 13,
      },
      {
        categoryEn: 'Clearance Sale',
        categoryAr: 'تصفية',
        titleEn: 'Final Markdowns',
        titleAr: 'تخفيضات نهائية',
        subtitleEn: 'While supplies last',
        subtitleAr: 'حتى نفاد الكمية',
        badgeClass: 'badge-red',
        image: 'https://images.unsplash.com/photo-1513094735237-8f2828cdd532?auto=format&fit=crop&q=80&w=300',
        url: '/clearance',
        displayOrder: 14,
      },
    ];

    // Insert seed data
    for (const item of seedData) {
      await queryRunner.query(
        `INSERT INTO quick_access (
          id, categoryEn, categoryAr, titleEn, titleAr,
          subtitleEn, subtitleAr, badgeClass, image, url,
          displayOrder, isActive
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true
        )`,
        [
          item.categoryEn,
          item.categoryAr,
          item.titleEn,
          item.titleAr,
          item.subtitleEn,
          item.subtitleAr,
          item.badgeClass,
          item.image,
          item.url,
          item.displayOrder,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('quick_access', 'IDX_QUICK_ACCESS_ACTIVE_ORDER');
    await queryRunner.dropIndex('quick_access', 'IDX_QUICK_ACCESS_ORDER');

    // Drop table
    await queryRunner.dropTable('quick_access');
  }
}