/**
 * @fileoverview Address Book component wired to real backend API
 * @description CRUD for user addresses via /addresses endpoints (SS-USER-005)
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AddressApiService } from './services/address-api.service';
import {
  BackendAddress,
  CreateAddressRequest,
  formatBackendAddress,
} from './models/address.interface';

/**
 * @description Address Book management component using real backend API
 * @class AddressBookComponent
 */
@Component({
  selector: 'app-address-book',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressBookComponent implements OnInit {
  /** Address API service */
  private readonly addressApi = inject(AddressApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  /** Component state signals */
  readonly addresses = signal<BackendAddress[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly showForm = signal<boolean>(false);
  readonly editingId = signal<number | null>(null);

  /** Computed: default shipping address */
  readonly defaultAddress = computed(() =>
    this.addresses().find((a) => a.isDefault)
  );

  /** Computed: form title based on editing state */
  readonly formTitle = computed(() =>
    this.editingId()
      ? this.translate.instant('account.addresses.editTitle')
      : this.translate.instant('account.addresses.addTitle')
  );

  /** Address form */
  addressForm!: FormGroup;

  /** Label presets for quick selection */
  readonly labelPresets = [
    { value: 'Home', icon: 'home' },
    { value: 'Work', icon: 'work' },
    { value: 'Family', icon: 'family_restroom' },
  ];

  /**
   * @description Initializes the component, creates form and loads data
   */
  ngOnInit(): void {
    this.addressForm = this.fb.group({
      label: ['', [Validators.maxLength(32)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(128)]],
      addressLine2: ['', [Validators.maxLength(64)]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)],
      ],
      notes: ['', [Validators.maxLength(128)]],
      isDefault: [false],
      countryId: [1], // Syria default
      regionId: [null],
      cityId: [null],
    });

    this.loadAddresses();
  }

  /**
   * @description Loads addresses from backend
   */
  loadAddresses(): void {
    this.isLoading.set(true);
    this.addressApi.getAddresses().subscribe({
      next: (data) => {
        this.addresses.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showMessage('account.addresses.loadError', true);
      },
    });
  }

  /**
   * @description Opens form for adding a new address
   */
  openNewForm(): void {
    this.editingId.set(null);
    this.addressForm.reset({ countryId: 1, isDefault: false });
    this.showForm.set(true);
  }

  /**
   * @description Opens form pre-filled with an existing address for editing
   * @param {BackendAddress} address - Address to edit
   */
  openEditForm(address: BackendAddress): void {
    this.editingId.set(address.id);
    this.addressForm.patchValue({
      label: address.label || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      phone: address.phone,
      notes: address.notes || '',
      isDefault: address.isDefault,
      countryId: address.country?.id || 1,
      regionId: address.region?.id || null,
      cityId: address.city?.id || null,
    });
    this.showForm.set(true);
  }

  /**
   * @description Closes the address form
   */
  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  /**
   * @description Saves address (create or update)
   */
  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const formValue = this.addressForm.value;
    const dto: CreateAddressRequest = {
      label: formValue.label || undefined,
      addressLine1: formValue.addressLine1,
      addressLine2: formValue.addressLine2 || undefined,
      phone: formValue.phone,
      notes: formValue.notes || undefined,
      isDefault: formValue.isDefault,
      countryId: formValue.countryId,
      regionId: formValue.regionId || undefined,
      cityId: formValue.cityId || undefined,
    };

    const editId = this.editingId();

    if (editId) {
      this.addressApi.updateAddress(editId, dto).subscribe({
        next: () => {
          this.showMessage('account.addresses.updateSuccess');
          this.closeForm();
          this.loadAddresses();
        },
        error: () => this.showMessage('account.addresses.updateError', true),
      });
    } else {
      this.addressApi.createAddress(dto).subscribe({
        next: () => {
          this.showMessage('account.addresses.createSuccess');
          this.closeForm();
          this.loadAddresses();
        },
        error: () => this.showMessage('account.addresses.createError', true),
      });
    }
  }

  /**
   * @description Deletes an address after confirmation
   * @param {BackendAddress} address - Address to delete
   */
  deleteAddress(address: BackendAddress): void {
    const msg = this.translate.instant('account.addresses.confirmDelete');
    if (!confirm(msg)) return;

    this.addressApi.deleteAddress(address.id).subscribe({
      next: () => {
        this.showMessage('account.addresses.deleteSuccess');
        this.loadAddresses();
      },
      error: () => this.showMessage('account.addresses.deleteError', true),
    });
  }

  /**
   * @description Sets an address as the default
   * @param {BackendAddress} address - Address to set as default
   */
  setDefault(address: BackendAddress): void {
    this.addressApi.setDefault(address.id).subscribe({
      next: () => {
        this.showMessage('account.addresses.defaultSuccess');
        this.loadAddresses();
      },
      error: () => this.showMessage('account.addresses.defaultError', true),
    });
  }

  /**
   * @description Formats an address for display
   * @param {BackendAddress} addr - Address to format
   * @returns {string} Formatted address string
   */
  formatAddress(addr: BackendAddress): string {
    return formatBackendAddress(addr);
  }

  /**
   * @description Shows a snackbar message
   * @param {string} key - Translation key
   * @param {boolean} [isError] - Whether this is an error message
   */
  private showMessage(key: string, isError = false): void {
    this.snackBar.open(
      this.translate.instant(key),
      this.translate.instant('close'),
      {
        duration: isError ? 5000 : 3000,
        panelClass: [isError ? 'error-snackbar' : 'success-snackbar'],
      }
    );
  }
}
