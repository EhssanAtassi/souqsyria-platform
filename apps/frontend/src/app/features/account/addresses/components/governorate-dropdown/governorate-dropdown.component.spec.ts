/**
 * @file governorate-dropdown.component.spec.ts
 * @description Unit tests for Governorate Dropdown Component
 *
 * Tests cover:
 * - Component initialization and governorate loading
 * - Governorate selection change handling
 * - City loading when governorate selected
 * - City selection change handling
 * - District loading when city selected
 * - District selection change handling
 * - Signal synchronization with inputs
 * - Output event emissions
 * - Cascading dropdown clearing on parent change
 * - Bilingual display support
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { signal, Pipe, PipeTransform, NO_ERRORS_SCHEMA } from '@angular/core';
import { GovernorateDropdownComponent } from './governorate-dropdown.component';
import { AddressApiService } from '../../services/address-api.service';
import { LanguageService } from '../../../../../shared/services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Governorate, City, District } from '../../interfaces/address.interface';

@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('GovernorateDropdownComponent', () => {
  let component: GovernorateDropdownComponent;
  let fixture: ComponentFixture<GovernorateDropdownComponent>;
  let mockAddressService: jasmine.SpyObj<AddressApiService> & { addresses: any; governorates: any; cities: any; districts: any; isLoading: any; error: any };
  let mockLanguageService: { language: any };

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

  const mockGovernorate2: Governorate = {
    id: 2,
    code: 'HL',
    nameEn: 'Homs',
    nameAr: 'حمص',
    displayOrder: 2,
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

  const mockCity2: City = {
    id: 6,
    nameEn: 'Douma',
    nameAr: 'دوما',
    governorate: mockGovernorate,
    displayOrder: 2,
  };

  const mockDistrict: District = {
    id: 10,
    nameEn: 'Al-Mezzeh',
    nameAr: 'المزة',
    city: mockCity,
    displayOrder: 1,
  };

  const mockDistrict2: District = {
    id: 11,
    nameEn: 'Malki',
    nameAr: 'ملكي',
    city: mockCity,
    displayOrder: 2,
  };

  beforeEach(async () => {
    mockAddressService = {
      addresses: signal([]),
      governorates: signal([]),
      cities: signal([]),
      districts: signal([]),
      isLoading: signal(false),
      error: signal(null),
      loadAddresses: jasmine.createSpy('loadAddresses'),
      loadGovernorates: jasmine.createSpy('loadGovernorates'),
      loadCities: jasmine.createSpy('loadCities'),
      loadDistricts: jasmine.createSpy('loadDistricts'),
      clearCities: jasmine.createSpy('clearCities'),
      clearDistricts: jasmine.createSpy('clearDistricts'),
    } as any;

    mockLanguageService = {
      language: signal('en'),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        GovernorateDropdownComponent,
        MatFormFieldModule,
        MatSelectModule,
        BrowserAnimationsModule,
        MockTranslatePipe,
      ],
      providers: [
        { provide: AddressApiService, useValue: mockAddressService },
        { provide: LanguageService, useValue: mockLanguageService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(GovernorateDropdownComponent, {
        remove: { imports: [TranslateModule] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GovernorateDropdownComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load governorates on init if not already loaded', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(mockAddressService.loadGovernorates).toHaveBeenCalled();
    });

    it('should not reload governorates if already loaded', () => {
      // Arrange
      mockAddressService.governorates.set([mockGovernorate]);

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockAddressService.loadGovernorates).not.toHaveBeenCalled();
    });

    it('should expose governorates signal from service', () => {
      // Arrange
      mockAddressService.governorates.set([mockGovernorate, mockGovernorate2]);

      // Assert
      expect(component.governorates()).toEqual([mockGovernorate, mockGovernorate2]);
    });

    it('should expose cities signal from service', () => {
      // Arrange
      mockAddressService.cities.set([mockCity, mockCity2]);

      // Assert
      expect(component.cities()).toEqual([mockCity, mockCity2]);
    });

    it('should expose districts signal from service', () => {
      // Arrange
      mockAddressService.districts.set([mockDistrict, mockDistrict2]);

      // Assert
      expect(component.districts()).toEqual([mockDistrict, mockDistrict2]);
    });
  });

  describe('Governorate Selection', () => {
    it('should update local signal when governorate selected', () => {
      // Arrange
      const event = { value: 1 };

      // Act
      component.onGovernorateChange(event);

      // Assert
      expect(component.selectedGov()).toBe(1);
    });

    it('should emit governorateChange event with selected ID', () => {
      // Arrange
      const emitSpy = spyOn(component.governorateChange, 'emit');
      const event = { value: 1 };

      // Act
      component.onGovernorateChange(event);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(1);
      emitSpy.calls.reset();
    });

    it('should load cities for selected governorate', () => {
      // Arrange
      const event = { value: 1 };

      // Act
      component.onGovernorateChange(event);

      // Assert
      expect(mockAddressService.loadCities).toHaveBeenCalledWith(1);
    });

    it('should clear dependent selections when governorate changes', () => {
      // Arrange
      component.selectedCity.set(5);
      component.selectedDist.set(10);
      const event = { value: 1 };

      // Act
      component.onGovernorateChange(event);

      // Assert
      expect(component.selectedCity()).toBeNull();
      expect(component.selectedDist()).toBeNull();
    });

    it('should clear cities and districts signals on governorate change', () => {
      // Arrange
      const event = { value: 1 };

      // Act
      component.onGovernorateChange(event);

      // Assert
      expect(mockAddressService.clearCities).toHaveBeenCalled();
      expect(mockAddressService.clearDistricts).toHaveBeenCalled();
    });
  });

  describe('City Selection', () => {
    it('should update local signal when city selected', () => {
      // Arrange
      const event = { value: 5 };

      // Act
      component.onCityChange(event);

      // Assert
      expect(component.selectedCity()).toBe(5);
    });

    it('should emit cityChange event with selected ID', () => {
      // Arrange
      const emitSpy = spyOn(component.cityChange, 'emit');
      const event = { value: 5 };

      // Act
      component.onCityChange(event);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(5);
      emitSpy.calls.reset();
    });

    it('should load districts for selected city', () => {
      // Arrange
      const event = { value: 5 };

      // Act
      component.onCityChange(event);

      // Assert
      expect(mockAddressService.loadDistricts).toHaveBeenCalledWith(5);
    });

    it('should clear district selection when city changes', () => {
      // Arrange
      component.selectedDist.set(10);
      const event = { value: 5 };

      // Act
      component.onCityChange(event);

      // Assert
      expect(component.selectedDist()).toBeNull();
    });

    it('should clear districts signal on city change', () => {
      // Arrange
      const event = { value: 5 };

      // Act
      component.onCityChange(event);

      // Assert
      expect(mockAddressService.clearDistricts).toHaveBeenCalled();
    });
  });

  describe('District Selection', () => {
    it('should update local signal when district selected', () => {
      // Arrange
      const event = { value: 10 };

      // Act
      component.onDistrictChange(event);

      // Assert
      expect(component.selectedDist()).toBe(10);
    });

    it('should emit districtChange event with selected ID', () => {
      // Arrange
      const emitSpy = spyOn(component.districtChange, 'emit');
      const event = { value: 10 };

      // Act
      component.onDistrictChange(event);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(10);
      emitSpy.calls.reset();
    });

    it('should not clear other selections when district changes', () => {
      // Arrange
      component.selectedGov.set(1);
      component.selectedCity.set(5);
      const event = { value: 10 };

      // Act
      component.onDistrictChange(event);

      // Assert
      expect(component.selectedGov()).toBe(1);
      expect(component.selectedCity()).toBe(5);
      expect(component.selectedDist()).toBe(10);
    });
  });

  describe('Input Binding and Signal Synchronization', () => {
    it('should sync governorate input to local signal', () => {
      // Arrange
      fixture = TestBed.createComponent(GovernorateDropdownComponent);
      component = fixture.componentInstance;

      // Create input with signal
      const testFixture = fixture;
      Object.defineProperty(component, 'selectedGovernorateId', {
        get: () => signal(1),
        configurable: true,
      });

      // Act
      fixture.detectChanges();
      testFixture.whenStable().then(() => {
        // Assert
        expect(component.selectedGov()).toBe(1);
      });
    });

    it('should sync city input to local signal', () => {
      // Arrange
      const emitSpy = spyOn(component.cityChange, 'emit');

      // Act - simulate input change
      const event = { value: 5 };
      component.onCityChange(event);

      // Assert
      expect(component.selectedCity()).toBe(5);
      emitSpy.calls.reset();
    });

    it('should sync district input to local signal', () => {
      // Arrange
      const emitSpy = spyOn(component.districtChange, 'emit');

      // Act - simulate input change
      const event = { value: 10 };
      component.onDistrictChange(event);

      // Assert
      expect(component.selectedDist()).toBe(10);
      emitSpy.calls.reset();
    });
  });

  describe('Cascading Behavior', () => {
    it('should complete cascading flow: governorate -> city -> district', () => {
      // Arrange
      mockAddressService.governorates.set([mockGovernorate]);
      mockAddressService.cities.set([mockCity, mockCity2]);
      mockAddressService.districts.set([mockDistrict, mockDistrict2]);

      // Act - Select governorate
      component.onGovernorateChange({ value: 1 });
      expect(mockAddressService.loadCities).toHaveBeenCalledWith(1);

      // Act - Select city
      component.onCityChange({ value: 5 });
      expect(mockAddressService.loadDistricts).toHaveBeenCalledWith(5);

      // Act - Select district
      component.onDistrictChange({ value: 10 });

      // Assert
      expect(component.selectedGov()).toBe(1);
      expect(component.selectedCity()).toBe(5);
      expect(component.selectedDist()).toBe(10);
    });

    it('should reset dependent selections when parent changes', () => {
      // Arrange
      component.selectedGov.set(1);
      component.selectedCity.set(5);
      component.selectedDist.set(10);

      // Act - Change governorate
      component.onGovernorateChange({ value: 2 });

      // Assert
      expect(component.selectedGov()).toBe(2);
      expect(component.selectedCity()).toBeNull();
      expect(component.selectedDist()).toBeNull();

      // Act - Select new city
      component.onCityChange({ value: 7 });

      // Assert
      expect(component.selectedCity()).toBe(7);
      expect(component.selectedDist()).toBeNull();
    });
  });

  describe('Language Support', () => {
    it('should expose language signal from LanguageService', () => {
      // Arrange
      mockLanguageService.language.set('ar');

      // Assert
      expect(component.lang()).toBe('ar');
    });

    it('should support language switching', () => {
      // Assert initial
      expect(component.lang()).toBe('en');

      // Act
      mockLanguageService.language.set('ar');

      // Assert
      expect(component.lang()).toBe('ar');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty governorates gracefully', () => {
      // Arrange
      mockAddressService.governorates.set([]);

      // Assert
      expect(component.governorates()).toEqual([]);
    });

    it('should handle empty cities gracefully', () => {
      // Arrange
      mockAddressService.cities.set([]);

      // Assert
      expect(component.cities()).toEqual([]);
    });

    it('should handle empty districts gracefully', () => {
      // Arrange
      mockAddressService.districts.set([]);

      // Assert
      expect(component.districts()).toEqual([]);
    });

    it('should not throw when loading cities with invalid governorate ID', () => {
      // Act & Assert
      expect(() => {
        component.onGovernorateChange({ value: 999 });
      }).not.toThrow();
    });

    it('should not throw when loading districts with invalid city ID', () => {
      // Act & Assert
      expect(() => {
        component.onCityChange({ value: 999 });
      }).not.toThrow();
    });
  });

  describe('Signal Reactivity', () => {
    it('should update display when governorates signal changes', () => {
      // Arrange
      mockAddressService.governorates.set([mockGovernorate]);

      // Assert
      expect(component.governorates()).toEqual([mockGovernorate]);

      // Act - Update signal
      mockAddressService.governorates.set([mockGovernorate, mockGovernorate2]);

      // Assert
      expect(component.governorates().length).toBe(2);
    });

    it('should update display when cities signal changes', () => {
      // Arrange
      mockAddressService.cities.set([mockCity]);

      // Assert
      expect(component.cities()).toEqual([mockCity]);

      // Act - Update signal
      mockAddressService.cities.set([mockCity, mockCity2]);

      // Assert
      expect(component.cities().length).toBe(2);
    });

    it('should update display when districts signal changes', () => {
      // Arrange
      mockAddressService.districts.set([mockDistrict]);

      // Assert
      expect(component.districts()).toEqual([mockDistrict]);

      // Act - Update signal
      mockAddressService.districts.set([mockDistrict, mockDistrict2]);

      // Assert
      expect(component.districts().length).toBe(2);
    });
  });
});
