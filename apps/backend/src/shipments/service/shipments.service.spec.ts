/**
 * 🚚 ShipmentsService Test Suite
 *
 * Comprehensive unit tests for shipment management service covering:
 * - Shipment creation and validation
 * - Status updates and workflow transitions
 * - Delivery confirmation with proof
 * - Tracking information retrieval
 * - Syrian shipping company integration (Aramex, DHL)
 * - Filter and listing functionality
 * - Real Syrian market data scenarios
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ShipmentsService } from './shipments.service';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { ShipmentItem } from '../entities/shipment-item.entity';
import { ShippingCompany } from '../entities/shipping-company.entity';
import { ShipmentStatusLog } from '../entities/shipment-status-log.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';
import { AramexProvider } from '../providers/aramex.provider';
import { DhlProvider } from '../providers/dhl.provider';

// =============================================================================
// MOCK FACTORIES - Syrian Market Data
// =============================================================================

/**
 * Factory for creating Syrian user test data
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianUser = (overrides = {}): any => ({
  id: 1,
  email: 'ahmad.khalil@gmail.com',
  fullName: 'Ahmad Khalil',
  phone: '+963-11-234-5678',
  ...overrides,
});

/**
 * Factory for creating Syrian shipping companies
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianShippingCompany = (overrides = {}): any => ({
  id: 1,
  name: 'Aramex Syria',
  isActive: true,
  ...overrides,
});

/**
 * Factory for creating Syrian orders
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianOrder = (overrides = {}): any => ({
  id: 1,
  total_amount: 8500000, // Syrian Pounds
  status: 'confirmed',
  user: createSyrianUser(),
  ...overrides,
});

/**
 * Factory for creating Syrian order items
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianOrderItem = (overrides = {}): any => ({
  id: 1,
  quantity: 1,
  price: 8500000,
  ...overrides,
});

/**
 * Factory for creating Syrian shipments
 * Using 'any' type for flexibility with entity property names
 */
const createSyrianShipment = (overrides = {}): any => ({
  id: 1,
  status: ShipmentStatus.CREATED,
  tracking_code: 'SY-SHIP-2025-001234',
  tracking_url: 'https://tracking.aramex.com/SY-SHIP-2025-001234',
  external_status: 'picked_up',
  order: createSyrianOrder() as Order,
  shippingCompany: createSyrianShippingCompany() as ShippingCompany,
  items: [],
  statusLogs: [],
  total_cost_syp: 5800,
  cost_breakdown: {
    baseFee: 2000,
    distanceFee: 1500,
    weightFee: 500,
    expressFee: 1000,
    codFee: 500,
    insuranceFee: 300,
    totalCost: 5800,
    currency: 'SYP',
    calculatedAt: new Date(),
  },
  ...overrides,
});

/**
 * Factory for creating user tokens (using 'any' for flexibility with interface requirements)
 */
const createUserToken = (overrides = {}): any => ({
  id: 1,
  email: 'ahmad.khalil@gmail.com',
  role: 'customer',
  ...overrides,
});

// =============================================================================
// TEST SUITE
// =============================================================================

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let shipmentRepo: jest.Mocked<Repository<Shipment>>;
  let shipmentItemRepo: jest.Mocked<Repository<ShipmentItem>>;
  let companyRepo: jest.Mocked<Repository<ShippingCompany>>;
  let logRepo: jest.Mocked<Repository<ShipmentStatusLog>>;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let aramexProvider: jest.Mocked<AramexProvider>;
  let dhlProvider: jest.Mocked<DhlProvider>;

  beforeEach(async () => {
    // Create mock repositories
    const mockShipmentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockShipmentItemRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockCompanyRepo = {
      findOne: jest.fn(),
    };

    const mockLogRepo = {
      save: jest.fn(),
    };

    const mockOrderRepo = {
      findOne: jest.fn(),
    };

    const mockOrderItemRepo = {
      findByIds: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    // Create mock providers
    const mockAramexProvider = {
      registerShipment: jest.fn(),
    };

    const mockDhlProvider = {
      registerShipment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: getRepositoryToken(Shipment), useValue: mockShipmentRepo },
        { provide: getRepositoryToken(ShipmentItem), useValue: mockShipmentItemRepo },
        { provide: getRepositoryToken(ShippingCompany), useValue: mockCompanyRepo },
        { provide: getRepositoryToken(ShipmentStatusLog), useValue: mockLogRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: AramexProvider, useValue: mockAramexProvider },
        { provide: DhlProvider, useValue: mockDhlProvider },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
    shipmentRepo = module.get(getRepositoryToken(Shipment));
    shipmentItemRepo = module.get(getRepositoryToken(ShipmentItem));
    companyRepo = module.get(getRepositoryToken(ShippingCompany));
    logRepo = module.get(getRepositoryToken(ShipmentStatusLog));
    orderRepo = module.get(getRepositoryToken(Order));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));
    userRepo = module.get(getRepositoryToken(User));
    aramexProvider = module.get(AramexProvider);
    dhlProvider = module.get(DhlProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Service Initialization Tests
  // ===========================================================================

  describe('📦 Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required dependencies injected', () => {
      expect(shipmentRepo).toBeDefined();
      expect(shipmentItemRepo).toBeDefined();
      expect(companyRepo).toBeDefined();
      expect(logRepo).toBeDefined();
      expect(orderRepo).toBeDefined();
      expect(orderItemRepo).toBeDefined();
      expect(aramexProvider).toBeDefined();
      expect(dhlProvider).toBeDefined();
    });
  });

  // ===========================================================================
  // Create Shipment Tests
  // ===========================================================================

  describe('🚚 createShipment', () => {
    const mockUser = createUserToken();
    const mockOrder = createSyrianOrder();
    const mockCompany = createSyrianShippingCompany();
    const mockOrderItems = [
      createSyrianOrderItem({ id: 1 }),
      createSyrianOrderItem({ id: 2, price: 3500000 }),
    ];

    it('should create shipment successfully with Syrian market data', async () => {
      const dto = {
        order_id: 1,
        order_item_ids: [1, 2],
        shipping_company_id: 1,
        estimated_delivery_at: new Date('2025-01-15').toISOString(),
      };

      const createdShipment = createSyrianShipment();

      orderRepo.findOne.mockResolvedValue(mockOrder as Order);
      orderItemRepo.findByIds.mockResolvedValue(mockOrderItems as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(mockCompany as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      aramexProvider.registerShipment.mockResolvedValue({
        trackingCode: 'SY-ARAMEX-2025-001234',
        trackingUrl: 'https://tracking.aramex.com/SY-ARAMEX-2025-001234',
        status: 'registered',
      });
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(orderItemRepo.findByIds).toHaveBeenCalledWith([1, 2]);
      expect(companyRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(shipmentRepo.create).toHaveBeenCalled();
      expect(shipmentRepo.save).toHaveBeenCalled();
      expect(logRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      const dto = {
        order_id: 999,
        order_item_ids: [1],
        shipping_company_id: 1,
      };

      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.createShipment(mockUser, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });

    it('should throw BadRequestException when some order items not found', async () => {
      const dto = {
        order_id: 1,
        order_item_ids: [1, 2, 3], // Item 3 doesn't exist
        shipping_company_id: 1,
      };

      orderRepo.findOne.mockResolvedValue(mockOrder as Order);
      orderItemRepo.findByIds.mockResolvedValue([mockOrderItems[0]] as OrderItem[]);

      await expect(service.createShipment(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when shipping company not found', async () => {
      const dto = {
        order_id: 1,
        order_item_ids: [1, 2],
        shipping_company_id: 999,
      };

      orderRepo.findOne.mockResolvedValue(mockOrder as Order);
      orderItemRepo.findByIds.mockResolvedValue(mockOrderItems as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(null);

      await expect(service.createShipment(mockUser, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should register shipment with Aramex provider', async () => {
      const dto = {
        order_id: 1,
        order_item_ids: [1],
        shipping_company_id: 1,
      };

      const aramexCompany = createSyrianShippingCompany({ name: 'Aramex Syria' });
      const createdShipment = createSyrianShipment();

      orderRepo.findOne.mockResolvedValue(mockOrder as Order);
      orderItemRepo.findByIds.mockResolvedValue([mockOrderItems[0]] as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(aramexCompany as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      aramexProvider.registerShipment.mockResolvedValue({
        trackingCode: 'SY-ARAMEX-2025-001234',
        trackingUrl: 'https://tracking.aramex.com/SY-ARAMEX-2025-001234',
        status: 'registered',
      });
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      await service.createShipment(mockUser, dto);

      expect(aramexProvider.registerShipment).toHaveBeenCalled();
    });

    it('should register shipment with DHL provider', async () => {
      const dto = {
        order_id: 1,
        order_item_ids: [1],
        shipping_company_id: 1,
      };

      const dhlCompany = createSyrianShippingCompany({ name: 'DHL Express Syria' });
      const createdShipment = createSyrianShipment();

      orderRepo.findOne.mockResolvedValue(mockOrder as Order);
      orderItemRepo.findByIds.mockResolvedValue([mockOrderItems[0]] as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(dhlCompany as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      dhlProvider.registerShipment.mockResolvedValue({
        trackingCode: 'SY-DHL-2025-001234',
        trackingUrl: 'https://tracking.dhl.com/SY-DHL-2025-001234',
        status: 'registered',
      });
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      await service.createShipment(mockUser, dto);

      expect(dhlProvider.registerShipment).toHaveBeenCalled();
    });

    it('should handle carrier registration failure gracefully', async () => {
      const dto = {
        order_id: 1,
        order_item_ids: [1],
        shipping_company_id: 1,
      };

      const createdShipment = createSyrianShipment();

      orderRepo.findOne.mockResolvedValue(mockOrder as Order);
      orderItemRepo.findByIds.mockResolvedValue([mockOrderItems[0]] as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(mockCompany as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      aramexProvider.registerShipment.mockRejectedValue(new Error('Carrier API unavailable'));
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      // Should not throw - shipment should still be created
      const result = await service.createShipment(mockUser, dto);
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // Update Shipment Status Tests
  // ===========================================================================

  describe('🚦 updateShipmentStatus', () => {
    const mockUser = createUserToken({ role: 'admin' });

    it('should update shipment status successfully', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.CREATED });
      const dto = {
        shipment_id: 1,
        new_status: 'out_for_delivery',
      } as any; // Cast to any to bypass DTO type differences

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      const result = await service.updateShipmentStatus(mockUser, dto);

      expect(result.status).toBe('out_for_delivery');
      expect(logRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        from_status: ShipmentStatus.CREATED,
        to_status: 'out_for_delivery',
      }));
    });

    it('should set delivered_at when status is delivered', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.OUT_FOR_DELIVERY });
      const dto = {
        shipment_id: 1,
        new_status: 'delivered',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      const result = await service.updateShipmentStatus(mockUser, dto);

      expect(result.status).toBe('delivered');
      expect(result.delivered_at).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when shipment not found', async () => {
      const dto = {
        shipment_id: 999,
        new_status: 'delivered',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.updateShipmentStatus(mockUser, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should log status transition history', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.PICKED_UP });
      const dto = {
        shipment_id: 1,
        new_status: 'in_warehouse',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      await service.updateShipmentStatus(mockUser, dto);

      expect(logRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        from_status: ShipmentStatus.PICKED_UP,
        to_status: 'in_warehouse',
        changedBy: { id: mockUser.id },
      }));
    });
  });

  // ===========================================================================
  // Get Tracking Info Tests
  // ===========================================================================

  describe('📍 getTrackingInfo', () => {
    it('should return tracking information for Syrian shipment', async () => {
      const shipment = createSyrianShipment({
        tracking_code: 'SY-ARAMEX-2025-001234',
        tracking_url: 'https://tracking.aramex.com/SY-ARAMEX-2025-001234',
        external_status: 'out_for_delivery',
        statusLogs: [
          { id: 1, from_status: 'created', to_status: 'picked_up', created_at: new Date() },
          { id: 2, from_status: 'picked_up', to_status: 'out_for_delivery', created_at: new Date() },
        ],
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);

      const result = await service.getTrackingInfo(1);

      expect(result).toEqual({
        tracking_code: 'SY-ARAMEX-2025-001234',
        tracking_url: 'https://tracking.aramex.com/SY-ARAMEX-2025-001234',
        external_status: 'out_for_delivery',
        logs: shipment.statusLogs,
      });
    });

    it('should throw NotFoundException when shipment not found', async () => {
      shipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.getTrackingInfo(999)).rejects.toThrow(NotFoundException);
    });

    it('should return tracking info even without external status', async () => {
      const shipment = createSyrianShipment({
        tracking_code: null,
        tracking_url: null,
        external_status: null,
        statusLogs: [],
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);

      const result = await service.getTrackingInfo(1);

      expect(result.tracking_code).toBeNull();
      expect(result.tracking_url).toBeNull();
      expect(result.external_status).toBeNull();
      expect(result.logs).toEqual([]);
    });
  });

  // ===========================================================================
  // Confirm Delivery Tests
  // ===========================================================================

  describe('✅ confirmDelivery', () => {
    const mockUser = createUserToken({ role: 'delivery_agent' });

    it('should confirm delivery with photo proof', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.OUT_FOR_DELIVERY });
      // DTO expects proof_data as string, but service casts to any
      const dto = {
        shipment_id: 1,
        proof_type: 'photo',
        proof_data: JSON.stringify({
          photoUrl: 'https://storage.souqsyria.com/delivery-proofs/12345.jpg',
          recipientName: 'Ahmad Al-Customer',
        }),
      } as any;

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      const result = await service.confirmDelivery(mockUser, dto);

      // Service sets status to 'DELIVERED' (uppercase) via `as any` cast
      expect(result.status).toBe('DELIVERED');
      expect(result.proof_type).toBe('photo');
      expect(result.delivered_at).toBeInstanceOf(Date);
    });

    it('should confirm delivery with signature proof', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.OUT_FOR_DELIVERY });
      const dto = {
        shipment_id: 1,
        proof_type: 'signature',
        proof_data: 'base64_signature_data_here',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      const result = await service.confirmDelivery(mockUser, dto);

      expect(result.proof_type).toBe('signature');
    });

    it('should confirm delivery with OTP proof', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.OUT_FOR_DELIVERY });
      const dto = {
        shipment_id: 1,
        proof_type: 'otp',
        proof_data: '123456',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      const result = await service.confirmDelivery(mockUser, dto);

      expect(result.proof_type).toBe('otp');
    });

    it('should throw NotFoundException when shipment not found', async () => {
      const dto = {
        shipment_id: 999,
        proof_type: 'photo',
        proof_data: 'test',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.confirmDelivery(mockUser, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should log delivery confirmation status change', async () => {
      const shipment = createSyrianShipment({ status: ShipmentStatus.OUT_FOR_DELIVERY });
      const dto = {
        shipment_id: 1,
        proof_type: 'photo',
        proof_data: 'test_proof',
      } as any;

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      await service.confirmDelivery(mockUser, dto);

      expect(logRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        from_status: 'out_for_delivery',
        to_status: 'delivered',
        changedBy: { id: mockUser.id },
      }));
    });
  });

  // ===========================================================================
  // Get My Shipments Tests
  // ===========================================================================

  describe('📦 getMyShipments', () => {
    const mockUser = createUserToken();

    it('should return user shipments sorted by creation date', async () => {
      const shipments = [
        createSyrianShipment({ id: 2, createdAt: new Date('2025-01-15') }),
        createSyrianShipment({ id: 1, createdAt: new Date('2025-01-10') }),
      ];

      shipmentRepo.find.mockResolvedValue(shipments as Shipment[]);

      const result = await service.getMyShipments(mockUser);

      expect(result).toHaveLength(2);
      expect(shipmentRepo.find).toHaveBeenCalledWith({
        where: { order: { user: { id: mockUser.id } } },
        relations: ['items', 'order', 'shippingCompany'],
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array when user has no shipments', async () => {
      shipmentRepo.find.mockResolvedValue([]);

      const result = await service.getMyShipments(mockUser);

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // List All Shipments Tests
  // ===========================================================================

  describe('📋 listAllShipments', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      shipmentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should list all shipments without filters', async () => {
      const shipments = [
        createSyrianShipment({ id: 1 }),
        createSyrianShipment({ id: 2 }),
      ];

      mockQueryBuilder.getMany.mockResolvedValue(shipments);

      const result = await service.listAllShipments({});

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const shipments = [createSyrianShipment({ status: ShipmentStatus.DELIVERED })];

      mockQueryBuilder.getMany.mockResolvedValue(shipments);

      const result = await service.listAllShipments({ status: 'delivered' as any });

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'shipment.status = :status',
        { status: 'delivered' },
      );
    });

    it('should filter by order ID', async () => {
      const shipments = [createSyrianShipment({ id: 1 })];

      mockQueryBuilder.getMany.mockResolvedValue(shipments);

      const result = await service.listAllShipments({ order_id: 1 });

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'shipment.order.id = :orderId',
        { orderId: 1 },
      );
    });

    it('should filter by shipping company ID', async () => {
      const shipments = [createSyrianShipment({ id: 1 })];

      mockQueryBuilder.getMany.mockResolvedValue(shipments);

      const result = await service.listAllShipments({ shipping_company_id: 1 });

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'shipment.shippingCompany.id = :companyId',
        { companyId: 1 },
      );
    });

    it('should apply multiple filters', async () => {
      const shipments = [createSyrianShipment({ id: 1 })];

      mockQueryBuilder.getMany.mockResolvedValue(shipments);

      const result = await service.listAllShipments({
        status: 'out_for_delivery' as any,
        order_id: 1,
        shipping_company_id: 1,
      });

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  // ===========================================================================
  // Create Shipment For Order Tests
  // ===========================================================================

  describe('📦 createShipmentForOrder', () => {
    it('should create shipment for order without existing shipment', async () => {
      const order = createSyrianOrder() as Order;
      const createdShipment = createSyrianShipment();

      shipmentRepo.findOne.mockResolvedValue(null);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);

      const result = await service.createShipmentForOrder(order);

      expect(result).toBeDefined();
      expect(shipmentRepo.create).toHaveBeenCalledWith({
        order,
        deliveryAgent: order.user,
        status: 'CREATED',
      });
    });

    it('should return existing shipment if one already exists', async () => {
      const order = createSyrianOrder() as Order;
      const existingShipment = createSyrianShipment({ id: 5 });

      shipmentRepo.findOne.mockResolvedValue(existingShipment as Shipment);

      const result = await service.createShipmentForOrder(order);

      expect(result.id).toBe(5);
      expect(shipmentRepo.create).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Syrian Market Data Scenarios
  // ===========================================================================

  describe('🇸🇾 Syrian Market Data Scenarios', () => {
    it('should handle Damascus shipment with Arabic notes', async () => {
      const mockUser = createUserToken();
      const shipment = createSyrianShipment({
        internal_notes: 'Deliver to Malki district',
        internal_notes_ar: 'التوصيل إلى حي المالكي',
        customer_notes: 'Ring the bell twice',
        customer_notes_ar: 'اضغط الجرس مرتين',
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);

      const result = await service.getTrackingInfo(1);

      expect(result).toBeDefined();
    });

    it('should handle Aleppo shipment with COD', async () => {
      const shipment = createSyrianShipment({
        service_options: {
          serviceType: 'same_day',
          serviceName: 'Same Day Delivery',
          serviceNameAr: 'توصيل في نفس اليوم',
          isExpress: true,
          requiresSignature: true,
          cashOnDelivery: true,
          codAmount: 8500000, // SYP
          insuranceRequired: false,
          callBeforeDelivery: true,
          smsNotifications: true,
          whatsappNotifications: true,
          deliveryInstructions: 'Call 30 min before arrival',
          deliveryInstructionsAr: 'اتصل قبل الوصول بنصف ساعة',
        },
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);

      const result = await service.getTrackingInfo(1);

      expect(result).toBeDefined();
    });

    it('should handle multi-package shipment with fragile items', async () => {
      const shipment = createSyrianShipment({
        package_details: {
          weightKg: 5.5,
          dimensions: { length: 50, width: 40, height: 30 },
          declaredValue: 15000000, // SYP
          isFragile: true,
          requiresColdStorage: false,
          specialInstructions: 'Fragile electronics - handle with care',
          specialInstructionsAr: 'إلكترونيات حساسة - تعامل بحذر',
          contents: [
            { item: 'iPhone 15 Pro', itemAr: 'آيفون 15 برو', quantity: 1, value: 8500000 },
            { item: 'AirPods Pro', itemAr: 'إيربودز برو', quantity: 1, value: 1500000 },
          ],
        },
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);

      const result = await service.getTrackingInfo(1);

      expect(result).toBeDefined();
    });

    it('should handle Homs shipment with GPS coordinates', async () => {
      const mockUser = createUserToken({ role: 'delivery_agent' });
      const shipment = createSyrianShipment({
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        proof_data: {
          gpsCoordinates: { lat: 34.7324, lng: 36.7137 }, // Homs coordinates
        },
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);
      shipmentRepo.save.mockImplementation((s) => Promise.resolve(s as Shipment));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);

      const dto = {
        shipment_id: 1,
        proof_type: 'photo',
        proof_data: JSON.stringify({
          photoUrl: 'https://storage.souqsyria.com/delivery-proofs/homs-12345.jpg',
          gpsCoordinates: { lat: 34.7324, lng: 36.7137 },
          recipientName: 'Mohammad Hassan',
        }),
      } as any;

      const result = await service.confirmDelivery(mockUser, dto);

      expect(result).toBeDefined();
    });

    it('should handle Latakia coastal delivery with SLA tracking', async () => {
      const shipment = createSyrianShipment({
        sla_tracking: {
          slaHours: 48,
          expectedDeliveryTime: new Date('2025-01-16'),
          isOverdue: false,
          hoursOverdue: 0,
          escalationLevel: 0,
          performanceRating: 4.5,
          onTimeDelivery: true,
        },
      });

      shipmentRepo.findOne.mockResolvedValue(shipment as Shipment);

      const result = await service.getTrackingInfo(1);

      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================

  describe('⚠️ Edge Cases and Error Handling', () => {
    it('should handle unknown shipping company without provider', async () => {
      const mockUser = createUserToken();
      const dto = {
        order_id: 1,
        order_item_ids: [1],
        shipping_company_id: 1,
      };

      const unknownCompany = createSyrianShippingCompany({ name: 'Local Syrian Courier' });
      const createdShipment = createSyrianShipment();

      orderRepo.findOne.mockResolvedValue(createSyrianOrder() as Order);
      orderItemRepo.findByIds.mockResolvedValue([createSyrianOrderItem()] as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(unknownCompany as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      const result = await service.createShipment(mockUser, dto);

      // Neither Aramex nor DHL should be called
      expect(aramexProvider.registerShipment).not.toHaveBeenCalled();
      expect(dhlProvider.registerShipment).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle shipping company with null name', async () => {
      const mockUser = createUserToken();
      const dto = {
        order_id: 1,
        order_item_ids: [1],
        shipping_company_id: 1,
      };

      const companyWithNullName = createSyrianShippingCompany({ name: undefined });
      const createdShipment = createSyrianShipment();

      orderRepo.findOne.mockResolvedValue(createSyrianOrder() as Order);
      orderItemRepo.findByIds.mockResolvedValue([createSyrianOrderItem()] as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(companyWithNullName as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
    });

    it('should handle shipment with no estimated delivery date', async () => {
      const mockUser = createUserToken();
      const dto = {
        order_id: 1,
        order_item_ids: [1],
        shipping_company_id: 1,
        // No estimated_delivery_at provided
      };

      const createdShipment = createSyrianShipment({ estimated_delivery_at: null });

      orderRepo.findOne.mockResolvedValue(createSyrianOrder() as Order);
      orderItemRepo.findByIds.mockResolvedValue([createSyrianOrderItem()] as OrderItem[]);
      companyRepo.findOne.mockResolvedValue(createSyrianShippingCompany() as ShippingCompany);
      shipmentRepo.create.mockReturnValue(createdShipment as Shipment);
      shipmentRepo.save.mockResolvedValue(createdShipment as Shipment);
      shipmentItemRepo.create.mockImplementation((data) => data as ShipmentItem);
      shipmentItemRepo.save.mockImplementation((item) => Promise.resolve(item as ShipmentItem));
      logRepo.save.mockResolvedValue({} as ShipmentStatusLog);
      aramexProvider.registerShipment.mockResolvedValue({
        trackingCode: 'SY-ARAMEX-001',
        trackingUrl: 'https://tracking.aramex.com/SY-ARAMEX-001',
        status: 'registered',
      });
      shipmentRepo.findOne.mockResolvedValue(createdShipment as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result.estimated_delivery_at).toBeNull();
    });
  });
});
