import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, DestroyRef, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, startWith } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SyrianDataService } from '../../services/syrian-data.service';
import { SyrianFormattersService } from '../../services/syrian-formatters.service';
import { SyrianGovernorate, SyrianRegion } from '../../interfaces/syrian-data.interface';

/**
 * Syrian Governorate Dropdown Component
 *
 * Provides a comprehensive dropdown for selecting Syrian governorates and regions
 * Supports bilingual display, search functionality, and shipping zone information
 * Integrates with Angular reactive forms and provides cultural context
 *
 * Features:
 * - Bilingual governorate and region names (Arabic/English)
 * - Search functionality with Arabic/English support
 * - Shipping zone and delivery time display
 * - Heritage indicators for cultural sites
 * - Reactive forms integration
 * - Loading states and error handling
 * - RTL support for Arabic interface
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianGovernorateDropdownComponent:
 *       type: object
 *       description: Dropdown component for Syrian geographical selection
 *       properties:
 *         selectedGovernorate:
 *           type: string
 *           description: Selected governorate ID
 *         selectedRegion:
 *           type: string
 *           description: Selected region ID
 *         showRegions:
 *           type: boolean
 *           description: Whether to show region selection
 *         showShippingInfo:
 *           type: boolean
 *           description: Whether to display shipping information
 *         disabled:
 *           type: boolean
 *           description: Whether the component is disabled
 */
@Component({
  selector: 'app-syrian-governorate-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SyrianGovernorateDropdownComponent),
      multi: true
    }
  ],
  templateUrl: './syrian-governorate-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./syrian-governorate-dropdown.component.scss']
})
export class SyrianGovernorateDropdownComponent implements OnInit, ControlValueAccessor {

  // =============================================
  // INPUT PROPERTIES
  // =============================================

  @Input() showRegions: boolean = false;
  @Input() showShippingInfo: boolean = true;
  @Input() enableSearch: boolean = false;
  @Input() showSummary: boolean = false;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() placeholder: string = '';
  @Input() appearance: 'fill' | 'outline' = 'outline';
  @Input() governorateOnly: boolean = false;

  // =============================================
  // OUTPUT EVENTS
  // =============================================

  @Output() governorateSelected = new EventEmitter<SyrianGovernorate | null>();
  @Output() regionSelected = new EventEmitter<SyrianRegion | null>();
  @Output() shippingZoneChanged = new EventEmitter<number>();
  @Output() selectionComplete = new EventEmitter<{governorate: SyrianGovernorate | null, region: SyrianRegion | null}>();

  // =============================================
  // COMPONENT STATE
  // =============================================

  governorateControl = new FormControl('');
  regionControl = new FormControl('');
  searchControl = new FormControl('');

  governorates: SyrianGovernorate[] = [];
  filteredGovernorates$: Observable<SyrianGovernorate[]>;
  availableRegions: SyrianRegion[] = [];

  selectedGovernorate: string | null = null;
  selectedRegion: string | null = null;
  selectedGovernorateData: SyrianGovernorate | null = null;
  selectedRegionData: SyrianRegion | null = null;

  loading: boolean = false;
  loadingRegions: boolean = false;
  errorMessage: string = '';
  isRTL: boolean = false;

  private destroyRef = inject(DestroyRef);
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // =============================================
  // CONSTRUCTOR & LIFECYCLE
  // =============================================

  constructor(
    private syrianDataService: SyrianDataService,
    private formattersService: SyrianFormattersService
  ) {
    // Initialize filtered governorates observable
    this.filteredGovernorates$ = combineLatest([
      this.syrianDataService.getSyrianGovernorates(),
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ]).pipe(
      map(([governorates, searchTerm]) => {
        this.governorates = governorates;
        return this.filterGovernorates(governorates, searchTerm || '');
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  ngOnInit(): void {
    this.setupLanguageSubscription();
    this.setupFormSubscriptions();
    this.loadGovernorates();
  }


  // =============================================
  // CONTROL VALUE ACCESSOR IMPLEMENTATION
  // =============================================

  writeValue(value: any): void {
    if (value) {
      if (typeof value === 'string') {
        this.setGovernorate(value);
      } else if (value.governorate) {
        this.setGovernorate(value.governorate);
        if (value.region) {
          this.setRegion(value.region);
        }
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.governorateControl.disable();
      this.regionControl.disable();
      this.searchControl.disable();
    } else {
      this.governorateControl.enable();
      this.regionControl.enable();
      this.searchControl.enable();
    }
  }

  // =============================================
  // SETUP METHODS
  // =============================================

  private setupLanguageSubscription(): void {
    this.formattersService.getCurrentLanguage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(language => {
        this.isRTL = language === 'ar';
      });
  }

  private setupFormSubscriptions(): void {
    // Governorate control changes
    this.governorateControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.onTouched();
        this.emitValue();
      });

    // Region control changes
    this.regionControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.onTouched();
        this.emitValue();
      });
  }

  // =============================================
  // DATA LOADING
  // =============================================

  private loadGovernorates(): void {
    this.loading = true;
    this.errorMessage = '';

    this.syrianDataService.getSyrianGovernorates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (governorates) => {
          this.governorates = governorates;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = this.isRTL
            ? 'خطأ في تحميل المحافظات'
            : 'Error loading governorates';
          this.loading = false;
          console.error('Error loading governorates:', error);
        }
      });
  }

  private loadRegions(governorateId: string): void {
    this.loadingRegions = true;
    this.availableRegions = [];

    this.syrianDataService.getRegionsByGovernorate(governorateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (regions) => {
          this.availableRegions = regions;
          this.loadingRegions = false;
        },
        error: (error) => {
          this.errorMessage = this.isRTL
            ? 'خطأ في تحميل المناطق'
            : 'Error loading regions';
          this.loadingRegions = false;
          console.error('Error loading regions:', error);
        }
      });
  }

  // =============================================
  // EVENT HANDLERS
  // =============================================

  onGovernorateChange(governorateId: string): void {
    this.setGovernorate(governorateId);

    if (this.showRegions && governorateId) {
      this.loadRegions(governorateId);
      this.regionControl.setValue(''); // Reset region selection
    }
  }

  onRegionChange(regionId: string): void {
    this.setRegion(regionId);
  }

  onSearchInput(event: any): void {
    // Search input is handled by the observable stream
    const searchTerm = event.target.value;
    // Additional search logic can be added here if needed
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private filterGovernorates(governorates: SyrianGovernorate[], searchTerm: string): SyrianGovernorate[] {
    if (!searchTerm) {
      return governorates;
    }

    const term = searchTerm.toLowerCase();

    return governorates.filter(gov => {
      // Search in governorate names
      const matchesGovernorate =
        gov.nameEn.toLowerCase().includes(term) ||
        gov.nameAr.includes(term);

      // Search in region names
      const matchesRegion = gov.regions.some(region =>
        region.nameEn.toLowerCase().includes(term) ||
        region.nameAr.includes(term)
      );

      return matchesGovernorate || matchesRegion;
    });
  }

  private setGovernorate(governorateId: string): void {
    this.selectedGovernorate = governorateId;
    this.selectedGovernorateData = this.governorates.find(g => g.id === governorateId) || null;

    if (this.selectedGovernorateData) {
      this.governorateSelected.emit(this.selectedGovernorateData);
      this.shippingZoneChanged.emit(this.selectedGovernorateData.shippingZone);
    } else {
      this.governorateSelected.emit(null);
    }

    this.emitSelectionComplete();
  }

  private setRegion(regionId: string): void {
    this.selectedRegion = regionId;
    this.selectedRegionData = this.availableRegions.find(r => r.id === regionId) || null;

    this.regionSelected.emit(this.selectedRegionData);
    this.emitSelectionComplete();
  }

  private emitValue(): void {
    const value = this.governorateOnly
      ? this.selectedGovernorate
      : {
          governorate: this.selectedGovernorate,
          region: this.selectedRegion
        };

    this.onChange(value);
  }

  private emitSelectionComplete(): void {
    this.selectionComplete.emit({
      governorate: this.selectedGovernorateData,
      region: this.selectedRegionData
    });
  }

  // =============================================
  // PUBLIC UTILITY METHODS
  // =============================================

  /**
   * Get shipping zone for current selection
   * Returns shipping zone number for selected governorate
   */
  getShippingZone(): number | null {
    return this.selectedGovernorateData?.shippingZone || null;
  }

  /**
   * Get delivery time for current selection
   * Returns estimated delivery time for selected governorate
   */
  getDeliveryTime(): string | null {
    return this.selectedGovernorateData?.deliveryTime || null;
  }

  /**
   * Check if current selection has heritage significance
   * Returns true if selected governorate has heritage status
   */
  hasHeritage(): boolean {
    return this.selectedGovernorateData?.heritage || false;
  }

  /**
   * Reset all selections
   * Clears governorate and region selections
   */
  resetSelection(): void {
    this.governorateControl.setValue('');
    this.regionControl.setValue('');
    this.searchControl.setValue('');
    this.selectedGovernorate = null;
    this.selectedRegion = null;
    this.selectedGovernorateData = null;
    this.selectedRegionData = null;
    this.availableRegions = [];
    this.emitValue();
  }

  /**
   * Validate current selection
   * Returns validation status and error messages
   */
  validateSelection(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.required && !this.selectedGovernorate) {
      errors.push(this.isRTL ? 'يجب اختيار المحافظة' : 'Governorate is required');
    }

    if (this.showRegions && this.required && !this.selectedRegion) {
      errors.push(this.isRTL ? 'يجب اختيار المنطقة' : 'Region is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}