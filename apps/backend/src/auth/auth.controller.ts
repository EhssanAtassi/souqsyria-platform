/**
 * @file auth.controller.ts
 * @description Authentication Controller for email/password JWT auth.
 * Handles registration, login, OTP verification, password reset, token refresh, and logout.
 */
import {
  Controller,
  UseGuards,
  Logger,
  Post,
  Body,
  Req,
  Put,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
  /**
   * @route POST /auth/register
   * @description Register new user and return JWT tokens for auto-login
   */
  @Public()
  @ApiOperation({
    summary: 'Register new user with email and password (auto-login enabled)',
  })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
  ) {
    return await this.authService.register(registerDto, request);
  }

  /**
   * @route POST /auth/verify-otp
   * @description Verify user OTP code sent via email
   */
  @Public()
  @ApiOperation({ summary: 'Verify user email using OTP' })
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    await this.authService.verifyOtp(verifyOtpDto);
    return {
      message: 'Account verified successfully.',
    };
  }

  /**
   * @route POST /auth/login
   * @description Login user with email/password and return JWT tokens
   */
  @Public()
  @ApiOperation({ summary: 'Login with email and password' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const tokens = await this.authService.login(loginDto, request);
    return {
      message: 'Login successful.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * @route POST /auth/forgot-password
   * @description Send password reset email with token
   */
  @Public()
  @ApiOperation({ summary: 'Send password reset email' })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }
  /**
   * @route POST /auth/reset-password
   * @description Reset password using token
   */
  @Public()
  @ApiOperation({ summary: 'Reset password with token' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
  /**
   * @route PUT /auth/change-password
   * @description Change password for logged-in user
   */
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: { id: number },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(
      user.id,
      changePasswordDto,
    );
  }

  /**
   * @route POST /auth/logout
   * @description Logout user and blacklist JWT token
   */
  @ApiOperation({ summary: 'Logout user and invalidate token' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: { id: number },
    @Req() request: Request,
    @Body() logoutDto: LogoutDto,
  ) {
    // Extract token from Authorization header
    const authHeader = request.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Remove "Bearer " prefix

    if (!token) {
      throw new BadRequestException('No token provided for logout.');
    }

    return await this.authService.logout(
      user.id,
      token,
      request.ip || 'unknown',
      logoutDto,
    );
  }

  /**
   * @route POST /auth/refresh-token
   * @description Refresh JWT tokens using token rotation (issues new access + refresh tokens)
   */
  @Public()
  @ApiOperation({ summary: 'Refresh JWT access and refresh tokens' })
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * @route POST /auth/resend-otp
   * @description Resend OTP verification email
   */
  @Public()
  @ApiOperation({ summary: 'Resend OTP verification email' })
  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.authService.resendOtp(resendOtpDto);
  }

  /**
   * @route DELETE /auth/account
   * @description Soft delete user account (requires password confirmation)
   */
  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(
    @CurrentUser() user: { id: number },
    @Req() request: Request,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return await this.authService.deleteAccount(
      user.id,
      deleteAccountDto,
      request.ip || 'unknown',
    );
  }
}
