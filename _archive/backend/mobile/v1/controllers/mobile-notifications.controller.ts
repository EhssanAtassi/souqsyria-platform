import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MobileNotificationsService } from '../services/mobile-notifications.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

/**
 * Mobile Notifications Controller
 *
 * Handles push notifications for mobile applications
 */
@ApiTags('📱 Mobile Notifications API v1')
@Controller('api/mobile/v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MobileNotificationsController {
  constructor(
    private readonly mobileNotificationsService: MobileNotificationsService,
  ) {}

  /**
   * GET /api/mobile/v1/notifications/preferences
   * Get notification preferences
   */
  @Get('preferences')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Retrieves user notification preferences for mobile app',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
  })
  async getNotificationPreferences(@Request() req) {
    const userId = req.user.id;
    return await this.mobileNotificationsService.getNotificationPreferences(
      userId,
    );
  }

  /**
   * PUT /api/mobile/v1/notifications/preferences
   * Update notification preferences
   */
  @Put('preferences')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Updates user notification preferences for mobile app',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  async updateNotificationPreferences(
    @Request() req,
    @Body() preferences: any,
  ) {
    const userId = req.user.id;
    return await this.mobileNotificationsService.updateNotificationPreferences(
      userId,
      preferences,
    );
  }
}
