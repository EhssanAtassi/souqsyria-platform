/**
 * @file address-list.component.spec.ts
 * @description Unit tests for Address List Page Component
 *
 * Tests cover:
 * - Component initialization and address loading
 * - Empty state rendering
 * - Address list rendering
 * - Form visibility and mode toggling
 * - Edit mode with address population
 * - Delete confirmation dialog integration
 * - Default address setting
 * - Helper methods (getLabelIcon, getFullAddress, getBuildingFloorInfo)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AddressListComponent } from './address-list.component';
import { AddressApiService } from '../../services/address-api.service';
import { LanguageService } from '../../../../../shared/services/language.service';
import { AddressResponse, Governorate, City, District } from '../../interfaces/address.interface';
import { DeleteConfirmationDialogComponent } from '../../components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { signal, Pipe, PipeTransform, NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('AddressListComponent', () => {
  let component: AddressListComponent;
  let fixture: ComponentFixture<AddressListComponent>;
  let mockAddressService: jasmine.SpyObj<AddressApiService> & { addresses: any; governorates: any; cities: any; districts: any; isLoading: any; error: any };
  let mockLanguageService: { language: any };
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockGovernorate: Governorate = {
    id: 1,
    code: 'DM',
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    displayOrder: 1,
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

  beforeEach(async () => {
    mockAddressService = {
      addresses: signal<AddressResponse[]>([]),
      governorates: signal([]),
      cities: signal([]),
      districts: signal([]),
      isLoading: signal(false),
      error: signal(null),
      loadAddresses: jasmine.createSpy('loadAddresses'),
      deleteAddress: jasmine.createSpy('deleteAddress').and.returnValue(of(void 0)),
      setDefault: jasmine.createSpy('setDefault').and.returnValue(of(void 0)),
    } as any;

    mockLanguageService = {
      language: signal('en'),
    } as any;

    mockDialog = {
      open: jasmine.createSpy('open'),
    } as any;

    await TestBed.configureTestingModule({
      imports: [AddressListComponent, MockTranslatePipe, NoopAnimationsModule],
      providers: [
        { provide: AddressApiService, useValue: mockAddressService },
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: MatDialog, useValue: mockDialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AddressListComponent, {
        remove: { imports: [TranslateModule, MatDialogModule] },
        add: { imports: [MockTranslatePipe] },
      })
      .overrideComponent(DeleteConfirmationDialogComponent, {
        set: {
          imports: [MockTranslatePipe],
          template: '<div>mock dialog</div>',
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddressListComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load addresses on init', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(mockAddressService.loadAddresses).toHaveBeenCalled();
    });

    it('should initialize with form hidden', () => {
      // Assert
      expect(component.showForm()).toBe(false);
    });

    it('should initialize with no editing address', () => {
      // Assert
      expect(component.editingAddress()).toBeUndefined();
    });

    it('should initialize with create mode', () => {
      // Assert
      expect(component.formMode()).toBe('create');
    });
  });

  describe('Form Visibility and Mode', () => {
    it('should show form in create mode on add new', () => {
      // Act
      component.onAddNewAddress();

      // Assert
      expect(component.showForm()).toBe(true);
      expect(component.editingAddress()).toBeUndefined();
      expect(component.formMode()).toBe('create');
    });

    it('should show form in edit mode when editing', () => {
      // Act
      component.onEditAddress(mockAddress);

      // Assert
      expect(component.showForm()).toBe(true);
      expect(component.editingAddress()).toEqual(mockAddress);
      expect(component.formMode()).toBe('edit');
    });

    it('should hide form on cancel', () => {
      // Arrange
      component.showForm.set(true);
      component.editingAddress.set(mockAddress);

      // Act
      component.onFormCancelled();

      // Assert
      expect(component.showForm()).toBe(false);
      expect(component.editingAddress()).toBeUndefined();
    });

    it('should hide form and reload addresses on save', () => {
      // Arrange
      component.showForm.set(true);
      component.editingAddress.set(mockAddress);

      // Act
      component.onFormSaved();

      // Assert
      expect(component.showForm()).toBe(false);
      expect(component.editingAddress()).toBeUndefined();
      expect(mockAddressService.loadAddresses).toHaveBeenCalled();
    });
  });

  describe('Address List Display', () => {
    it('should show empty state when no addresses', () => {
      // Assert
      expect(component.isEmpty()).toBe(true);
    });

    it('should show addresses when available', () => {
      // Arrange
      mockAddressService.addresses.set([mockAddress]);

      // Assert
      expect(component.isEmpty()).toBe(false);
      expect(component.addresses().length).toBe(1);
    });

    it('should update addresses from service signal', () => {
      // Arrange
      const addresses = [mockAddress, { ...mockAddress, id: 2, isDefault: false }];
      mockAddressService.addresses.set(addresses);

      // Assert
      expect(component.addresses()).toEqual(addresses);
    });
  });

  describe('Delete Address', () => {
    it('should open delete confirmation dialog', () => {
      // Arrange
      const mockDialogRef = {
        afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(false)),
      } as unknown as MatDialogRef<any>;
      (mockDialog.open as jasmine.Spy).and.returnValue(mockDialogRef);

      // Act
      component.onDeleteAddress(mockAddress);

      // Assert
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = (mockDialog.open as jasmine.Spy).calls.first().args[1]?.data;
      expect(dialogData).toEqual(jasmine.objectContaining({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: false,
      }));
    });

    it('should pass isOnlyAddress flag when user has one address', () => {
      // Arrange
      mockAddressService.addresses.set([mockAddress]);
      const mockDialogRef = {
        afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(false)),
      } as unknown as MatDialogRef<any>;
      (mockDialog.open as jasmine.Spy).and.returnValue(mockDialogRef);

      // Act
      component.onDeleteAddress(mockAddress);

      // Assert
      const dialogData = (mockDialog.open as jasmine.Spy).calls.first().args[1]?.data;
      expect(dialogData.isOnlyAddress).toBe(true);
    });

    it('should delete address when confirmed', () => {
      // Arrange
      const mockDialogRef = {
        afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(true)),
      } as unknown as MatDialogRef<any>;
      (mockDialog.open as jasmine.Spy).and.returnValue(mockDialogRef);
      (mockAddressService.deleteAddress as jasmine.Spy).and.returnValue(of(void 0));

      // Act
      component.onDeleteAddress(mockAddress);

      // Assert
      expect(mockAddressService.deleteAddress).toHaveBeenCalledWith(mockAddress.id);
    });

    it('should not delete address when cancelled', () => {
      // Arrange
      const mockDialogRef = {
        afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(false)),
      } as unknown as MatDialogRef<any>;
      (mockDialog.open as jasmine.Spy).and.returnValue(mockDialogRef);

      // Act
      component.onDeleteAddress(mockAddress);

      // Assert
      expect(mockAddressService.deleteAddress).not.toHaveBeenCalled();
    });
  });

  describe('Set Default Address', () => {
    it('should set address as default', () => {
      // Arrange
      const address = { ...mockAddress, isDefault: false };
      (mockAddressService.setDefault as jasmine.Spy).and.returnValue(of(void 0));

      // Act
      component.onSetDefault(address);

      // Assert
      expect(mockAddressService.setDefault).toHaveBeenCalledWith(address.id);
    });

    it('should not call service if already default', () => {
      // Arrange
      (mockAddressService.setDefault as jasmine.Spy).calls.reset();

      // Act
      component.onSetDefault(mockAddress);

      // Assert
      expect(mockAddressService.setDefault).not.toHaveBeenCalled();
    });

    it('should handle setDefault errors gracefully', () => {
      // Arrange
      const address = { ...mockAddress, isDefault: false };
      (mockAddressService.setDefault as jasmine.Spy).and.returnValue(
        throwError(() => new Error('API error'))
      );
      spyOn(console, 'error');

      // Act & Assert - should not throw
      expect(() => {
        component.onSetDefault(address);
      }).not.toThrow();
    });
  });

  describe('Helper Methods', () => {
    describe('getLabelIcon', () => {
      it('should return home icon for home label', () => {
        // Act
        const icon = component.getLabelIcon('home');

        // Assert
        expect(icon).toBe('home');
      });

      it('should return business icon for work label', () => {
        // Act
        const icon = component.getLabelIcon('work');

        // Assert
        expect(icon).toBe('business');
      });

      it('should return people icon for family label', () => {
        // Act
        const icon = component.getLabelIcon('family');

        // Assert
        expect(icon).toBe('people');
      });

      it('should return location_on icon for other label', () => {
        // Act
        const icon = component.getLabelIcon('other');

        // Assert
        expect(icon).toBe('location_on');
      });

      it('should return location_on icon for undefined label', () => {
        // Act
        const icon = component.getLabelIcon(undefined);

        // Assert
        expect(icon).toBe('location_on');
      });
    });

    describe('getFullAddress', () => {
      it('should format full address in English', () => {
        // Arrange
        mockLanguageService.language.set('en');

        // Act
        const fullAddress = component.getFullAddress(mockAddress);

        // Assert
        expect(fullAddress).toContain('Damascus');
        expect(fullAddress).toContain('Damascus City');
        expect(fullAddress).toContain('Al-Mezzeh');
        expect(fullAddress).toContain('شارع الثورة');
        expect(fullAddress).toContain('>');
      });

      it('should format full address in Arabic', () => {
        // Arrange
        mockLanguageService.language.set('ar');

        // Act
        const fullAddress = component.getFullAddress(mockAddress);

        // Assert
        expect(fullAddress).toContain('دمشق');
        expect(fullAddress).toContain('المزة');
      });

      it('should skip missing parts in address', () => {
        // Arrange
        const addressWithoutDistrict = { ...mockAddress, district: undefined };

        // Act
        const fullAddress = component.getFullAddress(addressWithoutDistrict);

        // Assert
        expect(fullAddress).toContain('Damascus');
        expect(fullAddress).toContain('Damascus City');
        expect(fullAddress).not.toContain('undefined');
      });

      it('should handle address with only street', () => {
        // Arrange
        const addressMinimal = {
          ...mockAddress,
          governorate: undefined,
          syrianCity: undefined,
          district: undefined,
        };

        // Act
        const fullAddress = component.getFullAddress(addressMinimal);

        // Assert
        expect(fullAddress).toBe('شارع الثورة');
      });
    });

    describe('getBuildingFloorInfo', () => {
      it('should format building and floor info', () => {
        // Act
        const info = component.getBuildingFloorInfo(mockAddress);

        // Assert
        expect(info).toContain('Building: بناء السلام');
        expect(info).toContain('Floor: 3');
        expect(info).toContain(',');
      });

      it('should show only building if floor is missing', () => {
        // Arrange
        const address = { ...mockAddress, floor: undefined };

        // Act
        const info = component.getBuildingFloorInfo(address);

        // Assert
        expect(info).toContain('Building: بناء السلام');
        expect(info).not.toContain('Floor');
      });

      it('should show only floor if building is missing', () => {
        // Arrange
        const address = { ...mockAddress, building: undefined };

        // Act
        const info = component.getBuildingFloorInfo(address);

        // Assert
        expect(info).toContain('Floor: 3');
        expect(info).not.toContain('Building');
      });

      it('should return empty string if both building and floor missing', () => {
        // Arrange
        const address = { ...mockAddress, building: undefined, floor: undefined };

        // Act
        const info = component.getBuildingFloorInfo(address);

        // Assert
        expect(info).toBe('');
      });
    });
  });

  describe('Signal Reactivity', () => {
    it('should update isEmpty when addresses change', () => {
      // Assert initial state
      expect(component.isEmpty()).toBe(true);

      // Act - add an address
      mockAddressService.addresses.set([mockAddress]);

      // Assert
      expect(component.isEmpty()).toBe(false);

      // Act - clear addresses
      mockAddressService.addresses.set([]);

      // Assert
      expect(component.isEmpty()).toBe(true);
    });

    it('should update formMode when editingAddress changes', () => {
      // Assert initial state
      expect(component.formMode()).toBe('create');

      // Act - set editing address
      component.editingAddress.set(mockAddress);

      // Assert
      expect(component.formMode()).toBe('edit');

      // Act - clear editing address
      component.editingAddress.set(undefined);

      // Assert
      expect(component.formMode()).toBe('create');
    });

    it('should track loading state from service', () => {
      // Assert initial state
      expect(component.isLoading()).toBe(false);

      // Act - set loading
      mockAddressService.isLoading.set(true);

      // Assert
      expect(component.isLoading()).toBe(true);

      // Act - clear loading
      mockAddressService.isLoading.set(false);

      // Assert
      expect(component.isLoading()).toBe(false);
    });
  });
});
