import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminRefreshDto } from '../dto/admin-refresh.dto';
import { AdminLogoutDto } from '../dto/admin-logout.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * Admin login with email and password
   * @description Authenticates admin users and returns JWT access token with refresh token
   */
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Admin login with email and password',
    description: 'Authenticates admin users and returns JWT access token with refresh token. User must have admin role assigned (super_admin, admin, moderator, customer_service, or vendor_manager).'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Returns access token, refresh token, and admin profile'
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or admin access not enabled for this account'
  })
  @ApiResponse({
    status: 403,
    description: 'Account is banned or suspended'
  })
  async login(@Body() dto: AdminLoginDto, @Req() request: Request) {
    return this.adminAuthService.login(dto, request.ip);
  }

  /**
   * Refresh admin JWT token
   * @description Exchange refresh token for new access token
   */
  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh admin JWT token',
    description: 'Exchange a valid refresh token for a new access token'
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully'
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token'
  })
  async refresh(@Body() dto: AdminRefreshDto) {
    return this.adminAuthService.refresh(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: UserFromToken,
    @Req() request: Request,
    @Body() dto: AdminLogoutDto,
  ) {
    return this.adminAuthService.logout(
      user.id,
      request.headers['authorization'],
      dto,
      request.ip,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@CurrentUser() user: UserFromToken) {
    return this.adminAuthService.getProfile(user.id);
  }
}
