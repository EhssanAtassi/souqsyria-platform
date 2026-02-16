import { Injectable, inject, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AddressApiService } from '../../features/account/addresses/services/address-api.service';
import {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest
} from '../../features/account/addresses/interfaces/address.interface';

/**
 * @description Address Facade Service
 *
 * Provides a lightweight abstraction layer between checkout and the address management system.
 * Decouples checkout from the internal implementation details of AddressApiService,
 * exposing only the minimal interface needed for address selection and management
 * during the checkout flow.
 *
 * Benefits:
 * - Loose coupling: Checkout doesn't depend on address feature internals
 * - Stable API: Changes to AddressApiService won't break checkout
 * - Clear boundaries: Explicit contract for what checkout needs
 * - Future-proof: Easy to swap implementations or add caching/middleware
 *
 * @swagger
 * components:
 *   schemas:
 *     AddressFacadeService:
 *       type: object
 *       description: Facade for address operations in checkout context
 *       properties:
 *         addresses:
 *           type: array
 *           description: Reactive signal of user addresses
 *           items:
 *             $ref: '#/components/schemas/AddressResponse'
 */
@Injectable({
  providedIn: 'root'
})
export class AddressFacadeService {
  /** @description Injected AddressApiService (internal implementation) */
  private readonly addressApiService = inject(AddressApiService);

  /**
   * @description Reactive signal containing the list of user addresses
   * @returns Signal<AddressResponse[]> that updates when addresses change
   */
  get addresses(): Signal<AddressResponse[]> {
    return this.addressApiService.addresses;
  }

  /**
   * @description Reactive signal indicating if addresses are being loaded
   * @returns Signal<boolean> that is true during address loading operations
   */
  get isLoading(): Signal<boolean> {
    return this.addressApiService.isLoadingAddresses;
  }

  /**
   * @description Load all addresses for the authenticated user
   * Triggers an HTTP request and updates the addresses signal
   * @returns Observable<AddressResponse[]> that emits the loaded addresses
   */
  loadAddresses(): Observable<AddressResponse[]> {
    return this.addressApiService.loadAddresses();
  }

  /**
   * @description Set an address as the user's default shipping address
   * Updates the server and refreshes the addresses signal
   * @param id - ID of the address to set as default
   * @returns Observable<AddressResponse> that emits the updated address
   */
  setDefault(id: number): Observable<AddressResponse> {
    return this.addressApiService.setDefault(id);
  }

  /**
   * @description Create a new address for the user
   * Adds the address to the server and updates the addresses signal
   * @param dto - Create address request payload
   * @returns Observable<AddressResponse> that emits the created address
   */
  createAddress(dto: CreateAddressRequest): Observable<AddressResponse> {
    return this.addressApiService.createAddress(dto);
  }

  /**
   * @description Update an existing address
   * Modifies the address on the server and updates the addresses signal
   * @param id - ID of the address to update
   * @param dto - Update address request payload
   * @returns Observable<AddressResponse> that emits the updated address
   */
  updateAddress(id: number, dto: UpdateAddressRequest): Observable<AddressResponse> {
    return this.addressApiService.updateAddress(id, dto);
  }
}
