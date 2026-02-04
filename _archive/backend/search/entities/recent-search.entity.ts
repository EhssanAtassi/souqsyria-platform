/**
 * @file recent-search.entity.ts
 * @description Recent Search entity for SouqSyria header search functionality.
 *
 * Stores user search history to power the "Recent Searches" feature
 * in the header search bar autocomplete dropdown.
 *
 * FEATURES:
 * - Per-user search history tracking
 * - Bilingual query storage (English/Arabic)
 * - Search frequency counting for popular suggestions
 * - Auto-cleanup via TTL-based expiry
 * - Privacy-compliant with user-scoped deletion
 *
 * @swagger
 * components:
 *   schemas:
 *     RecentSearch:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Unique identifier
 *         query:
 *           type: string
 *           description: The search query text
 *         userId:
 *           type: number
 *           description: Owner user ID
 *         searchCount:
 *           type: number
 *           description: Number of times this query was searched
 *         resultCount:
 *           type: number
 *           description: Number of results returned for this query
 *         searchedAt:
 *           type: string
 *           format: date-time
 *           description: Last time this query was searched
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * RecentSearch Entity
 *
 * Tracks individual user search queries for the header search bar.
 * Each record represents a unique query per user with frequency tracking.
 *
 * Business Rules:
 * - Maximum 20 recent searches per user (enforced by service)
 * - Duplicate queries update the timestamp and increment count
 * - Users can delete individual entries or clear all history
 * - Queries are stored in the original language (Arabic or English)
 */
@Entity('recent_searches')
@Index(['user', 'query'], { unique: true }) // One entry per query per user
@Index(['user', 'searchedAt']) // Fast retrieval of user's recent searches
@Index(['query']) // For popular search aggregation
export class RecentSearch {
  @ApiProperty({
    description: 'Unique identifier for the recent search entry',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  // ================================
  // SEARCH DATA
  // ================================

  /**
   * The search query text entered by the user.
   * Stored in original language (English or Arabic).
   * Trimmed and lowercased before storage for deduplication.
   */
  @ApiProperty({
    description: 'Search query text (English or Arabic)',
    example: 'damascus steel knife',
    maxLength: 200,
  })
  @Column({ type: 'varchar', length: 200 })
  query: string;

  /**
   * Number of times this exact query was searched by the user.
   * Incremented on duplicate searches to track frequency.
   */
  @ApiProperty({
    description: 'Number of times this query was searched',
    example: 3,
    default: 1,
  })
  @Column({ type: 'int', default: 1 })
  searchCount: number;

  /**
   * Number of results returned for this query on last search.
   * Helps display result count hints in autocomplete.
   */
  @ApiPropertyOptional({
    description: 'Number of results returned on last search',
    example: 42,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  resultCount: number;

  /**
   * Optional category context for the search.
   * Stores the category filter that was active during search.
   */
  @ApiPropertyOptional({
    description: 'Category context for the search (if filtered)',
    example: 'food-spices',
    nullable: true,
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  categoryContext: string;

  // ================================
  // RELATIONSHIPS
  // ================================

  /**
   * The user who performed this search.
   * Cascade delete: when user is deleted, their search history is removed.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Foreign key for user relationship.
   * Exposed for query builder operations.
   */
  @ApiProperty({
    description: 'User ID who performed the search',
    example: 1,
  })
  @Column({ name: 'user_id' })
  userId: number;

  // ================================
  // TIMESTAMPS
  // ================================

  /**
   * Timestamp of the most recent search with this query.
   * Updated every time the user searches the same query again.
   */
  @ApiProperty({
    description: 'Timestamp of the most recent search',
    example: '2026-02-01T10:30:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  searchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
