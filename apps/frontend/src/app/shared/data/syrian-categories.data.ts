/**
 * @fileoverview Authentic Syrian Marketplace Category Data
 * @description Comprehensive category structure for SouqSyria - Traditional Syrian Products
 * @author SouqSyria Development Team
 * @version 2.0.0 - Syrian Heritage Edition
 */

import { Category, MegaMenuFeaturedProduct, MenuColumn, FeaturedTile } from '../interfaces/navigation.interface';

/**
 * Complete Syrian e-commerce category structure
 * @description Organized categories reflecting authentic Syrian crafts, products, and cultural heritage
 *
 * @swagger
 * components:
 *   examples:
 *     SyrianCategoriesData:
 *       summary: Authentic Syrian marketplace categories
 *       value:
 *         - id: damascus-steel
 *           name: Damascus Steel
 *           nameAr: فولاذ دمشقي
 *           icon: carpenter
 *           featured: true
 *           url: /category/damascus-steel
 *           subcategories:
 *             - id: knives-blades
 *               name: Knives & Blades
 *               nameAr: سكاكين ونصال
 *               url: /category/damascus-steel/knives-blades
 */
export const SYRIAN_CATEGORIES: Category[] = [
  {
    id: 'damascus-steel',
    name: 'Damascus Steel',
    nameAr: 'فولاذ دمشقي',
    icon: 'carpenter',
    featured: true,
    url: '/category/damascus-steel',
    megaMenuType: 'sidebar',
    megaMenuFeaturedProducts: [
      {
        id: 'chef-knife-8',
        name: 'Chef Knife 8"',
        nameAr: 'سكين شيف 8 إنش',
        image: 'https://images.unsplash.com/photo-1593618998160-e34014e67f23?w=200&h=200&fit=crop',
        price: '$299',
        url: '/product/damascus-steel-chef-knife'
      },
      {
        id: 'santoku-knife',
        name: 'Santoku Knife',
        nameAr: 'سكين سانتوكو',
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=200&h=200&fit=crop',
        price: '$249',
        url: '/product/damascus-steel-santoku'
      }
    ],
    subcategories: [
      {
        id: 'knives-blades',
        name: 'Knives & Blades',
        nameAr: 'سكاكين ونصال',
        url: '/category/damascus-steel/knives-blades',
        icon: 'restaurant',
        showInMegaMenu: true,
        children: [
          {
            id: 'chef-knives',
            name: 'Chef Knives',
            nameAr: 'سكاكين الطبخ',
            url: '/category/damascus-steel/knives-blades/chef-knives',
            icon: 'restaurant',
            showInMegaMenu: true
          },
          {
            id: 'hunting-knives',
            name: 'Hunting Knives',
            nameAr: 'سكاكين الصيد',
            url: '/category/damascus-steel/knives-blades/hunting-knives',
            icon: 'nature',
            showInMegaMenu: true
          },
          {
            id: 'pocket-knives',
            name: 'Pocket Knives',
            nameAr: 'سكاكين الجيب',
            url: '/category/damascus-steel/knives-blades/pocket-knives',
            icon: 'category',
            showInMegaMenu: true
          },
          {
            id: 'utility-blades',
            name: 'Utility Blades',
            nameAr: 'شفرات المرافق',
            url: '/category/damascus-steel/knives-blades/utility-blades',
            icon: 'build',
            showInMegaMenu: true
          },
          {
            id: 'ceremonial-blades',
            name: 'Ceremonial Blades',
            nameAr: 'الشفرات الاحتفالية',
            url: '/category/damascus-steel/knives-blades/ceremonial-blades',
            icon: 'stars',
            showInMegaMenu: true
          }
        ]
      },
      {
        id: 'swords',
        name: 'Traditional Swords',
        nameAr: 'سيوف تراثية',
        url: '/category/damascus-steel/swords',
        icon: 'sports_martial_arts'
      },
      {
        id: 'jewelry',
        name: 'Steel Jewelry',
        nameAr: 'مجوهرات فولاذية',
        url: '/category/damascus-steel/jewelry',
        icon: 'diamond'
      },
      {
        id: 'home-decor',
        name: 'Decorative Items',
        nameAr: 'قطع زينة',
        url: '/category/damascus-steel/home-decor',
        icon: 'museum'
      },
      {
        id: 'custom-pieces',
        name: 'Custom Orders',
        nameAr: 'طلبات خاصة',
        url: '/category/damascus-steel/custom-pieces',
        icon: 'handyman'
      }
    ]
  },

  {
    id: 'beauty-wellness',
    name: 'Beauty & Wellness',
    nameAr: 'جمال وعافية',
    icon: 'spa',
    featured: true,
    url: '/category/beauty-wellness',
    megaMenuType: 'fullwidth',
    menuColumns: [
      {
        title: 'Skincare',
        titleAr: 'العناية بالبشرة',
        links: [
          { name: 'Aleppo Soap', nameAr: 'صابون حلبي', url: '/category/beauty-wellness/aleppo-soap', icon: 'soap' },
          { name: 'Damascus Rose Water', nameAr: 'ماء ورد دمشقي', url: '/category/beauty-wellness/rose-water', icon: 'local_florist' },
          { name: 'Natural Oils', nameAr: 'زيوت طبيعية', url: '/category/beauty-wellness/natural-oils', icon: 'oil_barrel' }
        ]
      },
      {
        title: 'Beauty',
        titleAr: 'الجمال',
        links: [
          { name: 'Henna & Natural Dyes', nameAr: 'حناء وأصباغ طبيعية', url: '/category/beauty-wellness/henna-products', icon: 'brush' },
          { name: 'Traditional Oud & Perfumes', nameAr: 'عود وعطور تراثية', url: '/category/beauty-wellness/traditional-perfumes', icon: 'fragrance' }
        ]
      },
      {
        title: 'Wellness',
        titleAr: 'العافية',
        links: [
          { name: 'Herbal Remedies', nameAr: 'علاجات عشبية', url: '/category/beauty-wellness/herbal-remedies', icon: 'healing' }
        ]
      }
    ],
    featuredTiles: [
      { name: 'Spa', nameAr: 'سبا', icon: 'spa', bgColor: 'bg-pink-50', iconColor: 'text-pink-500', url: '/category/beauty-wellness/aleppo-soap' },
      { name: 'Natural', nameAr: 'طبيعي', icon: 'eco', bgColor: 'bg-green-50', iconColor: 'text-green-500', url: '/category/beauty-wellness/natural-oils' },
      { name: 'Skincare', nameAr: 'بشرة', icon: 'face', bgColor: 'bg-purple-50', iconColor: 'text-purple-500', url: '/category/beauty-wellness/rose-water' },
      { name: 'Floral', nameAr: 'زهور', icon: 'local_florist', bgColor: 'bg-rose-50', iconColor: 'text-rose-500', url: '/category/beauty-wellness/traditional-perfumes' }
    ],
    subcategories: [
      {
        id: 'aleppo-soap',
        name: 'Aleppo Soap',
        nameAr: 'صابون حلبي',
        url: '/category/beauty-wellness/aleppo-soap',
        icon: 'soap',
        showInMegaMenu: true,
        children: [
          {
            id: 'laurel-soap',
            name: 'Laurel Oil Soap',
            nameAr: 'صابون زيت الغار',
            url: '/category/beauty-wellness/aleppo-soap/laurel-soap',
            icon: 'local_florist',
            showInMegaMenu: true
          },
          {
            id: 'olive-soap',
            name: 'Pure Olive Soap',
            nameAr: 'صابون الزيتون الخالص',
            url: '/category/beauty-wellness/aleppo-soap/olive-soap',
            icon: 'eco',
            showInMegaMenu: true
          },
          {
            id: 'herbal-soap',
            name: 'Herbal Blend Soap',
            nameAr: 'صابون الأعشاب المخلوطة',
            url: '/category/beauty-wellness/aleppo-soap/herbal-soap',
            icon: 'grass',
            showInMegaMenu: true
          }
        ]
      },
      {
        id: 'rose-water',
        name: 'Damascus Rose Water',
        nameAr: 'ماء ورد دمشقي',
        url: '/category/beauty-wellness/rose-water',
        icon: 'local_florist'
      },
      {
        id: 'natural-oils',
        name: 'Natural Oils',
        nameAr: 'زيوت طبيعية',
        url: '/category/beauty-wellness/natural-oils',
        icon: 'oil_barrel'
      },
      {
        id: 'henna-products',
        name: 'Henna & Natural Dyes',
        nameAr: 'حناء وأصباغ طبيعية',
        url: '/category/beauty-wellness/henna-products',
        icon: 'brush'
      },
      {
        id: 'traditional-perfumes',
        name: 'Traditional Oud & Perfumes',
        nameAr: 'عود وعطور تراثية',
        url: '/category/beauty-wellness/traditional-perfumes',
        icon: 'fragrance'
      },
      {
        id: 'herbal-remedies',
        name: 'Herbal Remedies',
        nameAr: 'علاجات عشبية',
        url: '/category/beauty-wellness/herbal-remedies',
        icon: 'healing'
      }
    ]
  },

  {
    id: 'textiles-fabrics',
    name: 'Textiles & Fabrics',
    nameAr: 'منسوجات وأقمشة',
    icon: 'texture',
    featured: true,
    url: '/category/textiles-fabrics',
    megaMenuType: 'fullwidth',
    menuColumns: [
      {
        title: 'Fabrics',
        titleAr: 'الأقمشة',
        links: [
          { name: 'Damascus Brocade', nameAr: 'بروكار دمشقي', url: '/category/textiles-fabrics/damascus-brocade', icon: 'pattern' },
          { name: 'Syrian Silk', nameAr: 'حرير سوري', url: '/category/textiles-fabrics/silk-fabrics', icon: 'fabric' }
        ]
      },
      {
        title: 'Home',
        titleAr: 'المنزل',
        links: [
          { name: 'Traditional Carpets', nameAr: 'سجاد تراثي', url: '/category/textiles-fabrics/traditional-carpets', icon: 'carpet' },
          { name: 'Home Textiles', nameAr: 'منسوجات منزلية', url: '/category/textiles-fabrics/home-textiles', icon: 'home' }
        ]
      },
      {
        title: 'Fashion',
        titleAr: 'الأزياء',
        links: [
          { name: 'Embroidered Textiles', nameAr: 'منسوجات مطرزة', url: '/category/textiles-fabrics/embroidered-textiles', icon: 'design_services' },
          { name: 'Traditional Abayas', nameAr: 'عباءات تراثية', url: '/category/textiles-fabrics/abayas-traditional', icon: 'checkroom' }
        ]
      }
    ],
    featuredTiles: [
      { name: 'Brocade', nameAr: 'بروكار', icon: 'texture', bgColor: 'bg-amber-50', iconColor: 'text-amber-600', url: '/category/textiles-fabrics/damascus-brocade' },
      { name: 'Silk', nameAr: 'حرير', icon: 'checkroom', bgColor: 'bg-sky-50', iconColor: 'text-sky-500', url: '/category/textiles-fabrics/silk-fabrics' },
      { name: 'Carpets', nameAr: 'سجاد', icon: 'home', bgColor: 'bg-red-50', iconColor: 'text-red-500', url: '/category/textiles-fabrics/traditional-carpets' },
      { name: 'Embroidery', nameAr: 'تطريز', icon: 'design_services', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500', url: '/category/textiles-fabrics/embroidered-textiles' }
    ],
    subcategories: [
      {
        id: 'damascus-brocade',
        name: 'Damascus Brocade',
        nameAr: 'بروكار دمشقي',
        url: '/category/textiles-fabrics/damascus-brocade',
        icon: 'pattern'
      },
      {
        id: 'silk-fabrics',
        name: 'Syrian Silk',
        nameAr: 'حرير سوري',
        url: '/category/textiles-fabrics/silk-fabrics',
        icon: 'fabric'
      },
      {
        id: 'traditional-carpets',
        name: 'Traditional Carpets',
        nameAr: 'سجاد تراثي',
        url: '/category/textiles-fabrics/traditional-carpets',
        icon: 'carpet'
      },
      {
        id: 'embroidered-textiles',
        name: 'Embroidered Textiles',
        nameAr: 'منسوجات مطرزة',
        url: '/category/textiles-fabrics/embroidered-textiles',
        icon: 'design_services'
      },
      {
        id: 'abayas-traditional',
        name: 'Traditional Abayas',
        nameAr: 'عباءات تراثية',
        url: '/category/textiles-fabrics/abayas-traditional',
        icon: 'checkroom'
      },
      {
        id: 'home-textiles',
        name: 'Home Textiles',
        nameAr: 'منسوجات منزلية',
        url: '/category/textiles-fabrics/home-textiles',
        icon: 'home'
      }
    ]
  },

  {
    id: 'food-spices',
    name: 'Food & Spices',
    nameAr: 'طعام وتوابل',
    icon: 'restaurant_menu',
    featured: true,
    url: '/category/food-spices',
    megaMenuType: 'sidebar',
    subcategories: [
      {
        id: 'damascus-seven-spice',
        name: 'Damascus Seven Spice',
        nameAr: 'بهارات دمشقية سبعة',
        url: '/category/food-spices/damascus-seven-spice',
        icon: 'grain'
      },
      {
        id: 'zaatar-thyme',
        name: 'Za\'atar & Thyme',
        nameAr: 'زعتر وصعتر',
        url: '/category/food-spices/zaatar-thyme',
        icon: 'eco'
      },
      {
        id: 'syrian-honey',
        name: 'Syrian Mountain Honey',
        nameAr: 'عسل جبلي سوري',
        url: '/category/food-spices/syrian-honey',
        icon: 'hive'
      },
      {
        id: 'olive-oils',
        name: 'Olive Oil & Products',
        nameAr: 'زيت زيتون ومنتجاته',
        url: '/category/food-spices/olive-oils',
        icon: 'oil_barrel'
      },
      {
        id: 'traditional-preserves',
        name: 'Traditional Preserves',
        nameAr: 'مربى ومعلبات تراثية',
        url: '/category/food-spices/traditional-preserves',
        icon: 'breakfast_dining'
      },
      {
        id: 'dried-fruits',
        name: 'Dried Fruits & Nuts',
        nameAr: 'فواكه مجففة ومكسرات',
        url: '/category/food-spices/dried-fruits',
        icon: 'nutrition'
      }
    ]
  },

  {
    id: 'traditional-crafts',
    name: 'Traditional Crafts',
    nameAr: 'حرف تراثية',
    icon: 'handyman',
    featured: true,
    url: '/category/traditional-crafts',
    megaMenuType: 'sidebar',
    subcategories: [
      {
        id: 'chess-sets',
        name: 'Syrian Chess Sets',
        nameAr: 'طقم شطرنج سورية',
        url: '/category/traditional-crafts/chess-sets',
        icon: 'sports_esports'
      },
      {
        id: 'inlaid-work',
        name: 'Inlaid Woodwork (Marquetry)',
        nameAr: 'خشب مطعم',
        url: '/category/traditional-crafts/inlaid-work',
        icon: 'carpenter'
      },
      {
        id: 'ceramics-pottery',
        name: 'Ceramics & Pottery',
        nameAr: 'فخار وخزف',
        url: '/category/traditional-crafts/ceramics-pottery',
        icon: 'colorize'
      },
      {
        id: 'metalwork',
        name: 'Traditional Metalwork',
        nameAr: 'أعمال معدنية تراثية',
        url: '/category/traditional-crafts/metalwork',
        icon: 'build'
      },
      {
        id: 'calligraphy',
        name: 'Arabic Calligraphy',
        nameAr: 'خط عربي',
        url: '/category/traditional-crafts/calligraphy',
        icon: 'brush'
      },
      {
        id: 'glass-work',
        name: 'Traditional Glasswork',
        nameAr: 'زجاج تراثي',
        url: '/category/traditional-crafts/glass-work',
        icon: 'lightbulb'
      }
    ]
  },

  {
    id: 'jewelry-accessories',
    name: 'Jewelry & Accessories',
    nameAr: 'مجوهرات وإكسسوارات',
    icon: 'diamond',
    featured: true,
    url: '/category/jewelry-accessories',
    megaMenuType: 'sidebar',
    subcategories: [
      {
        id: 'traditional-jewelry',
        name: 'Traditional Syrian Jewelry',
        nameAr: 'مجوهرات سورية تراثية',
        url: '/category/jewelry-accessories/traditional-jewelry',
        icon: 'star'
      },
      {
        id: 'silver-jewelry',
        name: 'Silver Jewelry',
        nameAr: 'مجوهرات فضية',
        url: '/category/jewelry-accessories/silver-jewelry',
        icon: 'monetization_on'
      },
      {
        id: 'gold-jewelry',
        name: 'Gold Jewelry',
        nameAr: 'مجوهرات ذهبية',
        url: '/category/jewelry-accessories/gold-jewelry',
        icon: 'star_border'
      },
      {
        id: 'prayer-beads',
        name: 'Prayer Beads (Masbaha)',
        nameAr: 'مسبحة',
        url: '/category/jewelry-accessories/prayer-beads',
        icon: 'circle'
      },
      {
        id: 'watches',
        name: 'Traditional Watches',
        nameAr: 'ساعات تراثية',
        url: '/category/jewelry-accessories/watches',
        icon: 'watch'
      },
      {
        id: 'accessories',
        name: 'Traditional Accessories',
        nameAr: 'إكسسوارات تراثية',
        url: '/category/jewelry-accessories/accessories',
        icon: 'category'
      }
    ]
  },

  {
    id: 'nuts-snacks',
    name: 'Nuts & Snacks',
    nameAr: 'مكسرات ووجبات خفيفة',
    icon: 'nutrition',
    featured: true,
    url: '/category/nuts-snacks',
    megaMenuType: 'sidebar',
    subcategories: [
      {
        id: 'aleppo-pistachios',
        name: 'Aleppo Pistachios',
        nameAr: 'فستق حلبي',
        url: '/category/nuts-snacks/aleppo-pistachios',
        icon: 'eco'
      },
      {
        id: 'pine-nuts',
        name: 'Pine Nuts',
        nameAr: 'صنوبر',
        url: '/category/nuts-snacks/pine-nuts',
        icon: 'park'
      },
      {
        id: 'walnuts',
        name: 'Syrian Walnuts',
        nameAr: 'جوز سوري',
        url: '/category/nuts-snacks/walnuts',
        icon: 'forest'
      },
      {
        id: 'almonds',
        name: 'Almonds',
        nameAr: 'لوز',
        url: '/category/nuts-snacks/almonds',
        icon: 'grain'
      },
      {
        id: 'mixed-nuts',
        name: 'Mixed Nut Collections',
        nameAr: 'مزيج مكسرات',
        url: '/category/nuts-snacks/mixed-nuts',
        icon: 'category'
      },
      {
        id: 'traditional-snacks',
        name: 'Traditional Snacks',
        nameAr: 'وجبات خفيفة تراثية',
        url: '/category/nuts-snacks/traditional-snacks',
        icon: 'local_dining'
      }
    ]
  },

  {
    id: 'sweets-desserts',
    name: 'Sweets & Desserts',
    nameAr: 'حلويات وتحلية',
    icon: 'cake',
    featured: true,
    url: '/category/sweets-desserts',
    megaMenuType: 'sidebar',
    subcategories: [
      {
        id: 'baklava',
        name: 'Syrian Baklava',
        nameAr: 'بقلاوة سورية',
        url: '/category/sweets-desserts/baklava',
        icon: 'cake'
      },
      {
        id: 'maamoul',
        name: 'Ma\'amoul Cookies',
        nameAr: 'معمول',
        url: '/category/sweets-desserts/maamoul',
        icon: 'cookie'
      },
      {
        id: 'muhallabia',
        name: 'Muhallabia & Puddings',
        nameAr: 'مهلبية ومهلبيات',
        url: '/category/sweets-desserts/muhallabia',
        icon: 'icecream'
      },
      {
        id: 'qatayef',
        name: 'Qatayef (Ramadan Special)',
        nameAr: 'قطايف',
        url: '/category/sweets-desserts/qatayef',
        icon: 'nightlife'
      },
      {
        id: 'halawet-jibn',
        name: 'Halawet el Jibn',
        nameAr: 'حلاوة الجبن',
        url: '/category/sweets-desserts/halawet-jibn',
        icon: 'local_dining'
      },
      {
        id: 'gift-boxes',
        name: 'Sweet Gift Boxes',
        nameAr: 'علب هدايا حلويات',
        url: '/category/sweets-desserts/gift-boxes',
        icon: 'card_giftcard'
      }
    ]
  }
];

/**
 * Featured categories for main navigation (all Syrian heritage categories)
 * @description All featured categories from the full Syrian heritage catalog
 */
export const FEATURED_CATEGORIES: Category[] = SYRIAN_CATEGORIES.filter(category => category.featured);

/**
 * Header navigation bar categories
 * @description Exactly 7 general e-commerce categories displayed in the category nav bar (Row 3).
 * "All" button with hamburger icon is rendered separately in the template.
 * These map to browsing-oriented categories for the main navigation.
 *
 * @swagger
 * components:
 *   examples:
 *     HeaderNavCategories:
 *       summary: Categories shown in the header navigation bar
 *       value:
 *         - id: damascus-steel
 *           name: Damascus Steel
 *         - id: electronics
 *           name: Electronics
 *         - id: fashion
 *           name: Fashion
 */
export const HEADER_NAV_CATEGORIES: Category[] = [
  // Damascus Steel - links to existing Syrian heritage category
  SYRIAN_CATEGORIES.find(c => c.id === 'damascus-steel')!,
  // Electronics - deep-browse layout with 7 category groups (pinned in nav)
  {
    id: 'electronics',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    icon: 'devices',
    featured: true,
    url: '/category/electronics',
    megaMenuType: 'deep-browse',
    isPinnedInNav: true,
    megaMenuConfig: {
      /** @audit-fix W-4: Added nameAr for all brand chips for Arabic RTL mode */
      brandChips: [
        { name: 'Samsung', nameAr: 'سامسونج', slug: 'samsung' },
        { name: 'Apple', nameAr: 'آبل', slug: 'apple' },
        { name: 'Xiaomi', nameAr: 'شاومي', slug: 'xiaomi' },
        { name: 'Huawei', nameAr: 'هواوي', slug: 'huawei' },
        { name: 'Oppo', nameAr: 'أوبو', slug: 'oppo' },
        { name: 'Dell', nameAr: 'ديل', slug: 'dell' },
        { name: 'HP', nameAr: 'إتش بي', slug: 'hp' },
        { name: 'Lenovo', nameAr: 'لينوفو', slug: 'lenovo' }
      ]
    },
    subcategories: [
      // Panel 1: Phones & Tablets
      {
        id: 'phones-tablets',
        name: 'Phones & Tablets',
        nameAr: 'هواتف وأجهزة لوحية',
        url: '/category/electronics/phones-tablets',
        icon: 'smartphone',
        showInMegaMenu: true,
        children: [
          { id: 'smartphones', name: 'Smartphones', nameAr: 'هواتف ذكية', url: '/category/electronics/smartphones', showInMegaMenu: true },
          { id: 'samsung-galaxy', name: 'Samsung Galaxy', nameAr: 'سامسونج جالاكسي', url: '/category/electronics/samsung-galaxy', showInMegaMenu: true },
          { id: 'apple-iphone', name: 'Apple iPhone', nameAr: 'آيفون', url: '/category/electronics/apple-iphone', showInMegaMenu: true },
          { id: 'xiaomi-redmi', name: 'Xiaomi / Redmi', nameAr: 'شاومي / ريدمي', url: '/category/electronics/xiaomi-redmi', showInMegaMenu: true },
          { id: 'huawei-phones', name: 'Huawei', nameAr: 'هواوي', url: '/category/electronics/huawei-phones', showInMegaMenu: true },
          { id: 'oppo-realme', name: 'Oppo / Realme', nameAr: 'أوبو / ريلمي', url: '/category/electronics/oppo-realme', showInMegaMenu: true },
          { id: 'budget-phones', name: 'Budget Phones', nameAr: 'هواتف اقتصادية', url: '/category/electronics/budget-phones', showInMegaMenu: true },
          { id: 'tablets', name: 'Tablets', nameAr: 'أجهزة لوحية', url: '/category/electronics/tablets', showInMegaMenu: true },
          { id: 'apple-ipad', name: 'Apple iPad', nameAr: 'آيباد', url: '/category/electronics/apple-ipad', showInMegaMenu: true },
          { id: 'samsung-tab', name: 'Samsung Tab', nameAr: 'سامسونج تاب', url: '/category/electronics/samsung-tab', showInMegaMenu: true },
          { id: 'android-tablets', name: 'Android Tablets', nameAr: 'أجهزة لوحية أندرويد', url: '/category/electronics/android-tablets', showInMegaMenu: true },
          { id: 'kids-tablets', name: 'Kids Tablets', nameAr: 'أجهزة لوحية للأطفال', url: '/category/electronics/kids-tablets', showInMegaMenu: true },
          { id: 'e-readers', name: 'E-Readers', nameAr: 'أجهزة قراءة إلكترونية', url: '/category/electronics/e-readers', showInMegaMenu: true },
          { id: 'phone-cases', name: 'Cases & Covers', nameAr: 'أغطية وحافظات', url: '/category/electronics/phone-cases', showInMegaMenu: true },
          { id: 'screen-protectors', name: 'Screen Protectors', nameAr: 'واقيات شاشة', url: '/category/electronics/screen-protectors', showInMegaMenu: true },
          { id: 'chargers-cables', name: 'Chargers & Cables', nameAr: 'شواحن وكابلات', url: '/category/electronics/chargers-cables', showInMegaMenu: true },
          { id: 'power-banks', name: 'Power Banks', nameAr: 'بطاريات متنقلة', url: '/category/electronics/power-banks', showInMegaMenu: true },
          { id: 'earphones', name: 'Earphones', nameAr: 'سماعات أذن', url: '/category/electronics/earphones', showInMegaMenu: true },
          { id: 'mounts-holders', name: 'Mounts & Holders', nameAr: 'حوامل', url: '/category/electronics/mounts-holders', showInMegaMenu: true }
        ]
      },
      // Panel 2: Computers
      {
        id: 'computers',
        name: 'Computers',
        nameAr: 'حواسيب',
        url: '/category/electronics/computers',
        icon: 'laptop',
        showInMegaMenu: true,
        children: [
          { id: 'gaming-laptops', name: 'Gaming Laptops', nameAr: 'لابتوبات ألعاب', url: '/category/electronics/gaming-laptops', showInMegaMenu: true },
          { id: 'business-laptops', name: 'Business Laptops', nameAr: 'لابتوبات أعمال', url: '/category/electronics/business-laptops', showInMegaMenu: true },
          { id: 'student-laptops', name: 'Student Laptops', nameAr: 'لابتوبات طلابية', url: '/category/electronics/student-laptops', showInMegaMenu: true },
          { id: 'macbooks', name: 'MacBooks', nameAr: 'ماك بوك', url: '/category/electronics/macbooks', showInMegaMenu: true },
          { id: 'chromebooks', name: 'Chromebooks', nameAr: 'كروم بوك', url: '/category/electronics/chromebooks', showInMegaMenu: true },
          { id: 'gaming-pcs', name: 'Gaming PCs', nameAr: 'حواسيب ألعاب', url: '/category/electronics/gaming-pcs', showInMegaMenu: true },
          { id: 'all-in-one', name: 'All-in-One PCs', nameAr: 'حواسيب متكاملة', url: '/category/electronics/all-in-one', showInMegaMenu: true },
          { id: 'mini-pcs', name: 'Mini PCs', nameAr: 'حواسيب صغيرة', url: '/category/electronics/mini-pcs', showInMegaMenu: true },
          { id: 'workstations', name: 'Workstations', nameAr: 'محطات عمل', url: '/category/electronics/workstations', showInMegaMenu: true },
          { id: 'graphics-cards', name: 'Graphics Cards', nameAr: 'بطاقات رسومية', url: '/category/electronics/graphics-cards', showInMegaMenu: true },
          { id: 'processors', name: 'Processors (CPU)', nameAr: 'معالجات', url: '/category/electronics/processors', showInMegaMenu: true },
          { id: 'ram-memory', name: 'RAM / Memory', nameAr: 'ذاكرة وصول عشوائي', url: '/category/electronics/ram-memory', showInMegaMenu: true },
          { id: 'ssd-hdd', name: 'SSD & Hard Drives', nameAr: 'أقراص تخزين', url: '/category/electronics/ssd-hdd', showInMegaMenu: true },
          { id: 'motherboards', name: 'Motherboards', nameAr: 'لوحات أم', url: '/category/electronics/motherboards', showInMegaMenu: true },
          { id: 'power-supplies', name: 'Power Supplies', nameAr: 'وحدات تغذية', url: '/category/electronics/power-supplies', showInMegaMenu: true }
        ]
      },
      // Panel 3: TV & Audio
      {
        id: 'tv-audio',
        name: 'TV & Audio',
        nameAr: 'تلفزيون وصوتيات',
        url: '/category/electronics/tv-audio',
        icon: 'tv',
        showInMegaMenu: true,
        children: [
          { id: 'smart-tvs', name: 'Smart TVs', nameAr: 'تلفزيونات ذكية', url: '/category/electronics/smart-tvs', showInMegaMenu: true },
          { id: 'oled-qled', name: 'OLED / QLED', nameAr: 'أوليد / كيوليد', url: '/category/electronics/oled-qled', showInMegaMenu: true },
          { id: '4k-8k-tvs', name: '4K / 8K TVs', nameAr: 'تلفزيونات فوركي', url: '/category/electronics/4k-8k-tvs', showInMegaMenu: true },
          { id: 'tv-mounts', name: 'TV Mounts & Stands', nameAr: 'حوامل تلفزيون', url: '/category/electronics/tv-mounts', showInMegaMenu: true },
          { id: 'headphones', name: 'Headphones', nameAr: 'سماعات رأس', url: '/category/electronics/headphones', showInMegaMenu: true },
          { id: 'bluetooth-speakers', name: 'Bluetooth Speakers', nameAr: 'مكبرات بلوتوث', url: '/category/electronics/bluetooth-speakers', showInMegaMenu: true },
          { id: 'soundbars', name: 'Soundbars', nameAr: 'مكبرات صوت', url: '/category/electronics/soundbars', showInMegaMenu: true },
          { id: 'home-theater', name: 'Home Theater', nameAr: 'مسرح منزلي', url: '/category/electronics/home-theater', showInMegaMenu: true },
          { id: 'microphones', name: 'Microphones', nameAr: 'ميكروفونات', url: '/category/electronics/microphones', showInMegaMenu: true },
          { id: 'gaming-monitors', name: 'Gaming Monitors', nameAr: 'شاشات ألعاب', url: '/category/electronics/gaming-monitors', showInMegaMenu: true },
          { id: 'office-monitors', name: 'Office Monitors', nameAr: 'شاشات مكتبية', url: '/category/electronics/office-monitors', showInMegaMenu: true },
          { id: 'ultrawide-monitors', name: 'Ultrawide', nameAr: 'شاشات عريضة', url: '/category/electronics/ultrawide-monitors', showInMegaMenu: true },
          { id: '4k-monitors', name: '4K Monitors', nameAr: 'شاشات فوركي', url: '/category/electronics/4k-monitors', showInMegaMenu: true }
        ]
      },
      // Panel 4: Gaming
      {
        id: 'gaming',
        name: 'Gaming',
        nameAr: 'ألعاب',
        url: '/category/electronics/gaming',
        icon: 'sports_esports',
        showInMegaMenu: true,
        children: [
          { id: 'ps5', name: 'PlayStation 5', nameAr: 'بلايستيشن 5', url: '/category/electronics/ps5', showInMegaMenu: true },
          { id: 'xbox', name: 'Xbox Series X|S', nameAr: 'إكس بوكس', url: '/category/electronics/xbox', showInMegaMenu: true },
          { id: 'nintendo-switch', name: 'Nintendo Switch', nameAr: 'نينتندو سويتش', url: '/category/electronics/nintendo-switch', showInMegaMenu: true },
          { id: 'retro-consoles', name: 'Retro Consoles', nameAr: 'أجهزة كلاسيكية', url: '/category/electronics/retro-consoles', showInMegaMenu: true },
          { id: 'gaming-keyboards', name: 'Gaming Keyboards', nameAr: 'لوحات مفاتيح', url: '/category/electronics/gaming-keyboards', showInMegaMenu: true },
          { id: 'gaming-mice', name: 'Gaming Mice', nameAr: 'فأرات ألعاب', url: '/category/electronics/gaming-mice', showInMegaMenu: true },
          { id: 'gaming-headsets', name: 'Gaming Headsets', nameAr: 'سماعات ألعاب', url: '/category/electronics/gaming-headsets', showInMegaMenu: true },
          { id: 'gaming-chairs', name: 'Gaming Chairs', nameAr: 'كراسي ألعاب', url: '/category/electronics/gaming-chairs', showInMegaMenu: true },
          { id: 'streaming-gear', name: 'Streaming Gear', nameAr: 'معدات بث', url: '/category/electronics/streaming-gear', showInMegaMenu: true },
          { id: 'ps5-games', name: 'PS5 Games', nameAr: 'ألعاب بلايستيشن', url: '/category/electronics/ps5-games', showInMegaMenu: true },
          { id: 'xbox-games', name: 'Xbox Games', nameAr: 'ألعاب إكس بوكس', url: '/category/electronics/xbox-games', showInMegaMenu: true },
          { id: 'switch-games', name: 'Switch Games', nameAr: 'ألعاب سويتش', url: '/category/electronics/switch-games', showInMegaMenu: true },
          { id: 'gift-cards', name: 'Gift Cards', nameAr: 'بطاقات هدايا', url: '/category/electronics/gift-cards', showInMegaMenu: true }
        ]
      },
      // Panel 5: Cameras
      {
        id: 'cameras',
        name: 'Cameras',
        nameAr: 'كاميرات',
        url: '/category/electronics/cameras',
        icon: 'photo_camera',
        showInMegaMenu: true,
        children: [
          { id: 'dslr', name: 'DSLR Cameras', nameAr: 'كاميرات دي إس إل آر', url: '/category/electronics/dslr', showInMegaMenu: true },
          { id: 'mirrorless', name: 'Mirrorless', nameAr: 'كاميرات بدون مرآة', url: '/category/electronics/mirrorless', showInMegaMenu: true },
          { id: 'action-cameras', name: 'Action Cameras', nameAr: 'كاميرات أكشن', url: '/category/electronics/action-cameras', showInMegaMenu: true },
          { id: 'instant-cameras', name: 'Instant Cameras', nameAr: 'كاميرات فورية', url: '/category/electronics/instant-cameras', showInMegaMenu: true },
          { id: 'drones', name: 'Drones', nameAr: 'طائرات درون', url: '/category/electronics/drones', showInMegaMenu: true },
          { id: 'camera-lenses', name: 'Camera Lenses', nameAr: 'عدسات كاميرا', url: '/category/electronics/camera-lenses', showInMegaMenu: true },
          { id: 'tripods', name: 'Tripods', nameAr: 'حوامل ثلاثية', url: '/category/electronics/tripods', showInMegaMenu: true },
          { id: 'memory-cards', name: 'Memory Cards', nameAr: 'بطاقات ذاكرة', url: '/category/electronics/memory-cards', showInMegaMenu: true },
          { id: 'camera-bags', name: 'Camera Bags', nameAr: 'حقائب كاميرا', url: '/category/electronics/camera-bags', showInMegaMenu: true },
          { id: 'lighting', name: 'Lighting Equipment', nameAr: 'معدات إضاءة', url: '/category/electronics/lighting', showInMegaMenu: true },
          { id: 'camcorders', name: 'Camcorders', nameAr: 'كاميرات فيديو', url: '/category/electronics/camcorders', showInMegaMenu: true },
          { id: 'webcams', name: 'Webcams', nameAr: 'كاميرات ويب', url: '/category/electronics/webcams', showInMegaMenu: true },
          { id: 'video-editing', name: 'Video Editing', nameAr: 'تحرير فيديو', url: '/category/electronics/video-editing', showInMegaMenu: true },
          { id: 'stabilizers', name: 'Stabilizers', nameAr: 'مثبتات', url: '/category/electronics/stabilizers', showInMegaMenu: true }
        ]
      },
      // Panel 6: Smart Home
      {
        id: 'smart-home',
        name: 'Smart Home',
        nameAr: 'المنزل الذكي',
        url: '/category/electronics/smart-home',
        icon: 'home',
        showInMegaMenu: true,
        children: [
          { id: 'smart-speakers', name: 'Smart Speakers', nameAr: 'مكبرات ذكية', url: '/category/electronics/smart-speakers', showInMegaMenu: true },
          { id: 'smart-displays', name: 'Smart Displays', nameAr: 'شاشات ذكية', url: '/category/electronics/smart-displays', showInMegaMenu: true },
          { id: 'smart-plugs', name: 'Smart Plugs', nameAr: 'قوابس ذكية', url: '/category/electronics/smart-plugs', showInMegaMenu: true },
          { id: 'robot-vacuums', name: 'Robot Vacuums', nameAr: 'مكانس روبوت', url: '/category/electronics/robot-vacuums', showInMegaMenu: true },
          { id: 'security-cameras', name: 'Security Cameras', nameAr: 'كاميرات مراقبة', url: '/category/electronics/security-cameras', showInMegaMenu: true },
          { id: 'video-doorbells', name: 'Video Doorbells', nameAr: 'أجراس فيديو', url: '/category/electronics/video-doorbells', showInMegaMenu: true },
          { id: 'smart-locks', name: 'Smart Locks', nameAr: 'أقفال ذكية', url: '/category/electronics/smart-locks', showInMegaMenu: true },
          { id: 'alarm-systems', name: 'Alarm Systems', nameAr: 'أنظمة إنذار', url: '/category/electronics/alarm-systems', showInMegaMenu: true },
          { id: 'smart-bulbs', name: 'Smart Bulbs', nameAr: 'مصابيح ذكية', url: '/category/electronics/smart-bulbs', showInMegaMenu: true },
          { id: 'led-strips', name: 'LED Strips', nameAr: 'شرائط ليد', url: '/category/electronics/led-strips', showInMegaMenu: true },
          { id: 'smart-thermostats', name: 'Smart Thermostats', nameAr: 'ثرموستات ذكية', url: '/category/electronics/smart-thermostats', showInMegaMenu: true },
          { id: 'air-purifiers', name: 'Air Purifiers', nameAr: 'منقيات هواء', url: '/category/electronics/air-purifiers', showInMegaMenu: true }
        ]
      },
      // Panel 7: Accessories
      // @audit-fix W-6: Renamed from 'accessories' to 'electronics-accessories' to avoid
      // duplicate ID collision with fashion accessories or other category 'accessories'
      {
        id: 'electronics-accessories',
        name: 'Accessories',
        nameAr: 'إكسسوارات',
        url: '/category/electronics/accessories',
        icon: 'cable',
        showInMegaMenu: true,
        children: [
          { id: 'smartwatches', name: 'Smartwatches', nameAr: 'ساعات ذكية', url: '/category/electronics/smartwatches', showInMegaMenu: true },
          { id: 'fitness-trackers', name: 'Fitness Trackers', nameAr: 'أجهزة لياقة', url: '/category/electronics/fitness-trackers', showInMegaMenu: true },
          { id: 'vr-headsets', name: 'VR Headsets', nameAr: 'نظارات واقع افتراضي', url: '/category/electronics/vr-headsets', showInMegaMenu: true },
          { id: 'smart-glasses', name: 'Smart Glasses', nameAr: 'نظارات ذكية', url: '/category/electronics/smart-glasses', showInMegaMenu: true },
          { id: 'power-banks-acc', name: 'Power Banks', nameAr: 'بطاريات متنقلة', url: '/category/electronics/power-banks-acc', showInMegaMenu: true },
          { id: 'usb-flash', name: 'USB Flash Drives', nameAr: 'فلاش ميموري', url: '/category/electronics/usb-flash', showInMegaMenu: true },
          { id: 'external-drives', name: 'External Hard Drives', nameAr: 'أقراص خارجية', url: '/category/electronics/external-drives', showInMegaMenu: true },
          { id: 'ups-surge', name: 'UPS / Surge Protectors', nameAr: 'وحدات طاقة احتياطية', url: '/category/electronics/ups-surge', showInMegaMenu: true },
          { id: 'routers', name: 'Routers & Modems', nameAr: 'راوترات ومودم', url: '/category/electronics/routers', showInMegaMenu: true },
          { id: 'usb-hubs', name: 'USB Hubs', nameAr: 'موزعات يو إس بي', url: '/category/electronics/usb-hubs', showInMegaMenu: true },
          { id: 'adapters-cables', name: 'Adapters & Cables', nameAr: 'محولات وكابلات', url: '/category/electronics/adapters-cables', showInMegaMenu: true },
          { id: 'bluetooth-receivers', name: 'Bluetooth Receivers', nameAr: 'مستقبلات بلوتوث', url: '/category/electronics/bluetooth-receivers', showInMegaMenu: true }
        ]
      }
    ]
  },
  // Fashion - new general e-commerce category
  {
    id: 'fashion',
    name: 'Fashion',
    nameAr: 'أزياء',
    icon: 'checkroom',
    featured: true,
    url: '/category/fashion',
    megaMenuType: 'fullwidth',
    menuColumns: [
      {
        title: 'Women',
        titleAr: 'نساء',
        links: [
          { name: 'Dresses', nameAr: 'فساتين', url: '/category/fashion/women-dresses', icon: 'woman' },
          { name: 'Abayas & Modest', nameAr: 'عباءات ومحتشمات', url: '/category/fashion/abayas', icon: 'checkroom' },
          { name: 'Accessories', nameAr: 'إكسسوارات', url: '/category/fashion/women-accessories', icon: 'diamond' }
        ]
      },
      {
        title: 'Men',
        titleAr: 'رجال',
        links: [
          { name: 'Shirts & Tops', nameAr: 'قمصان', url: '/category/fashion/men-shirts', icon: 'dry_cleaning' },
          { name: 'Traditional Wear', nameAr: 'ملابس تراثية', url: '/category/fashion/traditional-wear', icon: 'checkroom' }
        ]
      },
      {
        title: 'Kids',
        titleAr: 'أطفال',
        links: [
          { name: 'Boys', nameAr: 'أولاد', url: '/category/fashion/boys', icon: 'boy' },
          { name: 'Girls', nameAr: 'بنات', url: '/category/fashion/girls', icon: 'girl' }
        ]
      }
    ],
    featuredTiles: [
      { name: 'Women', nameAr: 'نساء', icon: 'woman', bgColor: 'bg-pink-50', iconColor: 'text-pink-500', url: '/category/fashion/women-dresses' },
      { name: 'Men', nameAr: 'رجال', icon: 'man', bgColor: 'bg-blue-50', iconColor: 'text-blue-500', url: '/category/fashion/men-shirts' },
      { name: 'Kids', nameAr: 'أطفال', icon: 'child_care', bgColor: 'bg-green-50', iconColor: 'text-green-500', url: '/category/fashion/boys' },
      { name: 'Traditional', nameAr: 'تراثي', icon: 'checkroom', bgColor: 'bg-amber-50', iconColor: 'text-amber-600', url: '/category/fashion/traditional-wear' }
    ],
    subcategories: [
      { id: 'women-dresses', name: 'Women\'s Dresses', nameAr: 'فساتين نسائية', url: '/category/fashion/women-dresses', icon: 'woman' },
      { id: 'abayas', name: 'Abayas & Modest', nameAr: 'عباءات ومحتشمات', url: '/category/fashion/abayas', icon: 'checkroom' },
      { id: 'men-shirts', name: 'Men\'s Shirts', nameAr: 'قمصان رجالية', url: '/category/fashion/men-shirts', icon: 'dry_cleaning' },
      { id: 'traditional-wear', name: 'Traditional Wear', nameAr: 'ملابس تراثية', url: '/category/fashion/traditional-wear', icon: 'checkroom' },
      { id: 'shoes', name: 'Shoes & Footwear', nameAr: 'أحذية', url: '/category/fashion/shoes', icon: 'steps' }
    ]
  },
  // Home & Living - new general e-commerce category
  {
    id: 'home-living',
    name: 'Home & Living',
    nameAr: 'المنزل والمعيشة',
    icon: 'home',
    featured: true,
    url: '/category/home-living',
    megaMenuType: 'fullwidth',
    menuColumns: [
      {
        title: 'Furniture',
        titleAr: 'أثاث',
        links: [
          { name: 'Living Room', nameAr: 'غرفة المعيشة', url: '/category/home-living/living-room', icon: 'weekend' },
          { name: 'Bedroom', nameAr: 'غرفة النوم', url: '/category/home-living/bedroom', icon: 'bed' }
        ]
      },
      {
        title: 'Decor',
        titleAr: 'ديكور',
        links: [
          { name: 'Syrian Mosaics', nameAr: 'فسيفساء سورية', url: '/category/home-living/syrian-mosaics', icon: 'dashboard' },
          { name: 'Rugs & Carpets', nameAr: 'سجاد', url: '/category/home-living/rugs', icon: 'texture' }
        ]
      },
      {
        title: 'Kitchen',
        titleAr: 'مطبخ',
        links: [
          { name: 'Cookware', nameAr: 'أواني طبخ', url: '/category/home-living/cookware', icon: 'soup_kitchen' },
          { name: 'Tableware', nameAr: 'أدوات مائدة', url: '/category/home-living/tableware', icon: 'restaurant' }
        ]
      }
    ],
    featuredTiles: [
      { name: 'Living', nameAr: 'معيشة', icon: 'weekend', bgColor: 'bg-amber-50', iconColor: 'text-amber-600', url: '/category/home-living/living-room' },
      { name: 'Bedroom', nameAr: 'نوم', icon: 'bed', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500', url: '/category/home-living/bedroom' },
      { name: 'Kitchen', nameAr: 'مطبخ', icon: 'soup_kitchen', bgColor: 'bg-orange-50', iconColor: 'text-orange-500', url: '/category/home-living/cookware' },
      { name: 'Decor', nameAr: 'ديكور', icon: 'dashboard', bgColor: 'bg-teal-50', iconColor: 'text-teal-500', url: '/category/home-living/syrian-mosaics' }
    ],
    subcategories: [
      { id: 'living-room', name: 'Living Room', nameAr: 'غرفة المعيشة', url: '/category/home-living/living-room', icon: 'weekend' },
      { id: 'bedroom', name: 'Bedroom', nameAr: 'غرفة النوم', url: '/category/home-living/bedroom', icon: 'bed' },
      { id: 'syrian-mosaics', name: 'Syrian Mosaics', nameAr: 'فسيفساء سورية', url: '/category/home-living/syrian-mosaics', icon: 'dashboard' },
      { id: 'rugs', name: 'Rugs & Carpets', nameAr: 'سجاد', url: '/category/home-living/rugs', icon: 'texture' },
      { id: 'cookware', name: 'Cookware', nameAr: 'أواني طبخ', url: '/category/home-living/cookware', icon: 'soup_kitchen' },
      { id: 'tableware', name: 'Tableware', nameAr: 'أدوات مائدة', url: '/category/home-living/tableware', icon: 'restaurant' }
    ]
  },
  // Food & Groceries - mapped from existing Food & Spices + Nuts & Snacks
  {
    id: 'food-groceries',
    name: 'Food & Groceries',
    nameAr: 'طعام وبقالة',
    icon: 'shopping_basket',
    featured: true,
    url: '/category/food-groceries',
    megaMenuType: 'sidebar',
    subcategories: [
      ...(SYRIAN_CATEGORIES.find(c => c.id === 'food-spices')?.subcategories || []),
      ...(SYRIAN_CATEGORIES.find(c => c.id === 'nuts-snacks')?.subcategories || []),
      ...(SYRIAN_CATEGORIES.find(c => c.id === 'sweets-desserts')?.subcategories?.slice(0, 3) || [])
    ]
  },
  // Beauty - mapped from existing Beauty & Wellness
  {
    ...SYRIAN_CATEGORIES.find(c => c.id === 'beauty-wellness')!,
    id: 'beauty',
    name: 'Beauty',
    nameAr: 'جمال',
    url: '/category/beauty'
  },
  // Artisan Crafts - mapped from existing Traditional Crafts + Jewelry
  {
    id: 'artisan-crafts',
    name: 'Artisan Crafts',
    nameAr: 'حرف يدوية',
    icon: 'palette',
    featured: true,
    url: '/category/artisan-crafts',
    megaMenuType: 'sidebar',
    subcategories: [
      ...(SYRIAN_CATEGORIES.find(c => c.id === 'traditional-crafts')?.subcategories || []),
      ...(SYRIAN_CATEGORIES.find(c => c.id === 'jewelry-accessories')?.subcategories?.slice(0, 3) || [])
    ]
  }
];

/**
 * Category mapping by ID for quick lookup
 * @description Map for efficient category retrieval by ID
 */
export const CATEGORY_MAP: Record<string, Category> = SYRIAN_CATEGORIES.reduce((map, category) => {
  map[category.id] = category;
  return map;
}, {} as Record<string, Category>);

/**
 * Gets category by ID
 * @description Utility function to retrieve category by ID
 * @param categoryId - Category ID to lookup
 * @returns Category object or undefined if not found
 */
export function getCategoryById(categoryId: string): Category | undefined {
  return CATEGORY_MAP[categoryId];
}

/**
 * Gets subcategories for a category
 * @description Utility function to get all subcategories for a category
 * @param categoryId - Category ID to get subcategories for
 * @returns Array of subcategories or empty array
 */
export function getSubcategoriesByCategory(categoryId: string): Category['subcategories'] {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
}

/**
 * Searches categories by name
 * @description Utility function to search categories by name (English or Arabic)
 * @param searchTerm - Search term to match against
 * @param language - Language preference ('en' | 'ar')
 * @returns Array of matching categories
 */
export function searchCategories(searchTerm: string, language: 'en' | 'ar' = 'en'): Category[] {
  const lowerSearchTerm = searchTerm.toLowerCase();

  return SYRIAN_CATEGORIES.filter(category => {
    const name = language === 'ar' ? category.nameAr : category.name;
    return name.toLowerCase().includes(lowerSearchTerm);
  });
}
