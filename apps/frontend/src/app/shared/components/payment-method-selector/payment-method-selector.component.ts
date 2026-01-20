import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { PaymentMethod, PAYMENT_METHODS } from '../../interfaces/checkout.interface';

/**
 * Payment Method Selector Component
 *
 * Displays available payment methods for Syrian marketplace.
 * Supports Cash on Delivery, Mobile Wallets, and Bank Transfer.
 * Provides bilingual display and trust indicators.
 *
 * Features:
 * - Multiple payment method options
 * - Syrian-specific methods (Syriatel Cash, MTN)
 * - Bilingual labels (Arabic/English)
 * - Processing fee display
 * - Method availability status
 * - Trust and security indicators
 * - Golden Wheat design system
 * - Mobile-optimized layout
 *
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethodSelectorComponent:
 *       type: object
 *       description: Payment method selection component
 *       properties:
 *         selectedMethod:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         showFees:
 *           type: boolean
 *
 * @example
 * <app-payment-method-selector
 *   [selectedMethod]="currentMethod"
 *   [language]="'ar'"
 *   [showFees]="true"
 *   (methodSelected)="onMethodSelected($event)">
 * </app-payment-method-selector>
 */
@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatRadioModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './payment-method-selector.component.html',
  styleUrls: ['./payment-method-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentMethodSelectorComponent {

  // =============================================
  // INPUTS
  // =============================================

  /** Selected payment method */
  @Input() selectedMethod: PaymentMethod | null = null;

  /** Current language (en or ar) */
  @Input() language: 'en' | 'ar' = 'en';

  /** Show processing fees */
  @Input() showFees: boolean = true;

  /** Show trust indicators */
  @Input() showTrustIndicators: boolean = true;

  /** Compact mode for mobile */
  @Input() compact: boolean = false;

  // =============================================
  // OUTPUTS
  // =============================================

  /** Emits when payment method is selected */
  @Output() methodSelected = new EventEmitter<PaymentMethod>();

  // =============================================
  // STATE SIGNALS
  // =============================================

  /** Available payment methods */
  readonly paymentMethods = signal<PaymentMethod[]>(PAYMENT_METHODS);

  /** Currently selected method ID */
  readonly selectedMethodId = signal<string>('cod');

  // =============================================
  // COMPUTED SIGNALS
  // =============================================

  /** Filter only available methods */
  readonly availableMethods = computed(() => {
    return this.paymentMethods().filter(method => method.isAvailable);
  });

  /** Get recommended method (COD for Syrian market) */
  readonly recommendedMethod = computed(() => {
    return this.paymentMethods().find(method => method.id === 'cod');
  });

  // =============================================
  // METHODS
  // =============================================

  /**
   * Handle Method Selection
   *
   * Updates selected method and emits event.
   *
   * @param method - Selected payment method
   */
  onMethodSelect(method: PaymentMethod): void {
    if (!method.isAvailable) return;

    this.selectedMethodId.set(method.id);
    this.methodSelected.emit(method);
  }

  /**
   * Get Method Name
   *
   * Returns method name in current language.
   *
   * @param method - Payment method
   * @returns Localized method name
   */
  getMethodName(method: PaymentMethod): string {
    return this.language === 'ar' ? method.nameAr : method.name;
  }

  /**
   * Get Method Description
   *
   * Returns method description in current language.
   *
   * @param method - Payment method
   * @returns Localized description
   */
  getMethodDescription(method: PaymentMethod): string {
    return this.language === 'ar' ? method.descriptionAr : method.description;
  }

  /**
   * Get Processing Fee Text
   *
   * Returns formatted processing fee text.
   *
   * @param method - Payment method
   * @returns Fee text
   */
  getProcessingFeeText(method: PaymentMethod): string {
    if (method.processingFee === 0) {
      return this.language === 'ar' ? 'مجاني' : 'Free';
    }
    return `${method.processingFee} ${this.language === 'ar' ? 'ل.س' : 'SYP'}`;
  }

  /**
   * Is Method Selected
   *
   * Checks if method is currently selected.
   *
   * @param method - Payment method to check
   * @returns True if selected
   */
  isMethodSelected(method: PaymentMethod): boolean {
    return this.selectedMethod?.id === method.id || this.selectedMethodId() === method.id;
  }

  /**
   * Is Recommended Method
   *
   * Checks if method is recommended (COD).
   *
   * @param method - Payment method to check
   * @returns True if recommended
   */
  isRecommended(method: PaymentMethod): boolean {
    return method.id === 'cod';
  }

  /**
   * Get Trust Indicator Text
   *
   * Returns trust indicator text for method type.
   *
   * @param method - Payment method
   * @returns Trust indicator text
   */
  getTrustIndicatorText(method: PaymentMethod): string {
    const indicators = {
      en: {
        cod: 'Most Popular',
        mobile_wallet: 'Instant',
        bank_transfer: 'Secure',
        credit_card: 'Protected'
      },
      ar: {
        cod: 'الأكثر شيوعاً',
        mobile_wallet: 'فوري',
        bank_transfer: 'آمن',
        credit_card: 'محمي'
      }
    };

    return indicators[this.language][method.type] || '';
  }
}
