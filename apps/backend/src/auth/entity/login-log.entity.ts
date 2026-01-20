/**
 * @file login-log.entity.ts
 * @description Logs every successful login attempt for auditing and security purposes.
 * Tracks user ID, IP address, device/user-agent, and login timestamp.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('login_logs')
export class LoginLog {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to the user who logged in.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * IP address from which the user logged in.
   */
  @Column({ name: 'ip_address' })
  ipAddress: string;

  /**
   * Device or browser info of the login source.
   */
  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  /**
   * Timestamp when the login occurred.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
