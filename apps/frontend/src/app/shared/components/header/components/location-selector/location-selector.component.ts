import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '../../../../interfaces/navigation.interface';

/**
 * Location Selector Component
 *
 * @description Standalone location selector button with dropdown matching the prototype.
 * Displays "Deliver to" label with the selected city name and a dropdown arrow.
 * Opens a dropdown with available delivery locations on click.
 *
 * @swagger
 * components:
 *   schemas:
 *     LocationSelectorProps:
 *       type: object
 *       properties:
 *         selectedLocation:
 *           $ref: '#/components/schemas/Location'
 *         locations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Location'
 *         language:
 *           type: string
 *           enum: [en, ar]
 *
 * @example
 * ```html
 * <app-location-selector
 *   [selectedLocation]="currentLocation"
 *   [locations]="availableLocations"
 *   (locationChange)="onLocationChange($event)">
 * </app-location-selector>
 * ```
 */
@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-selector.component.html',
  styleUrl: './location-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationSelectorComponent {
  /** Currently selected delivery location */
  @Input() selectedLocation: Location | null = null;

  /** Available delivery locations */
  @Input() locations: Location[] = [];

  /** Current language */
  @Input() language: 'en' | 'ar' = 'en';

  /** Emitted when a location is selected */
  @Output() locationChange = new EventEmitter<Location>();

  /** Whether the dropdown is open */
  dropdownOpen = false;

  private readonly cdr = inject(ChangeDetectorRef);

  /** Get "Deliver to" label */
  get deliverToLabel(): string {
    return this.language === 'ar' ? 'التوصيل إلى' : 'Deliver to';
  }

  /** Get selected location display name */
  get locationName(): string {
    if (!this.selectedLocation) {
      return this.language === 'ar' ? 'اختر الموقع' : 'Select Location';
    }
    return this.language === 'ar'
      ? this.selectedLocation.nameAr
      : this.selectedLocation.name;
  }

  /** Get dropdown title */
  get dropdownTitle(): string {
    return this.language === 'ar' ? 'اختر موقع التوصيل' : 'Select Delivery Location';
  }

  /**
   * Toggle dropdown visibility
   * @description Opens or closes the location dropdown
   */
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    this.cdr.markForCheck();
  }

  /**
   * Close dropdown
   * @description Closes the dropdown (called on blur)
   */
  closeDropdown(): void {
    setTimeout(() => {
      this.dropdownOpen = false;
      this.cdr.markForCheck();
    }, 200);
  }

  /**
   * Select a location
   * @description Sets the selected location and emits change event
   * @param location - The location to select
   */
  selectLocation(location: Location): void {
    this.selectedLocation = location;
    this.locationChange.emit(location);
    this.dropdownOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Get localized location name
   * @description Returns the location name in the current language
   * @param location - Location to get name for
   * @returns Localized name string
   */
  getLocationName(location: Location): string {
    return this.language === 'ar' ? location.nameAr : location.name;
  }
}
