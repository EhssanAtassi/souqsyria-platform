/**
 * @file category-manager.component.ts
 * @description Category management component for hierarchical product categories.
 *              Provides tree view, CRUD operations, and drag-drop reordering.
 * @module AdminDashboard/Products/Components
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminProductsService } from '../../../services';
import { Category, CategoryHierarchy } from '../../../interfaces';

/**
 * Category form data interface
 * @description Represents the data structure for category creation/editing
 */
interface CategoryFormData {
  nameEn: string;
  nameAr: string;
  slug: string;
  parentId: number | null;
  description: string;
  isActive: boolean;
  sortOrder: number;
  icon?: string;
}

/**
 * Category Manager Component
 * @description Manages product categories in a hierarchical tree structure.
 *
 * @features
 * - Tree view of categories with expand/collapse
 * - Create, edit, delete categories
 * - Drag-and-drop reordering
 * - Category activation/deactivation
 * - Product count display per category
 *
 * @example
 * ```html
 * <!-- Routed via /admin/products/categories -->
 * <app-category-manager></app-category-manager>
 * ```
 */
@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './category-manager.component.html',
  styleUrl: './category-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryManagerComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly productsService = inject(AdminProductsService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(false);

  /** Saving state */
  readonly isSaving = signal(false);

  /** Categories hierarchy */
  readonly categories = signal<CategoryHierarchy[]>([]);

  /** Flat list of all categories */
  readonly flatCategories = signal<Category[]>([]);

  /** Expanded category IDs */
  readonly expandedIds = signal<Set<number>>(new Set());

  /** Currently editing category */
  readonly editingCategory = signal<Category | null>(null);

  /** Show category form dialog */
  readonly showFormDialog = signal(false);

  /** Form mode: 'create' or 'edit' */
  readonly formMode = signal<'create' | 'edit'>('create');

  /** Search term for filtering */
  readonly searchTerm = signal('');

  // =========================================================================
  // FORM
  // =========================================================================

  /** Category form */
  categoryForm: FormGroup = this.fb.group({
    nameEn: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    nameAr: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    parentId: [null],
    description: [''],
    isActive: [true],
    sortOrder: [0, [Validators.min(0)]],
    icon: ['']
  });

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Total category count */
  readonly totalCategories = computed(() => this.flatCategories().length);

  /** Active categories count */
  readonly activeCategories = computed(() =>
    this.flatCategories().filter(c => c.isActive).length
  );

  /** Root categories (no parent) */
  readonly rootCategories = computed(() =>
    this.categories().filter(c => !c.parentId)
  );

  /** Filtered categories based on search */
  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.categories();

    return this.filterCategoriesRecursive(this.categories(), term);
  });

  /** Parent category options for dropdown */
  readonly parentOptions = computed(() => {
    const editing = this.editingCategory();
    return this.flatCategories().filter(c => {
      // Can't be its own parent
      if (editing && c.id === editing.id) return false;
      // Can't be a descendant of itself (prevent circular refs)
      if (editing && this.isDescendantOf(c.id, editing.id)) return false;
      return true;
    });
  });

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load all categories
   * @description Fetches category hierarchy from API
   */
  loadCategories(): void {
    this.isLoading.set(true);

    this.productsService
      .getCategories({ includeInactive: true, flat: false })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          // Cast to CategoryHierarchy[] since API returns hierarchical data with children arrays
          const hierarchicalCategories = response.categories as CategoryHierarchy[];
          this.categories.set(hierarchicalCategories);
          this.flatCategories.set(this.flattenCategories(response.categories));
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // TREE EXPANSION
  // =========================================================================

  /**
   * Toggle category expansion
   * @param categoryId - Category ID to toggle
   */
  toggleExpand(categoryId: number): void {
    this.expandedIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(categoryId)) {
        newIds.delete(categoryId);
      } else {
        newIds.add(categoryId);
      }
      return newIds;
    });
  }

  /**
   * Check if category is expanded
   * @param categoryId - Category ID to check
   * @returns Whether the category is expanded
   */
  isExpanded(categoryId: number): boolean {
    return this.expandedIds().has(categoryId);
  }

  /**
   * Expand all categories
   */
  expandAll(): void {
    const allIds = new Set(this.flatCategories().map(c => c.id));
    this.expandedIds.set(allIds);
  }

  /**
   * Collapse all categories
   */
  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  // =========================================================================
  // CRUD OPERATIONS
  // =========================================================================

  /**
   * Open create category dialog
   * @param parentId - Optional parent category ID
   */
  openCreateDialog(parentId?: number): void {
    this.formMode.set('create');
    this.editingCategory.set(null);
    this.categoryForm.reset({
      nameEn: '',
      nameAr: '',
      slug: '',
      parentId: parentId || null,
      description: '',
      isActive: true,
      sortOrder: 0,
      icon: ''
    });
    this.showFormDialog.set(true);
  }

  /**
   * Open edit category dialog
   * @param category - Category to edit
   */
  openEditDialog(category: Category): void {
    this.formMode.set('edit');
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      slug: category.slug,
      parentId: category.parentId,
      description: category.description || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
      icon: category.icon || ''
    });
    this.showFormDialog.set(true);
  }

  /**
   * Close form dialog
   */
  closeFormDialog(): void {
    this.showFormDialog.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  /**
   * Save category (create or update)
   */
  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.markFormTouched();
      return;
    }

    this.isSaving.set(true);
    const formData: CategoryFormData = this.categoryForm.value;

    const operation = this.formMode() === 'create'
      ? this.productsService.createCategory(formData)
      : this.productsService.updateCategory(this.editingCategory()!.id, formData);

    operation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          const message = this.formMode() === 'create'
            ? 'Category created successfully'
            : 'Category updated successfully';
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.closeFormDialog();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error saving category:', error);
          const message = error.error?.message || 'Failed to save category';
          this.snackBar.open(message, 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Delete category
   * @param category - Category to delete
   */
  deleteCategory(category: Category): void {
    if (category.productCount && category.productCount > 0) {
      this.snackBar.open(
        `Cannot delete: ${category.productCount} products in this category`,
        'Close',
        { duration: 4000 }
      );
      return;
    }

    if (category.children && category.children.length > 0) {
      this.snackBar.open(
        'Cannot delete: Category has subcategories',
        'Close',
        { duration: 4000 }
      );
      return;
    }

    if (!confirm(`Delete category "${category.nameEn}"? This action cannot be undone.`)) {
      return;
    }

    this.productsService
      .deleteCategory(category.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.snackBar.open('Failed to delete category', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Toggle category active status
   * @param category - Category to toggle
   */
  toggleStatus(category: Category): void {
    this.productsService
      .updateCategory(category.id, { isActive: !category.isActive })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const status = !category.isActive ? 'activated' : 'deactivated';
          this.snackBar.open(`Category ${status}`, 'Close', { duration: 3000 });
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error toggling status:', error);
          this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // SEARCH
  // =========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);

    // Auto-expand matching categories
    if (value) {
      this.expandMatchingCategories(value.toLowerCase());
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  // =========================================================================
  // SLUG GENERATION
  // =========================================================================

  /**
   * Generate slug from English name
   */
  generateSlug(): void {
    const nameEn = this.categoryForm.get('nameEn')?.value;
    if (nameEn) {
      const slug = nameEn
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      this.categoryForm.patchValue({ slug });
    }
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Flatten nested categories into single array
   * @param categories - Nested categories
   * @returns Flat array of categories with level information
   */
  private flattenCategories(categories: Category[]): Category[] {
    const result: Category[] = [];

    const flatten = (items: Category[], level = 0) => {
      for (const item of items) {
        result.push({ ...item, level } as Category & { level: number });
        if (item.children?.length) {
          flatten(item.children, level + 1);
        }
      }
    };

    flatten(categories);
    return result;
  }

  /**
   * Filter categories recursively by search term
   * @param categories - Categories to filter
   * @param term - Search term
   * @returns Filtered categories
   */
  private filterCategoriesRecursive(
    categories: CategoryHierarchy[],
    term: string
  ): CategoryHierarchy[] {
    return categories.filter(category => {
      const nameMatch =
        category.nameEn.toLowerCase().includes(term) ||
        category.nameAr.toLowerCase().includes(term);

      const childMatches = category.children?.length
        ? this.filterCategoriesRecursive(category.children, term).length > 0
        : false;

      return nameMatch || childMatches;
    });
  }

  /**
   * Check if a category is a descendant of another
   * @param categoryId - Category ID to check
   * @param ancestorId - Potential ancestor ID
   * @returns Whether categoryId is a descendant of ancestorId
   */
  private isDescendantOf(categoryId: number, ancestorId: number): boolean {
    const category = this.flatCategories().find(c => c.id === categoryId);
    if (!category || !category.parentId) return false;
    if (category.parentId === ancestorId) return true;
    return this.isDescendantOf(category.parentId, ancestorId);
  }

  /**
   * Expand categories matching search term
   * @param term - Search term
   */
  private expandMatchingCategories(term: string): void {
    const matching = this.flatCategories()
      .filter(c =>
        c.nameEn.toLowerCase().includes(term) ||
        c.nameAr.toLowerCase().includes(term)
      );

    // Get all parent IDs of matching categories
    const parentIds = new Set<number>();
    for (const cat of matching) {
      let current = cat;
      while (current.parentId) {
        parentIds.add(current.parentId);
        current = this.flatCategories().find(c => c.id === current.parentId) as any;
        if (!current) break;
      }
    }

    this.expandedIds.set(parentIds);
  }

  /**
   * Mark all form controls as touched
   */
  private markFormTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      this.categoryForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Get form field error message
   * @param fieldName - Form field name
   * @returns Error message or null
   */
  getFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);
    if (!field?.touched || !field.errors) return null;

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['pattern']) return 'Only lowercase letters, numbers, and hyphens allowed';
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;

    return 'Invalid value';
  }

  /**
   * Track categories by ID for ngFor optimization
   * @param index - Index in the list
   * @param category - Category item
   * @returns Category ID
   */
  trackByCategoryId(index: number, category: CategoryHierarchy): number {
    return category.id;
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadCategories();
  }
}
