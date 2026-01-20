/**
 * @file features.controller.ts
 * @description Controller for managing product features and feature-product relationships
 *
 * ENDPOINTS:
 * - POST /features - Create new feature definition
 * - GET /features - Get all features with filtering
 * - GET /features/:id - Get specific feature
 * - PUT /features/:id - Update feature
 * - DELETE /features/:id - Delete feature
 * - POST /features/assign - Assign feature to product
 * - POST /features/bulk-assign - Bulk assign features to product
 * - GET /features/product/:productId - Get product features
 * - DELETE /features/product/:productId/feature/:featureId - Remove feature from product
 * - GET /features/usage-stats - Feature usage analytics
 * - POST /features/search-products - Search products by features
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 1.0.0
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FeaturesService } from '../services/features.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

/**
 * Request/Response DTOs for API documentation
 */
class CreateFeatureDto {
  /**
   * Feature name (e.g., "Waterproof", "5G Support")
   */
  name: string;

  /**
   * Feature type - boolean for yes/no values, text for descriptive values
   */
  type: 'boolean' | 'text';
}

class UpdateFeatureDto {
  /**
   * Feature name
   */
  name?: string;

  /**
   * Feature type
   */
  type?: 'boolean' | 'text';
}

class AssignFeatureToProductDto {
  /**
   * Product ID to assign feature to
   */
  productId: number;

  /**
   * Feature ID to assign
   */
  featureId: number;

  /**
   * Feature value (e.g., "Yes", "No", "Snapdragon 8 Gen 2")
   */
  value: string;
}

class BulkAssignFeaturesDto {
  /**
   * Product ID to assign features to
   */
  productId: number;

  /**
   * Array of features to assign
   */
  features: Array<{
    featureId: number;
    value: string;
  }>;
}

class SearchProductsByFeaturesDto {
  /**
   * Feature search criteria
   */
  criteria: Array<{
    featureId: number;
    value: string;
  }>;
}

@ApiTags('🏷️ Product Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('features')
export class FeaturesController {
  private readonly logger = new Logger(FeaturesController.name);

  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * CREATE NEW FEATURE DEFINITION
   *
   * Creates a new feature that can be assigned to products
   * Features can be boolean (Yes/No) or text-based (descriptive values)
   */
  @Post()
  @ApiOperation({
    summary: 'Create new feature definition',
    description:
      'Creates a new feature that can be assigned to products. Features can be boolean (Yes/No) or text-based (descriptive values)',
  })
  @ApiBody({
    type: CreateFeatureDto,
    description: 'Feature creation data',
    examples: {
      booleanFeature: {
        summary: 'Boolean Feature (Yes/No)',
        value: {
          name: 'Waterproof',
          type: 'boolean',
        },
      },
      textFeature: {
        summary: 'Text Feature (Descriptive)',
        value: {
          name: 'Processor',
          type: 'text',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Feature created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Waterproof',
        type: 'boolean',
        createdAt: '2025-08-09T10:30:00.000Z',
        updatedAt: '2025-08-09T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid feature data',
    schema: {
      example: {
        message: 'Feature type must be either "boolean" or "text"',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Feature with same name already exists',
    schema: {
      example: {
        message: "Feature with name 'Waterproof' already exists",
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async createFeature(
    @CurrentUser() user: UserFromToken,
    @Body() createFeatureDto: CreateFeatureDto,
  ) {
    this.logger.log(
      `User ${user.id} creating new feature: ${createFeatureDto.name}`,
    );
    return this.featuresService.createFeature(createFeatureDto);
  }

  /**
   * GET ALL FEATURES WITH FILTERING
   *
   * Retrieves all feature definitions with optional filtering by name and type
   */
  @Get()
  @ApiOperation({
    summary: 'Get all feature definitions',
    description:
      'Retrieves all feature definitions with optional filtering by name and type',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter features by name (partial match)',
    example: 'water',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['boolean', 'text'],
    description: 'Filter features by type',
    example: 'boolean',
  })
  @ApiOkResponse({
    description: 'Features retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'Waterproof',
          type: 'boolean',
          createdAt: '2025-08-09T10:30:00.000Z',
          updatedAt: '2025-08-09T10:30:00.000Z',
        },
        {
          id: 2,
          name: 'Processor',
          type: 'text',
          createdAt: '2025-08-09T10:35:00.000Z',
          updatedAt: '2025-08-09T10:35:00.000Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getAllFeatures(
    @CurrentUser() user: UserFromToken,
    @Query('name') name?: string,
    @Query('type') type?: 'boolean' | 'text',
  ) {
    this.logger.log(
      `User ${user.id} retrieving features with filters: name=${name}, type=${type}`,
    );

    const filters = {};
    if (name) filters['name'] = name;
    if (type) filters['type'] = type;

    return this.featuresService.getAllFeatures(filters);
  }

  /**
   * GET SPECIFIC FEATURE BY ID
   *
   * Retrieves detailed information about a specific feature
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get feature by ID',
    description: 'Retrieves detailed information about a specific feature',
  })
  @ApiParam({
    name: 'id',
    description: 'Feature ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Feature retrieved successfully',
    schema: {
      example: {
        id: 1,
        name: 'Waterproof',
        type: 'boolean',
        createdAt: '2025-08-09T10:30:00.000Z',
        updatedAt: '2025-08-09T10:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Feature not found',
    schema: {
      example: {
        message: 'Feature with ID 999 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getFeatureById(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`User ${user.id} retrieving feature with ID: ${id}`);
    return this.featuresService.getFeatureById(id);
  }

  /**
   * UPDATE FEATURE DEFINITION
   *
   * Updates an existing feature definition
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update feature definition',
    description: 'Updates an existing feature definition',
  })
  @ApiParam({
    name: 'id',
    description: 'Feature ID to update',
    example: 1,
  })
  @ApiBody({
    type: UpdateFeatureDto,
    description: 'Feature update data',
    examples: {
      updateName: {
        summary: 'Update Feature Name',
        value: {
          name: 'Water Resistant',
        },
      },
      updateType: {
        summary: 'Update Feature Type',
        value: {
          type: 'text',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Feature updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Water Resistant',
        type: 'boolean',
        createdAt: '2025-08-09T10:30:00.000Z',
        updatedAt: '2025-08-09T11:15:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Feature not found',
  })
  @ApiConflictResponse({
    description: 'Feature name conflict',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async updateFeature(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ) {
    this.logger.log(`User ${user.id} updating feature ${id}`);
    return this.featuresService.updateFeature(id, updateFeatureDto);
  }

  /**
   * DELETE FEATURE DEFINITION
   *
   * Deletes a feature definition and all associated product-feature assignments
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete feature definition',
    description:
      'Deletes a feature definition and all associated product-feature assignments',
  })
  @ApiParam({
    name: 'id',
    description: 'Feature ID to delete',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Feature deleted successfully',
    schema: {
      example: {
        message: "Feature 'Waterproof' deleted successfully",
        deletedFeature: {
          id: 1,
          name: 'Waterproof',
          type: 'boolean',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Feature not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async deleteFeature(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`User ${user.id} deleting feature ${id}`);
    return this.featuresService.deleteFeature(id);
  }

  /**
   * ASSIGN FEATURE TO PRODUCT
   *
   * Assigns a feature to a product with a specific value
   */
  @Post('assign')
  @ApiOperation({
    summary: 'Assign feature to product',
    description:
      'Assigns a feature to a product with a specific value. Updates existing assignment if it exists.',
  })
  @ApiBody({
    type: AssignFeatureToProductDto,
    description: 'Feature assignment data',
    examples: {
      booleanAssignment: {
        summary: 'Boolean Feature Assignment',
        value: {
          productId: 1001,
          featureId: 1,
          value: 'Yes',
        },
      },
      textAssignment: {
        summary: 'Text Feature Assignment',
        value: {
          productId: 1001,
          featureId: 2,
          value: 'Snapdragon 8 Gen 2',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Feature assigned to product successfully',
    schema: {
      example: {
        id: 101,
        product: { id: 1001 },
        feature: { id: 1 },
        value: 'Yes',
        createdAt: '2025-08-09T11:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid assignment data or boolean value format',
  })
  @ApiNotFoundResponse({
    description: 'Product or feature not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async assignFeatureToProduct(
    @CurrentUser() user: UserFromToken,
    @Body() assignDto: AssignFeatureToProductDto,
  ) {
    this.logger.log(
      `User ${user.id} assigning feature ${assignDto.featureId} to product ${assignDto.productId}`,
    );
    return this.featuresService.assignFeatureToProduct(assignDto);
  }

  /**
   * BULK ASSIGN FEATURES TO PRODUCT
   *
   * Assigns multiple features to a product in a single operation
   */
  @Post('bulk-assign')
  @ApiOperation({
    summary: 'Bulk assign features to product',
    description:
      'Assigns multiple features to a product in a single operation. Replaces all existing feature assignments for the product.',
  })
  @ApiBody({
    type: BulkAssignFeaturesDto,
    description: 'Bulk feature assignment data',
    examples: {
      bulkAssignment: {
        summary: 'Multiple Feature Assignment',
        value: {
          productId: 1001,
          features: [
            { featureId: 1, value: 'Yes' },
            { featureId: 2, value: 'Snapdragon 8 Gen 2' },
            { featureId: 3, value: 'No' },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Features assigned to product successfully',
    schema: {
      example: [
        {
          id: 101,
          product: { id: 1001 },
          feature: { id: 1 },
          value: 'Yes',
          createdAt: '2025-08-09T11:30:00.000Z',
        },
        {
          id: 102,
          product: { id: 1001 },
          feature: { id: 2 },
          value: 'Snapdragon 8 Gen 2',
          createdAt: '2025-08-09T11:30:00.000Z',
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid feature IDs or assignment data',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async bulkAssignFeaturesToProduct(
    @CurrentUser() user: UserFromToken,
    @Body() bulkDto: BulkAssignFeaturesDto,
  ) {
    this.logger.log(
      `User ${user.id} bulk assigning ${bulkDto.features.length} features to product ${bulkDto.productId}`,
    );
    return this.featuresService.bulkAssignFeaturesToProduct(bulkDto);
  }

  /**
   * GET PRODUCT FEATURES
   *
   * Retrieves all features assigned to a specific product
   */
  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get product features',
    description:
      'Retrieves all features assigned to a specific product with their values',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to get features for',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'Product features retrieved successfully',
    schema: {
      example: [
        {
          id: 101,
          value: 'Yes',
          createdAt: '2025-08-09T11:30:00.000Z',
          feature: {
            id: 1,
            name: 'Waterproof',
            type: 'boolean',
          },
        },
        {
          id: 102,
          value: 'Snapdragon 8 Gen 2',
          createdAt: '2025-08-09T11:30:00.000Z',
          feature: {
            id: 2,
            name: 'Processor',
            type: 'text',
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getProductFeatures(
    @CurrentUser() user: UserFromToken,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    this.logger.log(
      `User ${user.id} retrieving features for product ${productId}`,
    );
    return this.featuresService.getProductFeatures(productId);
  }

  /**
   * REMOVE FEATURE FROM PRODUCT
   *
   * Removes a specific feature assignment from a product
   */
  @Delete('product/:productId/feature/:featureId')
  @ApiOperation({
    summary: 'Remove feature from product',
    description: 'Removes a specific feature assignment from a product',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID',
    example: 1001,
  })
  @ApiParam({
    name: 'featureId',
    description: 'Feature ID to remove',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Feature removed from product successfully',
    schema: {
      example: {
        message: 'Feature removed from product successfully',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Feature assignment not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async removeFeatureFromProduct(
    @CurrentUser() user: UserFromToken,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('featureId', ParseIntPipe) featureId: number,
  ) {
    this.logger.log(
      `User ${user.id} removing feature ${featureId} from product ${productId}`,
    );
    return this.featuresService.removeFeatureFromProduct(productId, featureId);
  }

  /**
   * GET FEATURE USAGE STATISTICS
   *
   * Provides analytics on feature usage across all products
   */
  @Get('analytics/usage-stats')
  @ApiOperation({
    summary: 'Get feature usage statistics',
    description:
      'Provides analytics on feature usage across all products including most common values',
  })
  @ApiOkResponse({
    description: 'Feature usage statistics retrieved successfully',
    schema: {
      example: [
        {
          featureId: 1,
          featureName: 'Waterproof',
          productCount: 45,
          commonValues: [
            { value: 'Yes', count: 30 },
            { value: 'No', count: 15 },
          ],
        },
        {
          featureId: 2,
          featureName: 'Processor',
          productCount: 38,
          commonValues: [
            { value: 'Snapdragon 8 Gen 2', count: 12 },
            { value: 'Apple A17 Pro', count: 8 },
            { value: 'MediaTek Dimensity 9000', count: 6 },
          ],
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getFeatureUsageStats(@CurrentUser() user: UserFromToken) {
    this.logger.log(`User ${user.id} requesting feature usage statistics`);
    return this.featuresService.getFeatureUsageStats();
  }

  /**
   * SEARCH PRODUCTS BY FEATURES
   *
   * Searches for products that match specific feature criteria
   */
  @Post('search-products')
  @ApiOperation({
    summary: 'Search products by features',
    description:
      'Searches for products that match specific feature criteria. All criteria must be met (AND logic).',
  })
  @ApiBody({
    type: SearchProductsByFeaturesDto,
    description: 'Feature search criteria',
    examples: {
      searchCriteria: {
        summary: 'Search by Multiple Features',
        value: {
          criteria: [
            { featureId: 1, value: 'Yes' },
            { featureId: 2, value: 'Snapdragon 8 Gen 2' },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Products matching feature criteria retrieved successfully',
    schema: {
      example: [
        {
          id: 1001,
          nameEn: 'Samsung Galaxy S24 Ultra',
          nameAr: 'سامسونج غالاكسي إس 24 ألترا',
          // ... other product fields
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async searchProductsByFeatures(
    @CurrentUser() user: UserFromToken,
    @Body() searchDto: SearchProductsByFeaturesDto,
  ) {
    this.logger.log(
      `User ${user.id} searching products by ${searchDto.criteria.length} feature criteria`,
    );
    return this.featuresService.searchProductsByFeatures(searchDto.criteria);
  }
}
