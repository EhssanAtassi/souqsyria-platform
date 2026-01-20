import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { SyrianTraditionalCategory, CulturalData } from '../interfaces/syrian-data.interface';
import { SyrianDataService } from './syrian-data.service';
import { SyrianFormattersService } from './syrian-formatters.service';

/**
 * Syrian Categories Service
 *
 * Specialized service for managing traditional Syrian categories and cultural data
 * Provides advanced filtering, cultural authentication, and heritage management
 * Supports artisan directory, seasonal categories, and UNESCO recognition tracking
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianCategoriesService:
 *       type: object
 *       description: Service for Syrian traditional categories and cultural data
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SyrianTraditionalCategory'
 *         culturalData:
 *           $ref: '#/components/schemas/CulturalData'
 *         artisanCount:
 *           type: number
 *           description: Total number of certified artisans
 */
@Injectable({
  providedIn: 'root'
})
export class SyrianCategoriesService {

  private selectedCategories$ = new BehaviorSubject<string[]>([]);
  private heritageFilter$ = new BehaviorSubject<boolean | null>(null);
  private unescoFilter$ = new BehaviorSubject<boolean | null>(null);
  private seasonFilter$ = new BehaviorSubject<string | null>(null);

  constructor(
    private syrianDataService: SyrianDataService,
    private formattersService: SyrianFormattersService
  ) {}

  /**
   * Get all traditional Syrian categories
   * Returns comprehensive list with cultural data
   *
   * @returns Observable<SyrianTraditionalCategory[]> All categories
   *
   * @swagger
   * /api/syrian/categories:
   *   get:
   *     tags: [Syrian Categories]
   *     summary: Get traditional categories
   *     description: Retrieve all traditional Syrian categories with cultural data
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/SyrianTraditionalCategory'
   */
  getTraditionalCategories(): Observable<SyrianTraditionalCategory[]> {
    return this.syrianDataService.getTraditionalCategories();
  }

  /**
   * Get filtered categories based on current filters
   * Applies heritage, UNESCO, and seasonal filters
   *
   * @returns Observable<SyrianTraditionalCategory[]> Filtered categories
   */
  getFilteredCategories(): Observable<SyrianTraditionalCategory[]> {
    return combineLatest([
      this.getTraditionalCategories(),
      this.heritageFilter$,
      this.unescoFilter$,
      this.seasonFilter$
    ]).pipe(
      map(([categories, heritageFilter, unescoFilter, seasonFilter]) => {
        return categories.filter(category => {
          // Heritage filter
          if (heritageFilter !== null && category.heritage !== heritageFilter) {
            return false;
          }

          // UNESCO filter
          if (unescoFilter !== null && category.unesco !== unescoFilter) {
            return false;
          }

          // Season filter
          if (seasonFilter !== null && seasonFilter !== 'all') {
            if (!category.seasonality?.includes(seasonFilter)) {
              return false;
            }
          }

          return true;
        });
      })
    );
  }

  /**
   * Get heritage categories only
   * Returns categories with heritage significance
   *
   * @returns Observable<SyrianTraditionalCategory[]> Heritage categories
   */
  getHeritageCategories(): Observable<SyrianTraditionalCategory[]> {
    return this.syrianDataService.getHeritageCategories();
  }

  /**
   * Get UNESCO recognized categories
   * Returns categories recognized by UNESCO
   *
   * @returns Observable<SyrianTraditionalCategory[]> UNESCO categories
   */
  getUNESCOCategories(): Observable<SyrianTraditionalCategory[]> {
    return this.syrianDataService.getUNESCOCategories();
  }

  /**
   * Get categories by season
   * Returns categories available in specific season
   *
   * @param season - Season identifier
   * @returns Observable<SyrianTraditionalCategory[]> Seasonal categories
   */
  getCategoriesBySeason(season: string): Observable<SyrianTraditionalCategory[]> {
    return this.getTraditionalCategories().pipe(
      map(categories => categories.filter(cat =>
        cat.seasonality?.includes(season) ||
        cat.seasonality?.includes('year-round')
      ))
    );
  }

  /**
   * Get top categories by popularity
   * Returns most popular traditional categories
   *
   * @param limit - Number of categories to return
   * @returns Observable<SyrianTraditionalCategory[]> Top categories
   */
  getTopCategories(limit: number = 5): Observable<SyrianTraditionalCategory[]> {
    return this.getTraditionalCategories().pipe(
      map(categories => {
        return categories
          .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
          .slice(0, limit);
      })
    );
  }

  /**
   * Search categories by name or description
   * Supports Arabic and English search terms
   *
   * @param query - Search query
   * @returns Observable<SyrianTraditionalCategory[]> Search results
   */
  searchCategories(query: string): Observable<SyrianTraditionalCategory[]> {
    if (!query) {
      return this.getTraditionalCategories();
    }

    const searchTerm = query.toLowerCase();

    return this.getTraditionalCategories().pipe(
      map(categories => categories.filter(cat =>
        cat.nameEn.toLowerCase().includes(searchTerm) ||
        cat.nameAr.includes(query) ||
        cat.description.toLowerCase().includes(searchTerm) ||
        cat.authenticityCriteria?.some(criteria =>
          criteria.toLowerCase().includes(searchTerm)
        )
      ))
    );
  }

  /**
   * Get category by ID
   * Returns specific category with full details
   *
   * @param categoryId - Category identifier
   * @returns Observable<SyrianTraditionalCategory | null> Category details
   */
  getCategoryById(categoryId: string): Observable<SyrianTraditionalCategory | null> {
    return this.getTraditionalCategories().pipe(
      map(categories => categories.find(cat => cat.id === categoryId) || null)
    );
  }

  /**
   * Get related categories
   * Returns categories related to the specified category
   *
   * @param categoryId - Category identifier
   * @returns Observable<SyrianTraditionalCategory[]> Related categories
   */
  getRelatedCategories(categoryId: string): Observable<SyrianTraditionalCategory[]> {
    return this.getCategoryById(categoryId).pipe(
      switchMap(category => {
        if (!category || !category.relatedCategories) {
          return of([]);
        }

        return this.getTraditionalCategories().pipe(
          map(allCategories =>
            allCategories.filter(cat =>
              cat.id !== categoryId &&
              category.relatedCategories?.includes(cat.id)
            )
          )
        );
      })
    );
  }

  /**
   * Get artisan directory by category
   * Returns artisan information for specific category
   *
   * @param categoryId - Category identifier
   * @returns Observable<any[]> Artisan directory
   */
  getArtisansByCategory(categoryId: string): Observable<any[]> {
    // Mock artisan data - in real implementation, this would come from backend
    const mockArtisans = [
      {
        id: 'artisan_001',
        nameEn: 'Mohammad Al-Dimashqi',
        nameAr: 'محمد الدمشقي',
        specialtyEn: 'Damascus Steel Craftsman',
        specialtyAr: 'صانع الفولاذ الدمشقي',
        experienceYears: 25,
        certifications: ['Master Craftsman', 'Heritage Guild Member'],
        location: 'Old Damascus',
        contactPhone: '+963-11-1234567',
        workshopAddress: 'Straight Street, Old Damascus',
        rating: 4.9,
        completedOrders: 1247,
        categoryId: 'damascus_steel'
      },
      {
        id: 'artisan_002',
        nameEn: 'Fatima Al-Halabiya',
        nameAr: 'فاطمة الحلبية',
        specialtyEn: 'Traditional Soap Maker',
        specialtyAr: 'صانعة الصابون التقليدي',
        experienceYears: 18,
        certifications: ['Aleppo Soap Guild', 'Organic Certification'],
        location: 'Aleppo',
        contactPhone: '+963-21-9876543',
        workshopAddress: 'Jdeideh Quarter, Aleppo',
        rating: 4.8,
        completedOrders: 2156,
        categoryId: 'aleppo_soap'
      },
      {
        id: 'artisan_003',
        nameEn: 'Ahmad Al-Nashhar',
        nameAr: 'أحمد النشار',
        specialtyEn: 'Mother-of-Pearl Inlay Artist',
        specialtyAr: 'فنان التطعيم بالصدف',
        experienceYears: 32,
        certifications: ['UNESCO Heritage Craftsman', 'Damascus Artisan Guild'],
        location: 'Damascus',
        contactPhone: '+963-11-7654321',
        workshopAddress: 'Bab Touma, Damascus',
        rating: 4.9,
        completedOrders: 892,
        categoryId: 'syrian_inlay'
      }
    ];

    return of(mockArtisans.filter(artisan => artisan.categoryId === categoryId))
      .pipe(delay(300));
  }

  /**
   * Get cultural authenticity criteria
   * Returns criteria for verifying cultural authenticity
   *
   * @param categoryId - Category identifier
   * @returns Observable<string[]> Authenticity criteria
   */
  getAuthenticityCriteria(categoryId: string): Observable<string[]> {
    return this.getCategoryById(categoryId).pipe(
      map(category => category?.authenticityCriteria || [])
    );
  }

  /**
   * Validate product cultural authenticity
   * Checks if product meets cultural authenticity standards
   *
   * @param categoryId - Category identifier
   * @param productData - Product data to validate
   * @returns Observable<{valid: boolean, score: number, feedback: string[]}> Validation result
   */
  validateCulturalAuthenticity(
    categoryId: string,
    productData: any
  ): Observable<{valid: boolean, score: number, feedback: string[]}> {
    return this.getCategoryById(categoryId).pipe(
      map(category => {
        if (!category) {
          return { valid: false, score: 0, feedback: ['Category not found'] };
        }

        const feedback: string[] = [];
        let score = 0;
        const maxScore = category.authenticityCriteria?.length || 1;

        // Check each authenticity criterion
        category.authenticityCriteria?.forEach(criterion => {
          // Mock validation logic - in real implementation, this would be more sophisticated
          if (this.checkCriterion(criterion, productData)) {
            score++;
            feedback.push(`✓ ${criterion}: Verified`);
          } else {
            feedback.push(`✗ ${criterion}: Not verified`);
          }
        });

        const percentageScore = (score / maxScore) * 100;
        const valid = percentageScore >= 80; // 80% threshold for authenticity

        return {
          valid,
          score: percentageScore,
          feedback
        };
      })
    );
  }

  /**
   * Get seasonal availability
   * Returns seasonal availability information for categories
   *
   * @returns Observable<{season: string, categories: SyrianTraditionalCategory[]}[]> Seasonal data
   */
  getSeasonalAvailability(): Observable<{season: string, categories: SyrianTraditionalCategory[]}[]> {
    const seasons = ['spring', 'summer', 'fall', 'winter', 'ramadan', 'eid', 'year-round'];

    return this.getTraditionalCategories().pipe(
      map(categories => {
        return seasons.map(season => ({
          season,
          categories: categories.filter(cat =>
            cat.seasonality?.includes(season)
          )
        }));
      })
    );
  }

  /**
   * Get category statistics
   * Returns comprehensive statistics for traditional categories
   *
   * @returns Observable<any> Category statistics
   */
  getCategoryStatistics(): Observable<any> {
    return this.getTraditionalCategories().pipe(
      map(categories => {
        const stats = {
          totalCategories: categories.length,
          heritageCategories: categories.filter(cat => cat.heritage).length,
          unescoCategories: categories.filter(cat => cat.unesco).length,
          totalArtisans: categories.reduce((sum, cat) => sum + (cat.artisanCount || 0), 0),
          averagePopularity: categories.reduce((sum, cat) => sum + (cat.popularityScore || 0), 0) / categories.length,
          averagePrice: categories.reduce((sum, cat) => sum + (cat.averagePrice || 0), 0) / categories.length,
          seasonalDistribution: {},
          priceRanges: {
            budget: categories.filter(cat => (cat.averagePrice || 0) < 100000).length,
            moderate: categories.filter(cat => (cat.averagePrice || 0) >= 100000 && (cat.averagePrice || 0) < 500000).length,
            premium: categories.filter(cat => (cat.averagePrice || 0) >= 500000 && (cat.averagePrice || 0) < 1000000).length,
            luxury: categories.filter(cat => (cat.averagePrice || 0) >= 1000000).length
          }
        };

        // Calculate seasonal distribution
        const allSeasons = ['spring', 'summer', 'fall', 'winter', 'ramadan', 'eid', 'year-round'];
        allSeasons.forEach(season => {
          stats.seasonalDistribution[season] = categories.filter(cat =>
            cat.seasonality?.includes(season)
          ).length;
        });

        return stats;
      })
    );
  }

  // =============================================
  // FILTER MANAGEMENT
  // =============================================

  /**
   * Set heritage filter
   * Filters categories by heritage status
   */
  setHeritageFilter(heritage: boolean | null): void {
    this.heritageFilter$.next(heritage);
  }

  /**
   * Set UNESCO filter
   * Filters categories by UNESCO recognition
   */
  setUNESCOFilter(unesco: boolean | null): void {
    this.unescoFilter$.next(unesco);
  }

  /**
   * Set season filter
   * Filters categories by seasonal availability
   */
  setSeasonFilter(season: string | null): void {
    this.seasonFilter$.next(season);
  }

  /**
   * Clear all filters
   * Resets all category filters
   */
  clearFilters(): void {
    this.heritageFilter$.next(null);
    this.unescoFilter$.next(null);
    this.seasonFilter$.next(null);
  }

  /**
   * Get current filter state
   * Returns current filter configuration
   */
  getCurrentFilters(): Observable<{heritage: boolean | null, unesco: boolean | null, season: string | null}> {
    return combineLatest([
      this.heritageFilter$,
      this.unescoFilter$,
      this.seasonFilter$
    ]).pipe(
      map(([heritage, unesco, season]) => ({ heritage, unesco, season }))
    );
  }

  // =============================================
  // SELECTION MANAGEMENT
  // =============================================

  /**
   * Set selected categories
   * Updates the list of selected categories
   */
  setSelectedCategories(categoryIds: string[]): void {
    this.selectedCategories$.next(categoryIds);
  }

  /**
   * Add category to selection
   * Adds a category to the current selection
   */
  addCategoryToSelection(categoryId: string): void {
    const current = this.selectedCategories$.value;
    if (!current.includes(categoryId)) {
      this.selectedCategories$.next([...current, categoryId]);
    }
  }

  /**
   * Remove category from selection
   * Removes a category from the current selection
   */
  removeCategoryFromSelection(categoryId: string): void {
    const current = this.selectedCategories$.value;
    this.selectedCategories$.next(current.filter(id => id !== categoryId));
  }

  /**
   * Get selected categories
   * Returns currently selected categories
   */
  getSelectedCategories(): Observable<string[]> {
    return this.selectedCategories$.asObservable();
  }

  /**
   * Clear category selection
   * Clears all selected categories
   */
  clearSelection(): void {
    this.selectedCategories$.next([]);
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Check individual authenticity criterion
   * Helper method to validate specific criterion
   */
  private checkCriterion(criterion: string, productData: any): boolean {
    // Mock validation logic - in real implementation, this would use AI/ML
    // or detailed product analysis
    const criterionLower = criterion.toLowerCase();

    if (criterionLower.includes('traditional') && productData.isTraditional) {
      return true;
    }

    if (criterionLower.includes('hand') && productData.isHandmade) {
      return true;
    }

    if (criterionLower.includes('syrian') && productData.originCountry === 'Syria') {
      return true;
    }

    if (criterionLower.includes('artisan') && productData.hasArtisanCertification) {
      return true;
    }

    // Default: randomly pass 70% of criteria for demo
    return Math.random() > 0.3;
  }
}