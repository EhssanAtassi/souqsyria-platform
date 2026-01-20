import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductComparisonService } from '../../services/product-comparison.service';
import { ComparisonRow } from '../../interfaces/comparison.interface';

/**
 * Product Comparison Table Component
 *
 * Side-by-side product comparison with:
 * - Comparison table with all product details
 * - Highlight differences toggle
 * - Category filtering (pricing, specs, shipping, etc.)
 * - Print comparison option
 * - Export as JSON
 * - Share comparison
 *
 * UX Features:
 * - Sticky product headers
 * - Difference highlighting
 * - Best value indicators
 * - Responsive table (mobile: horizontal scroll)
 * - Quick add to cart from comparison
 *
 * @example
 * ```html
 * <app-product-comparison-table></app-product-comparison-table>
 * ```
 */
@Component({
  selector: 'app-product-comparison-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTableModule,
    MatDialogModule
  ],
  templateUrl: './product-comparison-table.component.html',
  styleUrls: ['./product-comparison-table.component.scss']
})
export class ProductComparisonTableComponent implements OnInit {
  private comparisonService = inject(ProductComparisonService);

  // Service signals
  readonly comparisonItems = this.comparisonService.comparisonItems;
  readonly comparisonRows = this.comparisonService.comparisonRows;
  readonly showDifferencesOnly = this.comparisonService.showDifferencesOnly;

  // Local state
  readonly selectedCategory = signal<string | null>(null);
  readonly isPrinting = signal<boolean>(false);

  // Categories for filtering
  readonly categories = [
    { value: 'all', label: 'All', icon: 'apps' },
    { value: 'pricing', label: 'Pricing', icon: 'attach_money' },
    { value: 'reviews', label: 'Reviews', icon: 'star' },
    { value: 'specifications', label: 'Specifications', icon: 'settings' },
    { value: 'authenticity', label: 'Authenticity', icon: 'verified' },
    { value: 'seller', label: 'Seller', icon: 'store' },
    { value: 'shipping', label: 'Shipping', icon: 'local_shipping' }
  ];

  // Computed filtered rows
  readonly filteredRows = computed(() => {
    const rows = this.comparisonRows();
    const category = this.selectedCategory();

    if (!category || category === 'all') {
      return rows;
    }

    return rows.filter(row => row.category === category);
  });

  ngOnInit(): void {
    // Set default category
    this.selectedCategory.set('all');
  }

  /**
   * Toggle differences only view
   */
  toggleDifferencesOnly(): void {
    this.comparisonService.toggleDifferencesOnly();
  }

  /**
   * Select category filter
   */
  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Remove product from comparison
   */
  removeProduct(productId: string): void {
    this.comparisonService.removeProduct(productId);
  }

  /**
   * Clear all and close
   */
  clearAndClose(): void {
    this.comparisonService.clearAll();
    this.close();
  }

  /**
   * Close comparison
   */
  close(): void {
    this.comparisonService.hide();
  }

  /**
   * Print comparison
   */
  printComparison(): void {
    this.isPrinting.set(true);
    setTimeout(() => {
      window.print();
      this.isPrinting.set(false);
    }, 100);
  }

  /**
   * Export as JSON
   */
  exportComparison(): void {
    const json = this.comparisonService.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-comparison-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Share comparison (Web Share API)
   */
  async shareComparison(): Promise<void> {
    if (navigator.share) {
      try {
        const data = this.comparisonService.getComparisonData();
        const products = data.products.map(p => p.name).join(', ');
        await navigator.share({
          title: 'Product Comparison',
          text: `Comparing: ${products}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      const json = this.comparisonService.exportAsJSON();
      navigator.clipboard.writeText(json);
      alert('Comparison data copied to clipboard!');
    }
  }

  /**
   * Format cell value based on type
   */
  formatValue(value: any, type: string): string {
    if (value === null || value === undefined) return '—';

    switch (type) {
      case 'boolean':
        return value ? '✓ Yes' : '✗ No';
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'rating':
        return '★'.repeat(Math.floor(value)) + '☆'.repeat(5 - Math.floor(value));
      case 'number':
        return value.toString();
      case 'list':
        return Array.isArray(value) ? value.join(', ') : value.toString();
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value.toString();
    }
  }

  /**
   * Check if value is best in row
   */
  isBestValue(row: ComparisonRow, index: number): boolean {
    if (!row.hasDifference || row.type === 'text' || row.type === 'boolean') {
      return false;
    }

    const numericValues = row.values
      .map((v, i) => ({ value: Number(v), index: i }))
      .filter(item => !isNaN(item.value));

    if (numericValues.length === 0) return false;

    // For price, lower is better; for rating, higher is better
    const lowerIsBetter = row.key.includes('price');
    const bestValue = lowerIsBetter
      ? Math.min(...numericValues.map(v => v.value))
      : Math.max(...numericValues.map(v => v.value));

    const currentValue = Number(row.values[index]);
    return currentValue === bestValue && !isNaN(currentValue);
  }

  /**
   * Get category count
   */
  getCategoryCount(category: string): number {
    if (category === 'all') {
      return this.comparisonRows().length;
    }
    return this.comparisonRows().filter(row => row.category === category).length;
  }
}
