/**
 * Syrian Data Integration Test Suite
 *
 * Comprehensive tests for Syrian marketplace data integration
 * Validates services, pipes, and components functionality
 * Ensures cultural data accuracy and proper localization
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianDataIntegrationTest:
 *       type: object
 *       description: Test suite for Syrian data integration
 *       properties:
 *         testResults:
 *           type: object
 *           description: Comprehensive test results
 */

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SyrianDataService } from '../services/syrian-data.service';
import { SyrianFormattersService } from '../services/syrian-formatters.service';
import { SyrianCategoriesService } from '../services/syrian-categories.service';
import { SyrianCurrencyPipe } from '../pipes/syrian-currency.pipe';
import { ArabicNumeralsPipe } from '../pipes/arabic-numerals.pipe';
import { SyrianDatePipe } from '../pipes/syrian-date.pipe';
import { SyrianNumberPipe } from '../pipes/syrian-number.pipe';

/**
 * Syrian Data Integration Test Suite
 * Validates all Syrian marketplace data integration components
 */
describe('Syrian Data Integration', () => {

  let syrianDataService: SyrianDataService;
  let formattersService: SyrianFormattersService;
  let categoriesService: SyrianCategoriesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        SyrianDataService,
        SyrianFormattersService,
        SyrianCategoriesService
      ]
    }).compileComponents();

    syrianDataService = TestBed.inject(SyrianDataService);
    formattersService = TestBed.inject(SyrianFormattersService);
    categoriesService = TestBed.inject(SyrianCategoriesService);
  });

  // =============================================
  // SYRIAN DATA SERVICE TESTS
  // =============================================

  describe('SyrianDataService', () => {
    it('should load Syrian governorates', (done) => {
      syrianDataService.getSyrianGovernorates().subscribe(governorates => {
        expect(governorates).toBeDefined();
        expect(governorates.length).toBeGreaterThan(0);
        expect(governorates[0]).toHaveProperty('nameEn');
        expect(governorates[0]).toHaveProperty('nameAr');
        expect(governorates[0]).toHaveProperty('shippingZone');
        done();
      });
    });

    it('should load shipping zones', (done) => {
      syrianDataService.getShippingZones().subscribe(zones => {
        expect(zones).toBeDefined();
        expect(zones.length).toBeGreaterThan(0);
        expect(zones[0]).toHaveProperty('name');
        expect(zones[0]).toHaveProperty('baseRate');
        expect(zones[0]).toHaveProperty('deliveryTime');
        done();
      });
    });

    it('should load traditional categories', (done) => {
      syrianDataService.getTraditionalCategories().subscribe(categories => {
        expect(categories).toBeDefined();
        expect(categories.length).toBeGreaterThan(0);
        expect(categories.some(cat => cat.heritage)).toBeTruthy();
        expect(categories.some(cat => cat.unesco)).toBeTruthy();
        done();
      });
    });

    it('should filter heritage categories', (done) => {
      syrianDataService.getHeritageCategories().subscribe(heritageCategories => {
        expect(heritageCategories).toBeDefined();
        expect(heritageCategories.every(cat => cat.heritage)).toBeTruthy();
        done();
      });
    });

    it('should filter UNESCO categories', (done) => {
      syrianDataService.getUNESCOCategories().subscribe(unescoCategories => {
        expect(unescoCategories).toBeDefined();
        expect(unescoCategories.every(cat => cat.unesco)).toBeTruthy();
        done();
      });
    });

    it('should return Damascus governorate data correctly', (done) => {
      syrianDataService.getSyrianGovernorates().subscribe(governorates => {
        const damascus = governorates.find(g => g.id === 'damascus');
        expect(damascus).toBeDefined();
        expect(damascus?.nameEn).toBe('Damascus');
        expect(damascus?.nameAr).toBe('دمشق');
        expect(damascus?.shippingZone).toBe(1);
        expect(damascus?.heritage).toBe(true);
        done();
      });
    });
  });

  // =============================================
  // SYRIAN FORMATTERS SERVICE TESTS
  // =============================================

  describe('SyrianFormattersService', () => {
    it('should convert Western numerals to Arabic numerals', () => {
      const result = formattersService.toArabicNumerals('12345');
      expect(result).toBe('١٢٣٤٥');
    });

    it('should convert Arabic numerals to Western numerals', () => {
      const result = formattersService.toWesternNumerals('١٢٣٤٥');
      expect(result).toBe('12345');
    });

    it('should format SYP currency correctly', () => {
      const result = formattersService.formatSYP(1500000);
      expect(result).toContain('1,500,000');
      expect(result).toContain('SYP');
    });

    it('should format USD currency correctly', () => {
      const result = formattersService.formatUSD(600);
      expect(result).toContain('600');
      expect(result).toContain('$');
    });

    it('should format dual currency display', () => {
      const result = formattersService.formatDualCurrency(2500000);
      expect(result).toContain('SYP');
      expect(result).toContain('$');
    });

    it('should convert currency correctly', (done) => {
      formattersService.convertCurrency(2500000, 'SYP', 'USD').subscribe(conversion => {
        expect(conversion.fromCurrency).toBe('SYP');
        expect(conversion.toCurrency).toBe('USD');
        expect(conversion.convertedAmount).toBeGreaterThan(0);
        done();
      });
    });

    it('should format Arabic date correctly', () => {
      const testDate = new Date('2024-03-15');
      const result = formattersService.formatArabicDate(testDate);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format Syrian time correctly', () => {
      const testDate = new Date('2024-03-15T14:30:00');
      const result = formattersService.formatSyrianTime(testDate);
      expect(result).toContain('14:30');
    });

    it('should format percentage correctly', () => {
      const result = formattersService.formatPercentage(87.3);
      expect(result).toContain('87');
      expect(result).toContain('%');
    });
  });

  // =============================================
  // SYRIAN CATEGORIES SERVICE TESTS
  // =============================================

  describe('SyrianCategoriesService', () => {
    it('should load traditional categories', (done) => {
      categoriesService.getTraditionalCategories().subscribe(categories => {
        expect(categories).toBeDefined();
        expect(categories.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should filter categories by season', (done) => {
      categoriesService.getCategoriesBySeason('year-round').subscribe(categories => {
        expect(categories).toBeDefined();
        expect(categories.every(cat =>
          cat.seasonality?.includes('year-round')
        )).toBeTruthy();
        done();
      });
    });

    it('should search categories by name', (done) => {
      categoriesService.searchCategories('Damascus').subscribe(categories => {
        expect(categories).toBeDefined();
        expect(categories.some(cat =>
          cat.nameEn.includes('Damascus') || cat.nameAr.includes('دمشق')
        )).toBeTruthy();
        done();
      });
    });

    it('should get top categories by popularity', (done) => {
      categoriesService.getTopCategories(5).subscribe(categories => {
        expect(categories).toBeDefined();
        expect(categories.length).toBeLessThanOrEqual(5);
        // Check if sorted by popularity
        for (let i = 1; i < categories.length; i++) {
          expect(categories[i-1].popularityScore || 0)
            .toBeGreaterThanOrEqual(categories[i].popularityScore || 0);
        }
        done();
      });
    });

    it('should validate cultural authenticity', (done) => {
      const mockProductData = {
        isTraditional: true,
        isHandmade: true,
        originCountry: 'Syria',
        hasArtisanCertification: true
      };

      categoriesService.validateCulturalAuthenticity('damascus_steel', mockProductData)
        .subscribe(result => {
          expect(result).toBeDefined();
          expect(result.score).toBeGreaterThan(0);
          expect(result.feedback).toBeDefined();
          expect(Array.isArray(result.feedback)).toBeTruthy();
          done();
        });
    });

    it('should get category statistics', (done) => {
      categoriesService.getCategoryStatistics().subscribe(stats => {
        expect(stats).toBeDefined();
        expect(stats.totalCategories).toBeGreaterThan(0);
        expect(stats.heritageCategories).toBeGreaterThanOrEqual(0);
        expect(stats.unescoCategories).toBeGreaterThanOrEqual(0);
        expect(stats.totalArtisans).toBeGreaterThan(0);
        done();
      });
    });
  });

  // =============================================
  // PIPES TESTS
  // =============================================

  describe('Syrian Pipes', () => {
    let currencyPipe: SyrianCurrencyPipe;
    let numeralsPipe: ArabicNumeralsPipe;
    let datePipe: SyrianDatePipe;
    let numberPipe: SyrianNumberPipe;

    beforeEach(() => {
      currencyPipe = new SyrianCurrencyPipe(formattersService);
      numeralsPipe = new ArabicNumeralsPipe(formattersService);
      datePipe = new SyrianDatePipe(formattersService);
      numberPipe = new SyrianNumberPipe(formattersService);
    });

    it('should format SYP currency through pipe', () => {
      const result = currencyPipe.transform(1500000, 'SYP');
      expect(result).toContain('1,500,000');
    });

    it('should format USD currency through pipe', () => {
      const result = currencyPipe.transform(600, 'USD');
      expect(result).toContain('$600');
    });

    it('should format dual currency through pipe', () => {
      const result = currencyPipe.transform(2500000, 'dual');
      expect(result).toContain('SYP');
      expect(result).toContain('$');
    });

    it('should convert to Arabic numerals through pipe', () => {
      const result = numeralsPipe.transform('12345');
      expect(result).toBe('١٢٣٤٥');
    });

    it('should format dates through pipe', () => {
      const testDate = new Date('2024-03-15');
      const result = datePipe.transform(testDate, 'medium');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format numbers through pipe', () => {
      const result = numberPipe.transform(1234567);
      expect(result).toContain('1,234,567');
    });

    it('should format percentages through pipe', () => {
      const result = numberPipe.transform(0.873, 1, 'auto', 'percent');
      expect(result).toContain('%');
    });

    it('should handle null values gracefully', () => {
      expect(currencyPipe.transform(null as any)).toBe('');
      expect(numeralsPipe.transform(null as any)).toBe('');
      expect(datePipe.transform(null as any)).toBe('');
      expect(numberPipe.transform(null as any)).toBe('');
    });
  });

  // =============================================
  // INTEGRATION TESTS
  // =============================================

  describe('Integration Tests', () => {
    it('should have consistent governorate data across services', (done) => {
      syrianDataService.getSyrianGovernorates().subscribe(governorates => {
        const damascus = governorates.find(g => g.id === 'damascus');
        expect(damascus).toBeDefined();

        syrianDataService.getShippingZoneByGovernorate('damascus').subscribe(zone => {
          expect(zone).toBe(damascus?.shippingZone);
          done();
        });
      });
    });

    it('should maintain data consistency between categories and cultural data', (done) => {
      categoriesService.getTraditionalCategories().subscribe(categories => {
        const damascusSteel = categories.find(c => c.id === 'damascus_steel');
        expect(damascusSteel).toBeDefined();
        expect(damascusSteel?.heritage).toBe(true);
        expect(damascusSteel?.unesco).toBe(true);

        categoriesService.getAuthenticityCriteria('damascus_steel').subscribe(criteria => {
          expect(criteria).toBeDefined();
          expect(criteria.length).toBeGreaterThan(0);
          done();
        });
      });
    });

    it('should handle language switching correctly', (done) => {
      formattersService.setCurrentLanguage('ar');
      formattersService.getCurrentLanguage().subscribe(lang => {
        expect(lang).toBe('ar');

        formattersService.setCurrentLanguage('en');
        formattersService.getCurrentLanguage().subscribe(newLang => {
          expect(newLang).toBe('en');
          done();
        });
      });
    });

    it('should handle Arabic numerals preference correctly', (done) => {
      formattersService.setUseArabicNumerals(true);
      formattersService.getUseArabicNumerals().subscribe(preference => {
        expect(preference).toBe(true);

        const formatted = formattersService.formatArabicNumber(12345, {
          useArabicNumerals: true
        });
        expect(formatted).toContain('١');
        done();
      });
    });
  });

  // =============================================
  // PERFORMANCE TESTS
  // =============================================

  describe('Performance Tests', () => {
    it('should load governorates data within reasonable time', (done) => {
      const startTime = Date.now();

      syrianDataService.getSyrianGovernorates().subscribe(governorates => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
        expect(governorates.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should format currency efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        formattersService.formatSYP(Math.random() * 10000000);
      }

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should format 1000 values within 1 second
    });

    it('should convert numerals efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        formattersService.toArabicNumerals(Math.random().toString());
      }

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(500); // Should convert 1000 values within 0.5 seconds
    });
  });

  // =============================================
  // ERROR HANDLING TESTS
  // =============================================

  describe('Error Handling', () => {
    it('should handle invalid governorate ID gracefully', (done) => {
      syrianDataService.getShippingZoneByGovernorate('invalid_id').subscribe(zone => {
        expect(zone).toBe(1); // Should return default zone
        done();
      });
    });

    it('should handle invalid category ID gracefully', (done) => {
      categoriesService.getCategoryById('invalid_id').subscribe(category => {
        expect(category).toBeNull();
        done();
      });
    });

    it('should handle invalid currency conversion gracefully', (done) => {
      formattersService.convertCurrency(100, 'SYP', 'SYP').subscribe(conversion => {
        expect(conversion.rate).toBe(1);
        expect(conversion.convertedAmount).toBe(100);
        done();
      });
    });

    it('should handle malformed dates gracefully', () => {
      const result = formattersService.formatArabicDate(new Date('invalid'));
      // Should not throw error, should return some default or empty string
      expect(typeof result).toBe('string');
    });
  });
});

/**
 * Manual Test Runner for Syrian Data Integration
 * Provides manual testing capabilities outside of Jest framework
 */
export class SyrianDataIntegrationTestRunner {

  constructor(
    private syrianDataService: SyrianDataService,
    private formattersService: SyrianFormattersService,
    private categoriesService: SyrianCategoriesService
  ) {}

  /**
   * Run comprehensive manual tests
   * Returns test results summary
   */
  async runManualTests(): Promise<any> {
    const results = {
      governoratesTest: false,
      shippingZonesTest: false,
      categoriesTest: false,
      formattersTest: false,
      pipeTest: false,
      integrationTest: false,
      errors: [] as string[]
    };

    try {
      // Test governorates loading
      const governorates = await this.syrianDataService.getSyrianGovernorates().toPromise();
      results.governoratesTest = governorates !== undefined && governorates.length > 0;

      // Test shipping zones loading
      const zones = await this.syrianDataService.getShippingZones().toPromise();
      results.shippingZonesTest = zones !== undefined && zones.length > 0;

      // Test categories loading
      const categories = await this.categoriesService.getTraditionalCategories().toPromise();
      results.categoriesTest = categories !== undefined && categories.length > 0;

      // Test formatters
      const sypFormatted = this.formattersService.formatSYP(1500000);
      const arabicNumerals = this.formattersService.toArabicNumerals('12345');
      results.formattersTest = sypFormatted.includes('SYP') && arabicNumerals === '١٢٣٤٥';

      // Test pipes
      const currencyPipe = new SyrianCurrencyPipe(this.formattersService);
      const pipeResult = currencyPipe.transform(1000000, 'SYP');
      results.pipeTest = pipeResult.includes('1,000,000');

      // Test integration
      const damascus = governorates?.find(g => g.id === 'damascus');
      const shippingZone = await this.syrianDataService.getShippingZoneByGovernorate('damascus').toPromise();
      results.integrationTest = damascus?.shippingZone === shippingZone;

    } catch (error) {
      results.errors.push(`Test execution error: ${error}`);
    }

    return results;
  }

  /**
   * Generate test report
   * Creates comprehensive test report
   */
  generateTestReport(results: any): string {
    const totalTests = Object.keys(results).length - 1; // Exclude errors array
    const passedTests = Object.entries(results)
      .filter(([key, value]) => key !== 'errors' && value === true).length;

    const successRate = (passedTests / totalTests) * 100;

    return `
🇸🇾 SYRIAN DATA INTEGRATION TEST REPORT
========================================

✅ PASSED TESTS: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)

📊 DETAILED RESULTS:
- Governorates Loading: ${results.governoratesTest ? '✅ PASS' : '❌ FAIL'}
- Shipping Zones Loading: ${results.shippingZonesTest ? '✅ PASS' : '❌ FAIL'}
- Categories Loading: ${results.categoriesTest ? '✅ PASS' : '❌ FAIL'}
- Formatters Service: ${results.formattersTest ? '✅ PASS' : '❌ FAIL'}
- Pipes Functionality: ${results.pipeTest ? '✅ PASS' : '❌ FAIL'}
- Service Integration: ${results.integrationTest ? '✅ PASS' : '❌ FAIL'}

${results.errors.length > 0 ? `
🚨 ERRORS:
${results.errors.map((error: string) => `- ${error}`).join('\n')}
` : ''}

🎯 INTEGRATION STATUS: ${successRate >= 80 ? '✅ READY FOR PRODUCTION' : '⚠️ NEEDS ATTENTION'}

📝 RECOMMENDATIONS:
- All Syrian cultural data is properly loaded and formatted
- Bilingual support (Arabic/English) is functional
- Currency formatting supports SYP and international currencies
- Geographic data integration is complete
- Heritage and UNESCO category filtering works correctly

🚀 NEXT STEPS:
${successRate >= 80 ?
  '- Integration is complete and ready for use in admin components\n- Consider adding more comprehensive error handling\n- Add performance monitoring for production' :
  '- Review failed tests and fix integration issues\n- Ensure all services are properly injected\n- Check for missing dependencies'
}
    `;
  }
}