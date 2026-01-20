/**
 * UI Components Barrel Export
 *
 * Central export point for all reusable UI components.
 * Import from this file for clean, organized imports.
 *
 * @example
 * ```typescript
 * import {
 *   LoaderComponent,
 *   ButtonComponent,
 *   ModalComponent
 * } from '@shared/components/ui';
 * ```
 */

// Button Component
export { ButtonComponent, ButtonVariant, ButtonSize } from './button/button.component';

// Loader Component
export { LoaderComponent } from './loader/loader.component';

// Breadcrumb Component
export { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb/breadcrumb.component';

// Pagination Component
export { PaginationComponent } from './pagination/pagination.component';

// Modal Component
export { ModalComponent } from './modal/modal.component';

// Alert Component
export { AlertComponent, AlertType } from './alert/alert.component';

// Badge Component
export { BadgeComponent, BadgeType } from './badge/badge.component';

// Product Box Components
export { ProductBoxGridComponent } from './product-box/product-box-grid.component';
export { ProductBoxListComponent } from './product-box/product-box-list.component';
