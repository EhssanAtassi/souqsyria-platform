import { TestBed } from '@angular/core/testing';
import { SyrianDataService } from '../syrian-data.service';

/**
 * Unit Tests for SyrianDataService - Syrian Marketplace
 *
 * Comprehensive test suite covering:
 * - Syrian governorates and administrative divisions
 * - Traditional craft categories and heritage data
 * - Shipping zones and delivery information
 * - Business hours and holiday schedules
 * - Bilingual Arabic/English data validation
 * - Cultural authenticity and UNESCO recognition
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianDataServiceTests:
 *       type: object
 *       description: Test suite for Syrian marketplace cultural and geographical data
 *       properties:
 *         governorateTests:
 *           type: array
 *           description: Tests for Syrian governorates and regions
 *         heritageTests:
 *           type: array
 *           description: Tests for traditional categories and cultural data
 *         shippingTests:
 *           type: array
 *           description: Tests for shipping zones and delivery information
 *         businessTests:
 *           type: array
 *           description: Tests for business hours and operational data
 *         bilingualTests:
 *           type: array
 *           description: Tests for Arabic/English bilingual support
 */
describe('SyrianDataService', () => {
  let service: SyrianDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SyrianDataService]
    });
    service = TestBed.inject(SyrianDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Syrian Governorates and Administrative Data', () => {

    /**
     * Test Syrian governorates retrieval
     * Verifies complete list of Syrian administrative divisions
     */
    it('should retrieve all Syrian governorates with bilingual names', (done) => {
      service.getSyrianGovernorates().subscribe(governorates => {
        expect(Array.isArray(governorates)).toBe(true);
        expect(governorates.length).toBeGreaterThan(0);

        governorates.forEach(governorate => {
          // Should have unique ID
          expect(governorate.id).toBeTruthy();
          expect(typeof governorate.id).toBe('string');

          // Should have bilingual names
          expect(governorate.nameEn).toBeTruthy();
          expect(typeof governorate.nameEn).toBe('string');
          expect(governorate.nameAr).toBeTruthy();
          expect(typeof governorate.nameAr).toBe('string');

          // Should have regions
          expect(Array.isArray(governorate.regions)).toBe(true);
          expect(governorate.regions.length).toBeGreaterThan(0);

          // Should have shipping zone
          expect(typeof governorate.shippingZone).toBe('number');

          // Should have coordinates
          if (governorate.coordinates) {
            expect(typeof governorate.coordinates.latitude).toBe('number');
            expect(typeof governorate.coordinates.longitude).toBe('number');
          }
        });
        done();
      });
    });

    /**
     * Test major Syrian governorates presence
     * Verifies presence of key Syrian administrative divisions
     */
    it('should include major Syrian governorates', (done) => {
      service.getSyrianGovernorates().subscribe(governorates => {
        const governorateNames = governorates.map(g => g.nameEn.toLowerCase());

        // Major Syrian governorates should be present
        const majorGovernorates = [
          'damascus',
          'aleppo',
          'homs',
          'latakia'
        ];

        majorGovernorates.forEach(major => {
          const found = governorateNames.some(name =>
            name.includes(major.toLowerCase()) ||
            name.replace(/[\s-]/g, '').includes(major.replace(/[\s-]/g, ''))
          );
          expect(found).toBe(true);
        });
        done();
      });
    });

    /**
     * Test governorate regions structure
     * Verifies proper region data within governorates
     */
    it('should provide detailed region information for each governorate', (done) => {
      service.getSyrianGovernorates().subscribe(governorates => {
        governorates.forEach(governorate => {
          governorate.regions.forEach(region => {
            // Should have unique region ID
            expect(region.id).toBeTruthy();
            expect(typeof region.id).toBe('string');

            // Should have bilingual names
            expect(region.nameEn).toBeTruthy();
            expect(region.nameAr).toBeTruthy();

            // Should reference parent governorate
            expect(region.governorateId).toBe(governorate.id);

            // Should have postal code
            expect(region.postalCode).toBeTruthy();
            expect(typeof region.postalCode).toBe('string');

            // Should specify urban/rural classification
            expect(typeof region.isUrban).toBe('boolean');

            // Should specify delivery availability
            expect(typeof region.deliveryAvailable).toBe('boolean');

            // Should have coordinates
            if (region.coordinates) {
              expect(typeof region.coordinates.latitude).toBe('number');
              expect(typeof region.coordinates.longitude).toBe('number');
              expect(region.coordinates.latitude).toBeGreaterThan(32);
              expect(region.coordinates.latitude).toBeLessThan(38);
              expect(region.coordinates.longitude).toBeGreaterThan(35);
              expect(region.coordinates.longitude).toBeLessThan(43);
            }

            // Should have population data
            if (region.population !== undefined) {
              expect(typeof region.population).toBe('number');
              expect(region.population).toBeGreaterThan(0);
            }
          });
        });
        done();
      });
    });

    /**
     * Test regions by governorate retrieval
     * Verifies ability to retrieve regions for specific governorate
     */
    it('should retrieve regions for specific governorate', (done) => {
      service.getRegionsByGovernorate('damascus').subscribe(regions => {
        expect(Array.isArray(regions)).toBe(true);
        expect(regions.length).toBeGreaterThan(0);
        regions.forEach(region => {
          expect(region.governorateId).toBe('damascus');
          expect(region.nameEn).toBeTruthy();
          expect(region.nameAr).toBeTruthy();
        });
        done();
      });
    });
  });

  describe('Traditional Syrian Categories and Heritage Data', () => {

    /**
     * Test traditional category retrieval
     * Verifies comprehensive Syrian traditional craft categories
     */
    it('should retrieve Syrian traditional categories with heritage information', (done) => {
      service.getTraditionalCategories().subscribe(categories => {
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);

        categories.forEach(category => {
          // Should have unique category ID
          expect(category.id).toBeTruthy();
          expect(typeof category.id).toBe('string');

          // Should have bilingual names
          expect(category.nameEn).toBeTruthy();
          expect(category.nameAr).toBeTruthy();

          // Should have heritage flag
          expect(typeof category.heritage).toBe('boolean');

          // Should have UNESCO flag
          expect(typeof category.unesco).toBe('boolean');

          // Should have description
          expect(category.description).toBeTruthy();

          // Should have artisan count
          expect(typeof category.artisanCount).toBe('number');
          expect(category.artisanCount).toBeGreaterThan(0);

          // Should have average price
          expect(typeof category.averagePrice).toBe('number');
          expect(category.averagePrice).toBeGreaterThan(0);

          // Should have popularity score
          expect(typeof category.popularityScore).toBe('number');
          expect(category.popularityScore).toBeGreaterThan(0);
          expect(category.popularityScore).toBeLessThanOrEqual(100);

          // Should have authenticity criteria if present
          if (category.authenticityCriteria) {
            expect(Array.isArray(category.authenticityCriteria)).toBe(true);
            expect(category.authenticityCriteria.length).toBeGreaterThan(0);
          }
        });
        done();
      });
    });

    /**
     * Test Damascus steel category presence
     * Verifies presence of iconic Damascus steel category
     */
    it('should include Damascus steel as UNESCO recognized category', (done) => {
      service.getTraditionalCategories().subscribe(categories => {
        const damascusSteel = categories.find(cat =>
          cat.id === 'damascus_steel' ||
          cat.nameEn.toLowerCase().includes('damascus steel')
        );

        expect(damascusSteel).toBeTruthy();
        expect(damascusSteel?.unesco).toBe(true);
        expect(damascusSteel?.heritage).toBe(true);
        expect(damascusSteel?.nameAr).toContain('دمشقي');
        done();
      });
    });

    /**
     * Test Aleppo soap category presence
     * Verifies presence of traditional Aleppo soap category
     */
    it('should include Aleppo soap as traditional category', (done) => {
      service.getTraditionalCategories().subscribe(categories => {
        const aleppoSoap = categories.find(cat =>
          cat.id === 'aleppo_soap' ||
          cat.nameEn.toLowerCase().includes('aleppo soap')
        );

        expect(aleppoSoap).toBeTruthy();
        expect(aleppoSoap?.heritage).toBe(true);
        expect(aleppoSoap?.nameAr).toContain('حلب');
        done();
      });
    });

    /**
     * Test heritage categories filtering
     * Verifies ability to filter heritage categories
     */
    it('should filter heritage categories correctly', (done) => {
      service.getHeritageCategories().subscribe(heritageCategories => {
        expect(Array.isArray(heritageCategories)).toBe(true);
        expect(heritageCategories.length).toBeGreaterThan(0);

        heritageCategories.forEach(category => {
          expect(category.heritage).toBe(true);
        });
        done();
      });
    });

    /**
     * Test UNESCO categories filtering
     * Verifies ability to filter UNESCO recognized categories
     */
    it('should filter UNESCO recognized categories correctly', (done) => {
      service.getUNESCOCategories().subscribe(unescoCategories => {
        expect(Array.isArray(unescoCategories)).toBe(true);
        expect(unescoCategories.length).toBeGreaterThan(0);

        unescoCategories.forEach(category => {
          expect(category.unesco).toBe(true);
        });
        done();
      });
    });
  });

  describe('Shipping Zones and Delivery Information', () => {

    /**
     * Test shipping zones retrieval
     * Verifies comprehensive shipping zone data for Syria
     */
    it('should retrieve shipping zones with delivery information', (done) => {
      service.getShippingZones().subscribe(zones => {
        expect(Array.isArray(zones)).toBe(true);
        expect(zones.length).toBeGreaterThan(0);

        zones.forEach(zone => {
          // Should have unique zone ID
          expect(zone.id).toBeTruthy();
          expect(typeof zone.id).toBe('number');

          // Should have bilingual names
          expect(zone.name).toBeTruthy();
          expect(zone.nameAr).toBeTruthy();

          // Should have covered countries
          expect(Array.isArray(zone.countries)).toBe(true);
          expect(zone.countries.length).toBeGreaterThan(0);

          // Should have base rate
          expect(typeof zone.baseRate).toBe('number');
          expect(zone.baseRate).toBeGreaterThan(0);

          // Should have USD rate
          expect(typeof zone.baseRateUSD).toBe('number');
          expect(zone.baseRateUSD).toBeGreaterThan(0);

          // Should have delivery time
          expect(zone.deliveryTime).toBeTruthy();

          // Should specify availability
          expect(typeof zone.isActive).toBe('boolean');

          // Should have document requirements
          expect(typeof zone.requiresDocuments).toBe('boolean');

          // Should have weight limits
          expect(typeof zone.maxWeight).toBe('number');
          expect(zone.maxWeight).toBeGreaterThan(0);

          // Should have restrictions array
          expect(Array.isArray(zone.restrictions)).toBe(true);
        });
        done();
      });
    });

    /**
     * Test shipping zone by governorate
     * Verifies shipping zone lookup for governorates
     */
    it('should get shipping zone by governorate', (done) => {
      service.getShippingZoneByGovernorate('damascus').subscribe(zoneId => {
        expect(typeof zoneId).toBe('number');
        expect(zoneId).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Business Hours and Operational Data', () => {

    /**
     * Test Syrian business hours retrieval
     * Verifies standard business hours and holiday schedules
     */
    it('should retrieve Syrian business hours and schedules', (done) => {
      service.getSyrianBusinessHours().subscribe(businessHours => {
        expect(businessHours).toBeTruthy();

        // Should have standard schedule
        expect(businessHours.standard).toBeTruthy();

        // Should have Ramadan schedule
        expect(businessHours.ramadan).toBeTruthy();

        // Verify each day schedule structure
        ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
          const standardDay = businessHours.standard?.[day as keyof typeof businessHours.standard];
          const ramadanDay = businessHours.ramadan?.[day as keyof typeof businessHours.ramadan];

          if (standardDay) {
            expect(typeof standardDay.isOpen).toBe('boolean');
            if (standardDay.isOpen) {
              expect(standardDay.openTime).toBeTruthy();
              expect(standardDay.closeTime).toBeTruthy();
            }
          }

          if (ramadanDay) {
            expect(typeof ramadanDay.isOpen).toBe('boolean');
            if (ramadanDay.isOpen) {
              expect(ramadanDay.openTime).toBeTruthy();
              expect(ramadanDay.closeTime).toBeTruthy();
            }
          }
        });

        // Should have timezone information
        expect(businessHours.timezone).toBeTruthy();
        expect(businessHours.timezone).toContain('Damascus');

        // Should have holidays array
        expect(Array.isArray(businessHours.holidays)).toBe(true);
        done();
      });
    });

    /**
     * Test Syrian holidays and observances
     * Verifies comprehensive holiday calendar
     */
    it('should retrieve Syrian holidays and religious observances', (done) => {
      service.getSyrianHolidays(2024).subscribe(holidays => {
        expect(Array.isArray(holidays)).toBe(true);
        expect(holidays.length).toBeGreaterThan(0);

        holidays.forEach(holiday => {
          // Should have unique holiday ID
          expect(holiday.id).toBeTruthy();

          // Should have bilingual names
          expect(holiday.nameEn).toBeTruthy();
          expect(holiday.nameAr).toBeTruthy();

          // Should have date
          expect(holiday.date).toBeInstanceOf(Date);

          // Should specify holiday types
          expect(typeof holiday.isNationalHoliday).toBe('boolean');
          expect(typeof holiday.isReligiousHoliday).toBe('boolean');

          // Should specify shipping impact
          expect(typeof holiday.affectsShipping).toBe('boolean');
        });
        done();
      });
    });

    /**
     * Test major Syrian holidays presence
     * Verifies presence of key Syrian national and religious holidays
     */
    it('should include major Syrian holidays', (done) => {
      service.getSyrianHolidays(2024).subscribe(holidays => {
        const holidayNames = holidays.map(h => h.nameEn.toLowerCase());

        // Major holidays that should be present
        const majorHolidays = [
          'independence day',
          'new year',
          'eid'
        ];

        majorHolidays.forEach(major => {
          if (major === 'eid') {
            // Should have at least one Eid holiday
            const eidFound = holidayNames.some(name =>
              name.includes('eid') || name.includes('fitr') || name.includes('adha')
            );
            expect(eidFound).toBe(true);
          } else {
            const found = holidayNames.some(name => name.includes(major));
            expect(found).toBe(true);
          }
        });
        done();
      });
    });
  });

  describe('Search and Language Support', () => {

    /**
     * Test location search functionality
     * Verifies search across governorates and regions
     */
    it('should search locations by name in Arabic and English', (done) => {
      service.searchLocations('Damascus').subscribe(results => {
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
          results.forEach(result => {
            expect(result.type).toBeTruthy();
            expect(['governorate', 'region']).toContain(result.type);
            expect(result.id).toBeTruthy();
            expect(result.nameEn).toBeTruthy();
            expect(result.nameAr).toBeTruthy();
          });
        }
        done();
      });
    });

    /**
     * Test language switching functionality
     * Verifies proper Arabic/English language support
     */
    it('should support language switching', (done) => {
      // Test switching to Arabic
      service.setCurrentLanguage('ar');
      service.getCurrentLanguage().subscribe(language => {
        expect(language).toBe('ar');

        // Test switching back to English
        service.setCurrentLanguage('en');
        service.getCurrentLanguage().subscribe(newLanguage => {
          expect(newLanguage).toBe('en');
          done();
        });
      });
    });

    /**
     * Test Arabic text validation
     * Verifies proper Arabic text handling and validation
     */
    it('should validate Arabic text content', (done) => {
      service.getSyrianGovernorates().subscribe(governorates => {
        governorates.forEach(governorate => {
          // Arabic names should contain Arabic characters
          expect(governorate.nameAr).toMatch(/[\u0600-\u06FF]/);

          governorate.regions.forEach(region => {
            expect(region.nameAr).toMatch(/[\u0600-\u06FF]/);
          });
        });
        done();
      });
    });
  });

  describe('Performance and Edge Cases', () => {

    /**
     * Test invalid governorate handling
     * Verifies proper handling of invalid inputs
     */
    it('should handle invalid governorate gracefully', (done) => {
      service.getRegionsByGovernorate('invalid_governorate_id').subscribe(regions => {
        expect(Array.isArray(regions)).toBe(true);
        expect(regions.length).toBe(0);
        done();
      });
    });

    /**
     * Test empty search results
     * Verifies handling of searches with no results
     */
    it('should handle empty search results', (done) => {
      service.searchLocations('nonexistent_location_xyz_123').subscribe(results => {
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
        done();
      });
    });

    /**
     * Test data integrity
     * Verifies all data has both Arabic and English versions
     */
    it('should ensure bilingual data consistency', (done) => {
      Promise.all([
        service.getSyrianGovernorates().toPromise(),
        service.getTraditionalCategories().toPromise(),
        service.getShippingZones().toPromise()
      ]).then(([governorates, categories, zones]) => {
        // Check governorates
        governorates?.forEach(gov => {
          expect(gov.nameEn).toBeTruthy();
          expect(gov.nameAr).toBeTruthy();
        });

        // Check categories
        categories?.forEach(cat => {
          expect(cat.nameEn).toBeTruthy();
          expect(cat.nameAr).toBeTruthy();
        });

        // Check shipping zones
        zones?.forEach(zone => {
          expect(zone.name).toBeTruthy();
          expect(zone.nameAr).toBeTruthy();
        });

        done();
      });
    });
  });

  afterEach(() => {
    // Clean up subscriptions and reset language
    service.setCurrentLanguage('en');
    TestBed.resetTestingModule();
  });
});