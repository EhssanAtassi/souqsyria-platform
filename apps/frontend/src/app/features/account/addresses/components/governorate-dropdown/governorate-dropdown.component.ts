import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
  effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { AddressApiService } from '../../services/address-api.service';
import { LanguageService } from '../../../../../shared/services/language.service';

/**
 * @description Cascading dropdown component for Syrian governorates, cities, and districts
 * Handles hierarchical location selection with bilingual support (English/Arabic).
 * Automatically loads child options when parent selection changes.
 *
 * @swagger
 * components:
 *   schemas:
 *     GovernorateDropdownComponent:
 *       type: object
 *       description: Cascading location selector for Syrian addresses
 *       properties:
 *         selectedGovernorateId:
 *           type: number
 *           nullable: true
 *         selectedCityId:
 *           type: number
 *           nullable: true
 */
@Component({
  selector: 'app-governorate-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './governorate-dropdown.component.html',
  styleUrls: ['./governorate-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GovernorateDropdownComponent implements OnInit {
  private readonly addressService = inject(AddressApiService);
  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  /** Input: Currently selected governorate ID */
  selectedGovernorateId = input<number | null>(null);

  /** Input: Currently selected city ID */
  selectedCityId = input<number | null>(null);

  /** Input: Currently selected district ID */
  selectedDistrictId = input<number | null>(null);

  /** Output: Emits when governorate selection changes */
  governorateChange = output<number>();

  /** Output: Emits when city selection changes */
  cityChange = output<number>();

  /** Output: Emits when district selection changes */
  districtChange = output<number>();

  /** Current language signal from LanguageService */
  readonly lang = this.languageService.language;

  /** Governorates from API service */
  readonly governorates = this.addressService.governorates;

  /** Cities from API service */
  readonly cities = this.addressService.cities;

  /** Districts from API service */
  readonly districts = this.addressService.districts;

  /** Local signal for selected governorate */
  readonly selectedGov = signal<number | null>(null);

  /** Local signal for selected city */
  readonly selectedCity = signal<number | null>(null);

  /** Local signal for selected district */
  readonly selectedDist = signal<number | null>(null);

  constructor() {
    // Sync input changes to local signals
    effect(() => {
      const govId = this.selectedGovernorateId();
      if (govId !== this.selectedGov()) {
        this.selectedGov.set(govId);
        if (govId) {
          this.addressService.loadCities(govId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const cityId = this.selectedCityId();
      if (cityId !== this.selectedCity()) {
        this.selectedCity.set(cityId);
        if (cityId) {
          this.addressService.loadDistricts(cityId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const distId = this.selectedDistrictId();
      if (distId !== this.selectedDist()) {
        this.selectedDist.set(distId);
      }
    }, { allowSignalWrites: true });
  }

  /**
   * @description Initialize component by loading governorates
   */
  ngOnInit(): void {
    if (this.governorates().length === 0) {
      this.addressService.loadGovernorates()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  /**
   * @description Handle governorate selection change
   * Loads cities for the selected governorate and clears city/district selections
   * @param event - Material select change event
   */
  onGovernorateChange(event: MatSelectChange): void {
    const governorateId = event.value as number;
    this.selectedGov.set(governorateId);
    this.selectedCity.set(null);
    this.selectedDist.set(null);

    // Clear dependent dropdowns
    this.addressService.clearCities();
    this.addressService.clearDistricts();

    // Load cities for selected governorate
    if (governorateId) {
      this.addressService.loadCities(governorateId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }

    this.governorateChange.emit(governorateId);
  }

  /**
   * @description Handle city selection change
   * Loads districts for the selected city and clears district selection
   * @param event - Material select change event
   */
  onCityChange(event: MatSelectChange): void {
    const cityId = event.value as number;
    this.selectedCity.set(cityId);
    this.selectedDist.set(null);

    // Clear dependent dropdown
    this.addressService.clearDistricts();

    // Load districts for selected city
    if (cityId) {
      this.addressService.loadDistricts(cityId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }

    this.cityChange.emit(cityId);
  }

  /**
   * @description Handle district selection change
   * @param event - Material select change event
   */
  onDistrictChange(event: MatSelectChange): void {
    const districtId = event.value as number;
    this.selectedDist.set(districtId);
    this.districtChange.emit(districtId);
  }

  /** @description Track governorate options by ID */
  trackByGovId(index: number, gov: any): number {
    return gov.id;
  }

  /** @description Track city options by ID */
  trackByCityId(index: number, city: any): number {
    return city.id;
  }

  /** @description Track district options by ID */
  trackByDistrictId(index: number, district: any): number {
    return district.id;
  }
}
