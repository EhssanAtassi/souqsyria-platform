import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
 * Uses Angular signals for reactive state management.
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
  private readonly baseUrl = `${environment.apiUrl}/addresses`;

  /** Signal: List of user addresses */
  readonly addresses = signal<AddressResponse[]>([]);

  /** Signal: List of Syrian governorates */
  readonly governorates = signal<Governorate[]>([]);

  /** Signal: List of cities (filtered by selected governorate) */
  readonly cities = signal<City[]>([]);

  /** Signal: List of districts (filtered by selected city) */
  readonly districts = signal<District[]>([]);

  /** Signal: Loading state for async operations */
  readonly isLoading = signal<boolean>(false);

  /** Signal: Error message for failed operations */
  readonly error = signal<string | null>(null);

  /**
   * @description Load all addresses for the authenticated user
   * @returns Observable that completes when addresses are loaded
   */
  loadAddresses() {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<AddressResponse[]>(this.baseUrl).pipe(
      tap((data) => {
        this.addresses.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load addresses');
        this.isLoading.set(false);
        console.error('Error loading addresses:', err);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * @description Create a new address
   * @param dto - Create address request payload
   * @returns Observable that emits the created address
   */
  createAddress(dto: CreateAddressRequest) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<AddressResponse>(this.baseUrl, dto).pipe(
      tap((newAddress) => {
        this.addresses.update((current) => [...current, newAddress]);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to create address');
        this.isLoading.set(false);
        console.error('Error creating address:', err);
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
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.patch<AddressResponse>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((updatedAddress) => {
        this.addresses.update((current) =>
          current.map((addr) => (addr.id === id ? updatedAddress : addr))
        );
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to update address');
        this.isLoading.set(false);
        console.error('Error updating address:', err);
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
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.addresses.update((current) => current.filter((addr) => addr.id !== id));
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to delete address');
        this.isLoading.set(false);
        console.error('Error deleting address:', err);
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
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.patch<AddressResponse>(`${this.baseUrl}/${id}/default`, {}).pipe(
      tap((updatedAddress) => {
        this.addresses.update((current) =>
          current.map((addr) => ({
            ...addr,
            isDefault: addr.id === id
          }))
        );
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to set default address');
        this.isLoading.set(false);
        console.error('Error setting default address:', err);
        throw err;
      })
    );
  }

  /**
   * @description Load all Syrian governorates
   * @returns Observable that completes when governorates are loaded
   */
  loadGovernorates() {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<Governorate[]>(`${this.baseUrl}/governorates`).pipe(
      tap((data) => {
        this.governorates.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load governorates');
        this.isLoading.set(false);
        console.error('Error loading governorates:', err);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * @description Load cities for a specific governorate
   * @param governorateId - Governorate ID
   * @returns Observable that completes when cities are loaded
   */
  loadCities(governorateId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<City[]>(`${this.baseUrl}/governorates/${governorateId}/cities`).pipe(
      tap((data) => {
        this.cities.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load cities');
        this.isLoading.set(false);
        console.error('Error loading cities:', err);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * @description Load districts for a specific city
   * @param cityId - City ID
   * @returns Observable that completes when districts are loaded
   */
  loadDistricts(cityId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<District[]>(`${this.baseUrl}/cities/${cityId}/districts`).pipe(
      tap((data) => {
        this.districts.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load districts');
        this.isLoading.set(false);
        console.error('Error loading districts:', err);
        return of([]);
      })
    ).subscribe();
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
