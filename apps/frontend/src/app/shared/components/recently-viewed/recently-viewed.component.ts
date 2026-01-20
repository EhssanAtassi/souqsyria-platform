import {
  Component,
  OnInit,
  computed,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductRecommendationsService } from '../../services/product-recommendations.service';

/**
 * Recently Viewed Products Component
 *
 * Displays recently viewed products with:
 * - Product thumbnails and basic info
 * - View history tracking (localStorage)
 * - Clear history option
 * - Privacy controls
 * - Horizontal carousel display
 * - Quick actions (view, remove)
 *
 * UX Features:
 * - Automatic scroll for many items
 * - Remove individual items
 * - Clear all history
 * - Responsive design
 * - Empty state with helpful message
 *
 * @example
 * ```html
 * <app-recently-viewed
 *   [maxItems]="10"
 *   [showClearButton]="true">
 * </app-recently-viewed>
 * ```
 */
@Component({
  selector: 'app-recently-viewed',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './recently-viewed.component.html',
  styleUrls: ['./recently-viewed.component.scss']
})
export class RecentlyViewedComponent implements OnInit {
  private recommendationsService = inject(ProductRecommendationsService);

  // Inputs
  readonly maxItems = input<number>(10);
  readonly showClearButton = input<boolean>(true);
  readonly title = input<string>('Recently Viewed');
  readonly titleAr = input<string>('شاهدته مؤخراً');

  // Service signals
  readonly recentlyViewed = this.recommendationsService.recentlyViewed;

  // Computed
  readonly displayItems = computed(() => {
    return this.recentlyViewed().slice(0, this.maxItems());
  });

  readonly hasItems = computed(() => this.displayItems().length > 0);

  ngOnInit(): void {
    // Component initialized
  }

  /**
   * Remove product from recently viewed
   */
  removeProduct(productId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.recommendationsService.removeFromRecentlyViewed(productId);
  }

  /**
   * Clear all recently viewed
   */
  clearAll(): void {
    if (confirm('Are you sure you want to clear your recently viewed history?')) {
      this.recommendationsService.clearRecentlyViewed();
    }
  }

  /**
   * Format view time
   */
  formatViewTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }
}
