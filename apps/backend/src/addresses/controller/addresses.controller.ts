import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AddressesService } from '../service/addresses.service';
import { SyrianAddressCrudService } from '../service/syrian-address-crud.service';
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';
import { UpdateSyrianAddressDto } from '../dto/update-syrian-address.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../users/entities/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SyrianAddressService } from '../service/syrian-address.service';

/**
 * @class AddressesController
 * @description Controller for managing user addresses with Syrian administrative hierarchy.
 * All endpoints use Syrian address service for consistency with SouqSyria's Syria-only model.
 * Includes global validation pipe to enforce DTO validation rules.
 */
@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('addresses')
export class AddressesController {
  constructor(
    private readonly addressesService: AddressesService,
    private readonly syrianAddressCrudService: SyrianAddressCrudService,
    private readonly syrianAddressService: SyrianAddressService,
  ) {}

  /**
   * @route GET /addresses/governorates
   * @description Get all Syrian governorates (must be before :id routes).
   * Public endpoint - no JWT required so guest users can browse locations.
   */
  @Public()
  @Get('governorates')
  @ApiOperation({
    summary: 'Get all Syrian governorates',
    description: 'Returns all active Syrian governorates with delivery support info',
  })
  @ApiResponse({
    status: 200,
    description: 'List of Syrian governorates',
  })
  async getAllGovernorates() {
    return this.syrianAddressService.getAllGovernorates();
  }

  /**
   * @route GET /addresses/governorates/:id/cities
   * @description Get cities for a specific governorate.
   * Public endpoint - no JWT required so guest users can browse locations.
   */
  @Public()
  @Get('governorates/:id/cities')
  @ApiOperation({
    summary: 'Get cities by governorate',
    description: 'Returns all active cities within a specific Syrian governorate',
  })
  @ApiParam({ name: 'id', description: 'Governorate ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of cities in the governorate',
  })
  async getCitiesByGovernorate(@Param('id') id: number) {
    return this.syrianAddressService.getCitiesByGovernorate(Number(id));
  }

  /**
   * @route GET /addresses/cities/:id/districts
   * @description Get districts for a specific city.
   * Public endpoint - no JWT required so guest users can browse locations.
   */
  @Public()
  @Get('cities/:id/districts')
  @ApiOperation({
    summary: 'Get districts by city',
    description: 'Returns all active districts within a specific Syrian city',
  })
  @ApiParam({ name: 'id', description: 'City ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of districts in the city',
  })
  async getDistrictsByCity(@Param('id') id: number) {
    return this.syrianAddressService.getDistrictsByCity(Number(id));
  }

  /**
   * @route POST /addresses
   * @description Add a new Syrian address for the current user
   * Accepts the Syrian address DTO with governorate/city/district hierarchy
   */
  @Post()
  @ApiOperation({
    summary: 'Add a new Syrian address',
    description: 'Creates a new address with Syrian governorate/city/district hierarchy',
  })
  @ApiBody({
    type: CreateSyrianAddressDto,
    description: 'Syrian address creation data with governorate/city/district hierarchy',
    required: true,
  })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateSyrianAddressDto,
  ) {
    return this.syrianAddressCrudService.createSyrianAddress(user, dto);
  }

  /**
   * @route PUT /addresses/:id
   * @description Update a Syrian address (full update) for the current user.
   * Redirects to Syrian address service for consistency.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a Syrian address (full update)',
    description: 'Updates a Syrian address with full validation of Syrian hierarchy',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'number' })
  @ApiBody({
    type: UpdateSyrianAddressDto,
    description: 'Syrian address update data',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateSyrianAddressDto,
  ) {
    return this.syrianAddressCrudService.updateSyrianAddress(user, Number(id), dto);
  }

  /**
   * @route PATCH /addresses/:id/default
   * @description Set an address as default (MUST be before PATCH :id to avoid route collision)
   */
  @Patch(':id/default')
  @ApiOperation({
    summary: 'Set address as default',
    description: 'Sets the specified address as the default for the user',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Address set as default successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  async setDefaultAddress(@CurrentUser() user: User, @Param('id') id: number) {
    return this.syrianAddressCrudService.setDefaultSyrianAddress(user, Number(id));
  }

  /**
   * @route PATCH /addresses/:id
   * @description Update a Syrian address (partial update)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a Syrian address',
    description: 'Partial update of a Syrian address with validation',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'number' })
  @ApiBody({
    type: UpdateSyrianAddressDto,
    description: 'Partial Syrian address update data',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async updateSyrianAddress(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateSyrianAddressDto,
  ) {
    return this.syrianAddressCrudService.updateSyrianAddress(user, Number(id), dto);
  }

  /**
   * @route DELETE /addresses/:id
   * @description Soft-delete an address with business rule checks
   * Blocks deletion of default address or only remaining address
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete (soft) an address',
    description: 'Cannot delete default address or only remaining address',
  })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 204, description: 'Address deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete default or only address' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id') id: number) {
    await this.syrianAddressCrudService.deleteSyrianAddress(user, Number(id));
    return;
  }

  /**
   * @route GET /addresses
   * @description List all Syrian addresses for the current user.
   * Uses Syrian address service for consistency with SouqSyria's Syria-only model.
   */
  @Get()
  @ApiOperation({
    summary: 'List all Syrian addresses for user',
    description: 'Returns all Syrian addresses with governorate, city, and district relations',
  })
  @ApiResponse({
    status: 200,
    description: 'List of Syrian addresses sorted by default status and creation date',
  })
  async findAll(@CurrentUser() user: User) {
    return this.syrianAddressCrudService.findAllSyrianAddresses(user);
  }

  /**
   * @route GET /addresses/:id
   * @description Get one Syrian address by ID for the current user.
   * Uses Syrian address service for consistency.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a Syrian address by ID',
    description: 'Returns a single Syrian address with governorate, city, and district relations',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Syrian address details',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  async findOne(@CurrentUser() user: User, @Param('id') id: number) {
    return this.syrianAddressCrudService.findOneSyrianAddress(user, Number(id));
  }
}
