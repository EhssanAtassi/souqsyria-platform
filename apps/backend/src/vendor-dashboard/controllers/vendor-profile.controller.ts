/**
 * @file vendor-profile.controller.ts
 * @description Controller for vendor profile management endpoints
 * Handles profile retrieval and updates (GET and PUT)
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VendorProfileService } from '../services/vendor-profile.service';
import {
  VendorProfileDto,
  UpdateVendorProfileDto,
} from '../dto/vendor-profile.dto';

/**
 * Vendor Profile Controller
 *
 * Handles profile management endpoints:
 * - GET /api/vendor-dashboard/profile
 * - PUT /api/vendor-dashboard/profile
 *
 * Manages vendor business information, contact details, and settings
 */
@ApiTags('Vendor Dashboard')
@Controller('vendor-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorProfileController {
  constructor(
    private readonly profileService: VendorProfileService,
  ) {}

  /**
   * Get vendor profile information
   *
   * Returns complete vendor profile including:
   * - Store name (English/Arabic)
   * - Business description and category
   * - Contact information (email, phone)
   * - Physical address with coordinates
   * - Social media links
   * - Business hours
   * - Shipping and return policies
   *
   * @param vendorId - Vendor identifier (optional)
   * @returns Complete vendor profile
   *
   * @example
   * GET /api/vendor-dashboard/profile
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get vendor profile',
    description: `Retrieve complete vendor profile information.

    **Profile Data Includes:**
    - **Business Information**
      - Store name in English and Arabic
      - Business description and category
      - Establishment year and registration number

    - **Contact Details**
      - Primary email address
      - Contact phone number
      - Physical store address
      - Geographic coordinates for mapping

    - **Branding Assets**
      - Store logo URL
      - Banner/cover image URL

    - **Social Media**
      - Facebook page link
      - Instagram profile link
      - WhatsApp business number
      - Twitter/X profile link

    - **Business Operations**
      - Operating hours for each day of the week
      - Return policy and duration
      - Minimum order requirements
      - Free shipping threshold
      - Average shipping time

    **Use Cases:**
    - Display vendor profile page
    - Pre-fill profile edit forms
    - Show store information to customers
    - Verify business details`,
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Vendor identifier (optional, defaults to authenticated vendor)',
    example: 'vnd_abc123xyz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    type: VendorProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor profile not found',
  })
  async getProfile(
    @Query('vendorId') vendorId?: string,
  ): Promise<VendorProfileDto> {
    // TODO (Week 1 Day 5): Extract vendorId from JWT token if not provided
    const resolvedVendorId = vendorId || 'vnd_default_mock';

    return this.profileService.getProfile(resolvedVendorId);
  }

  /**
   * Update vendor profile information
   *
   * Allows partial updates to vendor profile.
   * Only provided fields will be updated.
   *
   * @param updateData - Partial vendor profile data to update
   * @param vendorId - Vendor identifier (optional)
   * @returns Updated vendor profile
   *
   * @example
   * PUT /api/vendor-dashboard/profile
   * {
   *   "storeNameEn": "Updated Store Name",
   *   "phone": "+963991234567",
   *   "socialMedia": {
   *     "instagram": "https://instagram.com/new_handle"
   *   }
   * }
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Update vendor profile',
    description: `Update vendor profile information (partial updates supported).

    **Updatable Fields:**
    - Store name (English/Arabic)
    - Business description (English/Arabic)
    - Contact email and phone
    - Business category
    - Social media links (Facebook, Instagram, WhatsApp, Twitter)
    - Business operating hours
    - Return policy settings
    - Shipping thresholds and timeframes

    **Validation Rules:**
    - Store names: 3-100 characters
    - Descriptions: 10-500 characters
    - Email: Valid email format
    - Phone: Valid Syrian phone number format (+963...)
    - Social media URLs: Valid URL format
    - Business hours: HH:MM 24-hour format

    **Notes:**
    - Only provided fields are updated (partial updates)
    - Validation applies to all provided fields
    - Changes are logged in audit trail
    - Some fields may require admin approval (e.g., business category change)

    **Example Use Cases:**
    - Update contact information
    - Change business hours
    - Add/update social media links
    - Modify shipping policies
    - Update store description`,
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Vendor identifier (optional, defaults to authenticated vendor)',
    example: 'vnd_abc123xyz',
  })
  @ApiBody({
    type: UpdateVendorProfileDto,
    description: 'Partial vendor profile data to update',
    examples: {
      basicUpdate: {
        summary: 'Update basic information',
        value: {
          storeNameEn: 'Damascus Premium Crafts',
          phone: '+963991234567',
          email: 'info@damascus-crafts.sy',
        },
      },
      socialMediaUpdate: {
        summary: 'Update social media links',
        value: {
          socialMedia: {
            instagram: 'https://instagram.com/damascus_premium',
            facebook: 'https://facebook.com/damascus-premium',
          },
        },
      },
      businessHoursUpdate: {
        summary: 'Update business hours',
        value: {
          businessHours: [
            { day: 'Sunday', openTime: '09:00', closeTime: '18:00', isClosed: false },
            { day: 'Friday', openTime: '00:00', closeTime: '00:00', isClosed: true },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: VendorProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed - Invalid field values',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Cannot update another vendor\'s profile',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor profile not found',
  })
  async updateProfile(
    @Body() updateData: UpdateVendorProfileDto,
    @Query('vendorId') vendorId?: string,
  ): Promise<VendorProfileDto> {
    // TODO (Week 1 Day 5): Extract vendorId from JWT token if not provided
    // TODO (Week 1 Day 5): Validate user owns this vendor account
    const resolvedVendorId = vendorId || 'vnd_default_mock';

    return this.profileService.updateProfile(resolvedVendorId, updateData);
  }
}
