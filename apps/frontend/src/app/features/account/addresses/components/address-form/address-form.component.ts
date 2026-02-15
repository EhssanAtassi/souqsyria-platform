import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
  effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AddressApiService } from '../../services/address-api.service';
import { AddressResponse, CreateAddressRequest, UpdateAddressRequest } from '../../interfaces/address.interface';
import { GovernorateDropdownComponent } from '../governorate-dropdown/governorate-dropdown.component';

/**
 * @description Address form component for creating and editing Syrian addresses
 * Supports bilingual labels, cascading location selection, and comprehensive validation.
 * Handles both create and edit modes with reactive forms.
 *
 * @swagger
 * components:
 *   schemas:
 *     AddressFormComponent:
 *       type: object
 *       description: Form for creating and editing addresses
 *       properties:
 *         mode:
 *           type: string
 *           enum: [create, edit]
 *         address:
 *           $ref: '#/components/schemas/AddressResponse'
 */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    GovernorateDropdownComponent
  ],
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly addressService = inject(AddressApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** Input: Address data for edit mode */
  address = input<AddressResponse | undefined>(undefined);

  /** Input: Form mode (create or edit) */
  mode = input<'create' | 'edit'>('create');

  /** Output: Emits when form is successfully saved */
  saved = output<void>();

  /** Output: Emits when user cancels the form */
  cancelled = output<void>();

  /** Signal: Form submission loading state */
  readonly isSubmitting = signal<boolean>(false);

  /** Signal: Selected governorate ID for cascading dropdown */
  readonly selectedGovernorateId = signal<number | null>(null);

  /** Signal: Selected city ID for cascading dropdown */
  readonly selectedCityId = signal<number | null>(null);

  /** Signal: Selected district ID for cascading dropdown */
  readonly selectedDistrictId = signal<number | null>(null);

  /** Reactive form group */
  form!: FormGroup;

  /** Label options for button toggle */
  readonly labelOptions = ['home', 'work', 'family', 'other'];

  constructor() {
    // Watch for address input changes in edit mode
    effect(() => {
      const addr = this.address();
      if (addr && this.form) {
        this.populateForm(addr);
      }
    }, { allowSignalWrites: true });
  }

  /**
   * @description Initialize the reactive form with validators
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(128)]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\+963[0-9]{9}$/)
      ]],
      governorateId: [null, Validators.required],
      cityId: [null, Validators.required],
      districtId: [null],
      street: ['', [Validators.required, Validators.maxLength(128)]],
      building: ['', Validators.maxLength(64)],
      floor: ['', Validators.maxLength(16)],
      additionalDetails: ['', Validators.maxLength(256)],
      label: ['home'],
      isDefault: [false]
    });

    // Pre-populate in edit mode
    const addr = this.address();
    if (addr) {
      this.populateForm(addr);
    }
  }

  /**
   * @description Populate form with existing address data (edit mode)
   * @param addr - Address response object
   */
  private populateForm(addr: AddressResponse): void {
    this.form.patchValue({
      fullName: addr.fullName,
      phone: addr.phone,
      governorateId: addr.governorate?.id ?? null,
      cityId: addr.syrianCity?.id ?? null,
      districtId: addr.district?.id ?? null,
      street: addr.addressLine1,
      building: addr.building ?? '',
      floor: addr.floor ?? '',
      additionalDetails: addr.additionalDetails ?? '',
      label: addr.label ?? 'home',
      isDefault: addr.isDefault
    });

    // Update cascading dropdown selections
    if (addr.governorate?.id) {
      this.selectedGovernorateId.set(addr.governorate.id);
    }
    if (addr.syrianCity?.id) {
      this.selectedCityId.set(addr.syrianCity.id);
    }
    if (addr.district?.id) {
      this.selectedDistrictId.set(addr.district.id);
    }
  }

  /**
   * @description Handle governorate selection from dropdown
   * @param governorateId - Selected governorate ID
   */
  onGovernorateChange(governorateId: number): void {
    this.selectedGovernorateId.set(governorateId);
    this.form.patchValue({
      governorateId,
      cityId: null,
      districtId: null
    });
    this.selectedCityId.set(null);
    this.selectedDistrictId.set(null);
  }

  /**
   * @description Handle city selection from dropdown
   * @param cityId - Selected city ID
   */
  onCityChange(cityId: number): void {
    this.selectedCityId.set(cityId);
    this.form.patchValue({
      cityId,
      districtId: null
    });
    this.selectedDistrictId.set(null);
  }

  /**
   * @description Handle district selection from dropdown
   * @param districtId - Selected district ID
   */
  onDistrictChange(districtId: number): void {
    this.selectedDistrictId.set(districtId);
    this.form.patchValue({
      districtId
    });
  }

  /**
   * @description Handle form submission (create or update)
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.value;

    if (this.mode() === 'edit' && this.address()) {
      // Update existing address
      const updateDto: UpdateAddressRequest = {
        fullName: formValue.fullName,
        phone: formValue.phone,
        governorateId: formValue.governorateId,
        cityId: formValue.cityId,
        districtId: formValue.districtId || undefined,
        street: formValue.street,
        building: formValue.building || undefined,
        floor: formValue.floor || undefined,
        additionalDetails: formValue.additionalDetails || undefined,
        label: formValue.label,
        isDefault: formValue.isDefault
      };

      this.addressService.updateAddress(this.address()!.id, updateDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.saved.emit();
          },
          error: () => {
            this.isSubmitting.set(false);
          }
        });
    } else {
      // Create new address
      const createDto: CreateAddressRequest = {
        fullName: formValue.fullName,
        phone: formValue.phone,
        governorateId: formValue.governorateId,
        cityId: formValue.cityId,
        districtId: formValue.districtId || undefined,
        street: formValue.street,
        building: formValue.building || undefined,
        floor: formValue.floor || undefined,
        additionalDetails: formValue.additionalDetails || undefined,
        label: formValue.label,
        isDefault: formValue.isDefault
      };

      this.addressService.createAddress(createDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.saved.emit();
          },
          error: () => {
            this.isSubmitting.set(false);
          }
        });
    }
  }

  /**
   * @description Handle cancel button click
   */
  onCancel(): void {
    this.cancelled.emit();
  }

  /**
   * @description Check if a form field has an error
   * @param fieldName - Form control name
   * @param errorType - Validation error type
   * @returns True if field has the specified error and is touched
   */
  hasError(fieldName: string, errorType: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  /**
   * @description Get error message for a form field
   * @param fieldName - Form control name
   * @returns Translation key for the error message
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return `addresses.validation.${fieldName}Required`;
    }
    if (control.hasError('pattern')) {
      return `addresses.validation.${fieldName}Invalid`;
    }
    if (control.hasError('maxlength')) {
      return `addresses.validation.${fieldName}TooLong`;
    }

    return '';
  }

  /** @description Track label options by value */
  trackByLabel(index: number, label: string): string {
    return label;
  }
}
