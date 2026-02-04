import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  MobileUserService,
  MobileUserUpdateRequest,
} from '../services/mobile-user.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

/**
 * Mobile User Controller
 *
 * Provides user profile management optimized for mobile applications
 */
@ApiTags('📱 Mobile User API v1')
@Controller('api/mobile/v1/user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MobileUserController {
  constructor(private readonly mobileUserService: MobileUserService) {}

  /**
   * GET /api/mobile/v1/user/profile
   * Get mobile user profile
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get mobile user profile',
    description: 'Retrieves user profile optimized for mobile display',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  async getMobileProfile(@Request() req) {
    const userId = req.user.id;
    return await this.mobileUserService.getMobileProfile(userId);
  }

  /**
   * PUT /api/mobile/v1/user/profile
   * Update mobile user profile
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Update mobile user profile',
    description: 'Updates user profile with mobile-optimized data',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateMobileProfile(
    @Request() req,
    @Body() updateData: MobileUserUpdateRequest,
  ) {
    const userId = req.user.id;
    return await this.mobileUserService.updateMobileProfile(userId, updateData);
  }

  /**
   * PUT /api/mobile/v1/user/preferences
   * Update user preferences
   */
  @Put('preferences')
  @ApiOperation({
    summary: 'Update user preferences',
    description: 'Updates user preferences for mobile app',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  async updatePreferences(@Request() req, @Body() preferences: any) {
    const userId = req.user.id;
    return await this.mobileUserService.updatePreferences(userId, preferences);
  }
}
