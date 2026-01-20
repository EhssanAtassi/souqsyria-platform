/**
 * Mock Campaign Data for SouqSyria Syrian Marketplace
 *
 * Provides sample campaigns with authentic Syrian cultural content for:
 * - Hero section testing and development
 * - Campaign system demonstration
 * - Syrian marketplace showcase
 * - Bilingual content examples (Arabic/English)
 *
 * @swagger
 * components:
 *   schemas:
 *     MockCampaignData:
 *       type: object
 *       description: Sample campaign data for Syrian marketplace
 */

import { Campaign, CampaignTemplate } from '../interfaces/campaign.interface';

/**
 * Mock campaigns for testing and demonstration
 */
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'damascus-steel-hero-001',
    name: 'Damascus Steel Heritage Collection',
    nameArabic: 'مجموعة تراث الفولاذ الدمشقي',
    type: 'hero',
    status: 'active',

    // Visual content
    heroImage: {
      url: '/assets/images/campaigns/damascus-steel-hero.svg',
      alt: {
        english: 'Authentic Damascus steel knives handcrafted by Syrian artisans',
        arabic: 'سكاكين الفولاذ الدمشقي الأصيل المصنوعة يدوياً من قبل الحرفيين السوريين'
      },
      mobileUrl: '/assets/images/campaigns/damascus-steel-hero-mobile.jpg',
      thumbnailUrl: '/assets/images/campaigns/damascus-steel-hero-thumb.jpg',
      dimensions: { width: 1920, height: 800 },
      format: 'webp',
      size: 245760
    },

    mobileImage: {
      url: '/assets/images/campaigns/damascus-steel-mobile.jpg',
      alt: {
        english: 'Damascus steel collection mobile view',
        arabic: 'عرض مجموعة الفولاذ الدمشقي للموبايل'
      },
      dimensions: { width: 768, height: 600 },
      format: 'webp',
      size: 125440
    },

    // Content and messaging
    headline: {
      english: 'Authentic Damascus Steel Collection',
      arabic: 'مجموعة الفولاذ الدمشقي الأصيل'
    },

    subheadline: {
      english: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
      arabic: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام'
    },

    description: {
      english: 'Discover the legendary craftsmanship of Damascus steel, passed down through generations of Syrian master smiths. Each piece tells a story of heritage, skill, and unwavering dedication to perfection.',
      arabic: 'اكتشف الحرفية الأسطورية للفولاذ الدمشقي، المتناقلة عبر أجيال من الحدادين السوريين الماهرين. كل قطعة تحكي قصة التراث والمهارة والتفاني الثابت نحو الكمال.'
    },

    // Call-to-action
    cta: {
      text: {
        english: 'Shop Damascus Steel',
        arabic: 'تسوق الفولاذ الدمشقي'
      },
      variant: 'primary',
      size: 'large',
      color: 'syrian-red',
      icon: 'hardware',
      iconPosition: 'left',
      analyticsId: 'damascus_steel_hero_cta'
    },

    // Targeting and routing
    targetRoute: {
      type: 'category',
      target: 'damascus-steel',
      parameters: { featured: true },
      queryParams: { source: 'hero_campaign', campaign: 'damascus-steel-hero-001' },
      tracking: {
        source: 'homepage_hero',
        medium: 'campaign',
        campaign: 'damascus_steel_heritage',
        content: 'main_cta'
      }
    },

    // Scheduling
    schedule: {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-12-31T23:59:59Z'),
      timezone: 'Asia/Damascus',
      activeDays: [0, 1, 2, 3, 4, 5, 6], // All days
      activeHours: { start: 0, end: 24 }, // All hours
      recurrence: { type: 'none', interval: 1 }
    },

    // Analytics
    analytics: {
      impressions: 15420,
      clicks: 892,
      clickThroughRate: 5.79,
      conversions: 127,
      conversionRate: 14.24,
      revenue: 23450.00,
      costPerClick: 0.85,
      returnOnAdSpend: 3.2,
      variant: 'original',
      lastUpdated: new Date()
    },

    // Syrian marketplace specific data
    syrianData: {
      region: 'damascus',
      specialties: ['Knives', 'Swords', 'Tools', 'Decorative Items'],
      culturalContext: {
        english: 'UNESCO-recognized traditional craftsmanship passed down through generations. Damascus steel represents the pinnacle of medieval metallurgy.',
        arabic: 'حرفة تقليدية معترف بها من اليونسكو تنتقل عبر الأجيال. يمثل الفولاذ الدمشقي قمة علم المعادن في العصور الوسطى.'
      },
      unescoRecognition: true,
      seasonality: {
        season: 'autumn',
        culturalEvents: ['Heritage Week', 'Craft Fair'],
        traditionalProducts: ['Damascus Steel Knives', 'Traditional Swords']
      },
      artisan: {
        name: {
          english: 'Master Khalil Al-Shami',
          arabic: 'الأستاذ خليل الشامي'
        },
        bio: {
          english: 'Third-generation Damascus steel artisan with 35 years of experience',
          arabic: 'حرفي فولاذ دمشقي من الجيل الثالث مع 35 عاماً من الخبرة'
        },
        location: 'Old Damascus',
        experience: 35,
        specialization: ['Traditional Knives', 'Ceremonial Swords', 'Tools'],
        profileImage: '/assets/images/artisans/khalil-al-shami.jpg'
      }
    },

    // Metadata
    metadata: {
      createdBy: 'admin',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedBy: 'admin',
      updatedAt: new Date('2024-01-15T14:30:00Z'),
      version: 2,
      tags: ['damascus-steel', 'heritage', 'craftsmanship', 'unesco', 'syria'],
      priority: 9
    }
  },

  {
    id: 'aleppo-soap-seasonal-002',
    name: 'Premium Aleppo Soap Collection',
    nameArabic: 'مجموعة صابون حلب الفاخر',
    type: 'seasonal',
    status: 'active',

    // Visual content
    heroImage: {
      url: '/assets/images/campaigns/aleppo-soap-hero.svg',
      alt: {
        english: 'Traditional Aleppo soap with laurel oil and olive oil',
        arabic: 'صابون حلب التقليدي بزيت الغار وزيت الزيتون'
      },
      mobileUrl: '/assets/images/campaigns/aleppo-soap-hero-mobile.jpg',
      thumbnailUrl: '/assets/images/campaigns/aleppo-soap-hero-thumb.jpg',
      dimensions: { width: 1920, height: 800 },
      format: 'webp',
      size: 198720
    },

    // Content and messaging
    headline: {
      english: 'Premium Aleppo Soap - Natural Beauty Secrets',
      arabic: 'صابون حلب الفاخر - أسرار الجمال الطبيعية'
    },

    subheadline: {
      english: 'Pure olive oil and laurel oil crafted using 2000-year-old traditions',
      arabic: 'زيت الزيتون النقي وزيت الغار مصنوع بتقاليد عمرها ألفا عام'
    },

    description: {
      english: 'Experience the natural luxury of Aleppo soap, made from the finest olive oil and precious laurel oil. This ancient recipe has been treasured for its healing and beautifying properties.',
      arabic: 'استمتع بالرفاهية الطبيعية لصابون حلب، المصنوع من أجود زيت الزيتون وزيت الغار الثمين. هذه الوصفة القديمة محبوبة لخصائصها العلاجية والتجميلية.'
    },

    // Call-to-action
    cta: {
      text: {
        english: 'Discover Natural Beauty',
        arabic: 'اكتشف الجمال الطبيعي'
      },
      variant: 'primary',
      size: 'medium',
      color: 'golden',
      icon: 'spa',
      iconPosition: 'left',
      analyticsId: 'aleppo_soap_seasonal_cta'
    },

    // Targeting and routing
    targetRoute: {
      type: 'category',
      target: 'beauty-wellness',
      parameters: { featured: true, type: 'aleppo-soap' },
      queryParams: { source: 'seasonal_campaign', campaign: 'aleppo-soap-seasonal-002' },
      tracking: {
        source: 'homepage_hero',
        medium: 'seasonal_campaign',
        campaign: 'aleppo_soap_natural_beauty',
        content: 'discover_cta'
      }
    },

    // Scheduling
    schedule: {
      startDate: new Date('2024-03-01T00:00:00Z'),
      endDate: new Date('2024-05-31T23:59:59Z'),
      timezone: 'Asia/Damascus',
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      activeHours: { start: 6, end: 23 },
      recurrence: { type: 'none', interval: 1 }
    },

    // Analytics
    analytics: {
      impressions: 12890,
      clicks: 723,
      clickThroughRate: 5.61,
      conversions: 98,
      conversionRate: 13.55,
      revenue: 8760.00,
      costPerClick: 0.72,
      returnOnAdSpend: 2.8,
      variant: 'seasonal_spring',
      lastUpdated: new Date()
    },

    // Syrian marketplace specific data
    syrianData: {
      region: 'aleppo',
      specialties: ['Natural Soap', 'Beauty Products', 'Skincare', 'Aromatherapy'],
      culturalContext: {
        english: 'Traditional soap-making heritage spanning over 2000 years. Aleppo soap is renowned worldwide for its purity and healing properties.',
        arabic: 'تراث صناعة الصابون التقليدي الممتد لأكثر من ألفي عام. صابون حلب مشهور عالمياً بنقاوته وخصائصه العلاجية.'
      },
      unescoRecognition: true,
      seasonality: {
        season: 'spring',
        culturalEvents: ['Spring Beauty Festival', 'Natural Products Fair'],
        traditionalProducts: ['Aleppo Soap', 'Laurel Oil', 'Natural Skincare']
      }
    },

    // Metadata
    metadata: {
      createdBy: 'admin',
      createdAt: new Date('2024-02-15T09:00:00Z'),
      updatedBy: 'admin',
      updatedAt: new Date('2024-03-01T12:15:00Z'),
      version: 1,
      tags: ['aleppo-soap', 'natural-beauty', 'skincare', 'traditional', 'seasonal'],
      priority: 8
    }
  },

  {
    id: 'syrian-textiles-heritage-003',
    name: 'Syrian Textiles & Brocade Collection',
    nameArabic: 'مجموعة المنسوجات والبروكار السوري',
    type: 'product_spotlight',
    status: 'active',

    // Visual content
    heroImage: {
      url: '/assets/images/campaigns/syrian-textiles-hero.svg',
      alt: {
        english: 'Luxurious Syrian brocade fabrics with golden thread patterns',
        arabic: 'أقمشة البروكار السوري الفاخرة بأنماط الخيوط الذهبية'
      },
      mobileUrl: '/assets/images/campaigns/syrian-textiles-hero-mobile.jpg',
      thumbnailUrl: '/assets/images/campaigns/syrian-textiles-hero-thumb.jpg',
      dimensions: { width: 1920, height: 800 },
      format: 'webp',
      size: 267840
    },

    // Content and messaging
    headline: {
      english: 'Exquisite Syrian Textiles & Brocade',
      arabic: 'المنسوجات والبروكار السوري الرائع'
    },

    subheadline: {
      english: 'Handwoven luxury fabrics with intricate golden patterns',
      arabic: 'أقمشة فاخرة منسوجة يدوياً بأنماط ذهبية معقدة'
    },

    description: {
      english: 'Immerse yourself in the rich textile tradition of Syria. Our brocade collection features hand-woven fabrics with intricate patterns, perfect for special occasions and interior design.',
      arabic: 'انغمس في التقليد النسيجي الغني لسوريا. تتميز مجموعة البروكار لدينا بأقمشة منسوجة يدوياً بأنماط معقدة، مثالية للمناسبات الخاصة والتصميم الداخلي.'
    },

    // Call-to-action
    cta: {
      text: {
        english: 'Explore Luxury Fabrics',
        arabic: 'استكشف الأقمشة الفاخرة'
      },
      variant: 'primary',
      size: 'large',
      color: 'golden',
      icon: 'texture',
      iconPosition: 'left',
      analyticsId: 'syrian_textiles_spotlight_cta'
    },

    // Targeting and routing
    targetRoute: {
      type: 'category',
      target: 'textiles-fabrics',
      parameters: { featured: true, type: 'brocade' },
      queryParams: { source: 'product_spotlight', campaign: 'syrian-textiles-heritage-003' },
      tracking: {
        source: 'homepage_hero',
        medium: 'product_spotlight',
        campaign: 'syrian_textiles_heritage',
        content: 'explore_cta'
      }
    },

    // Scheduling
    schedule: {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-06-30T23:59:59Z'),
      timezone: 'Asia/Damascus',
      activeDays: [1, 2, 3, 4, 5], // Weekdays only
      activeHours: { start: 8, end: 22 },
      recurrence: { type: 'weekly', interval: 2 }
    },

    // Analytics
    analytics: {
      impressions: 9650,
      clicks: 578,
      clickThroughRate: 5.99,
      conversions: 73,
      conversionRate: 12.63,
      revenue: 15800.00,
      costPerClick: 1.12,
      returnOnAdSpend: 3.8,
      variant: 'luxury_focus',
      lastUpdated: new Date()
    },

    // Syrian marketplace specific data
    syrianData: {
      region: 'damascus',
      specialties: ['Brocade', 'Silk Fabrics', 'Traditional Patterns', 'Luxury Textiles'],
      culturalContext: {
        english: 'Syrian textile art represents centuries of craftsmanship and cultural exchange along ancient trade routes. Each pattern tells a story of heritage and artistry.',
        arabic: 'فن النسيج السوري يمثل قرون من الحرفية والتبادل الثقافي على طول طرق التجارة القديمة. كل نمط يحكي قصة التراث والفنية.'
      },
      unescoRecognition: false,
      seasonality: {
        season: 'autumn',
        culturalEvents: ['Fashion Heritage Week', 'Textile Arts Festival'],
        traditionalProducts: ['Brocade Fabrics', 'Silk Scarves', 'Traditional Clothing']
      }
    },

    // Metadata
    metadata: {
      createdBy: 'admin',
      createdAt: new Date('2024-01-10T11:30:00Z'),
      updatedBy: 'admin',
      updatedAt: new Date('2024-02-01T16:45:00Z'),
      version: 3,
      tags: ['textiles', 'brocade', 'luxury', 'traditional', 'heritage'],
      priority: 7
    }
  }
];

/**
 * Mock campaign templates for testing
 */
export const MOCK_CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'damascus-steel-template',
    name: 'Damascus Steel Hero Campaign',
    nameArabic: 'حملة الفولاذ الدمشقي الرئيسية',
    type: 'hero',
    description: {
      english: 'Showcase authentic Damascus steel products with heritage storytelling',
      arabic: 'عرض منتجات الفولاذ الدمشقي الأصيل مع قصص التراث'
    },
    defaultContent: {
      type: 'hero',
      headline: {
        english: 'Authentic Damascus Steel Collection',
        arabic: 'مجموعة الفولاذ الدمشقي الأصيل'
      },
      cta: {
        text: {
          english: 'Shop Damascus Steel',
          arabic: 'تسوق الفولاذ الدمشقي'
        },
        variant: 'primary',
        size: 'large',
        color: 'syrian-red',
        icon: 'hardware'
      }
    } as Partial<Campaign>,
    previewImage: '/assets/images/templates/damascus-steel-template.jpg',
    category: 'cultural',
    isActive: true
  },

  {
    id: 'aleppo-soap-template',
    name: 'Aleppo Soap Seasonal Campaign',
    nameArabic: 'حملة صابون حلب الموسمية',
    type: 'seasonal',
    description: {
      english: 'Promote traditional Aleppo soap with seasonal benefits',
      arabic: 'الترويج لصابون حلب التقليدي مع الفوائد الموسمية'
    },
    defaultContent: {
      type: 'seasonal',
      headline: {
        english: 'Premium Aleppo Soap Collection',
        arabic: 'مجموعة صابون حلب الفاخر'
      },
      cta: {
        text: {
          english: 'Discover Natural Beauty',
          arabic: 'اكتشف الجمال الطبيعي'
        },
        variant: 'primary',
        size: 'medium',
        color: 'golden',
        icon: 'spa'
      }
    } as Partial<Campaign>,
    previewImage: '/assets/images/templates/aleppo-soap-template.jpg',
    category: 'seasonal',
    isActive: true
  },

  {
    id: 'cultural-heritage-template',
    name: 'Syrian Cultural Heritage Campaign',
    nameArabic: 'حملة التراث الثقافي السوري',
    type: 'brand_story',
    description: {
      english: 'Celebrate Syrian cultural heritage and traditional crafts',
      arabic: 'احتفال بالتراث الثقافي السوري والحرف التقليدية'
    },
    defaultContent: {
      type: 'brand_story',
      headline: {
        english: 'Preserving Syrian Heritage',
        arabic: 'الحفاظ على التراث السوري'
      },
      cta: {
        text: {
          english: 'Explore Heritage',
          arabic: 'استكشف التراث'
        },
        variant: 'outline',
        size: 'medium',
        color: 'golden',
        icon: 'heritage'
      }
    } as Partial<Campaign>,
    previewImage: '/assets/images/templates/cultural-heritage-template.jpg',
    category: 'brand',
    isActive: true
  }
];

/**
 * Default fallback campaign for when no campaigns are available
 */
export const DEFAULT_FALLBACK_CAMPAIGN: Campaign = {
  id: 'fallback-default',
  name: 'Welcome to SouqSyria',
  nameArabic: 'أهلاً بكم في سوق سوريا',
  type: 'hero',
  status: 'active',

  heroImage: {
    url: '/assets/images/campaigns/fallback-hero.jpg',
    alt: {
      english: 'SouqSyria Syrian Marketplace - Authentic Products',
      arabic: 'سوق سوريا - منتجات أصيلة'
    },
    dimensions: { width: 1920, height: 800 },
    format: 'jpg',
    size: 204800
  },

  headline: {
    english: 'Authentic Syrian Marketplace',
    arabic: 'السوق السوري الأصيل'
  },

  subheadline: {
    english: 'Discover the finest Syrian products and traditional crafts',
    arabic: 'اكتشف أجود المنتجات السورية والحرف التقليدية'
  },

  cta: {
    text: {
      english: 'Start Shopping',
      arabic: 'ابدأ التسوق'
    },
    variant: 'primary',
    size: 'large',
    color: 'syrian-red',
    icon: 'shopping_cart'
  },

  targetRoute: {
    type: 'category',
    target: 'all',
    tracking: {
      source: 'homepage_hero',
      medium: 'fallback',
      campaign: 'default_welcome'
    }
  },

  schedule: {
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2030-12-31T23:59:59Z'),
    timezone: 'Asia/Damascus'
  },

  analytics: {
    impressions: 0,
    clicks: 0,
    clickThroughRate: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0,
    lastUpdated: new Date()
  },

  metadata: {
    createdBy: 'system',
    createdAt: new Date(),
    updatedBy: 'system',
    updatedAt: new Date(),
    version: 1,
    tags: ['fallback', 'default', 'welcome'],
    priority: 1
  }
};