import { Component, OnInit, DestroyRef, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, inject, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { timer, interval, Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Campaign, CampaignRoute } from '../../../shared/interfaces/campaign.interface';
import type { Swiper } from 'swiper';

/**
 * Campaign Hero Component for SouqSyria Syrian Marketplace
 *
 * Dynamic hero slider featuring:
 * - Auto-rotating campaign slides with Syrian marketplace styling
 * - Manual navigation arrows with smooth transitions
 * - Progress indicators and auto-play controls
 * - Responsive design optimized for mobile/desktop
 * - Bilingual content support (Arabic/English)
 * - Syrian cultural branding and authentic color palette
 * - Campaign analytics tracking integration
 *
 * @swagger
 * components:
 *   schemas:
 *     CampaignHeroComponent:
 *       type: object
 *       properties:
 *         campaigns:
 *           type: array
 *           description: Array of active campaigns to display
 *           items:
 *             $ref: '#/components/schemas/Campaign'
 *         autoPlay:
 *           type: boolean
 *           description: Enable automatic slide rotation
 *           default: true
 *         autoPlayInterval:
 *           type: number
 *           description: Auto-play interval in milliseconds
 *           default: 5000
 *         showProgressBar:
 *           type: boolean
 *           description: Show progress bar for auto-play
 *           default: true
 *         enableSwipeGestures:
 *           type: boolean
 *           description: Enable touch swipe navigation
 *           default: true
 */
@Component({
  selector: 'app-campaign-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatProgressBarModule
  ],
  templateUrl: './campaign-hero.component.html',
  styleUrl: './campaign-hero.component.scss'
})
export class CampaignHeroComponent implements OnInit {
  //#region Component Properties and Configuration

  /** Array of campaigns to display in the hero slider */
  @Input() campaigns: Campaign[] = [];

  /** Enable automatic slide rotation */
  @Input() autoPlay: boolean = true;

  /** Auto-play interval in milliseconds */
  @Input() autoPlayInterval: number = 5000;

  /** Show progress bar for auto-play timing */
  @Input() showProgressBar: boolean = true;

  /** Enable touch swipe gestures for navigation */
  @Input() enableSwipeGestures: boolean = true;

  /** Maximum number of slides to display */
  @Input() maxSlides: number = 5;

  /** Hero section height (CSS value) */
  @Input() heroHeight: string = '500px';

  /** Event emitted when campaign is clicked */
  @Output() campaignClick = new EventEmitter<Campaign>();

  /** Event emitted when campaign is viewed (analytics) */
  @Output() campaignView = new EventEmitter<Campaign>();

  /** Event emitted when navigation occurs */
  @Output() navigationChange = new EventEmitter<{ previous: number; current: number }>();

  //#endregion

  //#region Private Properties and Lifecycle Management

  /** Subject for component destruction and cleanup */
  private readonly destroyRef = inject(DestroyRef);

  /** Reference to Swiper element for programmatic control */
  @ViewChild('swiperRef', { static: false }) swiperRef!: ElementRef<any>;

  /** Auto-play timer subscription */
  private autoPlayTimer$ = new Subject<void>();

  /** Swiper instance reference */
  private swiperInstance: Swiper | null = null;

  /** Swiper initialization flag */
  private swiperInitialized = false;

  //#endregion

  //#region Reactive State Management with Signals

  /** Currently active slide index */
  readonly currentSlideIndex = signal<number>(0);

  /** Loading state for campaigns */
  readonly isLoading = signal<boolean>(false);

  /** Auto-play progress (0-100) */
  readonly autoPlayProgress = signal<number>(0);

  /** Auto-play active state */
  readonly isAutoPlayActive = signal<boolean>(true);

  /** Slide transition direction */
  readonly slideDirection = signal<'left' | 'right' | 'none'>('none');

  /** Available campaigns (filtered and limited) */
  readonly availableCampaigns = computed(() => {
    const activeCampaigns = this.campaigns.filter(campaign =>
      campaign.status === 'active' &&
      this.isCampaignScheduleActive(campaign)
    );
    return activeCampaigns.slice(0, this.maxSlides);
  });

  /** Current active campaign */
  readonly currentCampaign = computed(() => {
    const campaigns = this.availableCampaigns();
    const index = this.currentSlideIndex();
    return campaigns[index] || null;
  });

  /** Has multiple campaigns for navigation */
  readonly hasMultipleCampaigns = computed(() => {
    return this.availableCampaigns().length > 1;
  });

  /** Can navigate to previous slide */
  readonly canNavigatePrevious = computed(() => {
    return this.hasMultipleCampaigns() && this.currentSlideIndex() > 0;
  });

  /** Can navigate to next slide */
  readonly canNavigateNext = computed(() => {
    const campaigns = this.availableCampaigns();
    return this.hasMultipleCampaigns() && this.currentSlideIndex() < campaigns.length - 1;
  });

  //#endregion

  //#region Dependency Injection

  /** Angular router service for navigation */
  private readonly router = inject(Router);

  //#endregion

  //#region Lifecycle Hooks

  /**
   * Component initialization
   * @description Sets up Swiper and auto-play functionality
   */
  ngOnInit(): void {
    console.log('Campaign Hero initialized with', this.campaigns.length, 'campaigns');

    if (this.availableCampaigns().length > 0) {
      this.trackCampaignView(this.currentCampaign());
    }

    // Initialize Swiper after view init
    timer(100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.initializeSwiper();
    });

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.stopAutoPlay();
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }
      console.log('Campaign Hero destroyed - Cleanup completed');
    });
  }

  //#endregion

  //#region Campaign Management and Navigation

  /**
   * Navigates to the next slide using Swiper
   * @description Advances to next campaign with Swiper navigation
   */
  goToNextSlide(): void {
    if (!this.swiperInstance || this.availableCampaigns().length <= 1) return;
    this.swiperInstance.slideNext();
  }

  /**
   * Navigates to the previous slide using Swiper
   * @description Goes back to previous campaign with Swiper navigation
   */
  goToPreviousSlide(): void {
    if (!this.swiperInstance || this.availableCampaigns().length <= 1) return;
    this.swiperInstance.slidePrev();
  }

  /**
   * Navigates to a specific slide by index using Swiper
   * @description Jumps to specific campaign slide
   * @param slideIndex - Target slide index
   */
  goToSlide(slideIndex: number): void {
    if (!this.swiperInstance) return;

    const campaigns = this.availableCampaigns();
    if (slideIndex < 0 || slideIndex >= campaigns.length) return;

    this.swiperInstance.slideTo(slideIndex);
  }

  /**
   * Handles Swiper slide change events from the template
   * @description Extracts swiper instance from event and delegates to onSlideChange
   * @param event - DOM event from swiper slide change
   */
  handleSwiperSlideChange(event: any): void {
    const swiper = event?.target?.swiper || event?.detail?.[0];
    if (swiper) {
      this.onSlideChange(swiper);
    }
  }

  /**
   * Handles Swiper slide change events
   * @description Updates component state when Swiper changes slides
   * @param swiper - Swiper instance
   */
  onSlideChange(swiper: Swiper): void {
    const previousIndex = this.currentSlideIndex();
    const currentIndex = swiper.activeIndex;

    this.currentSlideIndex.set(currentIndex);
    this.autoPlayProgress.set(0);

    // Emit navigation change event
    this.navigationChange.emit({
      previous: previousIndex,
      current: currentIndex
    });

    // Track campaign view for analytics
    const newCampaign = this.currentCampaign();
    if (newCampaign) {
      this.trackCampaignView(newCampaign);
    }

    console.log(`Campaign slide navigated: ${previousIndex} → ${currentIndex}`);
  }

  //#endregion

  //#region Auto-Play Management

  /**
   * Initializes Swiper instance with Syrian marketplace configuration
   * @description Sets up Swiper with custom options and event handlers
   */
  private initializeSwiper(): void {
    if (!this.swiperRef?.nativeElement || this.swiperInitialized) return;

    const swiperEl = this.swiperRef.nativeElement;

    // Configure Swiper parameters
    const swiperParams = {
      // Core settings
      loop: this.availableCampaigns().length > 1,
      autoplay: this.autoPlay && this.hasMultipleCampaigns() ? {
        delay: this.autoPlayInterval,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      } : false,

      // Visual settings
      effect: 'slide',
      speed: 800,
      spaceBetween: 0,
      slidesPerView: 1,
      centeredSlides: true,

      // Interaction settings
      touchRatio: 1,
      touchAngle: 45,
      shortSwipes: true,
      longSwipes: true,
      followFinger: true,

      // Accessibility
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous campaign',
        nextSlideMessage: 'Next campaign',
        paginationBulletMessage: 'Go to slide {{index}}'
      },

      // Keyboard navigation
      keyboard: {
        enabled: true,
        onlyInViewport: true
      },

      // Mouse wheel
      mousewheel: {
        enabled: false
      },

      // Performance
      watchSlidesProgress: true,
      watchOverflow: true,

      // Grab cursor
      grabCursor: true
    };

    // Apply parameters to Swiper element
    Object.assign(swiperEl, swiperParams);

    // Initialize Swiper
    swiperEl.initialize();

    // Get Swiper instance and set up event listeners
    this.swiperInstance = swiperEl.swiper;

    if (this.swiperInstance) {
      // Set up event listeners
      this.swiperInstance.on('slideChange', (swiper: Swiper) => {
        this.onSlideChange(swiper);
      });

      this.swiperInstance.on('autoplayStart', () => {
        this.isAutoPlayActive.set(true);
        this.startProgressTracking();
      });

      this.swiperInstance.on('autoplayStop', () => {
        this.isAutoPlayActive.set(false);
        this.stopProgressTracking();
      });

      this.swiperInstance.on('autoplayPause', () => {
        this.isAutoPlayActive.set(false);
      });

      this.swiperInstance.on('autoplayResume', () => {
        this.isAutoPlayActive.set(true);
      });

      // Start progress tracking if autoplay is enabled
      if (this.autoPlay && this.hasMultipleCampaigns()) {
        this.isAutoPlayActive.set(true);
        this.startProgressTracking();
      }
    }

    this.swiperInitialized = true;
    console.log('Swiper initialized for Campaign Hero with', this.availableCampaigns().length, 'slides');
  }

  /**
   * Starts progress bar tracking for auto-play
   * @description Begins progress bar animation synchronized with auto-play
   */
  private startProgressTracking(): void {
    this.autoPlayTimer$.next(); // Stop any existing timer

    // Progress bar update interval (smoother animation)
    const progressInterval = 50; // Update every 50ms
    const progressIncrement = (progressInterval / this.autoPlayInterval) * 100;

    interval(progressInterval)
      .pipe(takeUntil(this.autoPlayTimer$), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isAutoPlayActive() || !this.hasMultipleCampaigns()) return;

        const currentProgress = this.autoPlayProgress();
        const newProgress = currentProgress + progressIncrement;

        if (newProgress >= 100) {
          this.autoPlayProgress.set(0);
        } else {
          this.autoPlayProgress.set(newProgress);
        }
      });
  }

  /**
   * Stops progress bar tracking
   * @description Halts progress bar animation
   */
  private stopProgressTracking(): void {
    this.autoPlayTimer$.next();
    this.autoPlayProgress.set(0);
  }

  /**
   * Pauses Swiper auto-play
   * @description Temporarily stops automatic slide progression
   */
  pauseAutoPlay(): void {
    if (this.swiperInstance?.autoplay) {
      this.swiperInstance.autoplay.pause();
    }
    this.isAutoPlayActive.set(false);
    console.log('Campaign auto-play paused');
  }

  /**
   * Resumes Swiper auto-play
   * @description Restarts automatic slide progression
   */
  resumeAutoPlay(): void {
    if (!this.autoPlay || !this.hasMultipleCampaigns()) return;

    if (this.swiperInstance?.autoplay) {
      this.swiperInstance.autoplay.resume();
    }
    this.isAutoPlayActive.set(true);
    console.log('Campaign auto-play resumed');
  }

  /**
   * Toggles Swiper auto-play state
   * @description Switches between play and pause states
   */
  toggleAutoPlay(): void {
    if (this.isAutoPlayActive()) {
      this.pauseAutoPlay();
    } else {
      this.resumeAutoPlay();
    }
  }

  /**
   * Stops auto-play completely
   * @description Terminates automatic slide progression
   */
  private stopAutoPlay(): void {
    if (this.swiperInstance?.autoplay) {
      this.swiperInstance.autoplay.stop();
    }
    this.stopProgressTracking();
    this.isAutoPlayActive.set(false);
  }

  //#endregion

  //#region Swiper Event Handlers

  /**
   * Handles mouse enter events for auto-play pause
   * @description Pauses auto-play when user hovers over slider
   */
  onMouseEnter(): void {
    if (this.autoPlay && this.hasMultipleCampaigns()) {
      this.pauseAutoPlay();
    }
  }

  /**
   * Handles mouse leave events for auto-play resume
   * @description Resumes auto-play when user stops hovering
   */
  onMouseLeave(): void {
    if (this.autoPlay && this.hasMultipleCampaigns()) {
      // Delay resume to prevent rapid pause/resume cycles
      timer(500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.resumeAutoPlay();
      });
    }
  }

  /**
   * Handles Swiper ready event
   * @description Called when Swiper is fully initialized
   */
  onSwiperReady(): void {
    console.log('Swiper is ready for Campaign Hero');

    // Track initial campaign view
    const initialCampaign = this.currentCampaign();
    if (initialCampaign) {
      this.trackCampaignView(initialCampaign);
    }
  }

  //#endregion

  //#region Campaign Actions and Analytics

  /**
   * Handles campaign click events
   * @description Processes campaign CTA clicks and navigation
   * @param campaign - Clicked campaign
   * @param event - Click event
   */
  onCampaignClick(campaign: Campaign, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('Campaign clicked:', campaign.name, 'Type:', campaign.type);

    // Emit campaign click event for parent components
    this.campaignClick.emit(campaign);

    // Track campaign click for analytics
    this.trackCampaignClick(campaign);

    // Navigate to campaign target
    this.navigateToCampaignTarget(campaign.targetRoute);
  }

  /**
   * Navigates to campaign target route
   * @description Handles different route types and parameters
   * @param route - Campaign route configuration
   */
  private navigateToCampaignTarget(route: CampaignRoute): void {
    try {
      switch (route.type) {
        case 'product':
          this.router.navigate(['/product', route.target], {
            queryParams: route.queryParams
          });
          break;

        case 'category':
          this.router.navigate(['/category', route.target], {
            queryParams: route.queryParams
          });
          break;

        case 'collection':
          this.router.navigate(['/collection', route.target], {
            queryParams: route.queryParams
          });
          break;

        case 'landing':
          this.router.navigate([route.target], {
            queryParams: route.queryParams
          });
          break;

        case 'external':
          if (route.external) {
            window.open(route.target, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = route.target;
          }
          break;

        default:
          console.warn('Unknown campaign route type:', route.type);
          this.router.navigate([route.target]);
      }
    } catch (error) {
      console.error('Campaign navigation error:', error);
      // Fallback navigation
      this.router.navigate(['/']);
    }
  }

  /**
   * Tracks campaign view for analytics
   * @description Records campaign impression events
   * @param campaign - Viewed campaign
   */
  private trackCampaignView(campaign: Campaign | null): void {
    if (!campaign) return;

    console.log('Campaign viewed:', campaign.name, 'ID:', campaign.id);

    // Emit campaign view event
    this.campaignView.emit(campaign);

    // Track in analytics
    this.trackAnalyticsEvent('campaign_view', {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      campaign_type: campaign.type,
      slide_position: this.currentSlideIndex(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tracks campaign click for analytics
   * @description Records campaign click events
   * @param campaign - Clicked campaign
   */
  private trackCampaignClick(campaign: Campaign): void {
    console.log('Campaign click tracked:', campaign.name, 'ID:', campaign.id);

    // Track in analytics
    this.trackAnalyticsEvent('campaign_click', {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      campaign_type: campaign.type,
      slide_position: this.currentSlideIndex(),
      cta_text: campaign.cta.text.english,
      target_route: campaign.targetRoute.target,
      timestamp: new Date().toISOString()
    });
  }

  //#endregion

  //#region Utility Methods

  /**
   * Checks if campaign schedule is currently active
   * @description Validates campaign timing and availability
   * @param campaign - Campaign to check
   * @returns True if campaign should be displayed
   */
  private isCampaignScheduleActive(campaign: Campaign): boolean {
    const now = new Date();
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
   * Gets campaign background image URL with fallback
   * @description Returns appropriate image URL based on device type
   * @param campaign - Campaign object
   * @returns Image URL string
   */
  getCampaignImageUrl(campaign: Campaign): string {
    // Use mobile image on small screens if available
    if (window.innerWidth <= 768 && campaign.mobileImage) {
      return campaign.mobileImage.url;
    }

    return campaign.heroImage.url;
  }

  /**
   * Gets campaign image alt text in current language
   * @description Returns appropriate alt text for accessibility
   * @param campaign - Campaign object
   * @returns Alt text string
   */
  getCampaignImageAlt(campaign: Campaign): string {
    // TODO: Implement language detection service
    // For now, always use English to avoid TypeScript comparison issues
    return campaign.heroImage?.alt?.english || campaign.name || 'Campaign image';
  }

  /**
   * Tracks analytics events
   * @description Centralized analytics tracking with error handling
   * @param eventName - Name of the analytics event
   * @param parameters - Event parameters
   */
  private trackAnalyticsEvent(eventName: string, parameters: any): void {
    try {
      console.log(`Analytics: ${eventName}`, parameters);
      // Google Analytics 4 tracking
      // gtag('event', eventName, parameters);

      // Additional analytics providers can be added here
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Analytics errors should not break the application
    }
  }

  /**
   * Track by function for campaigns optimization
   * @description Improves ngFor performance by tracking items by id
   * @param index - Array index
   * @param campaign - Campaign object
   * @returns Unique identifier for tracking
   */
  trackCampaign(index: number, campaign: Campaign): string {
    return campaign.id;
  }

  //#endregion
}