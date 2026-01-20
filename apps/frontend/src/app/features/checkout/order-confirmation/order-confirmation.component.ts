import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrderConfirmation } from '../../../shared/interfaces/checkout.interface';
import { CheckoutService } from '../../../store/checkout/checkout.service';
import { CartService } from '../../../store/cart/cart.service';

/**
 * Order Confirmation Component
 *
 * Displays order confirmation after successful checkout.
 * Shows order details, tracking information, payment instructions, and next steps.
 * Provides actions for downloading invoice, sharing order, and tracking status.
 *
 * Features:
 * - Order summary and details
 * - Tracking number display
 * - Payment instructions (for COD/Bank Transfer)
 * - Estimated delivery information
 * - Download invoice functionality
 * - Share order capability
 * - Continue shopping CTA
 * - Golden Wheat design system
 * - Bilingual support (Arabic/English)
 * - Mobile-optimized layout
 *
 * @swagger
 * components:
 *   schemas:
 *     OrderConfirmationComponent:
 *       type: object
 *       description: Order confirmation display component
 *       properties:
 *         orderConfirmation:
 *           $ref: '#/components/schemas/OrderConfirmation'
 *         currentLanguage:
 *           type: string
 *           enum: [en, ar]
 *
 * @example
 * // Navigate to confirmation with order data
 * this.router.navigate(['/checkout/confirmation'], {
 *   state: { orderConfirmation: confirmation }
 * });
 */
@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderConfirmationComponent implements OnInit {

  // =============================================
  // DEPENDENCY INJECTION
  // =============================================

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private checkoutService = inject(CheckoutService);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  // =============================================
  // COMPONENT STATE SIGNALS
  // =============================================

  /** Order confirmation data */
  readonly orderConfirmation = signal<OrderConfirmation | null>(null);

  /** Current language for bilingual display */
  readonly currentLanguage = signal<'en' | 'ar'>('en');

  /** Loading state */
  readonly isLoading = signal<boolean>(false);

  /** Whether invoice is being downloaded */
  readonly isDownloadingInvoice = signal<boolean>(false);

  // =============================================
  // COMPUTED SIGNALS
  // =============================================

  /** Format order date for display */
  readonly formattedOrderDate = computed(() => {
    const confirmation = this.orderConfirmation();
    if (!confirmation) return '';

    const date = new Date(confirmation.orderDate);
    const lang = this.currentLanguage();

    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SY' : 'en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  });

  /** Format estimated delivery for display */
  readonly formattedDeliveryDate = computed(() => {
    const confirmation = this.orderConfirmation();
    if (!confirmation) return '';

    const date = new Date(confirmation.estimatedDelivery);
    const lang = this.currentLanguage();

    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SY' : 'en-US', {
      dateStyle: 'long'
    }).format(date);
  });

  /** Format currency amount */
  readonly formattedTotal = computed(() => {
    const confirmation = this.orderConfirmation();
    if (!confirmation) return '';

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: confirmation.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(confirmation.total);
  });

  /** Status badge color */
  readonly statusColor = computed(() => {
    const status = this.orderConfirmation()?.status;
    switch (status) {
      case 'confirmed': return 'primary';
      case 'processing': return 'accent';
      case 'shipped': return 'primary';
      case 'delivered': return 'primary';
      default: return 'warn';
    }
  });

  /** Status display text */
  readonly statusText = computed(() => {
    const status = this.orderConfirmation()?.status;
    const lang = this.currentLanguage();

    const statusMap = {
      en: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered'
      },
      ar: {
        pending: 'قيد الانتظار',
        confirmed: 'مؤكد',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل'
      }
    };

    return statusMap[lang][status || 'pending'];
  });

  // =============================================
  // COMPONENT LIFECYCLE
  // =============================================

  ngOnInit(): void {
    this.loadOrderConfirmation();
    this.loadLanguagePreference();
    this.clearCheckoutAndCart();
  }

  // =============================================
  // DATA LOADING
  // =============================================

  /**
   * Load Order Confirmation Data
   *
   * Retrieves order confirmation from navigation state or route params.
   * If not available, redirects to home page.
   */
  private loadOrderConfirmation(): void {
    // Try to get from navigation state first
    const navigation = this.router.getCurrentNavigation();
    const stateData = navigation?.extras?.state?.['orderConfirmation'];

    if (stateData) {
      this.orderConfirmation.set(stateData);
      return;
    }

    // Try to get from history state
    const historyState = history.state?.['orderConfirmation'];
    if (historyState) {
      this.orderConfirmation.set(historyState);
      return;
    }

    // If no order data found, redirect to home
    console.warn('No order confirmation data found');
    this.router.navigate(['/']);
  }

  /**
   * Load Language Preference
   *
   * Loads user's preferred language from localStorage.
   */
  private loadLanguagePreference(): void {
    const savedLang = localStorage.getItem('preferred-language') || 'en';
    this.currentLanguage.set(savedLang as 'en' | 'ar');
  }

  /**
   * Clear Checkout and Cart
   *
   * Clears checkout state and cart after successful order.
   */
  private clearCheckoutAndCart(): void {
    this.checkoutService.clearCheckout();
    // Note: Cart is already cleared by checkout component before navigation
  }

  // =============================================
  // ACTION HANDLERS
  // =============================================

  /**
   * Download Invoice
   *
   * Generates and downloads PDF invoice for the order.
   * Currently simulates download - implement actual PDF generation.
   */
  async downloadInvoice(): Promise<void> {
    const confirmation = this.orderConfirmation();
    if (!confirmation) return;

    this.isDownloadingInvoice.set(true);

    try {
      // Simulate invoice generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, this would call an API to generate PDF
      // For now, create a simple text file as placeholder
      const invoiceContent = this.generateInvoiceContent(confirmation);
      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${confirmation.orderNumber}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.showSnackBar(
        this.currentLanguage() === 'ar' ? 'تم تحميل الفاتورة' : 'Invoice downloaded',
        'success'
      );
    } catch (error) {
      console.error('Error downloading invoice:', error);
      this.showSnackBar(
        this.currentLanguage() === 'ar' ? 'خطأ في تحميل الفاتورة' : 'Error downloading invoice',
        'error'
      );
    } finally {
      this.isDownloadingInvoice.set(false);
    }
  }

  /**
   * Share Order
   *
   * Shares order details via Web Share API or copies link to clipboard.
   */
  async shareOrder(): Promise<void> {
    const confirmation = this.orderConfirmation();
    if (!confirmation) return;

    const shareData = {
      title: `Order ${confirmation.orderNumber}`,
      text: `My order from Syrian Marketplace - Order #${confirmation.orderNumber}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        this.showSnackBar(
          this.currentLanguage() === 'ar' ? 'تمت المشاركة بنجاح' : 'Shared successfully',
          'success'
        );
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        this.showSnackBar(
          this.currentLanguage() === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard',
          'success'
        );
      }
    } catch (error) {
      console.error('Error sharing order:', error);
    }
  }

  /**
   * Track Order
   *
   * Navigates to order tracking page.
   */
  trackOrder(): void {
    const confirmation = this.orderConfirmation();
    if (!confirmation) return;

    this.router.navigate(['/account/orders', confirmation.orderId]);
  }

  /**
   * Continue Shopping
   *
   * Navigates back to products page.
   */
  continueShopping(): void {
    this.router.navigate(['/']);
  }

  /**
   * Go to Account Orders
   *
   * Navigates to user's order history.
   */
  goToOrders(): void {
    this.router.navigate(['/account/orders']);
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Generate Invoice Content
   *
   * Creates simple text invoice content.
   * In production, this would generate proper PDF.
   *
   * @param confirmation - Order confirmation data
   * @returns Invoice content as string
   */
  private generateInvoiceContent(confirmation: OrderConfirmation): string {
    return `
SYRIAN MARKETPLACE - INVOICE
==============================

Order Number: ${confirmation.orderNumber}
Order Date: ${this.formattedOrderDate()}
Status: ${this.statusText()}

TOTAL: ${this.formattedTotal()}

Delivery Information:
Estimated Delivery: ${this.formattedDeliveryDate()}
${confirmation.trackingNumber ? `Tracking Number: ${confirmation.trackingNumber}` : ''}

Payment Instructions:
${confirmation.paymentInstructions}

Thank you for shopping with Syrian Marketplace!
Visit us at: https://souqsyria.com

==============================
    `.trim();
  }

  /**
   * Show Snack Bar Notification
   *
   * @param message - Message to display
   * @param type - Notification type
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'error' ? 'error-snackbar' : 'info-snackbar';
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }

  /**
   * Get Icon for Next Step
   *
   * Returns appropriate icon for each next step item.
   *
   * @param step - Step description
   * @returns Material icon name
   */
  getStepIcon(step: string): string {
    if (step.toLowerCase().includes('email')) return 'email';
    if (step.toLowerCase().includes('track')) return 'local_shipping';
    if (step.toLowerCase().includes('cash') || step.toLowerCase().includes('payment')) return 'payments';
    if (step.toLowerCase().includes('transfer') || step.toLowerCase().includes('receipt')) return 'receipt';
    if (step.toLowerCase().includes('available') || step.toLowerCase().includes('receive')) return 'home';
    return 'check_circle';
  }
}
