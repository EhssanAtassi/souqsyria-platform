/**
 * @file cart-guest.controller.ts
 * @description Cart Guest Controller for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Guest cart management for anonymous users
 * - Session-based cart operations without authentication
 * - Cart synchronization from client to server
 * - Seamless transition from guest to authenticated user
 *
 * ENDPOINTS:
 * - GET /cart/guest/:sessionId - Retrieve guest cart by session ID
 * - POST /cart/guest - Create or update guest cart
 * - POST /cart/guest/sync - Sync guest cart from client
 *
 * SECURITY:
 * - HTTP-only cookies for session management
 * - No authentication required (guest access)
 * - Session validation and expiration checks
 * - Device fingerprinting for fraud detection
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Logger,
  NotFoundException,
  BadRequestException,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CartRateLimitGuard, RateLimit } from '../guards/cart-rate-limit.guard';
import { CartService } from '../service/cart.service';
import { CartSyncService } from '../service/cart-sync.service';
import { SyncCartRequest } from '../dto/SyncCartRequest.dto';
import { Cart } from '../entities/cart.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

/**
 * Extended Request interface with guest session
 */
interface RequestWithGuestSession extends Request {
  guestSessionId?: string;
  cookies: {
    guest_session_id?: string;
    [key: string]: string | undefined;
  };
}

/**
 * CartGuestController
 *
 * Manages shopping cart operations for guest (unauthenticated) users.
 * Provides full cart functionality without requiring user registration.
 */
@Controller('cart/guest')
@ApiTags('🛒 Cart - Guest Sessions')
@UseGuards(CartRateLimitGuard)
@RateLimit({
  maxRequests: 50,
  windowSizeInSeconds: 3600,
  message: 'Too many cart requests. Please wait before trying again.'
})
export class CartGuestController {
  private readonly logger = new Logger(CartGuestController.name);

  constructor(
    private readonly cartService: CartService,
    private readonly cartSyncService: CartSyncService,
  ) {
    this.logger.log('🛒 Cart Guest Controller initialized');
  }

  /**
   * GET GUEST CART BY SESSION ID
   *
   * Retrieves the cart associated with a guest session.
   * Session ID comes from HTTP-only cookie set by GuestSessionMiddleware.
   *
   * SECURITY:
   * - Validates UUID format to prevent enumeration attacks
   * - Verifies session ownership by comparing cookie with URL param
   * - Public endpoint (no JWT required) but session validation enforced
   *
   * @param sessionId - Guest session UUID from URL parameter
   * @param request - Express request with cookies
   * @returns Cart with all items and totals
   * @throws UnauthorizedException if session doesn't match cookie
   */
  @Get(':sessionId')
  @Public()
  @ApiOperation({
    summary: 'Retrieve guest cart by session ID',
    description:
      'Fetches the cart associated with a guest session. Session ID comes from HTTP-only cookie. ' +
      'Returns cart with items, totals, and validation status. Session expires after 30 days of inactivity. ' +
      'SECURITY: Session ID in URL must match cookie to prevent IDOR attacks.',
  })
  @ApiParam({
    name: 'sessionId',
    type: 'string',
    description: 'Guest session UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: Cart,
    schema: {
      example: {
        id: 123,
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        currency: 'SYP',
        totalItems: 3,
        totalAmount: 125000,
        status: 'active',
        items: [
          {
            id: 789,
            quantity: 2,
            price_at_add: 50000,
            locked_until: '2025-11-19T10:30:00Z',
            valid: true,
            variant: {
              id: 101,
              name: 'iPhone 14 - 128GB - Blue',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Session ID mismatch - IDOR attempt detected',
    schema: {
      example: {
        message: 'Session ID does not match your cookie',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guest cart not found',
    schema: {
      example: {
        message: 'Guest cart not found for session 550e8400-...',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async getGuestCart(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() request: RequestWithGuestSession,
  ): Promise<Cart> {
    this.logger.log(`📋 Fetching guest cart for session: ${sessionId}`);

    // SECURITY: Verify session ownership by comparing cookie with URL param
    const sessionIdFromCookie = request.cookies?.guest_session_id;
    if (sessionIdFromCookie !== sessionId) {
      this.logger.warn(
        `🚨 IDOR attempt detected: Cookie session ${sessionIdFromCookie} != URL param ${sessionId}`,
      );
      throw new UnauthorizedException('Session ID does not match your cookie');
    }

    const cart = await this.cartService.findBySessionId(sessionId);
    if (!cart) {
      this.logger.warn(`⚠️ Guest cart not found for session ${sessionId}`);
      throw new NotFoundException(
        `Guest cart not found for session ${sessionId}`,
      );
    }

    this.logger.log(
      `✅ Guest cart retrieved: ${cart.items?.length || 0} items, ${cart.totalAmount} ${cart.currency}`,
    );
    return cart;
  }

  /**
   * CREATE OR UPDATE GUEST CART
   *
   * Creates a new guest cart or updates an existing one.
   * Session ID is attached via GuestSessionMiddleware.
   *
   * @param syncRequest - Cart items and metadata from client
   * @param request - Express request with guestSessionId
   * @returns Created or updated cart
   */
  @Post()
  @ApiOperation({
    summary: 'Create or update guest cart',
    description:
      'Creates a new guest cart or updates existing one. Session ID attached via middleware. ' +
      'Supports up to 100 items per cart, max 50 quantity per item. ' +
      'Includes 7-day price lock guarantee for all items.',
  })
  @ApiBody({
    type: SyncCartRequest,
    description: 'Cart items to sync from client',
    examples: {
      'Create Guest Cart': {
        value: {
          items: [
            { variantId: 1, quantity: 2, priceAtAdd: 50000 },
            { variantId: 5, quantity: 1, priceAtAdd: 125000 },
          ],
          clientVersion: 0,
          clientTimestamp: '2025-11-12T10:30:00Z',
        },
      },
      'Update Existing Cart': {
        value: {
          items: [
            { variantId: 1, quantity: 3, priceAtAdd: 50000 },
            { variantId: 5, quantity: 1, priceAtAdd: 125000 },
            { variantId: 8, quantity: 2, priceAtAdd: 75000 },
          ],
          clientVersion: 1,
          clientTimestamp: '2025-11-12T11:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Guest cart created successfully',
    type: Cart,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - cart limits exceeded or invalid data',
    schema: {
      example: {
        message: 'Cart cannot exceed 100 items',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async createOrUpdateGuestCart(
    @Body() syncRequest: SyncCartRequest,
    @Req() request: RequestWithGuestSession,
  ): Promise<Cart> {
    this.logger.log(`🛍️ Creating/updating guest cart`);

    // Extract guest session ID from middleware or cookies
    const guestSessionId =
      request.guestSessionId || request.cookies?.guest_session_id;

    if (!guestSessionId) {
      this.logger.error('❌ Guest session ID not found in request');
      throw new BadRequestException('Guest session ID required');
    }

    this.logger.log(
      `📦 Processing ${syncRequest.items?.length || 0} items for session ${guestSessionId}`,
    );

    const cart = await this.cartSyncService.syncGuestCart(
      guestSessionId,
      syncRequest,
    );

    this.logger.log(
      `✅ Guest cart updated: ${cart.items?.length || 0} items, ${cart.totalAmount} ${cart.currency}`,
    );
    return cart;
  }

  /**
   * SYNC GUEST CART FROM CLIENT
   *
   * Synchronizes guest cart state between client and server.
   * Handles conflicts using last-write-wins algorithm.
   * Supports offline-first client applications.
   *
   * @param syncRequest - Cart items and version from client
   * @param request - Express request with guestSessionId
   * @returns Synced cart with server state
   */
  @Post('sync')
  @ApiOperation({
    summary: 'Sync guest cart from client',
    description:
      'Synchronizes guest cart state between client and server with conflict resolution. ' +
      'Uses last-write-wins algorithm based on timestamps. ' +
      'Supports offline-first PWA applications with queued operations. ' +
      'Validates stock availability and updates prices if customer benefits.',
  })
  @ApiBody({
    type: SyncCartRequest,
    description: 'Client cart state with version and timestamp',
    examples: {
      'Sync after offline changes': {
        value: {
          items: [
            { variantId: 1, quantity: 4, priceAtAdd: 50000 },
            { variantId: 5, quantity: 2, priceAtAdd: 125000 },
          ],
          clientVersion: 2,
          clientTimestamp: '2025-11-12T12:00:00Z',
        },
      },
      'Empty cart sync': {
        value: {
          items: [],
          clientVersion: 3,
          clientTimestamp: '2025-11-12T12:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cart synced successfully',
    type: Cart,
  })
  @ApiResponse({
    status: 409,
    description: 'Version conflict detected - client needs to resolve',
    schema: {
      example: {
        message: 'Cart version conflict. Server version: 5, Client version: 3',
        error: 'Conflict',
        statusCode: 409,
        serverVersion: 5,
        clientVersion: 3,
      },
    },
  })
  async syncGuestCart(
    @Body() syncRequest: SyncCartRequest,
    @Req() request: RequestWithGuestSession,
  ): Promise<Cart> {
    this.logger.log(`🔄 Syncing guest cart from client`);

    // Extract guest session ID from middleware or cookies
    const guestSessionId =
      request.guestSessionId || request.cookies?.guest_session_id;

    if (!guestSessionId) {
      this.logger.error('❌ Guest session ID not found in request');
      throw new BadRequestException('Guest session ID required');
    }

    this.logger.log(
      `🔄 Syncing cart for session ${guestSessionId}, client version: ${syncRequest.clientVersion}`,
    );

    const cart = await this.cartSyncService.syncGuestCart(
      guestSessionId,
      syncRequest,
    );

    this.logger.log(
      `✅ Cart synced successfully: ${cart.items?.length || 0} items`,
    );
    return cart;
  }
}
