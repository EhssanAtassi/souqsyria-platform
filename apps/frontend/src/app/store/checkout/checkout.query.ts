import { Query } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { CheckoutStore } from './checkout.store';
import { Checkout, CheckoutStep } from '../../shared/interfaces/checkout.interface';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * Checkout Query Service
 *
 * Provides reactive queries and computed observables for checkout state.
 * All checkout data access should go through this query service.
 *
 * Features:
 * - Reactive checkout observables
 * - Computed step completion status
 * - Shipping cost calculation
 * - Estimated delivery date computation
 * - Validation state queries
 *
 * @swagger
 * components:
 *   schemas:
 *     CheckoutQuery:
 *       type: object
 *       description: Checkout state query service
 *       properties:
 *         currentStep$:
 *           type: observable
 *           description: Current checkout step observable
 *         isStepComplete$:
 *           type: observable
 *           description: Step completion status observable
 *
 * @example
 * // In component
 * constructor(private checkoutQuery: CheckoutQuery) {}
 *
 * ngOnInit() {
 *   // Subscribe to current step
 *   this.checkoutQuery.currentStep$.subscribe(step => {
 *     console.log('Current step:', step);
 *   });
 *
 *   // Check if shipping step is complete
 *   this.checkoutQuery.isStepComplete$(CheckoutStep.SHIPPING).subscribe(isComplete => {
 *     console.log('Shipping complete:', isComplete);
 *   });
 * }
 */
@Injectable({ providedIn: 'root' })
export class CheckoutQuery extends Query<Checkout> {

  /** Observable of complete checkout state */
  checkout$ = this.select();

  /** Observable of current step */
  currentStep$ = this.select(state => state.currentStep);

  /** Observable of shipping address */
  shippingAddress$ = this.select(state => state.shippingAddress);

  /** Observable of payment method */
  paymentMethod$ = this.select(state => state.paymentMethod);

  /** Observable of order notes */
  orderNotes$ = this.select(state => state.orderNotes);

  /** Observable of shipping cost */
  shippingCost$ = this.select(state => state.shippingCost);

  /** Observable of estimated delivery date */
  estimatedDelivery$ = this.select(state => state.estimatedDelivery);

  /** Observable of validation errors */
  validationErrors$ = this.select(state => state.validationErrors);

  /** Observable of processing state */
  isProcessing$ = this.select(state => state.isProcessing);

  /** Observable of terms agreement */
  agreedToTerms$ = this.select(state => state.agreedToTerms);

  /**
   * Check if Shipping Step is Complete
   * Returns true if shipping address is filled
   */
  isShippingComplete$ = this.shippingAddress$.pipe(
    map(address => {
      if (!address) return false;
      return !!(
        address.firstName &&
        address.lastName &&
        address.email &&
        address.phone &&
        address.address &&
        address.governorate &&
        address.city
      );
    })
  );

  /**
   * Check if Payment Step is Complete
   * Returns true if payment method is selected
   */
  isPaymentComplete$ = this.paymentMethod$.pipe(
    map(method => !!method && !!method.id)
  );

  /**
   * Check if Ready for Order Placement
   * Returns true if all required steps are complete
   */
  isReadyToPlaceOrder$ = this.select().pipe(
    map(state => {
      const hasShipping = !!(state.shippingAddress?.firstName && state.shippingAddress?.governorate);
      const hasPayment = !!state.paymentMethod?.id;
      const agreedToTerms = state.agreedToTerms;
      return hasShipping && hasPayment && agreedToTerms;
    })
  );

  /**
   * Get Validation Errors for Specific Step
   *
   * @param step - Checkout step to get errors for
   * @returns Observable of validation errors for the step
   */
  getStepErrors$(step: CheckoutStep): Observable<any[]> {
    return this.validationErrors$.pipe(
      map(errors => errors.filter(error => error.step === step))
    );
  }

  /**
   * Check if Specific Step is Complete
   *
   * @param step - Checkout step to check
   * @returns Observable of boolean indicating completion
   */
  isStepComplete$(step: CheckoutStep): Observable<boolean> {
    return this.select(state => state.completedSteps).pipe(
      map(completedSteps => completedSteps.includes(step))
    );
  }

  /**
   * Get Progress Percentage
   *
   * Calculates checkout completion percentage
   * @returns Observable of progress percentage (0-100)
   */
  getProgressPercentage$(): Observable<number> {
    return this.currentStep$.pipe(
      map(step => ((step + 1) / 3) * 100)
    );
  }

  /**
   * Check if Can Proceed to Next Step
   *
   * @returns Observable of boolean indicating if can proceed
   */
  canProceedToNextStep$(): Observable<boolean> {
    return this.select().pipe(
      map(state => {
        switch (state.currentStep) {
          case CheckoutStep.SHIPPING:
            return !!(state.shippingAddress?.firstName && state.shippingAddress?.governorate);
          case CheckoutStep.PAYMENT:
            return !!state.paymentMethod?.id;
          case CheckoutStep.REVIEW:
            return state.agreedToTerms;
          default:
            return false;
        }
      })
    );
  }

  constructor(protected override store: CheckoutStore) {
    super(store);
  }

  /**
   * Get Current Checkout State (Synchronous)
   *
   * @returns Current checkout state
   */
  getCurrentCheckout(): Checkout {
    return this.getValue();
  }

  /**
   * Get Shipping Address (Synchronous)
   *
   * @returns Current shipping address or null
   */
  getShippingAddress() {
    return this.getValue().shippingAddress;
  }

  /**
   * Get Payment Method (Synchronous)
   *
   * @returns Current payment method
   */
  getPaymentMethod() {
    return this.getValue().paymentMethod;
  }
}
