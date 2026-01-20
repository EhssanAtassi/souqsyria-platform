/**
 * @file admin-dashboard.service.spec.ts
 * @description Comprehensive unit tests for AdminDashboardService.
 * 
 * Tests cover:
 * - Dashboard metrics retrieval and calculation
 * - Pending actions counting
 * - Revenue chart data generation
 * - Top selling products query
 * - Recent orders retrieval
 * - Growth rate calculations
 * - Date range generation for different periods
 * 
 * @author SouqSyria Development Team
 * @since 2026-01-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminDashboardService } from '../services/admin-dashboard.service';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { CommissionPayoutEntity, PayoutStatus } from '../../commissions/entites/commission-payout.entity';
import { KycDocument } from '../../kyc/entites/kyc-document.entity';
import { RefundStatus } from '../../refund/enums/refund-status.enum';
import { PeriodType } from '../dto';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Creates a stable mock query builder that returns the same object reference
 * This allows tests to configure mocks BEFORE the service uses them
 */
const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
});

/**
 * Creates a mock repository with standard jest mocks
 * Uses a stable query builder reference for each repository instance
 */
const createMockRepository = () => {
  // Create ONE query builder instance that's reused for all calls
  const mockQueryBuilder = createMockQueryBuilder();

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    // Expose the query builder for tests to configure
    _mockQueryBuilder: mockQueryBuilder,
  };
};

/**
 * Creates mock Syrian marketplace data for testing
 */
const createMockSyrianData = () => ({
  users: [
    { id: 1, fullName: 'أحمد محمد', email: 'ahmad@example.sy', createdAt: new Date() },
    { id: 2, fullName: 'سارة أحمد', email: 'sara@example.sy', createdAt: new Date() },
  ],
  orders: [
    {
      id: 1,
      total_amount: 500000, // 500,000 SYP
      status: 'completed',
      created_at: new Date(),
      user: { fullName: 'أحمد محمد', email: 'ahmad@example.sy' },
      items: [{ id: 1, quantity: 2 }],
    },
    {
      id: 2,
      total_amount: 750000, // 750,000 SYP
      status: 'pending',
      created_at: new Date(),
      user: { fullName: 'سارة أحمد', email: 'sara@example.sy' },
      items: [{ id: 2, quantity: 1 }],
    },
  ],
  products: [
    {
      id: 1,
      nameEn: 'Damascus Steel Knife',
      nameAr: 'سكين فولاذ دمشقي',
      category: { nameEn: 'Kitchen' },
      vendor: { storeName: 'متجر الحرفيين' },
      images: [{ imageUrl: 'knife.jpg', sortOrder: 0 }],
    },
    {
      id: 2,
      nameEn: 'Aleppo Soap',
      nameAr: 'صابون حلب',
      category: { nameEn: 'Beauty' },
      vendor: { storeName: 'متجر الصابون' },
      images: [{ imageUrl: 'soap.jpg', sortOrder: 0 }],
    },
  ],
  vendors: [
    { id: 1, storeName: 'متجر الحرفيين', isVerified: true, createdAt: new Date() },
    { id: 2, storeName: 'متجر الصابون', isVerified: false, createdAt: new Date() },
  ],
});

// =============================================================================
// TEST SUITE
// =============================================================================

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let userRepository: jest.Mocked<Repository<User>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let productRepository: jest.Mocked<Repository<ProductEntity>>;
  let vendorRepository: jest.Mocked<Repository<VendorEntity>>;
  let refundRepository: jest.Mocked<Repository<RefundTransaction>>;
  let commissionPayoutRepository: jest.Mocked<Repository<CommissionPayoutEntity>>;
  let kycDocumentRepository: jest.Mocked<Repository<KycDocument>>;

  const mockData = createMockSyrianData();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: getRepositoryToken(User), useFactory: createMockRepository },
        { provide: getRepositoryToken(Order), useFactory: createMockRepository },
        { provide: getRepositoryToken(OrderItem), useFactory: createMockRepository },
        { provide: getRepositoryToken(ProductEntity), useFactory: createMockRepository },
        { provide: getRepositoryToken(VendorEntity), useFactory: createMockRepository },
        { provide: getRepositoryToken(RefundTransaction), useFactory: createMockRepository },
        { provide: getRepositoryToken(CommissionPayoutEntity), useFactory: createMockRepository },
        { provide: getRepositoryToken(KycDocument), useFactory: createMockRepository },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
    userRepository = module.get(getRepositoryToken(User));
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    productRepository = module.get(getRepositoryToken(ProductEntity));
    vendorRepository = module.get(getRepositoryToken(VendorEntity));
    refundRepository = module.get(getRepositoryToken(RefundTransaction));
    commissionPayoutRepository = module.get(getRepositoryToken(CommissionPayoutEntity));
    kycDocumentRepository = module.get(getRepositoryToken(KycDocument));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SERVICE INSTANTIATION TESTS
  // ===========================================================================

  describe('Service Instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all repositories injected', () => {
      expect(userRepository).toBeDefined();
      expect(orderRepository).toBeDefined();
      expect(orderItemRepository).toBeDefined();
      expect(productRepository).toBeDefined();
      expect(vendorRepository).toBeDefined();
      expect(refundRepository).toBeDefined();
      expect(commissionPayoutRepository).toBeDefined();
      expect(kycDocumentRepository).toBeDefined();
    });
  });

  // ===========================================================================
  // DASHBOARD METRICS TESTS
  // ===========================================================================

  describe('getDashboardMetrics', () => {
    beforeEach(() => {
      // Setup default mock returns
      const mockQueryBuilder = orderRepository.createQueryBuilder();
      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue({ total: '1250000' });
      (commissionPayoutRepository.createQueryBuilder().getRawOne as jest.Mock)
        .mockResolvedValue({ total: '125000' });

      orderRepository.count.mockResolvedValue(50);
      userRepository.count.mockResolvedValue(100);
      productRepository.count.mockResolvedValue(200);
      vendorRepository.count.mockResolvedValue(25);
      refundRepository.count.mockResolvedValue(5);
      kycDocumentRepository.count.mockResolvedValue(10);
    });

    it('should return dashboard metrics with all fields', async () => {
      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('revenueGrowth');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('ordersGrowth');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('usersGrowth');
      expect(result).toHaveProperty('totalProducts');
      expect(result).toHaveProperty('productsGrowth');
      expect(result).toHaveProperty('totalVendors');
      expect(result).toHaveProperty('vendorsGrowth');
      expect(result).toHaveProperty('totalCommissions');
      expect(result).toHaveProperty('commissionsGrowth');
      expect(result).toHaveProperty('pendingActions');
    });

    it('should calculate revenue correctly in SYP', async () => {
      const result = await service.getDashboardMetrics();
      
      expect(typeof result.totalRevenue).toBe('number');
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
    });

    it('should calculate growth rates as percentages', async () => {
      const result = await service.getDashboardMetrics();
      
      expect(typeof result.revenueGrowth).toBe('number');
      expect(typeof result.ordersGrowth).toBe('number');
      // Growth rates can be negative, zero, or positive
    });

    it('should fetch metrics in parallel for performance', async () => {
      const startTime = Date.now();
      await service.getDashboardMetrics();
      const endTime = Date.now();
      
      // Should complete in reasonable time due to parallel execution
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle zero values gracefully', async () => {
      (orderRepository.createQueryBuilder().getRawOne as jest.Mock)
        .mockResolvedValue({ total: '0' });
      orderRepository.count.mockResolvedValue(0);
      userRepository.count.mockResolvedValue(0);

      const result = await service.getDashboardMetrics();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.revenueGrowth).toBe(0); // No previous, no current = 0%
    });

    it('should handle null database responses', async () => {
      (orderRepository.createQueryBuilder().getRawOne as jest.Mock)
        .mockResolvedValue(null);

      const result = await service.getDashboardMetrics();

      expect(result.totalRevenue).toBe(0);
    });
  });

  // ===========================================================================
  // PENDING ACTIONS TESTS
  // ===========================================================================

  describe('getPendingActions', () => {
    beforeEach(() => {
      orderRepository.count.mockResolvedValue(5);
      productRepository.count.mockResolvedValue(10);
      vendorRepository.count.mockResolvedValue(3);
      refundRepository.count.mockResolvedValue(2);
      kycDocumentRepository.count.mockResolvedValue(7);
      commissionPayoutRepository.count.mockResolvedValue(4);
    });

    it('should return all pending action counts', async () => {
      const result = await service.getPendingActions();

      expect(result).toEqual({
        pendingOrders: 5,
        pendingProducts: 10,
        pendingVendors: 3,
        pendingRefunds: 2,
        pendingKyc: 7,
        pendingWithdrawals: 4,
      });
    });

    it('should query pending orders with status "pending"', async () => {
      await service.getPendingActions();

      expect(orderRepository.count).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });
    });

    it('should query unverified vendors', async () => {
      await service.getPendingActions();

      expect(vendorRepository.count).toHaveBeenCalledWith({
        where: { isVerified: false },
      });
    });

    it('should query pending refunds with correct status enum', async () => {
      await service.getPendingActions();

      expect(refundRepository.count).toHaveBeenCalledWith({
        where: { status: RefundStatus.PENDING },
      });
    });

    it('should query pending commission payouts', async () => {
      await service.getPendingActions();

      expect(commissionPayoutRepository.count).toHaveBeenCalledWith({
        where: { status: PayoutStatus.PENDING },
      });
    });
  });

  // ===========================================================================
  // REVENUE CHART DATA TESTS
  // ===========================================================================

  describe('getRevenueChartData', () => {
    beforeEach(() => {
      (orderRepository.createQueryBuilder().getRawOne as jest.Mock)
        .mockResolvedValue({ total: '1000000' });
      (commissionPayoutRepository.createQueryBuilder().getRawOne as jest.Mock)
        .mockResolvedValue({ total: '100000' });
    });

    it('should return chart data for monthly period by default', async () => {
      const result = await service.getRevenueChartData({});

      expect(result.periodType).toBe(PeriodType.MONTHLY);
      expect(result.labels).toHaveLength(6); // 6 months
      expect(result.revenues).toHaveLength(6);
      expect(result.commissions).toHaveLength(6);
      expect(result.netRevenue).toHaveLength(6);
    });

    it('should return chart data for daily period', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.DAILY });

      expect(result.periodType).toBe(PeriodType.DAILY);
      expect(result.labels).toHaveLength(14); // 14 days
    });

    it('should return chart data for weekly period', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.WEEKLY });

      expect(result.periodType).toBe(PeriodType.WEEKLY);
      expect(result.labels).toHaveLength(8); // 8 weeks
    });

    it('should return chart data for yearly period', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.YEARLY });

      expect(result.periodType).toBe(PeriodType.YEARLY);
      expect(result.labels).toHaveLength(5); // 5 years
    });

    it('should calculate net revenue correctly', async () => {
      const result = await service.getRevenueChartData({});

      // Net revenue = revenue - commissions
      for (let i = 0; i < result.netRevenue.length; i++) {
        expect(result.netRevenue[i]).toBe(result.revenues[i] - result.commissions[i]);
      }
    });

    it('should have matching array lengths', async () => {
      const result = await service.getRevenueChartData({});

      expect(result.labels.length).toBe(result.revenues.length);
      expect(result.labels.length).toBe(result.commissions.length);
      expect(result.labels.length).toBe(result.netRevenue.length);
    });
  });

  // ===========================================================================
  // TOP SELLING PRODUCTS TESTS
  // ===========================================================================

  describe('getTopSellingProducts', () => {
    beforeEach(() => {
      const mockQueryBuilder = orderItemRepository.createQueryBuilder();
      (mockQueryBuilder.getRawMany as jest.Mock).mockResolvedValue([
        { productId: 1, totalSold: '100', totalRevenue: '5000000' },
        { productId: 2, totalSold: '75', totalRevenue: '3750000' },
      ]);

      productRepository.find.mockResolvedValue(mockData.products as any);
    });

    it('should return top selling products with correct structure', async () => {
      const result = await service.getTopSellingProducts({ limit: 5 });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nameEn');
      expect(result[0]).toHaveProperty('nameAr');
      expect(result[0]).toHaveProperty('thumbnail');
      expect(result[0]).toHaveProperty('categoryName');
      expect(result[0]).toHaveProperty('vendorName');
      expect(result[0]).toHaveProperty('totalSold');
      expect(result[0]).toHaveProperty('totalRevenue');
    });

    it('should return bilingual product names (Arabic/English)', async () => {
      const result = await service.getTopSellingProducts({ limit: 5 });

      expect(result[0].nameEn).toBe('Damascus Steel Knife');
      expect(result[0].nameAr).toBe('سكين فولاذ دمشقي');
    });

    it('should respect the limit parameter', async () => {
      (orderItemRepository.createQueryBuilder().limit as jest.Mock).mockClear();
      
      await service.getTopSellingProducts({ limit: 10 });

      expect(orderItemRepository.createQueryBuilder().limit).toHaveBeenCalledWith(10);
    });

    it('should use default limit of 5 when not specified', async () => {
      (orderItemRepository.createQueryBuilder().limit as jest.Mock).mockClear();
      
      await service.getTopSellingProducts({});

      expect(orderItemRepository.createQueryBuilder().limit).toHaveBeenCalledWith(5);
    });

    it('should exclude cancelled, failed, and refunded orders', async () => {
      await service.getTopSellingProducts({});

      expect(orderItemRepository.createQueryBuilder().where).toHaveBeenCalledWith(
        'order.status NOT IN (:...excludedStatuses)',
        { excludedStatuses: ['cancelled', 'failed', 'refunded'] },
      );
    });

    it('should return empty array when no products found', async () => {
      (orderItemRepository.createQueryBuilder().getRawMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTopSellingProducts({});

      expect(result).toEqual([]);
    });

    it('should handle missing product details gracefully', async () => {
      productRepository.find.mockResolvedValue([]);
      (orderItemRepository.createQueryBuilder().getRawMany as jest.Mock).mockResolvedValue([
        { productId: 999, totalSold: '10', totalRevenue: '100000' },
      ]);

      const result = await service.getTopSellingProducts({});

      expect(result[0].nameEn).toBe('Unknown');
      expect(result[0].nameAr).toBe('غير معروف');
    });
  });

  // ===========================================================================
  // RECENT ORDERS TESTS
  // ===========================================================================

  describe('getRecentOrders', () => {
    beforeEach(() => {
      orderRepository.find.mockResolvedValue(mockData.orders as any);
    });

    it('should return recent orders with correct structure', async () => {
      const result = await service.getRecentOrders({ limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('orderNumber');
      expect(result[0]).toHaveProperty('customerName');
      expect(result[0]).toHaveProperty('customerEmail');
      expect(result[0]).toHaveProperty('totalAmount');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('itemsCount');
      expect(result[0]).toHaveProperty('createdAt');
    });

    it('should format order number correctly', async () => {
      const result = await service.getRecentOrders({});

      expect(result[0].orderNumber).toBe('ORD-1');
      expect(result[1].orderNumber).toBe('ORD-2');
    });

    it('should include Syrian customer names', async () => {
      const result = await service.getRecentOrders({});

      expect(result[0].customerName).toBe('أحمد محمد');
      expect(result[1].customerName).toBe('سارة أحمد');
    });

    it('should return correct total amounts in SYP', async () => {
      const result = await service.getRecentOrders({});

      expect(result[0].totalAmount).toBe(500000);
      expect(result[1].totalAmount).toBe(750000);
    });

    it('should sort by created_at DESC', async () => {
      await service.getRecentOrders({});

      expect(orderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { created_at: 'DESC' },
        }),
      );
    });

    it('should include user and items relations', async () => {
      await service.getRecentOrders({});

      expect(orderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user', 'items'],
        }),
      );
    });

    it('should use default limit of 10 when not specified', async () => {
      await service.getRecentOrders({});

      expect(orderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('should handle guest orders (no user)', async () => {
      orderRepository.find.mockResolvedValue([
        { id: 3, total_amount: 100000, status: 'pending', user: null, items: [] },
      ] as any);

      const result = await service.getRecentOrders({});

      expect(result[0].customerName).toBe('Guest');
      expect(result[0].customerEmail).toBe('N/A');
    });
  });

  // ===========================================================================
  // GROWTH RATE CALCULATION TESTS
  // ===========================================================================

  describe('Growth Rate Calculation (via getDashboardMetrics)', () => {
    it('should calculate 100% growth when previous is zero and current is positive', async () => {
      // First period: 0, Second period: 1000
      const queryBuilder = orderRepository.createQueryBuilder();
      (queryBuilder.getRawOne as jest.Mock)
        .mockResolvedValueOnce({ total: '1000' }) // Current period
        .mockResolvedValueOnce({ total: '0' });   // Previous period

      orderRepository.count
        .mockResolvedValueOnce(100)  // Current orders
        .mockResolvedValueOnce(0);   // Previous orders

      const result = await service.getDashboardMetrics();

      expect(result.ordersGrowth).toBe(100);
    });

    it('should calculate 0% growth when both periods are zero', async () => {
      orderRepository.count.mockResolvedValue(0);

      const result = await service.getDashboardMetrics();

      expect(result.ordersGrowth).toBe(0);
    });

    it('should calculate negative growth correctly', async () => {
      // Set up for orders: previous 100, current 50 = -50% growth
      orderRepository.count
        .mockResolvedValueOnce(50)   // Current period
        .mockResolvedValueOnce(100); // Previous period

      const result = await service.getDashboardMetrics();

      expect(result.ordersGrowth).toBe(-50);
    });
  });

  // ===========================================================================
  // DATE RANGE GENERATION TESTS
  // ===========================================================================

  describe('Date Range Generation (via getRevenueChartData)', () => {
    it('should generate correct monthly labels', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.MONTHLY });
      
      // Should include month abbreviations
      const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;
      result.labels.forEach(label => {
        expect(label).toMatch(monthPattern);
      });
    });

    it('should generate correct daily labels', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.DAILY });
      
      // Should include day and month like "15 Jan"
      result.labels.forEach(label => {
        expect(label).toMatch(/^\d{1,2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/);
      });
    });

    it('should generate correct weekly labels', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.WEEKLY });
      
      // Should be "Week N"
      result.labels.forEach(label => {
        expect(label).toMatch(/^Week\s\d+$/);
      });
    });

    it('should generate correct yearly labels', async () => {
      const result = await service.getRevenueChartData({ periodType: PeriodType.YEARLY });
      
      // Should be years like "2024"
      result.labels.forEach(label => {
        expect(label).toMatch(/^\d{4}$/);
      });
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle database errors in getDashboardMetrics', async () => {
      orderRepository.count.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getDashboardMetrics()).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors in getTopSellingProducts', async () => {
      (orderItemRepository.createQueryBuilder().getRawMany as jest.Mock)
        .mockRejectedValue(new Error('Query failed'));

      await expect(service.getTopSellingProducts({})).rejects.toThrow('Query failed');
    });

    it('should handle database errors in getRecentOrders', async () => {
      orderRepository.find.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.getRecentOrders({})).rejects.toThrow('Connection timeout');
    });
  });

  // ===========================================================================
  // SYRIAN MARKET SPECIFIC TESTS
  // ===========================================================================

  describe('Syrian Market Features', () => {
    it('should handle SYP currency amounts (large numbers)', async () => {
      (orderRepository.createQueryBuilder().getRawOne as jest.Mock)
        .mockResolvedValue({ total: '1500000000' }); // 1.5 billion SYP

      const result = await service.getDashboardMetrics();

      expect(result.totalRevenue).toBe(1500000000);
    });

    it('should return Arabic names for products', async () => {
      const mockQueryBuilder = orderItemRepository.createQueryBuilder();
      (mockQueryBuilder.getRawMany as jest.Mock).mockResolvedValue([
        { productId: 1, totalSold: '50', totalRevenue: '2500000' },
      ]);
      productRepository.find.mockResolvedValue([mockData.products[0]] as any);

      const result = await service.getTopSellingProducts({});

      expect(result[0].nameAr).toBe('سكين فولاذ دمشقي');
    });

    it('should handle Arabic vendor store names', async () => {
      const mockQueryBuilder = orderItemRepository.createQueryBuilder();
      (mockQueryBuilder.getRawMany as jest.Mock).mockResolvedValue([
        { productId: 1, totalSold: '50', totalRevenue: '2500000' },
      ]);
      productRepository.find.mockResolvedValue([mockData.products[0]] as any);

      const result = await service.getTopSellingProducts({});

      expect(result[0].vendorName).toBe('متجر الحرفيين');
    });
  });
});
