/**
 * @file token-blacklist.entity.ts
 * @description Entity to store blacklisted JWT tokens for logout functionality.
 * Prevents reuse of tokens after logout for security.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The JWT token that has been blacklisted (usually the 'jti' claim or full token hash)
   */
  // @Index('IDX_TOKEN_BLACKLIST_HASH') // Index for fast lookups during auth
  @Column({ name: 'token_hash', unique: true })
  tokenHash: string;

  /**
   * User ID who owned this token (for audit purposes)
   */
  @Column({ name: 'user_id' })
  userId: number;

  /**
   * Original token expiration time (we can clean up expired blacklisted tokens)
   */
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  /**
   * Reason for blacklisting (logout, security breach, etc.)
   */
  @Column({ default: 'logout' })
  reason: string;

  /**
   * IP address from which logout was requested
   */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  /**
   * When the token was blacklisted
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
