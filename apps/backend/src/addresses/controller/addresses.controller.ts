import {
  Controller,
  Post,
  Put,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AddressType } from '../dto/create-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /**
   * @route POST /addresses
   * @description Add a new address for the current user.
   */
  @Post()
  @ApiOperation({ summary: 'Add a new address (shipping/billing)' })
  async create(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user, dto);
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
   * @route DELETE /addresses/:id
   * @description Soft-delete an address for the current user.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft) an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id') id: number) {
    await this.addressesService.remove(user, Number(id));
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
