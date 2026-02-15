import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';

import { CartService } from '../../store/cart/cart.service';
import { CartQuery } from '../../store/cart/cart.query';
import { CartItem } from '../../shared/interfaces/cart.interface';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductRecommendationsCarouselComponent } from '../../shared/components/product-recommendations-carousel';
import { Router } from '@angular/router';
import { AddressApiService } from '../account/addresses/services/address-api.service';
import { AddressResponse } from '../account/addresses/interfaces/address.interface';
import { AddressFormComponent } from '../account/addresses/components/address-form/address-form.component';
import { LanguageService } from '../../shared/services/language.service';

/**
 * @description Comprehensive Checkout Component for Syrian Marketplace
 *
 * Multi-step checkout process with shipping, payment, and order confirmation.
 * Integrates with the address management system for saved address selection
 * and new address creation via the reusable AddressFormComponent.
 * Supports Syrian addresses, local payment methods, and Arabic/English localization.
 *
 * @swagger
 * components:
 *   schemas:
 *     CheckoutComponent:
 *       type: object
 *       description: Complete checkout process management with address integration
 *       properties:
 *         currentStep:
 *           type: number
 *           description: Current step in checkout process (0-3)
 *         selectedAddressId:
 *           type: number
 *           nullable: true
 *           description: ID of the selected saved address for shipping
 *         showAddressForm:
 *           type: boolean
 *           description: Whether the new address form is visible
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
    TranslateModule,
    ProductRecommendationsCarouselComponent,
    AddressFormComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit {
  /** @description Address API service for loading and managing saved addresses */
  private readonly addressService = inject(AddressApiService);

  /** @description Language service for bilingual support */
  private readonly languageService = inject(LanguageService);

  // Component state using signals
  private readonly currentStepSignal = signal<number>(0);
  private readonly isLinearSignal = signal<boolean>(true);
  private readonly isProcessingOrderSignal = signal<boolean>(false);
  private readonly orderNumberSignal = signal<string>('');

  /** @description Signal: ID of the selected saved address for shipping */
  readonly selectedAddressId = signal<number | null>(null);

  /** @description Signal: Whether to show the inline address creation form */
  readonly showAddressForm = signal<boolean>(false);

  /** @description Signal: Whether saved addresses are being loaded */
  readonly addressesLoading = this.addressService.isLoading;

  // Form signals
  private readonly paymentFormSignal = signal<FormGroup>(this.createPaymentForm());

  // Public readonly signals
  /** @description Current checkout step index (0-3) */
  readonly currentStep = this.currentStepSignal.asReadonly();

  /** @description Current language from LanguageService */
  readonly currentLanguage = this.languageService.language;

  /** @description Whether stepper enforces linear progression */
  readonly isLinear = this.isLinearSignal.asReadonly();

  /** @description Whether an order is currently being processed */
  readonly isProcessingOrder = this.isProcessingOrderSignal.asReadonly();

  /** @description Confirmed order number after successful placement */
  readonly orderNumber = this.orderNumberSignal.asReadonly();

  /** @description Payment method form group */
  readonly paymentForm = this.paymentFormSignal.asReadonly();

  /** @description List of saved user addresses from AddressApiService */
  readonly savedAddresses = this.addressService.addresses;

  /** @description Cart items from cart state */
  readonly cartItems = computed(() => this.cartQuery.getValue().items);

  /**
   * @description Computed: The currently selected address object for display in review step
   * Resolves the selectedAddressId to a full AddressResponse
   */
  readonly selectedAddress = computed<AddressResponse | null>(() => {
    const id = this.selectedAddressId();
    if (!id) return null;
    return this.savedAddresses().find(a => a.id === id) ?? null;
  });

  /**
   * @description Computed: Whether the shipping step is valid
   * True when a saved address is selected (and form is hidden)
   */
  readonly isShippingValid = computed<boolean>(() => {
    return this.selectedAddressId() !== null && !this.showAddressForm();
  });

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private cartQuery: CartQuery,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  /**
   * @description Component initialization
   * Loads saved addresses and sets up payment form
   */
  ngOnInit(): void {
    this.addressService.loadAddresses();
    this.paymentFormSignal.set(this.createPaymentForm());
    this.autoSelectDefaultAddress();
  }

  /**
   * @description Auto-select the user's default address if one exists
   * Called after addresses are loaded
   */
  private autoSelectDefaultAddress(): void {
    // Use a simple setTimeout to wait for addresses to load
    // In production, this would use an effect() or subscription
    setTimeout(() => {
      const addresses = this.savedAddresses();
      if (addresses.length > 0) {
        const defaultAddr = addresses.find(a => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId.set(defaultAddr.id);
        } else {
          this.selectedAddressId.set(addresses[0].id);
        }
      }
    }, 1000);
  }

  /**
   * @description Create payment form with local Syrian payment methods
   * @returns FormGroup with paymentMethod control defaulting to 'cod'
   */
  private createPaymentForm(): FormGroup {
    return this.fb.group({
      paymentMethod: ['cod', Validators.required]
    });
  }

  /**
   * @description Handle saved address selection from radio buttons
   * Hides the new address form when a saved address is selected
   * @param addressId - ID of the selected saved address
   */
  onSelectAddress(addressId: number): void {
    this.selectedAddressId.set(addressId);
    this.showAddressForm.set(false);
  }

  /**
   * @description Show the inline address creation form
   * Deselects any currently selected saved address
   */
  onAddNewAddress(): void {
    this.selectedAddressId.set(null);
    this.showAddressForm.set(true);
  }

  /**
   * @description Handle successful address form save
   * Reloads addresses, hides form, and auto-selects the newest address
   */
  onAddressFormSaved(): void {
    this.showAddressForm.set(false);
    this.addressService.loadAddresses();

    // Auto-select the newest address after a brief delay for the API to respond
    setTimeout(() => {
      const addresses = this.savedAddresses();
      if (addresses.length > 0) {
        // Select the last address (most recently created)
        this.selectedAddressId.set(addresses[addresses.length - 1].id);
      }
    }, 1000);

    const message = this.currentLanguage() === 'ar'
      ? 'تمت إضافة العنوان بنجاح'
      : 'Address added successfully';
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * @description Handle address form cancellation
   * Hides the form and re-selects the default address if available
   */
  onAddressFormCancelled(): void {
    this.showAddressForm.set(false);
    // Re-select default or first address if available
    const addresses = this.savedAddresses();
    if (addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.isDefault);
      this.selectedAddressId.set(defaultAddr?.id ?? addresses[0].id);
    }
  }

  /**
   * @description Handle stepper step change events
   * @param event - Material stepper selection change event
   */
  onStepChange(event: any): void {
    this.currentStepSignal.set(event.selectedIndex);
  }

  /**
   * @description Navigate to the next step in the checkout process
   */
  nextStep(): void {
    const currentIndex = this.currentStepSignal();
    if (currentIndex < 3) {
      this.currentStepSignal.set(currentIndex + 1);
    }
  }

  /**
   * @description Navigate to the previous step in the checkout process
   */
  previousStep(): void {
    const currentIndex = this.currentStepSignal();
    if (currentIndex > 0) {
      this.currentStepSignal.set(currentIndex - 1);
    }
  }

  /**
   * @description Jump to a specific step in the checkout stepper
   * @param stepIndex - Zero-based index of the target step
   */
  goToStep(stepIndex: number): void {
    this.currentStepSignal.set(stepIndex);
  }

  /**
   * @description Calculate progress percentage for the visual progress bar
   * @returns Percentage (0-100) representing checkout progress
   */
  getProgressPercentage(): number {
    return ((this.currentStepSignal() + 1) / 4) * 100;
  }

  /**
   * @description Calculate cart subtotal from all cart items
   * @returns Subtotal amount in SYP
   */
  getSubtotal(): number {
    return this.cartItems().reduce((total: number, item: CartItem) => total + (item.product.price.amount * item.quantity), 0);
  }

  /**
   * @description Calculate shipping cost based on selected address governorate
   * Uses governorate code to determine regional shipping rates
   * @returns Shipping cost in SYP
   */
  getShippingCost(): number {
    const address = this.selectedAddress();
    const governorateCode = address?.governorate?.code ?? '';
    // Different shipping costs for different governorates
    const shippingRates: Record<string, number> = {
      'DAM': 5000,
      'RIF': 7500,
      'ALE': 10000,
      'HOM': 8000,
      'HAM': 8500,
      'LAT': 12000,
      'TAR': 12000
    };
    return shippingRates[governorateCode] || 15000;
  }

  /**
   * @description Calculate tax amount (11% Syrian VAT)
   * @returns Tax amount in SYP
   */
  getTaxAmount(): number {
    const subtotal = this.getSubtotal();
    const taxRate = 0.11; // 11% VAT in Syria
    return subtotal * taxRate;
  }

  /**
   * @description Calculate final order total including subtotal, shipping, and tax
   * @returns Total amount in SYP
   */
  getTotal(): number {
    return this.getSubtotal() + this.getShippingCost() + this.getTaxAmount();
  }

  /**
   * @description Format a numeric amount as Syrian Pounds currency string
   * @param amount - Numeric amount to format
   * @returns Formatted currency string (e.g., "٥٬٠٠٠ ل.س")
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
   * @description Get the display name for the selected address's governorate
   * Resolves to the correct language based on current locale
   * @returns Governorate name in the current language, or empty string
   */
  getSelectedGovernorateLabel(): string {
    const address = this.selectedAddress();
    if (!address?.governorate) return '';
    return this.currentLanguage() === 'ar'
      ? address.governorate.nameAr
      : address.governorate.nameEn;
  }

  /**
   * @description Get the full formatted address string for a given AddressResponse
   * Includes governorate, city, district, and street in the current language
   * @param address - Address response object to format
   * @returns Formatted multi-part address string
   */
  getFormattedAddress(address: AddressResponse): string {
    const lang = this.currentLanguage();
    const parts: string[] = [];

    if (address.governorate) {
      parts.push(lang === 'ar' ? address.governorate.nameAr : address.governorate.nameEn);
    }
    if (address.syrianCity) {
      parts.push(lang === 'ar' ? address.syrianCity.nameAr : address.syrianCity.nameEn);
    }
    if (address.district) {
      parts.push(lang === 'ar' ? address.district.nameAr : address.district.nameEn);
    }
    if (address.addressLine1) {
      parts.push(address.addressLine1);
    }

    return parts.join(' - ');
  }

  /**
   * @description Get the icon name for an address label type
   * @param label - Address label (home, work, family, other)
   * @returns Material icon name string
   */
  getLabelIcon(label?: string): string {
    switch (label) {
      case 'home': return 'home';
      case 'work': return 'business';
      case 'family': return 'people';
      default: return 'location_on';
    }
  }

  /**
   * @description Get the payment method display label in the current language
   * @returns Localized payment method name
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
   * @description Get the payment method description in the current language
   * @returns Localized payment method description
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
   * @description Confirm and process the order
   * Validates that an address is selected, generates an order number,
   * simulates API call, clears cart, and advances to confirmation step
   */
  confirmOrder(): void {
    if (!this.selectedAddress()) {
      const message = this.currentLanguage() === 'ar'
        ? 'يرجى اختيار عنوان الشحن'
        : 'Please select a shipping address';
      this.snackBar.open(message, '', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

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
   * @description Handles product click from last-chance recommendations
   * Navigates to product detail page
   * @param product - Product that was clicked
   */
  onLastChanceProductClick(product: Product): void {
    this.router.navigate(['/product', product.slug]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * @description Handles add to cart from last-chance recommendations
   * Adds product to cart during checkout process
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
   * @description Gets the first product ID from cart for recommendation purposes
   * Used as seed for recommendation algorithms
   * @returns First cart item product ID or empty string
   */
  getFirstCartProductId(): string {
    const items = this.cartItems();
    return items && items.length > 0 ? items[0].product.id : '';
  }
}