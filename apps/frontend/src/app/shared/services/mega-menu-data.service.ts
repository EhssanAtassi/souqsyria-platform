/**
 * @fileoverview Mega Menu Data Service for SouqSyria
 * @description Service providing dynamic category-specific mega menu data
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @swagger
 * components:
 *   schemas:
 *     MegaMenuDataService:
 *       type: object
 *       properties:
 *         getMegaMenuData:
 *           type: function
 *           description: Gets mega menu data for specific category
 *         getAllMegaMenuCategories:
 *           type: function
 *           description: Gets all available mega menu categories
 *         hasMegaMenuData:
 *           type: function
 *           description: Checks if category has mega menu data
 */

import { Injectable } from '@angular/core';
import { MegaMenuCategory } from '../interfaces/mega-menu.interface';

/**
 * SouqSyria Mega Menu Data Service
 * 
 * @description
 * Provides dynamic category-specific content for mega menu display.
 * Features include:
 * - Category-specific subcategory organization
 * - Localized content in English and Arabic
 * - Special offers tailored to each category
 * - Mock data structure for development and testing
 * - Syrian e-commerce category structure
 * 
 * @example
 * ```typescript
 * constructor(private megaMenuData: MegaMenuDataService) {}
 * 
 * ngOnInit() {
 *   const electronicsData = this.megaMenuData.getMegaMenuData('electronics');
 *   if (electronicsData) {
 *     this.displayMegaMenu(electronicsData);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MegaMenuDataService {

  /**
   * Mock data for dynamic mega menu categories
   * @description Comprehensive category-specific mega menu data for Syrian e-commerce
   * @private
   */
  private readonly megaMenuData: Record<string, MegaMenuCategory> = {
    
    /** Electronics Category Data */
    'electronics': {
      id: 'electronics',
      name: 'Electronics',
      nameAr: 'الإلكترونيات',
      icon: 'devices',
      columns: [
        {
          title: 'Mobile & Computing',
          titleAr: 'الهواتف والحاسوب',
          items: [
            { name: 'Smartphones', nameAr: 'الهواتف الذكية', url: '/electronics/smartphones', isPopular: true },
            { name: 'Laptops', nameAr: 'أجهزة الكمبيوتر المحمولة', url: '/electronics/laptops', isPopular: true },
            { name: 'Tablets', nameAr: 'الأجهزة اللوحية', url: '/electronics/tablets' },
            { name: 'Phone Accessories', nameAr: 'إكسسوارات الهواتف', url: '/electronics/phone-accessories' },
            { name: 'Laptop Bags', nameAr: 'حقائب الكمبيوتر المحمول', url: '/electronics/laptop-bags' }
          ]
        },
        {
          title: 'Audio & Visual',
          titleAr: 'الصوت والمرئيات',
          items: [
            { name: 'TVs & Monitors', nameAr: 'أجهزة التلفزيون والشاشات', url: '/electronics/tvs-monitors' },
            { name: 'Audio Systems', nameAr: 'أنظمة الصوت', url: '/electronics/audio' },
            { name: 'Gaming Consoles', nameAr: 'أجهزة الألعاب', url: '/electronics/gaming', isNew: true },
            { name: 'Cameras', nameAr: 'الكاميرات', url: '/electronics/cameras' },
            { name: 'Projectors', nameAr: 'أجهزة العرض', url: '/electronics/projectors' }
          ]
        },
        {
          title: 'Smart Home & Tech',
          titleAr: 'المنزل الذكي والتقنية',
          items: [
            { name: 'Smart Home Devices', nameAr: 'أجهزة المنزل الذكي', url: '/electronics/smart-home', isNew: true },
            { name: 'Wearable Tech', nameAr: 'التكنولوجيا القابلة للارتداء', url: '/electronics/wearables' },
            { name: 'Computer Components', nameAr: 'مكونات الكمبيوتر', url: '/electronics/components' },
            { name: 'Power & Cables', nameAr: 'الطاقة والكابلات', url: '/electronics/power-cables' },
            { name: 'Storage Devices', nameAr: 'أجهزة التخزين', url: '/electronics/storage' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Gaming Laptops Sale',
          titleAr: 'تخفيضات أجهزة الكمبيوتر للألعاب',
          description: 'Up to 40% off gaming laptops',
          descriptionAr: 'خصومات تصل إلى ٤٠٪ على أجهزة الألعاب',
          imageUrl: '/assets/offers/gaming-laptops.jpg',
          link: '/offers/gaming-laptops',
          backgroundColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
          discount: '40%'
        },
        {
          title: 'Latest Smartphones',
          titleAr: 'أحدث الهواتف الذكية',
          description: 'New arrivals with warranty',
          descriptionAr: 'وصل حديثاً مع الضمان',
          imageUrl: '/assets/offers/smartphones.jpg',
          link: '/electronics/smartphones/new',
          backgroundColor: 'bg-gradient-to-r from-green-500 to-blue-500'
        }
      ]
    },

    /** Fashion Category Data */
    'fashion': {
      id: 'fashion',
      name: 'Fashion',
      nameAr: 'الأزياء',
      icon: 'checkroom',
      columns: [
        {
          title: 'Clothing',
          titleAr: 'الملابس',
          items: [
            { name: "Men's Clothing", nameAr: 'ملابس رجالية', url: '/fashion/men', isPopular: true },
            { name: "Women's Clothing", nameAr: 'ملابس نسائية', url: '/fashion/women', isPopular: true },
            { name: "Kids' Clothing", nameAr: 'ملابس أطفال', url: '/fashion/kids' },
            { name: 'Traditional Wear', nameAr: 'الملابس التراثية', url: '/fashion/traditional' },
            { name: 'Formal Wear', nameAr: 'الملابس الرسمية', url: '/fashion/formal' }
          ]
        },
        {
          title: 'Accessories',
          titleAr: 'الإكسسوارات',
          items: [
            { name: 'Shoes', nameAr: 'الأحذية', url: '/fashion/shoes', isPopular: true },
            { name: 'Bags & Handbags', nameAr: 'الحقائب', url: '/fashion/bags' },
            { name: 'Belts & Wallets', nameAr: 'الأحزمة والمحافظ', url: '/fashion/belts-wallets' },
            { name: 'Hats & Caps', nameAr: 'القبعات', url: '/fashion/hats' },
            { name: 'Scarves', nameAr: 'الأوشحة', url: '/fashion/scarves' }
          ]
        },
        {
          title: 'Jewelry & Beauty',
          titleAr: 'المجوهرات والجمال',
          items: [
            { name: 'Jewelry', nameAr: 'المجوهرات', url: '/fashion/jewelry' },
            { name: 'Watches', nameAr: 'الساعات', url: '/fashion/watches' },
            { name: 'Sunglasses', nameAr: 'النظارات الشمسية', url: '/fashion/sunglasses', isNew: true },
            { name: 'Activewear', nameAr: 'الملابس الرياضية', url: '/fashion/activewear' },
            { name: 'Underwear', nameAr: 'الملابس الداخلية', url: '/fashion/underwear' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Summer Collection',
          titleAr: 'مجموعة الصيف',
          description: 'New summer styles available',
          descriptionAr: 'تشكيلة جديدة لفصل الصيف',
          imageUrl: '/assets/offers/summer-fashion.jpg',
          link: '/fashion/summer-collection',
          backgroundColor: 'bg-gradient-to-r from-pink-400 to-orange-400',
          discount: 'New'
        },
        {
          title: 'Designer Brands',
          titleAr: 'العلامات التجارية المصممة',
          description: 'Premium brands at great prices',
          descriptionAr: 'علامات تجارية مميزة بأسعار رائعة',
          imageUrl: '/assets/offers/designer-brands.jpg',
          link: '/fashion/designer',
          backgroundColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
        }
      ]
    },

    /** Home & Garden Category Data */
    'home-garden': {
      id: 'home-garden',
      name: 'Home & Garden',
      nameAr: 'المنزل والحديقة',
      icon: 'home',
      columns: [
        {
          title: 'Furniture',
          titleAr: 'الأثاث',
          items: [
            { name: 'Living Room Furniture', nameAr: 'أثاث غرفة المعيشة', url: '/home/living-room', isPopular: true },
            { name: 'Bedroom Furniture', nameAr: 'أثاث غرفة النوم', url: '/home/bedroom' },
            { name: 'Kitchen Furniture', nameAr: 'أثاث المطبخ', url: '/home/kitchen-furniture' },
            { name: 'Office Furniture', nameAr: 'أثاث المكتب', url: '/home/office' },
            { name: 'Storage Solutions', nameAr: 'حلول التخزين', url: '/home/storage' }
          ]
        },
        {
          title: 'Home Appliances',
          titleAr: 'الأجهزة المنزلية',
          items: [
            { name: 'Kitchen Appliances', nameAr: 'أجهزة المطبخ', url: '/home/kitchen-appliances', isPopular: true },
            { name: 'Cleaning Appliances', nameAr: 'أجهزة التنظيف', url: '/home/cleaning' },
            { name: 'Air Conditioning', nameAr: 'أجهزة التكييف', url: '/home/ac' },
            { name: 'Water Heaters', nameAr: 'سخانات المياه', url: '/home/water-heaters' },
            { name: 'Home Security', nameAr: 'أمن المنزل', url: '/home/security', isNew: true }
          ]
        },
        {
          title: 'Garden & Outdoor',
          titleAr: 'الحديقة والهواء الطلق',
          items: [
            { name: 'Garden Tools', nameAr: 'أدوات الحديقة', url: '/garden/tools' },
            { name: 'Outdoor Furniture', nameAr: 'أثاث خارجي', url: '/garden/furniture' },
            { name: 'Plants & Seeds', nameAr: 'النباتات والبذور', url: '/garden/plants' },
            { name: 'Garden Lighting', nameAr: 'إضاءة الحديقة', url: '/garden/lighting' },
            { name: 'BBQ & Grills', nameAr: 'الشواء والمشاوي', url: '/garden/bbq' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Furniture Sets',
          titleAr: 'مجموعات الأثاث',
          description: 'Complete room sets with discounts',
          descriptionAr: 'مجموعات غرف كاملة مع خصومات',
          imageUrl: '/assets/offers/furniture-sets.jpg',
          link: '/offers/furniture-sets',
          backgroundColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
          discount: '25%'
        },
        {
          title: 'Garden Tools Sale',
          titleAr: 'تخفيضات أدوات الحديقة',
          description: 'Spring gardening essentials',
          descriptionAr: 'أساسيات البستنة للربيع',
          imageUrl: '/assets/offers/garden-tools.jpg',
          link: '/garden/tools/sale',
          backgroundColor: 'bg-gradient-to-r from-green-400 to-emerald-500'
        }
      ]
    },

    /** Sports & Outdoors Category Data */
    'sports': {
      id: 'sports',
      name: 'Sports & Outdoors',
      nameAr: 'الرياضة والأنشطة الخارجية',
      icon: 'sports_soccer',
      columns: [
        {
          title: 'Fitness & Gym',
          titleAr: 'اللياقة والجيم',
          items: [
            { name: 'Fitness Equipment', nameAr: 'معدات اللياقة', url: '/sports/fitness', isPopular: true },
            { name: 'Gym Accessories', nameAr: 'إكسسوارات الجيم', url: '/sports/gym-accessories' },
            { name: 'Home Gym', nameAr: 'الجيم المنزلي', url: '/sports/home-gym' },
            { name: 'Yoga & Pilates', nameAr: 'اليوغا والبيلاتس', url: '/sports/yoga' },
            { name: 'Sports Nutrition', nameAr: 'التغذية الرياضية', url: '/sports/nutrition' }
          ]
        },
        {
          title: 'Outdoor Activities',
          titleAr: 'الأنشطة الخارجية',
          items: [
            { name: 'Camping Gear', nameAr: 'معدات التخييم', url: '/sports/camping', isPopular: true },
            { name: 'Hiking Equipment', nameAr: 'معدات المشي', url: '/sports/hiking' },
            { name: 'Fishing Gear', nameAr: 'معدات الصيد', url: '/sports/fishing' },
            { name: 'Outdoor Clothing', nameAr: 'ملابس خارجية', url: '/sports/outdoor-clothing' },
            { name: 'Backpacks', nameAr: 'حقائب الظهر', url: '/sports/backpacks' }
          ]
        },
        {
          title: 'Team Sports',
          titleAr: 'الرياضات الجماعية',
          items: [
            { name: 'Football (Soccer)', nameAr: 'كرة القدم', url: '/sports/football', isPopular: true },
            { name: 'Basketball', nameAr: 'كرة السلة', url: '/sports/basketball' },
            { name: 'Swimming', nameAr: 'السباحة', url: '/sports/swimming' },
            { name: 'Tennis & Badminton', nameAr: 'التنس وكرة الريشة', url: '/sports/racquet' },
            { name: 'Cycling', nameAr: 'ركوب الدراجات', url: '/sports/cycling' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Fitness Equipment Sale',
          titleAr: 'تخفيضات معدات اللياقة',
          description: 'Home fitness gear up to 35% off',
          descriptionAr: 'معدات اللياقة المنزلية خصم ٣٥٪',
          imageUrl: '/assets/offers/fitness-equipment.jpg',
          link: '/sports/fitness/sale',
          backgroundColor: 'bg-gradient-to-r from-red-500 to-orange-500',
          discount: '35%'
        },
        {
          title: 'Outdoor Gear',
          titleAr: 'معدات الهواء الطلق',
          description: 'Summer outdoor essentials',
          descriptionAr: 'أساسيات الصيف الخارجية',
          imageUrl: '/assets/offers/outdoor-gear.jpg',
          link: '/sports/outdoor/summer',
          backgroundColor: 'bg-gradient-to-r from-teal-500 to-blue-500'
        }
      ]
    },

    /** Health & Beauty Category Data */
    'health-beauty': {
      id: 'health-beauty',
      name: 'Health & Beauty',
      nameAr: 'الصحة والجمال',
      icon: 'spa',
      columns: [
        {
          title: 'Skincare & Cosmetics',
          titleAr: 'العناية بالبشرة ومستحضرات التجميل',
          items: [
            { name: 'Skincare Products', nameAr: 'منتجات العناية بالبشرة', url: '/beauty/skincare', isPopular: true },
            { name: 'Makeup & Cosmetics', nameAr: 'المكياج ومستحضرات التجميل', url: '/beauty/makeup' },
            { name: 'Face Masks', nameAr: 'أقنعة الوجه', url: '/beauty/face-masks' },
            { name: 'Anti-Aging', nameAr: 'مكافحة الشيخوخة', url: '/beauty/anti-aging' },
            { name: 'Sun Care', nameAr: 'واقي الشمس', url: '/beauty/sun-care' }
          ]
        },
        {
          title: 'Health & Wellness',
          titleAr: 'الصحة والعافية',
          items: [
            { name: 'Health Supplements', nameAr: 'المكملات الصحية', url: '/health/supplements', isPopular: true },
            { name: 'Vitamins & Minerals', nameAr: 'الفيتامينات والمعادن', url: '/health/vitamins' },
            { name: 'Personal Care', nameAr: 'العناية الشخصية', url: '/health/personal-care' },
            { name: 'First Aid', nameAr: 'الإسعافات الأولية', url: '/health/first-aid' },
            { name: 'Medical Devices', nameAr: 'الأجهزة الطبية', url: '/health/medical-devices', isNew: true }
          ]
        },
        {
          title: 'Hair & Fragrance',
          titleAr: 'الشعر والعطور',
          items: [
            { name: 'Hair Care', nameAr: 'العناية بالشعر', url: '/beauty/hair-care' },
            { name: 'Hair Styling Tools', nameAr: 'أدوات تصفيف الشعر', url: '/beauty/hair-styling' },
            { name: 'Fragrances', nameAr: 'العطور', url: '/beauty/fragrances', isPopular: true },
            { name: 'Body Care', nameAr: 'العناية بالجسم', url: '/beauty/body-care' },
            { name: 'Oral Care', nameAr: 'العناية بالفم', url: '/beauty/oral-care' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Beauty Sets',
          titleAr: 'مجموعات الجمال',
          description: 'Complete beauty sets with savings',
          descriptionAr: 'مجموعات جمال كاملة مع وفورات',
          imageUrl: '/assets/offers/beauty-sets.jpg',
          link: '/beauty/sets',
          backgroundColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
          discount: '30%'
        },
        {
          title: 'Health Supplements',
          titleAr: 'المكملات الصحية',
          description: 'Premium health supplements',
          descriptionAr: 'مكملات صحية مميزة',
          imageUrl: '/assets/offers/health-supplements.jpg',
          link: '/health/supplements/premium',
          backgroundColor: 'bg-gradient-to-r from-green-500 to-teal-500'
        }
      ]
    },

    /** Books Category Data */
    'books': {
      id: 'books',
      name: 'Books',
      nameAr: 'الكتب',
      icon: 'menu_book',
      columns: [
        {
          title: 'Literature',
          titleAr: 'الأدب',
          items: [
            { name: 'Fiction', nameAr: 'الخيال', url: '/books/fiction', isPopular: true },
            { name: 'Non-Fiction', nameAr: 'غير الخيالي', url: '/books/non-fiction' },
            { name: 'Poetry', nameAr: 'الشعر', url: '/books/poetry' },
            { name: 'Biographies', nameAr: 'السير الذاتية', url: '/books/biographies' },
            { name: 'History', nameAr: 'التاريخ', url: '/books/history' }
          ]
        },
        {
          title: 'Educational',
          titleAr: 'التعليمية',
          items: [
            { name: 'Academic Books', nameAr: 'الكتب الأكاديمية', url: '/books/academic', isPopular: true },
            { name: 'Language Learning', nameAr: 'تعلم اللغات', url: '/books/language' },
            { name: 'Test Preparation', nameAr: 'التحضير للامتحانات', url: '/books/test-prep' },
            { name: 'Reference Books', nameAr: 'كتب مرجعية', url: '/books/reference' },
            { name: 'Science & Technology', nameAr: 'العلوم والتكنولوجيا', url: '/books/science-tech' }
          ]
        },
        {
          title: 'Children & Digital',
          titleAr: 'الأطفال والرقمية',
          items: [
            { name: "Children's Books", nameAr: 'كتب الأطفال', url: '/books/children' },
            { name: 'Comics & Manga', nameAr: 'الكوميكس والمانجا', url: '/books/comics' },
            { name: 'E-books', nameAr: 'الكتب الإلكترونية', url: '/books/ebooks', isNew: true },
            { name: 'Audiobooks', nameAr: 'الكتب الصوتية', url: '/books/audiobooks', isNew: true },
            { name: 'Magazines', nameAr: 'المجلات', url: '/books/magazines' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Bestsellers',
          titleAr: 'الأكثر مبيعاً',
          description: 'Top selling books this month',
          descriptionAr: 'الكتب الأكثر مبيعاً هذا الشهر',
          imageUrl: '/assets/offers/bestsellers.jpg',
          link: '/books/bestsellers',
          backgroundColor: 'bg-gradient-to-r from-indigo-500 to-purple-500'
        },
        {
          title: 'Educational Materials',
          titleAr: 'المواد التعليمية',
          description: 'Academic books and resources',
          descriptionAr: 'الكتب والمواد الأكاديمية',
          imageUrl: '/assets/offers/educational.jpg',
          link: '/books/educational/sale',
          backgroundColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          discount: '20%'
        }
      ]
    }
  };

  /**
   * Gets mega menu data for a specific category
   * @description Retrieves category-specific mega menu content
   * @param categoryId - The category identifier
   * @returns Mega menu data for the category or null if not found
   */
  getMegaMenuData(categoryId: string): MegaMenuCategory | null {
    return this.megaMenuData[categoryId] || null;
  }

  /**
   * Gets all available mega menu categories
   * @description Returns array of all categories with mega menu data
   * @returns Array of all mega menu categories
   */
  getAllMegaMenuCategories(): MegaMenuCategory[] {
    return Object.values(this.megaMenuData);
  }

  /**
   * Checks if category has mega menu data
   * @description Determines if a category has specific mega menu content
   * @param categoryId - The category identifier to check
   * @returns True if category has mega menu data
   */
  hasMegaMenuData(categoryId: string): boolean {
    return categoryId in this.megaMenuData;
  }

  /**
   * Gets default fallback mega menu data
   * @description Returns default mega menu when category-specific data is unavailable
   * @returns Default mega menu category data
   */
  getDefaultMegaMenuData(): MegaMenuCategory {
    return {
      id: 'default',
      name: 'All Categories',
      nameAr: 'جميع الفئات',
      icon: 'category',
      columns: [
        {
          title: 'Popular Categories',
          titleAr: 'الفئات الشائعة',
          items: [
            { name: 'Electronics', nameAr: 'الإلكترونيات', url: '/electronics' },
            { name: 'Fashion', nameAr: 'الأزياء', url: '/fashion' },
            { name: 'Home & Garden', nameAr: 'المنزل والحديقة', url: '/home-garden' },
            { name: 'Sports & Outdoors', nameAr: 'الرياضة والهواء الطلق', url: '/sports' }
          ]
        },
        {
          title: 'More Categories',
          titleAr: 'فئات أخرى',
          items: [
            { name: 'Health & Beauty', nameAr: 'الصحة والجمال', url: '/health-beauty' },
            { name: 'Books', nameAr: 'الكتب', url: '/books' },
            { name: 'Automotive', nameAr: 'السيارات', url: '/automotive' },
            { name: 'Services', nameAr: 'الخدمات', url: '/services' }
          ]
        }
      ],
      specialOffers: [
        {
          title: 'Special Deals',
          titleAr: 'عروض خاصة',
          description: 'Great deals across all categories',
          descriptionAr: 'عروض رائعة في جميع الفئات',
          imageUrl: '/assets/offers/general-deals.jpg',
          link: '/offers',
          backgroundColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
        }
      ]
    };
  }

  /**
   * Gets category mega menu data with fallback
   * @description Gets specific category data or returns default if not found
   * @param categoryId - The category identifier
   * @returns Mega menu data (specific or default)
   */
  getMegaMenuDataWithFallback(categoryId: string): MegaMenuCategory {
    return this.getMegaMenuData(categoryId) || this.getDefaultMegaMenuData();
  }

  /**
   * Searches for subcategories across all categories
   * @description Finds subcategories matching search query
   * @param query - Search query string
   * @returns Array of matching subcategory items
   */
  searchSubcategories(query: string): Array<{ categoryId: string; item: any }> {
    const results: Array<{ categoryId: string; item: any }> = [];
    const searchTerm = query.toLowerCase();

    Object.entries(this.megaMenuData).forEach(([categoryId, category]) => {
      category.columns.forEach(column => {
        column.items.forEach(item => {
          if (
            item.name.toLowerCase().includes(searchTerm) ||
            item.nameAr.includes(searchTerm)
          ) {
            results.push({ categoryId, item });
          }
        });
      });
    });

    return results;
  }
}