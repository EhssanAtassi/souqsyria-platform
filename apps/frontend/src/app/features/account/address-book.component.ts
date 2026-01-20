import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';

import { UserService } from '../../shared/services/user.service';
import { 
  UserAddress,
  AddressBookConfig,
  AddressFormData,
  AddressType,
  AddressValidationResult
} from '../../shared/interfaces/user.interface';
import { SYRIAN_GOVERNORATES, SyrianGovernorate } from '../../shared/interfaces/category-filter.interface';

/**
 * Address Book Management Component for Syrian Marketplace
 * 
 * Comprehensive address management system with CRUD operations,
 * default address selection, Syrian postal validation, and 
 * bilingual Arabic/English support with RTL layout.
 * 
 * Features:
 * - Multiple address types (home, work, family, pickup_point)
 * - Default shipping/billing address selection
 * - Syrian governorate/city dropdown support
 * - Address validation for Syrian postal system
 * - Quick address selection during checkout
 * - Cultural branding with Damascus gold and Aleppo green
 * - RTL-friendly layout for Arabic content
 * - Integration with user service and order system
 * 
 * @swagger
 * components:
 *   schemas:
 *     AddressBookComponent:
 *       type: object
 *       description: Address book management interface
 *       properties:
 *         addressBookConfig:
 *           $ref: '#/components/schemas/AddressBookConfig'
 *         currentLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 *         selectedAddressId:
 *           type: string
 *           description: Currently selected address ID
 *         showAddressForm:
 *           type: boolean
 *           description: Address form visibility state
 *         editingAddressId:
 *           type: string
 *           description: Address being edited (null for new)
 */
@Component({
  selector: 'app-address-book',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatTabsModule
  ],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressBookComponent implements OnInit {
  // Injected services
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Component state using signals
  private readonly addressBookConfigSignal = signal<AddressBookConfig | null>(null);
  private readonly isLoadingSignal = signal<boolean>(true);
  private readonly currentLanguageSignal = signal<'en' | 'ar'>('ar');
  private readonly selectedAddressIdSignal = signal<string | null>(null);
  private readonly showAddressFormSignal = signal<boolean>(false);
  private readonly editingAddressIdSignal = signal<string | null>(null);
  private readonly isValidatingAddressSignal = signal<boolean>(false);
  private readonly validationResultSignal = signal<AddressValidationResult | null>(null);

  // Public readonly signals for template
  readonly addressBookConfig = this.addressBookConfigSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();
  readonly selectedAddressId = this.selectedAddressIdSignal.asReadonly();
  readonly showAddressForm = this.showAddressFormSignal.asReadonly();
  readonly editingAddressId = this.editingAddressIdSignal.asReadonly();
  readonly isValidatingAddress = this.isValidatingAddressSignal.asReadonly();
  readonly validationResult = this.validationResultSignal.asReadonly();

  // Form instance
  addressForm: FormGroup;

  // Constants for template
  readonly syrianGovernorates = SYRIAN_GOVERNORATES;
  readonly addressTypes: { value: AddressType; labelEn: string; labelAr: string; icon: string }[] = [
    { value: 'home', labelEn: 'Home', labelAr: 'المنزل', icon: 'home' },
    { value: 'work', labelEn: 'Work', labelAr: 'العمل', icon: 'work' },
    { value: 'family', labelEn: 'Family', labelAr: 'العائلة', icon: 'family_restroom' },
    { value: 'pickup_point', labelEn: 'Pickup Point', labelAr: 'نقطة الاستلام', icon: 'local_shipping' },
    { value: 'temporary', labelEn: 'Temporary', labelAr: 'مؤقت', icon: 'schedule' }
  ];

  // Computed properties
  readonly getActiveAddresses = computed(() => {
    const config = this.addressBookConfig();
    return config?.addresses.filter(addr => addr.isActive) || [];
  });

  readonly getDefaultShippingAddress = computed(() => {
    const config = this.addressBookConfig();
    return config?.addresses.find(addr => addr.id === config.defaultShippingId) || null;
  });

  readonly getDefaultBillingAddress = computed(() => {
    const config = this.addressBookConfig();
    return config?.addresses.find(addr => addr.id === config.defaultBillingId) || null;
  });

  readonly getRecentlyUsedAddresses = computed(() => {
    const config = this.addressBookConfig();
    if (!config) return [];
    
    return config.recentlyUsed
      .map(id => config.addresses.find(addr => addr.id === id))
      .filter(addr => addr) as UserAddress[];
  });

  readonly getAddressesByType = computed(() => {
    const addresses = this.getActiveAddresses();
    const grouped: { [key: string]: UserAddress[] } = {};
    
    addresses.forEach(address => {
      if (!grouped[address.type]) {
        grouped[address.type] = [];
      }
      grouped[address.type].push(address);
    });
    
    return grouped;
  });

  readonly getFormTitle = computed(() => {
    const lang = this.currentLanguage();
    const isEditing = this.editingAddressId() !== null;
    
    if (lang === 'ar') {
      return isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد';
    } else {
      return isEditing ? 'Edit Address' : 'Add New Address';
    }
  });

  constructor() {
    this.addressForm = this.createAddressForm();
  }

  /**
   * Component initialization
   * Loads address book data and sets up reactive state
   */
  ngOnInit(): void {
    this.loadAddressBookData();
    this.initializeLanguage();
  }

  /**
   * Load address book configuration from user service
   * Handles loading state and error scenarios
   */
  private loadAddressBookData(): void {
    this.isLoadingSignal.set(true);
    
    this.userService.getAddressBookConfig().subscribe({
      next: (config) => {
        this.addressBookConfigSignal.set(config);
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to load address book data:', error);
        this.isLoadingSignal.set(false);
        this.showErrorMessage('Failed to load addresses');
      }
    });
  }

  /**
   * Initialize language based on user preference
   */
  private initializeLanguage(): void {
    const userLang = this.userService.preferredLanguage();
    this.currentLanguageSignal.set(userLang);
  }

  /**
   * Create reactive address form with validation
   */
  private createAddressForm(): FormGroup {
    return this.formBuilder.group({
      type: ['home', [Validators.required]],
      titleEn: ['', [Validators.required, Validators.maxLength(50)]],
      titleAr: ['', [Validators.maxLength(50)]],
      recipientName: ['', [Validators.required, Validators.maxLength(100)]],
      recipientNameAr: ['', [Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+963[0-9]{8,9}$/)]],
      alternatePhone: ['', [Validators.pattern(/^\+[0-9]{10,15}$/)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(200)]],
      addressLine1Ar: ['', [Validators.maxLength(200)]],
      addressLine2: ['', [Validators.maxLength(200)]],
      addressLine2Ar: ['', [Validators.maxLength(200)]],
      neighborhood: ['', [Validators.maxLength(100)]],
      neighborhoodAr: ['', [Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      cityAr: ['', [Validators.maxLength(50)]],
      governorate: ['', [Validators.required]],
      postalCode: ['', [Validators.pattern(/^[0-9]{4,6}$/)]],
      country: ['Syria', [Validators.required]],
      countryCode: ['SY', [Validators.required]],
      isDefault: [false],
      isDefaultBilling: [false],
      instructions: ['', [Validators.maxLength(500)]],
      instructionsAr: ['', [Validators.maxLength(500)]],
      landmark: ['', [Validators.maxLength(200)]],
      landmarkAr: ['', [Validators.maxLength(200)]]
    });
  }

  /**
   * Show address form for new address
   */
  showNewAddressForm(): void {
    this.editingAddressIdSignal.set(null);
    this.addressForm.reset({
      type: 'home',
      country: 'Syria',
      countryCode: 'SY',
      isDefault: false,
      isDefaultBilling: false
    });
    this.showAddressFormSignal.set(true);
    this.validationResultSignal.set(null);
  }

  /**
   * Show address form for editing existing address
   */
  editAddress(address: UserAddress): void {
    this.editingAddressIdSignal.set(address.id);
    this.populateFormWithAddress(address);
    this.showAddressFormSignal.set(true);
    this.validationResultSignal.set(null);
  }

  /**
   * Populate form with address data for editing
   */
  private populateFormWithAddress(address: UserAddress): void {
    const formData: AddressFormData = {
      type: address.type,
      titleEn: address.titleEn,
      titleAr: address.titleAr,
      recipientName: address.recipientName,
      recipientNameAr: address.recipientNameAr || '',
      phoneNumber: address.phoneNumber,
      alternatePhone: address.alternatePhone || '',
      addressLine1: address.addressLine1,
      addressLine1Ar: address.addressLine1Ar || '',
      addressLine2: address.addressLine2 || '',
      addressLine2Ar: address.addressLine2Ar || '',
      neighborhood: address.neighborhood || '',
      neighborhoodAr: address.neighborhoodAr || '',
      city: address.city,
      cityAr: address.cityAr || '',
      governorate: address.governorate,
      postalCode: address.postalCode || '',
      country: address.country,
      countryCode: address.countryCode,
      isDefault: address.isDefault,
      isDefaultBilling: address.isDefaultBilling,
      instructions: address.instructions || '',
      instructionsAr: address.instructionsAr || '',
      landmark: address.landmark || '',
      landmarkAr: address.landmarkAr || ''
    };

    this.addressForm.patchValue(formData);
  }

  /**
   * Hide address form
   */
  hideAddressForm(): void {
    this.showAddressFormSignal.set(false);
    this.editingAddressIdSignal.set(null);
    this.validationResultSignal.set(null);
  }

  /**
   * Validate address using Syrian postal system
   */
  async validateAddress(): Promise<void> {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isValidatingAddressSignal.set(true);

    try {
      const formData = this.addressForm.value as AddressFormData;
      const result = await this.userService.validateAddress(formData).toPromise();
      this.validationResultSignal.set(result!);

      if (result?.isValid) {
        this.showSuccessMessage('Address validation successful');
      } else {
        this.showWarningMessage('Address validation found issues');
      }
    } catch (error) {
      console.error('Address validation failed:', error);
      this.showErrorMessage('Address validation failed');
    } finally {
      this.isValidatingAddressSignal.set(false);
    }
  }

  /**
   * Save address (create or update)
   */
  async saveAddress(): Promise<void> {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formData = this.addressForm.value as AddressFormData;
    const editingId = this.editingAddressId();

    try {
      if (editingId) {
        await this.userService.updateAddress(editingId, formData).toPromise();
        this.showSuccessMessage('Address updated successfully');
      } else {
        await this.userService.createAddress(formData).toPromise();
        this.showSuccessMessage('Address created successfully');
      }

      this.loadAddressBookData();
      this.hideAddressForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      this.showErrorMessage('Failed to save address');
    }
  }

  /**
   * Delete address with confirmation
   */
  async deleteAddress(address: UserAddress): Promise<void> {
    const lang = this.currentLanguage();
    const message = lang === 'ar' 
      ? 'هل أنت متأكد من حذف هذا العنوان؟'
      : 'Are you sure you want to delete this address?';

    if (!confirm(message)) {
      return;
    }

    try {
      await this.userService.deleteAddress(address.id).toPromise();
      this.showSuccessMessage('Address deleted successfully');
      this.loadAddressBookData();
    } catch (error) {
      console.error('Failed to delete address:', error);
      this.showErrorMessage('Failed to delete address');
    }
  }

  /**
   * Set address as default shipping address
   */
  async setDefaultShipping(address: UserAddress): Promise<void> {
    try {
      await this.userService.setDefaultShippingAddress(address.id).toPromise();
      this.showSuccessMessage('Default shipping address updated');
      this.loadAddressBookData();
    } catch (error) {
      console.error('Failed to set default shipping address:', error);
      this.showErrorMessage('Failed to update default address');
    }
  }

  /**
   * Set address as default billing address
   */
  async setDefaultBilling(address: UserAddress): Promise<void> {
    try {
      await this.userService.setDefaultBillingAddress(address.id).toPromise();
      this.showSuccessMessage('Default billing address updated');
      this.loadAddressBookData();
    } catch (error) {
      console.error('Failed to set default billing address:', error);
      this.showErrorMessage('Failed to update default address');
    }
  }

  /**
   * Toggle address active status
   */
  async toggleAddressStatus(address: UserAddress): Promise<void> {
    try {
      await this.userService.toggleAddressStatus(address.id).toPromise();
      const message = address.isActive ? 'Address deactivated' : 'Address activated';
      this.showSuccessMessage(message);
      this.loadAddressBookData();
    } catch (error) {
      console.error('Failed to toggle address status:', error);
      this.showErrorMessage('Failed to update address status');
    }
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.addressForm.controls).forEach(key => {
      this.addressForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Get address type label in current language
   */
  getAddressTypeLabel(type: AddressType): string {
    const typeConfig = this.addressTypes.find(t => t.value === type);
    const lang = this.currentLanguage();
    return typeConfig ? (lang === 'ar' ? typeConfig.labelAr : typeConfig.labelEn) : type;
  }

  /**
   * Get address type icon
   */
  getAddressTypeIcon(type: AddressType): string {
    const typeConfig = this.addressTypes.find(t => t.value === type);
    return typeConfig?.icon || 'location_on';
  }

  /**
   * Format address for display
   */
  formatAddress(address: UserAddress): string {
    const lang = this.currentLanguage();
    
    if (lang === 'ar' && address.addressLine1Ar) {
      const parts = [
        address.addressLine1Ar,
        address.addressLine2Ar,
        address.neighborhoodAr,
        address.cityAr || address.city,
        address.governorate
      ].filter(Boolean);
      return parts.join(', ');
    } else {
      const parts = [
        address.addressLine1,
        address.addressLine2,
        address.neighborhood,
        address.city,
        address.governorate
      ].filter(Boolean);
      return parts.join(', ');
    }
  }

  /**
   * Get recipient name in current language
   */
  getRecipientName(address: UserAddress): string {
    const lang = this.currentLanguage();
    return (lang === 'ar' && address.recipientNameAr) 
      ? address.recipientNameAr 
      : address.recipientName;
  }

  /**
   * Get address title in current language
   */
  getAddressTitle(address: UserAddress): string {
    const lang = this.currentLanguage();
    return lang === 'ar' ? address.titleAr : address.titleEn;
  }

  /**
   * Toggle between Arabic and English languages
   */
  toggleLanguage(): void {
    const currentLang = this.currentLanguageSignal();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    
    this.currentLanguageSignal.set(newLang);
    this.userService.updatePreferredLanguage(newLang).subscribe();
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show warning message
   */
  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }

  /**
   * Track by function for address list
   */
  trackByAddressId(index: number, address: UserAddress): string {
    return address.id;
  }

  /**
   * Get address verification status icon
   */
  getVerificationIcon(address: UserAddress): string {
    return address.isVerified ? 'verified' : 'pending';
  }

  /**
   * Get address verification status color
   */
  getVerificationColor(address: UserAddress): string {
    return address.isVerified ? 'text-green-600' : 'text-orange-500';
  }

  /**
   * Format date for last used display
   */
  formatLastUsed(date: Date | undefined): string {
    if (!date) return 'Never used';
    
    const lang = this.currentLanguage();
    const locale = lang === 'ar' ? 'ar-SY' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}