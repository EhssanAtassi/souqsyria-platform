/**
 * @file attributes.controller.ts
 * @description Production-ready REST API controller for managing product attributes in SouqSyria
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  HttpStatus,
  Logger,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AttributesService } from './attributes.service';
import { AttributeValuesService } from './services/attribute-values.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateAttributeDto,
  UpdateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
  AttributeQueryDto,
  AttributeResponseDto,
  AttributeValueResponseDto,
  PaginatedAttributesResponseDto,
} from './dto/index-dto';
import { User } from '../users/entities/user.entity';

@ApiTags('Product Attributes')
@Controller('attributes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttributesController {
  private readonly logger = new Logger(AttributesController.name);

  constructor(
    private readonly attributesService: AttributesService,
    private readonly attributeValuesService: AttributeValuesService,
  ) {
    this.logger.log(
      'AttributesController initialized - Ready for attribute management operations',
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List all product attributes with filters and pagination',
    description:
      'Retrieve attributes with advanced filtering, search, pagination, and localization support.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attributes retrieved successfully with pagination metadata',
    type: PaginatedAttributesResponseDto,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for attribute names',
    example: 'color',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by attribute type',
    example: 'select',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'isFilterable',
    required: false,
    type: Boolean,
    description: 'Show only filterable attributes',
    example: true,
  })
  @ApiQuery({
    name: 'includeValues',
    required: false,
    type: Boolean,
    description: 'Include attribute values',
    example: false,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Response language',
    example: 'en',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async findAllAttributes(
    @Query(new ValidationPipe({ transform: true })) query: AttributeQueryDto,
  ): Promise<PaginatedAttributesResponseDto> {
    const startTime = Date.now();
    const {
      search,
      type,
      isActive,
      language = 'en',
      page = 1,
      limit = 20,
    } = query;

    this.logger.log(
      `🔍 GET /attributes - Filters: search="${search || 'none'}", type="${type || 'all'}", active=${isActive}, lang=${language}, page=${page}, limit=${limit}`,
    );

    try {
      const result = await this.attributesService.findAllAttributes(query);
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Attributes query completed: ${result.count}/${result.total} items returned in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to fetch attributes after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get attribute by ID with optional values',
    description: 'Retrieve detailed information about a specific attribute.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique attribute identifier',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'includeValues',
    required: false,
    type: Boolean,
    description: 'Include attribute values',
    example: true,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Response language',
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute retrieved successfully',
    type: AttributeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  async findAttributeById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeValues') includeValues: boolean = false,
    @Query('language') language: 'en' | 'ar' = 'en',
  ): Promise<AttributeResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `🔍 GET /attributes/${id} - includeValues=${includeValues}, language=${language}`,
    );

    try {
      const result = await this.attributesService.findAttributeById(
        id,
        language,
        includeValues,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Attribute ${id} retrieved successfully in ${executionTime}ms - values included: ${!!result.values}`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to fetch attribute ${id} after ${executionTime}ms: ${error.message}`,
      );
      throw error;
    }
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Create new product attribute',
    description:
      'Create a new attribute with bilingual support and optional initial values.',
  })
  @ApiBody({
    type: CreateAttributeDto,
    description:
      'Attribute data with English/Arabic names and optional initial values',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attribute created successfully',
    type: AttributeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiConflictResponse({ description: 'Attribute name already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createAttribute(
    @Body() createAttributeDto: CreateAttributeDto,
    @CurrentUser() adminUser: User,
  ): Promise<AttributeResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `🔨 POST /attributes - Admin ${adminUser.id} (${adminUser.email}) creating attribute: "${createAttributeDto.nameEn}" (${createAttributeDto.nameAr})`,
    );

    try {
      const result = await this.attributesService.createAttribute(
        createAttributeDto,
        adminUser.id,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Attribute created successfully: ID=${result.id}, Name="${result.nameEn}", Values=${result.valuesCount || 0}, Time=${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to create attribute "${createAttributeDto.nameEn}" after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update existing attribute',
    description: 'Modify attribute properties with business rule validation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID to update',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateAttributeDto,
    description: 'Partial attribute data for update',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute updated successfully',
    type: AttributeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or business rule violation',
  })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  @ApiConflictResponse({
    description: 'Name conflict or display order conflict',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttributeDto: UpdateAttributeDto,
    @CurrentUser() adminUser: User,
  ): Promise<AttributeResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `🔧 PUT /attributes/${id} - Admin ${adminUser.id} updating with: ${JSON.stringify(updateAttributeDto)}`,
    );

    try {
      const result = await this.attributesService.updateAttribute(
        id,
        updateAttributeDto,
        adminUser.id,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Attribute ${id} updated successfully: "${result.nameEn}" in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to update attribute ${id} after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete attribute (soft delete)',
    description: 'Safely remove attribute with cascade to values.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Attribute "Color" deleted successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete attribute used in products',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async deleteAttribute(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() adminUser: User,
  ): Promise<{ success: boolean; message: string }> {
    const startTime = Date.now();

    this.logger.warn(
      `🗑️ DELETE /attributes/${id} - Admin ${adminUser.id} (${adminUser.email}) attempting deletion`,
    );

    try {
      const result = await this.attributesService.deleteAttribute(
        id,
        adminUser.id,
      );
      const executionTime = Date.now() - startTime;
      this.logger.warn(
        `✅ Attribute ${id} soft deleted successfully in ${executionTime}ms: ${result.message}`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to delete attribute ${id} after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':id/values')
  @ApiOperation({
    summary: 'Get all values for a specific attribute',
    description: 'Retrieve attribute values with localization and sorting.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID to get values for',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Response language',
    example: 'en',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive values',
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute values retrieved successfully',
    type: [AttributeValueResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  async findAttributeValues(
    @Param('id', ParseIntPipe) attributeId: number,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('includeInactive') includeInactive: boolean = false,
  ): Promise<AttributeValueResponseDto[]> {
    const startTime = Date.now();

    this.logger.log(
      `🔍 GET /attributes/${attributeId}/values - language=${language}, includeInactive=${includeInactive}`,
    );

    try {
      const result = await this.attributeValuesService.findAttributeValues(
        attributeId,
        language,
        includeInactive,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Found ${result.length} values for attribute ${attributeId} in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to fetch values for attribute ${attributeId} after ${executionTime}ms: ${error.message}`,
      );
      throw error;
    }
  }

  @Post(':id/values')
  @Roles('admin')
  @ApiOperation({
    summary: 'Add new value to attribute',
    description: 'Create a new value option for an existing attribute.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID to add value to',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: CreateAttributeValueDto,
    description: 'Value data with English/Arabic names',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attribute value created successfully',
    type: AttributeValueResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiNotFoundResponse({ description: 'Parent attribute not found' })
  @ApiConflictResponse({
    description: 'Value name already exists in attribute',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createAttributeValue(
    @Param('id', ParseIntPipe) attributeId: number,
    @Body() createValueDto: CreateAttributeValueDto,
    @CurrentUser() adminUser: User,
  ): Promise<AttributeValueResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `🔨 POST /attributes/${attributeId}/values - Admin ${adminUser.id} adding value: "${createValueDto.valueEn}" (${createValueDto.valueAr})`,
    );

    try {
      const result = await this.attributeValuesService.createAttributeValue(
        attributeId,
        createValueDto,
        adminUser.id,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Value created for attribute ${attributeId}: ID=${result.id}, Value="${result.valueEn}" in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to create value for attribute ${attributeId} after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Put(':id/values/:valueId')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update attribute value',
    description: 'Modify existing attribute value with validation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'valueId',
    description: 'Value ID to update',
    type: Number,
    example: 5,
  })
  @ApiBody({
    type: UpdateAttributeValueDto,
    description: 'Partial value data for update',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute value updated successfully',
    type: AttributeValueResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Attribute or value not found' })
  @ApiConflictResponse({ description: 'Value name conflict' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateAttributeValue(
    @Param('id', ParseIntPipe) attributeId: number,
    @Param('valueId', ParseIntPipe) valueId: number,
    @Body() updateValueDto: UpdateAttributeValueDto,
    @CurrentUser() adminUser: User,
  ): Promise<AttributeValueResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `🔧 PUT /attributes/${attributeId}/values/${valueId} - Admin ${adminUser.id} updating value with: ${JSON.stringify(updateValueDto)}`,
    );

    try {
      const result = await this.attributeValuesService.updateAttributeValue(
        valueId,
        updateValueDto,
        adminUser.id,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Value ${valueId} updated successfully: "${result.valueEn}" in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to update value ${valueId} after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete(':id/values/:valueId')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete attribute value (soft delete)',
    description: 'Safely remove attribute value.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'valueId',
    description: 'Value ID to delete',
    type: Number,
    example: 5,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute value deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Attribute value "Red" deleted successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Attribute or value not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete value used in products or last active value',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async deleteAttributeValue(
    @Param('id', ParseIntPipe) attributeId: number,
    @Param('valueId', ParseIntPipe) valueId: number,
    @CurrentUser() adminUser: User,
  ): Promise<{ success: boolean; message: string }> {
    const startTime = Date.now();

    this.logger.warn(
      `🗑️ DELETE /attributes/${attributeId}/values/${valueId} - Admin ${adminUser.id} (${adminUser.email}) attempting deletion`,
    );

    try {
      const result = await this.attributeValuesService.deleteAttributeValue(
        valueId,
        adminUser.id,
      );
      const executionTime = Date.now() - startTime;
      this.logger.warn(
        `✅ Value ${valueId} soft deleted successfully in ${executionTime}ms: ${result.message}`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to delete value ${valueId} after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post(':id/values/bulk')
  @Roles('admin')
  @ApiOperation({
    summary: 'Bulk create multiple attribute values',
    description: 'Efficiently create multiple values at once.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID to add values to',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateAttributeValueDto' },
          description: 'Array of value data objects',
        },
      },
      required: ['values'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attribute values created successfully',
    type: [AttributeValueResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiNotFoundResponse({ description: 'Parent attribute not found' })
  @ApiConflictResponse({
    description: 'Duplicate values in batch or existing conflicts',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkCreateAttributeValues(
    @Param('id', ParseIntPipe) attributeId: number,
    @Body() body: { values: CreateAttributeValueDto[] },
    @CurrentUser() adminUser: User,
  ): Promise<AttributeValueResponseDto[]> {
    const startTime = Date.now();
    const { values } = body;

    this.logger.log(
      `🔨 POST /attributes/${attributeId}/values/bulk - Admin ${adminUser.id} creating ${values.length} values`,
    );

    try {
      const result =
        await this.attributeValuesService.bulkCreateAttributeValues(
          attributeId,
          values,
          adminUser.id,
        );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Bulk created ${result.length} values for attribute ${attributeId} in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to bulk create values for attribute ${attributeId} after ${executionTime}ms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':id/values/:valueId')
  @ApiOperation({
    summary: 'Get specific attribute value by ID',
    description:
      'Retrieve detailed information about a single attribute value.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attribute ID',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'valueId',
    description: 'Value ID to retrieve',
    type: Number,
    example: 5,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Response language',
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attribute value retrieved successfully',
    type: AttributeValueResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Attribute or value not found' })
  async findAttributeValueById(
    @Param('id', ParseIntPipe) attributeId: number,
    @Param('valueId', ParseIntPipe) valueId: number,
    @Query('language') language: 'en' | 'ar' = 'en',
  ): Promise<AttributeValueResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `🔍 GET /attributes/${attributeId}/values/${valueId} - language=${language}`,
    );

    try {
      const result = await this.attributeValuesService.findAttributeValueById(
        valueId,
        language,
      );
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Value ${valueId} retrieved successfully: "${result.valueEn}" in ${executionTime}ms`,
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to fetch value ${valueId} after ${executionTime}ms: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('_health')
  @ApiOperation({
    summary: 'Controller health check',
    description: 'Verify controller health and service availability.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Controller health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2025-01-15T14:30:00Z' },
        version: { type: 'string', example: '1.0.0' },
        uptime: { type: 'number', example: 3600 },
        endpoints: { type: 'number', example: 10 },
        services: {
          type: 'object',
          properties: {
            attributesService: { type: 'boolean', example: true },
            attributeValuesService: { type: 'boolean', example: true },
            database: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
    endpoints: number;
    services: {
      attributesService: boolean;
      attributeValuesService: boolean;
      database: boolean;
    };
  }> {
    const startTime = Date.now();

    this.logger.log('🔍 Health check requested');

    try {
      const servicesHealthy = {
        attributesService: !!this.attributesService,
        attributeValuesService: !!this.attributeValuesService,
        database: true,
      };

      const result = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        endpoints: 10,
        services: servicesHealthy,
      };

      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Health check completed in ${executionTime}ms - Status: ${result.status}`,
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Health check failed after ${executionTime}ms: ${error.message}`,
      );

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        endpoints: 10,
        services: {
          attributesService: false,
          attributeValuesService: false,
          database: false,
        },
      };
    }
  }
}
