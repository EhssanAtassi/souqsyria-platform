/**
 * Campaign Factory
 *
 * Factory for generating Campaign objects for Syrian marketplace
 * Creates hero campaigns, banners, and promotional content
 *
 * @fileoverview Campaign factory for generating mock campaign data
 * @description Creates type-safe Campaign objects with Syrian cultural context
 */

import {
  Campaign,
  CampaignType,
  CampaignStatus,
  BilingualContent,
  CampaignImage,
  CampaignCTA,
  CampaignRoute,
  CampaignSchedule,
  CampaignAnalytics,
  SyrianCampaignData
} from '../../../shared/interfaces/campaign.interface';
import { BaseFactory } from './base.factory';
import { CategoryTheme } from '../config/category-themes.config';
import { syrianColors } from '../config/syrian-colors.config';

/**
 * Campaign Factory Options
 */
export interface CampaignFactoryOptions {
  /** Campaign name */
  name: string;

  /** Campaign name in Arabic */
  nameArabic?: string;

  /** Campaign type */
  type: CampaignType;

  /** Headline content */
  headline: BilingualContent;

  /** Subheadline content */
  subheadline?: BilingualContent;

  /** Description */
  description?: BilingualContent;

  /** CTA text */
  ctaText: BilingualContent;

  /** Target route */
  targetRoute: string;

  /** Route type */
  routeType: 'product' | 'category' | 'collection' | 'landing' | 'external';

  /** Hero image URL */
  heroImageUrl?: string;

  /** Campaign status */
  status?: CampaignStatus;

  /** Start date */
  startDate?: Date;

  /** End date */
  endDate?: Date;

  /** Syrian campaign data */
  syrianData?: Partial<SyrianCampaignData>;

  /** Priority (1-10) */
  priority?: number;
}

/**
 * Campaign Factory Class
 */
export class CampaignFactory {
  /**
   * Creates a Campaign object
   *
   * @param options - Campaign generation options
   * @returns Fully populated Campaign object
   */
  static create(options: CampaignFactoryOptions): Campaign {
    const id = BaseFactory.generateId('campaign');
    const now = new Date();

    // Generate hero image
    const heroImage = this.generateHeroImage(
      options.heroImageUrl || BaseFactory.generateImageUrl(1920, 1080, options.name),
      options.headline
    );

    // Generate CTA
    const cta = this.generateCTA(options.ctaText);

    // Generate route
    const targetRoute = this.generateRoute(options.targetRoute, options.routeType);

    // Generate schedule
    const schedule = this.generateSchedule(options.startDate, options.endDate);

    // Generate analytics (starting with zeros for new campaign)
    const analytics = this.generateAnalytics();

    // Generate metadata
    const metadata = {
      createdBy: 'admin',
      createdAt: now,
      updatedBy: 'admin',
      updatedAt: now,
      version: 1,
      tags: [options.type, 'syrian-marketplace'],
      priority: options.priority || 5
    };

    return {
      id,
      name: options.name,
      nameArabic: options.nameArabic,
      type: options.type,
      status: options.status || 'active',
      heroImage,
      headline: options.headline,
      subheadline: options.subheadline,
      description: options.description,
      cta,
      targetRoute,
      schedule,
      analytics,
      syrianData: options.syrianData,
      metadata
    };
  }

  /**
   * Generates hero image configuration
   */
  private static generateHeroImage(
    url: string,
    headline: BilingualContent
  ): CampaignImage {
    return {
      url,
      alt: headline,
      mobileUrl: url.replace('/1920/', '/768/'),
      thumbnailUrl: url.replace('/1920/', '/400/'),
      dimensions: {
        width: 1920,
        height: 1080
      },
      format: 'jpg',
      size: 250000 // ~250KB
    };
  }

  /**
   * Generates CTA configuration
   */
  private static generateCTA(text: BilingualContent): CampaignCTA {
    return {
      text,
      variant: 'primary',
      size: 'large',
      color: 'golden',
      icon: 'arrow_forward',
      iconPosition: 'right'
    };
  }

  /**
   * Generates route configuration
   */
  private static generateRoute(
    target: string,
    type: 'product' | 'category' | 'collection' | 'landing' | 'external'
  ): CampaignRoute {
    return {
      type,
      target,
      tracking: {
        source: 'campaign',
        medium: 'hero',
        campaign: BaseFactory.slugify(target)
      }
    };
  }

  /**
   * Generates schedule configuration
   */
  private static generateSchedule(startDate?: Date, endDate?: Date): CampaignSchedule {
    return {
      startDate: startDate || new Date(),
      endDate: endDate || BaseFactory.futureDate(90),
      timezone: 'Asia/Damascus'
    };
  }

  /**
   * Generates analytics (starting values)
   */
  private static generateAnalytics(): CampaignAnalytics {
    return {
      impressions: 0,
      clicks: 0,
      clickThroughRate: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Creates a hero campaign for a category
   *
   * @param categoryTheme - Category theme
   * @returns Campaign object
   */
  static createHeroForCategory(categoryTheme: CategoryTheme): Campaign {
    return this.create({
      name: `${categoryTheme.nameEn} Hero Campaign`,
      nameArabic: `حملة ${categoryTheme.nameAr}`,
      type: 'hero',
      headline: {
        english: `Discover Authentic ${categoryTheme.nameEn}`,
        arabic: `اكتشف ${categoryTheme.nameAr} الأصيلة`
      },
      subheadline: {
        english: categoryTheme.heritage.culturalContext,
        arabic: categoryTheme.heritage.culturalContext
      },
      ctaText: {
        english: 'Shop Now',
        arabic: 'تسوق الآن'
      },
      targetRoute: `/category/${categoryTheme.slug}`,
      routeType: 'category',
      priority: 8
    });
  }

  /**
   * Creates multiple campaigns at once
   *
   * @param optionsArray - Array of campaign options
   * @returns Array of Campaign objects
   */
  static createBulk(optionsArray: CampaignFactoryOptions[]): Campaign[] {
    return optionsArray.map((options) => this.create(options));
  }
}

export default CampaignFactory;
