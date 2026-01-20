import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminRefreshDto } from '../dto/admin-refresh.dto';
import { AdminLogoutDto } from '../dto/admin-logout.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto, @Req() request: Request) {
    return this.adminAuthService.login(dto, request.ip);
  }

  @Post('refresh')
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
