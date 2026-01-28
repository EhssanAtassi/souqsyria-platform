/**
 * Role Templates Page Component
 *
 * @description
 * Displays gallery of pre-built role templates.
 * Users can preview templates and create roles from them.
 *
 * @features
 * - Template gallery with responsive grid
 * - Template preview dialog
 * - Create role from template
 * - Category filtering
 * - Search functionality
 * - Loading states
 *
 * @architecture
 * - Smart container component
 * - Uses Akita for state management
 * - OnPush change detection
 * - Router integration for navigation
 *
 * @route
 * /admin/roles/templates
 *
 * @swagger
 * paths:
 *   /admin/roles/templates:
 *     get:
 *       summary: Role templates gallery
 *       description: Browse and preview pre-built role templates
 *
 * @example
 * ```html
 * <app-role-templates-page></app-role-templates-page>
 * ```
 */

import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { RoleManagementService } from '../../state/role-management.service';
import { RoleManagementQuery } from '../../state/role-management.query';
import { RoleTemplate, TemplateCategory } from '../../models';

import { TemplateCardComponent } from './components/template-card.component';
import {
  TemplatePreviewDialogComponent,
  TemplatePreviewResult,
} from './dialogs/template-preview-dialog.component';

/**
 * Role Templates Page Component
 *
 * @class RoleTemplatesPageComponent
 * @implements {OnInit}
 */
@Component({
  selector: 'app-role-templates-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TemplateCardComponent,
  ],
  templateUrl: './role-templates-page.component.html',
  styleUrls: ['./role-templates-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleTemplatesPageComponent implements OnInit {
  /**
   * Injected dependencies
   *
   * @private
   * @readonly
   */
  private readonly service = inject(RoleManagementService);
  private readonly query = inject(RoleManagementQuery);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Observable streams
   *
   * @description
   * Reactive data from Akita store.
   *
   * @public
   * @readonly
   */
  readonly templates$ = this.query.cachedTemplates$;
  readonly permissions$ = this.query.cachedPermissions$;
  readonly loadingTemplates$ = this.query.loadingTemplates$;
  readonly loadingPermissions$ = this.query.loadingPermissions$;

  /**
   * Search query signal
   *
   * @description
   * User search input for filtering templates.
   *
   * @public
   */
  searchQuery = signal('');

  /**
   * Category filter signal
   *
   * @description
   * Selected category for filtering templates.
   *
   * @public
   */
  categoryFilter = signal<TemplateCategory | 'all'>('all');

  /**
   * Available categories
   *
   * @description
   * List of template categories for filter dropdown.
   *
   * @public
   * @readonly
   */
  readonly categories: Array<{ value: TemplateCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'administration', label: 'Administration' },
    { value: 'content_management', label: 'Content Management' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'vendor_management', label: 'Vendor Management' },
    { value: 'operations', label: 'Operations' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'security', label: 'Security' },
    { value: 'custom', label: 'Custom' },
  ];

  /**
   * Filtered templates computed signal
   *
   * @description
   * Templates filtered by search query and category.
   *
   * @public
   */
  filteredTemplates = computed(() => {
    const templates = this.query.getCachedTemplates();
    const search = this.searchQuery().toLowerCase();
    const category = this.categoryFilter();

    return templates.filter((template) => {
      // Category filter
      if (category !== 'all' && template.category !== category) {
        return false;
      }

      // Search filter
      if (search) {
        const matchesName = template.name.toLowerCase().includes(search);
        const matchesDescription = template.description.toLowerCase().includes(search);
        const matchesCategory = template.category.toLowerCase().includes(search);
        if (!matchesName && !matchesDescription && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  });

  /**
   * Loading state computed signal
   *
   * @description
   * Combined loading state for templates and permissions.
   *
   * @public
   */
  loading = computed(() => {
    return this.query.getValue().ui.operations.loadingTemplates ||
      this.query.getValue().ui.operations.loadingPermissions;
  });

  /**
   * Initialize component
   *
   * @description
   * Loads templates and permissions data.
   *
   * @public
   */
  ngOnInit(): void {
    // Fetch templates if not cached
    this.service
      .fetchTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Fetch permissions if not cached
    this.service
      .fetchPermissions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Handle search input changes
   *
   * @description
   * Updates search query signal for filtering.
   *
   * @param {string} query - Search query
   *
   * @public
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Handle category filter changes
   *
   * @description
   * Updates category filter signal.
   *
   * @param {TemplateCategory | 'all'} category - Selected category
   *
   * @public
   */
  onCategoryChange(category: TemplateCategory | 'all'): void {
    this.categoryFilter.set(category);
  }

  /**
   * Clear all filters
   *
   * @description
   * Resets search and category filters.
   *
   * @public
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('all');
  }

  /**
   * Get Category Label
   *
   * @description
   * Returns the display label for a category value.
   *
   * @param {TemplateCategory | 'all'} categoryValue - Category value
   * @returns {string} Category label
   *
   * @public
   */
  getCategoryLabel(categoryValue: TemplateCategory | 'all'): string {
    return this.categories.find(c => c.value === categoryValue)?.label || '';
  }

  /**
   * Preview template
   *
   * @description
   * Opens template preview dialog.
   *
   * @param {RoleTemplate} template - Template to preview
   *
   * @public
   */
  onPreview(template: RoleTemplate): void {
    const permissions = this.query.getCachedPermissions();

    const dialogRef = this.dialog.open(TemplatePreviewDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        template,
        permissions,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: TemplatePreviewResult | undefined) => {
        if (result) {
          this.createRoleFromTemplate(result);
        }
      });
  }

  /**
   * Use template directly
   *
   * @description
   * Creates role from template without preview.
   *
   * @param {RoleTemplate} template - Template to use
   *
   * @public
   */
  onUseTemplate(template: RoleTemplate): void {
    const result: TemplatePreviewResult = {
      templateId: template.id,
    };
    this.createRoleFromTemplate(result);
  }

  /**
   * Create role from template
   *
   * @description
   * Navigates to role editor with template data.
   *
   * @param {TemplatePreviewResult} result - Template selection result
   *
   * @private
   */
  private createRoleFromTemplate(result: TemplatePreviewResult): void {
    // Navigate to role editor with template data as query params
    this.router.navigate(['/admin/roles/new'], {
      queryParams: {
        templateId: result.templateId,
        ...(result.customName && { name: result.customName }),
        ...(result.customDisplayName && { displayName: result.customDisplayName }),
        ...(result.customDescription && { description: result.customDescription }),
      },
    });
  }

  /**
   * Navigate back to roles list
   *
   * @description
   * Returns to main role management dashboard.
   *
   * @public
   */
  goBack(): void {
    this.router.navigate(['/admin/roles']);
  }

  /**
   * Navigate to create custom role
   *
   * @description
   * Opens role editor without template.
   *
   * @public
   */
  createCustomRole(): void {
    this.router.navigate(['/admin/roles/new']);
  }
}
