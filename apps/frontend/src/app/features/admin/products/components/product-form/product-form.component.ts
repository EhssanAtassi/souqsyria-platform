/**
 * @file product-form.component.ts
 * @description Product creation and editing form component.
 *              Provides comprehensive form for managing product details including
 *              bilingual names, pricing, categories, and status toggles.
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminProductsApiService } from '../../services/admin-products-api.service';

/**
 * Product Form Component
 * @description Handles product creation and editing with bilingual support.
 *
 * @features
 * - Bilingual name fields (English/Arabic)
 * - SKU management
 * - Status toggles (active/published)
 * - Form validation
 * - Edit/Create mode detection
 *
 * @example
 * ```html
 * <!-- Create mode -->
 * <app-product-form></app-product-form>
 *
 * <!-- Edit mode (routed with :id param) -->
 * <app-product-form></app-product-form>
 * ```
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminProductsApi = inject(AdminProductsApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Product ID for edit mode */
  readonly productId = signal<number | null>(null);

  /** Loading state */
  readonly isLoading = signal(false);

  /** Saving state */
  readonly isSaving = signal(false);

  /** Edit mode flag */
  readonly isEditMode = computed(() => this.productId() !== null);

  /** Form title */
  readonly formTitle = computed(() =>
    this.isEditMode() ? 'Edit Product' : 'Create New Product'
  );

  // =========================================================================
  // FORM
  // =========================================================================

  /**
   * Product form
   * @description Reactive form for product data with validation
   */
  productForm: FormGroup;

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  constructor() {
    this.productForm = this.fb.group({
      nameEn: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      nameAr: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      isActive: [true],
      isPublished: [false]
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params['id'], 10);
      if (!isNaN(id)) {
        this.productId.set(id);
        this.loadProduct();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load product for editing
   * @description Fetches product data and populates form
   */
  private loadProduct(): void {
    const id = this.productId();
    if (!id) return;

    this.isLoading.set(true);

    this.adminProductsApi
      .getProduct(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (product) => {
          this.productForm.patchValue({
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            sku: product.sku,
            isActive: product.isActive,
            isPublished: product.isPublished
          });
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.snackBar.open('Failed to load product', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/products']);
        }
      });
  }

  // =========================================================================
  // FORM ACTIONS
  // =========================================================================

  /**
   * Submit form
   * @description Saves product (create or update based on mode)
   */
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Please fix form errors', 'Close', { duration: 3000 });
      return;
    }

    // For now, just show a message since we only have read operations in admin API
    this.snackBar.open(
      'Product form submitted (create/update endpoints not yet implemented)',
      'Close',
      { duration: 3000 }
    );

    // Navigate back to list
    this.router.navigate(['/admin/products']);
  }

  /**
   * Cancel form
   * @description Navigates back to product list
   */
  onCancel(): void {
    this.router.navigate(['/admin/products']);
  }

  /**
   * Reset form
   * @description Resets form to initial state
   */
  onReset(): void {
    if (this.isEditMode()) {
      this.loadProduct();
    } else {
      this.productForm.reset({
        nameEn: '',
        nameAr: '',
        sku: '',
        isActive: true,
        isPublished: false
      });
    }
  }

  // =========================================================================
  // FORM HELPERS
  // =========================================================================

  /**
   * Check if field has error
   * @param fieldName - Form field name
   * @param errorType - Error type to check
   * @returns Whether field has the error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.productForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.touched && field.hasError(errorType);
    }
    return field.touched && field.invalid;
  }

  /**
   * Get error message for field
   * @param fieldName - Form field name
   * @returns Error message
   */
  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.hasError('required')) return 'This field is required';
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    if (field.hasError('pattern')) return 'Invalid format (use A-Z, 0-9, -)';

    return 'Invalid value';
  }
}
