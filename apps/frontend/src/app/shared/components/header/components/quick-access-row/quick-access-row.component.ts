/**
 * @fileoverview Quick Access Row Component for SouqSyria Header
 * @description Horizontal scrollable row supporting two display modes:
 * - 'icons': Icon circles (default, from header-complete.html)
 * - 'cards': Promotional cards with gradient badges (from promotional-cards-carousel.html)
 * @author SouqSyria Development Team
 * @version 2.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     QuickAccessRowComponent:
 *       type: object
 *       description: Quick access promotional row (Row 4) with dual display modes
 *       properties:
 *         config:
 *           $ref: '#/components/schemas/NavigationConfig'
 *           description: Navigation configuration for language and RTL support
 *         displayMode:
 *           type: string
 *           enum: [icons, cards]
 *           description: Display mode - icon circles or promotional cards
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuickAccessItem'
 *           description: Array of quick access items to display
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Observable, BehaviorSubject } from 'rxjs';

import { NavigationConfig } from '../../../../interfaces/navigation.interface';
import { HeaderApiService } from '../../../../services/header-api.service';

/**
 * Interface for quick access card items (icon mode)
 * @description Defines structure for icon-circle quick access cards
 */
export interface QuickAccessItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label in English */
  labelEn: string;
  /** Display label in Arabic */
  labelAr: string;
  /** Subtitle/description in English (optional) */
  subtitleEn?: string;
  /** Subtitle/description in Arabic (optional) */
  subtitleAr?: string;
  /** Material icon name */
  icon: string;
  /** Icon color class (Tailwind color) */
  iconColor: string;
  /** Background color class for card (Tailwind) */
  bgColor?: string;
  /** Navigation URL */
  url: string;
  /** Whether this is a special/highlighted item */
  isSpecial?: boolean;
}

/**
 * Interface for promotional card items (cards mode)
 * @description Defines structure for promotional cards with gradient badges and images
 */
export interface PromoCard {
  /** Unique identifier */
  id: string;
  /** Category/badge label in English */
  categoryEn: string;
  /** Category/badge label in Arabic */
  categoryAr: string;
  /** Card title in English */
  titleEn: string;
  /** Card title in Arabic */
  titleAr: string;
  /** Card subtitle in English */
  subtitleEn: string;
  /** Card subtitle in Arabic */
  subtitleAr: string;
  /** Badge gradient CSS class (badge-gold, badge-olive, etc.) */
  badgeClass: string;
  /** Product image URL */
  image: string;
  /** Navigation URL */
  url: string;
}

/**
 * QuickAccessRowComponent
 *
 * @description
 * Displays a horizontal scrollable row of quick access items (Row 4).
 * Supports two display modes:
 * - 'icons': Icon circles with labels (default)
 * - 'cards': Promotional cards with gradient badges, images, and scroll arrows
 *
 * @example
 * ```html
 * <!-- Icons mode (default) -->
 * <app-quick-access-row [config]="config" displayMode="icons"></app-quick-access-row>
 *
 * <!-- Cards mode -->
 * <app-quick-access-row [config]="config" displayMode="cards" [promoCards]="cards"></app-quick-access-row>
 * ```
 */
@Component({
  selector: 'app-quick-access-row',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './quick-access-row.component.html',
  styleUrl: './quick-access-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessRowComponent implements OnInit {

  //#region Dependency Injection

  /** Header API service for fetching promotional cards */
  private readonly headerApiService = inject(HeaderApiService);

  /** Change detector for manual change detection */
  private readonly cdr = inject(ChangeDetectorRef);

  //#endregion

  //#region Input Properties

  /**
   * Navigation configuration options
   * @description Controls language, RTL layout, and feature toggles
   */
  @Input() config: NavigationConfig = {
    showArabic: true,
    language: 'en',
    rtl: false,
    locations: [],
    featuredCategories: []
  };

  /**
   * Display mode for the row
   * @description 'icons' for icon circles, 'cards' for promotional cards with images
   */
  @Input() displayMode: 'icons' | 'cards' = 'cards';

  /**
   * Custom quick access items for icons mode (optional override)
   * @description If provided, replaces default items
   */
  @Input() items: QuickAccessItem[] | null = null;

  /**
   * Promotional card items for cards mode (optional override)
   * @description If provided, replaces default promo cards
   */
  @Input() promoCards: PromoCard[] | null = null;

  //#endregion

  //#region Output Events

  /**
   * Event emitted when a quick access item is clicked
   * @description Provides item ID for analytics/routing
   */
  @Output() itemClick = new EventEmitter<string>();

  //#endregion

  //#region ViewChild

  /** Reference to the scrollable cards container */
  @ViewChild('carouselContainer') carouselContainer?: ElementRef<HTMLDivElement>;

  //#endregion

  //#region Public Properties

  /**
   * Default Syrian marketplace quick access items (icons mode)
   * @description Array of promotional and category quick access cards
   */
  readonly defaultItems: QuickAccessItem[] = [
    {
      id: 'damascus-steel',
      labelEn: 'Damascus',
      labelAr: 'دمشقي',
      subtitleEn: 'Steel',
      subtitleAr: 'فولاذ',
      icon: 'carpenter',
      iconColor: 'text-primary-500',
      url: '/category/damascus-steel'
    },
    {
      id: 'aleppo-soap',
      labelEn: 'Aleppo',
      labelAr: 'حلبي',
      subtitleEn: 'Soap',
      subtitleAr: 'صابون',
      icon: 'spa',
      iconColor: 'text-pink-400',
      url: '/category/beauty-wellness'
    },
    {
      id: 'syrian-brocade',
      labelEn: 'Syrian',
      labelAr: 'بروكار',
      subtitleEn: 'Brocade',
      subtitleAr: 'سوري',
      icon: 'checkroom',
      iconColor: 'text-amber-500',
      url: '/category/textiles-fabrics'
    },
    {
      id: 'organic-spices',
      labelEn: 'Organic',
      labelAr: 'بهارات',
      subtitleEn: 'Spices',
      subtitleAr: 'عضوية',
      icon: 'eco',
      iconColor: 'text-green-500',
      url: '/category/food-spices'
    },
    {
      id: 'handmade-jewelry',
      labelEn: 'Handmade',
      labelAr: 'مجوهرات',
      subtitleEn: 'Jewelry',
      subtitleAr: 'يدوية',
      icon: 'diamond',
      iconColor: 'text-yellow-500',
      url: '/category/jewelry-accessories'
    },
    {
      id: 'syrian-sweets',
      labelEn: 'Syrian',
      labelAr: 'حلويات',
      subtitleEn: 'Sweets',
      subtitleAr: 'سورية',
      icon: 'cake',
      iconColor: 'text-orange-400',
      url: '/category/sweets-desserts'
    },
    {
      id: 'best-deals',
      labelEn: 'Best',
      labelAr: 'أفضل',
      subtitleEn: 'Deals',
      subtitleAr: 'العروض',
      icon: 'percent',
      iconColor: 'text-white',
      bgColor: 'bg-gradient-to-br from-primary-400 to-primary-600',
      url: '/deals',
      isSpecial: true
    },
    {
      id: 'free-shipping',
      labelEn: 'Free',
      labelAr: 'شحن',
      subtitleEn: 'Shipping',
      subtitleAr: 'مجاني',
      icon: 'local_shipping',
      iconColor: 'text-purple-400',
      url: '/free-shipping'
    },
    {
      id: 'top-brands',
      labelEn: 'Top',
      labelAr: 'أفضل',
      subtitleEn: 'Brands',
      subtitleAr: 'الماركات',
      icon: 'favorite',
      iconColor: 'text-red-400',
      url: '/brands'
    },
    {
      id: 'new-arrivals',
      labelEn: 'New',
      labelAr: 'وصل',
      subtitleEn: 'Arrivals',
      subtitleAr: 'حديثاً',
      icon: 'new_releases',
      iconColor: 'text-blue-400',
      url: '/new-arrivals'
    }
  ];

  /**
   * Default promotional cards (cards mode)
   * @description Syrian marketplace promotional cards with gradient badges
   */
  readonly defaultPromoCards: PromoCard[] = [
    {
      id: 'promo-damascus-steel',
      categoryEn: 'Damascus Steel',
      categoryAr: 'فولاذ دمشقي',
      titleEn: 'Best Sellers',
      titleAr: 'الأكثر مبيعاً',
      subtitleEn: 'Up to 40% Off',
      subtitleAr: 'خصم حتى 40%',
      badgeClass: 'badge-gold',
      image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=200&h=160&fit=crop',
      url: '/category/damascus-steel'
    },
    {
      id: 'promo-beauty',
      categoryEn: 'Beauty',
      categoryAr: 'جمال',
      titleEn: 'Natural Care',
      titleAr: 'عناية طبيعية',
      subtitleEn: 'Aleppo Soap',
      subtitleAr: 'صابون حلبي',
      badgeClass: 'badge-rose',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop',
      url: '/category/beauty-wellness'
    },
    {
      id: 'promo-crafts',
      categoryEn: 'Artisan Crafts',
      categoryAr: 'حرف يدوية',
      titleEn: 'Handmade',
      titleAr: 'صناعة يدوية',
      subtitleEn: 'Syrian Heritage',
      subtitleAr: 'تراث سوري',
      badgeClass: 'badge-terracotta',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&h=200&fit=crop',
      url: '/category/traditional-crafts'
    },
    {
      id: 'promo-spices',
      categoryEn: 'Food & Spices',
      categoryAr: 'طعام وتوابل',
      titleEn: 'Aleppo Specials',
      titleAr: 'منتجات حلب',
      subtitleEn: 'Free Delivery',
      subtitleAr: 'توصيل مجاني',
      badgeClass: 'badge-olive',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop',
      url: '/category/food-spices'
    },
    {
      id: 'promo-textiles',
      categoryEn: 'Textiles',
      categoryAr: 'منسوجات',
      titleEn: 'Syrian Silk',
      titleAr: 'حرير سوري',
      subtitleEn: 'Premium Quality',
      subtitleAr: 'جودة عالية',
      badgeClass: 'badge-purple',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=200&h=160&fit=crop',
      url: '/category/textiles-fabrics'
    },
    {
      id: 'promo-jewelry',
      categoryEn: 'Jewelry',
      categoryAr: 'مجوهرات',
      titleEn: 'Traditional',
      titleAr: 'تراثي',
      subtitleEn: 'Silver & Gold',
      subtitleAr: 'فضة وذهب',
      badgeClass: 'badge-amber',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=160&fit=crop',
      url: '/category/jewelry-accessories'
    },
    {
      id: 'promo-sweets',
      categoryEn: 'Sweets',
      categoryAr: 'حلويات',
      titleEn: 'Gift Boxes',
      titleAr: 'علب هدايا',
      subtitleEn: 'Syrian Baklava',
      subtitleAr: 'بقلاوة سورية',
      badgeClass: 'badge-teal',
      image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&fit=crop',
      url: '/category/sweets-desserts'
    },
    {
      id: 'promo-nuts',
      categoryEn: 'Nuts & Snacks',
      categoryAr: 'مكسرات',
      titleEn: 'Aleppo Pistachios',
      titleAr: 'فستق حلبي',
      subtitleEn: 'Fresh Harvest',
      subtitleAr: 'حصاد طازج',
      badgeClass: 'badge-blue',
      image: 'https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=200&h=200&fit=crop',
      url: '/category/nuts-snacks'
    },
    // --- Additional promotional cards ---
    {
      id: 'promo-electronics',
      categoryEn: 'Electronics',
      categoryAr: 'إلكترونيات',
      titleEn: 'Hot Deals',
      titleAr: 'عروض ساخنة',
      subtitleEn: 'Limited Time',
      subtitleAr: 'لفترة محدودة',
      badgeClass: 'badge-blue',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
      url: '/category/electronics'
    },
    {
      id: 'promo-fashion',
      categoryEn: 'Fashion',
      categoryAr: 'أزياء',
      titleEn: 'New Arrivals',
      titleAr: 'وصل حديثاً',
      subtitleEn: 'Spring 2026',
      subtitleAr: 'ربيع 2026',
      badgeClass: 'badge-rose',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop',
      url: '/category/fashion'
    },
    {
      id: 'promo-home-living',
      categoryEn: 'Home & Living',
      categoryAr: 'المنزل والمعيشة',
      titleEn: 'Decor Sale',
      titleAr: 'تخفيض ديكور',
      subtitleEn: 'Up to 30% Off',
      subtitleAr: 'خصم حتى 30%',
      badgeClass: 'badge-olive',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop',
      url: '/category/home-living'
    },
    {
      id: 'promo-ramadan',
      categoryEn: 'Ramadan Shop',
      categoryAr: 'متجر رمضان',
      titleEn: 'Special Offers',
      titleAr: 'عروض خاصة',
      subtitleEn: "Don't Miss",
      subtitleAr: 'لا تفوّت',
      badgeClass: 'badge-gold',
      image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&h=200&fit=crop',
      url: '/ramadan-shop'
    },
    {
      id: 'promo-flash-sale',
      categoryEn: 'Flash Sale',
      categoryAr: 'تخفيضات فلاش',
      titleEn: '24 Hours Only',
      titleAr: '24 ساعة فقط',
      subtitleEn: 'Up to 70% Off',
      subtitleAr: 'خصم حتى 70%',
      badgeClass: 'badge-terracotta',
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=200&h=200&fit=crop',
      url: '/flash-sale'
    },
    {
      id: 'promo-local-sellers',
      categoryEn: 'Local Sellers',
      categoryAr: 'بائعون محليون',
      titleEn: 'Support Local',
      titleAr: 'ادعم المحلي',
      subtitleEn: 'Syrian Brands',
      subtitleAr: 'علامات سورية',
      badgeClass: 'badge-teal',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop',
      url: '/local-sellers'
    },
    {
      id: 'promo-free-shipping',
      categoryEn: 'Free Shipping',
      categoryAr: 'شحن مجاني',
      titleEn: 'All Orders',
      titleAr: 'جميع الطلبات',
      subtitleEn: 'No Minimum',
      subtitleAr: 'بدون حد أدنى',
      badgeClass: 'badge-purple',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop',
      url: '/free-shipping'
    }
  ];

  //#endregion

  //#region Lifecycle Hooks

  /**
   * Angular OnInit lifecycle hook
   * @description Uses default promo cards with verified Unsplash images.
   * API fetch disabled — backend returns icon items without images,
   * which causes broken thumbnails in compact card mode.
   */
  ngOnInit(): void {
    // Use defaultPromoCards directly — API items lack image URLs
    // and fall back to via.placeholder.com which 404s
  }

  //#endregion

  //#region Private Methods

  /**
   * Load promotional cards from backend API
   * @private
   * @description Fetches promotional cards and transforms them to PromoCard format
   */
  private loadPromoCardsFromAPI(): void {
    this.headerApiService.getQuickAccessItems().subscribe({
      next: (items) => {
        // Transform API response to PromoCard format
        this.promoCards = items.map(item => {
          // Check if item has the extended properties from API
          const apiItem = item as any;

          return {
            id: apiItem.id || item.id,
            categoryEn: apiItem.categoryEn || 'Special Offer',
            categoryAr: apiItem.categoryAr || 'عرض خاص',
            titleEn: apiItem.titleEn || (item as any).label || '',
            titleAr: apiItem.titleAr || (item as any).labelAr || '',
            subtitleEn: apiItem.subtitleEn || apiItem.subtitleEn || '',
            subtitleAr: apiItem.subtitleAr || apiItem.subtitleAr || '',
            badgeClass: apiItem.badgeClass || this.getBadgeClassFromColor(item.iconColor),
            image: apiItem.image || 'https://via.placeholder.com/200',
            url: apiItem.url || item.url
          } as PromoCard;
        });

        // Trigger change detection since we're using OnPush
        this.cdr.markForCheck();

        console.log(`✅ Loaded ${this.promoCards.length} promotional cards from API`);
      },
      error: (error) => {
        console.error('❌ Failed to load promotional cards from API:', error);
        // Fallback is handled by the service, but we still need to trigger change detection
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Convert icon color to badge class
   * @private
   * @param iconColor - Tailwind color class
   * @returns Badge gradient class
   */
  private getBadgeClassFromColor(iconColor?: string): string {
    const colorMap: Record<string, string> = {
      'text-yellow-500': 'badge-gold',
      'text-orange-400': 'badge-orange',
      'text-green-500': 'badge-green',
      'text-purple-400': 'badge-purple',
      'text-blue-400': 'badge-blue',
      'text-red-400': 'badge-red',
      'text-teal-400': 'badge-teal',
      'text-pink-400': 'badge-pink'
    };
    return colorMap[iconColor || ''] || 'badge-gold';
  }

  //#endregion

  //#region Public Methods

  /**
   * Gets the items to display (icons mode)
   * @description Returns custom items if provided, otherwise defaults
   * @returns Array of QuickAccessItem
   */
  getItems(): QuickAccessItem[] {
    return this.items ?? this.defaultItems;
  }

  /**
   * Gets the promo cards to display (cards mode)
   * @description Returns custom cards if provided, otherwise defaults
   * @returns Array of PromoCard
   */
  getPromoCards(): PromoCard[] {
    return this.promoCards ?? this.defaultPromoCards;
  }

  /**
   * Gets display label for an item based on current language
   * @param item - QuickAccessItem object
   * @returns Localized label string
   */
  getItemLabel(item: QuickAccessItem): string {
    return this.config.language === 'ar' ? item.labelAr : item.labelEn;
  }

  /**
   * Gets display subtitle for an item based on current language
   * @param item - QuickAccessItem object
   * @returns Localized subtitle string or empty
   */
  getItemSubtitle(item: QuickAccessItem): string {
    if (this.config.language === 'ar') {
      return item.subtitleAr || '';
    }
    return item.subtitleEn || '';
  }

  /**
   * Gets promo card category label
   * @param card - PromoCard object
   * @returns Localized category string
   */
  getCardCategory(card: PromoCard): string {
    return this.config.language === 'ar' ? card.categoryAr : card.categoryEn;
  }

  /**
   * Gets promo card title
   * @param card - PromoCard object
   * @returns Localized title string
   */
  getCardTitle(card: PromoCard): string {
    return this.config.language === 'ar' ? card.titleAr : card.titleEn;
  }

  /**
   * Gets promo card subtitle
   * @param card - PromoCard object
   * @returns Localized subtitle string
   */
  getCardSubtitle(card: PromoCard): string {
    return this.config.language === 'ar' ? card.subtitleAr : card.subtitleEn;
  }

  /**
   * Handles item click events
   * @param itemId - ID of clicked item
   */
  onItemClick(itemId: string): void {
    this.itemClick.emit(itemId);
  }

  /**
   * Handles image load errors by hiding the broken image
   * @description Hides the broken img and shows the parent's gray background as fallback
   * @param event - The error event from the img element
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Scrolls the carousel in the given direction
   * @param direction - -1 for left/start, 1 for right/end
   */
  scrollCarousel(direction: number): void {
    const container = this.carouselContainer?.nativeElement;
    if (!container) return;

    const scrollAmount = 300;
    const rtlMultiplier = this.config.rtl ? -1 : 1;
    container.scrollBy({
      left: direction * scrollAmount * rtlMultiplier,
      behavior: 'smooth'
    });
  }

  /**
   * TrackBy function for items
   * @param index - Array index
   * @param item - QuickAccessItem object
   * @returns Unique identifier
   */
  trackByItem(index: number, item: QuickAccessItem): string {
    return item.id;
  }

  /**
   * TrackBy function for promo cards
   * @param index - Array index
   * @param card - PromoCard object
   * @returns Unique identifier
   */
  trackByCard(index: number, card: PromoCard): string {
    return card.id;
  }

  /**
   * Gets the icon container classes for an item
   * @param item - QuickAccessItem object
   * @returns CSS class string
   */
  getIconContainerClasses(item: QuickAccessItem): string {
    if (item.isSpecial && item.bgColor) {
      return `${item.bgColor} shadow-md`;
    }
    return 'bg-white border border-gray-200/60 shadow-sm';
  }

  //#endregion
}
