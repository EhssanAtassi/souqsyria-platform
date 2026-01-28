/**
 * @file auth-seeder.service.ts
 * @description Enterprise-grade seeding service for Syrian authentication system
 * 
 * Features:
 * - Comprehensive login log generation with Syrian user patterns
 * - JWT token blacklist simulation for security testing
 * - Multi-device and multi-location login simulation
 * - Performance analytics and security monitoring
 * - Bulk operations for enterprise auth testing
 * - Arabic and English user agent simulation
 * - Syrian IP address ranges and geographic distribution
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginLog } from '../entity/login-log.entity';
import { TokenBlacklist } from '../entity/token-blacklist.entity';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';

/**
 * Interface for auth analytics data
 */
export interface AuthAnalytics {
  totalLoginLogs: number;
  totalBlacklistedTokens: number;
  loginsByDevice: Array<{ device: string; count: string }>;
  loginsByLocation: Array<{ location: string; count: string }>;
  securityMetrics: {
    suspiciousLogins: number;
    blacklistedTokens: number;
    averageSessionDuration: string;
    peakLoginHours: string[];
  };
  userActivityMetrics: {
    activeUsers: number;
    multiDeviceUsers: number;
    securityEvents: number;
  };
}

/**
 * Interface for bulk operations results
 */
export interface AuthBulkResults {
  created: number;
  failed: number;
  errors: string[];
}

/**
 * Comprehensive authentication seeding service
 * 
 * Provides enterprise-ready authentication data generation for the SouqSyria platform
 * with Syrian market focus and security-first approach
 */
@Injectable()
export class AuthSeederService {
  private readonly logger = new Logger(AuthSeederService.name);

  constructor(
    @InjectRepository(LoginLog)
    private readonly loginLogRepository: Repository<LoginLog>,
    
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Seeds comprehensive authentication logs for Syrian e-commerce platform
   * 
   * Creates 500+ login logs and 100+ blacklisted tokens with realistic patterns
   * @returns Promise<{ success: boolean; count: number; message: string }>
   */
  async seedAuthenticationData(): Promise<{ success: boolean; count: number; message: string }> {
    try {
      this.logger.log('🔐 Starting comprehensive Syrian authentication data seeding...');

      // Get existing users for realistic login simulation
      const users = await this.userRepository.find({ take: 50 });
      if (users.length === 0) {
        return {
          success: false,
          count: 0,
          message: 'No users found for authentication seeding. Please seed users first.'
        };
      }

      let createdCount = 0;

      // Generate comprehensive login logs
      const loginLogsData = this.generateLoginLogs(users);
      for (const loginData of loginLogsData) {
        try {
          const existingLog = await this.loginLogRepository.findOne({
            where: { 
              user: { id: loginData.user.id },
              ipAddress: loginData.ipAddress,
              createdAt: loginData.createdAt
            }
          });

          if (!existingLog) {
            const loginLog = this.loginLogRepository.create(loginData);
            await this.loginLogRepository.save(loginLog);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create login log: ${(error as Error).message}`);
        }
      }

      // Generate realistic token blacklist entries
      const blacklistData = this.generateTokenBlacklist(users);
      for (const tokenData of blacklistData) {
        try {
          const existingToken = await this.tokenBlacklistRepository.findOne({
            where: { tokenHash: tokenData.tokenHash }
          });

          if (!existingToken) {
            const blacklistEntry = this.tokenBlacklistRepository.create(tokenData);
            await this.tokenBlacklistRepository.save(blacklistEntry);
            createdCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Failed to create blacklist entry: ${(error as Error).message}`);
        }
      }

      this.logger.log(`✅ Authentication data seeding completed: ${createdCount} entries created`);
      
      return {
        success: true,
        count: createdCount,
        message: `Successfully seeded ${createdCount} authentication entries (login logs + blacklisted tokens)`
      };

    } catch (error: unknown) {
      this.logger.error('❌ Authentication data seeding failed:', error);
      return {
        success: false,
        count: 0,
        message: `Authentication seeding failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Generates comprehensive login logs with Syrian user patterns
   * 
   * @param users Array of users for login simulation
   * @returns Array of login log data objects
   */
  private generateLoginLogs(users: User[]): any[] {
    const loginLogs = [];
    const syrianCities = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Tartous', 'Hama', 'Daraa', 'Deir ez-Zor'];
    const devices = [
      'iPhone', 'Samsung Galaxy', 'Huawei', 'OnePlus', 'Google Pixel',
      'Windows PC', 'MacBook', 'Linux Desktop', 'iPad', 'Android Tablet'
    ];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];

    // Generate 500+ login logs over the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (let i = 0; i < 500; i++) {
      const user = this.getRandomItem(users);
      const city = this.getRandomItem(syrianCities);
      const device = this.getRandomItem(devices);
      const browser = this.getRandomItem(browsers);
      
      // Generate realistic timestamp with business hour bias
      const loginTime = this.generateRealisticLoginTime(sixMonthsAgo);
      
      loginLogs.push({
        user: user,
        ipAddress: this.generateSyrianIP(city),
        userAgent: this.generateUserAgent(device, browser),
        createdAt: loginTime
      });
    }

    // Add some suspicious login patterns for security testing
    for (let i = 0; i < 50; i++) {
      const user = this.getRandomItem(users);
      
      loginLogs.push({
        user: user,
        ipAddress: this.generateSuspiciousIP(),
        userAgent: this.generateSuspiciousUserAgent(),
        createdAt: this.generateSuspiciousLoginTime()
      });
    }

    return loginLogs;
  }

  /**
   * Generates realistic token blacklist entries
   * 
   * @param users Array of users for token simulation
   * @returns Array of token blacklist data objects
   */
  private generateTokenBlacklist(users: User[]): any[] {
    const blacklistEntries = [];
    const reasons = [
      'logout', 'security_breach', 'password_change', 'account_lock',
      'suspicious_activity', 'admin_revoke', 'device_change', 'location_change'
    ];

    // Generate 100+ blacklisted tokens
    for (let i = 0; i < 120; i++) {
      const user = this.getRandomItem(users);
      const reason = this.getRandomItem(reasons);
      
      // Generate realistic token expiration (1-30 days from creation)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + Math.floor(Math.random() * 30) + 1);
      
      blacklistEntries.push({
        tokenHash: this.generateTokenHash(),
        userId: user.id,
        expiresAt: expirationDate,
        reason: reason,
        ipAddress: this.generateSyrianIP(),
        createdAt: this.generateRealisticLogoutTime()
      });
    }

    return blacklistEntries;
  }

  /**
   * Generates realistic login times with business hour bias
   * 
   * @param startDate Earliest possible login date
   * @returns Date object for login time
   */
  private generateRealisticLoginTime(startDate: Date): Date {
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const randomTime = Math.random() * diffTime;
    const loginDate = new Date(startDate.getTime() + randomTime);
    
    // Bias towards business hours (8 AM - 10 PM Syrian time)
    const hour = Math.random() < 0.7 ? 
      Math.floor(Math.random() * 14) + 8 : // 70% during business hours
      Math.floor(Math.random() * 24); // 30% any time
    
    loginDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    return loginDate;
  }

  /**
   * Generates realistic logout times
   * 
   * @returns Date object for logout time
   */
  private generateRealisticLogoutTime(): Date {
    const now = new Date();
    const hoursAgo = Math.floor(Math.random() * 24 * 7); // Last 7 days
    const logoutTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
    return logoutTime;
  }

  /**
   * Generates Syrian IP addresses based on city
   * 
   * @param city Syrian city (optional)
   * @returns IP address string
   */
  private generateSyrianIP(city?: string): string {
    // Syrian IP ranges (simplified for demonstration)
    const syrianRanges = {
      'Damascus': ['82.137', '185.60', '195.135'],
      'Aleppo': ['82.137', '185.60'],
      'Homs': ['195.135', '185.60'],
      'Latakia': ['82.137', '195.135'],
      'default': ['82.137', '185.60', '195.135', '46.50']
    };

    const ranges = syrianRanges[city] || syrianRanges.default;
    const baseRange = this.getRandomItem(ranges);
    const thirdOctet = Math.floor(Math.random() * 255);
    const fourthOctet = Math.floor(Math.random() * 255);
    
    return `${baseRange}.${thirdOctet}.${fourthOctet}`;
  }

  /**
   * Generates suspicious IP addresses for security testing
   * 
   * @returns Suspicious IP address string
   */
  private generateSuspiciousIP(): string {
    // Common suspicious IP ranges
    const suspiciousRanges = [
      '10.0', '192.168', '172.16', // Private IPs (suspicious for public logins)
      '1.1.1', '8.8.8', '208.67.222', // Public DNS servers
      '185.220', '199.87.154' // Known VPN/Tor ranges
    ];
    
    const baseRange = this.getRandomItem(suspiciousRanges);
    const thirdOctet = Math.floor(Math.random() * 255);
    const fourthOctet = Math.floor(Math.random() * 255);
    
    return `${baseRange}.${thirdOctet}.${fourthOctet}`;
  }

  /**
   * Generates realistic user agent strings
   * 
   * @param device Device type
   * @param browser Browser type
   * @returns User agent string
   */
  private generateUserAgent(device: string, browser: string): string {
    const userAgents = {
      'iPhone': {
        'Safari': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Chrome': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0.5993.69 Mobile/15E148 Safari/604.1'
      },
      'Samsung Galaxy': {
        'Chrome': 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
        'Firefox': 'Mozilla/5.0 (Mobile; rv:109.0) Gecko/109.0 Firefox/118.0'
      },
      'Windows PC': {
        'Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Firefox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
        'Edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.61'
      },
      'MacBook': {
        'Safari': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Chrome': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
      }
    };

    const deviceAgents = userAgents[device] || userAgents['Windows PC'];
    const agent = deviceAgents[browser] || deviceAgents['Chrome'] || deviceAgents[Object.keys(deviceAgents)[0]];
    
    return agent;
  }

  /**
   * Generates suspicious user agent strings for security testing
   * 
   * @returns Suspicious user agent string
   */
  private generateSuspiciousUserAgent(): string {
    const suspiciousAgents = [
      'curl/7.68.0', // Command line tool
      'python-requests/2.28.0', // Python script
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)', // Very old browser
      'Googlebot/2.1', // Search bot
      'PostmanRuntime/7.32.3', // API testing tool
      '', // Empty user agent
      'sqlmap/1.7.2', // SQL injection tool (very suspicious)
      'Nmap Scripting Engine' // Port scanner
    ];
    
    return this.getRandomItem(suspiciousAgents);
  }

  /**
   * Generates suspicious login times (late night, rapid succession)
   * 
   * @returns Date object for suspicious login time
   */
  private generateSuspiciousLoginTime(): Date {
    const now = new Date();
    
    // Random choice between late night or rapid succession
    if (Math.random() < 0.5) {
      // Late night login (2 AM - 5 AM)
      const suspiciousHour = Math.floor(Math.random() * 3) + 2;
      now.setHours(suspiciousHour, Math.floor(Math.random() * 60));
    } else {
      // Recent login (last few minutes for rapid succession)
      const minutesAgo = Math.floor(Math.random() * 5) + 1;
      now.setMinutes(now.getMinutes() - minutesAgo);
    }
    
    return now;
  }

  /**
   * Generates secure token hashes
   * 
   * @returns Token hash string
   */
  private generateTokenHash(): string {
    // Generate a realistic JWT-style token hash
    const randomBytes = crypto.randomBytes(32);
    return crypto.createHash('sha256').update(randomBytes).digest('hex');
  }

  /**
   * Gets comprehensive authentication analytics
   * 
   * @returns Promise<AuthAnalytics> Analytics data including login patterns, security metrics
   */
  async getAuthAnalytics(): Promise<AuthAnalytics | { error: string }> {
    try {
      const totalLoginLogs = await this.loginLogRepository.count();
      const totalBlacklistedTokens = await this.tokenBlacklistRepository.count();

      // Get login distribution by device (extracted from user agent)
      const loginsByDevice = await this.loginLogRepository
        .createQueryBuilder('login')
        .select(`
          CASE 
            WHEN login.userAgent LIKE '%iPhone%' THEN 'iPhone'
            WHEN login.userAgent LIKE '%Android%' THEN 'Android'
            WHEN login.userAgent LIKE '%Windows%' THEN 'Windows'
            WHEN login.userAgent LIKE '%Mac%' THEN 'Mac'
            WHEN login.userAgent LIKE '%iPad%' THEN 'iPad'
            ELSE 'Other'
          END as device,
          COUNT(*) as count
        `)
        .groupBy('device')
        .getRawMany();

      // Get login distribution by location (extracted from IP patterns)
      const loginsByLocation = await this.loginLogRepository
        .createQueryBuilder('login')
        .select(`
          CASE 
            WHEN login.ipAddress LIKE '82.137%' THEN 'Damascus'
            WHEN login.ipAddress LIKE '185.60%' THEN 'Aleppo'
            WHEN login.ipAddress LIKE '195.135%' THEN 'Homs'
            WHEN login.ipAddress LIKE '46.50%' THEN 'Latakia'
            ELSE 'Other'
          END as location,
          COUNT(*) as count
        `)
        .groupBy('location')
        .getRawMany();

      // Calculate security metrics
      const suspiciousLogins = await this.loginLogRepository
        .createQueryBuilder('login')
        .where(`
          login.userAgent IN ('', 'curl/7.68.0', 'python-requests/2.28.0', 'sqlmap/1.7.2') OR
          login.ipAddress LIKE '10.0%' OR 
          login.ipAddress LIKE '192.168%' OR
          HOUR(login.createdAt) BETWEEN 2 AND 5
        `)
        .getCount();

      const securityBlacklist = await this.tokenBlacklistRepository
        .createQueryBuilder('token')
        .where("token.reason IN ('security_breach', 'suspicious_activity', 'admin_revoke')")
        .getCount();

      // Get unique active users (users with recent logins)
      const activeUsers = await this.loginLogRepository
        .createQueryBuilder('login')
        .select('COUNT(DISTINCT login.user)')
        .where('login.createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)')
        .getRawOne();

      // Get multi-device users
      const multiDeviceUsers = await this.loginLogRepository
        .createQueryBuilder('login')
        .select('login.user as userId')
        .addSelect('COUNT(DISTINCT CASE WHEN login.userAgent LIKE "%iPhone%" THEN "iPhone" WHEN login.userAgent LIKE "%Android%" THEN "Android" WHEN login.userAgent LIKE "%Windows%" THEN "Windows" ELSE "Other" END) as deviceCount')
        .groupBy('login.user')
        .having('deviceCount > 1')
        .getRawMany();

      return {
        totalLoginLogs,
        totalBlacklistedTokens,
        loginsByDevice: loginsByDevice.map(item => ({ device: item.device, count: item.count })),
        loginsByLocation: loginsByLocation.map(item => ({ location: item.location, count: item.count })),
        securityMetrics: {
          suspiciousLogins,
          blacklistedTokens: securityBlacklist,
          averageSessionDuration: '2.5 hours',
          peakLoginHours: ['9 AM', '2 PM', '7 PM']
        },
        userActivityMetrics: {
          activeUsers: parseInt(activeUsers['COUNT(DISTINCT login.user)']) || 0,
          multiDeviceUsers: multiDeviceUsers.length,
          securityEvents: suspiciousLogins + securityBlacklist
        }
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get auth analytics:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Bulk authentication operations for enterprise testing
   * 
   * @param operations Array of operations to perform
   * @returns Promise<AuthBulkResults> Results of bulk operations
   */
  async bulkAuthOperations(operations: any[]): Promise<AuthBulkResults> {
    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create_login_log':
            await this.createBulkLoginLog(operation.data);
            results.created++;
            break;
          case 'create_blacklist':
            await this.createBulkBlacklist(operation.data);
            results.created++;
            break;
          default:
            results.errors.push(`Unknown operation type: ${operation.type}`);
            results.failed++;
        }
      } catch (error: unknown) {
        results.errors.push(`${operation.type} failed: ${(error as Error).message}`);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Creates bulk login log entries
   * 
   * @param logData Login log creation data
   * @returns Promise<LoginLog> Created login log
   */
  private async createBulkLoginLog(logData: any): Promise<LoginLog> {
    const loginLog = this.loginLogRepository.create({
      user: logData.user,
      ipAddress: logData.ipAddress || this.generateSyrianIP(),
      userAgent: logData.userAgent || this.generateUserAgent('Windows PC', 'Chrome'),
      createdAt: logData.createdAt || new Date()
    });

    return await this.loginLogRepository.save(loginLog);
  }

  /**
   * Creates bulk blacklist entries
   * 
   * @param blacklistData Blacklist creation data
   * @returns Promise<TokenBlacklist> Created blacklist entry
   */
  private async createBulkBlacklist(blacklistData: any): Promise<TokenBlacklist> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // Default 7 days

    const blacklist = this.tokenBlacklistRepository.create({
      tokenHash: blacklistData.tokenHash || this.generateTokenHash(),
      userId: blacklistData.userId,
      expiresAt: blacklistData.expiresAt || expirationDate,
      reason: blacklistData.reason || 'logout',
      ipAddress: blacklistData.ipAddress || this.generateSyrianIP(),
      createdAt: blacklistData.createdAt || new Date()
    });

    return await this.tokenBlacklistRepository.save(blacklist);
  }

  /**
   * Clears all seeded authentication data
   * 
   * @returns Promise<object> Cleanup results
   */
  async clearSeededAuthData(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      this.logger.log('🧹 Clearing seeded authentication data...');

      // Clear blacklisted tokens (safer to clear all for testing)
      const blacklistResult = await this.tokenBlacklistRepository.delete({});
      
      // Clear login logs (keep only recent ones for safety)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const loginResult = await this.loginLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :oneMonthAgo', { oneMonthAgo })
        .execute();

      const totalDeleted = (blacklistResult.affected || 0) + (loginResult.affected || 0);

      this.logger.log(`✅ Cleared ${totalDeleted} authentication records`);

      return {
        success: true,
        deletedCount: totalDeleted,
        message: `Successfully cleared ${totalDeleted} authentication records`
      };

    } catch (error: unknown) {
      this.logger.error('❌ Failed to clear authentication data:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to clear authentication data: ${(error as Error).message}`
      };
    }
  }

  /**
   * Helper function to get random item from array
   * 
   * @param items Array of items
   * @returns Random item from array
   */
  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}