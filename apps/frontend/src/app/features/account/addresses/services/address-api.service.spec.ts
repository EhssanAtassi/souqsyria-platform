/**
 * @file address-api.service.spec.ts
 * @description Unit tests for Address API Service
 *
 * Tests cover:
 * - loadAddresses() - GET addresses with signal update
 * - createAddress() - POST new address and append to signal
 * - updateAddress() - PATCH address and update signal
 * - deleteAddress() - DELETE address and remove from signal
 * - setDefault() - PATCH to set default and update signal
 * - loadGovernorates() - GET governorates with signal update
 * - loadCities() - GET cities with signal update
 * - loadDistricts() - GET districts with signal update
 * - Error handling and loading states
 * - Signal management (clearCities, clearDistricts)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AddressApiService } from './address-api.service';
import {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  Governorate,
  City,
  District,
} from '../interfaces/address.interface';
import { environment } from '../../../../../environments/environment';

describe('AddressApiService', () => {
  let service: AddressApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/addresses`;

  const mockGovernorate: Governorate = {
    id: 1,
    code: 'DM',
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    displayOrder: 1,
    status: {
      deliverySupported: true,
      accessibilityLevel: 'full',
    },
  };

  const mockCity: City = {
    id: 5,
    nameEn: 'Damascus City',
    nameAr: 'دمشق',
    governorate: mockGovernorate,
    displayOrder: 1,
  };

  const mockDistrict: District = {
    id: 10,
    nameEn: 'Al-Mezzeh',
    nameAr: 'المزة',
    city: mockCity,
    displayOrder: 1,
  };

  const mockAddress: AddressResponse = {
    id: 1,
    fullName: 'أحمد محمد',
    phone: '+963912345678',
    label: 'home',
    addressLine1: 'شارع الثورة',
    building: 'بناء السلام',
    floor: '3',
    additionalDetails: 'بجانب الصيدلية',
    isDefault: true,
    governorate: mockGovernorate,
    syrianCity: mockCity,
    district: mockDistrict,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AddressApiService],
    });

    service = TestBed.inject(AddressApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Reset signals
    service.addresses.set([]);
    service.governorates.set([]);
    service.cities.set([]);
    service.districts.set([]);
    service.isLoading.set(false);
    service.error.set(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadAddresses', () => {
    it('should load addresses and update signal', (done) => {
      // Arrange
      const addresses = [mockAddress];

      // Act
      service.loadAddresses();

      // Assert
      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      expect(service.isLoading()).toBe(true);

      req.flush(addresses);

      setTimeout(() => {
        expect(service.addresses()).toEqual(addresses);
        expect(service.isLoading()).toBe(false);
        expect(service.error()).toBeNull();
        done();
      }, 0);
    });

    it('should set error on failure', (done) => {
      // Act
      service.loadAddresses();

      // Assert
      const req = httpMock.expectOne(baseUrl);
      req.error(new ErrorEvent('Network error'));

      setTimeout(() => {
        expect(service.error()).toBe('Failed to load addresses');
        expect(service.isLoading()).toBe(false);
        done();
      }, 0);
    });

    it('should handle empty address list', (done) => {
      // Act
      service.loadAddresses();

      // Assert
      const req = httpMock.expectOne(baseUrl);
      req.flush([]);

      setTimeout(() => {
        expect(service.addresses()).toEqual([]);
        done();
      }, 0);
    });
  });

  describe('createAddress', () => {
    it('should create address and append to signal', (done) => {
      // Arrange
      const dto: CreateAddressRequest = {
        fullName: 'محمد أحمد',
        phone: '+963987654321',
        governorateId: 1,
        cityId: 5,
        street: 'شارع جديد',
        label: 'work',
      };

      service.addresses.set([mockAddress]);

      // Act
      service.createAddress(dto).subscribe(() => {
        // Assert
        expect(service.addresses().length).toBe(2);
        expect(service.addresses()[1]).toEqual(jasmine.objectContaining(dto));
        expect(service.isLoading()).toBe(false);
        done();
      });

      // Assert
      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      expect(service.isLoading()).toBe(true);

      req.flush({ ...mockAddress, id: 2, ...dto });
    });

    it('should set error on creation failure', (done) => {
      // Arrange
      const dto: CreateAddressRequest = {
        fullName: 'محمد أحمد',
        phone: '+963987654321',
        governorateId: 1,
        cityId: 5,
        street: 'شارع جديد',
      };

      // Act
      service.createAddress(dto).subscribe({
        error: () => {
          // Assert
          expect(service.error()).toBe('Failed to create address');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });

      // Assert
      const req = httpMock.expectOne(baseUrl);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('updateAddress', () => {
    it('should update address and modify signal', (done) => {
      // Arrange
      const addressId = 1;
      const dto: UpdateAddressRequest = {
        fullName: 'محمد أحمد جديد',
      };

      service.addresses.set([mockAddress]);

      // Act
      service.updateAddress(addressId, dto).subscribe(() => {
        // Assert
        expect(service.addresses()[0].fullName).toBe('محمد أحمد جديد');
        expect(service.isLoading()).toBe(false);
        done();
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${addressId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);

      req.flush({ ...mockAddress, fullName: 'محمد أحمد جديد' });
    });

    it('should only update the matching address in signal', (done) => {
      // Arrange
      const address1 = { ...mockAddress, id: 1, fullName: 'أحمد' };
      const address2 = { ...mockAddress, id: 2, fullName: 'محمد' };
      const dto: UpdateAddressRequest = { fullName: 'أحمد محمد' };

      service.addresses.set([address1, address2]);

      // Act
      service.updateAddress(1, dto).subscribe(() => {
        // Assert
        expect(service.addresses()[0].fullName).toBe('أحمد محمد');
        expect(service.addresses()[1].fullName).toBe('محمد');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.flush({ ...address1, fullName: 'أحمد محمد' });
    });

    it('should set error on update failure', (done) => {
      // Arrange
      const dto: UpdateAddressRequest = { fullName: 'New Name' };

      // Act
      service.updateAddress(1, dto).subscribe({
        error: () => {
          // Assert
          expect(service.error()).toBe('Failed to update address');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('deleteAddress', () => {
    it('should delete address and remove from signal', (done) => {
      // Arrange
      const address1 = { ...mockAddress, id: 1 };
      const address2 = { ...mockAddress, id: 2 };
      service.addresses.set([address1, address2]);

      // Act
      service.deleteAddress(1).subscribe(() => {
        // Assert
        expect(service.addresses().length).toBe(1);
        expect(service.addresses()[0].id).toBe(2);
        expect(service.isLoading()).toBe(false);
        done();
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });

    it('should set error on deletion failure', (done) => {
      // Act
      service.deleteAddress(1).subscribe({
        error: () => {
          // Assert
          expect(service.error()).toBe('Failed to delete address');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('setDefault', () => {
    it('should set address as default and update all flags in signal', (done) => {
      // Arrange
      const address1 = { ...mockAddress, id: 1, isDefault: true };
      const address2 = { ...mockAddress, id: 2, isDefault: false };
      service.addresses.set([address1, address2]);

      // Act
      service.setDefault(2).subscribe(() => {
        // Assert
        expect(service.addresses()[0].isDefault).toBe(false);
        expect(service.addresses()[1].isDefault).toBe(true);
        expect(service.isLoading()).toBe(false);
        done();
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/2/default`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});

      req.flush({ ...address2, isDefault: true });
    });

    it('should set error on failure', (done) => {
      // Act
      service.setDefault(1).subscribe({
        error: () => {
          // Assert
          expect(service.error()).toBe('Failed to set default address');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/1/default`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('loadGovernorates', () => {
    it('should load governorates and update signal', (done) => {
      // Arrange
      const governorates = [mockGovernorate];

      // Act
      service.loadGovernorates();

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/governorates`);
      expect(req.request.method).toBe('GET');
      expect(service.isLoading()).toBe(true);

      req.flush(governorates);

      setTimeout(() => {
        expect(service.governorates()).toEqual(governorates);
        expect(service.isLoading()).toBe(false);
        done();
      }, 0);
    });

    it('should set error on failure', (done) => {
      // Act
      service.loadGovernorates();

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/governorates`);
      req.error(new ErrorEvent('Network error'));

      setTimeout(() => {
        expect(service.error()).toBe('Failed to load governorates');
        done();
      }, 0);
    });
  });

  describe('loadCities', () => {
    it('should load cities for governorate and update signal', (done) => {
      // Arrange
      const governorateId = 1;
      const cities = [mockCity];

      // Act
      service.loadCities(governorateId);

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/governorates/${governorateId}/cities`);
      expect(req.request.method).toBe('GET');
      expect(service.isLoading()).toBe(true);

      req.flush(cities);

      setTimeout(() => {
        expect(service.cities()).toEqual(cities);
        expect(service.isLoading()).toBe(false);
        done();
      }, 0);
    });

    it('should set error on failure', (done) => {
      // Act
      service.loadCities(1);

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/governorates/1/cities`);
      req.error(new ErrorEvent('Network error'));

      setTimeout(() => {
        expect(service.error()).toBe('Failed to load cities');
        done();
      }, 0);
    });
  });

  describe('loadDistricts', () => {
    it('should load districts for city and update signal', (done) => {
      // Arrange
      const cityId = 5;
      const districts = [mockDistrict];

      // Act
      service.loadDistricts(cityId);

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/cities/${cityId}/districts`);
      expect(req.request.method).toBe('GET');
      expect(service.isLoading()).toBe(true);

      req.flush(districts);

      setTimeout(() => {
        expect(service.districts()).toEqual(districts);
        expect(service.isLoading()).toBe(false);
        done();
      }, 0);
    });

    it('should set error on failure', (done) => {
      // Act
      service.loadDistricts(5);

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/cities/5/districts`);
      req.error(new ErrorEvent('Network error'));

      setTimeout(() => {
        expect(service.error()).toBe('Failed to load districts');
        done();
      }, 0);
    });
  });

  describe('clearCities', () => {
    it('should clear cities signal', () => {
      // Arrange
      service.cities.set([mockCity]);

      // Act
      service.clearCities();

      // Assert
      expect(service.cities()).toEqual([]);
    });
  });

  describe('clearDistricts', () => {
    it('should clear districts signal', () => {
      // Arrange
      service.districts.set([mockDistrict]);

      // Act
      service.clearDistricts();

      // Assert
      expect(service.districts()).toEqual([]);
    });
  });

  describe('Signal Management', () => {
    it('should initialize all signals with default values', () => {
      // Assert
      expect(service.addresses()).toEqual([]);
      expect(service.governorates()).toEqual([]);
      expect(service.cities()).toEqual([]);
      expect(service.districts()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should maintain signal state across multiple operations', () => {
      // Arrange
      const addresses = [mockAddress];
      const governorates = [mockGovernorate];
      service.addresses.set(addresses);
      service.governorates.set(governorates);

      // Act
      service.clearCities();

      // Assert
      expect(service.addresses()).toEqual(addresses);
      expect(service.governorates()).toEqual(governorates);
      expect(service.cities()).toEqual([]);
    });
  });

  describe('Error Signal', () => {
    it('should clear error on successful operations', (done) => {
      // Arrange
      service.error.set('Previous error');

      // Act
      service.loadAddresses();

      const req = httpMock.expectOne(baseUrl);
      req.flush([]);

      setTimeout(() => {
        // Assert
        expect(service.error()).toBeNull();
        done();
      }, 0);
    });

    it('should set different error messages for different failures', (done) => {
      // Act
      service.loadGovernorates();

      const req = httpMock.expectOne(`${baseUrl}/governorates`);
      req.error(new ErrorEvent('Network error'));

      setTimeout(() => {
        expect(service.error()).toBe('Failed to load governorates');

        // Now test another error
        service.loadCities(1);
        const req2 = httpMock.expectOne(`${baseUrl}/governorates/1/cities`);
        req2.error(new ErrorEvent('Network error'));

        setTimeout(() => {
          expect(service.error()).toBe('Failed to load cities');
          done();
        }, 0);
      }, 0);
    });
  });
});
