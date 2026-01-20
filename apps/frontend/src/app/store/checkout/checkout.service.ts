import { Injectable, inject } from '@angular/core';
import { CheckoutStore } from './checkout.store';
import { CheckoutQuery } from './checkout.query';
import { CartQuery } from '../cart/cart.query';
import {
  ShippingAddress,
  PaymentMethod,
  CheckoutStep,
  OrderConfirmation,
  SHIPPING_COSTS,
  DELIVERY_TIMES,
  CheckoutValidationError
} from '../../shared/interfaces/checkout.interface';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

/**
 * Checkout Service
 *
 * Business logic for checkout operations.
 * Handles multi-step checkout flow, validation, and order placement.
 *
 * Features:
 * - Step navigation and validation
 * - Shipping address management
 * - Payment method selection
 * - Shipping cost calculation based on Syrian governorates
 * - Estimated delivery date calculation
 * - Order placement and confirmation
 * - State persistence
 *
 * @swagger
 * components:
 *   schemas:
 *     CheckoutService:
 *       type: object
 *       description: Checkout business logic service
 *       methods:
 *         - setShippingAddress
 *         - setPaymentMethod
 *         - goToNextStep
 *         - goToPreviousStep
 *         - placeOrder
 *
 * @example
 * // In component
 * constructor(private checkoutService: CheckoutService) {}
 *
 * // Set shipping address
 * this.checkoutService.setShippingAddress(address);
 *
 * // Navigate to next step
 * this.checkoutService.goToNextStep();
 *
 * // Place order
 * this.checkoutService.placeOrder().subscribe(confirmation => {
 *   console.log('Order placed:', confirmation.orderNumber);
 * });
 */
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private store = inject(CheckoutStore);
  private query = inject(CheckoutQuery);
  private cartQuery = inject(CartQuery);

  /** Expose checkout observables for components */
  checkout$ = this.query.checkout$;
  currentStep$ = this.query.currentStep$;
  shippingAddress$ = this.query.shippingAddress$;
  paymentMethod$ = this.query.paymentMethod$;
  isProcessing$ = this.query.isProcessing$;
  validationErrors$ = this.query.validationErrors$;

  /**
   * Set Shipping Address
   *
   * Updates shipping address and calculates shipping cost based on governorate zone.
   * Also estimates delivery date based on shipping zone.
   *
   * @param address - Complete shipping address
   */
  setShippingAddress(address: ShippingAddress): void {
    // Calculate shipping cost based on zone
    const shippingCost = SHIPPING_COSTS[address.shippingZone] || SHIPPING_COSTS[3];

    // Calculate estimated delivery
    const deliveryDays = DELIVERY_TIMES[address.shippingZone] || DELIVERY_TIMES[3];
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Update store
    this.store.update({
      shippingAddress: address,
      shippingCost,
      estimatedDelivery,
      lastUpdated: new Date()
    });

    // Save to storage
    this.store.saveToStorage();

    // Mark shipping step as complete
    this.markStepComplete(CheckoutStep.SHIPPING);
  }

  /**
   * Set Billing Address
   *
   * Updates billing address if different from shipping.
   *
   * @param address - Billing address
   */
  setBillingAddress(address: ShippingAddress): void {
    this.store.update({
      billingAddress: address,
      useSameAddress: false,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();
  }

  /**
   * Toggle Same Address
   *
   * Sets whether billing address is same as shipping.
   *
   * @param useSame - Whether to use same address
   */
  setUseSameAddress(useSame: boolean): void {
    this.store.update({
      useSameAddress: useSame,
      billingAddress: useSame ? null : this.query.getValue().billingAddress,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();
  }

  /**
   * Set Payment Method
   *
   * Updates selected payment method.
   *
   * @param method - Selected payment method
   */
  setPaymentMethod(method: PaymentMethod): void {
    this.store.update({
      paymentMethod: method,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();

    // Mark payment step as complete
    this.markStepComplete(CheckoutStep.PAYMENT);
  }

  /**
   * Set Order Notes
   *
   * Updates customer order notes.
   *
   * @param notes - Order notes
   */
  setOrderNotes(notes: string): void {
    this.store.update({
      orderNotes: notes,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();
  }

  /**
   * Set Special Instructions
   *
   * Updates delivery special instructions.
   *
   * @param instructions - Special instructions
   */
  setSpecialInstructions(instructions: string): void {
    this.store.update({
      specialInstructions: instructions,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();
  }

  /**
   * Set Terms Agreement
   *
   * Updates terms and conditions agreement status.
   *
   * @param agreed - Whether customer agreed to terms
   */
  setAgreedToTerms(agreed: boolean): void {
    this.store.update({
      agreedToTerms: agreed,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();
  }

  /**
   * Set Newsletter Subscription
   *
   * Updates newsletter subscription preference.
   *
   * @param subscribed - Whether customer wants newsletter
   */
  setNewsletterSubscription(subscribed: boolean): void {
    this.store.update({
      subscribedToNewsletter: subscribed,
      lastUpdated: new Date()
    });
    this.store.saveToStorage();
  }

  /**
   * Go to Next Step
   *
   * Validates current step and navigates to next step if valid.
   *
   * @returns True if navigation successful, false otherwise
   */
  goToNextStep(): boolean {
    const currentStep = this.query.getValue().currentStep;
    const isValid = this.validateCurrentStep();

    if (!isValid) {
      return false;
    }

    if (currentStep < 2) {
      this.store.update({
        currentStep: currentStep + 1,
        lastUpdated: new Date()
      });
      this.store.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Go to Previous Step
   *
   * Navigates to previous step without validation.
   */
  goToPreviousStep(): void {
    const currentStep = this.query.getValue().currentStep;
    if (currentStep > 0) {
      this.store.update({
        currentStep: currentStep - 1,
        lastUpdated: new Date()
      });
      this.store.saveToStorage();
    }
  }

  /**
   * Go to Specific Step
   *
   * Navigates directly to specified step.
   * Only allows navigation to completed steps or next step.
   *
   * @param step - Target step index
   */
  goToStep(step: number): void {
    const checkout = this.query.getValue();
    const maxAllowedStep = Math.max(...checkout.completedSteps, 0) + 1;

    if (step <= maxAllowedStep && step >= 0 && step <= 2) {
      this.store.update({
        currentStep: step,
        lastUpdated: new Date()
      });
      this.store.saveToStorage();
    }
  }

  /**
   * Mark Step as Complete
   *
   * Adds step to completed steps array.
   *
   * @param step - Step to mark complete
   */
  private markStepComplete(step: CheckoutStep): void {
    const completedSteps = this.query.getValue().completedSteps;
    if (!completedSteps.includes(step)) {
      this.store.update({
        completedSteps: [...completedSteps, step]
      });
    }
  }

  /**
   * Validate Current Step
   *
   * Validates current step fields and updates validation errors.
   *
   * @returns True if step is valid, false otherwise
   */
  private validateCurrentStep(): boolean {
    const checkout = this.query.getValue();
    const errors: CheckoutValidationError[] = [];

    switch (checkout.currentStep) {
      case CheckoutStep.SHIPPING:
        if (!checkout.shippingAddress) {
          errors.push({
            field: 'shippingAddress',
            type: 'required',
            message: 'Shipping address is required',
            messageAr: 'عنوان الشحن مطلوب',
            step: CheckoutStep.SHIPPING
          });
        } else {
          const addr = checkout.shippingAddress;
          if (!addr.firstName) errors.push({ field: 'firstName', type: 'required', message: 'First name is required', messageAr: 'الاسم الأول مطلوب', step: CheckoutStep.SHIPPING });
          if (!addr.lastName) errors.push({ field: 'lastName', type: 'required', message: 'Last name is required', messageAr: 'اسم العائلة مطلوب', step: CheckoutStep.SHIPPING });
          if (!addr.email) errors.push({ field: 'email', type: 'required', message: 'Email is required', messageAr: 'البريد الإلكتروني مطلوب', step: CheckoutStep.SHIPPING });
          if (!addr.phone) errors.push({ field: 'phone', type: 'required', message: 'Phone is required', messageAr: 'رقم الهاتف مطلوب', step: CheckoutStep.SHIPPING });
          if (!addr.address) errors.push({ field: 'address', type: 'required', message: 'Address is required', messageAr: 'العنوان مطلوب', step: CheckoutStep.SHIPPING });
          if (!addr.governorate) errors.push({ field: 'governorate', type: 'required', message: 'Governorate is required', messageAr: 'المحافظة مطلوبة', step: CheckoutStep.SHIPPING });
          if (!addr.city) errors.push({ field: 'city', type: 'required', message: 'City is required', messageAr: 'المدينة مطلوبة', step: CheckoutStep.SHIPPING });
        }
        break;

      case CheckoutStep.PAYMENT:
        if (!checkout.paymentMethod || !checkout.paymentMethod.id) {
          errors.push({
            field: 'paymentMethod',
            type: 'required',
            message: 'Payment method is required',
            messageAr: 'طريقة الدفع مطلوبة',
            step: CheckoutStep.PAYMENT
          });
        }
        break;

      case CheckoutStep.REVIEW:
        if (!checkout.agreedToTerms) {
          errors.push({
            field: 'agreedToTerms',
            type: 'required',
            message: 'You must agree to terms and conditions',
            messageAr: 'يجب الموافقة على الشروط والأحكام',
            step: CheckoutStep.REVIEW
          });
        }
        break;
    }

    this.store.update({ validationErrors: errors });
    return errors.length === 0;
  }

  /**
   * Place Order
   *
   * Submits order for processing.
   * Validates all steps, creates order, and returns confirmation.
   *
   * @returns Observable of order confirmation
   */
  placeOrder(): Observable<OrderConfirmation> {
    const checkout = this.query.getValue();
    const cart = this.cartQuery.getValue();

    // Final validation
    if (!this.validateAllSteps()) {
      throw new Error('Checkout validation failed');
    }

    // Set processing state
    this.store.update({ isProcessing: true });

    // Generate order number
    const orderNumber = 'SYR-' + Date.now().toString().slice(-8);

    // Simulate API call with delay
    return of({
      orderNumber,
      orderId: 'order_' + Date.now(),
      status: 'confirmed' as const,
      total: cart.totals.total + checkout.shippingCost,
      currency: 'SYP',
      orderDate: new Date(),
      estimatedDelivery: checkout.estimatedDelivery || new Date(),
      trackingNumber: 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      paymentInstructions: this.getPaymentInstructions(checkout.paymentMethod),
      customerEmail: checkout.shippingAddress?.email || '',
      nextSteps: this.getNextSteps(checkout.paymentMethod.type)
    }).pipe(
      delay(2000), // Simulate network delay
      map(confirmation => {
        // Update processing state
        this.store.update({ isProcessing: false });
        // Clear checkout after successful order
        // (Note: Don't clear here, let confirmation component handle it)
        return confirmation;
      })
    );
  }

  /**
   * Validate All Steps
   *
   * Validates all checkout steps.
   *
   * @returns True if all steps valid, false otherwise
   */
  private validateAllSteps(): boolean {
    const checkout = this.query.getValue();

    // Validate shipping
    if (!checkout.shippingAddress?.firstName || !checkout.shippingAddress?.governorate) {
      return false;
    }

    // Validate payment
    if (!checkout.paymentMethod?.id) {
      return false;
    }

    // Validate terms
    if (!checkout.agreedToTerms) {
      return false;
    }

    return true;
  }

  /**
   * Get Payment Instructions
   *
   * Returns payment-specific instructions based on method.
   *
   * @param method - Payment method
   * @returns Payment instructions text
   */
  private getPaymentInstructions(method: PaymentMethod): string {
    switch (method.type) {
      case 'cod':
        return 'Please have exact change ready when the delivery arrives. Our driver will collect payment in cash.';
      case 'bank_transfer':
        return 'Please transfer the amount to our bank account. Order will be shipped once payment is confirmed.';
      case 'mobile_wallet':
        return `Please send payment to our ${method.name} number. Order will be processed once payment is received.`;
      default:
        return 'Payment instructions will be sent via email.';
    }
  }

  /**
   * Get Next Steps
   *
   * Returns customer next steps based on payment method.
   *
   * @param paymentType - Payment method type
   * @returns Array of next step descriptions
   */
  private getNextSteps(paymentType: string): string[] {
    const baseSteps = [
      'You will receive an order confirmation email shortly',
      'Track your order status in your account dashboard'
    ];

    switch (paymentType) {
      case 'cod':
        return [
          ...baseSteps,
          'Prepare exact change for cash payment on delivery',
          'Ensure someone is available to receive the package'
        ];
      case 'bank_transfer':
        return [
          'Complete the bank transfer within 24 hours',
          'Send payment receipt to orders@souqsyria.com',
          ...baseSteps
        ];
      case 'mobile_wallet':
        return [
          'Complete the mobile payment within 24 hours',
          'Send payment screenshot to orders@souqsyria.com',
          ...baseSteps
        ];
      default:
        return baseSteps;
    }
  }

  /**
   * Clear Checkout
   *
   * Resets checkout state and clears storage.
   * Called after successful order or when abandoning checkout.
   */
  clearCheckout(): void {
    this.store.clearCheckout();
  }

  /**
   * Get Order Summary
   *
   * Calculates and returns complete order summary for review.
   *
   * @returns Order summary object
   */
  getOrderSummary() {
    const checkout = this.query.getValue();
    const cart = this.cartQuery.getValue();

    return {
      itemsCount: cart.totals.itemCount,
      subtotal: cart.totals.subtotal,
      shipping: checkout.shippingCost,
      discount: cart.totals.discount,
      total: cart.totals.total + checkout.shippingCost,
      currency: 'SYP',
      couponCode: cart.appliedCoupon?.code,
      estimatedDelivery: checkout.estimatedDelivery,
      shippingMethod: 'Standard Delivery',
      paymentMethod: checkout.paymentMethod.name
    };
  }
}
