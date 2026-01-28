/**
 * Permission Directives Barrel Export
 *
 * Centralized exports for all permission-based directives.
 * Import from this file to access all directive functionality.
 *
 * @module PermissionDirectives
 *
 * ## Usage
 *
 * ### Import in Standalone Component
 * ```typescript
 * import { Component } from '@angular/core';
 * import { CommonModule } from '@angular/common';
 * import {
 *   HasPermissionDirective,
 *   DisableWithoutPermissionDirective
 * } from '@app/shared/directives';
 *
 * @Component({
 *   selector: 'app-my-component',
 *   standalone: true,
 *   imports: [
 *     CommonModule,
 *     HasPermissionDirective,
 *     DisableWithoutPermissionDirective,
 *   ],
 *   templateUrl: './my-component.component.html'
 * })
 * export class MyComponent {}
 * ```
 *
 * ### Import All Directives
 * ```typescript
 * import * as PermissionDirectives from '@app/shared/directives';
 *
 * @Component({
 *   standalone: true,
 *   imports: [
 *     CommonModule,
 *     PermissionDirectives.HasPermissionDirective,
 *     PermissionDirectives.DisableWithoutPermissionDirective,
 *   ]
 * })
 * export class MyComponent {}
 * ```
 *
 * ## Available Directives
 *
 * ### HasPermissionDirective
 * Structural directive for conditionally displaying elements based on permissions.
 *
 * **Use when:**
 * - You want to completely hide elements from the DOM
 * - User should not see features they cannot access
 * - Navigation items, menu options, action buttons
 *
 * **Example:**
 * ```html
 * <button *hasPermission="'create_products'">Create Product</button>
 * ```
 *
 * ### DisableWithoutPermissionDirective
 * Attribute directive for disabling elements based on permissions.
 *
 * **Use when:**
 * - You want to show features but disable them
 * - Better UX by showing what exists but is unavailable
 * - Form inputs, buttons, select dropdowns
 *
 * **Example:**
 * ```html
 * <button [disableWithoutPermission]="'edit_product'">Edit</button>
 * ```
 *
 * ## When to Use Which Directive
 *
 * ### Use *hasPermission when:
 * ✅ Feature should be completely hidden
 * ✅ Navigation menu items
 * ✅ Admin-only sections
 * ✅ Beta features
 * ✅ Role-specific content
 *
 * ### Use [disableWithoutPermission] when:
 * ✅ User should see the feature exists
 * ✅ Better UX with visual feedback
 * ✅ Form fields with conditional editing
 * ✅ Action buttons in tables
 * ✅ Settings that require permissions
 *
 * ## Combining Both Directives
 *
 * You can use both directives together:
 * ```html
 * <!-- Show section only if user has view permission -->
 * <section *hasPermission="'view_products'">
 *   <h2>Products</h2>
 *
 *   <!-- Disable edit button if user lacks edit permission -->
 *   <button [disableWithoutPermission]="'edit_products'">Edit</button>
 *
 *   <!-- Disable delete button if user lacks delete permission -->
 *   <button [disableWithoutPermission]="'delete_products'">Delete</button>
 * </section>
 * ```
 *
 * ## Performance Considerations
 *
 * Both directives are optimized for performance:
 * - ✅ Use `distinctUntilChanged()` to prevent duplicate updates
 * - ✅ Automatic unsubscription on component destroy
 * - ✅ Shared permission check observables
 * - ✅ Minimal DOM manipulation
 *
 * ## Accessibility
 *
 * Both directives follow WCAG 2.1 AA guidelines:
 * - ✅ Proper ARIA attributes
 * - ✅ Keyboard navigation support
 * - ✅ Screen reader compatibility
 * - ✅ Focus management
 *
 * ## Material Design Integration
 *
 * Both directives are fully compatible with Angular Material:
 * - ✅ Material buttons (mat-button, mat-raised-button, etc.)
 * - ✅ Material form controls (mat-form-field, mat-input, etc.)
 * - ✅ Material menus and toolbars
 * - ✅ Material cards and expansion panels
 *
 * @see {@link HasPermissionDirective} for structural directive details
 * @see {@link DisableWithoutPermissionDirective} for attribute directive details
 * @see {@link PermissionQuery} for underlying permission service
 *
 * @swagger
 * components:
 *   modules:
 *     PermissionDirectives:
 *       description: Collection of permission-based UI control directives
 *       exports:
 *         - HasPermissionDirective
 *         - DisableWithoutPermissionDirective
 */

// Structural Directive - Show/Hide Elements
export { HasPermissionDirective } from './has-permission.directive';

// Attribute Directive - Enable/Disable Elements
export { DisableWithoutPermissionDirective } from './disable-without-permission.directive';

// Import the directives for use in the array
import { HasPermissionDirective } from './has-permission.directive';
import { DisableWithoutPermissionDirective } from './disable-without-permission.directive';

/**
 * Array of all permission directives for convenience
 *
 * Use this when you need to import all directives at once.
 *
 * @example
 * ```typescript
 * import { PERMISSION_DIRECTIVES } from '@app/shared/directives';
 *
 * @Component({
 *   standalone: true,
 *   imports: [CommonModule, ...PERMISSION_DIRECTIVES]
 * })
 * export class MyComponent {}
 * ```
 */
export const PERMISSION_DIRECTIVES = [
  HasPermissionDirective,
  DisableWithoutPermissionDirective,
] as const;
