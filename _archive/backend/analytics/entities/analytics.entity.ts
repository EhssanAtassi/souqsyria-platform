/**
 * @file analytics.entity.ts
 * @description Analytics event tracking entity (reuses hero_analytics table)
 *
 * This entity tracks analytics events for:
 * - Hero banners (banner_id)
 * - Products (product_id)
 * - Categories (category_id)
 *
 * @author SouqSyria Development Team
 * @since 2025-10-08
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Analytics Entity
 *
 * Maps to the existing hero_analytics table for unified analytics tracking
 */
@Entity('hero_analytics')
@Index(['eventType', 'eventTimestamp'])
@Index(['bannerId'])
@Index(['productId'])
@Index(['categoryId'])
@Index(['userId'])
@Index(['sessionId'])
export class AnalyticsEntity {
  @ApiProperty({
    description: 'Analytics record unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of analytics event',
    enum: ['impression', 'click', 'cta_click', 'conversion'],
    example: 'impression',
  })
  @Column({
    name: 'event_type',
    type: 'enum',
    enum: ['impression', 'click', 'cta_click', 'conversion'],
  })
  eventType: 'impression' | 'click' | 'cta_click' | 'conversion';

  @ApiProperty({
    description: 'Hero banner UUID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Column({ name: 'banner_id', type: 'uuid', nullable: true })
  bannerId: string | null;

  @ApiProperty({
    description: 'Product ID (optional)',
    example: 1,
    nullable: true,
  })
  @Column({ name: 'product_id', type: 'int', nullable: true })
  productId: number | null;

  @ApiProperty({
    description: 'Category ID (optional)',
    example: 1,
    nullable: true,
  })
  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @ApiProperty({
    description: 'User ID (optional)',
    example: 1,
    nullable: true,
  })
  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @ApiProperty({
    description: 'Session ID for anonymous tracking',
    example: 'session_abc123',
  })
  @Column({ name: 'session_id', type: 'varchar', length: 255 })
  sessionId: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
    nullable: true,
  })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({
    description: 'Client IP address',
    example: '192.168.1.1',
    nullable: true,
  })
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ApiProperty({
    description: 'Referrer URL',
    example: 'https://google.com',
    nullable: true,
  })
  @Column({ name: 'referrer', type: 'varchar', length: 500, nullable: true })
  referrer: string | null;

  @ApiProperty({
    description: 'Additional metadata (device type, viewport, etc.)',
    example: {
      position: 0,
      device_type: 'desktop',
      viewport_width: 1920,
    },
    nullable: true,
  })
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: any;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2025-10-08T15:30:00.000Z',
  })
  @CreateDateColumn({ name: 'event_timestamp' })
  eventTimestamp: Date;
}
