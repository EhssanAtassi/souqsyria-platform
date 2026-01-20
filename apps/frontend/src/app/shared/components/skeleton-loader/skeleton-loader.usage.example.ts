/**
 * Skeleton Loader Usage Examples
 *
 * This file demonstrates various usage patterns for the SkeletonLoaderComponent
 * in real-world scenarios within the SouqSyria Syrian Marketplace.
 *
 * @example Import and use in your component
 */

import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

// ===== EXAMPLE 1: Homepage Loading State =====
/**
 * Homepage with multiple skeleton types
 * Shows banner, categories, and product cards while loading
 */
@Component({
  selector: 'app-homepage-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      @if (loading()) {
        <!-- Hero Banner Skeleton -->
        <section class="mb-8">
          <app-skeleton-loader type="banner" />
        </section>

        <!-- Categories Skeleton -->
        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4">Browse Categories</h2>
          <app-skeleton-loader type="category" [count]="6" />
        </section>

        <!-- Featured Products Skeleton -->
        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4">Featured Products</h2>
          <app-skeleton-loader
            type="card"
            [count]="8"
            animation="shimmer"
          />
        </section>
      } @else {
        <!-- Actual content goes here -->
        <app-hero-banner [banner]="heroBanner()" />
        <app-category-grid [categories]="categories()" />
        <app-product-grid [products]="featuredProducts()" />
      }
    </div>
  `
})
export class HomepageExampleComponent implements OnInit {
  loading = signal(true);
  heroBanner = signal<any>(null);
  categories = signal<any[]>([]);
  featuredProducts = signal<any[]>([]);

  ngOnInit() {
    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      // Load actual data
    }, 2000);
  }
}

// ===== EXAMPLE 2: Product Listing with Pagination =====
/**
 * Product listing with initial load and load more functionality
 */
@Component({
  selector: 'app-product-listing-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4">
      <!-- Initial Loading -->
      @if (initialLoading()) {
        <app-skeleton-loader
          type="card"
          [count]="12"
          animation="shimmer"
        />
      } @else {
        <!-- Product Grid -->
        <div class="product-grid">
          <!-- Actual products -->
        </div>

        <!-- Load More Loading -->
        @if (loadingMore()) {
          <app-skeleton-loader
            type="card"
            [count]="4"
            animation="pulse"
          />
        }

        <!-- Load More Button -->
        @if (!loadingMore() && hasMore()) {
          <button
            (click)="loadMore()"
            class="btn-primary mt-8"
          >
            Load More Products
          </button>
        }
      }
    </div>
  `
})
export class ProductListingExampleComponent {
  initialLoading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);

  loadMore() {
    this.loadingMore.set(true);
    // Simulate API call
    setTimeout(() => {
      this.loadingMore.set(false);
    }, 1500);
  }
}

// ===== EXAMPLE 3: Search Results =====
/**
 * Search results with filters sidebar
 */
@Component({
  selector: 'app-search-results-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4">
      <div class="flex gap-6">
        <!-- Filters Sidebar -->
        <aside class="w-64">
          @if (loadingFilters()) {
            <div class="space-y-4">
              <app-skeleton-loader type="text" [count]="2" />
              <app-skeleton-loader type="text" [count]="3" />
              <app-skeleton-loader type="text" [count]="2" />
              <app-skeleton-loader type="text" [count]="4" />
            </div>
          } @else {
            <!-- Actual filters -->
          }
        </aside>

        <!-- Results -->
        <main class="flex-1">
          @if (loadingResults()) {
            <app-skeleton-loader
              type="card"
              [count]="9"
              animation="wave"
            />
          } @else {
            <!-- Actual results -->
          }
        </main>
      </div>
    </div>
  `
})
export class SearchResultsExampleComponent {
  loadingFilters = signal(true);
  loadingResults = signal(true);
}

// ===== EXAMPLE 4: Product Detail Page =====
/**
 * Product detail page with recommendations
 */
@Component({
  selector: 'app-product-detail-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4">
      @if (loadingProduct()) {
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <!-- Image Gallery Skeleton -->
          <div>
            <app-skeleton-loader
              type="banner"
              [height]="'500px'"
            />
          </div>

          <!-- Product Info Skeleton -->
          <div class="space-y-4">
            <app-skeleton-loader type="text" [count]="1" [height]="'2rem'" />
            <app-skeleton-loader type="text" [count]="2" />
            <app-skeleton-loader type="text" [count]="1" [height]="'3rem'" />
            <app-skeleton-loader type="text" [count]="4" />
          </div>
        </div>
      }

      <!-- Related Products -->
      <section class="mt-12">
        <h2 class="text-2xl font-bold mb-4">Related Products</h2>
        @if (loadingRelated()) {
          <app-skeleton-loader type="card" [count]="4" />
        }
      </section>
    </div>
  `
})
export class ProductDetailExampleComponent {
  loadingProduct = signal(true);
  loadingRelated = signal(true);
}

// ===== EXAMPLE 5: Category Page =====
/**
 * Category page with subcategories and products
 */
@Component({
  selector: 'app-category-page-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      @if (loading()) {
        <!-- Category Banner -->
        <app-skeleton-loader
          type="banner"
          [height]="'300px'"
          class="mb-8"
        />

        <!-- Subcategories -->
        <section class="mb-8">
          <app-skeleton-loader type="category" [count]="4" />
        </section>

        <!-- Products -->
        <section>
          <app-skeleton-loader type="card" [count]="12" />
        </section>
      }
    </div>
  `
})
export class CategoryPageExampleComponent {
  loading = signal(true);
}

// ===== EXAMPLE 6: Shopping Cart =====
/**
 * Shopping cart with item skeletons
 */
@Component({
  selector: 'app-cart-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Shopping Cart</h1>

      @if (loading()) {
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Cart Items Skeleton -->
          <div class="md:col-span-2 space-y-4">
            @for (item of [1,2,3]; track item) {
              <div class="flex gap-4 p-4 border rounded">
                <app-skeleton-loader
                  type="circle"
                  [width]="'80px'"
                  [height]="'80px'"
                />
                <div class="flex-1">
                  <app-skeleton-loader type="text" [count]="3" />
                </div>
              </div>
            }
          </div>

          <!-- Summary Skeleton -->
          <div class="space-y-4">
            <app-skeleton-loader type="text" [count]="5" />
          </div>
        </div>
      }
    </div>
  `
})
export class CartExampleComponent {
  loading = signal(true);
}

// ===== EXAMPLE 7: User Dashboard =====
/**
 * User dashboard with multiple widgets
 */
@Component({
  selector: 'app-dashboard-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      @if (loading()) {
        <!-- Profile Header -->
        <div class="flex items-center gap-4 mb-8">
          <app-skeleton-loader type="circle" [width]="'100px'" [height]="'100px'" />
          <div class="flex-1">
            <app-skeleton-loader type="text" [count]="2" />
          </div>
        </div>

        <!-- Dashboard Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          @for (card of [1,2,3]; track card) {
            <div class="p-6 border rounded">
              <app-skeleton-loader type="text" [count]="3" />
            </div>
          }
        </div>

        <!-- Recent Orders -->
        <section>
          <h2 class="text-2xl font-bold mb-4">Recent Orders</h2>
          <app-skeleton-loader type="text" [count]="5" />
        </section>
      }
    </div>
  `
})
export class DashboardExampleComponent {
  loading = signal(true);
}

// ===== EXAMPLE 8: Custom Dimensions =====
/**
 * Custom skeleton dimensions for specific layouts
 */
@Component({
  selector: 'app-custom-skeleton-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4">
      <!-- Wide Banner -->
      <app-skeleton-loader
        type="banner"
        [width]="'100%'"
        [height]="'600px'"
        borderRadius="1rem"
      />

      <!-- Custom Product Cards -->
      <div class="grid md:grid-cols-4 gap-4 mt-8">
        @for (i of [1,2,3,4]; track i) {
          <app-skeleton-loader
            type="card"
            [width]="'100%'"
            [height]="'450px'"
            animation="pulse"
          />
        }
      </div>

      <!-- Custom Text Lines -->
      <div class="mt-8 space-y-2">
        <app-skeleton-loader type="text" [width]="'80%'" [height]="'1.5rem'" />
        <app-skeleton-loader type="text" [width]="'60%'" [height]="'1rem'" />
        <app-skeleton-loader type="text" [width]="'70%'" [height]="'1rem'" />
      </div>
    </div>
  `
})
export class CustomSkeletonExampleComponent {}

// ===== EXAMPLE 9: Dark Theme =====
/**
 * Dark theme skeleton for dark mode interfaces
 */
@Component({
  selector: 'app-dark-skeleton-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="bg-gray-900 min-h-screen p-8">
      <app-skeleton-loader
        type="card"
        [count]="6"
        theme="dark"
        animation="shimmer"
      />
    </div>
  `
})
export class DarkSkeletonExampleComponent {}

// ===== EXAMPLE 10: Progressive Loading =====
/**
 * Progressive content loading with staggered skeletons
 */
@Component({
  selector: 'app-progressive-loading-example',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Phase 1: Banner loads first -->
      @if (phase() >= 1) {
        @if (phase() === 1) {
          <app-skeleton-loader type="banner" />
        } @else {
          <app-hero-banner />
        }
      }

      <!-- Phase 2: Categories load next -->
      @if (phase() >= 2) {
        <section class="my-8">
          @if (phase() === 2) {
            <app-skeleton-loader type="category" [count]="6" />
          } @else {
            <app-category-grid />
          }
        </section>
      }

      <!-- Phase 3: Products load last -->
      @if (phase() >= 3) {
        <section class="my-8">
          @if (phase() === 3) {
            <app-skeleton-loader type="card" [count]="8" />
          } @else {
            <app-product-grid />
          }
        </section>
      }
    </div>
  `
})
export class ProgressiveLoadingExampleComponent implements OnInit {
  phase = signal(0);

  ngOnInit() {
    // Progressively load content
    setTimeout(() => this.phase.set(1), 0);
    setTimeout(() => this.phase.set(2), 500);
    setTimeout(() => this.phase.set(3), 1000);
    setTimeout(() => this.phase.set(4), 1500);
  }
}

/**
 * EXPORT NOTE:
 * These are example components for documentation purposes.
 * Import and adapt them in your actual feature components.
 *
 * Basic import:
 * import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader';
 */
