/**
 * @file auth.controller.ts
 * @description Authentication Controller to handle login using Firebase ID Token.
 * Syncs users with MySQL and returns profile.
 */
import {
  Controller,
  Get,
  UseGuards,
  Logger,
  Post,
  Body,
  Req,
  Put,
  BadRequestException,
  Delete,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { ConfigService } from '@nestjs/config';
import { GoogleProfile } from './strategies/google.strategy';
import { FacebookProfile } from './strategies/facebook.strategy';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * @route POST /auth/register
   * @description Register new user and return JWT tokens for auto-login
   */
  @ApiOperation({
    summary: 'Register new user with email and password (auto-login enabled)',
  })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
  ) {
    const result = await this.authService.register(registerDto, request);
    return {
      success: true,
      ...result,
    };
  }
  /**
   * @route POST /auth/verify
   * @description Verify user OTP
   */

  @ApiOperation({ summary: 'Verify user email using OTP' })
  @Post('verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    await this.authService.verifyOtp(verifyOtpDto);
    return {
      success: true,
      message: 'Account verified successfully.',
    };
  }

  /**
   * @route POST /auth/login
   * @description Login user and return JWT
   */
  @ApiOperation({ summary: 'Login with email and password' })
  @Post('email-login')
  async email_login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const token = await this.authService.login(loginDto, request);
    return {
      success: true,
      message: 'Login successful.',
      accessToken: token.accessToken,
    };
  }

  /**
   * @route GET /auth/login
   * @description Sync user from Firebase to MySQL and return profile
   */
  @ApiOperation({ summary: 'Login using Firebase token (optional)' })
  @Get('firebase-login')
  @UseGuards(FirebaseAuthGuard)
  async firebase_login(
    @CurrentUser()
    firebaseUser: {
      uid: string;
      email?: string;
      phone?: string;
    },
  ) {
    this.logger.log(`Login attempt for Firebase UID: ${firebaseUser.uid}`);

    try {
      const user =
        await this.usersService.findOrCreateByFirebaseUid(firebaseUser);
      this.logger.log(`Login successful for user ID: ${user.id}`);
      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role?.name,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Login failed',
      };
    }
  }

  /**
   * 🔐 OAUTH AUTHENTICATION ENDPOINTS
   * Google and Facebook OAuth 2.0 authentication flows
   */

  /**
   * @route GET /auth/google
   * @description Initiate Google OAuth 2.0 authentication flow
   * Redirects user to Google consent screen
   */
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      'Redirects to Google consent screen for OAuth authentication. After user approval, Google redirects back to /auth/google/callback',
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard automatically redirects to Google OAuth consent screen
    // No code needed here - Passport handles the redirect
  }

  /**
   * @route GET /auth/google/callback
   * @description Handle Google OAuth callback after user authorization
   * Processes authorization code, creates/links user account, and redirects to frontend with tokens
   */
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Processes Google OAuth response, creates or links user account, and redirects to frontend with JWT tokens',
  })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // req.user contains GoogleProfile from strategy
      const googleProfile = req.user as GoogleProfile;

      // Handle user creation/login via service
      const result = await this.authService.handleGoogleUser(googleProfile, req);

      // Build frontend redirect URL with tokens
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = new URL(`${frontendUrl}/auth/oauth/callback`);

      // Pass tokens and user data as URL parameters
      redirectUrl.searchParams.set('accessToken', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('isNewUser', result.isNewUser.toString());
      redirectUrl.searchParams.set('provider', 'google');

      // Redirect to frontend
      this.logger.log(
        `Google OAuth successful, redirecting to frontend: ${frontendUrl}`,
      );
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error(`Google OAuth callback failed: ${error.message}`);

      // Redirect to frontend error page
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorUrl = new URL(`${frontendUrl}/auth/oauth/error`);
      errorUrl.searchParams.set('error', error.message);
      errorUrl.searchParams.set('provider', 'google');

      return res.redirect(errorUrl.toString());
    }
  }

  /**
   * @route GET /auth/facebook
   * @description Initiate Facebook OAuth authentication flow
   * Redirects user to Facebook consent screen
   */
  @ApiOperation({
    summary: 'Initiate Facebook OAuth login',
    description:
      'Redirects to Facebook consent screen for OAuth authentication. After user approval, Facebook redirects back to /auth/facebook/callback',
  })
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    // Guard automatically redirects to Facebook OAuth consent screen
    // No code needed here - Passport handles the redirect
  }

  /**
   * @route GET /auth/facebook/callback
   * @description Handle Facebook OAuth callback after user authorization
   * Processes authorization code, creates/links user account, and redirects to frontend with tokens
   */
  @ApiOperation({
    summary: 'Facebook OAuth callback',
    description:
      'Processes Facebook OAuth response, creates or links user account, and redirects to frontend with JWT tokens',
  })
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // req.user contains FacebookProfile from strategy
      const facebookProfile = req.user as FacebookProfile;

      // Handle user creation/login via service
      const result = await this.authService.handleFacebookUser(facebookProfile, req);

      // Build frontend redirect URL with tokens
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = new URL(`${frontendUrl}/auth/oauth/callback`);

      // Pass tokens and user data as URL parameters
      redirectUrl.searchParams.set('accessToken', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('isNewUser', result.isNewUser.toString());
      redirectUrl.searchParams.set('provider', 'facebook');

      // Redirect to frontend
      this.logger.log(
        `Facebook OAuth successful, redirecting to frontend: ${frontendUrl}`,
      );
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error(`Facebook OAuth callback failed: ${error.message}`);

      // Redirect to frontend error page
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorUrl = new URL(`${frontendUrl}/auth/oauth/error`);
      errorUrl.searchParams.set('error', error.message);
      errorUrl.searchParams.set('provider', 'facebook');

      return res.redirect(errorUrl.toString());
    }
  }

  /**
   * @route POST /auth/forgot-password
   * @description Send password reset email with token
   */
  @ApiOperation({ summary: 'Send password reset email' })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return {
      success: true,
      ...result,
    };
  }
  /**
   * @route POST /auth/reset-password
   * @description Reset password using token
   */
  @ApiOperation({ summary: 'Reset password with token' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return {
      success: true,
      ...result,
    };
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
    const result = await this.authService.changePassword(
      user.id,
      changePasswordDto,
    );
    return {
      success: true,
      ...result,
    };
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

    const result = await this.authService.logout(
      user.id,
      token,
      request.ip || 'unknown',
      logoutDto,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * @route POST /auth/refresh
   * @description Refresh JWT token without re-login
   */
  @ApiOperation({ summary: 'Refresh JWT access token' })
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * @route POST /auth/resend-otp
   * @description Resend OTP verification email
   */
  @ApiOperation({ summary: 'Resend OTP verification email' })
  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    const result = await this.authService.resendOtp(resendOtpDto);
    return {
      success: true,
      ...result,
    };
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
    const result = await this.authService.deleteAccount(
      user.id,
      deleteAccountDto,
      request.ip || 'unknown',
    );

    return {
      success: true,
      ...result,
    };
  }
}
