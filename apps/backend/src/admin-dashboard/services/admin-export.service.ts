/**
 * @file admin-export.service.ts
 * @description Export service for generating downloadable reports in CSV, XLSX, and PDF formats.
 *              Handles async report generation with job tracking.
 * @module AdminDashboard/Services
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Entities - Using correct entity names
import { Order } from '../../orders/entities/order.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';
import { CommissionPayoutEntity, PayoutStatus } from '../../commissions/entites/commission-payout.entity';
import { VendorCommissionEntity } from '../../commissions/entites/vendor-commission.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';

// DTOs
import {
  ExportReportDto,
  ExportResultDto,
  ReportType,
  ExportFormat,
  DateRangeType,
} from '../dto';

/**
 * Export job status interface
 * @description Tracks the state and metadata of an export operation
 */
interface ExportJob {
  /** Unique job identifier */
  id: string;
  /** Current processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Type of report being generated */
  reportType: ReportType;
  /** Output file format */
  format: ExportFormat;
  /** Path to generated file */
  filePath?: string;
  /** Name of generated file */
  fileName?: string;
  /** Size of generated file in bytes */
  fileSize?: number;
  /** Number of records in report */
  recordCount?: number;
  /** Error message if failed */
  error?: string;
  /** Job creation timestamp */
  createdAt: Date;
  /** Job completion timestamp */
  completedAt?: Date;
  /** File expiration timestamp */
  expiresAt?: Date;
}

/**
 * Admin Export Service
 * @description Handles report generation and export in various formats.
 *              Supports CSV, XLSX, and PDF exports with async processing.
 */
@Injectable()
export class AdminExportService {
  private readonly logger = new Logger(AdminExportService.name);
  private readonly exportJobs: Map<string, ExportJob> = new Map();
  private readonly exportDir = path.join(process.cwd(), 'exports');

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(CommissionPayoutEntity)
    private readonly commissionPayoutRepository: Repository<CommissionPayoutEntity>,

    @InjectRepository(VendorCommissionEntity)
    private readonly vendorCommissionRepository: Repository<VendorCommissionEntity>,

    @InjectRepository(RefundTransaction)
    private readonly refundRepository: Repository<RefundTransaction>,
  ) {
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  // ===========================================================================
  // EXPORT OPERATIONS
  // ===========================================================================

  /**
   * Create export job
   * @description Initiates an async export job and returns job details
   * @param dto - Export parameters including report type, format, and filters
   * @returns Export job result with job ID for tracking
   */
  async createExport(dto: ExportReportDto): Promise<ExportResultDto> {
    this.logger.log(`Creating export job: ${dto.reportType} as ${dto.format}`);

    // Generate unique job ID
    const jobId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create job entry
    const job: ExportJob = {
      id: jobId,
      status: 'pending',
      reportType: dto.reportType,
      format: dto.format,
      createdAt: new Date(),
    };

    this.exportJobs.set(jobId, job);

    // Process export asynchronously
    this.processExport(jobId, dto).catch(error => {
      this.logger.error(`Export job ${jobId} failed: ${(error as Error).message}`);
      const failedJob = this.exportJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = (error as Error).message;
      }
    });

    return this.getExportResult(jobId);
  }

  /**
   * Get export job status
   * @description Retrieves current status of an export job
   * @param jobId - Export job ID to query
   * @returns Export job result with current status
   * @throws BadRequestException if job not found
   */
  async getExportStatus(jobId: string): Promise<ExportResultDto> {
    if (!this.exportJobs.has(jobId)) {
      throw new BadRequestException(`Export job ${jobId} not found`);
    }

    return this.getExportResult(jobId);
  }

  /**
   * Get export file path
   * @description Returns the file path for a completed export
   * @param jobId - Export job ID
   * @returns File path or null if not ready
   */
  getExportFilePath(jobId: string): string | null {
    const job = this.exportJobs.get(jobId);
    if (job?.status === 'completed' && job.filePath) {
      return job.filePath;
    }
    return null;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Process export job
   * @description Main processing logic for export jobs
   * @param jobId - Job ID to process
   * @param dto - Export parameters
   */
  private async processExport(jobId: string, dto: ExportReportDto): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    this.logger.log(`Processing export job ${jobId}`);

    try {
      // Get date range
      const { startDate, endDate } = this.getDateRange(dto);

      // Fetch data based on report type
      const data = await this.fetchReportData(dto.reportType, startDate, endDate, dto.vendorIds);

      // Generate file
      const fileName = this.generateFileName(dto.reportType, dto.format);
      const filePath = path.join(this.exportDir, fileName);

      await this.generateFile(data, dto.format, filePath, dto.columns);

      // Get file stats
      const stats = fs.statSync(filePath);

      // Update job with completion details
      job.status = 'completed';
      job.filePath = filePath;
      job.fileName = fileName;
      job.fileSize = stats.size;
      job.recordCount = Array.isArray(data) ? data.length : 0;
      job.completedAt = new Date();
      job.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      this.logger.log(`Export job ${jobId} completed: ${fileName}`);
    } catch (error: unknown) {
      job.status = 'failed';
      job.error = (error as Error).message;
      throw error;
    }
  }

  /**
   * Fetch report data based on type
   * @description Routes to appropriate data fetcher based on report type
   * @param reportType - Type of report to generate
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @param vendorIds - Optional vendor filter
   * @returns Array of report data
   */
  private async fetchReportData(
    reportType: ReportType,
    startDate: Date,
    endDate: Date,
    vendorIds?: number[],
  ): Promise<any[]> {
    switch (reportType) {
      case ReportType.SALES:
        return this.fetchSalesData(startDate, endDate);

      case ReportType.ORDERS:
        return this.fetchOrdersData(startDate, endDate);

      case ReportType.PRODUCTS:
        return this.fetchProductsData(vendorIds);

      case ReportType.VENDORS:
        return this.fetchVendorsData();

      case ReportType.USERS:
        return this.fetchUsersData(startDate, endDate);

      case ReportType.COMMISSIONS:
        return this.fetchCommissionsData(startDate, endDate, vendorIds);

      case ReportType.REFUNDS:
        return this.fetchRefundsData(startDate, endDate);

      default:
        throw new BadRequestException(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Fetch sales report data
   * @description Aggregates sales data by order with customer details
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @returns Sales report data array
   */
  private async fetchSalesData(startDate: Date, endDate: Date): Promise<any[]> {
    // Order entity uses snake_case fields: created_at, total_amount, payment_status, payment_method
    const query = this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id as orderId',
        'o.total_amount as totalAmount',
        'o.status as status',
        'o.payment_status as paymentStatus',
        'o.created_at as orderDate',
        'u.fullName as customerName',
        'u.email as customerEmail',
      ])
      .leftJoin('o.user', 'u')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('o.created_at', 'DESC');

    return query.getRawMany();
  }

  /**
   * Fetch orders report data
   * @description Retrieves detailed order information with items
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @returns Orders report data array
   */
  private async fetchOrdersData(startDate: Date, endDate: Date): Promise<any[]> {
    // Order entity uses snake_case: created_at, total_amount
    // User entity uses fullName (not firstName/lastName)
    // Order uses 'items' relation, not 'orderItems'
    const orders = await this.orderRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
      relations: ['user', 'items'],
      order: { created_at: 'DESC' },
    });

    return orders.map(o => ({
      orderId: o.id,
      orderNumber: `ORD-${o.id}`,
      customerName: o.user?.fullName || 'Guest',
      customerEmail: o.user?.email || 'N/A',
      itemsCount: o.items?.length || 0,
      totalAmount: Number(o.total_amount) || 0,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      shippingCity: o.shippingCity || 'N/A',
      shippingRegion: o.shippingRegion || 'N/A',
      orderDate: o.created_at,
    }));
  }

  /**
   * Fetch products report data
   * @description Retrieves product catalog with category and vendor info
   * @param vendorIds - Optional vendor filter
   * @returns Products report data array
   */
  private async fetchProductsData(vendorIds?: number[]): Promise<any[]> {
    // ProductEntity uses: nameEn, nameAr, sku, approvalStatus, status
    // Note: ProductEntity doesn't have direct price/stock - uses pricing relation
    // VendorEntity uses: storeName (not shopNameEn)
    const queryBuilder = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.vendor', 'vendor')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.pricing', 'pricing')
      .orderBy('p.createdAt', 'DESC');

    if (vendorIds?.length) {
      queryBuilder.andWhere('vendor.id IN (:...vendorIds)', { vendorIds });
    }

    const products = await queryBuilder.getMany();

    return products.map(p => ({
      sku: p.sku || 'N/A',
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      category: p.category?.nameEn || 'N/A',
      brand: p.brand?.name || 'N/A',
      vendor: p.vendor?.storeName || 'Platform Product',
      // Price from pricing relation (uses basePrice and discountPrice fields)
      price: p.pricing?.basePrice || 'N/A',
      salePrice: p.pricing?.discountPrice || 'N/A',
      currency: p.currency || 'SYP',
      status: p.status,
      approvalStatus: p.approvalStatus,
      isFeatured: p.isFeatured ? 'Yes' : 'No',
      isBestSeller: p.isBestSeller ? 'Yes' : 'No',
      salesCount: p.salesCount || 0,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Fetch vendors report data
   * @description Retrieves vendor list with owner and commission info
   * @returns Vendors report data array
   */
  private async fetchVendorsData(): Promise<any[]> {
    // VendorEntity uses: storeName (not shopNameEn/shopNameAr)
    // VendorEntity uses: user relation (not owner)
    // VendorEntity uses: isVerified boolean (not verificationStatus)
    // Commission rate is in VendorCommissionEntity, not on Vendor
    const vendors = await this.vendorRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    // Get commission rates for all vendors
    const vendorIds = vendors.map(v => v.id);
    const commissionRates = await this.getVendorCommissionRates(vendorIds);

    // Get product counts and order counts
    const vendorStats = await this.getVendorStats(vendorIds);

    return vendors.map(v => ({
      vendorId: v.id,
      storeName: v.storeName || 'N/A',
      storeDescription: v.storeDescription || 'N/A',
      ownerName: v.user?.fullName || 'N/A',
      ownerEmail: v.user?.email || 'N/A',
      ownerPhone: v.user?.phone || 'N/A',
      verificationStatus: v.isVerified ? 'Verified' : 'Pending',
      commissionRate: commissionRates.get(v.id) || 'Default',
      totalProducts: vendorStats.get(v.id)?.productCount || 0,
      totalOrders: vendorStats.get(v.id)?.orderCount || 0,
      createdAt: v.createdAt,
    }));
  }

  /**
   * Fetch users report data
   * @description Retrieves user list with account status
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @returns Users report data array
   */
  private async fetchUsersData(startDate: Date, endDate: Date): Promise<any[]> {
    // User entity uses: fullName (not firstName/lastName)
    // User entity uses: isBanned, isSuspended, isVerified (not status)
    // User entity uses: role relation (single, not roles array)
    const users = await this.userRepository.find({
      where: { createdAt: Between(startDate, endDate) },
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });

    return users.map(u => ({
      userId: u.id,
      fullName: u.fullName || 'N/A',
      email: u.email || 'N/A',
      phone: u.phone || 'N/A',
      role: u.role?.name || 'No Role',
      accountStatus: this.getUserStatus(u),
      emailVerified: u.isVerified ? 'Yes' : 'No',
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || 'Never',
    }));
  }

  /**
   * Fetch commissions report data
   * @description Retrieves commission payout history
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @param vendorIds - Optional vendor filter
   * @returns Commissions report data array
   */
  private async fetchCommissionsData(
    startDate: Date,
    endDate: Date,
    vendorIds?: number[],
  ): Promise<any[]> {
    // Using CommissionPayoutEntity instead of non-existent CommissionRecord
    let queryBuilder = this.commissionPayoutRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vendor', 'v')
      .where('p.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('p.createdAt', 'DESC');

    if (vendorIds?.length) {
      queryBuilder = queryBuilder.andWhere('v.id IN (:...vendorIds)', { vendorIds });
    }

    const payouts = await queryBuilder.getMany();

    return payouts.map(p => ({
      payoutId: p.id,
      vendorName: p.vendor?.storeName || 'N/A',
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      grossAmount: Number(p.grossAmount) || 0,
      deductionsAmount: Number(p.deductionsAmount) || 0,
      taxAmount: Number(p.taxAmount) || 0,
      netAmount: Number(p.netAmount) || 0,
      currency: p.currency || 'SYP',
      orderCount: p.orderCount || 0,
      status: p.status,
      payoutMethod: p.payoutMethod || 'N/A',
      scheduledDate: p.scheduledDate || 'N/A',
      processedDate: p.processedDate || 'Not Processed',
      createdAt: p.createdAt,
    }));
  }

  /**
   * Fetch refunds report data
   * @description Retrieves refund transaction history
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @returns Refunds report data array
   */
  private async fetchRefundsData(startDate: Date, endDate: Date): Promise<any[]> {
    // RefundTransaction uses: created_at (snake_case)
    // RefundTransaction uses: reason_code, notes (not reason)
    // RefundTransaction uses: refunded_at (not processedAt)
    // RefundTransaction has: processedBy (User relation)
    const refunds = await this.refundRepository.find({
      where: { created_at: Between(startDate, endDate) },
      relations: ['order', 'order.user', 'processedBy'],
      order: { created_at: 'DESC' },
    });

    return refunds.map(r => ({
      refundId: r.id,
      orderId: r.order?.id || 'N/A',
      orderNumber: r.order ? `ORD-${r.order.id}` : 'N/A',
      customerName: r.order?.user?.fullName || 'N/A',
      amount: Number(r.amount) || 0,
      method: r.method,
      reasonCode: r.reason_code || 'N/A',
      notes: r.notes || 'N/A',
      status: r.status,
      processedBy: r.processedBy?.fullName || 'Not Processed',
      requestedAt: r.created_at,
      refundedAt: r.refunded_at || 'Not Refunded',
    }));
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Get vendor commission rates
   * @description Fetches current commission rates for multiple vendors
   * @param vendorIds - Array of vendor IDs
   * @returns Map of vendor ID to commission percentage
   */
  private async getVendorCommissionRates(vendorIds: number[]): Promise<Map<number, string>> {
    const rates = new Map<number, string>();

    if (vendorIds.length === 0) return rates;

    const commissions = await this.vendorCommissionRepository
      .createQueryBuilder('c')
      .where('c.vendor.id IN (:...vendorIds)', { vendorIds })
      .andWhere('c.valid_from <= :now', { now: new Date() })
      .andWhere('(c.valid_to IS NULL OR c.valid_to >= :now)', { now: new Date() })
      .leftJoinAndSelect('c.vendor', 'vendor')
      .getMany();

    commissions.forEach(c => {
      if (c.vendor) {
        rates.set(c.vendor.id, `${c.percentage}%`);
      }
    });

    return rates;
  }

  /**
   * Get vendor statistics
   * @description Fetches product and order counts for vendors
   * @param vendorIds - Array of vendor IDs
   * @returns Map of vendor ID to stats object
   */
  private async getVendorStats(vendorIds: number[]): Promise<Map<number, { productCount: number; orderCount: number }>> {
    const stats = new Map<number, { productCount: number; orderCount: number }>();

    if (vendorIds.length === 0) return stats;

    // Get product counts
    const productCounts = await this.productRepository
      .createQueryBuilder('p')
      .select('p.vendor.id', 'vendorId')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.vendor.id IN (:...vendorIds)', { vendorIds })
      .groupBy('p.vendor.id')
      .getRawMany();

    productCounts.forEach(row => {
      stats.set(row.vendorId, {
        productCount: parseInt(row.count) || 0,
        orderCount: 0,
      });
    });

    // Note: Order entity doesn't have direct vendor relation
    // Would need to aggregate through order items and products

    return stats;
  }

  /**
   * Get user account status string
   * @description Derives user status from boolean flags
   * @param user - User entity
   * @returns Status string
   */
  private getUserStatus(user: User): string {
    if (user.isBanned) return 'Banned';
    if (user.isSuspended) return 'Suspended';
    return 'Active';
  }

  /**
   * Generate file in specified format
   * @description Routes to appropriate file generator
   * @param data - Report data array
   * @param format - Output format
   * @param filePath - Output file path
   * @param columns - Optional column filter
   */
  private async generateFile(
    data: any[],
    format: ExportFormat,
    filePath: string,
    columns?: string[],
  ): Promise<void> {
    switch (format) {
      case ExportFormat.CSV:
        await this.generateCSV(data, filePath, columns);
        break;

      case ExportFormat.XLSX:
        // For XLSX, would use exceljs or similar library
        // For now, fall back to CSV
        await this.generateCSV(data, filePath.replace('.xlsx', '.csv'), columns);
        break;

      case ExportFormat.PDF:
        // For PDF, would use pdfkit or similar library
        // For now, create a simple text representation
        await this.generateTextFile(data, filePath.replace('.pdf', '.txt'));
        break;

      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate CSV file
   * @description Creates a CSV file from data array
   * @param data - Report data array
   * @param filePath - Output file path
   * @param columns - Optional column filter
   */
  private async generateCSV(data: any[], filePath: string, columns?: string[]): Promise<void> {
    if (data.length === 0) {
      fs.writeFileSync(filePath, '');
      return;
    }

    const keys = columns?.length ? columns : Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(item =>
      keys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return String(value);
      }).join(',')
    );

    const csv = [header, ...rows].join('\n');
    fs.writeFileSync(filePath, csv);
  }

  /**
   * Generate simple text file (placeholder for PDF)
   * @description Creates a JSON text file as PDF placeholder
   * @param data - Report data array
   * @param filePath - Output file path
   */
  private async generateTextFile(data: any[], filePath: string): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content);
  }

  /**
   * Generate file name
   * @description Creates timestamped filename for export
   * @param reportType - Type of report
   * @param format - Output format
   * @returns Generated filename
   */
  private generateFileName(reportType: ReportType, format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${reportType}-report-${timestamp}.${format}`;
  }

  /**
   * Get date range from parameters
   * @description Calculates start/end dates from DTO parameters
   * @param dto - Date range parameters
   * @returns Object with startDate and endDate
   */
  private getDateRange(dto: { dateRange?: DateRangeType; startDate?: string; endDate?: string }) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (dto.dateRange) {
      case DateRangeType.LAST_7_DAYS:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case DateRangeType.LAST_30_DAYS:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case DateRangeType.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case DateRangeType.CUSTOM:
        startDate = dto.startDate ? new Date(dto.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = dto.endDate ? new Date(dto.endDate) : new Date();
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  /**
   * Get export result from job
   * @description Converts internal job state to DTO
   * @param jobId - Job ID to convert
   * @returns Export result DTO
   */
  private getExportResult(jobId: string): ExportResultDto {
    const job = this.exportJobs.get(jobId);
    if (!job) {
      throw new BadRequestException(`Export job ${jobId} not found`);
    }

    return {
      exportId: job.id,
      status: job.status,
      downloadUrl: job.status === 'completed' ? `/api/admin-dashboard/exports/${job.id}/download` : undefined,
      fileName: job.fileName || '',
      fileSize: job.fileSize || 0,
      recordCount: job.recordCount || 0,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
    };
  }

  // ===========================================================================
  // QUICK CSV GENERATION (Returns CSV string directly)
  // ===========================================================================

  /**
   * Generate sales CSV data
   * @description Returns CSV string for sales data without file creation
   * @param query - Date range and filter parameters
   * @returns CSV string data
   */
  async generateSalesCsv(query: { dateRange?: DateRangeType; startDate?: string; endDate?: string }): Promise<string> {
    const { startDate, endDate } = this.getDateRange(query);
    const data = await this.fetchSalesData(startDate, endDate);
    return this.convertToCsv(data);
  }

  /**
   * Generate users CSV data
   * @description Returns CSV string for users data without file creation
   * @param query - Date range and filter parameters
   * @returns CSV string data
   */
  async generateUsersCsv(query: { dateRange?: DateRangeType; startDate?: string; endDate?: string }): Promise<string> {
    const { startDate, endDate } = this.getDateRange(query);
    const data = await this.fetchUsersData(startDate, endDate);
    return this.convertToCsv(data);
  }

  /**
   * Generate commissions CSV data
   * @description Returns CSV string for commissions data without file creation
   * @param query - Date range and filter parameters
   * @returns CSV string data
   */
  async generateCommissionsCsv(query: { dateRange?: DateRangeType; startDate?: string; endDate?: string; vendorIds?: number[] }): Promise<string> {
    const { startDate, endDate } = this.getDateRange(query);
    const data = await this.fetchCommissionsData(startDate, endDate, query.vendorIds);
    return this.convertToCsv(data);
  }

  /**
   * Convert data array to CSV string
   * @description Helper to convert data to CSV format
   * @param data - Array of data objects
   * @returns CSV formatted string
   */
  private convertToCsv(data: any[]): string {
    if (data.length === 0) return '';

    const keys = Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(item =>
      keys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return String(value);
      }).join(',')
    );

    return [header, ...rows].join('\n');
  }
}
