import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import {
  DeleteConfirmationDialogComponent,
  DeleteConfirmationData
} from './delete-confirmation-dialog.component';
import { AddressResponse } from '../../interfaces/address.interface';

/**
 * @description Unit tests for DeleteConfirmationDialogComponent
 * Tests dialog behavior, warning display, and user interaction handling
 */
describe('DeleteConfirmationDialogComponent', () => {
  let component: DeleteConfirmationDialogComponent;
  let fixture: ComponentFixture<DeleteConfirmationDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DeleteConfirmationDialogComponent>>;

  /** @description Mock address for standard deletion scenario */
  const mockAddress: AddressResponse = {
    id: 1,
    fullName: 'Ahmad Test',
    phone: '+963912345678',
    addressLine1: 'Damascus Street 123',
    building: 'Building A',
    floor: '3',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  /** @description Helper function to create component with specific data */
  const createComponentWithData = (data: DeleteConfirmationData): void => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(DeleteConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        DeleteConfirmationDialogComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            address: mockAddress,
            isDefault: false,
            isOnlyAddress: false
          } as DeleteConfirmationData
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data correctly', () => {
      expect(component.data).toBeDefined();
      expect(component.data.address).toEqual(mockAddress);
      expect(component.data.isDefault).toBe(false);
      expect(component.data.isOnlyAddress).toBe(false);
    });

    it('should inject dialog ref correctly', () => {
      expect(component.dialogRef).toBeDefined();
    });
  });

  describe('Address Display', () => {
    it('should display the address full name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addressHeader = compiled.querySelector('.address-header strong');
      expect(addressHeader?.textContent).toContain('Ahmad Test');
    });

    it('should display the address phone number', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addressLines = compiled.querySelectorAll('.address-line');
      const phoneElement = Array.from(addressLines).find(el =>
        el.textContent?.includes('+963912345678')
      );
      expect(phoneElement).toBeTruthy();
    });

    it('should display the address line', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addressLines = compiled.querySelectorAll('.address-line');
      const streetElement = Array.from(addressLines).find(el =>
        el.textContent?.includes('Damascus Street 123')
      );
      expect(streetElement).toBeTruthy();
    });

    it('should show default badge when address is default', () => {
      const defaultAddress: AddressResponse = { ...mockAddress, isDefault: true };
      createComponentWithData({
        address: defaultAddress,
        isDefault: true,
        isOnlyAddress: false
      });

      const compiled = fixture.nativeElement as HTMLElement;
      const defaultBadge = compiled.querySelector('.default-badge');
      expect(defaultBadge).toBeTruthy();
    });
  });

  describe('Warning Messages', () => {
    it('should display warning when deleting default address', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: false
      });

      const compiled = fixture.nativeElement as HTMLElement;
      const warningBoxes = compiled.querySelectorAll('.warning-box');
      expect(warningBoxes.length).toBeGreaterThan(0);
    });

    it('should display warning when deleting only address', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: false,
        isOnlyAddress: true
      });

      const compiled = fixture.nativeElement as HTMLElement;
      const warningBoxes = compiled.querySelectorAll('.warning-box');
      expect(warningBoxes.length).toBeGreaterThan(0);
    });

    it('should display multiple warnings when address is both default and only', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: true
      });

      const compiled = fixture.nativeElement as HTMLElement;
      const warningBoxes = compiled.querySelectorAll('.warning-box');
      expect(warningBoxes.length).toBe(2);
    });

    it('should not display warning boxes for standard deletion', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const warningBoxes = compiled.querySelectorAll('.warning-box');
      expect(warningBoxes.length).toBe(0);
    });
  });

  describe('Deletion Block Logic', () => {
    it('should not block deletion for standard address', () => {
      expect(component.isDeletionBlocked).toBe(false);
    });

    it('should block deletion when address is default', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: false
      });

      expect(component.isDeletionBlocked).toBe(true);
    });

    it('should block deletion when address is only address', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: false,
        isOnlyAddress: true
      });

      expect(component.isDeletionBlocked).toBe(true);
    });

    it('should block deletion when address is both default and only', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: true
      });

      expect(component.isDeletionBlocked).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should close dialog with true when confirm button is clicked', () => {
      component.onConfirm();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with false when cancel button is clicked', () => {
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should not close with true when confirm is clicked but deletion is blocked', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: false
      });

      component.onConfirm();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should disable confirm button when deletion is blocked', () => {
      createComponentWithData({
        address: mockAddress,
        isDefault: true,
        isOnlyAddress: false
      });

      const compiled = fixture.nativeElement as HTMLElement;
      const confirmButton = compiled.querySelector('button[color="warn"]') as HTMLButtonElement;
      expect(confirmButton.disabled).toBe(true);
    });

    it('should enable confirm button when deletion is not blocked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const confirmButton = compiled.querySelector('button[color="warn"]') as HTMLButtonElement;
      expect(confirmButton.disabled).toBe(false);
    });
  });

  describe('Button Click Events', () => {
    it('should trigger onCancel when cancel button is clicked', () => {
      spyOn(component, 'onCancel');
      const cancelButton: DebugElement = fixture.debugElement.query(
        By.css('button:not([color="warn"])')
      );

      cancelButton.nativeElement.click();
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should trigger onConfirm when confirm button is clicked', () => {
      spyOn(component, 'onConfirm');
      const confirmButton: DebugElement = fixture.debugElement.query(
        By.css('button[color="warn"]')
      );

      confirmButton.nativeElement.click();
      expect(component.onConfirm).toHaveBeenCalled();
    });
  });
});
