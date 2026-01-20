import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HomepageSectionsService } from './homepage-sections.service';
import { CategoryShowcaseSection } from '../interfaces/category-showcase.interface';
import {
  BackendHomepageResponse,
  BackendHomepageSection,
  BackendFeaturedProduct,
  BackendChildCategory
} from '../interfaces/backend-homepage-api.interface';

/**
 * Test suite for HomepageSectionsService
 *
 * Tests the homepage category showcase sections service that manages
 * admin-configurable sections for the Syrian marketplace homepage.
 *
 * @description
 * This test suite covers:
 * - Service instantiation and dependency injection
 * - Backend API integration with HttpClient
 * - Data transformation from backend to frontend format
 * - Error handling and fallback to mock data
 * - Retrieving visible sections
 * - Retrieving complete homepage configuration
 * - Data structure validation
 * - Observable behavior and async operations
 * - Section ordering and visibility filtering
 */
describe('HomepageSectionsService', () => {
  let service: HomepageSectionsService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3001/api';

  // Mock backend data matching real API structure
  const mockBackendSection: BackendHomepageSection = {
    section_id: 17,
    section_name_en: 'Consumer Electronics',
    section_name_ar: 'الإلكترونيات الاستهلاكية',
    section_slug: 'consumer-electronics',
    featured_product: {
      id: 1,
      name_en: 'Marshall Kilburn II Speaker',
      name_ar: 'سماعة مارشال كيلبورن 2',
      slug: 'marshall-kilburn-speaker',
      sku: 'MAR-SPK-001',
      currency: 'SYP',
      base_price: '625000.00',
      discount_price: '205000.00',
      discount_percentage: 67,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
      is_featured: true,
      featured_priority: 100,
      featured_badge: 'Best Seller',
      featured_start_date: '2025-10-07T21:00:00.000Z',
      featured_end_date: '2025-11-07T20:59:59.000Z',
      is_best_seller: true,
      sales_count: 450,
      category: {
        id: 17,
        name_en: 'Consumer Electronics',
        name_ar: 'الإلكترونيات الاستهلاكية',
        slug: 'consumer-electronics',
        parent_id: null
      },
      status: 'published',
      approval_status: 'approved',
      is_active: true,
      is_published: true,
      created_at: '2025-10-08T15:46:43.508Z',
      promotional_text: 'اختبر صوتًا رائعًا مع سماعة مارشال'
    },
    child_categories: [
      {
        id: 20,
        name_en: 'Audios & Theaters',
        name_ar: 'الصوتيات والمسارح',
        slug: 'audios-theaters',
        image_url: 'speaker',
        product_count: 2
      },
      {
        id: 21,
        name_en: 'TV Televisions',
        name_ar: 'التلفزيونات',
        slug: 'tv-televisions',
        image_url: 'tv',
        product_count: 2
      },
      {
        id: 22,
        name_en: 'Washing Machines',
        name_ar: 'الغسالات',
        slug: 'washing-machines',
        image_url: 'washing_machine',
        product_count: 0
      },
      {
        id: 23,
        name_en: 'Air Conditioners',
        name_ar: 'المكيفات',
        slug: 'air-conditioners',
        image_url: 'ac',
        product_count: 0
      },
      {
        id: 24,
        name_en: 'Refrigerators',
        name_ar: 'الثلاجات',
        slug: 'refrigerators',
        image_url: 'refrigerator',
        product_count: 0
      },
      {
        id: 25,
        name_en: 'Office Electronics',
        name_ar: 'إلكترونيات المكتب',
        slug: 'office-electronics',
        image_url: 'office',
        product_count: 0
      },
      {
        id: 26,
        name_en: 'Car Electronics',
        name_ar: 'إلكترونيات السيارة',
        slug: 'car-electronics',
        image_url: 'car',
        product_count: 0
      }
    ]
  };

  const mockBackendResponse: BackendHomepageResponse = {
    data: [mockBackendSection],
    meta: { total: 1 }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HomepageSectionsService]
    });
    service = TestBed.inject(HomepageSectionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding HTTP requests
  });

  /**
   * Test: Service Creation
   * Verifies service can be instantiated correctly
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Test Group: API Integration
   * Tests backend API calls and HTTP interactions
   */
  describe('API Integration', () => {
    it('should call backend API when getting visible sections', () => {
      service.getVisibleSections(3, false).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse);
    });

    it('should use mock data when useMockData is true', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          expect(sections).toBeDefined();
          expect(sections.length).toBeGreaterThan(0);
          done();
        }
      });

      // Should NOT make HTTP request
      httpMock.expectNone(`${apiUrl}/categories/homepage-sections`);
    });

    it('should pass correct limit parameter to API', () => {
      service.getVisibleSections(5).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=5`);
      expect(req.request.params.get('limit')).toBe('5');
      req.flush({ data: [], meta: { total: 0 } });
    });

    it('should call API for homepage config', () => {
      service.getHomepageConfig().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse);
    });
  });

  /**
   * Test Group: Data Transformation
   * Tests transformation of backend data to frontend format
   */
  describe('Data Transformation', () => {
    it('should transform backend section structure to frontend format', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          expect(sections.length).toBe(1);

          const section = sections[0];
          expect(section.id).toBe('17'); // number → string
          expect(section.title.en).toBe('Consumer Electronics');
          expect(section.title.ar).toBe('الإلكترونيات الاستهلاكية');

          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });

    it('should transform featured product to banner format', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          const banner = sections[0].featuredBanner;

          expect(banner.id).toBe('1');
          expect(banner.title.en).toBe('Marshall Kilburn II Speaker');
          expect(banner.originalPrice).toBe(625000); // string → number
          expect(banner.discountedPrice).toBe(205000); // string → number
          expect(banner.currency).toBe('SYP');
          expect(banner.ctaText.en).toBe('Shop Now');
          expect(banner.ctaLink).toBe('/product/marshall-kilburn-speaker');

          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });

    it('should transform child categories to subcategory cards', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          const subcategories = sections[0].subcategories;

          expect(subcategories.length).toBe(7);

          // First 2 should be featured
          expect(subcategories[0].featured).toBe(true);
          expect(subcategories[1].featured).toBe(true);
          expect(subcategories[2].featured).toBe(false);

          // Check field transformations
          expect(subcategories[0].name.en).toBe('Audios & Theaters');
          expect(subcategories[0].itemCount).toBe(2); // product_count → itemCount
          expect(subcategories[0].route).toBe('/category/audios-theaters');

          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });

    it('should map icon names to Material Design icons', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          const subcategories = sections[0].subcategories;

          // First 2 are featured, rest should have icons
          const iconSubcategory = subcategories.find(s => s.iconClass);
          expect(iconSubcategory).toBeDefined();
          expect(iconSubcategory?.iconClass).toBeTruthy();

          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });

    it('should translate badges to Arabic', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          const banner = sections[0].featuredBanner;

          expect(banner.badge).toBeDefined();
          expect(banner.badge?.text.en).toBe('Best Seller');
          expect(banner.badge?.text.ar).toBe('الأكثر مبيعاً');

          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });

    it('should generate navigation links from section slug', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          const links = sections[0].navigationLinks;

          expect(links.newArrivals).toBe('/category/consumer-electronics/new-arrivals');
          expect(links.bestSeller).toBe('/category/consumer-electronics/best-sellers');

          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });
  });

  /**
   * Test Group: Error Handling
   * Tests fallback behavior when API fails
   */
  describe('Error Handling', () => {
    it('should fallback to mock data when API returns 404', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          expect(sections).toBeDefined();
          expect(sections.length).toBeGreaterThan(0);
          // Should have mock data structure
          expect(sections[0].id).toBeDefined();
          expect(sections[0].title).toBeDefined();
          done();
        },
        error: () => done.fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should fallback to mock data when API returns 500', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          expect(sections).toBeDefined();
          expect(sections.length).toBeGreaterThan(0);
          done();
        },
        error: () => done.fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should fallback to mock data when network fails', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          expect(sections).toBeDefined();
          expect(sections.length).toBeGreaterThan(0);
          done();
        },
        error: () => done.fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should fallback to mock config when API fails for getHomepageConfig', (done) => {
      service.getHomepageConfig().subscribe({
        next: (config) => {
          expect(config).toBeDefined();
          expect(config.sections).toBeDefined();
          expect(config.updatedBy).toContain('mock');
          done();
        },
        error: () => done.fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=10`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  /**
   * Test: Get Visible Sections (Mock Data Mode)
   * Verifies service returns only visible sections using mock data
   */
  describe('getVisibleSections (Mock Data)', () => {
    it('should return an observable of visible sections', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          expect(sections).toBeDefined();
          expect(Array.isArray(sections)).toBe(true);
          expect(sections.length).toBeGreaterThan(0);
          done();
        },
        error: done.fail
      });
    });

    it('should return only sections marked as visible', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          sections.forEach(section => {
            expect(section.visible).toBe(true);
          });
          done();
        },
        error: done.fail
      });
    });

    it('should return sections sorted by order property', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          for (let i = 1; i < sections.length; i++) {
            expect(sections[i].order).toBeGreaterThanOrEqual(sections[i - 1].order);
          }
          done();
        },
        error: done.fail
      });
    });

    it('should return sections with valid structure', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          sections.forEach(section => {
            // Required fields
            expect(section.id).toBeDefined();
            expect(section.title).toBeDefined();
            expect(section.title.en).toBeDefined();
            expect(section.title.ar).toBeDefined();
            expect(section.visible).toBe(true);
            expect(section.order).toBeDefined();
            expect(section.featuredBanner).toBeDefined();
            expect(section.subcategories).toBeDefined();
            expect(section.navigationLinks).toBeDefined();

            // Featured banner structure
            const banner = section.featuredBanner;
            expect(banner.id).toBeDefined();
            expect(banner.title.en).toBeDefined();
            expect(banner.title.ar).toBeDefined();
            expect(banner.imageUrl).toBeDefined();
            expect(banner.originalPrice).toBeGreaterThan(0);
            expect(banner.discountedPrice).toBeGreaterThan(0);
            expect(banner.currency).toBeDefined();
            expect(banner.ctaText.en).toBeDefined();
            expect(banner.ctaText.ar).toBeDefined();
            expect(banner.ctaLink).toBeDefined();

            // Subcategories structure
            expect(Array.isArray(section.subcategories)).toBe(true);
            section.subcategories.forEach(subcat => {
              expect(subcat.id).toBeDefined();
              expect(subcat.name.en).toBeDefined();
              expect(subcat.name.ar).toBeDefined();
              expect(subcat.itemCount).toBeGreaterThanOrEqual(0);
              expect(subcat.route).toBeDefined();
            });

            // Navigation links
            expect(section.navigationLinks.newArrivals).toBeDefined();
            expect(section.navigationLinks.bestSeller).toBeDefined();
          });
          done();
        },
        error: done.fail
      });
    });

    it('should include Syrian marketplace themed sections', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          const sectionTitles = sections.map(s => s.title.en.toLowerCase());

          // Expect Syrian-themed sections
          const hasSyrianContent = sections.some(section =>
            section.title.en.includes('Damascus') ||
            section.title.en.includes('Syrian') ||
            section.title.ar.includes('دمشق') ||
            section.title.ar.includes('سوري')
          );

          expect(hasSyrianContent).toBe(true);
          done();
        },
        error: done.fail
      });
    });
  });

  /**
   * Test: Get Homepage Configuration
   * Verifies service returns complete configuration including all sections
   */
  describe('getHomepageConfig', () => {
    it('should return an observable of homepage configuration', (done) => {
      service.getHomepageConfig().subscribe({
        next: (config) => {
          expect(config).toBeDefined();
          expect(config.sections).toBeDefined();
          expect(Array.isArray(config.sections)).toBe(true);
          expect(config.lastUpdated).toBeDefined();
          expect(config.updatedBy).toBeDefined();
          done();
        },
        error: done.fail
      });
    });

    it('should include both visible and hidden sections', (done) => {
      service.getHomepageConfig().subscribe({
        next: (config) => {
          const allSections = config.sections;
          const visibleCount = allSections.filter(s => s.visible).length;
          const totalCount = allSections.length;

          expect(totalCount).toBeGreaterThanOrEqual(visibleCount);
          done();
        },
        error: done.fail
      });
    });

    it('should have valid metadata', (done) => {
      service.getHomepageConfig().subscribe({
        next: (config) => {
          expect(config.lastUpdated).toBeInstanceOf(Date);
          expect(config.updatedBy).toContain('@');
          done();
        },
        error: done.fail
      });
    });
  });

  /**
   * Test: Data Consistency
   * Verifies data consistency across different service methods
   */
  describe('Data Consistency', () => {
    it('visible sections should be subset of all sections', (done) => {
      let allSections: CategoryShowcaseSection[] = [];
      let visibleSections: CategoryShowcaseSection[] = [];

      // Use mock data to avoid HTTP calls in consistency tests
      service.getVisibleSections(3, true).subscribe({
        next: (visible) => {
          visibleSections = visible;

          service.getVisibleSections(10, true).subscribe({
            next: (all) => {
              allSections = all;

              expect(visibleSections.length).toBeLessThanOrEqual(allSections.length);

              // Every visible section should exist in all sections
              visibleSections.forEach(visibleSection => {
                const exists = allSections.some(s => s.id === visibleSection.id);
                expect(exists).toBe(true);
              });

              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });
    });
  });

  /**
   * Test: Observable Behavior
   * Verifies observables emit values correctly
   */
  describe('Observable Behavior', () => {
    it('should emit values asynchronously', (done) => {
      let emitted = false;

      service.getVisibleSections(3, true).subscribe({
        next: () => {
          emitted = true;
        }
      });

      // Should not have emitted synchronously
      expect(emitted).toBe(false);

      // Wait for async emission
      setTimeout(() => {
        expect(emitted).toBe(true);
        done();
      }, 100);
    });

    it('should complete after emitting', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: () => {},
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });
  });

  /**
   * Test: Section Count
   * Verifies expected number of sections
   */
  describe('Section Count', () => {
    it('should have at least 3 showcase sections', (done) => {
      service.getVisibleSections(10, true).subscribe({
        next: (sections) => {
          expect(sections.length).toBeGreaterThanOrEqual(3);
          done();
        },
        error: done.fail
      });
    });

    it('should have exactly 7 subcategories per section', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          sections.forEach(section => {
            expect(section.subcategories.length).toBe(7);
          });
          done();
        },
        error: done.fail
      });
    });

    it('should respect limit parameter', (done) => {
      service.getVisibleSections(2, true).subscribe({
        next: (sections) => {
          expect(sections.length).toBeLessThanOrEqual(2);
          done();
        },
        error: done.fail
      });
    });
  });

  /**
   * Test: Pricing Validation
   * Verifies discount pricing logic
   */
  describe('Pricing Validation', () => {
    it('should have discounted price less than original price', (done) => {
      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          sections.forEach(section => {
            const banner = section.featuredBanner;
            expect(banner.discountedPrice).toBeLessThan(banner.originalPrice);
          });
          done();
        },
        error: done.fail
      });
    });

    it('should have valid currency codes', (done) => {
      const validCurrencies = ['USD', 'SYP', 'EUR', 'GBP'];

      service.getVisibleSections(3, true).subscribe({
        next: (sections) => {
          sections.forEach(section => {
            expect(validCurrencies).toContain(section.featuredBanner.currency);
          });
          done();
        },
        error: done.fail
      });
    });

    it('should calculate correct discount percentage from API data', (done) => {
      service.getVisibleSections(3, false).subscribe({
        next: (sections) => {
          const banner = sections[0].featuredBanner;
          const calculatedDiscount = Math.round(
            ((banner.originalPrice - banner.discountedPrice) / banner.originalPrice) * 100
          );
          expect(calculatedDiscount).toBeGreaterThan(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/homepage-sections?limit=3`);
      req.flush(mockBackendResponse);
    });
  });
});
