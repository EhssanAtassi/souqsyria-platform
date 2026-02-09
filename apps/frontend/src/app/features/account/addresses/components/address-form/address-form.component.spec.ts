/**
 * @file address-form.component.spec.ts
 * @description Unit tests for Address Form Component
 *
 * Tests cover:
 * - Form creation with proper validators
 * - Phone validation (valid/invalid formats)
 * - Required field validation
 * - Max length validation
 * - Form population in edit mode
 * - Create vs Edit mode submission
 * - Form cancellation
 * - Error message generation
 * - Cascading dropdown integration
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Pipe, PipeTransform, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AddressFormComponent } from './address-form.component';
import { GovernorateDropdownComponent } from '../governorate-dropdown/governorate-dropdown.component';
import { AddressApiService } from '../../services/address-api.service';
import { AddressResponse } from '../../interfaces/address.interface';
import { of } from 'rxjs';

@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('AddressFormComponent', () => {
  let component: AddressFormComponent;
  let fixture: ComponentFixture<AddressFormComponent>;
  let mockAddressService: jasmine.SpyObj<AddressApiService> & { addresses: any; governorates: any; cities: any; districts: any; isLoading: any; error: any };

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
    governorate: { id: 1, code: 'DM', nameEn: 'Damascus', nameAr: 'دمشق', displayOrder: 1 },
    syrianCity: { id: 5, nameEn: 'Damascus City', nameAr: 'دمشق', displayOrder: 1 },
    district: { id: 10, nameEn: 'Al-Mezzeh', nameAr: 'المزة', displayOrder: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockAddressService = {
      addresses: signal([]),
      governorates: signal([]),
      cities: signal([]),
      districts: signal([]),
      isLoading: signal(false),
      error: signal(null),
      createAddress: jasmine.createSpy('createAddress').and.returnValue(of(mockAddress)),
      updateAddress: jasmine.createSpy('updateAddress').and.returnValue(of(mockAddress)),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        AddressFormComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule,
        MatButtonToggleModule,
        MatIconModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule,
        MockTranslatePipe,
      ],
      providers: [
        FormBuilder,
        { provide: AddressApiService, useValue: mockAddressService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AddressFormComponent, {
        remove: { imports: [TranslateModule, GovernorateDropdownComponent] },
        add: { imports: [MockTranslatePipe], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddressFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should create form with all required validators', () => {
      // Assert
      expect(component.form).toBeDefined();
      expect(component.form.get('fullName')).toBeDefined();
      expect(component.form.get('phone')).toBeDefined();
      expect(component.form.get('governorateId')).toBeDefined();
      expect(component.form.get('cityId')).toBeDefined();
      expect(component.form.get('street')).toBeDefined();
    });

    it('should have required validators on mandatory fields', () => {
      // Assert
      const requiredFields = ['fullName', 'phone', 'governorateId', 'cityId', 'street'];
      requiredFields.forEach((field) => {
        const control = component.form.get(field);
        expect(control?.hasError('required')).toBe(true);
      });
    });

    it('should have optional district field', () => {
      // Assert
      const districtControl = component.form.get('districtId');
      expect(districtControl?.value).toBeNull();
      expect(districtControl?.hasError('required')).toBe(false);
    });

    it('should initialize with create mode', () => {
      // Assert
      expect(component.mode()).toBe('create');
    });

    it('should initialize with no editing address', () => {
      // Assert
      expect(component.address()).toBeUndefined();
    });
  });

  describe('Phone Validation', () => {
    it('should accept valid Syrian phone format', () => {
      // Arrange
      const phoneControl = component.form.get('phone');

      // Act
      phoneControl?.setValue('+963912345678');

      // Assert
      expect(phoneControl?.hasError('pattern')).toBe(false);
      expect(phoneControl?.valid).toBe(true);
    });

    it('should reject invalid phone format', () => {
      // Arrange
      const phoneControl = component.form.get('phone');

      // Act
      phoneControl?.setValue('0912345678');

      // Assert
      expect(phoneControl?.hasError('pattern')).toBe(true);
    });

    it('should reject phone with wrong country code', () => {
      // Arrange
      const phoneControl = component.form.get('phone');

      // Act
      phoneControl?.setValue('+966912345678');

      // Assert
      expect(phoneControl?.hasError('pattern')).toBe(true);
    });

    it('should reject phone with insufficient digits', () => {
      // Arrange
      const phoneControl = component.form.get('phone');

      // Act
      phoneControl?.setValue('+9639123456');

      // Assert
      expect(phoneControl?.hasError('pattern')).toBe(true);
    });

    it('should reject phone without +963 prefix', () => {
      // Arrange
      const phoneControl = component.form.get('phone');

      // Act
      phoneControl?.setValue('963912345678');

      // Assert
      expect(phoneControl?.hasError('pattern')).toBe(true);
    });
  });

  describe('Required Field Validation', () => {
    it('should show error for empty fullName when touched', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');

      // Act
      fullNameControl?.markAsTouched();

      // Assert
      expect(component.hasError('fullName', 'required')).toBe(true);
    });

    it('should not show error for empty fullName when not touched', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');

      // Assert
      expect(component.hasError('fullName', 'required')).toBe(false);
    });

    it('should show error for empty phone', () => {
      // Arrange
      const phoneControl = component.form.get('phone');

      // Act
      phoneControl?.markAsTouched();

      // Assert
      expect(component.hasError('phone', 'required')).toBe(true);
    });

    it('should show error for empty street', () => {
      // Arrange
      const streetControl = component.form.get('street');

      // Act
      streetControl?.markAsTouched();

      // Assert
      expect(component.hasError('street', 'required')).toBe(true);
    });
  });

  describe('Max Length Validation', () => {
    it('should reject fullName exceeding 128 characters', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');
      const longName = 'a'.repeat(129);

      // Act
      fullNameControl?.setValue(longName);

      // Assert
      expect(fullNameControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept fullName at max length', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');
      const maxName = 'a'.repeat(128);

      // Act
      fullNameControl?.setValue(maxName);

      // Assert
      expect(fullNameControl?.hasError('maxlength')).toBe(false);
    });

    it('should reject street exceeding 128 characters', () => {
      // Arrange
      const streetControl = component.form.get('street');
      const longStreet = 'a'.repeat(129);

      // Act
      streetControl?.setValue(longStreet);

      // Assert
      expect(streetControl?.hasError('maxlength')).toBe(true);
    });

    it('should reject building exceeding 64 characters', () => {
      // Arrange
      const buildingControl = component.form.get('building');
      const longBuilding = 'a'.repeat(65);

      // Act
      buildingControl?.setValue(longBuilding);

      // Assert
      expect(buildingControl?.hasError('maxlength')).toBe(true);
    });

    it('should reject additionalDetails exceeding 256 characters', () => {
      // Arrange
      const detailsControl = component.form.get('additionalDetails');
      const longDetails = 'a'.repeat(257);

      // Act
      detailsControl?.setValue(longDetails);

      // Assert
      expect(detailsControl?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Edit Mode - Form Population', () => {
    it('should populate form with address data in edit mode', () => {
      // Arrange
      const formInputComponent = TestBed.createComponent(AddressFormComponent);
      formInputComponent.componentRef.setInput('address', mockAddress);
      formInputComponent.detectChanges();

      const component = formInputComponent.componentInstance;

      // Assert
      expect(component.form.get('fullName')?.value).toBe(mockAddress.fullName);
      expect(component.form.get('phone')?.value).toBe(mockAddress.phone);
      expect(component.form.get('street')?.value).toBe(mockAddress.addressLine1);
      expect(component.form.get('building')?.value).toBe(mockAddress.building);
      expect(component.form.get('floor')?.value).toBe(mockAddress.floor);
      expect(component.form.get('label')?.value).toBe(mockAddress.label);
    });

    it('should set cascading dropdown selections from address', () => {
      // Arrange
      const formInputComponent = TestBed.createComponent(AddressFormComponent);
      formInputComponent.componentRef.setInput('address', mockAddress);
      formInputComponent.detectChanges();

      const component = formInputComponent.componentInstance;

      // Assert
      expect(component.selectedGovernorateId()).toBe(mockAddress.governorate?.id);
      expect(component.selectedCityId()).toBe(mockAddress.syrianCity?.id);
      expect(component.selectedDistrictId()).toBe(mockAddress.district?.id);
    });
  });

  describe('Form Submission', () => {
    it('should not submit when form is invalid', () => {
      // Act
      component.onSubmit();

      // Assert
      expect(mockAddressService.createAddress).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });

    it('should create address in create mode', () => {
      // Arrange
      component.form.patchValue({
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorateId: 1,
        cityId: 5,
        street: 'شارع الثورة',
        label: 'home',
      });

      const savedSpy = spyOn(component.saved, 'emit');

      // Act
      component.onSubmit();

      // Assert - mock returns synchronous observable, so isSubmitting resets to false
      expect(component.isSubmitting()).toBe(false);
      expect(mockAddressService.createAddress).toHaveBeenCalled();
      expect(savedSpy).toHaveBeenCalled();
      savedSpy.calls.reset();
    });

    it('should update address in edit mode', () => {
      // Arrange
      const editComponent = TestBed.createComponent(AddressFormComponent);
      editComponent.componentRef.setInput('address', mockAddress);
      editComponent.componentRef.setInput('mode', 'edit');
      editComponent.detectChanges();

      const component = editComponent.componentInstance;
      component.form.patchValue({
        fullName: 'محمد أحمد',
      });

      const savedSpy = spyOn(component.saved, 'emit');

      // Act
      component.onSubmit();

      // Assert
      expect(mockAddressService.updateAddress).toHaveBeenCalledWith(
        mockAddress.id,
        jasmine.any(Object),
      );
      savedSpy.calls.reset();
    });

    it('should emit saved event on successful creation', (done) => {
      // Arrange
      component.form.patchValue({
        fullName: 'أحمد محمد',
        phone: '+963912345678',
        governorateId: 1,
        cityId: 5,
        street: 'شارع الثورة',
      });

      component.saved.subscribe(() => {
        // Assert
        expect(component.isSubmitting()).toBe(false);
        done();
      });

      // Act
      component.onSubmit();
    });
  });

  describe('Form Cancellation', () => {
    it('should emit cancelled event on cancel', () => {
      // Arrange
      const cancelledSpy = spyOn(component.cancelled, 'emit');

      // Act
      component.onCancel();

      // Assert
      expect(cancelledSpy).toHaveBeenCalled();
      cancelledSpy.calls.reset();
    });
  });

  describe('Dropdown Integration', () => {
    it('should update governorate and clear dependent fields', () => {
      // Act
      component.onGovernorateChange(1);

      // Assert
      expect(component.selectedGovernorateId()).toBe(1);
      expect(component.form.get('governorateId')?.value).toBe(1);
      expect(component.form.get('cityId')?.value).toBeNull();
      expect(component.form.get('districtId')?.value).toBeNull();
    });

    it('should update city and clear district field', () => {
      // Act
      component.onCityChange(5);

      // Assert
      expect(component.selectedCityId()).toBe(5);
      expect(component.form.get('cityId')?.value).toBe(5);
      expect(component.form.get('districtId')?.value).toBeNull();
    });

    it('should update district', () => {
      // Act
      component.onDistrictChange(10);

      // Assert
      expect(component.selectedDistrictId()).toBe(10);
      expect(component.form.get('districtId')?.value).toBe(10);
    });
  });

  describe('Error Message Handling', () => {
    it('should return error message key for required error', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');
      fullNameControl?.markAsTouched();

      // Act
      const errorMsg = component.getErrorMessage('fullName');

      // Assert
      expect(errorMsg).toContain('fullName');
      expect(errorMsg).toContain('Required');
    });

    it('should return error message key for pattern error', () => {
      // Arrange
      const phoneControl = component.form.get('phone');
      phoneControl?.setValue('invalid');
      phoneControl?.markAsTouched();

      // Act
      const errorMsg = component.getErrorMessage('phone');

      // Assert
      expect(errorMsg).toContain('phone');
      expect(errorMsg).toContain('Invalid');
    });

    it('should return empty string for valid control', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');
      fullNameControl?.setValue('أحمد محمد');
      fullNameControl?.markAsTouched();

      // Act
      const errorMsg = component.getErrorMessage('fullName');

      // Assert
      expect(errorMsg).toBe('');
    });

    it('should return empty string for untouched control', () => {
      // Arrange
      const fullNameControl = component.form.get('fullName');

      // Act
      const errorMsg = component.getErrorMessage('fullName');

      // Assert
      expect(errorMsg).toBe('');
    });
  });

  describe('Label Options', () => {
    it('should have predefined label options', () => {
      // Assert
      expect(component.labelOptions).toEqual(['home', 'work', 'family', 'other']);
    });

    it('should set default label to home', () => {
      // Assert
      expect(component.form.get('label')?.value).toBe('home');
    });
  });
});
