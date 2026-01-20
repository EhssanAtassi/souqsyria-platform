import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Banner, BannerClickEvent } from '../../interfaces/banner.interface';

/**
 * Promotional Banners Component
 *
 * Displays promotional banners in responsive grid layout.
 * Reusable across Homepage, Category pages, and Campaign pages.
 *
 * @description
 * Flexible banner grid with configurable columns (2, 3, or 4).
 * Shows image, title, subtitle, and CTA button with Golden Wheat styling.
 * Supports RTL layout and bilingual content.
 * Responsive: N columns desktop → 1 column mobile.
 *
 * @example
 * ```html
 * <app-promotional-banners
 *   [banners]="promotionalBanners()"
 *   [columns]="2"
 *   [language]="'ar'"
 *   (bannerClick)="onBannerClick($event)">
 * </app-promotional-banners>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PromotionalBannersComponent:
 *       type: object
 *       description: Responsive promotional banner grid
 *       properties:
 *         banners:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Banner'
 *           description: Banners to display
 *         columns:
 *           type: number
 *           enum: [2, 3, 4]
 *           description: Number of columns in grid
 *           default: 2
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *           default: en
 *         showCTA:
 *           type: boolean
 *           description: Show call-to-action buttons
 *           default: true
 *         aspectRatio:
 *           type: string
 *           description: Banner aspect ratio (e.g., '16/9', '4/3')
 *           default: '16/9'
 */
@Component({
  selector: 'app-promotional-banners',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './promotional-banners.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './promotional-banners.component.scss'
})
export class PromotionalBannersComponent {
  /**
   * Banners to display
   */
  readonly banners = input.required<Banner[]>();

  /**
   * Number of columns in grid (2, 3, or 4)
   * @default 2
   */
  readonly columns = input<2 | 3 | 4>(2);

  /**
   * Display language for RTL/LTR support
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Show call-to-action buttons
   * @default true
   */
  readonly showCTA = input<boolean>(true);

  /**
   * Banner aspect ratio (e.g., '16/9', '4/3', '21/9')
   * @default '16/9'
   */
  readonly aspectRatio = input<string>('16/9');

  /**
   * Emits when a banner is clicked
   */
  readonly bannerClick = output<BannerClickEvent>();

  /**
   * Handle banner click event
   * @param banner - Clicked banner
   * @param event - Mouse event
   */
  onBannerClick(banner: Banner, event: MouseEvent): void {
    this.bannerClick.emit({ banner, event });
  }

  /**
   * Get banner title based on language
   * @param banner - Banner object
   * @returns Localized title
   */
  getBannerTitle(banner: Banner): string {
    return this.language() === 'ar' && banner.titleAr
      ? banner.titleAr
      : banner.title;
  }

  /**
   * Get banner subtitle based on language
   * @param banner - Banner object
   * @returns Localized subtitle or undefined
   */
  getBannerSubtitle(banner: Banner): string | undefined {
    return this.language() === 'ar' && banner.subtitleAr
      ? banner.subtitleAr
      : banner.subtitle;
  }

  /**
   * Get CTA text based on language
   * @param banner - Banner object
   * @returns Localized CTA text or default
   */
  getCTAText(banner: Banner): string {
    const defaultCTA = this.language() === 'ar' ? 'تسوق الآن' : 'Shop Now';
    return this.language() === 'ar' && banner.ctaTextAr
      ? banner.ctaTextAr
      : banner.ctaText || defaultCTA;
  }

  /**
   * Check if banner has subtitle
   * @param banner - Banner object
   * @returns True if banner has subtitle content
   */
  hasSubtitle(banner: Banner): boolean {
    return !!(banner.subtitle || banner.subtitleAr);
  }

  /**
   * Check if banner has CTA
   * @param banner - Banner object
   * @returns True if banner has CTA text or link
   */
  hasCTA(banner: Banner): boolean {
    return !!(banner.ctaText || banner.ctaTextAr || banner.linkUrl);
  }

  /**
   * Get banner background color
   * @param banner - Banner object
   * @returns Background color or default
   */
  getBackgroundColor(banner: Banner): string {
    return banner.backgroundColor || '#edebe0'; // golden-wheat-light
  }

  /**
   * Get banner text color
   * @param banner - Banner object
   * @returns Text color or default
   */
  getTextColor(banner: Banner): string {
    return banner.textColor || '#161616'; // charcoal-dark
  }

  /**
   * Get content position class
   * @param banner - Banner object
   * @returns CSS class for content positioning
   */
  getPositionClass(banner: Banner): string {
    const position = banner.position || 'left';
    return `promotional-banner--${position}`;
  }

  /**
   * Get grid column class based on columns input
   * @returns CSS class for grid columns
   */
  getGridClass(): string {
    return `promotional-banners--columns-${this.columns()}`;
  }

  /**
   * Check if banner is currently active
   * @param banner - Banner object
   * @returns True if banner is active and within date range
   */
  isBannerActive(banner: Banner): boolean {
    if (banner.isActive === false) return false;

    const now = new Date();
    if (banner.startDate && new Date(banner.startDate) > now) return false;
    if (banner.endDate && new Date(banner.endDate) < now) return false;

    return true;
  }

  /**
   * Get filtered active banners
   * @returns Active banners only
   */
  getActiveBanners(): Banner[] {
    return this.banners().filter(banner => this.isBannerActive(banner));
  }

  /**
   * Handle image load error
   * Hides broken image to show Golden Wheat gradient fallback
   * @param event - Image error event
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
      console.warn('Banner image failed to load:', img.src);
    }
  }
}
