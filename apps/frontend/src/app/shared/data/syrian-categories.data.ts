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
  // Electronics - new general e-commerce category
  {
    id: 'electronics',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    icon: 'devices',
    featured: true,
    url: '/category/electronics',
    megaMenuType: 'sidebar',
    subcategories: [
      { id: 'smartphones', name: 'Smartphones', nameAr: 'هواتف ذكية', url: '/category/electronics/smartphones', icon: 'smartphone' },
      { id: 'laptops', name: 'Laptops & Computers', nameAr: 'حواسيب محمولة', url: '/category/electronics/laptops', icon: 'laptop' },
      { id: 'tablets', name: 'Tablets', nameAr: 'أجهزة لوحية', url: '/category/electronics/tablets', icon: 'tablet' },
      { id: 'audio', name: 'Audio & Headphones', nameAr: 'سماعات وصوتيات', url: '/category/electronics/audio', icon: 'headphones' },
      { id: 'cameras', name: 'Cameras & Photography', nameAr: 'كاميرات وتصوير', url: '/category/electronics/cameras', icon: 'photo_camera' },
      { id: 'accessories', name: 'Accessories', nameAr: 'إكسسوارات', url: '/category/electronics/accessories', icon: 'cable' }
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
