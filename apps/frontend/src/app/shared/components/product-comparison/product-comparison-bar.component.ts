import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductComparisonService } from '../../services/product-comparison.service';

/**
 * Product Comparison Bar Component
 *
 * Sticky comparison bar that shows:
 * - Number of products in comparison
 * - Product thumbnails
 * - Quick remove buttons
 * - Compare button
 * - Clear all button
 *
 * UX Features:
 * - Sticky positioning (bottom of screen)
 * - Slide-in animation
 * - Product thumbnails with quick actions
 * - Responsive design (mobile adapts layout)
 * - Visual feedback for actions
 *
 * @example
 * ```html
 * <app-product-comparison-bar></app-product-comparison-bar>
 * ```
 */
@Component({
  selector: 'app-product-comparison-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    @if (hasItems()) {
      <div class="comparison-bar" [@slideUp]>
        <div class="comparison-bar-content">
          <!-- Product Thumbnails -->
          <div class="comparison-products">
            @for (item of comparisonItems(); track item.product.id) {
              <div class="comparison-product-item">
                <img
                  [src]="item.product.images[0]?.url"
                  [alt]="item.product.name"
                  class="product-thumbnail"
                />
                <button
                  mat-icon-button
                  class="remove-btn"
                  (click)="removeProduct(item.product.id)"
                  [matTooltip]="'Remove from comparison'"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            <!-- Empty Slots -->
            @for (slot of emptySlots(); track $index) {
              <div class="comparison-product-item empty">
                <mat-icon>add</mat-icon>
                <span>Add Product</span>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="comparison-actions">
            <div class="comparison-count">
              <span class="count-number">{{ itemCount() }}</span>
              <span class="count-text">of {{ maxProducts() }} products</span>
            </div>

            <button
              mat-stroked-button
              class="clear-btn"
              (click)="clearAll()"
            >
              Clear All
            </button>

            <button
              mat-raised-button
              color="primary"
              class="compare-btn"
              (click)="showComparison()"
              [disabled]="itemCount() < 2"
            >
              <mat-icon>compare_arrows</mat-icon>
              Compare Now
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .comparison-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .comparison-bar-content {
      max-width: 1440px;
      margin: 0 auto;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .comparison-products {
      display: flex;
      gap: 12px;
      flex: 1;
      overflow-x: auto;
      padding: 4px;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 2px;
      }
    }

    .comparison-product-item {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f3f4f6;

      &.empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px dashed #d1d5db;

        mat-icon {
          color: #9ca3af;
          margin-bottom: 4px;
        }

        span {
          font-size: 10px;
          color: #6b7280;
          text-align: center;
        }
      }
    }

    .product-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.6);
      color: white;

      ::ng-deep {
        .mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          line-height: 16px;
        }
      }

      &:hover {
        background: #dc2626;
      }
    }

    .comparison-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .comparison-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 12px;
      border-right: 1px solid #e5e7eb;
    }

    .count-number {
      font-size: 24px;
      font-weight: 700;
      color: #d4a574;
      line-height: 1;
    }

    .count-text {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .clear-btn {
      border-color: #9ca3af;
      color: #6b7280;

      &:hover {
        background: #f3f4f6;
      }
    }

    .compare-btn {
      background: #d4a574;
      color: white;
      font-weight: 600;
      min-width: 150px;

      &:hover:not(:disabled) {
        background: #c49463;
      }

      &:disabled {
        background: #e5e7eb;
        color: #9ca3af;
      }

      mat-icon {
        margin-right: 8px;
      }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .comparison-bar-content {
        flex-direction: column;
        gap: 16px;
      }

      .comparison-products {
        width: 100%;
        justify-content: flex-start;
      }

      .comparison-actions {
        width: 100%;
        justify-content: space-between;
      }

      .comparison-count {
        border-right: none;
        padding: 0;
      }

      .compare-btn {
        flex: 1;
      }
    }
  `]
})
export class ProductComparisonBarComponent {
  private comparisonService = inject(ProductComparisonService);

  // Service signals
  readonly comparisonItems = this.comparisonService.comparisonItems;
  readonly itemCount = this.comparisonService.itemCount;
  readonly hasItems = this.comparisonService.hasItems;

  // Component computed
  readonly maxProducts = computed(() => 4);
  readonly emptySlots = computed(() => {
    const count = this.itemCount();
    const empty = this.maxProducts() - count;
    return Array(Math.max(0, empty)).fill(null);
  });

  /**
   * Remove product from comparison
   */
  removeProduct(productId: string): void {
    this.comparisonService.removeProduct(productId);
  }

  /**
   * Clear all products
   */
  clearAll(): void {
    this.comparisonService.clearAll();
  }

  /**
   * Show comparison modal/page
   */
  showComparison(): void {
    this.comparisonService.show();
  }
}
