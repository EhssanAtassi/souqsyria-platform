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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AddressesService } from '../service/addresses.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { SetDefaultAddressDto } from '../dto/set-default-address.dto';
import { CreateSyrianAddressDto } from '../dto/create-syrian-address.dto';
import { UpdateSyrianAddressDto } from '../dto/update-syrian-address.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AddressType } from '../dto/create-address.dto';
import { SyrianAddressService } from '../service/syrian-address.service';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(
    private readonly addressesService: AddressesService,
    private readonly syrianAddressService: SyrianAddressService,
  ) {}

  /**
   * @route GET /addresses/governorates
   * @description Get all Syrian governorates (must be before :id routes)
   */
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
   * @description Get cities for a specific governorate
   */
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
   * @description Get districts for a specific city
   */
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
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateSyrianAddressDto,
  ) {
    return this.addressesService.createSyrianAddress(user, dto);
  }

  /**
   * @route PUT /addresses/:id
   * @description Update an existing address for the current user.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user, Number(id), dto);
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
    return this.addressesService.setDefaultSyrianAddress(user, Number(id));
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
    return this.addressesService.updateSyrianAddress(user, Number(id), dto);
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
    await this.addressesService.deleteSyrianAddress(user, Number(id));
    return;
  }

  /**
   * @route GET /addresses
   * @description List all addresses for the current user (optionally filter by type).
   */
  @Get()
  @ApiOperation({ summary: 'List all addresses for user' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: AddressType,
    description: 'shipping or billing',
  })
  async findAll(@CurrentUser() user: User, @Query('type') type?: AddressType) {
    return this.addressesService.findAll(user, type);
  }

  /**
   * @route POST /addresses/:id/set-default
   * @description Set an address as default (per type, for the user).
   */
  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set default address for user/type' })
  async setDefault(
    @CurrentUser() user: User,
    @Param('id') addressId: number,
    @Body() dto: SetDefaultAddressDto,
  ) {
    return this.addressesService.setAsDefault(addressId, dto);
  }

  /**
   * @route GET /addresses/:id
   * @description Get one address (by ID, for current user).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an address by ID' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: number) {
    return this.addressesService.findOne(user, Number(id));
  }
}
