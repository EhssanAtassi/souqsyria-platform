import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, retry, timer } from 'rxjs';
import { of } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CampaignHeroComponent } from '../campaigns/campaign-hero/campaign-hero.component';
import { SliderImageSwiperComponent } from '../../components/slider-image-swiper/slider-image-swiper.component';
import { OffersSectionComponent, Offer } from '../../components/offers-section/offers-section.component';
import { HeroDualPanelComponent } from './components/hero-dual-panel/hero-dual-panel.component';
import { MarketplaceSectionComponent } from './components/marketplace-section/marketplace-section.component';
import { HeroSplitLayoutComponent } from './components/hero-split-layout/hero-split-layout.component';
import { CategoryShowcaseSectionComponent } from './components/category-showcase-section/category-showcase-section.component';
import { ProductOffersRowComponent } from '../../shared/components/product-offers-row/product-offers-row.component';
import { Product } from '../../shared/interfaces/product.interface';
import { Campaign } from '../../shared/interfaces/campaign.interface';
import { HeroBanner, CTAClickEvent, BannerSlideEvent } from '../hero-banners/interfaces/hero-banner.interface';
import { CategoryShowcaseSection, BannerClickEvent, SubcategoryClickEvent } from '../../shared/interfaces/category-showcase.interface';
import { ProductOffer, ProductOfferClickEvent } from '../../shared/interfaces/product-offer.interface';
import { ProductsService } from '../../store/products/products.service';
import { ProductsQuery } from '../../store/products/products.query';
import { CartService } from '../../store/cart/cart.service';
import { HeroBannersService } from '../../store/hero-banners/hero-banners.service';
import { HeroBannersQuery } from '../../store/hero-banners/hero-banners.query';
import { CategoryService } from '../../shared/services/category.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { HomepageSectionsService } from '../../shared/services/homepage-sections.service';
import { ProductOffersService } from '../../shared/services/product-offers.service';
import { environment } from '../../../environments/environment';

// Category Integration (S1 Categories Sprint)
import { FeaturedCategoriesComponent } from '../category/components/featured-categories/featured-categories.component';
import { CategorySkeletonComponent } from '../category/components/category-skeleton/category-skeleton.component';
import { CategoryApiService } from '../category/services/category-api.service';
import { FeaturedCategory } from '../category/models/category-tree.interface';
import { HeroSkeletonComponent } from '../../shared/components/hero-skeleton/hero-skeleton.component';

/**
 * SouqSyria Syrian Marketplace Homepage Component
 *
 * Features an authentic Syrian marketplace homepage with:
 * - Compact hero section with Syrian branding and cultural colors
 * - Featured categories grid with square images and discount badges
 * - Quick navigation menu with icons and sticky positioning
 * - Product grid with Syrian Pound (SYP) pricing
 * - Full Arabic/English bilingual support with RTL compatibility
 * - Syrian flag colors and traditional marketplace aesthetics
 *
 * @swagger
 * components:
 *   schemas:
 *     HomepageComponent:
 *       type: object
 *       properties:
 *         featuredCategories:
 *           type: array
 *           description: Featured categories with square images, colors, and discount percentages
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name in English
 *               nameAr:
 *                 type: string
 *                 description: Category name in Arabic
 *               icon:
 *                 type: string
 *                 description: Material icon name
 *               color:
 *                 type: string
 *                 description: Hex color code for category theme
 *               discount:
 *                 type: string
 *                 description: Discount percentage (e.g., '25%')
 *               route:
 *                 type: string
 *                 description: Navigation route
 *         quickNavCategories:
 *           type: array
 *           description: Quick navigation items for sticky menu
 *         featuredProducts:
 *           type: array
 *           description: Featured products with Syrian Pound pricing and Arabic translations
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *               title:
 *                 type: string
 *                 description: Product title in English
 *               titleAr:
 *                 type: string
 *                 description: Product title in Arabic
 *               originalPrice:
 *                 type: string
 *                 description: Original price in Syrian Pounds
 *               discountedPrice:
 *                 type: string
 *                 description: Discounted price in Syrian Pounds
 *               discount:
 *                 type: string
 *                 description: Discount percentage
 */
@Component({
  selector: 'app-homepage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    HeroSplitLayoutComponent,
    CategoryShowcaseSectionComponent,
    ProductOffersRowComponent,
    FeaturedCategoriesComponent,
    CategorySkeletonComponent,
    HeroSkeletonComponent
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent implements OnInit {
  //#region Private Properties and Lifecycle Management

  /** DestroyRef for automatic subscription cleanup */
  private readonly destroyRef = inject(DestroyRef);

  /** Maximum retry attempts for failed operations */
  public readonly MAX_RETRY_ATTEMPTS = 3;

  /** Delay between retry attempts in milliseconds */
  private readonly RETRY_DELAY_MS = 1000;

  //#endregion

  /**
   * Hero slider images for the Syrian marketplace homepage
   * @description DEPRECATED - Replaced by hero dual panel component
   * @deprecated Use getHeroDualPanelOfferBanners() instead
   */
  heroSliderImages = [
    {
      src: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
      alt: 'Damascus Steel Heritage Collection',
      link: '/category/damascus-steel'
    },
    {
      src: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
      alt: 'Premium Aleppo Soap Collection',
      link: '/category/beauty-wellness'
    },
    {
      src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
      alt: 'Syrian Textiles and Fabrics',
      link: '/category/textiles-fabrics'
    },
    {
      src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
      alt: 'Syrian Spices and Traditional Blends',
      link: '/category/food-spices'
    },
    {
      src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&q=80',
      alt: 'Syrian Traditional Crafts',
      link: '/category/traditional-crafts'
    }
  ];

  /**
   * Featured Syrian categories with authentic cultural styling
   * @description Prominent categories displayed in promotional grid with Syrian heritage design
   */
  featuredCategories = [
    {
      name: 'Damascus Steel',
      nameAr: 'الفولاذ الدمشقي',
      icon: 'hardware',
      color: '#059669',
      discount: '15%',
      route: '/category/damascus-steel'
    },
    {
      name: 'Beauty & Wellness',
      nameAr: 'الجمال والعافية',
      icon: 'face',
      color: '#C41E3A',
      discount: '20%',
      route: '/category/beauty-wellness'
    },
    {
      name: 'Textiles & Fabrics',
      nameAr: 'المنسوجات والأقمشة',
      icon: 'texture',
      color: '#D4AF37',
      discount: '25%',
      route: '/category/textiles-fabrics'
    },
    {
      name: 'Food & Spices',
      nameAr: 'الطعام والبهارات',
      icon: 'restaurant',
      color: '#EA580C',
      discount: '10%',
      route: '/category/food-spices'
    },
    {
      name: 'Traditional Crafts',
      nameAr: 'الحرف التقليدية',
      icon: 'handyman',
      color: '#1E3A8A',
      discount: '30%',
      route: '/category/traditional-crafts'
    },
    {
      name: 'Jewelry & Accessories',
      nameAr: 'المجوهرات والإكسسوارات',
      icon: 'diamond',
      color: '#8B5CF6',
      discount: '35%',
      route: '/category/jewelry-accessories'
    }
  ];

  /**
   * Quick navigation categories for sticky menu - Authentic Syrian Categories
   * @description Compact navigation menu with icons for Syrian marketplace quick access
   */
  quickNavCategories = [
    { name: 'Featured', icon: 'star', active: true, route: '/featured' },
    { name: 'Special Offers', icon: 'local_offer', active: false, route: '/campaigns/special-offers' },
    { name: 'New Arrivals', icon: 'new_releases', active: false, route: '/new-arrivals' },
    { name: 'Damascus Steel', icon: 'carpenter', active: false, route: '/category/damascus-steel' },
    { name: 'Beauty & Wellness', icon: 'spa', active: false, route: '/category/beauty-wellness' },
    { name: 'Textiles', icon: 'texture', active: false, route: '/category/textiles-fabrics' },
    { name: 'Food & Spices', icon: 'restaurant_menu', active: false, route: '/category/food-spices' },
    { name: 'Traditional Crafts', icon: 'handyman', active: false, route: '/category/traditional-crafts' },
    { name: 'Sweets', icon: 'cake', active: false, route: '/category/sweets-desserts' }
  ];

  //#region Reactive State Management with Signals

  /** All products loaded from the service */
  readonly allProducts = signal<Product[]>([]);

  /** Loading state for products */
  readonly isLoadingProducts = signal<boolean>(false);

  /** Error state for product loading */
  readonly productsError = signal<string | null>(null);

  /** Retry count for failed product loading */
  readonly retryCount = signal<number>(0);

  /** Categories loading state */
  readonly isLoadingCategories = signal<boolean>(false);

  /** Categories error state */
  readonly categoriesError = signal<string | null>(null);

  /** Campaign-related signals */
  readonly activeCampaigns = signal<Campaign[]>([]);
  readonly isLoadingCampaigns = signal<boolean>(false);
  readonly campaignsError = signal<string | null>(null);
  featuredProducts = computed(() => {
    const products = this.allProducts();
    console.log('Computing featured products from', products.length, 'total products');
    // Get products with discounts or high ratings
    const featured = products
      .filter(p => {
        const hasDiscount = p.price.discount?.percentage && p.price.discount.percentage > 0;
        const highRating = p.reviews.averageRating >= 4.5;
        // All our mock products should be featured since they have high ratings
        return hasDiscount || highRating;
      })
      .slice(0, 8);
    console.log('Featured products filtered:', featured.length, 'products');
    return featured;
  });

  newArrivals = computed(() => {
    const products = this.allProducts();
    // Sort by creation date and take recent ones
    return products
      .sort((a, b) => b.timestamps.created.getTime() - a.timestamps.created.getTime())
      .slice(0, 6);
  });

  topRated = computed(() => {
    const products = this.allProducts();
    // Sort by rating and reviews count
    return products
      .sort((a, b) => {
        const scoreA = a.reviews.averageRating * Math.log(a.reviews.totalReviews + 1);
        const scoreB = b.reviews.averageRating * Math.log(b.reviews.totalReviews + 1);
        return scoreB - scoreA;
      })
      .slice(0, 6);
  });

  //#region Dependency Injection with Modern Angular Patterns

  /** Angular router service for navigation */
  private readonly router = inject(Router);

  /** Material snackbar for user notifications */
  private readonly snackBar = inject(MatSnackBar);

  /** Service for product data management */
  private readonly productsService = inject(ProductsService);
  private readonly productsQuery = inject(ProductsQuery);

  /** Service for cart operations */
  private readonly cartService = inject(CartService);

  /** Service for category operations */
  private readonly categoryService = inject(CategoryService);

  /** Service for campaign operations */
  private readonly campaignService = inject(CampaignService);

  /** Service for homepage category showcase sections */
  private readonly homepageSectionsService = inject(HomepageSectionsService);

  /** Service for product offers */
  private readonly productOffersService = inject(ProductOffersService);

  /** Category API service for featured categories (S1 Categories Sprint) */
  private readonly categoryApiService = inject(CategoryApiService);

  /** Akita service for hero banners state management (public for template access) */
  readonly heroBannersService = inject(HeroBannersService);

  /** Akita query for hero banners reactive queries */
  private readonly heroBannersQuery = inject(HeroBannersQuery);

  //#endregion

  //#region Category Showcase Sections State

  /** Category showcase sections loaded from service */
  readonly categoryShowcaseSections = signal<CategoryShowcaseSection[]>([]);

  /** Loading state for category showcase sections */
  readonly isLoadingShowcaseSections = signal<boolean>(false);

  //#endregion

  //#region Product Offers State

  /** Featured product offers for horizontal row display */
  readonly featuredOffers = signal<ProductOffer[]>([]);

  /** Flash sale offers for promotional section */
  readonly flashSaleOffers = signal<ProductOffer[]>([]);

  /** Loading state for product offers */
  readonly isLoadingOffers = signal<boolean>(false);

  //#endregion

  //#region Featured Categories State (S1 Categories Sprint)

  /** Featured categories from backend API */
  readonly featuredCategoriesFromApi = signal<FeaturedCategory[]>([]);

  /** Loading state for featured categories */
  readonly isLoadingFeaturedCategories = signal<boolean>(false);

  //#endregion

  //#region Hero Banners State (Akita Store Integration)

  /** Observable of active hero banners from Akita store */
  readonly heroBanners$ = this.heroBannersQuery.selectActiveBanners$;

  /** Observable of hero banners loading state */
  readonly isLoadingHeroBanners$ = this.heroBannersQuery.selectLoading$;

  /** Observable of hero banners error state */
  readonly heroBannersError$ = this.heroBannersQuery.selectError$;

  /** Observable of featured banner (highest priority) */
  readonly featuredBanner$ = this.heroBannersQuery.selectFeaturedBanner$;

  //#endregion

  //#region Lifecycle Hooks

  /**
   * Component initialization
   * @description Loads Syrian products and categories with comprehensive error handling
   */
  ngOnInit(): void {
    try {
      console.log('SouqSyria Homepage initialized - Loading Syrian products...');

      // Load hero banners via Akita store (limit to 5 banners)
      this.heroBannersService.loadActiveBanners(5);
      console.log('✅ Hero banners loading initiated via Akita store');

      this.loadMockSyrianProducts();
      this.loadCategoryShowcaseSections();
      this.loadProductOffers();
      this.loadFeaturedCategories();
      // Load categories data (but skip campaign API calls)
      // TEMPORARILY COMMENTED OUT TO ISOLATE THE ISSUE
      // this.initializeData();
      console.log('Homepage ngOnInit completed successfully');
    } catch (error) {
      console.error('ERROR in homepage ngOnInit:', error);
    }
  }

  /**
   * Loads category showcase sections from service
   * @description Fetches admin-configured sections for homepage display
   */
  private loadCategoryShowcaseSections(): void {
    this.isLoadingShowcaseSections.set(true);

    this.homepageSectionsService.getVisibleSections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sections) => {
          this.categoryShowcaseSections.set(sections);
          this.isLoadingShowcaseSections.set(false);
          console.log(`✅ Loaded ${sections.length} category showcase sections`);
        },
        error: (error) => {
          console.error('Failed to load category showcase sections:', error);
          this.isLoadingShowcaseSections.set(false);
        }
      });
  }

  /**
   * Loads featured categories from backend API with graceful fallback
   *
   * @description Fetches featured categories from GET /api/categories/featured.
   * Maps API response fields (themeColor, featuredDiscount, slug) to the template
   * shape (color, discount, route). Falls back to hardcoded data when API returns
   * empty results or errors, ensuring the homepage always displays categories.
   *
   * @swagger
   * x-api-endpoint: GET /api/categories/featured?limit=6
   * x-fallback: hardcoded featuredCategories array
   */
  private loadFeaturedCategories(): void {
    this.isLoadingFeaturedCategories.set(true);

    this.categoryApiService.getFeatured(6)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Store raw API data for components that use FeaturedCategory interface
          this.featuredCategoriesFromApi.set(response.data);

          if (response.data && response.data.length > 0) {
            // Map API data to the template-friendly shape used by the cards grid
            this.featuredCategories = response.data.map(cat => ({
              name: cat.name,
              nameAr: cat.nameAr,
              icon: cat.icon || 'category',
              color: cat.themeColor || '#C8A860',
              discount: cat.featuredDiscount || '',
              route: '/category/' + cat.slug,
            }));
            console.log(`✅ Loaded ${response.data.length} featured categories from API`);
          } else {
            console.log('ℹ️ API returned empty featured categories — using hardcoded fallback');
            // Keep existing hardcoded featuredCategories data (already set on the property)
          }
          this.isLoadingFeaturedCategories.set(false);
        },
        error: (error) => {
          console.warn('⚠️ Featured categories API failed — using hardcoded fallback:', error?.message || error);
          // Keep existing hardcoded featuredCategories (graceful degradation)
          this.isLoadingFeaturedCategories.set(false);
        }
      });
  }

  /**
   * Handle featured category click from API component (S1 Categories Sprint)
   * @description Navigates to category page when featured category is clicked
   * @param slug - Category slug
   */
  onFeaturedCategoryClickApi(slug: string): void {
    console.log('Featured category clicked (API):', slug);
    this.router.navigate(['/categories', slug]);
  }

  /**
   * Loads product offers from service
   * @description Fetches promotional product offers for display in horizontal row
   */
  private loadProductOffers(): void {
    this.isLoadingOffers.set(true);

    // Load featured offers
    this.productOffersService.getFeaturedOffers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (offers) => {
          this.featuredOffers.set(offers);
          console.log(`✅ Loaded ${offers.length} featured product offers`);
        },
        error: (error) => {
          console.error('Failed to load featured offers:', error);
        }
      });

    // Load flash sale offers
    this.productOffersService.getFlashSaleOffers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (offers) => {
          this.flashSaleOffers.set(offers);
          this.isLoadingOffers.set(false);
          console.log(`✅ Loaded ${offers.length} flash sale offers`);
        },
        error: (error) => {
          console.error('Failed to load flash sale offers:', error);
          this.isLoadingOffers.set(false);
        }
      });
  }

  //#endregion

  //#region Mock Syrian Products Data

  /**
   * Loads mock Syrian marketplace products for demonstration
   * @description Provides authentic Syrian products for hero section and homepage display
   */
  private loadMockSyrianProducts(): void {
    const mockSyrianProducts: Product[] = [
      {
        id: 'damascus-steel-knife-001',
        name: 'Damascus Steel Chef Knife',
        nameArabic: 'سكين الطبخ الدمشقي',
        slug: 'damascus-steel-chef-knife',
        description: 'Handcrafted Damascus steel chef knife with traditional Syrian forging techniques',
        descriptionArabic: 'سكين طبخ من الفولاذ الدمشقي المصنوع يدوياً بالتقنيات السورية التقليدية',
        price: {
          amount: 150,
          currency: 'USD',
          originalPrice: 200
        },
        images: [
          {
            id: 'damascus-knife-1',
            url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
            alt: 'Damascus Steel Knife',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'damascus-steel',
          name: 'Damascus Steel',
          nameArabic: 'الفولاذ الدمشقي',
          slug: 'damascus-steel',
          breadcrumb: ['Home', 'Categories', 'Damascus Steel']
        },
        inventory: {
          inStock: true,
          quantity: 25,
          minOrderQuantity: 1,
          status: 'in_stock',
          lowStockThreshold: 5
        },
        reviews: {
          averageRating: 4.8,
          totalReviews: 127,
          ratingDistribution: {
            1: 3,
            2: 2,
            3: 8,
            4: 31,
            5: 83
          }
        },
        specifications: {
          dimensions: { length: 25, width: 5, height: 2, unit: 'cm' },
          weight: { value: 300, unit: 'g' },
          materials: ['Damascus Steel', 'Walnut Wood Handle'],
          manufacturing: {
            method: 'Hand Forged',
            origin: 'Damascus, Syria',
            craftsman: 'Master Ahmad Al-Dimashqi'
          }
        },
        seller: {
          id: 'damascus-steel-artisans',
          name: 'Damascus Steel Artisans',
          nameArabic: 'حرفيو الفولاذ الدمشقي',
          location: { city: 'Damascus', governorate: 'Damascus' },
          rating: 4.9,
          reviewCount: 245,
          yearsInBusiness: 15,
          verified: true,
          specializations: ['Damascus Steel', 'Traditional Forging']
        },
        shipping: {
          methods: [{
            id: 'express',
            name: 'Express International',
            cost: { amount: 25, currency: 'USD' },
            deliveryTime: { min: 7, max: 14, unit: 'days' },
            trackingAvailable: true,
            insured: true
          }],
          deliveryTimes: {
            'North America': { min: 10, max: 15, unit: 'days' },
            'Europe': { min: 7, max: 12, unit: 'days' },
            'Asia': { min: 5, max: 10, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'UNESCO recognized Damascus steel craftsmanship',
          traditionalTechniques: ['Pattern Welding', 'Hand Forging'],
          unescoRecognition: true,
          badges: ['UNESCO Heritage', 'Handcrafted', 'Syrian Artisan']
        },
        timestamps: {
          created: new Date('2024-01-01'),
          updated: new Date('2024-01-15')
        },
        tags: ['featured', 'handcrafted', 'damascus', 'unesco-heritage']
      },
      {
        id: 'aleppo-soap-premium-002',
        name: 'Premium Aleppo Laurel Soap',
        nameArabic: 'صابون حلب الفاخر بالغار',
        slug: 'premium-aleppo-laurel-soap',
        description: 'Traditional Aleppo soap with 40% laurel oil, UNESCO recognized heritage craft',
        descriptionArabic: 'صابون حلب التقليدي بزيت الغار 40%، حرفة تراثية معترف بها من اليونسكو',
        price: {
          amount: 25,
          currency: 'USD',
          originalPrice: 35
        },
        images: [
          {
            id: 'aleppo-soap-1',
            url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
            alt: 'Aleppo Soap',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'beauty-wellness',
          name: 'Beauty & Wellness',
          nameArabic: 'الجمال والعافية',
          slug: 'beauty-wellness',
          breadcrumb: ['Home', 'Categories', 'Beauty & Wellness']
        },
        inventory: {
          inStock: true,
          quantity: 150,
          minOrderQuantity: 1,
          status: 'in_stock',
          lowStockThreshold: 10
        },
        reviews: {
          averageRating: 4.9,
          totalReviews: 89,
          ratingDistribution: {
            1: 1,
            2: 1,
            3: 4,
            4: 18,
            5: 65
          }
        },
        specifications: {
          dimensions: { length: 10, width: 6, height: 4, unit: 'cm' },
          weight: { value: 150, unit: 'g' },
          materials: ['Olive Oil', '40% Laurel Oil', 'Natural Soda'],
          manufacturing: {
            method: 'Traditional Cold Process',
            origin: 'Aleppo, Syria',
            craftsman: 'Master Khalil Al-Halabi'
          }
        },
        seller: {
          id: 'aleppo-soap-masters',
          name: 'Aleppo Soap Masters',
          nameArabic: 'أساتذة صابون حلب',
          location: { city: 'Aleppo', governorate: 'Aleppo' },
          rating: 4.8,
          reviewCount: 189,
          yearsInBusiness: 25,
          verified: true,
          specializations: ['Aleppo Soap', 'Natural Cosmetics']
        },
        shipping: {
          methods: [{
            id: 'standard',
            name: 'Standard International',
            cost: { amount: 15, currency: 'USD' },
            deliveryTime: { min: 10, max: 20, unit: 'days' },
            trackingAvailable: true,
            insured: false
          }],
          deliveryTimes: {
            'North America': { min: 12, max: 20, unit: 'days' },
            'Europe': { min: 8, max: 15, unit: 'days' },
            'Middle East': { min: 3, max: 7, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'Traditional Aleppo soap making, UNESCO recognized',
          traditionalTechniques: ['Cold Process', 'Natural Aging'],
          unescoRecognition: true,
          badges: ['UNESCO Heritage', 'Natural', 'Traditional']
        },
        timestamps: {
          created: new Date('2024-01-02'),
          updated: new Date('2024-01-16')
        },
        tags: ['featured', 'unesco-heritage', 'natural', 'traditional']
      },
      {
        id: 'syrian-brocade-fabric-003',
        name: 'Syrian Brocade Fabric - Gold',
        nameArabic: 'قماش البروكار السوري الذهبي',
        slug: 'syrian-brocade-fabric-gold',
        description: 'Luxurious hand-woven Syrian brocade with gold threads, perfect for traditional garments',
        descriptionArabic: 'بروكار سوري منسوج يدوياً بخيوط ذهبية، مثالي للملابس التقليدية',
        price: {
          amount: 180,
          currency: 'USD'
        },
        images: [
          {
            id: 'syrian-brocade-1',
            url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
            alt: 'Syrian Brocade',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'textiles-fabrics',
          name: 'Textiles & Fabrics',
          nameArabic: 'المنسوجات والأقمشة',
          slug: 'textiles-fabrics',
          breadcrumb: ['Home', 'Categories', 'Textiles & Fabrics']
        },
        inventory: {
          inStock: true,
          quantity: 12,
          minOrderQuantity: 1,
          status: 'low_stock',
          lowStockThreshold: 15
        },
        reviews: {
          averageRating: 4.7,
          totalReviews: 34,
          ratingDistribution: {
            1: 1,
            2: 1,
            3: 3,
            4: 12,
            5: 17
          }
        },
        specifications: {
          dimensions: { length: 200, width: 150, height: 1, unit: 'cm' },
          weight: { value: 800, unit: 'g' },
          materials: ['Silk', 'Gold Thread', 'Cotton Base'],
          colors: ['Gold', 'Burgundy', 'Navy'],
          manufacturing: {
            method: 'Hand Weaving',
            origin: 'Damascus, Syria',
            craftsman: 'Master Weaver Fatima Al-Shami'
          }
        },
        seller: {
          id: 'damascus-textiles',
          name: 'Damascus Traditional Textiles',
          nameArabic: 'منسوجات دمشق التقليدية',
          location: { city: 'Damascus', governorate: 'Damascus' },
          rating: 4.7,
          reviewCount: 78,
          yearsInBusiness: 30,
          verified: true,
          specializations: ['Brocade', 'Traditional Weaving']
        },
        shipping: {
          methods: [{
            id: 'premium',
            name: 'Premium Shipping',
            cost: { amount: 30, currency: 'USD' },
            deliveryTime: { min: 5, max: 10, unit: 'days' },
            trackingAvailable: true,
            insured: true
          }],
          deliveryTimes: {
            'North America': { min: 8, max: 12, unit: 'days' },
            'Europe': { min: 5, max: 8, unit: 'days' },
            'Asia': { min: 3, max: 6, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'Traditional Syrian brocade weaving techniques',
          traditionalTechniques: ['Hand Weaving', 'Gold Thread Work'],
          unescoRecognition: false,
          badges: ['Handwoven', 'Luxury', 'Traditional']
        },
        timestamps: {
          created: new Date('2024-01-03'),
          updated: new Date('2024-01-17')
        },
        tags: ['featured', 'luxury', 'handwoven', 'gold-thread']
      },
      {
        id: 'damascus-seven-spice-004',
        name: 'Damascus Seven Spice Mix',
        nameArabic: 'بهارات الدمشقي السبعة',
        slug: 'damascus-seven-spice-mix',
        description: 'Authentic Syrian seven spice blend from Damascus markets',
        descriptionArabic: 'خلطة البهارات السبعة السورية الأصيلة من أسواق دمشق',
        price: {
          amount: 15,
          currency: 'USD'
        },
        images: [
          {
            id: 'syrian-spices-1',
            url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
            alt: 'Syrian Spices',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'food-spices',
          name: 'Food & Spices',
          nameArabic: 'الطعام والبهارات',
          slug: 'food-spices',
          breadcrumb: ['Home', 'Categories', 'Food & Spices']
        },
        inventory: {
          inStock: true,
          quantity: 200,
          minOrderQuantity: 1,
          status: 'in_stock',
          lowStockThreshold: 20
        },
        reviews: {
          averageRating: 4.6,
          totalReviews: 156,
          ratingDistribution: {
            1: 4,
            2: 6,
            3: 18,
            4: 67,
            5: 61
          }
        },
        specifications: {
          weight: { value: 100, unit: 'g' },
          materials: ['Black Pepper', 'Allspice', 'Cinnamon', 'Cloves', 'Nutmeg', 'Cardamom', 'Ginger'],
          manufacturing: {
            method: 'Traditional Grinding',
            origin: 'Damascus, Syria',
            craftsman: 'Spice Master Abu Omar'
          },
          careInstructions: ['Store in cool dry place', 'Keep sealed', 'Use within 2 years']
        },
        seller: {
          id: 'damascus-spice-market',
          name: 'Damascus Spice Market',
          nameArabic: 'سوق بهارات دمشق',
          location: { city: 'Damascus', governorate: 'Damascus' },
          rating: 4.6,
          reviewCount: 312,
          yearsInBusiness: 40,
          verified: true,
          specializations: ['Spices', 'Traditional Blends']
        },
        shipping: {
          methods: [{
            id: 'air-mail',
            name: 'Air Mail',
            cost: { amount: 12, currency: 'USD' },
            deliveryTime: { min: 14, max: 21, unit: 'days' },
            trackingAvailable: false,
            insured: false
          }],
          deliveryTimes: {
            'North America': { min: 18, max: 25, unit: 'days' },
            'Europe': { min: 14, max: 21, unit: 'days' },
            'Middle East': { min: 7, max: 14, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'Traditional Damascus spice blending heritage',
          traditionalTechniques: ['Hand Grinding', 'Traditional Blending'],
          unescoRecognition: false,
          badges: ['Authentic', 'Traditional', 'Damascus']
        },
        timestamps: {
          created: new Date('2024-01-04'),
          updated: new Date('2024-01-18')
        },
        tags: ['featured', 'authentic', 'damascus', 'spices']
      },
      {
        id: 'syrian-walnut-chess-005',
        name: 'Syrian Walnut Chess Set',
        nameArabic: 'طقم شطرنج من خشب الجوز السوري',
        slug: 'syrian-walnut-chess-set',
        description: 'Hand-carved chess set from Syrian walnut wood with traditional Islamic patterns',
        descriptionArabic: 'طقم شطرنج منحوت يدوياً من خشب الجوز السوري مع نقوش إسلامية تقليدية',
        price: {
          amount: 120,
          currency: 'USD'
        },
        images: [
          {
            id: 'chess-set-1',
            url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&q=80',
            alt: 'Chess Set',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'traditional-crafts',
          name: 'Traditional Crafts',
          nameArabic: 'الحرف التقليدية',
          slug: 'traditional-crafts',
          breadcrumb: ['Home', 'Categories', 'Traditional Crafts']
        },
        inventory: {
          inStock: true,
          quantity: 8,
          minOrderQuantity: 1,
          status: 'low_stock',
          lowStockThreshold: 10
        },
        reviews: {
          averageRating: 4.9,
          totalReviews: 23,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 1,
            4: 4,
            5: 18
          }
        },
        specifications: {
          dimensions: { length: 40, width: 40, height: 8, unit: 'cm' },
          weight: { value: 2000, unit: 'g' },
          materials: ['Syrian Walnut Wood', 'Natural Finish'],
          manufacturing: {
            method: 'Hand Carving',
            origin: 'Aleppo, Syria',
            craftsman: 'Master Carpenter Mahmoud Al-Najjar'
          },
          careInstructions: ['Keep away from moisture', 'Clean with dry cloth', 'Apply wood oil annually']
        },
        seller: {
          id: 'aleppo-woodworkers',
          name: 'Aleppo Traditional Woodworkers',
          nameArabic: 'نجارو حلب التقليديون',
          location: { city: 'Aleppo', governorate: 'Aleppo' },
          rating: 4.9,
          reviewCount: 67,
          yearsInBusiness: 35,
          verified: true,
          specializations: ['Wood Carving', 'Traditional Games']
        },
        shipping: {
          methods: [{
            id: 'fragile',
            name: 'Fragile Item Shipping',
            cost: { amount: 35, currency: 'USD' },
            deliveryTime: { min: 10, max: 18, unit: 'days' },
            trackingAvailable: true,
            insured: true
          }],
          deliveryTimes: {
            'North America': { min: 15, max: 22, unit: 'days' },
            'Europe': { min: 10, max: 18, unit: 'days' },
            'Asia': { min: 8, max: 15, unit: 'days' }
          }
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'Traditional Syrian woodworking and Islamic art',
          traditionalTechniques: ['Hand Carving', 'Islamic Pattern Work'],
          unescoRecognition: false,
          badges: ['Handcarved', 'Traditional', 'Walnut Wood']
        },
        timestamps: {
          created: new Date('2024-01-05'),
          updated: new Date('2024-01-19')
        },
        tags: ['featured', 'handcarved', 'walnut-wood', 'traditional']
      },
      {
        id: 'syrian-oud-perfume-006',
        name: 'Traditional Syrian Oud Perfume Oil',
        nameArabic: 'زيت عطر العود السوري التقليدي',
        slug: 'traditional-syrian-oud-perfume-oil',
        description: 'Premium oud perfume oil from Syrian agarwood, aged 15 years',
        descriptionArabic: 'زيت عطر العود الفاخر من خشب العود السوري، معتق لمدة 15 سنة',
        price: {
          amount: 85,
          currency: 'USD'
        },
        images: [
          {
            id: 'oud-perfume-1',
            url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=400&fit=crop&q=80',
            alt: 'Oud Perfume',
            isPrimary: true,
            order: 1
          }
        ],
        category: {
          id: 'jewelry-accessories',
          name: 'Jewelry & Accessories',
          nameArabic: 'المجوهرات والإكسسوارات',
          slug: 'jewelry-accessories',
          breadcrumb: ['Home', 'Categories', 'Jewelry & Accessories']
        },
        inventory: {
          inStock: true,
          quantity: 45,
          minOrderQuantity: 1,
          status: 'in_stock',
          lowStockThreshold: 10
        },
        reviews: {
          averageRating: 4.8,
          totalReviews: 67,
          ratingDistribution: {
            1: 2,
            2: 1,
            3: 4,
            4: 15,
            5: 45
          }
        },
        specifications: {
          weight: { value: 12, unit: 'g' },
          materials: ['Aged Agarwood', 'Natural Essential Oils'],
          manufacturing: {
            method: 'Traditional Distillation',
            origin: 'Damascus, Syria',
            craftsman: 'Master Perfumer Hassan Al-Attar'
          },
          careInstructions: ['Store in cool place', 'Keep away from direct sunlight', 'Use within 5 years']
        },
        seller: {
          id: 'damascus-perfumes',
          name: 'Damascus Traditional Perfumes',
          nameArabic: 'عطور دمشق التقليدية',
          location: { city: 'Damascus', governorate: 'Damascus' },
          rating: 4.8,
          reviewCount: 145,
          yearsInBusiness: 20,
          verified: true,
          specializations: ['Oud', 'Traditional Perfumes']
        },
        shipping: {
          methods: [{
            id: 'liquid',
            name: 'Liquid Fragrance Shipping',
            cost: { amount: 20, currency: 'USD' },
            deliveryTime: { min: 12, max: 20, unit: 'days' },
            trackingAvailable: true,
            insured: true
          }],
          deliveryTimes: {
            'North America': { min: 15, max: 25, unit: 'days' },
            'Europe': { min: 12, max: 20, unit: 'days' },
            'Middle East': { min: 5, max: 10, unit: 'days' }
          },
          restrictions: ['Check local customs regulations for perfume imports']
        },
        authenticity: {
          certified: true,
          heritage: 'traditional',
          culturalSignificance: 'Traditional Syrian perfume making with aged agarwood',
          traditionalTechniques: ['Steam Distillation', 'Aging Process'],
          unescoRecognition: false,
          badges: ['Premium', 'Aged', 'Traditional']
        },
        timestamps: {
          created: new Date('2024-01-06'),
          updated: new Date('2024-01-20')
        },
        tags: ['featured', 'premium', 'aged', 'agarwood']
      }
    ];

    console.log('Loading mock Syrian products for hero section:', mockSyrianProducts.length);
    this.allProducts.set(mockSyrianProducts);

    // Also load mock campaigns for hero slider
    this.loadMockCampaigns();
  }

  /**
   * Loads mock Syrian campaigns for hero slider
   * @description Provides sample campaigns showcasing Syrian marketplace heritage
   */
  private loadMockCampaigns(): void {
    const mockCampaigns: Campaign[] = [
      {
        id: 'damascus-steel-heritage-campaign',
        name: 'Damascus Steel Heritage Collection',
        nameArabic: 'مجموعة تراث الفولاذ الدمشقي',
        type: 'product_spotlight',
        status: 'active',
        heroImage: {
          url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
          alt: {
            english: 'Damascus Steel Heritage',
            arabic: 'تراث الفولاذ الدمشقي'
          },
          dimensions: {
            width: 1200,
            height: 600
          },
          format: 'jpg',
          size: 245760
        },
        headline: {
          english: 'Authentic Damascus Steel Collection',
          arabic: 'مجموعة الفولاذ الدمشقي الأصيل'
        },
        subheadline: {
          english: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
          arabic: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام'
        },
        cta: {
          text: {
            english: 'Shop Damascus Steel',
            arabic: 'تسوق الفولاذ الدمشقي'
          },
          variant: 'primary',
          size: 'large',
          color: 'syrian-red',
          icon: 'arrow_forward',
          iconPosition: 'right'
        },
        targetRoute: {
          type: 'category',
          target: '/category/damascus-steel',
          tracking: {
            source: 'hero-slider',
            medium: 'campaign',
            campaign: 'damascus-steel-heritage-campaign'
          }
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          timezone: 'Asia/Damascus'
        },
        analytics: {
          impressions: 15420,
          clicks: 892,
          clickThroughRate: 5.78,
          conversions: 127,
          conversionRate: 14.24,
          revenue: 19050,
          lastUpdated: new Date('2024-01-15')
        },
        syrianData: {
          region: 'damascus',
          specialties: ['Damascus Steel', 'Traditional Forging'],
          culturalContext: {
            english: 'Damascus steel represents centuries of Syrian metallurgical excellence',
            arabic: 'يمثل الفولاذ الدمشقي قروناً من التميز المعدني السوري'
          },
          unescoRecognition: true,
          artisan: {
            name: {
              english: 'Master Ahmad Al-Dimashqi',
              arabic: 'الأستاذ أحمد الدمشقي'
            },
            bio: {
              english: 'Third generation Damascus steel craftsman',
              arabic: 'حرفي فولاذ دمشقي من الجيل الثالث'
            },
            location: 'Damascus Old City',
            experience: 25,
            specialization: ['Blade Forging', 'Pattern Welding']
          }
        },
        metadata: {
          createdBy: 'admin@souqsyria.com',
          createdAt: new Date('2024-01-01'),
          updatedBy: 'admin@souqsyria.com',
          updatedAt: new Date('2024-01-15'),
          version: 1,
          tags: ['damascus-steel', 'heritage', 'artisan'],
          priority: 9
        }
      },
      {
        id: 'aleppo-soap-unesco-campaign',
        name: 'UNESCO Heritage Aleppo Soap',
        nameArabic: 'صابون حلب تراث اليونسكو',
        type: 'seasonal',
        status: 'active',
        heroImage: {
          url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
          alt: {
            english: 'Aleppo Soap Heritage',
            arabic: 'تراث صابون حلب'
          },
          dimensions: {
            width: 1200,
            height: 600
          },
          format: 'jpg',
          size: 230400
        },
        headline: {
          english: 'Premium Aleppo Soap - UNESCO Heritage',
          arabic: 'صابون حلب الفاخر - تراث اليونسكو'
        },
        subheadline: {
          english: 'Traditional craftsmanship recognized by UNESCO World Heritage',
          arabic: 'الحرفية التقليدية معترف بها من قبل التراث العالمي لليونسكو'
        },
        cta: {
          text: {
            english: 'Explore Heritage Soaps',
            arabic: 'استكشف صابون التراث'
          },
          variant: 'primary',
          size: 'large',
          color: 'golden',
          icon: 'explore',
          iconPosition: 'right'
        },
        targetRoute: {
          type: 'category',
          target: '/category/beauty-wellness',
          tracking: {
            source: 'hero-slider',
            medium: 'campaign',
            campaign: 'aleppo-soap-unesco-campaign'
          }
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          timezone: 'Asia/Damascus'
        },
        analytics: {
          impressions: 12850,
          clicks: 756,
          clickThroughRate: 5.88,
          conversions: 98,
          conversionRate: 12.96,
          revenue: 14700,
          lastUpdated: new Date('2024-01-15')
        },
        syrianData: {
          region: 'aleppo',
          specialties: ['Aleppo Soap', 'Laurel Oil'],
          culturalContext: {
            english: 'Aleppo soap is one of the oldest soaps in the world, recognized by UNESCO',
            arabic: 'صابون حلب هو أحد أقدم الصوابين في العالم، معترف به من قبل اليونيسكو'
          },
          unescoRecognition: true,
          artisan: {
            name: {
              english: 'Master Khalil Al-Halabi',
              arabic: 'الأستاذ خليل الحلبي'
            },
            bio: {
              english: 'Fifth generation Aleppo soap maker',
              arabic: 'صانع صابور حلب من الجيل الخامس'
            },
            location: 'Aleppo Ancient Souq',
            experience: 35,
            specialization: ['Soap Making', 'Laurel Oil Processing']
          }
        },
        metadata: {
          createdBy: 'admin@souqsyria.com',
          createdAt: new Date('2024-01-01'),
          updatedBy: 'admin@souqsyria.com',
          updatedAt: new Date('2024-01-15'),
          version: 1,
          tags: ['aleppo-soap', 'unesco', 'beauty'],
          priority: 8
        }
      },
      {
        id: 'ramadan-special-campaign',
        name: 'Ramadan Special Collection',
        nameArabic: 'مجموعة رمضان الخاصة',
        type: 'seasonal',
        status: 'active',
        heroImage: {
          url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
          alt: {
            english: 'Ramadan Special',
            arabic: 'عرض رمضان الخاص'
          },
          dimensions: {
            width: 1200,
            height: 600
          },
          format: 'jpg',
          size: 267264
        },
        headline: {
          english: 'Ramadan Blessings Collection',
          arabic: 'مجموعة بركات رمضان'
        },
        subheadline: {
          english: 'Traditional Syrian products for the holy month',
          arabic: 'منتجات سورية تقليدية للشهر الكريم'
        },
        cta: {
          text: {
            english: 'Shop Ramadan Collection',
            arabic: 'تسوق مجموعة رمضان'
          },
          variant: 'primary',
          size: 'large',
          color: 'emerald',
          icon: 'mosque',
          iconPosition: 'left'
        },
        targetRoute: {
          type: 'category',
          target: '/category/food-spices',
          tracking: {
            source: 'hero-slider',
            medium: 'campaign',
            campaign: 'ramadan-special-campaign'
          }
        },
        schedule: {
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-04-30'),
          timezone: 'Asia/Damascus'
        },
        analytics: {
          impressions: 8940,
          clicks: 543,
          clickThroughRate: 6.07,
          conversions: 76,
          conversionRate: 14.00,
          revenue: 11400,
          lastUpdated: new Date('2024-03-15')
        },
        syrianData: {
          region: 'all',
          specialties: ['Traditional Sweets', 'Syrian Spices', 'Dates'],
          culturalContext: {
            english: 'Traditional Syrian foods and sweets for the blessed month of Ramadan',
            arabic: 'الأطعمة والحلويات السورية التقليدية لشهر رمضان المبارك'
          },
          seasonality: {
            season: 'spring',
            culturalEvents: ['Ramadan', 'Eid al-Fitr'],
            traditionalProducts: ['Ma\'amoul', 'Dates', 'Qatayef']
          }
        },
        metadata: {
          createdBy: 'admin@souqsyria.com',
          createdAt: new Date('2024-03-01'),
          updatedBy: 'admin@souqsyria.com',
          updatedAt: new Date('2024-03-15'),
          version: 1,
          tags: ['ramadan', 'seasonal', 'cultural'],
          priority: 10
        }
      }
    ];

    console.log('Loading mock campaigns for hero slider:', mockCampaigns.length);
    console.log('Mock campaigns data:', mockCampaigns);
    this.activeCampaigns.set(mockCampaigns);

    // Debug: Check if campaigns are properly set
    setTimeout(() => {
      console.log('Active campaigns signal:', this.activeCampaigns());
      console.log('Featured products signal:', this.featuredProducts());
    }, 100);
  }

  //#endregion

  //#region Data Loading and Error Handling

  /**
   * Initializes all component data
   * @description Loads products and categories with comprehensive error handling and retry logic
   */
  private initializeData(): void {
    // Only load from API if not in offline mode
    if (!environment.forceOfflineMode) {
      this.loadProductsWithRetry();
    } else {
      console.log('Offline mode enabled - skipping product API calls');
    }
    this.loadCategoriesData();
    this.loadCampaignsData();
  }

  /**
   * Loads products with retry logic and comprehensive error handling
   * @description Fetches all Syrian marketplace products with automatic retry on failure
   */
  private loadProductsWithRetry(): void {
    this.isLoadingProducts.set(true);
    this.productsError.set(null);

    // Load products using Akita with proper async handling
    this.productsService.loadProducts().subscribe({
      next: (products) => {
        this.allProducts.set(products);
        this.retryCount.set(0);
        console.log(`Successfully loaded ${products.length} Syrian products`);

        if (products.length === 0) {
          this.showInfoNotification('No products available at the moment');
        }

        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        const errorMsg = this.getErrorMessage(error);
        this.productsError.set(errorMsg);
        this.isLoadingProducts.set(false);
        this.showErrorNotification(errorMsg);
        console.error('Failed to load products:', error);
      }
    });
  }

  /**
   * Loads categories data for the homepage
   * @description Fetches category information with error handling
   */
  private loadCategoriesData(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        console.log(`Loaded ${categories.length} categories`);
        // Categories are handled by the category service
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  /**
   * Loads campaigns data for the homepage hero section
   * @description Fetches active campaigns with error handling
   */
  private loadCampaignsData(): void {
    this.campaignService.getCampaigns().subscribe({
      next: (campaigns) => {
        console.log(`Loaded ${campaigns.length} campaigns`);
        // Campaigns are accessible via campaignService signals
      },
      error: (error) => {
        console.error('Failed to load campaigns:', error);
      }
    });
  }

  /**
   * Extracts user-friendly error messages from error objects
   * @description Provides consistent error message formatting
   * @param error - The error object
   * @returns User-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.status) {
      switch (error.status) {
        case 0:
          return 'Network connection error. Please check your internet connection.';
        case 404:
          return 'Products not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `HTTP Error ${error.status}: ${error.statusText || 'Unknown error'}`;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }

  //#endregion

  /**
   * Handles featured category clicks
   * @description Navigates to specific featured category pages with analytics tracking
   * @param category - The clicked featured category
   */
  onFeaturedCategoryClick(category: any): void {
    console.log('Featured category clicked:', category.name, 'Arabic:', category.nameAr);
    // Track category interaction for analytics
    // gtag('event', 'category_click', { category_name: category.name, category_ar: category.nameAr });
    this.router.navigate([category.route]);
  }

  /**
   * Handles quick navigation category clicks
   * @description Updates active category and navigates to category page
   * @param category - The clicked quick navigation category
   */
  onQuickNavCategoryClick(category: any): void {
    // Update active state
    this.quickNavCategories.forEach(cat => cat.active = false);
    category.active = true;

    console.log('Quick nav category clicked:', category.name);
    // Track navigation interaction for analytics
    // gtag('event', 'quick_nav_click', { section_name: category.name });
    this.router.navigate([category.route]);
  }

  /**
   * Handles product clicks
   * @description Navigates to individual product detail pages
   * @param product - The clicked product
   */
  onProductClick(product: any): void {
    console.log('Product clicked:', product.title);
    this.router.navigate([product.route]);
  }

  //#region Hero Dual Panel Event Handlers

  /**
   * Handles offer banner clicks from hero dual panel
   * @description Processes promotional banner clicks and tracks analytics
   * @param event - Offer banner click event with tracking data
   */
  onHeroDualPanelOfferClick(event: { bannerId: string; link: string; source: string }): void {
    console.log('Homepage: Hero dual panel offer clicked', event);

    // Navigate to the offer link
    if (event.link) {
      this.router.navigateByUrl(event.link);
    }

    // Track analytics
    this.trackAnalyticsEvent('hero_offer_click', {
      banner_id: event.bannerId,
      banner_link: event.link,
      source: event.source,
      page: 'homepage'
    });
  }

  /**
   * Handles featured product clicks from hero dual panel
   * @description Processes featured product clicks and navigates to product detail
   * @param event - Featured product click event with tracking data
   */
  onHeroDualPanelProductClick(event: { productId: string; productName: string; source: string }): void {
    console.log('Homepage: Hero dual panel product clicked', event);

    // Find the product and navigate to its detail page
    const product = this.allProducts().find(p => p.id === event.productId);
    if (product) {
      this.router.navigate(['/product', product.slug]);
    } else {
      console.warn('Product not found:', event.productId);
      this.router.navigate(['/products']);
    }

    // Track analytics
    this.trackAnalyticsEvent('hero_featured_product_click', {
      product_id: event.productId,
      product_name: event.productName,
      source: event.source,
      page: 'homepage'
    });
  }

  /**
   * Handles featured product add to cart from hero dual panel
   * @description Processes add to cart action from featured product showcase
   * @param event - Add to cart event with product and price data
   */
  onHeroDualPanelAddToCart(event: { productId: string; productName: string; price: number; source: string }): void {
    console.log('Homepage: Hero dual panel add to cart', event);

    this.cartService.addToCart(event.productId, 1);

    const message = `${event.productName} added to cart!`;
    this.showSuccessNotification(message);

    // Track analytics
    this.trackAnalyticsEvent('add_to_cart', {
      currency: 'USD',
      value: event.price,
      items: [{
        item_id: event.productId,
        item_name: event.productName,
        price: event.price,
        quantity: 1
      }],
      source: event.source,
      page: 'homepage'
    });
  }

  /**
   * Generates offer banners for hero dual panel
   * @description Provides Syrian marketplace themed promotional banners
   * @returns Array of offer banner objects
   */
  getHeroDualPanelOfferBanners(): Array<any> {
    return [
      {
        src: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
        alt: 'Damascus Steel Heritage Collection',
        link: '/category/damascus-steel',
        titleAr: 'خصم 30% على الصناعات الدمشقية',
        titleEn: '30% OFF Damascus Crafts'
      },
      {
        src: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
        alt: 'Ramadan Special Offers',
        link: '/campaigns/ramadan-offers',
        titleAr: 'عروض رمضان المباركة',
        titleEn: 'Blessed Ramadan Offers'
      },
      {
        src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
        alt: 'Authentic Aleppo Products',
        link: '/category/aleppo-specialties',
        titleAr: 'منتجات حلب الأصيلة',
        titleEn: 'Authentic Aleppo Products'
      },
      {
        src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
        alt: 'Free Delivery Over $100',
        link: '/shipping-info',
        titleAr: 'توصيل مجاني للطلبات فوق 100$',
        titleEn: 'Free Delivery Over $100'
      },
      {
        src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&q=80',
        alt: 'Discover Syrian Heritage',
        link: '/heritage-collection',
        titleAr: 'اكتشف التراث السوري',
        titleEn: 'Discover Syrian Heritage'
      }
    ];
  }

  /**
   * Gets today's featured product for hero dual panel
   * @description Returns the first featured product or a default fallback
   * @returns Featured product object
   */
  getTodaysFeaturedProduct(): any {
    const featured = this.featuredProducts();
    if (featured.length > 0) {
      // Return the first featured product as today's pick
      return featured[0];
    }

    // Return fallback product if no featured products available
    return this.getDefaultFeaturedProduct();
  }

  /**
   * Provides default featured product for hero dual panel
   * @description Fallback product when no featured products are available
   * @returns Default featured product object
   */
  private getDefaultFeaturedProduct(): any {
    return {
      id: 'default-featured-damascus-knife',
      name: 'Damascus Steel Chef Knife',
      nameArabic: 'سكين الطبخ الدمشقي',
      slug: 'damascus-steel-chef-knife',
      description: 'Handcrafted Damascus steel chef knife with traditional Syrian forging techniques',
      descriptionArabic: 'سكين طبخ من الفولاذ الدمشقي المصنوع يدوياً بالتقنيات السورية التقليدية',
      price: {
        amount: 150,
        currency: 'USD',
        originalPrice: 200
      },
      images: [
        {
          id: 'damascus-knife-1',
          url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
          alt: 'Damascus Steel Knife',
          isPrimary: true,
          order: 1
        }
      ],
      category: {
        id: 'damascus-steel',
        name: 'Damascus Steel',
        nameArabic: 'الفولاذ الدمشقي',
        slug: 'damascus-steel'
      },
      inventory: {
        inStock: true,
        quantity: 25,
        status: 'in_stock'
      },
      reviews: {
        averageRating: 4.8,
        totalReviews: 127
      },
      authenticity: {
        certified: true,
        heritage: 'traditional',
        unescoRecognition: true,
        badges: ['UNESCO Heritage', 'Handcrafted', 'Syrian Artisan']
      },
      tags: ['featured', 'today-pick', 'damascus', 'unesco-heritage']
    };
  }

  //#endregion

  /**
   * Handles hero section CTA clicks (DEPRECATED - kept for compatibility)
   * @description Processes main promotional call-to-action buttons
   * @param action - The action type ('browse-marketplace' or other actions)
   * @deprecated Use hero dual panel component instead
   */
  onHeroCtaClick(action: string): void {
    console.log('Hero CTA clicked:', action);

    switch (action) {
      case 'browse-marketplace':
        this.router.navigate(['/categories/all']);
        break;
      case 'special-offers':
        this.router.navigate(['/campaigns/special-offers']);
        break;
      case 'flash-deals':
        this.router.navigate(['/campaigns/flash-deals']);
        break;
      default:
        console.warn('Unknown hero CTA action:', action);
    }

    // Track hero CTA interaction for analytics
    // gtag('event', 'hero_cta_click', { action_type: action });
  }

  /**
   * TrackBy function for featured categories optimization
   * @description Improves ngFor performance by tracking items by name
   * @param index - Array index
   * @param category - Category object
   * @returns Unique identifier for tracking
   */
  trackFeaturedCategory(index: number, category: any): string {
    return category.name;
  }

  /**
   * TrackBy function for quick navigation categories optimization
   * @description Improves ngFor performance by tracking items by name
   * @param index - Array index
   * @param category - Category object
   * @returns Unique identifier for tracking
   */
  trackQuickNavCategory(index: number, category: any): string {
    return category.name;
  }

  /**
   * TrackBy function for products optimization
   * @description Improves ngFor performance by tracking items by id
   * @param index - Array index
   * @param product - Product object
   * @returns Unique identifier for tracking
   */
  trackProduct(index: number, product: any): number {
    return product.id;
  }

  /**
   * Handles view all products button click
   * @description Navigates to all products page with analytics tracking
   */
  onViewAllProducts(): void {
    console.log('View all products clicked');
    // Track view all products interaction for analytics
    // gtag('event', 'view_all_products_click', { source: 'homepage' });
    this.router.navigate(['/categories/all']);
  }

  //#region User Interaction Handlers

  /**
   * Handles add to cart functionality with comprehensive error handling
   * @description Processes add to cart actions with Syrian Pound pricing
   * @param product - Product to add to cart
   * @param event - Click event to prevent propagation
   */
  onAddToCart(product: any, event: Event): void {
    event.stopPropagation();
    console.log('Add to cart clicked for:', product.title, 'Price:', product.discountedPrice);

    // Validate product before adding to cart
    if (!product || !product.id) {
      this.showErrorNotification('Invalid product selected');
      return;
    }

    // Check if product is in stock
    if (product.inventory && !product.inventory.inStock) {
      this.showErrorNotification('Product is currently out of stock');
      return;
    }

    // Track add to cart interaction for analytics
    this.trackAnalyticsEvent('add_to_cart', {
      currency: 'SYP',
      value: parseFloat(product.discountedPrice?.replace(/[^0-9]/g, '') || '0'),
      items: [{
        item_id: product.id,
        item_name: product.title,
        item_name_ar: product.titleAr,
        price: parseFloat(product.discountedPrice?.replace(/[^0-9]/g, '') || '0'),
        quantity: 1
      }]
    });

    this.cartService.addToCart(product.id, 1);

    const message = `${product.title} added to cart!`;
    this.showSuccessNotification(message);
  }

  /**
   * Retries loading products
   * @description Allows user to manually retry loading products after failure
   */
  onRetryLoadProducts(): void {
    console.log('User requested retry for loading products');
    this.loadProductsWithRetry();
  }

  /**
   * Retries loading categories
   * @description Allows user to manually retry loading categories after failure
   */
  onRetryLoadCategories(): void {
    console.log('User requested retry for loading categories');
    this.loadCategoriesData();
  }

  /**
   * Retries loading campaigns
   * @description Allows user to manually retry loading campaigns after failure
   */
  onRetryLoadCampaigns(): void {
    console.log('User requested retry for loading campaigns');
    this.loadCampaignsData();
  }

  //#endregion

  //#region Campaign Event Handlers

  /**
   * Handles campaign click events from hero component
   * @description Processes campaign interactions and tracks analytics
   * @param campaign - Clicked campaign
   */
  onCampaignClick(campaign: Campaign): void {
    console.log('Homepage campaign clicked:', campaign.name, 'Type:', campaign.type);

    // TEMPORARILY DISABLED - Service not available
    // this.campaignService.trackCampaignClick(campaign.id, {
    //   source: 'homepage_hero',
    //   position: 'main_slider',
    //   timestamp: new Date().toISOString()
    // }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Show success notification for Syrian cultural campaigns
    if (campaign.syrianData?.culturalContext) {
      const message = `Exploring Syrian ${campaign.syrianData.region || 'heritage'} products`;
      this.showSuccessNotification(message);
    }
  }

  /**
   * Handles campaign view events from hero component
   * @description Tracks campaign impressions for analytics
   * @param campaign - Viewed campaign
   */
  onCampaignView(campaign: Campaign): void {
    console.log('Homepage campaign viewed:', campaign.name);

    // TEMPORARILY DISABLED - Service not available
    // this.campaignService.trackCampaignImpression(campaign.id, {
    //   source: 'homepage_hero',
    //   position: 'main_slider',
    //   timestamp: new Date().toISOString()
    // }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /**
   * Handles campaign navigation changes
   * @description Tracks campaign slider navigation
   * @param navigationData - Navigation change data
   */
  onCampaignNavigation(navigationData: { previous: number; current: number }): void {
    console.log('Campaign navigation:', navigationData);

    // Track navigation analytics
    this.trackAnalyticsEvent('campaign_navigation', {
      source: 'homepage_hero',
      previous_slide: navigationData.previous,
      current_slide: navigationData.current,
      timestamp: new Date().toISOString()
    });
  }

  //#endregion

  //#region Hero Banner Event Handlers

  /**
   * Handles hero banner click events
   * @description Processes hero banner clicks and navigates to target route
   * @param banner - Clicked hero banner
   */
  onHeroBannerClick(banner: HeroBanner): void {
    console.log('Homepage: Hero banner clicked', banner.name.english);

    // Track banner click via Akita service
    this.heroBannersService.trackBannerClick(banner.id, {
      position: 0,
      targetUrl: banner.targetRoute.target
    });

    // Navigate to target route
    if (banner.targetRoute.target) {
      this.router.navigateByUrl(banner.targetRoute.target);
    }

    // Track analytics
    this.trackAnalyticsEvent('hero_banner_click', {
      banner_id: banner.id,
      banner_name: banner.name.english,
      banner_name_ar: banner.name.arabic,
      target_route: banner.targetRoute.target,
      page: 'homepage'
    });
  }

  /**
   * Handles hero banner CTA button click events
   * @description Processes hero banner CTA clicks and navigates to target route
   * @param event - CTA click event with banner and tracking data
   */
  onHeroBannerCTAClick(event: CTAClickEvent): void {
    console.log('Homepage: Hero banner CTA clicked', event.ctaText);

    // Track CTA click via Akita service
    this.heroBannersService.trackCTAClick(event.bannerId, event.ctaText, {
      position: event.position,
      ctaType: 'primary'
    });

    // Navigate to target route
    if (event.targetRoute) {
      this.router.navigateByUrl(event.targetRoute);
    }

    // Track analytics
    this.trackAnalyticsEvent('hero_banner_cta_click', {
      banner_id: event.bannerId,
      cta_text: event.ctaText,
      target_route: event.targetRoute,
      position: event.position,
      page: 'homepage'
    });
  }

  /**
   * Handles hero banner slide change events
   * @description Tracks slide changes for analytics
   * @param event - Slide change event with navigation data
   */
  onHeroBannerSlideChange(event: BannerSlideEvent): void {
    console.log('Homepage: Hero banner slide changed', {
      previous: event.previousIndex,
      current: event.currentIndex,
      method: event.method
    });

    // Track analytics
    this.trackAnalyticsEvent('hero_banner_slide_change', {
      previous_index: event.previousIndex,
      current_index: event.currentIndex,
      total_slides: event.totalSlides,
      method: event.method,
      page: 'homepage'
    });
  }

  /**
   * Handles hero banner error events
   * @description Displays error notification when hero banner fails to load
   * @param error - Error that occurred
   */
  onHeroBannerError(error: Error): void {
    console.error('Homepage: Hero banner error', error);
    this.showErrorNotification('Failed to load hero banners. Please refresh the page.');

    // Track error in analytics
    this.trackAnalyticsEvent('hero_banner_error', {
      error_message: error.message,
      page: 'homepage'
    });
  }

  //#endregion

  /**
   * Handles product grid product click events
   * @description Navigates to product detail page when product is clicked in the grid
   * @param product - The clicked product from Product Grid
   */
  onProductGridClick(product: Product): void {
    console.log('Product grid product clicked:', product.name);
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Handles product grid add to cart events with comprehensive error handling
   * @description Processes add to cart from Product Grid component
   * @param product - The product to add to cart
   */
  onProductGridAddToCart(product: Product): void {
    console.log('Product grid add to cart:', product.name, 'Price:', product.price.amount, product.price.currency);

    // Validate product inventory
    if (!product.inventory.inStock) {
      this.showErrorNotification('Product is currently out of stock');
      return;
    }

    if (product.inventory.quantity < 1) {
      this.showErrorNotification('Insufficient stock available');
      return;
    }

    this.cartService.addToCart(product.id, 1);

    const message = `${product.name} added to cart!`;
    this.showSuccessNotification(message);

    // Track add to cart interaction for analytics
    this.trackAnalyticsEvent('add_to_cart', {
      currency: product.price.currency,
      value: product.price.amount,
      item_id: product.id,
      item_name: product.name,
      category: product.category.name
    });
  }

  /**
   * Handles product grid wishlist toggle events with error handling
   * @description Processes wishlist toggle from Product Grid component
   * @param product - The product to toggle in wishlist
   */
  onProductGridToggleWishlist(product: Product): void {
    console.log('Product grid wishlist toggle:', product.name);

    // Track wishlist interaction for analytics
    this.trackAnalyticsEvent('add_to_wishlist', {
      currency: product.price.currency,
      value: product.price.amount,
      items: [{
        item_id: product.id,
        item_name: product.name,
        category: product.category.name,
        price: product.price.amount
      }]
    });

    // Wishlist toggle logic with error handling
    // this.wishlistService.toggleProduct(product)
    //   .pipe(
    //     catchError((error) => {
    //       console.error('Wishlist toggle error:', error);
    //       this.showErrorNotification('Failed to update wishlist');
    //       return of(false);
    //     }),
    //     takeUntilDestroyed(this.destroyRef)
    //   )
    //   .subscribe({
    //     next: (success) => {
    //       if (success) {
    //         const message = `${product.nameArabic || product.name} تم إضافته لقائمة الأمنيات | Added to wishlist`;
    //         this.showSuccessNotification(message);
    //       }
    //     }
    //   });

    // Temporary notification until wishlist service is implemented
    const message = `${product.nameArabic || product.name} تم إضافته لقائمة الأمنيات | Added to wishlist`;
    this.showSuccessNotification(message);
  }

  //#endregion

  //#region Notification Helper Methods

  /**
   * Shows success notification to user
   * @description Displays green success notification with Arabic/English text
   * @param message - Success message to display
   */
  private showSuccessNotification(message: string): void {
    this.snackBar.open(message, 'Close | إغلاق', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Shows error notification to user
   * @description Displays red error notification with action button
   * @param message - Error message to display
   * @param action - Optional action button text
   */
  private showErrorNotification(message: string, action: string = 'Close'): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Shows info notification to user
   * @description Displays blue info notification
   * @param message - Info message to display
   */
  private showInfoNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Tracks analytics events
   * @description Centralized analytics tracking with error handling
   * @param eventName - Name of the analytics event
   * @param parameters - Event parameters
   */
  private trackAnalyticsEvent(eventName: string, parameters: any): void {
    try {
      console.log(`Analytics: ${eventName}`, parameters);
      // Google Analytics 4 tracking
      // gtag('event', eventName, parameters);

      // Additional analytics providers can be added here
      // Adobe Analytics, Mixpanel, etc.
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Analytics errors should not break the application
    }
  }

  //#endregion

  //#region Template Helper Methods

  /**
   * Generates a safe test ID from category name
   * @description Creates kebab-case test IDs for categories by removing special characters
   * @param categoryName - The category name to convert
   * @param prefix - Optional prefix for the test ID
   * @returns Safe test ID string
   */
  getCategoryTestId(categoryName: string, prefix: string = 'category-card'): string {
    if (!categoryName) return prefix;
    return `${prefix}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Generates a safe test ID from product ID
   * @description Creates test IDs for products
   * @param productId - The product ID to convert
   * @param prefix - Optional prefix for the test ID
   * @returns Safe test ID string
   */
  getProductTestId(productId: number | string, prefix: string = 'product-card'): string {
    if (!productId) return prefix;
    return `${prefix}-${productId}`;
  }

  /**
   * Generates a safe test ID from any string
   * @description Creates kebab-case test IDs by removing special characters
   * @param text - The text to convert
   * @param prefix - Optional prefix for the test ID
   * @returns Safe test ID string
   */
  getSafeTestId(text: string, prefix: string = ''): string {
    if (!text) return prefix;
    const safeText = text.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return prefix ? `${prefix}-${safeText}` : safeText;
  }

  //#endregion

  /**
   * Special offers data for the offers section
   * @description Three promotional offers matching the banner style shown in the images
   */
  specialOffers: Offer[] = [
    {
      id: 'tech-electronics',
      title: 'Tech & Electronics Sale',
      titleAr: 'تخفيضات التكنولوجيا والإلكترونيات',
      description: 'Discover the latest technology and electronics with amazing discounts up to 50% off',
      descriptionAr: 'اكتشف أحدث التقنيات والإلكترونيات مع خصومات مذهلة تصل إلى 50%',
      imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
      offerUrl: '/offer/tech-electronics',
      discount: 'Up to 50% OFF',
      isActive: true,
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff'
    },
    {
      id: 'home-appliances',
      title: 'Home Appliances Special',
      titleAr: 'عرض خاص على الأجهزة المنزلية',
      description: 'Transform your home with premium appliances at unbeatable prices',
      descriptionAr: 'حول منزلك مع الأجهزة المميزة بأسعار لا تقاوم',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=400&fit=crop&q=80',
      offerUrl: '/offer/home-appliances',
      discount: 'Up to 40% OFF',
      isActive: true,
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      textColor: '#ffffff'
    },
    {
      id: 'fashion-lifestyle',
      title: 'Fashion & Lifestyle',
      titleAr: 'الموضة ونمط الحياة',
      description: 'Express your style with our curated collection of fashion and lifestyle products',
      descriptionAr: 'عبر عن أسلوبك مع مجموعتنا المنتقاة من منتجات الموضة ونمط الحياة',
      imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
      offerUrl: '/offer/fashion-lifestyle',
      discount: 'Up to 60% OFF',
      isActive: true,
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      textColor: '#ffffff'
    }
  ];

  //#endregion

  //#region Category Showcase Section Event Handlers

  /**
   * Handles featured banner click events from category showcase sections
   * @param event - Banner click event with analytics data
   */
  onShowcaseBannerClick(event: BannerClickEvent): void {
    console.log('Showcase banner clicked:', event);
    this.trackAnalyticsEvent('showcase_banner_click', {
      banner_id: event.bannerId,
      section_id: event.sectionId,
      target_url: event.targetUrl,
      ...event.analytics
    });
  }

  /**
   * Handles subcategory card click events from category showcase sections
   * @param event - Subcategory click event with analytics data
   */
  onShowcaseSubcategoryClick(event: SubcategoryClickEvent): void {
    console.log('Showcase subcategory clicked:', event);
    this.trackAnalyticsEvent('showcase_subcategory_click', {
      subcategory_id: event.subcategoryId,
      section_id: event.sectionId,
      category_name: event.categoryName,
      ...event.analytics
    });
  }

  //#endregion

  //#region Product Offers Event Handlers

  /**
   * Handles product offer card click events
   * @param event - Product offer click event with timestamp
   */
  onProductOfferClick(event: ProductOfferClickEvent): void {
    console.log('Product offer clicked:', event);
    this.trackAnalyticsEvent('product_offer_click', {
      offer_id: event.offer.id,
      offer_title: event.offer.title,
      price_display_type: event.offer.priceDisplay.type,
      target_url: event.offer.targetUrl,
      filter_params: event.offer.filterParams,
      timestamp: event.timestamp
    });
  }

  //#endregion
}
