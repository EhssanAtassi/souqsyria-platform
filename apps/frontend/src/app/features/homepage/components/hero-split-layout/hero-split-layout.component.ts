import {
  Component,
  signal,
  input,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroImageSliderComponent, HeroBanner } from '../hero-image-slider/hero-image-slider.component';
import { PromotionalOfferCardComponent, PromotionalOffer } from '../promotional-offer-card/promotional-offer-card.component';
import { HeroBanner as ApiHeroBanner } from '../../../hero-banners/interfaces/hero-banner.interface';

/**
 * Hero Split Layout Component (Container)
 *
 * E-commerce style hero banner with split layout matching Figma design:
 * - Left side (65%): Image slider with 5 hero banners (app-hero-image-slider)
 * - Right side (35%): Two large promotional offer cards stacked vertically
 *   - Top (50%): Promotional offer card (app-promotional-offer-card)
 *   - Bottom (50%): Promotional offer card (app-promotional-offer-card)
 *
 * This is a container component that orchestrates the layout and passes
 * data to specialized child components for separation of concerns.
 *
 * @Input heroBannersFromApi - Optional hero banners from Akita store (backend API)
 */
@Component({
  selector: 'app-hero-split-layout',
  standalone: true,
  imports: [
    CommonModule,
    HeroImageSliderComponent,
    PromotionalOfferCardComponent
  ],
  templateUrl: './hero-split-layout.component.html',
  styleUrl: './hero-split-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroSplitLayoutComponent {
  // Input: Hero banners from parent (homepage component via Akita store)
  heroBannersFromApi = input<ApiHeroBanner[]>([]);

  // Mock data - Hero Banners (for slider) - FALLBACK ONLY
  private mockHeroBanners = signal<HeroBanner[]>([
    {
      id: 1,
      title: 'Damascus Steel',
      titleAr: 'الفولاذ الدمشقي',
      subtitle: 'Authentic Damascus Steel Knives',
      image: 'https://images.unsplash.com/photo-1589698423558-7537249a5144?w=1650&h=450&fit=crop&q=80',
      link: '/category/damascus-steel'
    },
    {
      id: 2,
      title: 'Aleppo Soap',
      titleAr: 'صابون حلب',
      subtitle: 'Pure Aleppo Laurel Soap',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1650&h=450&fit=crop&q=80',
      link: '/category/beauty-wellness'
    },
    {
      id: 3,
      title: 'Syrian Textiles',
      titleAr: 'المنسوجات السورية',
      subtitle: 'Brocade - 30% OFF',
      image: 'https://images.unsplash.com/photo-1519167758481-83f29da8c42f?w=1650&h=450&fit=crop&q=80',
      link: '/category/textiles-fabrics'
    },
    {
      id: 4,
      title: 'Syrian Spices',
      titleAr: 'البهارات السورية',
      subtitle: 'Seven Spice Mix & More',
      image: 'https://images.unsplash.com/photo-1596040033229-a0b3b4f88dd2?w=1650&h=450&fit=crop&q=80',
      link: '/category/food-spices'
    },
    {
      id: 5,
      title: 'Handicrafts',
      titleAr: 'الحرف اليدوية',
      subtitle: 'Artisan Craftsmanship',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1650&h=450&fit=crop&q=80',
      link: '/category/traditional-crafts'
    }
  ]);

  /**
   * Computed property that maps API hero banners to slider format
   * Falls back to mock data if no API banners are provided
   *
   * Transformation:
   * - API HeroBanner → Slider HeroBanner format
   * - Uses API data if available, otherwise uses mock data
   */
  heroBanners = computed<HeroBanner[]>(() => {
    const apiBanners = this.heroBannersFromApi();

    // If we have API banners, transform them to slider format
    if (apiBanners && apiBanners.length > 0) {
      return apiBanners.map((banner, index) => ({
        id: index + 1, // Simple numeric ID for slider
        title: banner.headline.english,
        titleAr: banner.headline.arabic,
        subtitle: banner.subheadline?.english || '',
        image: banner.image.url, // Desktop image URL
        link: banner.targetRoute.target
      }));
    }

    // Fallback to mock data if no API banners
    return this.mockHeroBanners();
  });

  // Mock data - Promotional Offers (Right Sidebar)
  // Top promotional card
  topOffer = signal<PromotionalOffer>({
    id: 1,
    title: 'Damascus Steel Collection',
    titleAr: 'مجموعة الفولاذ الدمشقي',
    description: '100% handmade authentic Damascus steel',
    descriptionAr: 'صناعة يدوية أصيلة ١٠٠٪',
    image: 'https://images.unsplash.com/photo-1589698423558-7537249a5144?w=600&h=400&fit=crop&q=80',
    discountBadge: '20%\nOFF',
    badgeColor: '#E94E1B', // Orange
    targetUrl: '/category/damascus-steel',
    imagePosition: 'center'
  });

  // Bottom promotional card
  bottomOffer = signal<PromotionalOffer>({
    id: 2,
    title: 'Premium Aleppo Soap',
    titleAr: 'صابون حلب الفاخر',
    description: 'Experience with best natural soap on the world',
    descriptionAr: 'تجربة أفضل صابون طبيعي في العالم',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
    discountBadge: '40%\nOFF',
    badgeColor: '#DC2626', // Red
    targetUrl: '/category/beauty-wellness',
    imagePosition: 'center'
  });
}
