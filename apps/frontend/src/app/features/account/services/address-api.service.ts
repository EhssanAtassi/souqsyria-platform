/**
 * @fileoverview Address API service for address book CRUD operations
 * @description Handles HTTP requests for the /addresses backend endpoints
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BackendAddress,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../models/address.interface';

/**
 * @description Service for managing address CRUD operations via API
 * @class AddressApiService
 */
@Injectable({
  providedIn: 'root',
})
export class AddressApiService {
  /** HTTP client for API requests */
  private http = inject(HttpClient);

  /** Base API URL for address endpoints */
  private readonly apiUrl = `${environment.apiUrl}/addresses`;

  /**
   * @description Fetches all addresses for the current user, optionally filtered by type
   * @param {string} [type] - Optional address type filter ('shipping' | 'billing')
   * @returns {Observable<BackendAddress[]>} Observable containing array of addresses
   */
  getAddresses(type?: 'shipping' | 'billing'): Observable<BackendAddress[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<BackendAddress[]>(this.apiUrl, { params });
  }

  /**
   * @description Creates a new address for the current user
   * @param {CreateAddressRequest} dto - Address data to create
   * @returns {Observable<BackendAddress>} Observable containing the created address
   */
  createAddress(dto: CreateAddressRequest): Observable<BackendAddress> {
    return this.http.post<BackendAddress>(this.apiUrl, dto);
  }

  /**
   * @description Updates an existing address
   * @param {number} id - Address ID to update
   * @param {UpdateAddressRequest} dto - Address data to update
   * @returns {Observable<BackendAddress>} Observable containing the updated address
   */
  updateAddress(id: number, dto: UpdateAddressRequest): Observable<BackendAddress> {
    return this.http.put<BackendAddress>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * @description Soft-deletes an address
   * @param {number} id - Address ID to delete
   * @returns {Observable<void>} Observable that completes on success
   */
  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * @description Sets an address as the default for its type
   * @param {number} id - Address ID to set as default
   * @returns {Observable<BackendAddress>} Observable containing the updated address
   */
  setDefault(id: number): Observable<BackendAddress> {
    return this.http.post<BackendAddress>(`${this.apiUrl}/${id}/set-default`, {});
  }
}
