/**
 * @file export-manager.component.ts
 * @description Export Manager Component
 *              Manages report exports, history, and scheduled exports
 * @module AdminDashboard/Analytics
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Angular Material
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { AdminAnalyticsService } from '../../../services/admin-analytics.service';

// Interfaces
import { ExportFormat, ExportResponse } from '../../../interfaces/api-response.interface';

/**
 * Export type options
 * @description Available report types for export
 */
type ExportType = 'sales' | 'commissions' | 'users' | 'orders' | 'products' | 'vendors';

/**
 * Export request structure
 * @description Parameters for generating an export
 */
interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeHeaders: boolean;
  filename?: string;
}

/**
 * Export history item
 * @description Record of previously generated exports
 */
interface ExportHistoryItem {
  id: string;
  type: ExportType;
  format: ExportFormat;
  filename: string;
  fileSize: number;
  status: 'completed' | 'processing' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  downloadUrl?: string;
}

/**
 * Export type configuration
 * @description Configuration for each export type
 */
interface ExportTypeConfig {
  type: ExportType;
  label: string;
  description: string;
  icon: string;
}

/**
 * Export Manager Component
 * @description Centralized export management for all analytics reports
 *
 * @example
 * ```html
 * <app-export-manager></app-export-manager>
 * ```
 */
@Component({
  selector: 'app-export-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTooltipModule
  ],
  templateUrl: './export-manager.component.html',
  styleUrl: './export-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportManagerComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCY INJECTION
  // =========================================================================

  /** Analytics service */
  private readonly analyticsService = inject(AdminAnalyticsService);

  /** Destroy subject for cleanup */
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // SIGNALS - STATE
  // =========================================================================

  /** Loading state for new export */
  readonly isGenerating = signal<boolean>(false);

  /** Loading state for history */
  readonly isLoadingHistory = signal<boolean>(false);

  /** Export history items */
  readonly exportHistory = signal<ExportHistoryItem[]>([]);

  /** Currently generating export type */
  readonly currentGeneratingType = signal<ExportType | null>(null);

  /** Selected export type */
  readonly selectedType = signal<ExportType>('sales');

  /** Selected format */
  readonly selectedFormat = signal<ExportFormat>('xlsx');

  /** Date range */
  readonly dateRange = signal<{ startDate: string; endDate: string }>({
    startDate: this.getDateDaysAgo(30),
    endDate: this.getToday()
  });

  /** Include headers option */
  readonly includeHeaders = signal<boolean>(true);

  /** Custom filename */
  readonly customFilename = signal<string>('');

  /** Success message */
  readonly successMessage = signal<string | null>(null);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  // =========================================================================
  // COMPUTED SIGNALS
  // =========================================================================

  /**
   * Generated filename preview
   * @description Preview of the export filename
   */
  readonly filenamePreview = computed(() => {
    const custom = this.customFilename();
    if (custom.trim()) return custom;

    const type = this.selectedType();
    const format = this.selectedFormat();
    const date = new Date().toISOString().split('T')[0];

    return `${type}-report-${date}.${format}`;
  });

  /**
   * Recent exports (last 7 days)
   */
  readonly recentExports = computed(() => {
    const history = this.exportHistory();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return history.filter(item => new Date(item.createdAt) >= sevenDaysAgo);
  });

  /**
   * Exports by type count
   */
  readonly exportsByType = computed(() => {
    const history = this.exportHistory();
    const counts: Record<ExportType, number> = {
      sales: 0,
      commissions: 0,
      users: 0,
      orders: 0,
      products: 0,
      vendors: 0
    };

    history.forEach(item => {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    });

    return counts;
  });

  // =========================================================================
  // CONFIGURATION
  // =========================================================================

  /**
   * Available export types
   */
  readonly exportTypes: ExportTypeConfig[] = [
    {
      type: 'sales',
      label: 'Sales Report',
      description: 'Revenue, orders, and sales trends',
      icon: 'analytics'
    },
    {
      type: 'commissions',
      label: 'Commission Report',
      description: 'Vendor commissions and earnings',
      icon: 'monetization_on'
    },
    {
      type: 'users',
      label: 'User Analytics',
      description: 'User acquisition and engagement',
      icon: 'people'
    },
    {
      type: 'orders',
      label: 'Order Report',
      description: 'Order details and status',
      icon: 'shopping_bag'
    },
    {
      type: 'products',
      label: 'Product Report',
      description: 'Product performance metrics',
      icon: 'inventory_2'
    },
    {
      type: 'vendors',
      label: 'Vendor Report',
      description: 'Vendor performance data',
      icon: 'store'
    }
  ];

  /**
   * Available export formats
   */
  readonly exportFormats: { format: ExportFormat; label: string; icon: string }[] = [
    { format: 'csv', label: 'CSV', icon: 'description' },
    { format: 'xlsx', label: 'Excel', icon: 'table_chart' },
    { format: 'pdf', label: 'PDF', icon: 'picture_as_pdf' }
  ];

  /**
   * Date presets
   */
  readonly datePresets: { label: string; days: number }[] = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Year', days: 365 }
  ];

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Initialize component
   * @description Loads export history
   */
  ngOnInit(): void {
    this.loadExportHistory();
  }

  /**
   * Cleanup on destroy
   * @description Completes subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load export history
   * @description Fetches previous exports
   */
  loadExportHistory(): void {
    this.isLoadingHistory.set(true);

    // Since there's no dedicated endpoint, generate mock history
    setTimeout(() => {
      this.exportHistory.set(this.generateMockHistory());
      this.isLoadingHistory.set(false);
    }, 500);
  }

  /**
   * Generate mock history for demo
   * @returns Mock export history
   */
  private generateMockHistory(): ExportHistoryItem[] {
    const types: ExportType[] = ['sales', 'commissions', 'users', 'orders', 'products', 'vendors'];
    const formats: ExportFormat[] = ['csv', 'xlsx', 'pdf'];
    const history: ExportHistoryItem[] = [];

    for (let i = 0; i < 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const format = formats[Math.floor(Math.random() * formats.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const expiresAt = new Date(createdAt);
      expiresAt.setDate(expiresAt.getDate() + 7);

      history.push({
        id: `export-${Date.now()}-${i}`,
        type,
        format,
        filename: `${type}-report-${createdAt.toISOString().split('T')[0]}.${format}`,
        fileSize: Math.floor(Math.random() * 500000) + 10000,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        createdAt,
        expiresAt,
        downloadUrl: Math.random() > 0.3 ? `/api/exports/download/${i}` : undefined
      });
    }

    return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // =========================================================================
  // EXPORT GENERATION
  // =========================================================================

  /**
   * Generate new export
   * @description Creates a new export based on current settings
   */
  generateExport(): void {
    const type = this.selectedType();
    const format = this.selectedFormat();
    const range = this.dateRange();

    this.isGenerating.set(true);
    this.currentGeneratingType.set(type);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Determine which service method to call
    let exportObservable;

    switch (type) {
      case 'sales':
        exportObservable = this.analyticsService.exportSalesReport(format, range);
        break;
      case 'commissions':
        exportObservable = this.analyticsService.exportCommissionReport({
          format,
          dateRange: range,
          includeHeaders: this.includeHeaders()
        });
        break;
      case 'users':
        exportObservable = this.analyticsService.exportUserAnalytics({
          format,
          dateRange: range,
          includeHeaders: this.includeHeaders()
        });
        break;
      default:
        // For other types, use sales export as fallback
        exportObservable = this.analyticsService.exportSalesReport(format, range);
    }

    exportObservable.pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isGenerating.set(false);
        this.currentGeneratingType.set(null);
      })
    ).subscribe({
      next: (response: ExportResponse) => {
        this.successMessage.set(`Export generated successfully! File: ${response.filename}`);

        // Add to history
        const newItem: ExportHistoryItem = {
          id: `export-${Date.now()}`,
          type,
          format,
          filename: response.filename,
          fileSize: response.fileSize,
          status: 'completed',
          createdAt: new Date(),
          expiresAt: response.expiresAt,
          downloadUrl: response.downloadUrl
        };

        this.exportHistory.update(history => [newItem, ...history]);

        // Trigger download
        window.open(response.downloadUrl, '_blank');
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.errorMessage.set('Failed to generate export. Generating local export...');

        // Generate client-side export as fallback
        this.generateClientExport(type, format);
      }
    });
  }

  /**
   * Generate client-side export
   * @param type - Export type
   * @param format - Export format
   */
  private generateClientExport(type: ExportType, format: ExportFormat): void {
    if (format !== 'csv') {
      this.errorMessage.set('Client-side export is only available for CSV format.');
      return;
    }

    const range = this.dateRange();
    let csv = `${type.charAt(0).toUpperCase() + type.slice(1)} Report\n`;
    csv += `Date Range: ${range.startDate} to ${range.endDate}\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    csv += `This is a sample export. Connect to API for full data.\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filenamePreview();
    a.click();
    window.URL.revokeObjectURL(url);

    this.successMessage.set('Local CSV export downloaded successfully!');
    this.errorMessage.set(null);
  }

  /**
   * Quick export with preset
   * @param type - Export type
   * @param format - Export format
   */
  quickExport(type: ExportType, format: ExportFormat): void {
    this.selectedType.set(type);
    this.selectedFormat.set(format);
    this.generateExport();
  }

  // =========================================================================
  // HISTORY ACTIONS
  // =========================================================================

  /**
   * Download existing export
   * @param item - Export history item
   */
  downloadExport(item: ExportHistoryItem): void {
    if (!item.downloadUrl) {
      this.errorMessage.set('Download link has expired');
      return;
    }

    window.open(item.downloadUrl, '_blank');
  }

  /**
   * Regenerate export
   * @param item - Export history item to regenerate
   */
  regenerateExport(item: ExportHistoryItem): void {
    this.selectedType.set(item.type);
    this.selectedFormat.set(item.format);
    this.generateExport();
  }

  /**
   * Delete export from history
   * @param item - Export to delete
   */
  deleteExport(item: ExportHistoryItem): void {
    this.exportHistory.update(history =>
      history.filter(h => h.id !== item.id)
    );
  }

  // =========================================================================
  // DATE HANDLING
  // =========================================================================

  /**
   * Apply date preset
   * @param days - Number of days for the range
   */
  applyDatePreset(days: number): void {
    if (days === 365) {
      const now = new Date();
      this.dateRange.set({
        startDate: `${now.getFullYear()}-01-01`,
        endDate: this.getToday()
      });
    } else {
      this.dateRange.set({
        startDate: this.getDateDaysAgo(days),
        endDate: this.getToday()
      });
    }
  }

  /**
   * Get today's date
   * @returns Today's date in YYYY-MM-DD format
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get date N days ago
   * @param days - Number of days ago
   * @returns Date in YYYY-MM-DD format
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Update start date in date range
   * @param event - Input change event
   */
  updateStartDate(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateRange.update(range => ({ ...range, startDate: target.value }));
  }

  /**
   * Update end date in date range
   * @param event - Input change event
   */
  updateEndDate(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateRange.update(range => ({ ...range, endDate: target.value }));
  }

  // =========================================================================
  // FORMATTING
  // =========================================================================

  /**
   * Format file size
   * @param bytes - Size in bytes
   * @returns Formatted size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Check if export is expired
   * @param item - Export item
   * @returns Whether export has expired
   */
  isExpired(item: ExportHistoryItem): boolean {
    return new Date() > new Date(item.expiresAt);
  }

  /**
   * Get status color class
   * @param status - Export status
   * @returns CSS class name
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'status--completed';
      case 'processing':
        return 'status--processing';
      case 'failed':
        return 'status--failed';
      default:
        return '';
    }
  }

  /**
   * Get type icon
   * @param type - Export type
   * @returns Material icon name
   */
  getTypeIcon(type: ExportType): string {
    const config = this.exportTypes.find(t => t.type === type);
    return config?.icon || 'description';
  }

  /**
   * Get type label
   * @param type - Export type
   * @returns Human-readable label
   */
  getTypeLabel(type: ExportType): string {
    const config = this.exportTypes.find(t => t.type === type);
    return config?.label || type;
  }

  // =========================================================================
  // TRACKING
  // =========================================================================

  /**
   * Track export type by value
   */
  trackByType(index: number, item: ExportTypeConfig): string {
    return item.type;
  }

  /**
   * Track format by value
   */
  trackByFormat(index: number, item: { format: ExportFormat }): string {
    return item.format;
  }

  /**
   * Track history item by ID
   */
  trackByHistoryId(index: number, item: ExportHistoryItem): string {
    return item.id;
  }
}
