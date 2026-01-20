import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface OfferProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

interface OfferDetails {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  bannerImageUrl: string;
  validUntil: Date;
  discount: string;
  products: OfferProduct[];
  termsAndConditions: string[];
  termsAndConditionsAr: string[];
}

@Component({
  selector: 'app-offer-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './offer-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./offer-page.component.scss']
})
export class OfferPageComponent implements OnInit {
  offer: OfferDetails | null = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const offerId = params['offerId'];
      this.loadOfferDetails(offerId);
    });
  }

  onProductClick(product: OfferProduct): void {
    this.router.navigate(['/product', product.id]);
  }

  onAddToCart(product: OfferProduct): void {
    // Implement add to cart functionality
    console.log('Added to cart:', product);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getDaysRemaining(): number {
    if (!this.offer) return 0;
    const now = new Date();
    const validUntil = new Date(this.offer.validUntil);
    const diffTime = validUntil.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private loadOfferDetails(offerId: string): void {
    this.loading = true;
    this.error = false;

    // Simulate API call - Replace with actual service call
    setTimeout(() => {
      this.offer = this.getMockOfferData(offerId);
      this.loading = false;
      if (!this.offer) {
        this.error = true;
      }
    }, 500);
  }

  private getMockOfferData(offerId: string): OfferDetails | null {
    const mockOffers: { [key: string]: OfferDetails } = {
      'tech-electronics': {
        id: 'tech-electronics',
        title: 'Tech & Electronics Sale',
        titleAr: 'تخفيضات التكنولوجيا والإلكترونيات',
        description: 'Discover the latest technology and electronics with amazing discounts up to 50% off',
        descriptionAr: 'اكتشف أحدث التقنيات والإلكترونيات مع خصومات مذهلة تصل إلى 50%',
        bannerImageUrl: '/assets/images/offers/tech-banner.jpg',
        validUntil: new Date('2025-10-31'),
        discount: 'Up to 50% OFF',
        products: [
          {
            id: '1',
            name: 'Smartphone Pro Max',
            nameAr: 'هاتف ذكي برو ماكس',
            price: 899,
            originalPrice: 1299,
            discount: '30% OFF',
            imageUrl: '/assets/products/smartphone.jpg',
            rating: 4.8,
            reviewCount: 245,
            inStock: true
          },
          {
            id: '2',
            name: 'Wireless Headphones',
            nameAr: 'سماعات لاسلكية',
            price: 199,
            originalPrice: 299,
            discount: '33% OFF',
            imageUrl: '/assets/products/headphones.jpg',
            rating: 4.6,
            reviewCount: 189,
            inStock: true
          }
        ],
        termsAndConditions: [
          'Valid until October 31, 2025',
          'Cannot be combined with other offers',
          'Limited stock available',
          'Free shipping on orders over $100'
        ],
        termsAndConditionsAr: [
          'صالح حتى 31 أكتوبر 2025',
          'لا يمكن دمجه مع عروض أخرى',
          'مخزون محدود',
          'شحن مجاني للطلبات فوق 100 دولار'
        ]
      },
      'home-appliances': {
        id: 'home-appliances',
        title: 'Home Appliances Special',
        titleAr: 'عرض خاص على الأجهزة المنزلية',
        description: 'Transform your home with premium appliances at unbeatable prices',
        descriptionAr: 'حول منزلك مع الأجهزة المميزة بأسعار لا تقاوم',
        bannerImageUrl: '/assets/images/offers/appliances-banner.jpg',
        validUntil: new Date('2025-11-15'),
        discount: 'Up to 40% OFF',
        products: [
          {
            id: '3',
            name: 'Smart Coffee Maker',
            nameAr: 'آلة قهوة ذكية',
            price: 299,
            originalPrice: 449,
            discount: '33% OFF',
            imageUrl: '/assets/products/coffee-maker.jpg',
            rating: 4.7,
            reviewCount: 156,
            inStock: true
          }
        ],
        termsAndConditions: [
          'Valid until November 15, 2025',
          'Installation service available',
          'Extended warranty included'
        ],
        termsAndConditionsAr: [
          'صالح حتى 15 نوفمبر 2025',
          'خدمة التركيب متوفرة',
          'ضمان ممدد مشمول'
        ]
      },
      'fashion-lifestyle': {
        id: 'fashion-lifestyle',
        title: 'Fashion & Lifestyle',
        titleAr: 'الموضة ونمط الحياة',
        description: 'Express your style with our curated collection of fashion and lifestyle products',
        descriptionAr: 'عبر عن أسلوبك مع مجموعتنا المنتقاة من منتجات الموضة ونمط الحياة',
        bannerImageUrl: '/assets/images/offers/fashion-banner.jpg',
        validUntil: new Date('2025-12-01'),
        discount: 'Up to 60% OFF',
        products: [
          {
            id: '4',
            name: 'Designer Watch',
            nameAr: 'ساعة مصممة',
            price: 199,
            originalPrice: 399,
            discount: '50% OFF',
            imageUrl: '/assets/products/watch.jpg',
            rating: 4.9,
            reviewCount: 78,
            inStock: true
          }
        ],
        termsAndConditions: [
          'Valid until December 1, 2025',
          'Easy returns within 30 days',
          'Size exchange available'
        ],
        termsAndConditionsAr: [
          'صالح حتى 1 ديسمبر 2025',
          'إرجاع سهل خلال 30 يوم',
          'تبديل المقاسات متوفر'
        ]
      }
    };

    return mockOffers[offerId] || null;
  }
}
