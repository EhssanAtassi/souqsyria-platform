import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { CartService } from '../../store/cart/cart.service';

/**
 * Promotional Offers Component for Syrian Marketplace
 * 
 * Enterprise B2C component that manages personal promotional offers,
 * coupon codes, loyalty points, and seasonal campaigns with Syrian
 * cultural branding and bilingual support.
 * 
 * Features:
 * - Personal promotional dashboard
 * - Coupon code management and redemption
 * - Loyalty points system with Syrian rewards
 * - Seasonal offers (Ramadan, Eid, New Year)
 * - Birthday/anniversary specials
 * - VIP membership benefits
 * - Referral program bonuses
 * - Flash sales and limited-time offers
 * - Category-specific promotions
 * 
 * @swagger
 * components:
 *   schemas:
 *     PromotionalOffer:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - description
 *         - discount
 *         - validUntil
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the promotional offer
 *         title:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               description: English title
 *             ar:
 *               type: string
 *               description: Arabic title
 *         description:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               description: English description
 *             ar:
 *               type: string
 *               description: Arabic description
 *         discount:
 *           type: number
 *           description: Discount percentage or amount
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed, buy_one_get_one, free_shipping]
 *         validUntil:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the offer
 *         category:
 *           type: string
 *           description: Product category for targeted offers
 *         isPersonal:
 *           type: boolean
 *           description: Whether this is a personalized offer
 *         loyaltyPointsCost:
 *           type: number
 *           description: Loyalty points required to redeem
 */
@Component({
  selector: 'app-promotional-offers',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './promotional-offers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './promotional-offers.component.scss'
})
export class PromotionalOffersComponent implements OnInit {
  private userService = inject(UserService);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // State management with signals
  loading = signal(false);
  currentLanguage = signal<'en' | 'ar'>('en');
  activeTab = signal(0);
  loyaltyPoints = signal(0);
  membershipTier = signal('Bronze');
  
  // Promotional offers data
  personalOffers = signal<PromotionalOffer[]>([]);
  seasonalOffers = signal<PromotionalOffer[]>([]);
  flashSales = signal<PromotionalOffer[]>([]);
  categoryOffers = signal<PromotionalOffer[]>([]);
  redeemedOffers = signal<string[]>([]);
  availableCoupons = signal<CouponCode[]>([]);

  // Computed properties
  totalSavings = computed(() => {
    return this.redeemedOffers().reduce((total, offerId) => {
      const offer = this.getAllOffers().find(o => o.id === offerId);
      return total + (offer?.savedAmount || 0);
    }, 0);
  });

  membershipProgress = computed(() => {
    const points = this.loyaltyPoints();
    const tier = this.membershipTier();
    
    const tiers = {
      'Bronze': { min: 0, max: 1000 },
      'Silver': { min: 1000, max: 2500 },
      'Gold': { min: 2500, max: 5000 },
      'Platinum': { min: 5000, max: 10000 }
    };
    
    const currentTier = tiers[tier as keyof typeof tiers];
    return ((points - currentTier.min) / (currentTier.max - currentTier.min)) * 100;
  });

  getAllOffers = computed(() => [
    ...this.personalOffers(),
    ...this.seasonalOffers(),
    ...this.flashSales(),
    ...this.categoryOffers()
  ]);

  ngOnInit(): void {
    this.loadPromotionalOffers();
    this.loadUserLoyaltyData();
    this.loadAvailableCoupons();
  }

  /**
   * Load promotional offers from the service
   * Includes personalized offers based on user behavior
   */
  private async loadPromotionalOffers(): Promise<void> {
    this.loading.set(true);
    
    try {
      // Mock data - In real implementation, fetch from API
      const mockPersonalOffers: PromotionalOffer[] = [
        {
          id: 'personal-1',
          title: { 
            en: 'Birthday Special - 25% Off Damascus Steel', 
            ar: 'عرض عيد الميلاد - خصم 25% على الفولاذ الدمشقي' 
          },
          description: { 
            en: 'Celebrate your special day with premium Damascus steel products', 
            ar: 'احتفل بيومك المميز مع منتجات الفولاذ الدمشقي الفاخرة' 
          },
          discount: 25,
          discountType: 'percentage',
          validUntil: new Date('2024-12-31'),
          category: 'damascus-steel',
          isPersonal: true,
          image: '/assets/images/offers/damascus-birthday.jpg',
          code: 'BIRTHDAY25',
          minPurchase: 100,
          maxDiscount: 50
        },
        {
          id: 'personal-2',
          title: { 
            en: 'VIP Anniversary - Free Premium Gift Wrapping', 
            ar: 'الذكرى السنوية VIP - تغليف هدايا فاخر مجاني' 
          },
          description: { 
            en: 'Complimentary luxury gift wrapping for your anniversary purchases', 
            ar: 'تغليف هدايا فاخر مجاني لمشترياتك في الذكرى السنوية' 
          },
          discount: 0,
          discountType: 'free_shipping',
          validUntil: new Date('2024-11-30'),
          category: 'all',
          isPersonal: true,
          image: '/assets/images/offers/vip-anniversary.jpg',
          code: 'VIPGIFT',
          minPurchase: 75
        }
      ];

      const mockSeasonalOffers: PromotionalOffer[] = [
        {
          id: 'ramadan-1',
          title: { 
            en: 'Ramadan Kareem - 30% Off Traditional Crafts', 
            ar: 'رمضان كريم - خصم 30% على الحرف التقليدية' 
          },
          description: { 
            en: 'Special Ramadan discounts on authentic Syrian handicrafts', 
            ar: 'خصومات رمضانية خاصة على الحرف اليدوية السورية الأصيلة' 
          },
          discount: 30,
          discountType: 'percentage',
          validUntil: new Date('2024-04-09'),
          category: 'traditional-crafts',
          isPersonal: false,
          image: '/assets/images/offers/ramadan-crafts.jpg',
          code: 'RAMADAN30',
          seasonal: true,
          culturalEvent: 'Ramadan'
        },
        {
          id: 'eid-1',
          title: { 
            en: 'Eid Mubarak - Buy 2 Get 1 Free Sweets', 
            ar: 'عيد مبارك - اشتر 2 واحصل على 1 مجاناً من الحلويات' 
          },
          description: { 
            en: 'Celebrate Eid with traditional Syrian sweets and desserts', 
            ar: 'احتفل بالعيد مع الحلويات والمأكولات السورية التقليدية' 
          },
          discount: 0,
          discountType: 'buy_one_get_one',
          validUntil: new Date('2024-04-12'),
          category: 'sweets-desserts',
          isPersonal: false,
          image: '/assets/images/offers/eid-sweets.jpg',
          code: 'EID2FOR1',
          seasonal: true,
          culturalEvent: 'Eid'
        }
      ];

      const mockFlashSales: PromotionalOffer[] = [
        {
          id: 'flash-1',
          title: { 
            en: 'Flash Sale - 48 Hours Only!', 
            ar: 'تخفيضات البرق - 48 ساعة فقط!' 
          },
          description: { 
            en: 'Limited time offer on premium Aleppo laurel soap', 
            ar: 'عرض محدود الوقت على صابون الغار الحلبي الفاخر' 
          },
          discount: 40,
          discountType: 'percentage',
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          category: 'beauty-wellness',
          isPersonal: false,
          image: '/assets/images/offers/flash-soap.jpg',
          code: 'FLASH48',
          isFlashSale: true,
          remainingStock: 25
        }
      ];

      const mockCategoryOffers: PromotionalOffer[] = [
        {
          id: 'category-1',
          title: { 
            en: 'Textile Treasures - 20% Off All Fabrics', 
            ar: 'كنوز النسيج - خصم 20% على جميع الأقمشة' 
          },
          description: { 
            en: 'Discover authentic Syrian brocades and traditional fabrics', 
            ar: 'اكتشف البروكار السوري الأصيل والأقمشة التقليدية' 
          },
          discount: 20,
          discountType: 'percentage',
          validUntil: new Date('2024-12-15'),
          category: 'textiles-fabrics',
          isPersonal: false,
          image: '/assets/images/offers/textile-treasures.jpg',
          code: 'TEXTILE20'
        }
      ];

      this.personalOffers.set(mockPersonalOffers);
      this.seasonalOffers.set(mockSeasonalOffers);
      this.flashSales.set(mockFlashSales);
      this.categoryOffers.set(mockCategoryOffers);

    } catch (error) {
      console.error('Error loading promotional offers:', error);
      this.showErrorMessage('Failed to load promotional offers');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load user loyalty points and membership data
   */
  private async loadUserLoyaltyData(): Promise<void> {
    try {
      // Mock data - In real implementation, fetch from user service
      this.loyaltyPoints.set(1250);
      this.membershipTier.set('Silver');
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    }
  }

  /**
   * Load available coupon codes for the user
   */
  private async loadAvailableCoupons(): Promise<void> {
    try {
      const mockCoupons: CouponCode[] = [
        {
          id: 'referral-1',
          code: 'FRIEND20',
          title: { en: 'Refer a Friend - 20% Off', ar: 'أحضر صديق - خصم 20%' },
          discount: 20,
          discountType: 'percentage',
          validUntil: new Date('2024-12-31'),
          isUsed: false,
          source: 'referral'
        },
        {
          id: 'loyalty-1',
          code: 'LOYALTY500',
          title: { en: 'Loyalty Reward - $5 Off', ar: 'مكافأة الولاء - خصم 5 دولار' },
          discount: 5,
          discountType: 'fixed',
          validUntil: new Date('2024-11-30'),
          isUsed: false,
          source: 'loyalty',
          pointsCost: 500
        }
      ];

      this.availableCoupons.set(mockCoupons);
    } catch (error) {
      console.error('Error loading coupon codes:', error);
    }
  }

  /**
   * Redeem a promotional offer
   * @param offer - The promotional offer to redeem
   */
  async redeemOffer(offer: PromotionalOffer): Promise<void> {
    try {
      // Add to cart or apply discount logic
      if (offer.category && offer.category !== 'all') {
        // Navigate to category page with applied discount
        this.router.navigate(['/category', offer.category], {
          queryParams: { discount: offer.code }
        });
      } else {
        // Apply general discount code
        this.cartService.applyCoupon(offer.code);
        this.redeemedOffers.update(offers => [...offers, offer.id]);
      }

      this.showSuccessMessage(
        this.currentLanguage() === 'ar' 
          ? 'تم تطبيق العرض بنجاح!'
          : 'Offer applied successfully!'
      );

    } catch (error) {
      console.error('Error redeeming offer:', error);
      this.showErrorMessage('Failed to redeem offer');
    }
  }

  /**
   * Redeem coupon code
   * @param coupon - The coupon code to redeem
   */
  async redeemCoupon(coupon: CouponCode): Promise<void> {
    try {
      if (coupon.pointsCost && this.loyaltyPoints() < coupon.pointsCost) {
        this.showErrorMessage('Insufficient loyalty points');
        return;
      }

      this.cartService.applyCoupon(coupon.code);
      
      if (coupon.pointsCost) {
        this.loyaltyPoints.update(points => points - coupon.pointsCost!);
      }

      // Update coupon as used
      this.availableCoupons.update(coupons => 
        coupons.map(c => c.id === coupon.id ? { ...c, isUsed: true } : c)
      );

      this.showSuccessMessage(
        this.currentLanguage() === 'ar' 
          ? 'تم تطبيق الكوبون بنجاح!'
          : 'Coupon applied successfully!'
      );

    } catch (error) {
      console.error('Error redeeming coupon:', error);
      this.showErrorMessage('Failed to redeem coupon');
    }
  }

  /**
   * Share referral code with friends
   */
  shareReferralCode(): void {
    const referralCode = 'FRIEND20'; // This would be user-specific
    const shareText = `Join SouqSyria and get 20% off your first order! Use my referral code: ${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'SouqSyria Referral',
        text: shareText,
        url: `https://souqsyria.com?ref=${referralCode}`
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        this.showSuccessMessage('Referral code copied to clipboard!');
      });
    }
  }

  /**
   * Check if offer is expired
   * @param validUntil - Expiration date
   * @returns boolean indicating if offer is expired
   */
  isOfferExpired(validUntil: Date): boolean {
    return new Date() > validUntil;
  }

  /**
   * Get days remaining for an offer
   * @param validUntil - Expiration date
   * @returns number of days remaining
   */
  getDaysRemaining(validUntil: Date): number {
    const today = new Date();
    const diffTime = validUntil.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get discount display text
   * @param offer - Promotional offer
   * @returns formatted discount text
   */
  getDiscountText(offer: PromotionalOffer): string {
    switch (offer.discountType) {
      case 'percentage':
        return `${offer.discount}%`;
      case 'fixed':
        return `$${offer.discount}`;
      case 'buy_one_get_one':
        return this.currentLanguage() === 'ar' ? 'اشتر 1 احصل على 1' : 'BOGO';
      case 'free_shipping':
        return this.currentLanguage() === 'ar' ? 'شحن مجاني' : 'Free Shipping';
      default:
        return '';
    }
  }

  /**
   * Switch between Arabic and English
   * @param language - Target language code
   */
  switchLanguage(language: 'en' | 'ar'): void {
    this.currentLanguage.set(language);
  }

  /**
   * Show success message
   * @param message - Success message to display
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   * @param message - Error message to display
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}

// Type definitions for promotional offers system
export interface PromotionalOffer {
  id: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  discount: number;
  discountType: 'percentage' | 'fixed' | 'buy_one_get_one' | 'free_shipping';
  validUntil: Date;
  category: string;
  isPersonal: boolean;
  image?: string;
  code: string;
  minPurchase?: number;
  maxDiscount?: number;
  seasonal?: boolean;
  culturalEvent?: string;
  isFlashSale?: boolean;
  remainingStock?: number;
  savedAmount?: number;
}

export interface CouponCode {
  id: string;
  code: string;
  title: { en: string; ar: string };
  discount: number;
  discountType: 'percentage' | 'fixed';
  validUntil: Date;
  isUsed: boolean;
  source: 'referral' | 'loyalty' | 'birthday' | 'seasonal';
  pointsCost?: number;
  minPurchase?: number;
}