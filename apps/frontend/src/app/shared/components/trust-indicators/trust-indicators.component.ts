/**
 * @file trust-indicators.component.ts
 * @description Trust and security badge component for Syrian marketplace
 *
 * Displays various trust indicators to build customer confidence:
 * - SSL Security badge
 * - Verified seller badge
 * - UNESCO heritage badge
 * - Money-back guarantee
 * - Authentic product certification
 *
 * @module Shared/Components
 * @implements Material Design patterns for badges
 * @accessibility WCAG 2.1 AA compliant
 * @i18n Bilingual support (Arabic/English)
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

/**
 * Trust badge type enumeration
 */
export enum TrustBadgeType {
  SSL_SECURE = 'ssl-secure',
  VERIFIED_SELLER = 'verified-seller',
  UNESCO_HERITAGE = 'unesco-heritage',
  MONEY_BACK = 'money-back',
  AUTHENTIC = 'authentic',
  FREE_SHIPPING = 'free-shipping',
  DAMASCUS_CERTIFIED = 'damascus-certified',
  HANDMADE = 'handmade',
  ORGANIC = 'organic',
  TRADITIONAL = 'traditional'
}

/**
 * Trust badge configuration interface
 */
export interface TrustBadge {
  /** Badge type identifier */
  type: TrustBadgeType;
  /** Display label in current language */
  label: string;
  /** Material icon name */
  icon: string;
  /** Tooltip description */
  description: string;
  /** Background color theme */
  colorClass: string;
  /** Is badge currently active/visible */
  active: boolean;
}

/**
 * TrustIndicatorsComponent
 *
 * Displays trust and security badges to increase customer confidence.
 * Critical for conversion optimization in e-commerce.
 *
 * @example
 * <!-- Show all default badges -->
 * <app-trust-indicators></app-trust-indicators>
 *
 * @example
 * <!-- Show specific badges -->
 * <app-trust-indicators
 *   [badges]="['ssl-secure', 'verified-seller']"
 *   [size]="'large'"
 *   [layout]="'horizontal'">
 * </app-trust-indicators>
 *
 * @example
 * <!-- UNESCO heritage product -->
 * <app-trust-indicators
 *   [badges]="['unesco-heritage', 'handmade', 'authentic']"
 *   [showDescriptions]="true">
 * </app-trust-indicators>
 */
@Component({
  selector: 'app-trust-indicators',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './trust-indicators.component.html',
  styleUrls: ['./trust-indicators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustIndicatorsComponent {
  /**
   * Array of badge types to display
   * If not provided, shows default checkout badges
   */
  @Input() badges: TrustBadgeType[] = [
    TrustBadgeType.SSL_SECURE,
    TrustBadgeType.VERIFIED_SELLER,
    TrustBadgeType.MONEY_BACK
  ];

  /**
   * Badge display size
   * - small: 24px height, compact
   * - medium: 32px height, standard
   * - large: 40px height, prominent
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Layout orientation
   * - horizontal: Inline badges (default)
   * - vertical: Stacked badges
   * - grid: 2-column grid layout
   */
  @Input() layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal';

  /**
   * Show descriptions below badges
   */
  @Input() showDescriptions = false;

  /**
   * Current language (ar or en)
   */
  @Input() currentLang = 'ar';

  /**
   * All available trust badges configuration
   * Localized for Arabic and English
   */
  get availableBadges(): TrustBadge[] {
    return [
      {
        type: TrustBadgeType.SSL_SECURE,
        label: this.currentLang === 'ar' ? 'معاملة آمنة ومشفرة' : 'SSL Secure',
        icon: 'lock',
        description: this.currentLang === 'ar'
          ? 'جميع معاملاتك محمية بتشفير SSL 256-bit'
          : 'All transactions protected with 256-bit SSL encryption',
        colorClass: 'trust-badge-ssl',
        active: true
      },
      {
        type: TrustBadgeType.VERIFIED_SELLER,
        label: this.currentLang === 'ar' ? 'بائع موثق' : 'Verified Seller',
        icon: 'verified',
        description: this.currentLang === 'ar'
          ? 'بائع معتمد ومراجع من قبل سوق سوريا'
          : 'Seller verified and reviewed by SouqSyria',
        colorClass: 'trust-badge-verified',
        active: true
      },
      {
        type: TrustBadgeType.UNESCO_HERITAGE,
        label: this.currentLang === 'ar' ? 'تراث يونسكو' : 'UNESCO Heritage',
        icon: 'stars',
        description: this.currentLang === 'ar'
          ? 'منتج تراثي معترف به من منظمة اليونسكو'
          : 'UNESCO recognized cultural heritage product',
        colorClass: 'trust-badge-unesco',
        active: true
      },
      {
        type: TrustBadgeType.MONEY_BACK,
        label: this.currentLang === 'ar' ? 'ضمان استرداد المال' : 'Money Back',
        icon: 'monetization_on',
        description: this.currentLang === 'ar'
          ? 'ضمان استرداد كامل المبلغ خلال 14 يوماً'
          : '14-day full money back guarantee',
        colorClass: 'trust-badge-money',
        active: true
      },
      {
        type: TrustBadgeType.AUTHENTIC,
        label: this.currentLang === 'ar' ? 'منتج أصلي' : 'Authentic',
        icon: 'check_circle',
        description: this.currentLang === 'ar'
          ? 'منتج سوري أصلي 100%'
          : '100% authentic Syrian product',
        colorClass: 'trust-badge-authentic',
        active: true
      },
      {
        type: TrustBadgeType.FREE_SHIPPING,
        label: this.currentLang === 'ar' ? 'شحن مجاني' : 'Free Shipping',
        icon: 'local_shipping',
        description: this.currentLang === 'ar'
          ? 'شحن مجاني لجميع أنحاء سوريا'
          : 'Free shipping across Syria',
        colorClass: 'trust-badge-shipping',
        active: true
      },
      {
        type: TrustBadgeType.DAMASCUS_CERTIFIED,
        label: this.currentLang === 'ar' ? 'حديد دمشقي أصلي' : 'Damascus Steel',
        icon: 'grain',
        description: this.currentLang === 'ar'
          ? 'حديد دمشقي أصلي معتمد من حرفيي دمشق'
          : 'Authentic Damascus steel certified by Damascus artisans',
        colorClass: 'trust-badge-damascus',
        active: true
      },
      {
        type: TrustBadgeType.HANDMADE,
        label: this.currentLang === 'ar' ? 'صناعة يدوية' : 'Handmade',
        icon: 'back_hand',
        description: this.currentLang === 'ar'
          ? 'مصنوع يدوياً بواسطة حرفيين سوريين'
          : 'Handcrafted by Syrian artisans',
        colorClass: 'trust-badge-handmade',
        active: true
      },
      {
        type: TrustBadgeType.ORGANIC,
        label: this.currentLang === 'ar' ? 'عضوي 100%' : '100% Organic',
        icon: 'eco',
        description: this.currentLang === 'ar'
          ? 'منتج عضوي طبيعي بدون مواد كيميائية'
          : 'Organic natural product without chemicals',
        colorClass: 'trust-badge-organic',
        active: true
      },
      {
        type: TrustBadgeType.TRADITIONAL,
        label: this.currentLang === 'ar' ? 'وصفة تقليدية' : 'Traditional',
        icon: 'auto_stories',
        description: this.currentLang === 'ar'
          ? 'وصفة تقليدية موروثة عبر الأجيال'
          : 'Traditional recipe passed through generations',
        colorClass: 'trust-badge-traditional',
        active: true
      }
    ];
  }

  /**
   * Get filtered badges to display
   */
  get displayBadges(): TrustBadge[] {
    return this.availableBadges.filter(badge =>
      this.badges.includes(badge.type) && badge.active
    );
  }

  /**
   * Get CSS class for badge size
   */
  get sizeClass(): string {
    return `trust-indicator-${this.size}`;
  }

  /**
   * Get CSS class for layout
   */
  get layoutClass(): string {
    return `trust-indicator-layout-${this.layout}`;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByType(index: number, badge: TrustBadge): TrustBadgeType {
    return badge.type;
  }
}
