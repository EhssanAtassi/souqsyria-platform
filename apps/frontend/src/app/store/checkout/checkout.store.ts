import { Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Checkout, CheckoutStep, ShippingAddress, PaymentMethod } from '../../shared/interfaces/checkout.interface';

/**
 * Checkout Store
 *
 * Manages checkout flow state with multi-step process tracking.
 * Implements Syrian marketplace-specific checkout requirements including
 * governorate-based shipping, cash on delivery, and bilingual support.
 *
 * Features:
 * - Multi-step checkout process (3 steps)
 * - Shipping address management with Syrian governorates
 * - Payment method selection (COD, Bank Transfer, Mobile Wallet)
 * - Order notes and special instructions
 * - Estimated delivery dates
 * - localStorage persistence
 * - Validation state tracking
 *
 * State Structure:
 * - currentStep: Active checkout step (0-2)
 * - shippingAddress: Complete shipping information
 * - paymentMethod: Selected payment option
 * - orderNotes: Customer instructions
 * - estimatedDelivery: Calculated delivery date
 * - validationErrors: Form validation state
 *
 * @swagger
 * components:
 *   schemas:
 *     CheckoutStore:
 *       type: object
 *       description: Checkout process state management
 *       properties:
 *         currentStep:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           $ref: '#/components/schemas/PaymentMethod'
 *
 * @example
 * // Inject in component
 * constructor(private checkoutStore: CheckoutStore) {}
 *
 * // Update shipping address
 * this.checkoutStore.update({ shippingAddress: newAddress });
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'checkout', resettable: true })
export class CheckoutStore extends Store<Checkout> {
  constructor() {
    super({
      id: 'checkout_' + Date.now(),
      currentStep: 0,
      completedSteps: [],
      shippingAddress: null,
      billingAddress: null,
      useSameAddress: true,
      paymentMethod: {
        id: 'cod',
        type: 'cod',
        name: 'Cash on Delivery',
        nameAr: 'الدفع عند الاستلام',
        description: 'Pay when you receive your order',
        descriptionAr: 'ادفع عند استلام طلبك',
        isAvailable: true,
        processingFee: 0
      },
      orderNotes: '',
      specialInstructions: '',
      estimatedDelivery: null,
      shippingCost: 0,
      selectedShippingMethod: 'standard',
      agreedToTerms: false,
      subscribedToNewsletter: false,
      validationErrors: [],
      isProcessing: false,
      lastUpdated: new Date(),
      createdAt: new Date()
    });

    // Load checkout from localStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Load Checkout State from localStorage
   *
   * Attempts to restore previous checkout state from browser storage.
   * Falls back to initial state if storage is unavailable or corrupted.
   * Useful for resuming interrupted checkout sessions.
   */
  private loadFromStorage() {
    const stored = localStorage.getItem('syrian_marketplace_checkout');
    if (stored) {
      try {
        const checkout = JSON.parse(stored);
        // Reset processing state and validation errors on load
        this.update({
          ...checkout,
          isProcessing: false,
          validationErrors: []
        });
      } catch (e) {
        console.error('Failed to load checkout from storage', e);
      }
    }
  }

  /**
   * Save Checkout State to localStorage
   *
   * Persists current checkout state to browser storage.
   * Called automatically after state updates.
   */
  saveToStorage() {
    const checkout = this.getValue();
    localStorage.setItem('syrian_marketplace_checkout', JSON.stringify(checkout));
  }

  /**
   * Clear Checkout State
   *
   * Resets checkout to initial state and removes from storage.
   * Called after successful order completion.
   */
  clearCheckout() {
    this.reset();
    localStorage.removeItem('syrian_marketplace_checkout');
  }
}
