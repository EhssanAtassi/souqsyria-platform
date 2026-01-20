import { Controller, Post, Get, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MobileSeederService } from './mobile.seeder.service';

/**
 * Mobile Seeder Controller
 *
 * Provides endpoints to seed mobile-specific test data including:
 * - Mobile devices for testing push notifications
 * - OTP codes for authentication testing
 * - Mobile sessions for analytics testing
 * - Sample mobile notifications
 */
@ApiTags('🌱 Mobile Seeding')
@Controller('seed/mobile')
export class MobileSeederController {
  constructor(private readonly mobileSeederService: MobileSeederService) {}

  /**
   * Seed all mobile test data
   */
  @Post('all')
  @ApiOperation({
    summary: 'Seed all mobile test data',
    description:
      'Seeds devices, OTP codes, sessions, and notifications for mobile testing',
  })
  @ApiResponse({
    status: 201,
    description: 'Mobile test data seeded successfully',
    schema: {
      example: {
        message: 'Mobile test data seeded successfully',
        data: {
          devices: 15,
          otpCodes: 5,
          sessions: 8,
          notifications: 20,
        },
        performance: {
          executionTime: '1.2s',
          totalRecords: 48,
        },
      },
    },
  })
  async seedAll() {
    return await this.mobileSeederService.seedAll();
  }

  /**
   * Seed mobile devices for testing
   */
  @Post('devices')
  @ApiOperation({
    summary: 'Seed mobile devices',
    description:
      'Seeds sample mobile devices (iOS/Android) with push tokens for testing',
  })
  @ApiResponse({
    status: 201,
    description: 'Mobile devices seeded successfully',
  })
  async seedDevices() {
    return await this.mobileSeederService.seedDevices();
  }

  /**
   * Seed OTP codes for authentication testing
   */
  @Post('otp')
  @ApiOperation({
    summary: 'Seed OTP codes',
    description:
      'Seeds sample OTP codes for Syrian phone numbers for testing authentication',
  })
  @ApiResponse({
    status: 201,
    description: 'OTP codes seeded successfully',
  })
  async seedOTP() {
    return await this.mobileSeederService.seedOTP();
  }

  /**
   * Seed mobile sessions for analytics testing
   */
  @Post('sessions')
  @ApiOperation({
    summary: 'Seed mobile sessions',
    description:
      'Seeds sample mobile app sessions with activity data for analytics testing',
  })
  @ApiResponse({
    status: 201,
    description: 'Mobile sessions seeded successfully',
  })
  async seedSessions() {
    return await this.mobileSeederService.seedSessions();
  }

  /**
   * Seed mobile notifications
   */
  @Post('notifications')
  @ApiOperation({
    summary: 'Seed mobile notifications',
    description: 'Seeds sample push notifications with Arabic/English content',
  })
  @ApiResponse({
    status: 201,
    description: 'Mobile notifications seeded successfully',
  })
  async seedNotifications() {
    return await this.mobileSeederService.seedNotifications();
  }

  /**
   * Get seeding statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get mobile seeding statistics',
    description: 'Returns statistics about seeded mobile data',
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile seeding statistics retrieved successfully',
  })
  async getStats() {
    return await this.mobileSeederService.getStats();
  }

  /**
   * Clean all mobile test data
   */
  @Delete('clean')
  @ApiOperation({
    summary: 'Clean all mobile test data',
    description: 'Removes all seeded mobile test data from the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile test data cleaned successfully',
  })
  async cleanAll() {
    return await this.mobileSeederService.cleanAll();
  }
}
