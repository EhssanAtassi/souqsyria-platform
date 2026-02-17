import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../interfaces/product.interface';
import {
  ComparisonItem,
  ComparisonRow,
  ComparisonConfig,
  ComparisonField,
  ComparisonState
} from '../interfaces/comparison.interface';

/**
 * Product Comparison Service
 *
 * Manages product comparison functionality:
 * - Add/remove products from comparison
 * - Generate comparison table
 * - Highlight differences
 * - Persist comparison state
 * - Share comparison
 *
 * @swagger
 * tags:
 *   name: Comparison
 *   description: Product comparison operations
 *
 * @example
 * ```typescript
 * constructor(private comparisonService: ProductComparisonService) {}
 *
 * addToComparison(product: Product) {
 *   this.comparisonService.addProduct(product);
 * }
 *
 * getComparisonTable() {
 *   return this.comparisonService.comparisonRows();
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ProductComparisonService {
  private readonly STORAGE_KEY = 'souq_product_comparison';
  private readonly MAX_PRODUCTS = 4;

  // Comparison state signals
  readonly comparisonItems = signal<ComparisonItem[]>([]);
  readonly isVisible = signal<boolean>(false);
  readonly showDifferencesOnly = signal<boolean>(false);

  // Computed signals
  readonly itemCount = computed(() => this.comparisonItems().length);
  readonly canAddMore = computed(() => this.itemCount() < this.MAX_PRODUCTS);
  readonly hasItems = computed(() => this.itemCount() > 0);

  // Comparison configuration
  private readonly config: ComparisonConfig = {
    maxProducts: this.MAX_PRODUCTS,
    showDifferencesOnly: false,
    highlightBest: true,
    fields: this.getComparisonFields()
  };

  /**
   * Computed comparison rows for table display
   */
  readonly comparisonRows = computed(() => {
    const items = this.comparisonItems();
    if (items.length === 0) return [];

    const rows: ComparisonRow[] = [];
    const fields = this.config.fields;

    fields.forEach(field => {
      const values = items.map(item => this.getFieldValue(item.product, field.key));
      const hasDifference = this.checkDifference(values);

      // Skip row if showing differences only and no difference
      if (this.showDifferencesOnly() && !hasDifference) {
        return;
      }

      rows.push({
        label: field.label,
        key: field.key,
        category: field.category,
        values,
        type: field.type,
        hasDifference,
        unit: field.unit
      });
    });

    return rows;
  });

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add product to comparison
   *
   * @param product - Product to add
   * @returns Success status and message
   *
   * @swagger
   * /api/comparison/add:
   *   post:
   *     summary: Add product to comparison
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       200:
   *         description: Product added successfully
   *       400:
   *         description: Comparison limit reached or product already exists
   */
  addProduct(product: Product): { success: boolean; message: string } {
    const items = this.comparisonItems();

    // Check if already in comparison
    if (items.some(item => item.product.id === product.id)) {
      return {
        success: false,
        message: 'Product already in comparison'
      };
    }

    // Check limit
    if (items.length >= this.MAX_PRODUCTS) {
      return {
        success: false,
        message: `Maximum ${this.MAX_PRODUCTS} products can be compared`
      };
    }

    // Add to comparison
    const newItem: ComparisonItem = {
      product,
      addedAt: new Date()
    };

    this.comparisonItems.set([...items, newItem]);
    this.saveToStorage();

    return {
      success: true,
      message: 'Product added to comparison'
    };
  }

  /**
   * Remove product from comparison
   *
   * @param productId - Product ID to remove
   */
  removeProduct(productId: string): void {
    const filtered = this.comparisonItems().filter(
      item => item.product.id !== productId
    );
    this.comparisonItems.set(filtered);
    this.saveToStorage();

    // Hide if no items left
    if (filtered.length === 0) {
      this.isVisible.set(false);
    }
  }

  /**
   * Clear all products from comparison
   */
  clearAll(): void {
    this.comparisonItems.set([]);
    this.isVisible.set(false);
    this.saveToStorage();
  }

  /**
   * Check if product is in comparison
   *
   * @param productId - Product ID to check
   * @returns True if product is in comparison
   */
  isInComparison(productId: string): boolean {
    return this.comparisonItems().some(item => item.product.id === productId);
  }

  /**
   * Toggle comparison visibility
   */
  toggleVisibility(): void {
    this.isVisible.set(!this.isVisible());
  }

  /**
   * Show comparison panel
   */
  show(): void {
    this.isVisible.set(true);
  }

  /**
   * Hide comparison panel
   */
  hide(): void {
    this.isVisible.set(false);
  }

  /**
   * Toggle show differences only
   */
  toggleDifferencesOnly(): void {
    this.showDifferencesOnly.set(!this.showDifferencesOnly());
  }

  /**
   * Get comparison data for sharing/printing
   */
  getComparisonData(): {
    products: Product[];
    rows: ComparisonRow[];
    timestamp: Date;
  } {
    return {
      products: this.comparisonItems().map(item => item.product),
      rows: this.comparisonRows(),
      timestamp: new Date()
    };
  }

  /**
   * Export comparison as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.getComparisonData(), null, 2);
  }

  /**
   * Get field value from product using dot notation
   *
   * @param product - Product object
   * @param fieldPath - Field path (e.g., 'price.amount')
   * @returns Field value
   */
  private getFieldValue(product: Product, fieldPath: string): any {
    const keys = fieldPath.split('.');
    let value: any = product;

    for (const key of keys) {
      if (value === null || value === undefined) return null;
      value = value[key];
    }

    return value;
  }

  /**
   * Check if values have differences
   */
  private checkDifference(values: any[]): boolean {
    if (values.length === 0) return false;

    const first = JSON.stringify(values[0]);
    return values.some(v => JSON.stringify(v) !== first);
  }

  /**
   * Get comparison field definitions
   */
  private getComparisonFields(): ComparisonField[] {
    const fields = [
      // Pricing
      {
        label: 'Price',
        labelAr: 'السعر',
        key: 'price.amount',
        category: 'pricing',
        type: 'currency',
        order: 1,
        alwaysVisible: true,
        formatter: 'currency',
        lowerIsBetter: true
      },
      {
        label: 'Discount',
        labelAr: 'الخصم',
        key: 'price.discount.percentage',
        category: 'pricing',
        type: 'number',
        order: 2,
        alwaysVisible: false,
        unit: '%'
      },
      {
        label: 'Currency',
        labelAr: 'العملة',
        key: 'price.currency',
        category: 'pricing',
        type: 'text',
        order: 3,
        alwaysVisible: true
      },

      // Reviews
      {
        label: 'Rating',
        labelAr: 'التقييم',
        key: 'reviews.averageRating',
        category: 'reviews',
        type: 'rating',
        order: 10,
        alwaysVisible: true,
        formatter: 'rating'
      },
      {
        label: 'Total Reviews',
        labelAr: 'عدد التقييمات',
        key: 'reviews.totalReviews',
        category: 'reviews',
        type: 'number',
        order: 11,
        alwaysVisible: true
      },

      // Specifications
      {
        label: 'Materials',
        labelAr: 'المواد',
        key: 'specifications.materials',
        category: 'specifications',
        type: 'list',
        order: 20,
        alwaysVisible: false,
        formatter: 'list'
      },
      {
        label: 'Weight',
        labelAr: 'الوزن',
        key: 'specifications.weight.value',
        category: 'specifications',
        type: 'number',
        order: 21,
        alwaysVisible: false,
        unit: 'kg'
      },
      {
        label: 'Dimensions',
        labelAr: 'الأبعاد',
        key: 'specifications.dimensions',
        category: 'specifications',
        type: 'text',
        order: 22,
        alwaysVisible: false
      },

      // Authenticity
      {
        label: 'Certified',
        labelAr: 'مُعتمد',
        key: 'authenticity.certified',
        category: 'authenticity',
        type: 'boolean',
        order: 30,
        alwaysVisible: true
      },
      {
        label: 'UNESCO Heritage',
        labelAr: 'تراث يونسكو',
        key: 'authenticity.unescoRecognition',
        category: 'authenticity',
        type: 'boolean',
        order: 31,
        alwaysVisible: true
      },
      {
        label: 'Heritage Type',
        labelAr: 'نوع التراث',
        key: 'authenticity.heritage',
        category: 'authenticity',
        type: 'text',
        order: 32,
        alwaysVisible: false
      },

      // Seller
      {
        label: 'Seller',
        labelAr: 'البائع',
        key: 'seller.name',
        category: 'seller',
        type: 'text',
        order: 40,
        alwaysVisible: true
      },
      {
        label: 'Seller Rating',
        labelAr: 'تقييم البائع',
        key: 'seller.rating',
        category: 'seller',
        type: 'rating',
        order: 41,
        alwaysVisible: false,
        formatter: 'rating'
      },
      {
        label: 'Location',
        labelAr: 'الموقع',
        key: 'seller.location.city',
        category: 'seller',
        type: 'text',
        order: 42,
        alwaysVisible: true
      },
      {
        label: 'Verified Seller',
        labelAr: 'بائع موثق',
        key: 'seller.verified',
        category: 'seller',
        type: 'boolean',
        order: 43,
        alwaysVisible: false
      },

      // Shipping
      {
        label: 'Free Shipping',
        labelAr: 'شحن مجاني',
        key: 'shipping.freeShippingThreshold',
        category: 'shipping',
        type: 'boolean',
        order: 50,
        alwaysVisible: false
      },

      // Inventory
      {
        label: 'In Stock',
        labelAr: 'متوفر',
        key: 'inventory.inStock',
        category: 'specifications',
        type: 'boolean',
        order: 60,
        alwaysVisible: true
      },
      {
        label: 'Stock Quantity',
        labelAr: 'الكمية المتوفرة',
        key: 'inventory.quantity',
        category: 'specifications',
        type: 'number',
        order: 61,
        alwaysVisible: false
      }
    ];

    return fields.sort((a, b) => a.order - b.order) as ComparisonField[];
  }

  /**
   * Save comparison state to localStorage
   */
  private saveToStorage(): void {
    try {
      const state: ComparisonState = {
        items: this.comparisonItems(),
        isVisible: this.isVisible(),
        showDifferencesOnly: this.showDifferencesOnly()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save comparison state:', error);
    }
  }

  /**
   * Load comparison state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state: ComparisonState = JSON.parse(stored);

        // Convert date strings back to Date objects
        const items = state.items.map(item => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));

        this.comparisonItems.set(items);
        this.isVisible.set(state.isVisible);
        this.showDifferencesOnly.set(state.showDifferencesOnly);
      }
    } catch (error) {
      console.error('Failed to load comparison state:', error);
    }
  }
}
