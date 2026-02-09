/**
 * @file address-api.service.spec.ts
 * @description Unit tests for AddressApiService
 *
 * Tests cover:
 * - Get all addresses (with and without type filter)
 * - Create address
 * - Update address
 * - Delete address
 * - Set default address
 *
 * @author Claude Code
 * @since 2025-02-09
 */

import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AddressApiService } from './address-api.service';
import { environment } from '../../../../environments/environment';
import {
  BackendAddress,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../models/address.interface';

describe('AddressApiService', () => {
  let service: AddressApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/addresses`;

  const mockAddress: BackendAddress = {
    id: 1,
    label: 'Home',
    addressType: 'shipping',
    addressLine1: 'شارع الثورة',
    addressLine2: 'حي المزة',
    phone: '+963987654321',
    notes: 'Ring the bell',
    isDefault: true,
    city: { id: 1, name: 'Damascus' },
    region: { id: 1, name: 'Damascus' },
    country: { id: 1, name: 'Syria' },
    createdAt: '2025-07-15T10:00:00.000Z',
    updatedAt: '2025-07-15T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AddressApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AddressApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAddresses', () => {
    /**
     * Test: should fetch all addresses without filter
     */
    it('should fetch all addresses without type filter', () => {
      const mockAddresses: BackendAddress[] = [mockAddress];

      service.getAddresses().subscribe((addresses) => {
        expect(addresses.length).toBe(1);
        expect(addresses[0].label).toBe('Home');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('type')).toBeFalse();
      req.flush(mockAddresses);
    });

    /**
     * Test: should fetch addresses with type filter
     */
    it('should fetch addresses with type filter', () => {
      service.getAddresses('shipping').subscribe();

      const req = httpMock.expectOne(`${apiUrl}?type=shipping`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('type')).toBe('shipping');
      req.flush([]);
    });
  });

  describe('createAddress', () => {
    /**
     * Test: should send POST request with address data
     */
    it('should send POST request with address data', () => {
      const dto: CreateAddressRequest = {
        addressLine1: 'شارع الثورة',
        phone: '+963987654321',
        countryId: 1,
        isDefault: false,
      };

      service.createAddress(dto).subscribe((result) => {
        expect(result.id).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.addressLine1).toBe('شارع الثورة');
      expect(req.request.body.phone).toBe('+963987654321');
      req.flush(mockAddress);
    });
  });

  describe('updateAddress', () => {
    /**
     * Test: should send PUT request to correct URL
     */
    it('should send PUT request with id and data', () => {
      const dto: UpdateAddressRequest = {
        label: 'Updated Home',
        addressLine1: 'شارع جديد',
      };

      service.updateAddress(1, dto).subscribe((result) => {
        expect(result).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.label).toBe('Updated Home');
      req.flush({ ...mockAddress, label: 'Updated Home' });
    });
  });

  describe('deleteAddress', () => {
    /**
     * Test: should send DELETE request to correct URL
     */
    it('should send DELETE request with address id', () => {
      service.deleteAddress(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('setDefault', () => {
    /**
     * Test: should send POST request to set-default endpoint
     */
    it('should send POST to set-default endpoint', () => {
      service.setDefault(2).subscribe((result) => {
        expect(result).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/2/set-default`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ ...mockAddress, id: 2, isDefault: true });
    });
  });
});
