import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AddressApiService } from '../../services/address-api.service';
import { AddressResponse } from '../../interfaces/address.interface';
import { AddressFormComponent } from '../../components/address-form/address-form.component';
import {
  DeleteConfirmationDialogComponent,
  DeleteConfirmationData
} from '../../components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { LanguageService } from '../../../../../shared/services/language.service';

/**
 * @description Address list page component - main view for address management
 * Displays all user addresses in a responsive card grid with CRUD operations.
 * Supports inline form toggling for create/edit, bilingual display, and deletion with safety checks.
 *
 * @swagger
 * components:
 *   schemas:
 *     AddressListComponent:
 *       type: object
 *       description: Main page for managing user addresses
 *       properties:
 *         showForm:
 *           type: boolean
 *           description: Whether address form is visible
 *         editingAddress:
 *           $ref: '#/components/schemas/AddressResponse'
 */
@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    TranslateModule,
    AddressFormComponent
  ],
  templateUrl: './address-list.component.html',
  styleUrls: ['./address-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressListComponent implements OnInit {
  private readonly addressService = inject(AddressApiService);
  private readonly languageService = inject(LanguageService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  /** Signal: Whether to show the address form */
  readonly showForm = signal<boolean>(false);

  /** Signal: Address being edited (null for create mode) */
  readonly editingAddress = signal<AddressResponse | undefined>(undefined);

  /** Computed: Form mode based on editing address */
  readonly formMode = computed<'create' | 'edit'>(() => {
    return this.editingAddress() ? 'edit' : 'create';
  });

  /** Current language signal */
  readonly lang = this.languageService.language;

  /** Addresses from service */
  readonly addresses = this.addressService.addresses;

  /** Loading state from service */
  readonly isLoading = this.addressService.isLoading;

  /** Computed: Whether there are no addresses */
  readonly isEmpty = computed(() => this.addresses().length === 0);

  /**
   * @description Initialize component by loading addresses
   */
  ngOnInit(): void {
    this.addressService.loadAddresses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * @description Show the address form in create mode
   */
  onAddNewAddress(): void {
    this.editingAddress.set(undefined);
    this.showForm.set(true);
  }

  /**
   * @description Show the address form in edit mode
   * @param address - Address to edit
   */
  onEditAddress(address: AddressResponse): void {
    this.editingAddress.set(address);
    this.showForm.set(true);
  }

  /**
   * @description Handle form save completion
   * Reloads addresses and hides form
   */
  onFormSaved(): void {
    this.showForm.set(false);
    this.editingAddress.set(undefined);
    this.addressService.loadAddresses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * @description Handle form cancellation
   * Hides form without saving
   */
  onFormCancelled(): void {
    this.showForm.set(false);
    this.editingAddress.set(undefined);
  }

  /**
   * @description Open delete confirmation dialog
   * @param address - Address to delete
   */
  onDeleteAddress(address: AddressResponse): void {
    const isDefault = address.isDefault;
    const isOnlyAddress = this.addresses().length === 1;

    const dialogData: DeleteConfirmationData = {
      address,
      isDefault,
      isOnlyAddress
    };

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.addressService.deleteAddress(address.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  /**
   * @description Set an address as the default
   * @param address - Address to set as default
   */
  onSetDefault(address: AddressResponse): void {
    if (!address.isDefault) {
      this.addressService.setDefault(address.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  /**
   * @description Get the icon for an address label
   * @param label - Address label (home, work, family, other)
   * @returns Material icon name
   */
  getLabelIcon(label?: string): string {
    switch (label) {
      case 'home':
        return 'home';
      case 'work':
        return 'business';
      case 'family':
        return 'people';
      case 'other':
      default:
        return 'location_on';
    }
  }

  /**
   * @description Get the full address display string
   * @param address - Address response object
   * @returns Formatted address string with bilingual location names
   */
  getFullAddress(address: AddressResponse): string {
    const parts: string[] = [];

    // Governorate
    if (address.governorate) {
      const govName = this.lang() === 'ar'
        ? address.governorate.nameAr
        : address.governorate.nameEn;
      parts.push(govName);
    }

    // City
    if (address.syrianCity) {
      const cityName = this.lang() === 'ar'
        ? address.syrianCity.nameAr
        : address.syrianCity.nameEn;
      parts.push(cityName);
    }

    // District
    if (address.district) {
      const districtName = this.lang() === 'ar'
        ? address.district.nameAr
        : address.district.nameEn;
      parts.push(districtName);
    }

    // Street
    if (address.addressLine1) {
      parts.push(address.addressLine1);
    }

    return parts.join(' > ');
  }

  /**
   * @description Get building and floor display string
   * @param address - Address response object
   * @returns Formatted building/floor string
   */
  getBuildingFloorInfo(address: AddressResponse): string {
    const parts: string[] = [];

    if (address.building) {
      parts.push(`${this.translate.instant('addresses.buildingLabel')}: ${address.building}`);
    }

    if (address.floor) {
      parts.push(`${this.translate.instant('addresses.floorLabel')}: ${address.floor}`);
    }

    return parts.join(', ');
  }

  /**
   * @description Track address items by ID for efficient ngFor rendering
   * @param index - Array index
   * @param address - Address response object
   * @returns Address ID
   */
  trackByAddressId(index: number, address: AddressResponse): number {
    return address.id;
  }
}
