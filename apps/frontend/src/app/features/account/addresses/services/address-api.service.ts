import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  Governorate,
  City,
  District
} from '../interfaces/address.interface';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * @description Address API Service for Syrian address management
 * Provides CRUD operations for addresses and hierarchical location data (governorates, cities, districts).
 * Uses Angular signals for reactive state management with granular loading states.
 *
 * @swagger
 * components:
 *   schemas:
 *     AddressApiService:
 *       type: object
 *       description: Service for managing Syrian addresses
 *       properties:
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AddressResponse'
 *         governorates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Governorate'
 */
@Injectable({
  providedIn: 'root'
})
export class AddressApiService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly baseUrl = `${environment.apiUrl}/addresses`;

  /** Signal: List of user addresses */
  readonly addresses = signal<AddressResponse[]>([]);

  /** Signal: List of Syrian governorates */
  readonly governorates = signal<Governorate[]>([]);

  /** Signal: List of cities (filtered by selected governorate) */
  readonly cities = signal<City[]>([]);

  /** Signal: List of districts (filtered by selected city) */
  readonly districts = signal<District[]>([]);

  /** Signal: Loading state for addresses list */
  readonly isLoadingAddresses = signal<boolean>(false);

  /** Signal: Loading state for governorates */
  readonly isLoadingGovernorates = signal<boolean>(false);

  /** Signal: Loading state for cities */
  readonly isLoadingCities = signal<boolean>(false);

  /** Signal: Loading state for districts */
  readonly isLoadingDistricts = signal<boolean>(false);

  /** Signal: Loading state for save operations (create/update/delete) */
  readonly isSaving = signal<boolean>(false);

  /** Computed: Any loading operation is in progress (backward compatible) */
  readonly isLoading = computed<boolean>(() =>
    this.isLoadingAddresses() ||
    this.isLoadingGovernorates() ||
    this.isLoadingCities() ||
    this.isLoadingDistricts() ||
    this.isSaving()
  );

  /** Signal: Error message for failed operations */
  readonly error = signal<string | null>(null);

  /**
   * @description Show a translated error notification to the user
   * @param translationKey - i18n key for the error message
   */
  private showError(translationKey: string): void {
    const message = this.translate.instant(translationKey);
    this.snackBar.open(message, this.translate.instant('addresses.dismiss'), {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * @description Load all addresses for the authenticated user
   * @returns Observable that emits the loaded addresses array
   */
  loadAddresses() {
    this.isLoadingAddresses.set(true);
    this.error.set(null);

    return this.http.get<AddressResponse[]>(this.baseUrl).pipe(
      tap((data) => {
        this.addresses.set(data);
        this.isLoadingAddresses.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load addresses');
        this.isLoadingAddresses.set(false);
        this.showError('addresses.errors.loadFailed');
        return of([]);
      })
    );
  }

  /**
   * @description Create a new address
   * @param dto - Create address request payload
   * @returns Observable that emits the created address
   */
  createAddress(dto: CreateAddressRequest) {
    this.isSaving.set(true);
    this.error.set(null);

    return this.http.post<AddressResponse>(this.baseUrl, dto).pipe(
      tap((newAddress) => {
        this.addresses.update((current) => [...current, newAddress]);
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to create address');
        this.isSaving.set(false);
        this.showError('addresses.errors.createFailed');
        throw err;
      })
    );
  }

  /**
   * @description Update an existing address
   * @param id - Address ID
   * @param dto - Update address request payload
   * @returns Observable that emits the updated address
   */
  updateAddress(id: number, dto: UpdateAddressRequest) {
    this.isSaving.set(true);
    this.error.set(null);

    return this.http.patch<AddressResponse>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((updatedAddress) => {
        this.addresses.update((current) =>
          current.map((addr) => (addr.id === id ? updatedAddress : addr))
        );
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to update address');
        this.isSaving.set(false);
        this.showError('addresses.errors.updateFailed');
        throw err;
      })
    );
  }

  /**
   * @description Delete an address
   * @param id - Address ID to delete
   * @returns Observable that completes when address is deleted
   */
  deleteAddress(id: number) {
    this.isSaving.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.addresses.update((current) => current.filter((addr) => addr.id !== id));
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to delete address');
        this.isSaving.set(false);
        this.showError('addresses.errors.deleteFailed');
        throw err;
      })
    );
  }

  /**
   * @description Set an address as default
   * @param id - Address ID to set as default
   * @returns Observable that emits the updated address
   */
  setDefault(id: number) {
    this.isSaving.set(true);
    this.error.set(null);

    return this.http.patch<AddressResponse>(`${this.baseUrl}/${id}/default`, {}).pipe(
      tap((updatedAddress) => {
        this.addresses.update((current) =>
          current.map((addr) => ({
            ...addr,
            isDefault: addr.id === id
          }))
        );
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to set default address');
        this.isSaving.set(false);
        this.showError('addresses.errors.setDefaultFailed');
        throw err;
      })
    );
  }

  /**
   * @description Load all Syrian governorates
   * @returns Observable that emits the loaded governorates array
   */
  loadGovernorates() {
    this.isLoadingGovernorates.set(true);
    this.error.set(null);

    return this.http.get<Governorate[]>(`${this.baseUrl}/governorates`).pipe(
      tap((data) => {
        this.governorates.set(data);
        this.isLoadingGovernorates.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load governorates');
        this.isLoadingGovernorates.set(false);
        this.showError('addresses.errors.governoratesLoadFailed');
        return of([]);
      })
    );
  }

  /**
   * @description Load cities for a specific governorate
   * @param governorateId - Governorate ID
   * @returns Observable that emits the loaded cities array
   */
  loadCities(governorateId: number) {
    this.isLoadingCities.set(true);
    this.error.set(null);

    return this.http.get<City[]>(`${this.baseUrl}/governorates/${governorateId}/cities`).pipe(
      tap((data) => {
        this.cities.set(data);
        this.isLoadingCities.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load cities');
        this.isLoadingCities.set(false);
        this.showError('addresses.errors.citiesLoadFailed');
        return of([]);
      })
    );
  }

  /**
   * @description Load districts for a specific city
   * @param cityId - City ID
   * @returns Observable that emits the loaded districts array
   */
  loadDistricts(cityId: number) {
    this.isLoadingDistricts.set(true);
    this.error.set(null);

    return this.http.get<District[]>(`${this.baseUrl}/cities/${cityId}/districts`).pipe(
      tap((data) => {
        this.districts.set(data);
        this.isLoadingDistricts.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load districts');
        this.isLoadingDistricts.set(false);
        this.showError('addresses.errors.districtsLoadFailed');
        return of([]);
      })
    );
  }

  /**
   * @description Clear cities signal (used when governorate changes)
   */
  clearCities() {
    this.cities.set([]);
  }

  /**
   * @description Clear districts signal (used when city changes)
   */
  clearDistricts() {
    this.districts.set([]);
  }
}
