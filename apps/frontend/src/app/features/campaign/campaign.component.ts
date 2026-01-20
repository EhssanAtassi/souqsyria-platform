import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  OnDestroy,
  DestroyRef
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductsService } from '../../store/products/products.service';
import { ProductsQuery } from '../../store/products/products.query';
import { Product } from '../../shared/interfaces/product.interface';

/**
 * Campaign Interface
 * @description Structure for campaign data
 */
interface Campaign {
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr?: string;
  shortDescription: string;
  bannerImage: string;
  discount: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  productCount: number;
  terms?: string[];
}

/**
 * Countdown Interface
 * @description Structure for countdown timer
 */
interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Campaign Page Component
 *
 * @description
 * Dynamic campaign display page for SouqSyria marketplace including:
 * - Campaign hero with banner and metadata
 * - Countdown timer for active campaigns
 * - Product grid filtered by campaign
 * - Campaign terms and conditions
 * - Social sharing functionality
 * - Related campaigns section
 *
 * Features:
 * - Real-time countdown using interval
 * - Product loading from ProductsService
 * - Dynamic campaign data from route params
 * - Responsive design with Golden Wheat theme
 * - Share campaign functionality
 * - Scroll to products section
 *
 * @example
 * ```html
 * <!-- Route: /campaign/ramadan-2025 -->
 * <app-campaign></app-campaign>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     CampaignComponent:
 *       type: object
 *       description: Syrian marketplace campaign page with products
 *       properties:
 *         campaignSlug:
 *           type: string
 *           description: URL slug of the campaign
 *         campaign:
 *           $ref: '#/components/schemas/Campaign'
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 */
@Component({
  selector: 'app-campaign',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './campaign.component.html',
  styleUrl: './campaign.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignComponent implements OnInit, OnDestroy {
  /**
   * Reference to products section for scrolling
   */
  @ViewChild('productsSection') productsSection!: ElementRef;

  /**
   * Route service for getting campaign slug from URL
   */
  private route = inject(ActivatedRoute);

  /**
   * Products service for loading campaign products
   */
  private productsService = inject(ProductsService);

  /**
   * Products query for accessing product state
   */
  private productsQuery = inject(ProductsQuery);

  /**
   * DestroyRef for automatic cleanup
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Campaign slug from route params
   */
  campaignSlug = signal<string>('');

  /**
   * Current campaign data
   */
  campaign = signal<Campaign | null>(null);

  /**
   * Campaign products
   */
  products = signal<Product[]>([]);

  /**
   * Related campaigns
   */
  relatedCampaigns = signal<Campaign[]>([]);

  /**
   * Loading state
   */
  isLoading = signal<boolean>(true);

  /**
   * Error state
   */
  error = signal<string | null>(null);

  /**
   * Countdown timer
   */
  countdown = signal<Countdown | null>(null);

  /**
   * Countdown interval ID
   */
  private countdownInterval: any = null;

  /**
   * Mock campaigns database
   * TODO: Replace with API call when backend is integrated
   */
  private mockCampaigns: Campaign[] = [
    {
      slug: 'ramadan-2025',
      name: 'Ramadan Blessings 2025',
      nameAr: 'بركات رمضان 2025',
      description: 'Celebrate the holy month with authentic Syrian crafts and traditional products. Special discounts on prayer items, dates, sweets, and more.',
      descriptionAr: 'احتفل بالشهر الفضيل بالحرف السورية الأصيلة والمنتجات التقليدية. خصومات خاصة على أدوات الصلاة والتمور والحلويات وأكثر.',
      shortDescription: 'Special Ramadan collection with up to 30% discount',
      bannerImage: '/assets/images/campaigns/ramadan-2025.jpg',
      discount: 30,
      startDate: new Date('2025-02-28'),
      endDate: new Date('2025-03-30'),
      status: 'active',
      productCount: 45,
      terms: [
        'Campaign valid from Feb 28 to Mar 30, 2025',
        'Discounts apply to selected products only',
        'Cannot be combined with other offers',
        'Free shipping on orders over $100'
      ]
    },
    {
      slug: 'damascus-heritage',
      name: 'Damascus Heritage Sale',
      nameAr: 'تراث دمشق',
      description: 'Explore the finest Damascus steel products, brocade textiles, and traditional handicrafts. Preserve Syrian heritage with every purchase.',
      descriptionAr: 'اكتشف أفضل منتجات الفولاذ الدمشقي والأقمشة المنسوجة والحرف التقليدية. حافظ على التراث السوري مع كل عملية شراء.',
      shortDescription: 'UNESCO certified Damascus crafts at 25% off',
      bannerImage: '/assets/images/campaigns/damascus-heritage.jpg',
      discount: 25,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      productCount: 32,
      terms: [
        'Year-round campaign celebrating Syrian heritage',
        'All products are UNESCO Heritage certified',
        'Certificate of Authenticity included'
      ]
    },
    {
      slug: 'aleppo-soap-festival',
      name: 'Aleppo Soap Festival',
      nameAr: 'مهرجان صابون حلب',
      description: 'Authentic Aleppo laurel soap aged for 2+ years. Natural, handmade, and perfect for all skin types including sensitive skin.',
      descriptionAr: 'صابون الغار الحلبي الأصيل المعتق لأكثر من سنتين. طبيعي، مصنوع يدوياً، ومناسب لجميع أنواع البشرة بما في ذلك البشرة الحساسة.',
      shortDescription: 'Premium Aleppo soap collection with 20% discount',
      bannerImage: '/assets/images/campaigns/aleppo-soap.jpg',
      discount: 20,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-31'),
      status: 'upcoming',
      productCount: 18,
      terms: [
        'All soap bars aged minimum 2 years',
        '40% laurel oil concentration',
        'Buy 3 get 1 free on selected items'
      ]
    }
  ];

  /**
   * Component initialization
   */
  ngOnInit(): void {
    // Get campaign slug from route
    this.campaignSlug.set(this.route.snapshot.paramMap.get('campaignSlug') || '');

    // Load campaign data
    this.loadCampaign();

    // Load products
    this.loadProducts();

    // Load related campaigns
    this.loadRelatedCampaigns();
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Load campaign data
   * @private
   */
  private loadCampaign(): void {
    const slug = this.campaignSlug();
    const campaignData = this.mockCampaigns.find(c => c.slug === slug);

    if (campaignData) {
      this.campaign.set(campaignData);

      // Start countdown if campaign is active
      if (campaignData.status === 'active') {
        this.startCountdown(campaignData.endDate);
      }
    } else {
      this.campaign.set(null);
    }

    this.isLoading.set(false);
  }

  /**
   * Load products for this campaign
   */
  loadProducts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load products using Akita
    this.productsService.loadProducts();

    // Get products (in real app, filter by campaign)
    const allProducts = this.productsQuery.getAll();

    // Simulate campaign-filtered products (take first 8 for demo)
    this.products.set(allProducts.slice(0, 8));
    this.isLoading.set(false);
  }

  /**
   * Load related campaigns
   * @private
   */
  private loadRelatedCampaigns(): void {
    const currentSlug = this.campaignSlug();
    const related = this.mockCampaigns.filter(c => c.slug !== currentSlug).slice(0, 3);
    this.relatedCampaigns.set(related);
  }

  /**
   * Start countdown timer
   * @param endDate - Campaign end date
   * @private
   */
  private startCountdown(endDate: Date): void {
    this.updateCountdown(endDate);

    this.countdownInterval = setInterval(() => {
      this.updateCountdown(endDate);
    }, 1000);
  }

  /**
   * Update countdown values
   * @param endDate - Campaign end date
   * @private
   */
  private updateCountdown(endDate: Date): void {
    const now = new Date().getTime();
    const end = endDate.getTime();
    const distance = end - now;

    if (distance < 0) {
      this.countdown.set(null);
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.countdown.set({
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds)
    });
  }

  /**
   * Calculate discounted price
   * @param product - Product to calculate price for
   * @returns Discounted price
   */
  calculateDiscountedPrice(product: Product): number {
    if (product.price.discount && product.price.discount.percentage > 0) {
      return product.price.amount * (1 - product.price.discount.percentage / 100);
    }
    return product.price.amount;
  }

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Get status icon
   * @param status - Campaign status
   * @returns Icon name
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'circle';
      case 'upcoming': return 'schedule';
      case 'ended': return 'block';
      default: return 'help';
    }
  }

  /**
   * Scroll to products section
   */
  scrollToProducts(): void {
    if (this.productsSection) {
      this.productsSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Share campaign on social media
   */
  shareCampaign(): void {
    const camp = this.campaign();
    if (!camp) return;

    const url = window.location.href;
    const text = `${camp.name} - Up to ${camp.discount}% OFF on SouqSyria!`;

    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: camp.name,
        text: text,
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('Campaign link copied to clipboard!');
      });
    }
  }
}
