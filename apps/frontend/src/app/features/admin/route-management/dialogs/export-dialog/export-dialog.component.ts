import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Configuration for route-permission export
 */
export interface ExportConfig {
  /**
   * Export file format
   */
  format: ExportFormat;

  /**
   * Include mapped routes in export
   */
  includeMapped: boolean;

  /**
   * Include unmapped routes in export
   */
  includeUnmapped: boolean;

  /**
   * Include public routes in export
   */
  includePublic: boolean;

  /**
   * Include metadata (timestamps, controller, handler)
   */
  includeMetadata: boolean;

  /**
   * Pretty-print JSON (only applies to JSON format)
   */
  prettyPrint: boolean;
}

/**
 * ExportDialogComponent
 *
 * Dialog for configuring and exporting route-permission mappings.
 * Supports:
 * - JSON and CSV export formats
 * - Selective export (mapped, unmapped, public routes)
 * - Metadata inclusion options
 * - Export preview with statistics
 * - File download on confirmation
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(ExportDialogComponent, {
 *   width: '500px'
 * });
 *
 * dialogRef.afterClosed().subscribe((config: ExportConfig) => {
 *   if (config) {
 *     // Trigger export with config
 *     this.routeService.exportRoutes(config).subscribe();
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.scss']
})
export class ExportDialogComponent implements OnInit {
  /**
   * Export configuration form
   */
  exportForm!: FormGroup;

  /**
   * Loading state during export operation
   */
  loading = signal(false);

  /**
   * Mock data for preview calculations
   * In real implementation, this would come from service
   */
  private mockStats = {
    mappedCount: 45,
    unmappedCount: 12,
    publicCount: 8,
    totalCount: 65
  };

  /**
   * Computed route count based on form selections
   */
  routeCount = computed(() => {
    const formValue = this.exportForm?.value;
    if (!formValue) return 0;

    let count = 0;
    if (formValue.includeMapped) count += this.mockStats.mappedCount;
    if (formValue.includeUnmapped) count += this.mockStats.unmappedCount;
    if (formValue.includePublic) count += this.mockStats.publicCount;
    return count;
  });

  /**
   * Computed estimated file size
   */
  estimatedSize = computed(() => {
    const count = this.routeCount();
    const format = this.exportForm?.value.format;
    const includeMetadata = this.exportForm?.value.includeMetadata;
    const prettyPrint = this.exportForm?.value.prettyPrint;

    if (count === 0) return '0 KB';

    // Rough estimation
    let bytesPerRoute = format === 'json' ? 200 : 100;
    if (includeMetadata) bytesPerRoute += 100;
    if (format === 'json' && prettyPrint) bytesPerRoute += 50;

    const totalBytes = count * bytesPerRoute;
    const kb = totalBytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExportDialogComponent, ExportConfig>,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Initializes the component and creates the form
   */
  ngOnInit(): void {
    this.createForm();
  }

  /**
   * Creates and initializes the export configuration form
   */
  private createForm(): void {
    this.exportForm = this.fb.group({
      format: ['json', Validators.required],
      includeMapped: [true],
      includeUnmapped: [true],
      includePublic: [false],
      includeMetadata: [true],
      prettyPrint: [true]
    });

    // Watch format changes to conditionally show/hide prettyPrint
    this.exportForm.get('format')?.valueChanges.subscribe(format => {
      if (format === 'csv') {
        this.exportForm.get('prettyPrint')?.setValue(false);
      }
    });
  }

  /**
   * Gets the route count for display
   * Returns signal value
   */
  getRouteCount(): number {
    return this.routeCount();
  }

  /**
   * Gets the estimated file size for display
   * Returns signal value
   */
  getEstimatedSize(): string {
    return this.estimatedSize();
  }

  /**
   * Checks if export is valid
   * At least one route type must be selected
   */
  isExportValid(): boolean {
    const value = this.exportForm.value;
    return value.includeMapped || value.includeUnmapped || value.includePublic;
  }

  /**
   * Handles export action
   * Validates form and triggers file download
   */
  onExport(): void {
    if (!this.isExportValid()) {
      this.snackBar.open(
        'Please select at least one route type to export',
        'Close',
        {
          duration: 3000,
          panelClass: ['warn-snackbar']
        }
      );
      return;
    }

    if (this.exportForm.invalid) {
      this.snackBar.open('Please check all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading.set(true);

    // Simulate export operation
    setTimeout(() => {
      this.loading.set(false);

      const config: ExportConfig = this.exportForm.value;

      // Close dialog with config
      this.dialogRef.close(config);

      // Trigger download (in real implementation, this would be done by service)
      this.triggerDownload(config);

      this.snackBar.open(
        `Exporting ${this.routeCount()} routes as ${config.format.toUpperCase()}`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      );
    }, 1000);
  }

  /**
   * Triggers file download
   * In real implementation, this would call the backend service
   *
   * @param config - Export configuration
   */
  private triggerDownload(config: ExportConfig): void {
    // Mock download - replace with actual service call
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `route-permissions_${timestamp}.${config.format}`;

    // Create mock data
    let content = '';
    if (config.format === 'json') {
      const data = this.generateMockJsonData(config);
      content = config.prettyPrint
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
    } else {
      content = this.generateMockCsvData(config);
    }

    // Create blob and download
    const blob = new Blob([content], {
      type: config.format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generates mock JSON data for export
   *
   * @param config - Export configuration
   * @returns Mock JSON data
   */
  private generateMockJsonData(config: ExportConfig): any {
    const data: any = {
      exportDate: new Date().toISOString(),
      format: 'json',
      totalRoutes: this.routeCount(),
      routes: []
    };

    // Add sample routes based on config
    if (config.includeMapped) {
      data.routes.push({
        id: 'route-1',
        path: '/api/users',
        method: 'GET',
        controller: 'UserController',
        handler: 'findAll',
        permissionId: 'perm-1',
        permission: { name: 'user.read', description: 'Read users' },
        isPublic: false,
        ...(config.includeMetadata && {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });
    }

    if (config.includeUnmapped) {
      data.routes.push({
        id: 'route-2',
        path: '/api/products',
        method: 'GET',
        controller: 'ProductController',
        handler: 'findAll',
        permissionId: null,
        permission: null,
        isPublic: false,
        ...(config.includeMetadata && {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });
    }

    if (config.includePublic) {
      data.routes.push({
        id: 'route-3',
        path: '/api/health',
        method: 'GET',
        controller: 'HealthController',
        handler: 'check',
        permissionId: null,
        permission: null,
        isPublic: true,
        ...(config.includeMetadata && {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });
    }

    return data;
  }

  /**
   * Generates mock CSV data for export
   *
   * @param config - Export configuration
   * @returns CSV string
   */
  private generateMockCsvData(config: ExportConfig): string {
    const headers = ['ID', 'Path', 'Method', 'Controller', 'Handler', 'Permission', 'Is Public'];
    if (config.includeMetadata) {
      headers.push('Created At', 'Updated At');
    }

    let csv = headers.join(',') + '\n';

    // Add sample rows
    if (config.includeMapped) {
      csv += 'route-1,/api/users,GET,UserController,findAll,user.read,false';
      if (config.includeMetadata) {
        csv += `,${new Date().toISOString()},${new Date().toISOString()}`;
      }
      csv += '\n';
    }

    if (config.includeUnmapped) {
      csv += 'route-2,/api/products,GET,ProductController,findAll,,false';
      if (config.includeMetadata) {
        csv += `,${new Date().toISOString()},${new Date().toISOString()}`;
      }
      csv += '\n';
    }

    if (config.includePublic) {
      csv += 'route-3,/api/health,GET,HealthController,check,,true';
      if (config.includeMetadata) {
        csv += `,${new Date().toISOString()},${new Date().toISOString()}`;
      }
      csv += '\n';
    }

    return csv;
  }

  /**
   * Handles cancel action
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Checks if format is JSON
   */
  get isJsonFormat(): boolean {
    return this.exportForm?.value.format === 'json';
  }
}
