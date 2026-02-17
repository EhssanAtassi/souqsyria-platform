import { TestBed } from '@angular/core/testing';
import { signal, Signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AddressFacadeService } from './address-facade.service';
import { AddressApiService } from '../../features/account/addresses/services/address-api.service';
import {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest
} from '../../features/account/addresses/interfaces/address.interface';

/**
 * @description Unit tests for AddressFacadeService
 * Tests facade pattern implementation and delegation to AddressApiService
 */
describe('AddressFacadeService', () => {
  let service: AddressFacadeService;
  let addressApiServiceMock: jasmine.SpyObj<AddressApiService>;

  /** @description Mock address data for testing */
  const mockAddresses: AddressResponse[] = [
    {
      id: 1,
      fullName: 'Ahmad Test',
      phone: '+963912345678',
      addressLine1: 'Damascus Street 123',
      isDefault: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      fullName: 'Fatima Test',
      phone: '+963987654321',
      addressLine1: 'Aleppo Street 456',
      isDefault: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ];

  /** @description Mock create address request */
  const mockCreateRequest: CreateAddressRequest = {
    fullName: 'New User',
    phone: '+963911111111',
    governorateId: 1,
    cityId: 1,
    street: 'New Street 789',
    isDefault: false
  };

  /** @description Mock update address request */
  const mockUpdateRequest: UpdateAddressRequest = {
    fullName: 'Updated Name',
    phone: '+963922222222'
  };

  beforeEach(() => {
    // Create spy object for AddressApiService with all methods and properties
    addressApiServiceMock = jasmine.createSpyObj('AddressApiService', [
      'loadAddresses',
      'setDefault',
      'createAddress',
      'updateAddress'
    ], {
      addresses: signal<AddressResponse[]>([]),
      isLoadingAddresses: signal<boolean>(false)
    });

    TestBed.configureTestingModule({
      providers: [
        AddressFacadeService,
        { provide: AddressApiService, useValue: addressApiServiceMock }
      ],
    });

    service = TestBed.inject(AddressFacadeService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject AddressApiService', () => {
      expect(addressApiServiceMock).toBeTruthy();
    });
  });

  describe('Signal Properties', () => {
    it('should expose addresses signal from AddressApiService', () => {
      const addressesSignal = service.addresses;
      expect(addressesSignal).toBeDefined();
      expect(typeof addressesSignal).toBe('function'); // Signals are functions
    });

    it('should expose isLoading signal from AddressApiService', () => {
      const isLoadingSignal = service.isLoading;
      expect(isLoadingSignal).toBeDefined();
      expect(typeof isLoadingSignal).toBe('function'); // Signals are functions
    });

    it('should return the same addresses signal as AddressApiService', () => {
      const mockSignal = signal<AddressResponse[]>(mockAddresses);
      Object.defineProperty(addressApiServiceMock, 'addresses', {
        get: () => mockSignal
      });

      const addressesSignal = service.addresses;
      expect(addressesSignal()).toEqual(mockAddresses);
    });

    it('should return the same isLoading signal as AddressApiService', () => {
      const mockLoadingSignal = signal<boolean>(true);
      Object.defineProperty(addressApiServiceMock, 'isLoadingAddresses', {
        get: () => mockLoadingSignal
      });

      const isLoadingSignal = service.isLoading;
      expect(isLoadingSignal()).toBe(true);
    });
  });

  describe('loadAddresses()', () => {
    it('should delegate to AddressApiService.loadAddresses', (done) => {
      addressApiServiceMock.loadAddresses.and.returnValue(of(mockAddresses));

      service.loadAddresses().subscribe({
        next: (addresses) => {
          expect(addressApiServiceMock.loadAddresses).toHaveBeenCalled();
          expect(addresses).toEqual(mockAddresses);
          done();
        }
      });
    });

    it('should propagate errors from AddressApiService', (done) => {
      const errorMessage = 'Failed to load addresses';
      addressApiServiceMock.loadAddresses.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      service.loadAddresses().subscribe({
        error: (error) => {
          expect(addressApiServiceMock.loadAddresses).toHaveBeenCalled();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });

    it('should call loadAddresses without parameters', () => {
      addressApiServiceMock.loadAddresses.and.returnValue(of(mockAddresses));

      service.loadAddresses();

      expect(addressApiServiceMock.loadAddresses).toHaveBeenCalledWith();
    });
  });

  describe('setDefault()', () => {
    it('should delegate to AddressApiService.setDefault with correct id', (done) => {
      const addressId = 2;
      const updatedAddress: AddressResponse = {
        ...mockAddresses[1],
        isDefault: true
      };

      addressApiServiceMock.setDefault.and.returnValue(of(updatedAddress));

      service.setDefault(addressId).subscribe({
        next: (address) => {
          expect(addressApiServiceMock.setDefault).toHaveBeenCalledWith(addressId);
          expect(address.isDefault).toBe(true);
          done();
        }
      });
    });

    it('should propagate errors from AddressApiService', (done) => {
      const errorMessage = 'Failed to set default address';
      addressApiServiceMock.setDefault.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      service.setDefault(1).subscribe({
        error: (error) => {
          expect(addressApiServiceMock.setDefault).toHaveBeenCalled();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('createAddress()', () => {
    it('should delegate to AddressApiService.createAddress with correct data', (done) => {
      const newAddress: AddressResponse = {
        id: 3,
        ...mockCreateRequest,
        addressLine1: mockCreateRequest.street,
        isDefault: false,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      };

      addressApiServiceMock.createAddress.and.returnValue(of(newAddress));

      service.createAddress(mockCreateRequest).subscribe({
        next: (address) => {
          expect(addressApiServiceMock.createAddress).toHaveBeenCalledWith(mockCreateRequest);
          expect(address.id).toBe(3);
          expect(address.fullName).toBe(mockCreateRequest.fullName);
          done();
        }
      });
    });

    it('should propagate errors from AddressApiService', (done) => {
      const errorMessage = 'Failed to create address';
      addressApiServiceMock.createAddress.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      service.createAddress(mockCreateRequest).subscribe({
        error: (error) => {
          expect(addressApiServiceMock.createAddress).toHaveBeenCalled();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('updateAddress()', () => {
    it('should delegate to AddressApiService.updateAddress with correct parameters', (done) => {
      const addressId = 1;
      const updatedAddress: AddressResponse = {
        ...mockAddresses[0],
        ...mockUpdateRequest,
        updatedAt: '2024-01-04T00:00:00Z'
      };

      addressApiServiceMock.updateAddress.and.returnValue(of(updatedAddress));

      service.updateAddress(addressId, mockUpdateRequest).subscribe({
        next: (address) => {
          expect(addressApiServiceMock.updateAddress).toHaveBeenCalledWith(
            addressId,
            mockUpdateRequest
          );
          expect(address.fullName).toBe(mockUpdateRequest.fullName);
          expect(address.phone).toBe(mockUpdateRequest.phone);
          done();
        }
      });
    });

    it('should propagate errors from AddressApiService', (done) => {
      const errorMessage = 'Failed to update address';
      addressApiServiceMock.updateAddress.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      service.updateAddress(1, mockUpdateRequest).subscribe({
        error: (error) => {
          expect(addressApiServiceMock.updateAddress).toHaveBeenCalled();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });

    it('should handle partial updates', (done) => {
      const addressId = 1;
      const partialUpdate: UpdateAddressRequest = {
        phone: '+963933333333'
      };
      const updatedAddress: AddressResponse = {
        ...mockAddresses[0],
        phone: partialUpdate.phone!,
        updatedAt: '2024-01-05T00:00:00Z'
      };

      addressApiServiceMock.updateAddress.and.returnValue(of(updatedAddress));

      service.updateAddress(addressId, partialUpdate).subscribe({
        next: (address) => {
          expect(addressApiServiceMock.updateAddress).toHaveBeenCalledWith(
            addressId,
            partialUpdate
          );
          expect(address.phone).toBe(partialUpdate.phone);
          done();
        }
      });
    });
  });

  describe('Facade Pattern Benefits', () => {
    it('should provide stable API independent of AddressApiService implementation', () => {
      // Verify that facade exposes only minimal interface needed for checkout
      expect(typeof service.addresses).toBe('function'); // Signal getter
      expect(typeof service.isLoading).toBe('function'); // Signal getter
      expect(typeof service.loadAddresses).toBe('function');
      expect(typeof service.setDefault).toBe('function');
      expect(typeof service.createAddress).toBe('function');
      expect(typeof service.updateAddress).toBe('function');

      // Verify no direct exposure of internal AddressApiService methods
      expect((service as any).addressApiService).toBeDefined();
      expect((service as any).deleteAddress).toBeUndefined(); // Not exposed
    });

    it('should decouple checkout from address feature internals', () => {
      // All calls should go through facade, not directly to AddressApiService
      addressApiServiceMock.loadAddresses.and.returnValue(of(mockAddresses));

      service.loadAddresses();

      expect(addressApiServiceMock.loadAddresses).toHaveBeenCalled();
      // Verify facade is the only point of contact
      expect(addressApiServiceMock.loadAddresses).toHaveBeenCalledTimes(1);
    });
  });
});
