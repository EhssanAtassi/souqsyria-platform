/**
 * @file product-analytics.component.spec.ts
 * @description Unit tests for ProductAnalyticsComponent.
 * Validates the analytics dashboard rendering, KPI display, bilingual labels,
 * loading/error states, and helper method behavior.
 *
 * @swagger
 * tags:
 *   - name: ProductAnalyticsComponent Tests
 *     description: Verifies the admin product analytics dashboard component
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import {
  ProductAnalyticsComponent,
  KpiMetric,
  TopProduct,
  CategoryRevenue,
  StockAlert,
} from './product-analytics.component';
import { AdminProductsApiService } from '../../services/admin-products-api.service';
import { LanguageService } from '../../../../../shared/services/language.service';

/**
 * @description Creates a mock LanguageService with a controllable language signal
 * @param lang - Initial language setting
 * @returns Partial LanguageService mock with language signal
 */
function createMockLanguageService(lang: 'en' | 'ar' = 'en') {
  const languageSignal = signal<'en' | 'ar'>(lang);
  return {
    language: languageSignal,
    isRtl: signal(lang === 'ar'),
    direction: signal(lang === 'ar' ? 'rtl' : 'ltr'),
    setLanguage: (l: 'en' | 'ar') => languageSignal.set(l),
    toggleLanguage: () => languageSignal.set(languageSignal() === 'en' ? 'ar' : 'en'),
    localize: (en: string, ar: string) => languageSignal() === 'ar' ? ar : en,
  };
}

describe('ProductAnalyticsComponent', () => {
  let component: ProductAnalyticsComponent;
  let fixture: ComponentFixture<ProductAnalyticsComponent>;
  let adminProductsApiSpy: jasmine.SpyObj<AdminProductsApiService>;
  let mockLanguageService: ReturnType<typeof createMockLanguageService>;

  /** @description Expected KPI count from the mock data in the component */
  const EXPECTED_KPI_COUNT = 4;

  /** @description Expected top products count from mock data */
  const EXPECTED_TOP_PRODUCTS_COUNT = 5;

  /** @description Expected stock alert count from mock data */
  const EXPECTED_STOCK_ALERTS_COUNT = 4;

  /**
   * @description Initializes the component and waits for async loading to complete.
   * Must be called within a fakeAsync zone.
   */
  function initAndWaitForLoad(): void {
    fixture.detectChanges(); // triggers ngOnInit
    tick(600); // drain the 500ms setTimeout in loadAnalytics
    fixture.detectChanges(); // re-render after loading completes
  }

  beforeEach(async () => {
    adminProductsApiSpy = jasmine.createSpyObj('AdminProductsApiService', [
      'getProducts',
    ]);

    mockLanguageService = createMockLanguageService('en');

    await TestBed.configureTestingModule({
      imports: [ProductAnalyticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminProductsApiService, useValue: adminProductsApiSpy },
        { provide: LanguageService, useValue: mockLanguageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductAnalyticsComponent);
    component = fixture.componentInstance;
  });

  // =========================================================================
  // COMPONENT CREATION
  // =========================================================================

  /**
   * @description Verifies that the component is created successfully
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  describe('Loading State', () => {
    /**
     * @description Verifies that loading is set to true during initialization
     */
    it('should set loading to true during ngOnInit', fakeAsync(() => {
      // Act
      fixture.detectChanges(); // triggers ngOnInit

      // Assert - loading should be true immediately after init
      expect(component.loading()).toBeTrue();

      // Cleanup: drain the pending timer
      tick(600);
    }));

    /**
     * @description Verifies the loading indicator is displayed when loading is true
     */
    it('should display loading indicator when loading is true', fakeAsync(() => {
      // Arrange & Act
      fixture.detectChanges(); // triggers ngOnInit

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      const loadingState = compiled.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();

      // Cleanup: drain the pending timer
      tick(600);
    }));

    /**
     * @description Verifies loading completes after the simulated async delay
     */
    it('should set loading to false after data loads', fakeAsync(() => {
      // Act
      initAndWaitForLoad();

      // Assert
      expect(component.loading()).toBeFalse();
    }));

    /**
     * @description Verifies the loading indicator is hidden once data has loaded
     */
    it('should hide loading indicator after data loads', fakeAsync(() => {
      // Act
      initAndWaitForLoad();

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      const loadingState = compiled.querySelector('.loading-state');
      expect(loadingState).toBeFalsy();
    }));
  });

  // =========================================================================
  // KPI CARDS
  // =========================================================================

  describe('KPI Cards', () => {
    /**
     * @description Verifies that all 4 KPI cards are rendered after loading
     */
    it('should display all KPI cards after data loads', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const kpiCards = compiled.querySelectorAll('.kpi-card');
      expect(kpiCards.length).toBe(EXPECTED_KPI_COUNT);
    }));

    /**
     * @description Verifies the KPI signals contain the correct mock data
     */
    it('should have correct number of KPIs in signal', fakeAsync(() => {
      initAndWaitForLoad();
      expect(component.kpis().length).toBe(EXPECTED_KPI_COUNT);
    }));

    /**
     * @description Verifies the first KPI has expected Total Products data
     */
    it('should have Total Products as first KPI', fakeAsync(() => {
      initAndWaitForLoad();

      const firstKpi = component.kpis()[0];
      expect(firstKpi.titleEn).toBe('Total Products');
      expect(firstKpi.value).toBe(1247);
      expect(firstKpi.format).toBe('number');
    }));

    /**
     * @description Verifies the Total Revenue KPI has currency format
     */
    it('should have Total Revenue KPI with currency format', fakeAsync(() => {
      initAndWaitForLoad();

      const revenueKpi = component.kpis()[1];
      expect(revenueKpi.titleEn).toBe('Total Revenue');
      expect(revenueKpi.format).toBe('currency');
    }));
  });

  // =========================================================================
  // BILINGUAL LABELS
  // =========================================================================

  describe('Bilingual Labels', () => {
    /**
     * @description Verifies English KPI title is displayed when language is 'en'
     */
    it('should display English KPI title when language is en', fakeAsync(() => {
      initAndWaitForLoad();

      const kpi = component.kpis()[0];
      const title = component.getKpiTitle(kpi);
      expect(title).toBe('Total Products');
    }));

    /**
     * @description Verifies Arabic KPI title is displayed when language is 'ar'
     */
    it('should display Arabic KPI title when language is ar', fakeAsync(() => {
      initAndWaitForLoad();

      mockLanguageService.setLanguage('ar');
      const kpi = component.kpis()[0];
      const title = component.getKpiTitle(kpi);
      expect(title).toBe('\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a');
    }));

    /**
     * @description Verifies English product name is returned for 'en' language
     */
    it('should return English product name when language is en', fakeAsync(() => {
      initAndWaitForLoad();

      const product = component.topProducts()[0];
      const name = component.getProductName(product);
      expect(name).toBe('Wireless Headphones Pro');
    }));

    /**
     * @description Verifies Arabic product name is returned for 'ar' language
     */
    it('should return Arabic product name when language is ar', fakeAsync(() => {
      initAndWaitForLoad();

      mockLanguageService.setLanguage('ar');
      const product = component.topProducts()[0];
      const name = component.getProductName(product);
      expect(name).toBe('\u0633\u0645\u0627\u0639\u0627\u062a \u0644\u0627\u0633\u0644\u0643\u064a\u0629 \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629');
    }));

    /**
     * @description Verifies English category name is returned for 'en' language
     */
    it('should return English category name when language is en', fakeAsync(() => {
      initAndWaitForLoad();

      const category = component.categoryRevenue()[0];
      const name = component.getCategoryName(category);
      expect(name).toBe('Electronics');
    }));

    /**
     * @description Verifies Arabic category name is returned for 'ar' language
     */
    it('should return Arabic category name when language is ar', fakeAsync(() => {
      initAndWaitForLoad();

      mockLanguageService.setLanguage('ar');
      const category = component.categoryRevenue()[0];
      const name = component.getCategoryName(category);
      expect(name).toBe('\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a');
    }));

    /**
     * @description Verifies the page title displays in English when language is 'en'
     */
    it('should display English page title when language is en', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('.analytics-title');
      expect(title?.textContent?.trim()).toContain('Product Analytics');
    }));

    /**
     * @description Verifies the page title displays in Arabic when language is 'ar'
     */
    it('should display Arabic page title when language is ar', fakeAsync(() => {
      mockLanguageService.setLanguage('ar');
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('.analytics-title');
      expect(title?.textContent?.trim()).toContain('\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a');
    }));
  });

  // =========================================================================
  // TOP PRODUCTS TABLE
  // =========================================================================

  describe('Top Products Table', () => {
    /**
     * @description Verifies the top products table renders all rows
     */
    it('should render top products table with correct number of rows', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('.products-table tbody tr');
      expect(rows.length).toBe(EXPECTED_TOP_PRODUCTS_COUNT);
    }));

    /**
     * @description Verifies the top products signal contains expected data
     */
    it('should have correct top products data', fakeAsync(() => {
      initAndWaitForLoad();

      expect(component.topProducts().length).toBe(EXPECTED_TOP_PRODUCTS_COUNT);
      expect(component.topProducts()[0].views).toBe(2847);
      expect(component.topProducts()[0].sales).toBe(156);
    }));
  });

  // =========================================================================
  // CATEGORY REVENUE
  // =========================================================================

  describe('Category Revenue', () => {
    /**
     * @description Verifies the total revenue computed signal calculates correctly
     */
    it('should compute total revenue across all categories', fakeAsync(() => {
      initAndWaitForLoad();

      // Expected: 45600 + 32400 + 28900 + 14800 + 6750 = 128450
      expect(component.totalRevenue()).toBe(128450);
    }));

    /**
     * @description Verifies category revenue list renders all items
     */
    it('should render all category revenue items', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const categoryItems = compiled.querySelectorAll('.category-item');
      expect(categoryItems.length).toBe(5);
    }));
  });

  // =========================================================================
  // STOCK ALERTS
  // =========================================================================

  describe('Stock Alerts', () => {
    /**
     * @description Verifies stock alerts are rendered
     */
    it('should display stock alerts', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const alertItems = compiled.querySelectorAll('.alert-item');
      expect(alertItems.length).toBe(EXPECTED_STOCK_ALERTS_COUNT);
    }));

    /**
     * @description Verifies the alert badge shows the correct count
     */
    it('should show correct alert count in badge', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('.alert-badge');
      expect(badge?.textContent?.trim()).toBe(String(EXPECTED_STOCK_ALERTS_COUNT));
    }));

    /**
     * @description Verifies out-of-stock status for the first alert item
     */
    it('should identify out-of-stock items correctly', fakeAsync(() => {
      initAndWaitForLoad();

      const outOfStockAlert = component.stockAlerts().find(a => a.status === 'out');
      expect(outOfStockAlert).toBeTruthy();
      expect(outOfStockAlert!.stock).toBe(0);
    }));
  });

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  describe('Helper Methods', () => {
    /**
     * @description Verifies calculateChange returns correct positive percentage
     */
    it('should calculate positive percentage change correctly', () => {
      // (1247 - 1198) / 1198 * 100 = 4.09...
      const change = component.calculateChange(1247, 1198);
      expect(change).toBeCloseTo(4.09, 1);
    });

    /**
     * @description Verifies calculateChange returns correct negative percentage
     */
    it('should calculate negative percentage change correctly', () => {
      const change = component.calculateChange(90, 100);
      expect(change).toBeCloseTo(-10.0, 1);
    });

    /**
     * @description Verifies calculateChange returns 0 when previous value is 0
     */
    it('should return 0 when previous value is 0', () => {
      const change = component.calculateChange(100, 0);
      expect(change).toBe(0);
    });

    /**
     * @description Verifies getTrendClass returns correct CSS class for each trend
     */
    it('should return correct trend CSS class', () => {
      expect(component.getTrendClass('up')).toBe('trend-up');
      expect(component.getTrendClass('down')).toBe('trend-down');
      expect(component.getTrendClass('neutral')).toBe('trend-neutral');
    });

    /**
     * @description Verifies getStockStatusClass returns correct CSS class for each status
     */
    it('should return correct stock status CSS class', () => {
      expect(component.getStockStatusClass('low')).toBe('stock-low');
      expect(component.getStockStatusClass('out')).toBe('stock-out');
    });
  });

  // =========================================================================
  // ERROR STATE
  // =========================================================================

  describe('Error State', () => {
    /**
     * @description Verifies error signal is null by default
     */
    it('should have no error initially', () => {
      expect(component.error()).toBeNull();
    });

    /**
     * @description Verifies error state is not shown when there is no error
     */
    it('should not display error state when error is null', fakeAsync(() => {
      initAndWaitForLoad();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorState = compiled.querySelector('.error-state');
      expect(errorState).toBeFalsy();
    }));
  });
});
