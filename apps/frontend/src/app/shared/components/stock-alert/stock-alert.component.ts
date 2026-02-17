import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Stock Alert Component
 *
 * @description Displays stock availability status as colored badges.
 * Supports three states: in stock (green), low stock (yellow), out of stock (red).
 * Fully bilingual with Arabic/English support and RTL layout.
 *
 * @swagger
 * components:
 *   schemas:
 *     StockAlertProps:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock]
 *           description: Current stock availability status
 *         quantity:
 *           type: number
 *           description: Remaining stock quantity (shown for low_stock)
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language for labels
 *
 * @example
 * ```html
 * <app-stock-alert status="low_stock" [quantity]="3" language="en"></app-stock-alert>
 * ```
 */
@Component({
  selector: 'app-stock-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-alert.component.html',
  styleUrls: ['./stock-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockAlertComponent {
  /** Current stock availability status */
  @Input({ required: true }) status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';

  /** Remaining stock quantity (displayed for low_stock status) */
  @Input() quantity?: number;

  /** Display language for labels */
  @Input() language: 'en' | 'ar' = 'en';

  /** Get the Material icon name based on stock status */
  get icon(): string {
    switch (this.status) {
      case 'in_stock': return 'check_circle';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'cancel';
    }
  }

  /** Get CSS classes for the badge based on stock status */
  get badgeClasses(): string {
    switch (this.status) {
      case 'in_stock':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'low_stock':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'out_of_stock':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  }

  /** Get icon color class based on stock status */
  get iconClasses(): string {
    switch (this.status) {
      case 'in_stock': return 'text-green-500';
      case 'low_stock': return 'text-yellow-500';
      case 'out_of_stock': return 'text-red-500';
    }
  }

  /** Get localized display message based on status and language */
  get message(): string {
    switch (this.status) {
      case 'in_stock':
        return this.language === 'ar' ? 'متوفر' : 'In stock';
      case 'low_stock':
        return this.language === 'ar'
          ? `فقط ${this.quantity ?? ''} متبقي`
          : `Only ${this.quantity ?? ''} left`;
      case 'out_of_stock':
        return this.language === 'ar' ? 'غير متوفر' : 'Out of stock';
    }
  }
}
