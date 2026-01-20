/**
 * @file analytics.service.ts
 * @description Service for tracking analytics events
 *
 * @author SouqSyria Development Team
 * @since 2025-10-08
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEntity } from './entities/analytics.entity';

/**
 * Analytics Service
 *
 * Handles tracking of analytics events for banners, products, and categories
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEntity)
    private readonly analyticsRepository: Repository<AnalyticsEntity>,
  ) {}

  /**
   * Track Analytics Event
   *
   * Records an analytics event to the database
   *
   * @param data - Event tracking data
   * @returns Promise<void>
   */
  async trackEvent(data: {
    event_type: 'impression' | 'click' | 'cta_click';
    banner_id?: string;
    product_id?: number;
    category_id?: number;
    user_id?: number;
    session_id: string;
    user_agent?: string;
    ip_address?: string;
    referrer?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      this.logger.log(
        `📊 Tracking ${data.event_type} event: banner=${data.banner_id || 'N/A'}, product=${data.product_id || 'N/A'}, category=${data.category_id || 'N/A'}`,
      );

      const analytics = this.analyticsRepository.create({
        eventType: data.event_type,
        bannerId: data.banner_id || null,
        productId: data.product_id || null,
        categoryId: data.category_id || null,
        userId: data.user_id || null,
        sessionId: data.session_id,
        userAgent: data.user_agent || null,
        ipAddress: data.ip_address || null,
        referrer: data.referrer || null,
        metadata: data.metadata || null,
        eventTimestamp: new Date(),
      });

      await this.analyticsRepository.save(analytics);

      this.logger.log(`✅ Analytics event tracked successfully`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to track analytics event: ${error.message}`,
        error.stack,
      );
      // Don't throw error - analytics failures shouldn't break user experience
    }
  }
}
