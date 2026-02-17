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
  Get,
  Body,
  Req,
  Res,
  Put,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
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
    private readonly configService: ConfigService,
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
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
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
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns access token, refresh token, and rememberMe flag.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials. Response includes errorCode: INVALID_CREDENTIALS and remainingAttempts before lockout.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Account locked due to too many failed attempts. Response includes errorCode: ACCOUNT_LOCKED and lockedUntilMinutes.',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded. Response includes retryAfter seconds.',
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const tokens = await this.authService.login(loginDto, request);
    return {
      message: 'Login successful.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      rememberMe: !!loginDto.rememberMe,
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
    return await this.authService.changePassword(user.id, changePasswordDto);
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

  // ─── Google OAuth ───────────────────────────────────────────

  /**
   * @route GET /auth/google
   * @description Initiates the Google OAuth 2.0 consent flow.
   * Redirects the user to Google's authorization page.
   */
  @Public()
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleLogin(): Promise<void> {
    // Guard triggers redirect — this method body is never reached
  }

  /**
   * @route GET /auth/google/callback
   * @description Handles the Google OAuth callback after user consent.
   * Creates/links user account and redirects to frontend with tokens.
   */
  @Public()
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() request: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleOAuthCallback('google', request, res);
  }

  // ─── Facebook OAuth ─────────────────────────────────────────

  /**
   * @route GET /auth/facebook
   * @description Initiates the Facebook OAuth flow.
   * Redirects the user to Facebook's authorization page.
   */
  @Public()
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Facebook consent screen',
  })
  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  async facebookLogin(): Promise<void> {
    // Guard triggers redirect — this method body is never reached
  }

  /**
   * @route GET /auth/facebook/callback
   * @description Handles the Facebook OAuth callback after user consent.
   * Creates/links user account and redirects to frontend with tokens.
   */
  @Public()
  @ApiOperation({ summary: 'Facebook OAuth callback handler' })
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  async facebookCallback(
    @Req() request: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleOAuthCallback('facebook', request, res);
  }

  // ─── OAuth Code Exchange ────────────────────────────────────

  /**
   * @route POST /auth/oauth/exchange
   * @description Exchanges a short-lived OAuth authorization code for JWT tokens.
   * The code is single-use and expires after 60 seconds. This endpoint replaces
   * the previous pattern of passing tokens directly in URL query parameters (C1 fix).
   *
   * @param body.code - The authorization code from the OAuth callback redirect
   * @returns Object containing accessToken and refreshToken
   */
  @Public()
  @ApiOperation({ summary: 'Exchange OAuth authorization code for tokens' })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @Post('oauth/exchange')
  async exchangeOAuthCode(
    @Body() body: { code: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!body.code) {
      throw new BadRequestException('Authorization code is required.');
    }
    return this.authService.exchangeOAuthCode(body.code);
  }

  // ─── OAuth Helper ───────────────────────────────────────────

  /**
   * @description Shared handler for OAuth callbacks. Validates/creates the user,
   * generates tokens, stores them behind a short-lived authorization code,
   * and redirects to the frontend with the code (not raw tokens).
   * Also validates the HMAC-signed state parameter for CSRF protection (C2 fix).
   *
   * @param provider - OAuth provider name ('google' | 'facebook')
   * @param request - Express request containing req.user from Passport
   * @param res - Express response for redirect
   */
  private async handleOAuthCallback(
    provider: 'google' | 'facebook',
    request: Request,
    res: Response,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    try {
      // C2: Validate OAuth state parameter for CSRF protection
      const state = (request.query as any).state as string;
      if (!state || !this.authService.validateOAuthState(state)) {
        this.logger.warn(
          `OAuth ${provider} callback: invalid state parameter (possible CSRF)`,
        );
        res.redirect(
          `${frontendUrl}/auth/callback/${provider}?error=invalid_state`,
        );
        return;
      }

      const oauthProfile = request.user as {
        providerId: string;
        email: string | null;
        fullName: string | null;
        avatar: string | null;
        provider: string;
      };

      if (!oauthProfile) {
        this.logger.warn(
          `OAuth ${provider} callback: no user profile returned`,
        );
        res.redirect(
          `${frontendUrl}/auth/callback/${provider}?error=no_profile`,
        );
        return;
      }

      const user = await this.authService.validateOrCreateOAuthUser(
        provider,
        oauthProfile,
        request,
      );

      const tokens = await this.authService.generateOAuthTokens(user, request);

      // C1: Generate auth code instead of passing tokens in URL
      const code = this.authService.generateOAuthCode(tokens);

      this.logger.log(
        `OAuth ${provider} callback success for user ID: ${user.id}`,
      );

      res.redirect(`${frontendUrl}/auth/callback/${provider}?code=${code}`);
    } catch (error: unknown) {
      this.logger.error(
        `OAuth ${provider} callback failed: ${(error as Error).message}`,
      );
      res.redirect(
        `${frontendUrl}/auth/callback/${provider}?error=auth_failed`,
      );
    }
  }
}
