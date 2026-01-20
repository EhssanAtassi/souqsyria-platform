/**
 * Campaign Interface for SouqSyria Syrian Marketplace
 *
 * Comprehensive campaign system interfaces supporting:
 * - Dynamic hero campaigns with image/video content
 * - Bilingual content management (Arabic/English)
 * - Campaign scheduling and analytics
 * - Syrian marketplace-specific campaign types
 * - Product and category targeting
 *
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - type
 *         - status
 *         - heroImage
 *         - headline
 *         - cta
 *         - targetRoute
 *         - schedule
 *       properties:
 *         id:
 *           type: string
 *           description: Unique campaign identifier
 *         name:
 *           type: string
 *           description: Campaign name for admin reference
 *         nameArabic:
 *           type: string
 *           description: Campaign name in Arabic
 *         type:
 *           type: string
 *           enum: [hero, banner, popup, product_spotlight, seasonal, flash_sale, category_promotion, brand_story, regional_specialty, artisan_spotlight, cultural_celebration]
 *           description: Campaign type determining display behavior
 *         status:
 *           type: string
 *           enum: [draft, scheduled, active, paused, completed]
 *           description: Current campaign status
 */

import { Product, ProductCategory } from './product.interface';

/**
 * Campaign types for Syrian marketplace
 */
export type CampaignType =
  | 'hero'                    // Main hero section campaigns
  | 'banner'                  // Secondary banner campaigns
  | 'popup'                   // Modal/popup campaigns
  | 'product_spotlight'       // Feature specific products
  | 'seasonal'                // Seasonal/holiday campaigns
  | 'flash_sale'              // Time-limited sales
  | 'category_promotion'      // Category-specific promotions
  | 'brand_story'             // Brand narrative campaigns
  | 'regional_specialty'      // Syrian regional products (Aleppo/Damascus)
  | 'artisan_spotlight'       // Featured artisan campaigns
  | 'cultural_celebration';   // Cultural/religious celebrations

/**
 * Campaign status options
 */
export type CampaignStatus =
  | 'draft'                   // Being created/edited
  | 'scheduled'               // Scheduled for future activation
  | 'active'                  // Currently live
  | 'paused'                  // Temporarily paused
  | 'completed';              // Campaign finished

/**
 * Campaign route types for navigation
 */
export type CampaignRouteType =
  | 'product'                 // Navigate to specific product
  | 'category'                // Navigate to category page
  | 'collection'              // Navigate to product collection
  | 'landing'                 // Navigate to custom landing page
  | 'external';               // External URL

/**
 * Bilingual content structure
 */
export interface BilingualContent {
  /** English content */
  english: string;
  /** Arabic content */
  arabic: string;
}

/**
 * Campaign image configuration
 */
export interface CampaignImage {
  /** Main image URL */
  url: string;
  /** Alt text for accessibility */
  alt: BilingualContent;
  /** Mobile-optimized image URL */
  mobileUrl?: string;
  /** Thumbnail URL for admin preview */
  thumbnailUrl?: string;
  /** Image dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  /** Image format (webp, jpg, png) */
  format: string;
  /** Image size in bytes */
  size: number;
}

/**
 * Campaign call-to-action configuration
 */
export interface CampaignCTA {
  /** Button text */
  text: BilingualContent;
  /** Button style variant */
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size: 'small' | 'medium' | 'large';
  /** Button color theme */
  color: 'syrian-red' | 'golden' | 'navy' | 'emerald' | 'default';
  /** Icon name (Material Icons) */
  icon?: string;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Action analytics identifier */
  analyticsId?: string;
}

/**
 * Campaign routing configuration
 */
export interface CampaignRoute {
  /** Route type */
  type: CampaignRouteType;
  /** Target path or URL */
  target: string;
  /** Additional route parameters */
  parameters?: { [key: string]: any };
  /** Query parameters */
  queryParams?: { [key: string]: any };
  /** Open in new window/tab */
  external?: boolean;
  /** Campaign tracking parameters */
  tracking?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
  };
}

/**
 * Campaign scheduling configuration
 */
export interface CampaignSchedule {
  /** Campaign start date/time */
  startDate: Date;
  /** Campaign end date/time */
  endDate: Date;
  /** Timezone for scheduling */
  timezone: string;
  /** Days of week when campaign is active (0=Sunday, 6=Saturday) */
  activeDays?: number[];
  /** Hours when campaign is active (24-hour format) */
  activeHours?: {
    start: number;
    end: number;
  };
  /** Recurrence pattern */
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    endAfter?: number; // Number of occurrences
  };
}

/**
 * Campaign analytics data
 */
export interface CampaignAnalytics {
  /** Total impressions */
  impressions: number;
  /** Click-through count */
  clicks: number;
  /** Click-through rate */
  clickThroughRate: number;
  /** Conversion count */
  conversions: number;
  /** Conversion rate */
  conversionRate: number;
  /** Revenue generated */
  revenue: number;
  /** Cost per click */
  costPerClick?: number;
  /** Return on ad spend */
  returnOnAdSpend?: number;
  /** A/B test variant */
  variant?: string;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Campaign audience targeting
 */
export interface CampaignAudience {
  /** Geographic targeting */
  geographic?: {
    countries: string[];
    regions: string[];
    cities: string[];
  };
  /** Demographic targeting */
  demographic?: {
    ageRange?: {
      min: number;
      max: number;
    };
    gender?: 'male' | 'female' | 'all';
    languages: string[];
  };
  /** Behavioral targeting */
  behavioral?: {
    previousPurchases: boolean;
    visitedCategories: string[];
    cartAbandonment: boolean;
    loyalCustomers: boolean;
  };
  /** Device targeting */
  device?: {
    types: ('desktop' | 'mobile' | 'tablet')[];
    operatingSystems?: string[];
    browsers?: string[];
  };
}

/**
 * Syrian marketplace specific campaign data
 */
export interface SyrianCampaignData {
  /** Syrian region focus */
  region?: 'aleppo' | 'damascus' | 'latakia' | 'homs' | 'all';
  /** Featured Syrian specialties */
  specialties?: string[];
  /** Cultural context/heritage story */
  culturalContext?: BilingualContent;
  /** UNESCO heritage recognition */
  unescoRecognition?: boolean;
  /** Seasonal context */
  seasonality?: {
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    culturalEvents: string[];
    traditionalProducts: string[];
  };
  /** Artisan information */
  artisan?: {
    name: BilingualContent;
    bio: BilingualContent;
    location: string;
    experience: number; // Years of experience
    specialization: string[];
    profileImage?: string;
  };
}

/**
 * Main Campaign interface
 */
export interface Campaign {
  /** Unique campaign identifier */
  id: string;

  /** Campaign basic information */
  name: string;
  nameArabic?: string;
  type: CampaignType;
  status: CampaignStatus;

  /** Visual content */
  heroImage: CampaignImage;
  mobileImage?: CampaignImage;
  backgroundVideo?: string;

  /** Content and messaging */
  headline: BilingualContent;
  subheadline?: BilingualContent;
  description?: BilingualContent;

  /** Call-to-action */
  cta: CampaignCTA;

  /** Targeting and routing */
  targetRoute: CampaignRoute;
  targetProducts?: Product[];
  targetCategories?: ProductCategory[];

  /** Scheduling */
  schedule: CampaignSchedule;

  /** Analytics */
  analytics: CampaignAnalytics;

  /** Audience targeting */
  audience?: CampaignAudience;

  /** Syrian marketplace specific data */
  syrianData?: SyrianCampaignData;

  /** Additional campaign metadata */
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    tags: string[];
    priority: number; // 1-10, higher = more important
  };
}

/**
 * Campaign template for creating new campaigns
 */
export interface CampaignTemplate {
  id: string;
  name: string;
  nameArabic?: string;
  type: CampaignType;
  description: BilingualContent;
  defaultContent: Partial<Campaign>;
  previewImage?: string;
  category: 'product' | 'seasonal' | 'cultural' | 'promotional' | 'brand';
  isActive: boolean;
}

/**
 * Campaign performance summary
 */
export interface CampaignPerformanceSummary {
  campaignId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    clickThroughRate: number;
    conversionRate: number;
    costPerAcquisition: number;
    returnOnInvestment: number;
  };
  topPerformingVariants?: string[];
  recommendations?: string[];
}

/**
 * Campaign A/B test configuration
 */
export interface CampaignABTest {
  id: string;
  campaignId: string;
  name: string;
  variants: {
    id: string;
    name: string;
    trafficAllocation: number; // Percentage (0-100)
    content: Partial<Campaign>;
    performance: CampaignAnalytics;
  }[];
  testMetric: 'clicks' | 'conversions' | 'revenue';
  status: 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  confidenceLevel: number; // 90, 95, or 99
  statisticalSignificance?: boolean;
  winningVariant?: string;
}

/**
 * Campaign notification settings
 */
export interface CampaignNotification {
  campaignId: string;
  type: 'performance_alert' | 'budget_warning' | 'completion_notice' | 'error_alert';
  threshold?: number;
  recipients: string[];
  enabled: boolean;
  lastSent?: Date;
}