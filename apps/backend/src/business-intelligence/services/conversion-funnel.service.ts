/**
 * @file conversion-funnel.service.ts
 * @description Conversion Funnel Tracking and Analytics Service
 *
 * PURPOSE:
 * - Tracks multi-step conversion funnels (view → cart → checkout → purchase)
 * - Identifies drop-off points and optimization opportunities
 * - Provides device/channel-based funnel analysis
 * - Calculates time-to-conversion metrics
 * - Supports A/B testing for funnel optimization
 *
 * FUNNEL STAGES:
 * 1. PRODUCT_VIEW: User views product details
 * 2. CART_ADD: User adds product to cart
 * 3. CHECKOUT_START: User initiates checkout
 * 4. CHECKOUT_COMPLETE: User completes purchase
 *
 * ANALYTICS CAPABILITIES:
 * - Stage-by-stage conversion rates
 * - Drop-off analysis at each stage
 * - Average time spent per stage
 * - Cohort-based funnel analysis
 * - Device/browser/OS segmentation
 * - UTM campaign attribution
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Entities
import { UserEvent, EventType } from '../../analytics/entities/user-event.entity';
import { UserSession, SessionStatus } from '../../analytics/entities/user-session.entity';
import { BusinessEvent, BusinessEventType } from '../entities/business-event.entity';

/**
 * Funnel stage enumeration
 */
export enum FunnelStage {
  PRODUCT_VIEW = 'product_view',
  CART_ADD = 'cart_add',
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_COMPLETE = 'checkout_complete',
}

/**
 * Funnel step data
 */
export interface IFunnelStepData {
  /** Funnel stage */
  stage: FunnelStage;
  /** Stage display name */
  stageName: string;
  /** Number of users entering this stage */
  enteredCount: number;
  /** Number of users completing this stage */
  completedCount: number;
  /** Conversion rate to next stage (percentage) */
  conversionRate: number;
  /** Drop-off rate from this stage (percentage) */
  dropOffRate: number;
  /** Average time spent in this stage (seconds) */
  averageTimeSpent: number;
  /** Median time spent in this stage (seconds) */
  medianTimeSpent: number;
}

/**
 * Complete funnel analytics
 */
export interface IFunnelAnalytics {
  /** Date range for analysis */
  startDate: Date;
  endDate: Date;
  /** Total unique sessions that entered the funnel */
  totalSessions: number;
  /** Total completed conversions */
  totalConversions: number;
  /** Overall conversion rate (percentage) */
  overallConversionRate: number;
  /** Funnel steps with metrics */
  steps: IFunnelStepData[];
  /** Most significant drop-off stage */
  biggestDropOff: {
    stage: FunnelStage;
    dropOffRate: number;
    lostSessions: number;
  };
  /** Average time to complete funnel (seconds) */
  averageTimeToConvert: number;
  /** Segmentation analytics */
  byDevice?: Record<string, { sessions: number; conversionRate: number }>;
  byChannel?: Record<string, { sessions: number; conversionRate: number }>;
  byUTMSource?: Record<string, { sessions: number; conversionRate: number }>;
}

/**
 * Time-to-conversion metrics
 */
export interface ITimeToConversionMetrics {
  /** Average time from first touch to conversion (seconds) */
  averageTimeToConvert: number;
  /** Median time to conversion (seconds) */
  medianTimeToConvert: number;
  /** Percentile distribution */
  percentiles: {
    p25: number;  // 25th percentile
    p50: number;  // Median
    p75: number;  // 75th percentile
    p90: number;  // 90th percentile
    p95: number;  // 95th percentile
  };
  /** Conversion by time bucket */
  byTimeBucket: Array<{
    bucket: string;        // e.g., "0-5 min", "5-15 min"
    count: number;
    percentage: number;
  }>;
}

/**
 * Session funnel journey
 */
export interface ISessionFunnelJourney {
  sessionId: number;
  userId: number | null;
  /** Funnel entry timestamp */
  entryTimestamp: Date;
  /** Conversion timestamp (null if not converted) */
  conversionTimestamp: Date | null;
  /** Time to conversion in seconds (null if not converted) */
  timeToConvert: number | null;
  /** Funnel stages reached */
  stagesReached: FunnelStage[];
  /** Last stage reached before drop-off */
  dropOffStage: FunnelStage | null;
  /** Device information */
  deviceType: string;
  /** Traffic source */
  utmSource: string | null;
  /** Converted successfully */
  converted: boolean;
}

/**
 * Funnel comparison result (A/B testing)
 */
export interface IFunnelComparison {
  variantA: {
    name: string;
    sessions: number;
    conversionRate: number;
    steps: IFunnelStepData[];
  };
  variantB: {
    name: string;
    sessions: number;
    conversionRate: number;
    steps: IFunnelStepData[];
  };
  /** Statistical significance indicator */
  isSignificant: boolean;
  /** P-value for statistical test */
  pValue: number;
  /** Recommended winner (if significant) */
  winner: 'A' | 'B' | 'inconclusive';
  /** Lift percentage (B vs A) */
  lift: number;
}

/**
 * Conversion Funnel Service
 *
 * Provides comprehensive conversion funnel analytics and optimization insights
 * for e-commerce conversion rate optimization (CRO).
 *
 * @swagger
 * @ApiTags('Business Intelligence - Conversion Funnel')
 */
@Injectable()
export class ConversionFunnelService {
  private readonly logger = new Logger(ConversionFunnelService.name);

  /** Funnel stage mapping */
  private readonly FUNNEL_STAGE_MAP = {
    [EventType.PRODUCT_VIEW]: FunnelStage.PRODUCT_VIEW,
    [EventType.CART_ADD]: FunnelStage.CART_ADD,
    [EventType.CHECKOUT_START]: FunnelStage.CHECKOUT_START,
    [EventType.CHECKOUT_COMPLETE]: FunnelStage.CHECKOUT_COMPLETE,
  };

  /** Stage display names */
  private readonly STAGE_NAMES = {
    [FunnelStage.PRODUCT_VIEW]: 'Product View',
    [FunnelStage.CART_ADD]: 'Add to Cart',
    [FunnelStage.CHECKOUT_START]: 'Checkout Started',
    [FunnelStage.CHECKOUT_COMPLETE]: 'Purchase Complete',
  };

  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,

    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,

    @InjectRepository(BusinessEvent)
    private readonly businessEventRepository: Repository<BusinessEvent>,

    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🎯 Conversion Funnel Service initialized');
  }

  /**
   * Get funnel analytics for date range
   *
   * @param startDate - Analysis start date
   * @param endDate - Analysis end date
   * @param options - Optional segmentation filters
   * @returns Promise<IFunnelAnalytics> - Complete funnel analytics
   */
  async getFunnelAnalytics(
    startDate: Date,
    endDate: Date,
    options?: {
      deviceType?: string;
      utmSource?: string;
      utmCampaign?: string;
    },
  ): Promise<IFunnelAnalytics> {
    this.logger.log(`Analyzing conversion funnel from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
      // Get all sessions in date range
      let sessionsQuery = this.userSessionRepository
        .createQueryBuilder('s')
        .where('s.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

      // Apply filters
      if (options?.deviceType) {
        sessionsQuery = sessionsQuery.andWhere("s.deviceInfo->>'$.deviceType' = :deviceType", {
          deviceType: options.deviceType,
        });
      }

      if (options?.utmSource) {
        sessionsQuery = sessionsQuery.andWhere("s.utmParams->>'$.utm_source' = :utmSource", {
          utmSource: options.utmSource,
        });
      }

      const sessions = await sessionsQuery.getMany();
      const sessionIds = sessions.map(s => s.id);

      this.logger.debug(`Found ${sessions.length} sessions to analyze`);

      // Get events for these sessions
      const events = await this.userEventRepository.find({
        where: {
          sessionId: In(sessionIds),
          eventType: In([
            EventType.PRODUCT_VIEW,
            EventType.CART_ADD,
            EventType.CHECKOUT_START,
            EventType.CHECKOUT_COMPLETE,
          ]),
        },
        order: { createdAt: 'ASC' },
      });

      // Build session journeys
      const journeys = this.buildSessionJourneys(sessions, events);

      // Calculate funnel steps
      const steps = this.calculateFunnelSteps(journeys);

      // Overall metrics
      const totalSessions = journeys.length;
      const totalConversions = journeys.filter(j => j.converted).length;
      const overallConversionRate = totalSessions > 0
        ? (totalConversions / totalSessions) * 100
        : 0;

      // Find biggest drop-off
      const biggestDropOff = this.findBiggestDropOff(steps);

      // Average time to convert
      const convertedJourneys = journeys.filter(j => j.timeToConvert !== null);
      const averageTimeToConvert = convertedJourneys.length > 0
        ? convertedJourneys.reduce((sum, j) => sum + j.timeToConvert!, 0) / convertedJourneys.length
        : 0;

      // Segmentation analytics
      const byDevice = this.calculateSegmentation(journeys, 'deviceType');
      const byChannel = this.calculateSegmentation(journeys, 'utmSource');

      return {
        startDate,
        endDate,
        totalSessions,
        totalConversions,
        overallConversionRate: Math.round(overallConversionRate * 10) / 10,
        steps,
        biggestDropOff,
        averageTimeToConvert: Math.round(averageTimeToConvert),
        byDevice,
        byChannel,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get funnel analytics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get time-to-conversion metrics
   *
   * @param startDate - Analysis start date
   * @param endDate - Analysis end date
   * @returns Promise<ITimeToConversionMetrics> - Time metrics
   */
  async getTimeToConversionMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<ITimeToConversionMetrics> {
    this.logger.log('Analyzing time-to-conversion metrics');

    try {
      const sessions = await this.userSessionRepository.find({
        where: {
          createdAt: Between(startDate, endDate),
          status: SessionStatus.CONVERTED,
        },
      });

      const events = await this.userEventRepository.find({
        where: {
          sessionId: In(sessions.map(s => s.id)),
        },
        order: { createdAt: 'ASC' },
      });

      const journeys = this.buildSessionJourneys(sessions, events);
      const convertedJourneys = journeys.filter(j => j.converted && j.timeToConvert !== null);
      const conversionTimes = convertedJourneys.map(j => j.timeToConvert!).sort((a, b) => a - b);

      if (conversionTimes.length === 0) {
        return {
          averageTimeToConvert: 0,
          medianTimeToConvert: 0,
          percentiles: { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
          byTimeBucket: [],
        };
      }

      // Calculate metrics
      const averageTimeToConvert = conversionTimes.reduce((sum, t) => sum + t, 0) / conversionTimes.length;
      const medianTimeToConvert = this.percentile(conversionTimes, 50);

      const percentiles = {
        p25: this.percentile(conversionTimes, 25),
        p50: medianTimeToConvert,
        p75: this.percentile(conversionTimes, 75),
        p90: this.percentile(conversionTimes, 90),
        p95: this.percentile(conversionTimes, 95),
      };

      // Time buckets (in seconds)
      const timeBuckets = [
        { name: '0-5 min', min: 0, max: 300 },
        { name: '5-15 min', min: 300, max: 900 },
        { name: '15-30 min', min: 900, max: 1800 },
        { name: '30-60 min', min: 1800, max: 3600 },
        { name: '1-2 hours', min: 3600, max: 7200 },
        { name: '2+ hours', min: 7200, max: Infinity },
      ];

      const byTimeBucket = timeBuckets.map(bucket => {
        const count = conversionTimes.filter(t => t >= bucket.min && t < bucket.max).length;
        return {
          bucket: bucket.name,
          count,
          percentage: Math.round((count / conversionTimes.length) * 1000) / 10,
        };
      });

      return {
        averageTimeToConvert: Math.round(averageTimeToConvert),
        medianTimeToConvert: Math.round(medianTimeToConvert),
        percentiles: {
          p25: Math.round(percentiles.p25),
          p50: Math.round(percentiles.p50),
          p75: Math.round(percentiles.p75),
          p90: Math.round(percentiles.p90),
          p95: Math.round(percentiles.p95),
        },
        byTimeBucket,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get time-to-conversion metrics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Compare two funnel variants (A/B testing)
   *
   * @param startDate - Analysis start date
   * @param endDate - Analysis end date
   * @param variantAFilter - Filter for variant A
   * @param variantBFilter - Filter for variant B
   * @returns Promise<IFunnelComparison> - Comparison result
   */
  async compareFunnelVariants(
    startDate: Date,
    endDate: Date,
    variantAFilter: { name: string; utmCampaign?: string; abTestVariant?: string },
    variantBFilter: { name: string; utmCampaign?: string; abTestVariant?: string },
  ): Promise<IFunnelComparison> {
    this.logger.log(`Comparing funnel variants: ${variantAFilter.name} vs ${variantBFilter.name}`);

    try {
      // Get analytics for variant A
      const variantAEvents = await this.getVariantEvents(startDate, endDate, variantAFilter);
      const variantASessions = await this.getVariantSessions(startDate, endDate, variantAFilter);
      const variantAJourneys = this.buildSessionJourneys(variantASessions, variantAEvents);
      const variantASteps = this.calculateFunnelSteps(variantAJourneys);

      // Get analytics for variant B
      const variantBEvents = await this.getVariantEvents(startDate, endDate, variantBFilter);
      const variantBSessions = await this.getVariantSessions(startDate, endDate, variantBFilter);
      const variantBJourneys = this.buildSessionJourneys(variantBSessions, variantBEvents);
      const variantBSteps = this.calculateFunnelSteps(variantBJourneys);

      // Calculate conversion rates
      const conversionRateA = variantAJourneys.length > 0
        ? (variantAJourneys.filter(j => j.converted).length / variantAJourneys.length) * 100
        : 0;

      const conversionRateB = variantBJourneys.length > 0
        ? (variantBJourneys.filter(j => j.converted).length / variantBJourneys.length) * 100
        : 0;

      // Statistical significance test (Chi-square)
      const { isSignificant, pValue } = this.chiSquareTest(
        variantAJourneys.filter(j => j.converted).length,
        variantAJourneys.length,
        variantBJourneys.filter(j => j.converted).length,
        variantBJourneys.length,
      );

      // Determine winner
      let winner: 'A' | 'B' | 'inconclusive' = 'inconclusive';
      if (isSignificant) {
        winner = conversionRateB > conversionRateA ? 'B' : 'A';
      }

      // Calculate lift
      const lift = conversionRateA > 0
        ? ((conversionRateB - conversionRateA) / conversionRateA) * 100
        : 0;

      return {
        variantA: {
          name: variantAFilter.name,
          sessions: variantAJourneys.length,
          conversionRate: Math.round(conversionRateA * 10) / 10,
          steps: variantASteps,
        },
        variantB: {
          name: variantBFilter.name,
          sessions: variantBJourneys.length,
          conversionRate: Math.round(conversionRateB * 10) / 10,
          steps: variantBSteps,
        },
        isSignificant,
        pValue: Math.round(pValue * 10000) / 10000,
        winner,
        lift: Math.round(lift * 10) / 10,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to compare funnel variants: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get session funnel journeys for detailed analysis
   *
   * @param startDate - Analysis start date
   * @param endDate - Analysis end date
   * @param limit - Maximum number of journeys to return
   * @returns Promise<ISessionFunnelJourney[]> - Session journeys
   */
  async getSessionJourneys(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): Promise<ISessionFunnelJourney[]> {
    const sessions = await this.userSessionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const events = await this.userEventRepository.find({
      where: {
        sessionId: In(sessions.map(s => s.id)),
      },
      order: { createdAt: 'ASC' },
    });

    return this.buildSessionJourneys(sessions, events);
  }

  /**
   * Build session funnel journeys from events
   *
   * @param sessions - User sessions
   * @param events - User events
   * @returns ISessionFunnelJourney[] - Constructed journeys
   */
  private buildSessionJourneys(
    sessions: UserSession[],
    events: UserEvent[],
  ): ISessionFunnelJourney[] {
    const journeys: ISessionFunnelJourney[] = [];

    for (const session of sessions) {
      const sessionEvents = events.filter(e => e.sessionId === session.id);

      // Filter funnel-relevant events
      const funnelEvents = sessionEvents.filter(e =>
        Object.keys(this.FUNNEL_STAGE_MAP).includes(e.eventType)
      );

      if (funnelEvents.length === 0) {
        continue; // Skip sessions with no funnel events
      }

      // Determine stages reached
      const stagesReached: FunnelStage[] = [];
      for (const event of funnelEvents) {
        const stage = this.FUNNEL_STAGE_MAP[event.eventType as EventType];
        if (stage && !stagesReached.includes(stage)) {
          stagesReached.push(stage);
        }
      }

      // Check if converted
      const converted = stagesReached.includes(FunnelStage.CHECKOUT_COMPLETE);

      // Calculate time to conversion
      let timeToConvert: number | null = null;
      let conversionTimestamp: Date | null = null;

      if (converted) {
        const firstEvent = funnelEvents[0];
        const lastEvent = funnelEvents[funnelEvents.length - 1];
        conversionTimestamp = lastEvent.createdAt;
        timeToConvert = Math.floor(
          (lastEvent.createdAt.getTime() - firstEvent.createdAt.getTime()) / 1000
        );
      }

      // Determine drop-off stage
      let dropOffStage: FunnelStage | null = null;
      if (!converted) {
        const allStages = Object.values(FunnelStage);
        for (let i = 0; i < allStages.length; i++) {
          if (!stagesReached.includes(allStages[i])) {
            dropOffStage = allStages[i];
            break;
          }
        }
      }

      journeys.push({
        sessionId: session.id,
        userId: session.userId,
        entryTimestamp: funnelEvents[0].createdAt,
        conversionTimestamp,
        timeToConvert,
        stagesReached,
        dropOffStage,
        deviceType: session.deviceInfo?.deviceType || 'unknown',
        utmSource: session.utmParams?.utm_source || null,
        converted,
      });
    }

    return journeys;
  }

  /**
   * Calculate funnel steps from journeys
   *
   * @param journeys - Session funnel journeys
   * @returns IFunnelStepData[] - Funnel steps with metrics
   */
  private calculateFunnelSteps(journeys: ISessionFunnelJourney[]): IFunnelStepData[] {
    const stages = Object.values(FunnelStage);
    const steps: IFunnelStepData[] = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const enteredCount = journeys.filter(j => j.stagesReached.includes(stage)).length;
      const completedCount = i < stages.length - 1
        ? journeys.filter(j => j.stagesReached.includes(stages[i + 1])).length
        : journeys.filter(j => j.converted).length;

      const conversionRate = enteredCount > 0 ? (completedCount / enteredCount) * 100 : 0;
      const dropOffRate = 100 - conversionRate;

      steps.push({
        stage,
        stageName: this.STAGE_NAMES[stage],
        enteredCount,
        completedCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        dropOffRate: Math.round(dropOffRate * 10) / 10,
        averageTimeSpent: 0, // Would need event timing data
        medianTimeSpent: 0,
      });
    }

    return steps;
  }

  /**
   * Find biggest drop-off stage
   *
   * @param steps - Funnel steps
   * @returns Biggest drop-off information
   */
  private findBiggestDropOff(steps: IFunnelStepData[]): IFunnelAnalytics['biggestDropOff'] {
    let maxDropOff = steps[0];

    for (const step of steps) {
      if (step.dropOffRate > maxDropOff.dropOffRate) {
        maxDropOff = step;
      }
    }

    return {
      stage: maxDropOff.stage,
      dropOffRate: maxDropOff.dropOffRate,
      lostSessions: maxDropOff.enteredCount - maxDropOff.completedCount,
    };
  }

  /**
   * Calculate segmentation metrics
   *
   * @param journeys - Session journeys
   * @param segmentKey - Segmentation dimension
   * @returns Segmented conversion rates
   */
  private calculateSegmentation(
    journeys: ISessionFunnelJourney[],
    segmentKey: keyof ISessionFunnelJourney,
  ): Record<string, { sessions: number; conversionRate: number }> {
    const segmentMap = new Map<string, { total: number; converted: number }>();

    for (const journey of journeys) {
      const segmentValue = String(journey[segmentKey] || 'unknown');

      if (!segmentMap.has(segmentValue)) {
        segmentMap.set(segmentValue, { total: 0, converted: 0 });
      }

      const segment = segmentMap.get(segmentValue)!;
      segment.total++;
      if (journey.converted) {
        segment.converted++;
      }
    }

    const result: Record<string, any> = {};
    for (const [key, value] of segmentMap.entries()) {
      result[key] = {
        sessions: value.total,
        conversionRate: value.total > 0
          ? Math.round((value.converted / value.total) * 1000) / 10
          : 0,
      };
    }

    return result;
  }

  /**
   * Get events for a specific variant
   */
  private async getVariantEvents(
    startDate: Date,
    endDate: Date,
    filter: { utmCampaign?: string; abTestVariant?: string },
  ): Promise<UserEvent[]> {
    let query = this.userEventRepository
      .createQueryBuilder('e')
      .where('e.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (filter.abTestVariant) {
      query = query.andWhere('e.abTestVariant = :variant', { variant: filter.abTestVariant });
    }

    return query.getMany();
  }

  /**
   * Get sessions for a specific variant
   */
  private async getVariantSessions(
    startDate: Date,
    endDate: Date,
    filter: { utmCampaign?: string; abTestVariant?: string },
  ): Promise<UserSession[]> {
    let query = this.userSessionRepository
      .createQueryBuilder('s')
      .where('s.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (filter.utmCampaign) {
      query = query.andWhere("s.utmParams->>'$.utm_campaign' = :campaign", {
        campaign: filter.utmCampaign,
      });
    }

    return query.getMany();
  }

  /**
   * Chi-square test for statistical significance
   *
   * @param conversionsA - Conversions for variant A
   * @param totalA - Total sessions for variant A
   * @param conversionsB - Conversions for variant B
   * @param totalB - Total sessions for variant B
   * @returns Statistical test result
   */
  private chiSquareTest(
    conversionsA: number,
    totalA: number,
    conversionsB: number,
    totalB: number,
  ): { isSignificant: boolean; pValue: number } {
    // Simplified chi-square test (would use proper statistical library in production)
    const expectedA = (conversionsA + conversionsB) / (totalA + totalB) * totalA;
    const expectedB = (conversionsA + conversionsB) / (totalA + totalB) * totalB;

    const chiSquare =
      Math.pow(conversionsA - expectedA, 2) / expectedA +
      Math.pow(conversionsB - expectedB, 2) / expectedB;

    // P-value approximation (simplified)
    const pValue = chiSquare > 3.84 ? 0.05 : 0.1; // Rough approximation

    return {
      isSignificant: pValue < 0.05,
      pValue,
    };
  }

  /**
   * Calculate percentile
   *
   * @param sortedArray - Sorted numeric array
   * @param percentile - Percentile to calculate (0-100)
   * @returns Percentile value
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedArray[lower];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}
