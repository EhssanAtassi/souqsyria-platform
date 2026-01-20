import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, timer, throwError } from 'rxjs';
import { map, catchError, retry, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Campaign, CampaignType, CampaignStatus, CampaignTemplate, CampaignPerformanceSummary, CampaignABTest } from '../interfaces/campaign.interface';
import { Product } from '../interfaces/product.interface';
import { MOCK_CAMPAIGNS, MOCK_CAMPAIGN_TEMPLATES, DEFAULT_FALLBACK_CAMPAIGN } from '../data/mock-campaigns.data';
import { environment } from '../../../environments/environment';

/**
 * Campaign Service for SouqSyria Syrian Marketplace
 *
 * Comprehensive campaign management service featuring:
 * - Campaign CRUD operations with caching
 * - Real-time campaign status management
 * - Syrian marketplace-specific campaign templates
 * - Campaign analytics and performance tracking
 * - A/B testing support for campaign optimization
 * - Campaign scheduling and activation logic
 * - Contextual product recommendations
 * - Bilingual campaign content management
 *
 * @swagger
 * components:
 *   schemas:
 *     CampaignService:
 *       type: object
 *       properties:
 *         campaigns:
 *           type: array
 *           description: Cached campaigns array
 *           items:
 *             $ref: '#/components/schemas/Campaign'
 *         activeCampaigns:
 *           type: array
 *           description: Currently active campaigns
 *           items:
 *             $ref: '#/components/schemas/Campaign'
 *         campaignTemplates:
 *           type: array
 *           description: Available campaign templates
 *           items:
 *             $ref: '#/components/schemas/CampaignTemplate'
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  //#region Private Properties and Configuration

  /** HTTP client for API communication */
  private readonly http = inject(HttpClient);

  /** Base API URL for campaign endpoints */
  private readonly baseUrl = `${environment.apiUrl}/campaigns`;

  /** Cache duration in milliseconds (5 minutes) */
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  /** Maximum retry attempts for failed requests */
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /** Retry delay in milliseconds */
  private readonly RETRY_DELAY = 1000;

  //#endregion

  //#region Reactive State Management with Signals

  /** All campaigns cache */
  private readonly _campaigns = signal<Campaign[]>([]);

  /** Loading state for campaigns */
  private readonly _isLoading = signal<boolean>(false);

  /** Error state for campaign operations */
  private readonly _error = signal<string | null>(null);

  /** Last cache refresh timestamp */
  private readonly _lastCacheRefresh = signal<Date | null>(null);

  /** Campaign templates cache */
  private readonly _campaignTemplates = signal<CampaignTemplate[]>([]);

  /** Active campaigns computed from cache */
  readonly activeCampaigns = computed(() => {
    const now = new Date();
    return this._campaigns().filter(campaign =>
      campaign.status === 'active' &&
      this.isCampaignScheduleActive(campaign, now)
    );
  });

  /** Hero campaigns for main slider */
  readonly heroCampaigns = computed(() => {
    return this.activeCampaigns().filter(campaign => campaign.type === 'hero');
  });

  /** Banner campaigns for secondary display */
  readonly bannerCampaigns = computed(() => {
    return this.activeCampaigns().filter(campaign => campaign.type === 'banner');
  });

  /** Seasonal campaigns */
  readonly seasonalCampaigns = computed(() => {
    return this.activeCampaigns().filter(campaign => campaign.type === 'seasonal');
  });

  /** Cultural campaigns (Syrian heritage) */
  readonly culturalCampaigns = computed(() => {
    return this.activeCampaigns().filter(campaign =>
      campaign.type === 'cultural_celebration' ||
      campaign.type === 'artisan_spotlight' ||
      campaign.type === 'regional_specialty'
    );
  });

  /** Loading state accessor */
  readonly isLoading = this._isLoading.asReadonly();

  /** Error state accessor */
  readonly error = this._error.asReadonly();

  /** Campaign templates accessor */
  readonly campaignTemplates = this._campaignTemplates.asReadonly();

  /** Cache validity checker */
  readonly isCacheValid = computed(() => {
    const lastRefresh = this._lastCacheRefresh();
    if (!lastRefresh) return false;

    const now = new Date();
    return (now.getTime() - lastRefresh.getTime()) < this.CACHE_DURATION;
  });

  //#endregion

  //#region Campaign Data Management

  /**
   * Gets all campaigns with caching
   * @description Retrieves campaigns from cache or API
   * @param forceRefresh - Force refresh from API
   * @returns Observable of campaigns array
   */
  getCampaigns(forceRefresh: boolean = false): Observable<Campaign[]> {
    // Use mock data if enabled in environment OR if offline mode is forced
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log('Using mock campaigns data (offline mode or enableMockData: true)');
      this._isLoading.set(false);
      this._error.set(null);

      const mockCampaigns = MOCK_CAMPAIGNS.filter(campaign =>
        campaign.status === 'active' || campaign.status === 'scheduled'
      );

      this._campaigns.set(mockCampaigns);
      this._lastCacheRefresh.set(new Date());

      return of(mockCampaigns);
    }

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid() && this._campaigns().length > 0) {
      console.log('Returning cached campaigns:', this._campaigns().length);
      return of(this._campaigns());
    }

    console.log('Fetching campaigns from API...');
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Campaign[]>(`${this.baseUrl}`)
      .pipe(
        retry({
          count: this.MAX_RETRY_ATTEMPTS,
          delay: this.RETRY_DELAY
        }),
        map(campaigns => this.processCampaignsResponse(campaigns)),
        tap(campaigns => {
          this._campaigns.set(campaigns);
          this._lastCacheRefresh.set(new Date());
          this._isLoading.set(false);
          console.log(`Successfully loaded ${campaigns.length} campaigns`);
        }),
        catchError(error => {
          console.warn('API unavailable, using mock campaign data');
          const mockCampaigns = this.processCampaignsResponse(MOCK_CAMPAIGNS);
          this._campaigns.set(mockCampaigns);
          this._lastCacheRefresh.set(new Date());
          this._isLoading.set(false);
          console.log(`Loaded ${mockCampaigns.length} mock campaigns`);
          return of(mockCampaigns);
        }),
        shareReplay(1)
      );
  }

  /**
   * Gets active campaigns for specific type
   * @description Retrieves active campaigns filtered by type
   * @param type - Campaign type to filter by
   * @returns Observable of filtered campaigns
   */
  getCampaignsByType(type: CampaignType): Observable<Campaign[]> {
    return this.getCampaigns().pipe(
      map(campaigns => campaigns.filter(campaign =>
        campaign.type === type &&
        campaign.status === 'active' &&
        this.isCampaignScheduleActive(campaign)
      ))
    );
  }

  /**
   * Gets a specific campaign by ID
   * @description Retrieves single campaign with full details
   * @param campaignId - Campaign identifier
   * @returns Observable of campaign or null
   */
  getCampaignById(campaignId: string): Observable<Campaign | null> {
    console.log('Fetching campaign by ID:', campaignId);

    return this.http.get<Campaign>(`${this.baseUrl}/${campaignId}`)
      .pipe(
        map(campaign => this.processCampaignResponse(campaign)),
        catchError(error => {
          if (error.status === 404) {
            console.warn('Campaign not found:', campaignId);
            return of(null);
          }
          return this.handleError('Failed to load campaign', error);
        })
      );
  }

  /**
   * Creates a new campaign
   * @description Creates campaign with validation and Syrian marketplace defaults
   * @param campaign - Campaign data to create
   * @returns Observable of created campaign
   */
  createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    console.log('Creating new campaign:', campaign.name);

    const campaignData = this.prepareCampaignForSubmission(campaign);

    return this.http.post<Campaign>(`${this.baseUrl}`, campaignData)
      .pipe(
        map(response => this.processCampaignResponse(response)),
        tap(createdCampaign => {
          // Update cache
          const currentCampaigns = this._campaigns();
          this._campaigns.set([...currentCampaigns, createdCampaign]);
          console.log('Campaign created successfully:', createdCampaign.id);
        }),
        catchError(error => this.handleError('Failed to create campaign', error))
      );
  }

  /**
   * Updates an existing campaign
   * @description Updates campaign with validation
   * @param campaignId - Campaign identifier
   * @param updates - Campaign updates to apply
   * @returns Observable of updated campaign
   */
  updateCampaign(campaignId: string, updates: Partial<Campaign>): Observable<Campaign> {
    console.log('Updating campaign:', campaignId);

    const updateData = this.prepareCampaignForSubmission(updates);

    return this.http.put<Campaign>(`${this.baseUrl}/${campaignId}`, updateData)
      .pipe(
        map(response => this.processCampaignResponse(response)),
        tap(updatedCampaign => {
          // Update cache
          const currentCampaigns = this._campaigns();
          const index = currentCampaigns.findIndex(c => c.id === campaignId);
          if (index !== -1) {
            const newCampaigns = [...currentCampaigns];
            newCampaigns[index] = updatedCampaign;
            this._campaigns.set(newCampaigns);
          }
          console.log('Campaign updated successfully:', campaignId);
        }),
        catchError(error => this.handleError('Failed to update campaign', error))
      );
  }

  /**
   * Deletes a campaign
   * @description Soft deletes campaign (sets status to completed)
   * @param campaignId - Campaign identifier
   * @returns Observable of deletion success
   */
  deleteCampaign(campaignId: string): Observable<boolean> {
    console.log('Deleting campaign:', campaignId);

    return this.http.delete(`${this.baseUrl}/${campaignId}`)
      .pipe(
        map(() => {
          // Remove from cache
          const currentCampaigns = this._campaigns();
          const filteredCampaigns = currentCampaigns.filter(c => c.id !== campaignId);
          this._campaigns.set(filteredCampaigns);
          console.log('Campaign deleted successfully:', campaignId);
          return true;
        }),
        catchError(error => this.handleError('Failed to delete campaign', error))
      );
  }

  //#endregion

  //#region Campaign Templates Management

  /**
   * Gets available campaign templates
   * @description Retrieves Syrian marketplace-specific campaign templates
   * @returns Observable of campaign templates
   */
  getCampaignTemplates(): Observable<CampaignTemplate[]> {
    console.log('Fetching campaign templates...');

    return this.http.get<CampaignTemplate[]>(`${this.baseUrl}/templates`)
      .pipe(
        tap(templates => {
          this._campaignTemplates.set(templates);
          console.log(`Loaded ${templates.length} campaign templates`);
        }),
        catchError(error => {
          // Fallback to mock Syrian marketplace templates
          console.warn('Failed to load templates from API, using mock templates');
          this._campaignTemplates.set(MOCK_CAMPAIGN_TEMPLATES);
          return of(MOCK_CAMPAIGN_TEMPLATES);
        })
      );
  }

  /**
   * Creates campaign from template
   * @description Creates new campaign using template as base
   * @param templateId - Template identifier
   * @param customizations - Custom values to override template defaults
   * @returns Observable of created campaign
   */
  createCampaignFromTemplate(templateId: string, customizations: Partial<Campaign>): Observable<Campaign> {
    console.log('Creating campaign from template:', templateId);

    const templates = this._campaignTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return throwError(() => new Error(`Template not found: ${templateId}`));
    }

    // Merge template defaults with customizations
    const campaignData: Partial<Campaign> = {
      ...template.defaultContent,
      ...customizations,
      id: this.generateCampaignId(),
      metadata: {
        ...template.defaultContent.metadata,
        ...customizations.metadata,
        createdBy: customizations.metadata?.createdBy || 'system',
        createdAt: new Date(),
        updatedBy: customizations.metadata?.updatedBy || 'system',
        updatedAt: new Date(),
        version: 1,
        tags: customizations.metadata?.tags || [],
        priority: customizations.metadata?.priority || 5
      }
    };

    return this.createCampaign(campaignData);
  }

  //#endregion

  //#region Campaign Analytics and Performance

  /**
   * Gets campaign performance metrics
   * @description Retrieves analytics data for campaign
   * @param campaignId - Campaign identifier
   * @param dateRange - Date range for metrics
   * @returns Observable of performance summary
   */
  getCampaignPerformance(
    campaignId: string,
    dateRange?: { start: Date; end: Date }
  ): Observable<CampaignPerformanceSummary> {
    console.log('Fetching campaign performance:', campaignId);

    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start', dateRange.start.toISOString());
      params = params.set('end', dateRange.end.toISOString());
    }

    return this.http.get<CampaignPerformanceSummary>(`${this.baseUrl}/${campaignId}/performance`, { params })
      .pipe(
        catchError(error => this.handleError('Failed to load campaign performance', error))
      );
  }

  /**
   * Tracks campaign impression
   * @description Records campaign view event
   * @param campaignId - Campaign identifier
   * @param context - Additional context data
   * @returns Observable of tracking success
   */
  trackCampaignImpression(campaignId: string, context?: any): Observable<boolean> {
    const trackingData = {
      campaignId,
      eventType: 'impression',
      timestamp: new Date().toISOString(),
      context: context || {}
    };

    return this.http.post(`${this.baseUrl}/${campaignId}/track`, trackingData)
      .pipe(
        map(() => true),
        catchError(error => {
          console.warn('Failed to track campaign impression:', error);
          return of(false);
        })
      );
  }

  /**
   * Tracks campaign click
   * @description Records campaign click event
   * @param campaignId - Campaign identifier
   * @param context - Additional context data
   * @returns Observable of tracking success
   */
  trackCampaignClick(campaignId: string, context?: any): Observable<boolean> {
    const trackingData = {
      campaignId,
      eventType: 'click',
      timestamp: new Date().toISOString(),
      context: context || {}
    };

    return this.http.post(`${this.baseUrl}/${campaignId}/track`, trackingData)
      .pipe(
        map(() => true),
        catchError(error => {
          console.warn('Failed to track campaign click:', error);
          return of(false);
        })
      );
  }

  //#endregion

  //#region Product Recommendations

  /**
   * Gets products for campaign recommendations
   * @description Retrieves contextual product recommendations
   * @param campaignType - Campaign type for context
   * @param maxProducts - Maximum number of products to return
   * @returns Observable of recommended products
   */
  getCampaignRecommendedProducts(
    campaignType: CampaignType,
    maxProducts: number = 6
  ): Observable<Product[]> {
    console.log('Fetching campaign product recommendations:', campaignType);

    const params = new HttpParams()
      .set('type', campaignType)
      .set('limit', maxProducts.toString());

    return this.http.get<Product[]>(`${this.baseUrl}/recommendations/products`, { params })
      .pipe(
        catchError(error => {
          console.warn('Failed to load campaign recommendations:', error);
          return of([]);
        })
      );
  }

  //#endregion

  //#region Utility Methods

  /**
   * Checks if campaign schedule is currently active
   * @description Validates campaign timing and availability
   * @param campaign - Campaign to check
   * @param now - Current date/time (defaults to now)
   * @returns True if campaign should be displayed
   */
  private isCampaignScheduleActive(campaign: Campaign, now: Date = new Date()): boolean {
    const startDate = new Date(campaign.schedule.startDate);
    const endDate = new Date(campaign.schedule.endDate);

    // Check basic date range
    if (now < startDate || now > endDate) {
      return false;
    }

    // Check active days if specified
    if (campaign.schedule.activeDays && campaign.schedule.activeDays.length > 0) {
      const currentDay = now.getDay(); // 0 = Sunday
      if (!campaign.schedule.activeDays.includes(currentDay)) {
        return false;
      }
    }

    // Check active hours if specified
    if (campaign.schedule.activeHours) {
      const currentHour = now.getHours();
      const { start, end } = campaign.schedule.activeHours;

      if (start <= end) {
        // Same day range (e.g., 9 AM to 5 PM)
        if (currentHour < start || currentHour >= end) {
          return false;
        }
      } else {
        // Overnight range (e.g., 10 PM to 6 AM)
        if (currentHour < start && currentHour >= end) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Processes campaigns response from API
   * @description Normalizes and validates campaign data
   * @param campaigns - Raw campaigns from API
   * @returns Processed campaigns array
   */
  private processCampaignsResponse(campaigns: any[]): Campaign[] {
    return campaigns.map(campaign => this.processCampaignResponse(campaign));
  }

  /**
   * Processes single campaign response from API
   * @description Normalizes and validates single campaign data
   * @param campaign - Raw campaign from API
   * @returns Processed campaign object
   */
  private processCampaignResponse(campaign: any): Campaign {
    // Ensure dates are properly parsed
    if (campaign.schedule) {
      campaign.schedule.startDate = new Date(campaign.schedule.startDate);
      campaign.schedule.endDate = new Date(campaign.schedule.endDate);
    }

    if (campaign.metadata) {
      campaign.metadata.createdAt = new Date(campaign.metadata.createdAt);
      campaign.metadata.updatedAt = new Date(campaign.metadata.updatedAt);
    }

    if (campaign.analytics) {
      campaign.analytics.lastUpdated = new Date(campaign.analytics.lastUpdated);
    }

    return campaign as Campaign;
  }

  /**
   * Prepares campaign data for API submission
   * @description Validates and formats campaign data
   * @param campaign - Campaign data to prepare
   * @returns Formatted campaign data
   */
  private prepareCampaignForSubmission(campaign: Partial<Campaign>): any {
    const prepared = { ...campaign };

    // Ensure required fields have defaults
    if (!prepared.metadata) {
      prepared.metadata = {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        version: 1,
        tags: [],
        priority: 5
      };
    } else {
      prepared.metadata.updatedAt = new Date();
    }

    // Validate schedule
    if (prepared.schedule) {
      if (!prepared.schedule.timezone) {
        prepared.schedule.timezone = 'Asia/Damascus';
      }
    }

    return prepared;
  }

  /**
   * Generates unique campaign ID
   * @description Creates unique identifier for campaigns
   * @returns Unique campaign ID
   */
  private generateCampaignId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `campaign-${timestamp}-${random}`;
  }

  /**
   * Gets default Syrian marketplace campaign templates
   * @description Returns predefined templates for Syrian cultural campaigns
   * @returns Array of default templates
   */
  private getDefaultSyrianTemplates(): CampaignTemplate[] {
    return [
      {
        id: 'damascus-steel-hero',
        name: 'Damascus Steel Hero Campaign',
        nameArabic: 'حملة الفولاذ الدمشقي الرئيسية',
        type: 'hero',
        description: {
          english: 'Showcase authentic Damascus steel products with heritage storytelling',
          arabic: 'عرض منتجات الفولاذ الدمشقي الأصيل مع قصص التراث'
        },
        defaultContent: {
          type: 'hero',
          headline: {
            english: 'Authentic Damascus Steel Collection',
            arabic: 'مجموعة الفولاذ الدمشقي الأصيل'
          },
          subheadline: {
            english: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
            arabic: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام'
          },
          cta: {
            text: {
              english: 'Shop Damascus Steel',
              arabic: 'تسوق الفولاذ الدمشقي'
            },
            variant: 'primary',
            size: 'large',
            color: 'syrian-red',
            icon: 'hardware'
          },
          syrianData: {
            region: 'damascus',
            unescoRecognition: true,
            culturalContext: {
              english: 'UNESCO-recognized traditional craftsmanship passed down through generations',
              arabic: 'حرفة تقليدية معترف بها من اليونسكو تنتقل عبر الأجيال'
            }
          }
        } as Partial<Campaign>,
        previewImage: '/assets/images/templates/damascus-steel-hero.jpg',
        category: 'cultural',
        isActive: true
      },
      {
        id: 'aleppo-soap-seasonal',
        name: 'Aleppo Soap Seasonal Campaign',
        nameArabic: 'حملة صابون حلب الموسمية',
        type: 'seasonal',
        description: {
          english: 'Promote traditional Aleppo soap with seasonal benefits',
          arabic: 'الترويج لصابون حلب التقليدي مع الفوائد الموسمية'
        },
        defaultContent: {
          type: 'seasonal',
          headline: {
            english: 'Premium Aleppo Soap Collection',
            arabic: 'مجموعة صابون حلب الفاخر'
          },
          subheadline: {
            english: 'Natural beauty secrets from ancient Aleppo',
            arabic: 'أسرار الجمال الطبيعية من حلب العريقة'
          },
          cta: {
            text: {
              english: 'Discover Natural Beauty',
              arabic: 'اكتشف الجمال الطبيعي'
            },
            variant: 'primary',
            size: 'medium',
            color: 'golden',
            icon: 'spa'
          },
          syrianData: {
            region: 'aleppo',
            unescoRecognition: true,
            culturalContext: {
              english: 'Traditional soap-making heritage spanning over 2000 years',
              arabic: 'تراث صناعة الصابون التقليدي الممتد لأكثر من ألفي عام'
            }
          }
        } as Partial<Campaign>,
        previewImage: '/assets/images/templates/aleppo-soap-seasonal.jpg',
        category: 'seasonal',
        isActive: true
      }
    ];
  }

  /**
   * Handles HTTP errors with user-friendly messages
   * @description Processes HTTP errors and returns appropriate error responses
   * @param message - User-friendly error message
   * @param error - HTTP error response
   * @returns Observable error with formatted message
   */
  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);

    let errorMessage = message;

    if (error.status === 0) {
      errorMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = error.error?.message || 'Invalid request. Please check your input.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    this._error.set(errorMessage);
    this._isLoading.set(false);

    return throwError(() => new Error(errorMessage));
  }

  //#endregion

  //#region Cache Management

  /**
   * Clears campaign cache
   * @description Forces cache refresh on next request
   */
  clearCache(): void {
    console.log('Clearing campaign cache');
    this._campaigns.set([]);
    this._lastCacheRefresh.set(null);
    this._error.set(null);
  }

  /**
   * Refreshes campaign cache
   * @description Forces immediate cache refresh
   * @returns Observable of refreshed campaigns
   */
  refreshCache(): Observable<Campaign[]> {
    console.log('Refreshing campaign cache');
    return this.getCampaigns(true);
  }

  //#endregion
}