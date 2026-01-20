/**
 * @file orders.controller.ts
 * @description Orders Management Controller for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Order placement and checkout processing
 * - Order tracking and status management
 * - Order history for customers
 * - Returns and refunds processing
 * - Multi-vendor order management
 * - Admin order oversight
 *
 * ENDPOINTS:
 * - POST /orders - Place new order
 * - GET /orders/my - Get user order history
 * - GET /orders/:id - Get specific order details
 * - POST /orders/return - Request order return
 * - PUT /orders/status - Update order status (admin/vendor)
 * - POST /orders/refund - Process refund (admin)
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { OrdersService } from '../service/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { RequestReturnDto } from '../dto/request-return.dto';
import { FilterOrdersDto } from '../dto/filter-orders.dto';
import { RefundRequestDto } from '../../refund/dto/refund-request.dto';

import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

@ApiTags('🛒 Orders Management')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  /**
   * PLACE NEW ORDER
   *
   * Creates a new order from product variants with stock validation
   * Automatically creates shipment and initializes order tracking
   */
  @Post()
  @ApiOperation({
    summary: 'Place new order',
    description:
      'Creates a new order with stock validation, payment method selection, and automatic shipment creation',
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Order details including items, payment method, and addresses',
    examples: {
      singleProductOrder: {
        summary: 'Order with single product',
        value: {
          items: [
            {
              variant_id: 456,
              quantity: 2,
              price: 2750000,
            },
          ],
          payment_method: 'cod',
          buyer_note: 'Please handle with care',
          gift_message: null,
          shipping_address: {
            name: 'أحمد محمد السوري',
            phone: '+963987654321',
            address_line1: 'شارع الثورة، حي المزة',
            address_line2: 'بناء رقم 15، الطابق الثالث',
            city: 'Damascus',
            region: 'Damascus',
            country: 'Syria',
            postal_code: '12345',
          },
        },
      },
      multiProductOrder: {
        summary: 'Order with multiple products',
        value: {
          items: [
            {
              variant_id: 456,
              quantity: 1,
              price: 2750000,
            },
            {
              variant_id: 789,
              quantity: 3,
              price: 150000,
            },
          ],
          payment_method: 'bank_transfer',
          buyer_note: 'Urgent order for wedding gift',
          gift_message: 'Happy Wedding! من أصدقائكم',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Order created successfully',
    schema: {
      example: {
        message: 'Order placed successfully',
        order: {
          id: 1001,
          status: 'pending',
          payment_status: 'unpaid',
          payment_method: 'cod',
          total_amount: 5750000,
          currency: 'SYP',
          buyer_note: 'Please handle with care',
          items: [
            {
              id: 2001,
              variant_id: 456,
              quantity: 2,
              unit_price: 2750000,
              total_price: 5500000,
              product: {
                nameEn: 'Samsung Galaxy S24',
                nameAr: 'سامسونج جالاكسي إس 24',
                slug: 'samsung-galaxy-s24',
              },
            },
          ],
          shipping: {
            estimated_delivery: '2025-08-15T00:00:00.000Z',
            tracking_number: 'SQ1001001',
          },
          created_at: '2025-08-08T16:45:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid order data or insufficient stock',
    schema: {
      examples: {
        insufficientStock: {
          summary: 'Insufficient stock',
          value: {
            message: 'Variant ID 456 does not have enough stock.',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        invalidVariant: {
          summary: 'Invalid product variant',
          value: {
            message: 'One or more variants not found.',
            error: 'Not Found',
            statusCode: 404,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async placeOrder(
    @CurrentUser() user: UserFromToken,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    this.logger.log(
      `User ${user.id} placing order with ${createOrderDto.items.length} items`,
    );

    const order = await this.ordersService.createOrder(user, createOrderDto);

    return {
      message: 'Order placed successfully',
      order: {
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        currency: 'SYP',
        buyer_note: order.buyer_note,
        gift_message: order.gift_message,
        items: order.items,
        created_at: order.created_at,
      },
      tracking: {
        orderNumber: `SQ${order.id.toString().padStart(6, '0')}`,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      nextSteps: {
        payment:
          order.payment_method === 'cod'
            ? 'Payment will be collected upon delivery'
            : 'Please complete payment to process your order',
        tracking: `You can track your order at /orders/${order.id}`,
      },
    };
  }

  /**
   * 🔁 Buyer or admin updates order status.
   */
  @Put('status')
  @ApiOperation({ summary: 'Update order status (Vendor/Admin)' })
  async updateOrderStatus(@Req() req, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(req.user, dto);
  }

  /**
   * ♻️ Buyer requests a return for their order.
   */
  @Post('return')
  @ApiOperation({ summary: 'Request product return (Buyer)' })
  async requestReturn(@Req() req, @Body() dto: RequestReturnDto) {
    return this.ordersService.requestReturn(req.user, dto);
  }

  /**
   * 💵 Admin processes a refund request.
   */
  @Post('refund')
  @ApiOperation({ summary: 'Initiate refund (Admin/Finance)' })
  async requestRefund(@Req() req, @Body() dto: RefundRequestDto) {
    return this.ordersService.requestRefund(req.user, dto);
  }

  /**
   * GET MY ORDER HISTORY
   *
   * Retrieves all orders for the authenticated user with complete details
   * Optimized for mobile display with order status and tracking information
   */
  @Get('my')
  @ApiOperation({
    summary: 'Get my order history',
    description:
      'Retrieves all orders for the authenticated user with complete order details, items, and status history',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'pending',
      'confirmed',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
    ],
    description: 'Filter orders by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of orders returned (default: 50)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Order history retrieved successfully',
    schema: {
      example: {
        orders: [
          {
            id: 1001,
            orderNumber: 'SQ001001',
            status: 'shipped',
            payment_status: 'paid',
            payment_method: 'cod',
            total_amount: 2750000,
            currency: 'SYP',
            items_count: 1,
            created_at: '2025-08-08T16:45:00.000Z',
            updated_at: '2025-08-10T09:30:00.000Z',
            items: [
              {
                id: 2001,
                quantity: 1,
                unit_price: 2750000,
                product: {
                  nameEn: 'Samsung Galaxy S24',
                  nameAr: 'سامسونج جالاكسي إس 24',
                  mainImage: 'https://example.com/images/galaxy-s24.jpg',
                  slug: 'samsung-galaxy-s24',
                },
                variant: {
                  sku: 'SGS24-128GB-BLACK',
                  attributes: {
                    color: 'Black',
                    storage: '128GB',
                  },
                },
              },
            ],
            status_history: [
              {
                status: 'pending',
                timestamp: '2025-08-08T16:45:00.000Z',
              },
              {
                status: 'confirmed',
                timestamp: '2025-08-09T10:15:00.000Z',
              },
              {
                status: 'shipped',
                timestamp: '2025-08-10T09:30:00.000Z',
              },
            ],
            tracking: {
              estimated_delivery: '2025-08-15T00:00:00.000Z',
              tracking_number: 'SQ1001001',
            },
            can_return: true,
            can_cancel: false,
          },
        ],
        summary: {
          total_orders: 1,
          total_spent: 2750000,
          currency: 'SYP',
          status_breakdown: {
            pending: 0,
            confirmed: 0,
            shipped: 1,
            delivered: 0,
            cancelled: 0,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getMyOrderHistory(
    @CurrentUser() user: UserFromToken,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(
      `User ${user.id} fetching order history with filters: status=${status}, limit=${limit}`,
    );

    const orders = await this.ordersService.getMyOrders(user);

    // Apply client-side filtering if needed (could be moved to service layer)
    let filteredOrders = orders;
    if (status) {
      filteredOrders = orders.filter((order) => order.status === status);
    }

    if (limit) {
      filteredOrders = filteredOrders.slice(0, Number(limit));
    }

    // Calculate summary statistics
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );
    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Transform orders for frontend
    const transformedOrders = filteredOrders.map((order) => ({
      id: order.id,
      orderNumber: `SQ${order.id.toString().padStart(6, '0')}`,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      total_amount: Number(order.total_amount),
      currency: 'SYP',
      items_count: order.items?.length || 0,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items:
        order.items?.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          product: {
            nameEn: item.variant?.product?.nameEn || 'Unknown Product',
            nameAr: item.variant?.product?.nameAr || 'منتج غير معروف',
            mainImage: item.variant?.product?.images?.[0]?.imageUrl || null,
            slug: item.variant?.product?.slug,
          },
          variant: {
            sku: item.variant?.sku,
            attributes: item.variant?.variantData || {},
          },
        })) || [],
      status_history:
        order.status_logs?.map((log) => ({
          status: log.status,
          timestamp: log.changedAt,
          comment: log.comment,
        })) || [],
      tracking: {
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // TODO: Get from shipment
        tracking_number: `SQ${order.id}${Date.now().toString().slice(-3)}`,
      },
      can_return: ['delivered', 'shipped'].includes(order.status),
      can_cancel: ['pending', 'confirmed'].includes(order.status),
    }));

    return {
      orders: transformedOrders,
      summary: {
        total_orders: orders.length,
        total_spent: totalSpent,
        currency: 'SYP',
        status_breakdown: statusBreakdown,
      },
      filters_applied: {
        status: status || null,
        limit: limit || null,
      },
    };
  }

  /**
   * 📦 Vendor fetches orders linked to their products.
   */
  @Get('vendor')
  @ApiOperation({ summary: 'Get vendor orders (Vendor)' })
  async getVendorOrders(@Req() req) {
    return this.ordersService.getVendorOrders(req.user.vendor_id);
  }

  /**
   * 📊 Admin fetches filtered order list.
   */
  @Get()
  @ApiOperation({ summary: 'List all orders with filters (Admin)' })
  async getAllOrders(@Query() filters: FilterOrdersDto) {
    return this.ordersService.getAllOrders(filters);
  }

  /**
   * GET ORDER DETAILS
   *
   * Retrieves complete details for a specific order including tracking information
   * Includes order items, status history, shipping details, and payment information
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order details by ID',
    description:
      'Retrieves complete order details including items, status history, tracking, and payment information',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID to retrieve',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'Order details retrieved successfully',
    schema: {
      example: {
        order: {
          id: 1001,
          orderNumber: 'SQ001001',
          status: 'shipped',
          payment_status: 'paid',
          payment_method: 'cod',
          total_amount: 2750000,
          currency: 'SYP',
          buyer_note: 'Please handle with care',
          gift_message: null,
          created_at: '2025-08-08T16:45:00.000Z',
          updated_at: '2025-08-10T09:30:00.000Z',
          customer: {
            id: 123,
            name: 'أحمد محمد السوري',
            email: 'ahmed@example.com',
            phone: '+963987654321',
          },
          items: [
            {
              id: 2001,
              quantity: 1,
              unit_price: 2750000,
              total_price: 2750000,
              product: {
                id: 456,
                nameEn: 'Samsung Galaxy S24',
                nameAr: 'سامسونج جالاكسي إس 24',
                slug: 'samsung-galaxy-s24',
                mainImage: 'https://example.com/images/galaxy-s24.jpg',
                category: {
                  nameEn: 'Smartphones',
                  nameAr: 'الهواتف الذكية',
                },
              },
              variant: {
                id: 789,
                sku: 'SGS24-128GB-BLACK',
                attributes: {
                  color: 'Black',
                  storage: '128GB',
                },
              },
            },
          ],
          shipping_address: {
            name: 'أحمد محمد السوري',
            phone: '+963987654321',
            address_line1: 'شارع الثورة، حي المزة',
            address_line2: 'بناء رقم 15، الطابق الثالث',
            city: 'Damascus',
            region: 'Damascus',
            country: 'Syria',
            postal_code: '12345',
          },
          status_history: [
            {
              status: 'pending',
              timestamp: '2025-08-08T16:45:00.000Z',
              comment: 'Order placed successfully',
            },
            {
              status: 'confirmed',
              timestamp: '2025-08-09T10:15:00.000Z',
              comment: 'Order confirmed by vendor',
            },
            {
              status: 'shipped',
              timestamp: '2025-08-10T09:30:00.000Z',
              comment: 'Order shipped via DHL Express',
            },
          ],
          tracking: {
            tracking_number: 'SQ1001001',
            estimated_delivery: '2025-08-15T00:00:00.000Z',
            shipping_company: 'DHL Express Syria',
            tracking_url: 'https://track.dhl.com/SQ1001001',
          },
          actions: {
            can_cancel: false,
            can_return: true,
            can_reorder: true,
            return_deadline: '2025-08-20T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    schema: {
      example: {
        message: 'Order #9999 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied - not your order',
    schema: {
      example: {
        message: 'You can only view your own orders',
        error: 'Forbidden',
        statusCode: 403,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getOrderDetails(
    @CurrentUser() user: UserFromToken,
    @Param('id') orderId: number,
  ) {
    this.logger.log(`User ${user.id} requesting details for order ${orderId}`);

    const order = await this.ordersService.getOrderDetails(Number(orderId));

    // Security check: users can only view their own orders (unless admin)
    if (order.user.id !== user.id && user.role_id !== 1) {
      // Assuming role_id 1 is admin
      this.logger.warn(
        `User ${user.id} attempted to access order ${orderId} belonging to user ${order.user.id}`,
      );
      throw new ForbiddenException('You can only view your own orders');
    }

    // Transform order for frontend display
    const transformedOrder = {
      id: order.id,
      orderNumber: `SQ${order.id.toString().padStart(6, '0')}`,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      total_amount: Number(order.total_amount),
      currency: 'SYP',
      buyer_note: order.buyer_note,
      gift_message: order.gift_message,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer: {
        id: order.user.id,
        name: order.user.fullName || 'Unknown User',
        email: order.user.email,
        phone: order.user.phone,
      },
      items:
        order.items?.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          product: {
            id: item.variant?.product?.id,
            nameEn: item.variant?.product?.nameEn || 'Unknown Product',
            nameAr: item.variant?.product?.nameAr || 'منتج غير معروف',
            slug: item.variant?.product?.slug,
            mainImage: item.variant?.product?.images?.[0]?.imageUrl || null,
            category: {
              nameEn: item.variant?.product?.category?.nameEn,
              nameAr: item.variant?.product?.category?.nameAr,
            },
          },
          variant: {
            id: item.variant?.id,
            sku: item.variant?.sku,
            attributes: item.variant?.variantData || {},
          },
        })) || [],
      shipping_address: {
        name: order.shippingName,
        phone: order.shippingPhone,
        address_line1: order.shippingAddressLine1,
        address_line2: order.shippingAddressLine2,
        city: order.shippingCity,
        region: order.shippingRegion,
        country: order.shippingCountry,
        postal_code: order.shippingPostalCode,
      },
      billing_address: order.billingName
        ? {
            name: order.billingName,
            phone: order.billingPhone,
            address_line1: order.billingAddressLine1,
            address_line2: order.billingAddressLine2,
            city: order.billingCity,
            region: order.billingRegion,
            country: order.billingCountry,
            postal_code: order.billingPostalCode,
          }
        : null,
      status_history:
        order.status_logs
          ?.map((log) => ({
            status: log.status,
            timestamp: log.changedAt,
            comment: log.comment || `Order status changed to ${log.status}`,
          }))
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          ) || [],
      tracking: {
        tracking_number: `SQ${order.id}${Date.now().toString().slice(-3)}`,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        shipping_company: 'SouqSyria Express', // TODO: Get from shipment
        tracking_url: `https://souqsyria.com/track/${order.id}`,
      },
      actions: {
        can_cancel: ['pending', 'confirmed'].includes(order.status),
        can_return: ['delivered', 'shipped'].includes(order.status),
        can_reorder: true,
        return_deadline:
          order.status === 'delivered'
            ? new Date(order.updated_at.getTime() + 5 * 24 * 60 * 60 * 1000)
            : null,
      },
    };

    return {
      order: transformedOrder,
      retrieved_at: new Date(),
    };
  }
}
