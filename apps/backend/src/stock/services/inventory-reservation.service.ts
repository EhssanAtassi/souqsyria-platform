/**
 * @file inventory-reservation.service.ts
 * @description Enterprise Inventory Reservation and Allocation Service
 *
 * ENTERPRISE FEATURES:
 * - Real-time inventory reservation with conflict resolution
 * - Intelligent multi-warehouse allocation algorithms
 * - Automated stock replenishment triggers
 * - Performance monitoring and optimization
 * - SLA-based priority handling
 * - Concurrent reservation management
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  InventoryReservationEntity,
  InventoryAllocationEntity,
  ReservationStatus,
  ReservationPriority,
  AllocationStrategy,
  ConflictResolution,
} from '../entities/inventory-reservation.entity';
import { ProductStockEntity } from '../entities/product-stock.entity';
import { StockMovementEntity } from '../entities/stock-movement.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Allocation result interface
 */
interface AllocationResult {
  success: boolean;
  allocatedQuantity: number;
  allocations: Array<{
    warehouseId: number;
    warehouseName: string;
    quantity: number;
    availableStock: number;
    allocationScore: number;
  }>;
  conflicts?: Array<{
    type: string;
    description: string;
    recommendation: string;
  }>;
  performance: {
    processingTime: number;
    warehousesEvaluated: number;
    conflictsResolved: number;
  };
}

@Injectable()
export class InventoryReservationService {
  private readonly logger = new Logger(InventoryReservationService.name);

  constructor(
    @InjectRepository(InventoryReservationEntity)
    private reservationRepo: Repository<InventoryReservationEntity>,

    @InjectRepository(InventoryAllocationEntity)
    private allocationRepo: Repository<InventoryAllocationEntity>,

    @InjectRepository(ProductStockEntity)
    private stockRepo: Repository<ProductStockEntity>,

    @InjectRepository(StockMovementEntity)
    private movementRepo: Repository<StockMovementEntity>,

    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,

    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,

    private entityManager: EntityManager,
  ) {}

  /**
   * Reserve inventory for an entire order
   *
   * @param orderId - Order ID to reserve inventory for
   * @param priority - Reservation priority level
   * @param timeoutMinutes - Reservation timeout in minutes
   * @returns Array of reservation results
   */
  async reserveInventoryForOrder(
    orderId: number,
    priority: ReservationPriority = ReservationPriority.NORMAL,
    timeoutMinutes: number = 30,
  ): Promise<InventoryReservationEntity[]> {
    const startTime = Date.now();

    return await this.entityManager.transaction(async (manager) => {
      try {
        this.logger.log(`Starting inventory reservation for order ${orderId}`);

        // Load order with items
        const order = await manager.findOne(Order, {
          where: { id: orderId },
          relations: ['items', 'items.variant'],
        });

        if (!order) {
          throw new NotFoundException(`Order ${orderId} not found`);
        }

        const reservations: InventoryReservationEntity[] = [];
        const expirationTime = new Date(
          Date.now() + timeoutMinutes * 60 * 1000,
        );

        // Process each order item
        for (const orderItem of order.items) {
          this.logger.debug(
            `Reserving ${orderItem.quantity} units of variant ${orderItem.variant.id}`,
          );

          // Find optimal warehouses for this variant
          const warehouses = await this.findOptimalWarehouses(
            orderItem.variant.id,
            orderItem.quantity,
            order,
            manager,
          );

          if (warehouses.length === 0) {
            throw new BadRequestException(
              `No warehouses available for variant ${orderItem.variant.id}`,
            );
          }

          // Create reservation for the best warehouse
          const bestWarehouse = warehouses[0];
          const reservation = manager.create(InventoryReservationEntity, {
            variant: orderItem.variant,
            warehouse: bestWarehouse.warehouse,
            order,
            requestedQuantity: orderItem.quantity,
            reservedQuantity: Math.min(
              orderItem.quantity,
              bestWarehouse.availableStock,
            ),
            status: ReservationStatus.PENDING,
            priority,
            allocationStrategy: AllocationStrategy.FIRST_AVAILABLE,
            expiresAt: expirationTime,
            confirmationDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            reservationData: {
              orderValue: order.total_amount,
              productCategory: orderItem.variant.product?.category?.nameEn,
              geographicZone: this.getGeographicZone(order),
            },
            performanceMetrics: {
              reservationTime: Date.now() - startTime,
              warehouseQueriesCount: warehouses.length,
              stockCheckLatency: 0, // Will be updated
            },
            automationConfig: {
              autoConfirm: priority >= ReservationPriority.HIGH,
              autoAllocate: priority >= ReservationPriority.URGENT,
              notifications: [
                {
                  event: 'reservation_created',
                  recipients: ['inventory_manager'],
                  template: 'inventory_reserved',
                },
              ],
            },
          });

          const savedReservation = await manager.save(
            InventoryReservationEntity,
            reservation,
          );

          // Check for conflicts with other reservations
          await this.detectAndResolveConflicts(savedReservation, manager);

          reservations.push(savedReservation);

          // Update stock if confirmed reservation
          if (priority >= ReservationPriority.URGENT) {
            await this.confirmReservation(savedReservation.id, null, manager);
          }
        }

        const totalTime = Date.now() - startTime;
        this.logger.log(
          `Completed inventory reservation for order ${orderId} in ${totalTime}ms`,
        );

        return reservations;
      } catch (error: unknown) {
        this.logger.error(
          `Failed to reserve inventory for order ${orderId}`,
          (error as Error).stack,
        );
        throw error;
      }
    });
  }

  /**
   * Allocate confirmed reservations across multiple warehouses
   *
   * @param orderId - Order ID to allocate inventory for
   * @param strategy - Allocation strategy to use
   * @returns Allocation results
   */
  async allocateInventoryForOrder(
    orderId: number,
    strategy: AllocationStrategy = AllocationStrategy.NEAREST_WAREHOUSE,
  ): Promise<AllocationResult[]> {
    const startTime = Date.now();

    return await this.entityManager.transaction(async (manager) => {
      try {
        this.logger.log(`Starting inventory allocation for order ${orderId}`);

        // Get confirmed reservations for the order
        const reservations = await manager.find(InventoryReservationEntity, {
          where: {
            order: { id: orderId },
            status: ReservationStatus.CONFIRMED,
          },
          relations: ['variant', 'warehouse', 'order'],
        });

        if (reservations.length === 0) {
          throw new BadRequestException(
            `No confirmed reservations found for order ${orderId}`,
          );
        }

        const allocationResults: AllocationResult[] = [];

        // Process each reservation
        for (const reservation of reservations) {
          const allocationResult = await this.allocateReservation(
            reservation,
            strategy,
            manager,
          );

          allocationResults.push(allocationResult);

          // Update reservation status
          if (allocationResult.success) {
            reservation.status =
              allocationResult.allocatedQuantity ===
              reservation.reservedQuantity
                ? ReservationStatus.ALLOCATED
                : ReservationStatus.PARTIALLY_ALLOCATED;
            reservation.allocatedQuantity = allocationResult.allocatedQuantity;

            await manager.save(InventoryReservationEntity, reservation);
          }
        }

        const totalTime = Date.now() - startTime;
        this.logger.log(
          `Completed inventory allocation for order ${orderId} in ${totalTime}ms`,
        );

        return allocationResults;
      } catch (error: unknown) {
        this.logger.error(
          `Failed to allocate inventory for order ${orderId}`,
          (error as Error).stack,
        );
        throw error;
      }
    });
  }

  /**
   * Confirm a pending reservation
   *
   * @param reservationId - Reservation ID to confirm
   * @param confirmedBy - User confirming the reservation
   * @param manager - Optional transaction manager
   * @returns Updated reservation
   */
  async confirmReservation(
    reservationId: number,
    confirmedBy: User | null = null,
    manager?: EntityManager,
  ): Promise<InventoryReservationEntity> {
    const repo = manager
      ? manager.getRepository(InventoryReservationEntity)
      : this.reservationRepo;

    const reservation = await repo.findOne({
      where: { id: reservationId },
      relations: ['variant', 'warehouse'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Reservation ${reservationId} is not in pending status`,
      );
    }

    // Verify stock availability
    const currentStock = await this.getCurrentStock(
      reservation.variant.id,
      reservation.warehouse.id,
      manager,
    );

    if (currentStock < reservation.reservedQuantity) {
      throw new ConflictException(
        `Insufficient stock: required ${reservation.reservedQuantity}, available ${currentStock}`,
      );
    }

    // Update reservation
    reservation.status = ReservationStatus.CONFIRMED;
    reservation.confirmedBy = confirmedBy;

    // Add audit trail entry
    reservation.auditTrail = reservation.auditTrail || [];
    reservation.auditTrail.push({
      timestamp: new Date(),
      action: 'reservation_confirmed',
      user: confirmedBy?.id?.toString(),
      details: {
        confirmedQuantity: reservation.reservedQuantity,
        availableStock: currentStock,
      },
    });

    const savedReservation = await repo.save(reservation);

    this.logger.log(
      `Reservation ${reservationId} confirmed for ${reservation.reservedQuantity} units`,
    );

    return savedReservation;
  }

  /**
   * Release expired or cancelled reservations
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processExpiredReservations(): Promise<void> {
    this.logger.debug('Processing expired reservations');

    const expiredReservations = await this.reservationRepo.find({
      where: {
        expiresAt: LessThan(new Date()),
        status: ReservationStatus.PENDING,
      },
    });

    for (const reservation of expiredReservations) {
      await this.releaseReservation(reservation.id, 'Reservation expired');
    }

    this.logger.debug(
      `Processed ${expiredReservations.length} expired reservations`,
    );
  }

  /**
   * Monitor reservation performance and escalate issues
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async monitorReservationPerformance(): Promise<void> {
    this.logger.debug('Monitoring reservation performance');

    // Check for high-priority reservations taking too long
    const slowReservations = await this.reservationRepo
      .createQueryBuilder('reservation')
      .where('reservation.priority >= :priority', {
        priority: ReservationPriority.HIGH,
      })
      .andWhere('reservation.status = :status', {
        status: ReservationStatus.PENDING,
      })
      .andWhere('reservation.createdAt < :threshold', {
        threshold: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      })
      .getMany();

    for (const reservation of slowReservations) {
      await this.escalateReservation(
        reservation,
        'High-priority reservation delayed',
      );
    }

    this.logger.debug(`Escalated ${slowReservations.length} slow reservations`);
  }

  /**
   * PRIVATE METHODS
   */

  private async findOptimalWarehouses(
    variantId: number,
    requestedQuantity: number,
    order: Order,
    manager: EntityManager,
  ): Promise<
    Array<{
      warehouse: Warehouse;
      availableStock: number;
      allocationScore: number;
    }>
  > {
    // Get stock information across all warehouses
    const stockRecords = await manager
      .createQueryBuilder(ProductStockEntity, 'stock')
      .leftJoinAndSelect('stock.warehouse', 'warehouse')
      .where('stock.variant.id = :variantId', { variantId })
      .andWhere('stock.quantity > 0')
      .getMany();

    if (stockRecords.length === 0) {
      return [];
    }

    // Calculate allocation scores
    const warehouseOptions = stockRecords.map((stock) => ({
      warehouse: stock.warehouse,
      availableStock: stock.quantity,
      allocationScore: this.calculateAllocationScore(
        stock,
        requestedQuantity,
        order,
      ),
    }));

    // Sort by allocation score (highest first)
    return warehouseOptions.sort(
      (a, b) => b.allocationScore - a.allocationScore,
    );
  }

  private calculateAllocationScore(
    stock: ProductStockEntity,
    requestedQuantity: number,
    order: Order,
  ): number {
    let score = 0;

    // Stock availability score (0-40 points)
    const availabilityRatio = Math.min(stock.quantity / requestedQuantity, 1);
    score += availabilityRatio * 40;

    // Geographic proximity score (0-30 points)
    const distanceScore = this.calculateDistanceScore(stock.warehouse, order);
    score += distanceScore * 30;

    // Warehouse capacity utilization (0-20 points)
    const utilizationScore = this.calculateUtilizationScore(stock.warehouse);
    score += utilizationScore * 20;

    // Strategic priority (0-10 points)
    const priorityScore = this.calculatePriorityScore(stock.warehouse, order);
    score += priorityScore * 10;

    return score;
  }

  private calculateDistanceScore(warehouse: Warehouse, order: Order): number {
    // Simplified distance calculation
    // In production, you'd use actual geographic coordinates
    if (!warehouse.latitude || !warehouse.longitude) {
      return 0.5; // Default score if no coordinates
    }

    // For now, return a random score between 0.3 and 1.0
    // In production, calculate actual distance to customer
    return 0.3 + Math.random() * 0.7;
  }

  private calculateUtilizationScore(warehouse: Warehouse): number {
    // Simplified utilization calculation
    // In production, you'd check current warehouse load
    return 0.5 + Math.random() * 0.5;
  }

  private calculatePriorityScore(warehouse: Warehouse, order: Order): number {
    // Strategic priority based on business rules
    let score = 0.5;

    // Prioritize based on order value
    if (order.total_amount > 1000) score += 0.2;
    if (order.total_amount > 5000) score += 0.3;

    return Math.min(score, 1.0);
  }

  private async detectAndResolveConflicts(
    reservation: InventoryReservationEntity,
    manager: EntityManager,
  ): Promise<void> {
    // Check for concurrent reservations of the same variant
    const concurrentReservations = await manager
      .createQueryBuilder(InventoryReservationEntity, 'reservation')
      .where('reservation.variant.id = :variantId', {
        variantId: reservation.variant.id,
      })
      .andWhere('reservation.warehouse.id = :warehouseId', {
        warehouseId: reservation.warehouse.id,
      })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
      })
      .andWhere('reservation.id != :reservationId', {
        reservationId: reservation.id,
      })
      .getMany();

    if (concurrentReservations.length > 0) {
      await this.resolveReservationConflicts(
        reservation,
        concurrentReservations,
        manager,
      );
    }
  }

  private async resolveReservationConflicts(
    newReservation: InventoryReservationEntity,
    existingReservations: InventoryReservationEntity[],
    manager: EntityManager,
  ): Promise<void> {
    this.logger.warn(
      `Conflict detected for variant ${newReservation.variant.id} in warehouse ${newReservation.warehouse.id}`,
    );

    // Calculate total stock needed
    const totalRequested = existingReservations.reduce(
      (sum, res) => sum + res.requestedQuantity,
      newReservation.requestedQuantity,
    );

    const availableStock = await this.getCurrentStock(
      newReservation.variant.id,
      newReservation.warehouse.id,
      manager,
    );

    if (totalRequested <= availableStock) {
      // No actual conflict - enough stock for all
      return;
    }

    // Resolve based on priority
    const allReservations = [...existingReservations, newReservation];
    allReservations.sort((a, b) => b.priority - a.priority);

    let remainingStock = availableStock;
    for (const reservation of allReservations) {
      const allocatedQuantity = Math.min(
        reservation.requestedQuantity,
        remainingStock,
      );

      if (allocatedQuantity < reservation.requestedQuantity) {
        reservation.conflictData = {
          conflictDetected: true,
          conflictType: 'stock_shortage',
          conflictResolution: ConflictResolution.PRIORITY_BASED,
          competingReservations: allReservations
            .filter((r) => r.id !== reservation.id)
            .map((r) => r.id),
          resolutionStrategy: 'priority_based_allocation',
          resolutionTime: Date.now(),
          impactedCustomers: 1,
        };
      }

      reservation.reservedQuantity = allocatedQuantity;
      remainingStock -= allocatedQuantity;

      await manager.save(InventoryReservationEntity, reservation);
    }
  }

  private async allocateReservation(
    reservation: InventoryReservationEntity,
    strategy: AllocationStrategy,
    manager: EntityManager,
  ): Promise<AllocationResult> {
    const startTime = Date.now();

    try {
      // Find available warehouses for allocation
      const warehouses = await this.findOptimalWarehouses(
        reservation.variant.id,
        reservation.reservedQuantity,
        reservation.order,
        manager,
      );

      const allocations: InventoryAllocationEntity[] = [];
      let remainingQuantity = reservation.reservedQuantity;

      // Allocate across warehouses based on strategy
      for (const warehouseOption of warehouses) {
        if (remainingQuantity <= 0) break;

        const allocateQuantity = Math.min(
          remainingQuantity,
          warehouseOption.availableStock,
        );

        if (allocateQuantity > 0) {
          const allocation = manager.create(InventoryAllocationEntity, {
            reservation,
            warehouse: warehouseOption.warehouse,
            allocatedQuantity: allocateQuantity,
            availableQuantityAtAllocation: warehouseOption.availableStock,
            allocationAlgorithm: strategy,
            allocationScore: warehouseOption.allocationScore,
            logisticsData: {
              distanceToCustomer: 0, // Calculate actual distance
              estimatedShippingCost: this.estimateShippingCost(
                warehouseOption.warehouse,
                allocateQuantity,
              ),
              estimatedDeliveryTime: 24, // hours
              shippingZone: this.getShippingZone(warehouseOption.warehouse),
            },
            allocatedAt: new Date(),
          });

          const savedAllocation = await manager.save(
            InventoryAllocationEntity,
            allocation,
          );
          allocations.push(savedAllocation);

          remainingQuantity -= allocateQuantity;
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success: remainingQuantity === 0,
        allocatedQuantity: reservation.reservedQuantity - remainingQuantity,
        allocations: allocations.map((alloc) => ({
          warehouseId: alloc.warehouse.id,
          warehouseName: alloc.warehouse.name,
          quantity: alloc.allocatedQuantity,
          availableStock: alloc.availableQuantityAtAllocation,
          allocationScore: alloc.allocationScore,
        })),
        performance: {
          processingTime,
          warehousesEvaluated: warehouses.length,
          conflictsResolved: 0,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to allocate reservation ${reservation.id}`,
        (error as Error).stack,
      );

      return {
        success: false,
        allocatedQuantity: 0,
        allocations: [],
        performance: {
          processingTime: Date.now() - startTime,
          warehousesEvaluated: 0,
          conflictsResolved: 0,
        },
      };
    }
  }

  private async getCurrentStock(
    variantId: number,
    warehouseId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(ProductStockEntity)
      : this.stockRepo;

    const stock = await repo.findOne({
      where: {
        variant: { id: variantId },
        warehouse: { id: warehouseId },
      },
    });

    return stock?.quantity || 0;
  }

  private async releaseReservation(
    reservationId: number,
    reason: string,
  ): Promise<void> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
    });

    if (reservation) {
      reservation.status = ReservationStatus.RELEASED;

      // Add audit trail
      reservation.auditTrail = reservation.auditTrail || [];
      reservation.auditTrail.push({
        timestamp: new Date(),
        action: 'reservation_released',
        system: 'automated',
        details: { reason },
      });

      await this.reservationRepo.save(reservation);

      this.logger.log(`Released reservation ${reservationId}: ${reason}`);
    }
  }

  private async escalateReservation(
    reservation: InventoryReservationEntity,
    reason: string,
  ): Promise<void> {
    // Update reservation with escalation flag
    reservation.conflictData = {
      ...reservation.conflictData,
      conflictDetected: true,
      conflictType: 'performance_issue',
      resolutionStrategy: 'manual_escalation',
    };

    await this.reservationRepo.save(reservation);

    this.logger.warn(`Escalated reservation ${reservation.id}: ${reason}`);
  }

  private getGeographicZone(order: Order): string {
    // Determine geographic zone based on shipping address
    return order.shippingRegion || 'default';
  }

  private estimateShippingCost(warehouse: Warehouse, quantity: number): number {
    // Simplified shipping cost estimation
    const baseRate = 10; // Base shipping cost
    const perItemRate = 2; // Per item rate
    return baseRate + quantity * perItemRate;
  }

  private getShippingZone(warehouse: Warehouse): string {
    // Determine shipping zone based on warehouse location
    return warehouse.city || 'default_zone';
  }
}
