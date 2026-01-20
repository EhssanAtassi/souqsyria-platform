import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  input,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Product } from '../../interfaces/product.interface';
import { RecommendationStrategy } from '../../interfaces/recommendations.interface';
import { ProductRecommendationsService } from '../../services/product-recommendations.service';

/**
 * Smart Product Recommendations Component
 *
 * Intelligent product recommendations using multiple strategies:
 * - Similar products (category, features)
 * - Price-based recommendations
 * - Cultural connections (Syrian heritage)
 * - Recently viewed based
 * - Popular products
 * - Frequently bought together
 * - Complementary products
 *
 * UX Features:
 * - Strategy-based recommendations
 * - Carousel display with navigation
 * - Loading states
 * - Empty states
 * - Quick add to cart
 * - Responsive design
 *
 * @example
 * ```html
 * <app-smart-recommendations
 *   [currentProduct]="product"
 *   [strategy]="'similar'"
 *   [limit]="6">
 * </app-smart-recommendations>
 * ```
 */
@Component({
  selector: 'app-smart-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './smart-recommendations.component.html',
  styleUrls: ['./smart-recommendations.component.scss']
})
export class SmartRecommendationsComponent implements OnInit {
  private recommendationsService = inject(ProductRecommendationsService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  readonly currentProduct = input<Product | null>(null);
  readonly strategy = input<RecommendationStrategy>('similar');
  readonly limit = input<number>(6);
  readonly excludeIds = input<string[]>([]);
  readonly showTitle = input<boolean>(true);
  readonly showStrategy = input<boolean>(false);

  // Component state
  readonly recommendations = signal<Product[]>([]);
  readonly title = signal<string>('Recommended For You');
  readonly titleAr = signal<string>('موصى به لك');
  readonly isLoading = signal<boolean>(false);

  // Computed
  readonly hasRecommendations = computed(() => this.recommendations().length > 0);

  ngOnInit(): void {
    this.loadRecommendations();
  }

  /**
   * Load recommendations based on strategy
   */
  private loadRecommendations(): void {
    this.isLoading.set(true);

    const config = {
      strategy: this.strategy(),
      limit: this.limit(),
      excludeIds: this.excludeIds()
    };

    this.recommendationsService
      .getRecommendations(this.currentProduct(), config)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.recommendations.set(result.products);
          this.title.set(result.title);
          this.titleAr.set(result.titleAr || result.title);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load recommendations:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Get strategy display name
   */
  getStrategyDisplayName(): string {
    const strategyNames: Record<RecommendationStrategy, string> = {
      'similar': 'Similar Products',
      'category': 'Same Category',
      'price-range': 'Similar Price',
      'cultural': 'Cultural Heritage',
      'recent': 'Recently Viewed',
      'popular': 'Popular Products',
      'frequently-bought': 'Bought Together',
      'complementary': 'You May Also Need'
    };

    return strategyNames[this.strategy()] || 'Recommendations';
  }

  /**
   * Get strategy icon
   */
  getStrategyIcon(): string {
    const icons: Record<RecommendationStrategy, string> = {
      'similar': 'content_copy',
      'category': 'category',
      'price-range': 'attach_money',
      'cultural': 'verified',
      'recent': 'history',
      'popular': 'trending_up',
      'frequently-bought': 'shopping_cart',
      'complementary': 'lightbulb'
    };

    return icons[this.strategy()] || 'recommend';
  }

  /**
   * Scroll carousel left
   */
  scrollLeft(): void {
    const carousel = document.querySelector('.recommendations-scroll');
    if (carousel) {
      carousel.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  /**
   * Scroll carousel right
   */
  scrollRight(): void {
    const carousel = document.querySelector('.recommendations-scroll');
    if (carousel) {
      carousel.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }
}
