import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CartService } from '../../store/cart/cart.service';
import { CartQuery } from '../../store/cart/cart.query';
import { CartItem } from '../../shared/interfaces/cart.interface';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductRecommendationsCarouselComponent } from '../../shared/components/product-recommendations-carousel';
import { Router } from '@angular/router';

/**
 * Comprehensive Checkout Component for Syrian Marketplace
 * 
 * Multi-step checkout process with shipping, payment, and order confirmation
 * Supports Syrian addresses, local payment methods, and Arabic/English localization
 * Features enterprise-ready form validation and error handling
 * 
 * @swagger
 * components:
 *   schemas:
 *     CheckoutComponent:
 *       type: object
 *       description: Complete checkout process management
 *       properties:
 *         currentStep:
 *           type: number
 *           description: Current step in checkout process (0-3)
 *         shippingForm:
 *           $ref: '#/components/schemas/ShippingAddressForm'
 *         paymentForm:
 *           $ref: '#/components/schemas/PaymentMethodForm'
 *         orderSummary:
 *           $ref: '#/components/schemas/OrderSummary'
 */
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatStepperModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    ProductRecommendationsCarouselComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit {
  // Component state using signals
  private readonly currentStepSignal = signal<number>(0);
  private readonly currentLanguageSignal = signal<'en' | 'ar'>('ar');
  private readonly isLinearSignal = signal<boolean>(true);
  private readonly isProcessingOrderSignal = signal<boolean>(false);
  private readonly orderNumberSignal = signal<string>('');

  // Form signals
  private readonly shippingFormSignal = signal<FormGroup>(this.createShippingForm());
  private readonly paymentFormSignal = signal<FormGroup>(this.createPaymentForm());

  // Public readonly signals
  readonly currentStep = this.currentStepSignal.asReadonly();
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();
  readonly isLinear = this.isLinearSignal.asReadonly();
  readonly isProcessingOrder = this.isProcessingOrderSignal.asReadonly();
  readonly orderNumber = this.orderNumberSignal.asReadonly();
  readonly shippingForm = this.shippingFormSignal.asReadonly();
  readonly paymentForm = this.paymentFormSignal.asReadonly();

  // Cart data
  readonly cartItems = computed(() => this.cartQuery.getValue().items);

  // Syrian governorates data
  readonly syrianGovernorates = signal([
    { value: 'damascus', nameEn: 'Damascus', nameAr: 'دمشق' },
    { value: 'aleppo', nameEn: 'Aleppo', nameAr: 'حلب' },
    { value: 'homs', nameEn: 'Homs', nameAr: 'حمص' },
    { value: 'hama', nameEn: 'Hama', nameAr: 'حماة' },
    { value: 'latakia', nameEn: 'Latakia', nameAr: 'اللاذقية' },
    { value: 'tartous', nameEn: 'Tartous', nameAr: 'طرطوس' },
    { value: 'daraa', nameEn: 'Daraa', nameAr: 'درعا' },
    { value: 'deir_ez_zor', nameEn: 'Deir ez-Zor', nameAr: 'دير الزور' },
    { value: 'al_hasakah', nameEn: 'Al-Hasakah', nameAr: 'الحسكة' },
    { value: 'raqqa', nameEn: 'Raqqa', nameAr: 'الرقة' },
    { value: 'idlib', nameEn: 'Idlib', nameAr: 'إدلب' },
    { value: 'as_suwayda', nameEn: 'As-Suwayda', nameAr: 'السويداء' },
    { value: 'quneitra', nameEn: 'Quneitra', nameAr: 'القنيطرة' },
    { value: 'damascus_countryside', nameEn: 'Damascus Countryside', nameAr: 'ريف دمشق' }
  ]);

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private cartQuery: CartQuery,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  /**
   * Component initialization
   * Sets up forms and loads initial data
   */
  ngOnInit(): void {
    this.initializeForms();
    this.loadUserPreferences();
  }

  /**
   * Initialize reactive forms with validation
   */
  private initializeForms(): void {
    this.shippingFormSignal.set(this.createShippingForm());
    this.paymentFormSignal.set(this.createPaymentForm());
  }

  /**
   * Create shipping form with Syrian-specific fields and validation
   */
  private createShippingForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]{10,15}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      governorate: ['', Validators.required],
      city: ['', [Validators.required, Validators.minLength(2)]],
      postalCode: [''],
      specialInstructions: ['']
    });
  }

  /**
   * Create payment form with local payment methods
   */
  private createPaymentForm(): FormGroup {
    return this.fb.group({
      paymentMethod: ['cod', Validators.required]
    });
  }

  /**
   * Load user preferences and language settings
   */
  private loadUserPreferences(): void {
    // In a real app, this would load from a user service
    const savedLang = localStorage.getItem('preferred-language') || 'ar';
    this.currentLanguageSignal.set(savedLang as 'en' | 'ar');
  }

  /**
   * Handle stepper step changes
   */
  onStepChange(event: any): void {
    this.currentStepSignal.set(event.selectedIndex);
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    const currentIndex = this.currentStepSignal();
    if (currentIndex < 3) {
      this.currentStepSignal.set(currentIndex + 1);
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    const currentIndex = this.currentStepSignal();
    if (currentIndex > 0) {
      this.currentStepSignal.set(currentIndex - 1);
    }
  }

  /**
   * Go to specific step
   */
  goToStep(stepIndex: number): void {
    this.currentStepSignal.set(stepIndex);
  }

  /**
   * Get progress percentage for progress bar
   */
  getProgressPercentage(): number {
    return ((this.currentStepSignal() + 1) / 4) * 100;
  }

  /**
   * Calculate subtotal
   */
  getSubtotal(): number {
    return this.cartItems().reduce((total: number, item: CartItem) => total + (item.product.price.amount * item.quantity), 0);
  }

  /**
   * Calculate shipping cost based on location
   */
  getShippingCost(): number {
    const governorate = this.shippingForm().get('governorate')?.value;
    // Different shipping costs for different governorates
    const shippingRates = {
      'damascus': 5000,
      'damascus_countryside': 7500,
      'aleppo': 10000,
      'homs': 8000,
      'hama': 8500,
      'latakia': 12000,
      'tartous': 12000
    };
    return shippingRates[governorate as keyof typeof shippingRates] || 15000;
  }

  /**
   * Calculate tax amount (VAT)
   */
  getTaxAmount(): number {
    const subtotal = this.getSubtotal();
    const taxRate = 0.11; // 11% VAT in Syria
    return subtotal * taxRate;
  }

  /**
   * Calculate final total
   */
  getTotal(): number {
    return this.getSubtotal() + this.getShippingCost() + this.getTaxAmount();
  }

  /**
   * Format currency in Syrian Pounds
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get governorate label in current language
   */
  getGovernorateLabel(value: string): string {
    const governorate = this.syrianGovernorates().find(g => g.value === value);
    if (!governorate) return value;
    return this.currentLanguage() === 'ar' ? governorate.nameAr : governorate.nameEn;
  }

  /**
   * Get payment method label
   */
  getPaymentMethodLabel(): string {
    const method = this.paymentForm().get('paymentMethod')?.value;
    const labels = {
      'ar': {
        'cod': 'الدفع عند الاستلام',
        'bank_transfer': 'تحويل بنكي',
        'mobile_payment': 'دفع عبر الهاتف'
      },
      'en': {
        'cod': 'Cash on Delivery',
        'bank_transfer': 'Bank Transfer',
        'mobile_payment': 'Mobile Payment'
      }
    };
    return labels[this.currentLanguage()][method as keyof typeof labels['en']] || method;
  }

  /**
   * Get payment method description
   */
  getPaymentMethodDescription(): string {
    const method = this.paymentForm().get('paymentMethod')?.value;
    const descriptions = {
      'ar': {
        'cod': 'ادفع نقداً عند وصول طلبك',
        'bank_transfer': 'حول المبلغ إلى حسابنا البنكي',
        'mobile_payment': 'ادفع عبر تطبيق البنك المحمول'
      },
      'en': {
        'cod': 'Pay cash when your order arrives',
        'bank_transfer': 'Transfer amount to our bank account',
        'mobile_payment': 'Pay via mobile banking app'
      }
    };
    return descriptions[this.currentLanguage()][method as keyof typeof descriptions['en']] || '';
  }

  /**
   * Confirm and process the order
   */
  confirmOrder(): void {
    this.isProcessingOrderSignal.set(true);
    
    // Generate order number
    const orderNum = 'SYR-' + Date.now().toString().slice(-8);
    
    // Simulate API call
    setTimeout(() => {
      this.orderNumberSignal.set(orderNum);
      this.isProcessingOrderSignal.set(false);
      this.nextStep(); // Go to confirmation step
      
      // Clear cart after successful order
      this.cartService.clearCart();
      
      // Show success message
      const message = this.currentLanguage() === 'ar' 
        ? 'تم تأكيد طلبك بنجاح!' 
        : 'Your order has been confirmed successfully!';
      
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });

    }, 3000);
  }

  /**
   * Handles product click from last-chance recommendations
   * Navigates to product detail page
   *
   * @param product - Product that was clicked
   */
  onLastChanceProductClick(product: Product): void {
    this.router.navigate(['/product', product.slug]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Handles add to cart from last-chance recommendations
   * Adds product to cart during checkout process
   *
   * @param product - Product to add to cart
   */
  onLastChanceAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);

    const message = this.currentLanguage() === 'ar'
      ? `تمت إضافة ${product.nameArabic || product.name} إلى السلة`
      : `Added ${product.name} to cart`;

    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Gets the first product ID from cart for recommendation purposes
   * Used as seed for recommendation algorithms
   *
   * @returns First cart item product ID or empty string
   */
  getFirstCartProductId(): string {
    const items = this.cartItems();
    return items && items.length > 0 ? items[0].product.id : '';
  }
}