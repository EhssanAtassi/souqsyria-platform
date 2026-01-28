/**
 * ✅ PRODUCTION LOGGER SERVICE FOR SOUQSYRIA
 *
 * Purpose: Replace console.log with structured logging for production
 *
 * What it does:
 * - Saves logs to files (for backup)
 * - Formats logs as JSON (for analysis)
 * - Adds timestamps and metadata automatically
 * - Separates error logs from info logs
 * - Ready for ELK Stack integration
 *
 * Why we need it:
 * - Console logs disappear when server restarts
 * - Hard to search through console logs
 * - Production needs proper log management
 * - Better debugging and monitoring
 *
 * @author SouqSyria Engineering Team
 */

import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs'; // ✅ Correct
@Injectable()
export class ProductionLoggerService {
  private readonly nestLogger = new Logger(ProductionLoggerService.name);
  private readonly winstonLogger: winston.Logger;

  constructor() {
    this.nestLogger.log('🚀 Initializing production logger for SouqSyria');

    // Create Winston logger with multiple outputs
    this.winstonLogger = winston.createLogger({
      level: 'info', // Log everything from 'info' level and above

      // Format: How logs should look
      format: winston.format.combine(
        winston.format.timestamp(), // Add timestamp to each log
        winston.format.errors({ stack: true }), // Include error stack traces
        winston.format.json(), // Format as JSON for easy parsing
      ),

      // Metadata: Add this info to every log automatically
      defaultMeta: {
        service: 'souqsyria-audit',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },

      // Transports: Where to send the logs
      transports: [
        // 1. Console output (for development)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(), // Add colors
            winston.format.simple(), // Simple readable format
          ),
        }),

        // 2. Error file (only errors and critical issues)
        new winston.transports.File({
          filename: 'logs/souqsyria-errors.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB max file size
          maxFiles: 5, // Keep 5 old files
        }),

        // 3. Combined file (all logs)
        new winston.transports.File({
          filename: 'logs/souqsyria-combined.log',
          maxsize: 50 * 1024 * 1024, // 50MB max file size
          maxFiles: 10, // Keep 10 old files
        }),
      ],
    });

    this.nestLogger.log('✅ Production logger initialized successfully');
  }

  // ================================
  // MAIN LOGGING METHODS
  // ================================

  /**
   * ✅ LOG INFO: For general information
   * Use for: Successful operations, status updates
   */
  info(message: string, meta?: any) {
    this.winstonLogger.info(message, meta);
  }

  /**
   * ✅ LOG ERROR: For errors and failures
   * Use for: API failures, database errors, system issues
   */
  error(message: string, error?: Error, meta?: any) {
    this.winstonLogger.error(message, {
      error: error
        ? {
            message: (error as Error).message,
            stack: (error as Error).stack,
            name: error.name,
          }
        : undefined,
      ...meta,
    });
  }

  /**
   * ✅ LOG WARNING: For potential issues
   * Use for: Deprecated features, slow operations, unusual activity
   */
  warn(message: string, meta?: any) {
    this.winstonLogger.warn(message, meta);
  }

  /**
   * ✅ LOG DEBUG: For development debugging
   * Use for: Detailed operation info, performance tracking
   */
  debug(message: string, meta?: any) {
    this.winstonLogger.debug(message, meta);
  }

  // ================================
  // SOUQSYRIA SPECIFIC METHODS
  // ================================

  /**
   * ✅ LOG AUDIT EVENT: Specifically for audit log operations
   */
  logAuditEvent(
    action: string,
    userId: number | null,
    success: boolean,
    timingMs: number,
    meta?: any,
  ) {
    const level = success ? 'info' : 'error';
    const message = `Audit: ${action} by user:${userId} - ${success ? 'SUCCESS' : 'FAILED'} (${timingMs}ms)`;

    this.winstonLogger.log(level, message, {
      category: 'audit',
      action,
      userId,
      success,
      timingMs,
      ...meta,
    });
  }

  /**
   * ✅ LOG SECURITY EVENT: For security-related activities
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
  ) {
    this.winstonLogger.warn(`Security: ${event}`, {
      category: 'security',
      severity,
      ...details,
    });
  }

  /**
   * ✅ LOG PERFORMANCE: For performance monitoring
   */
  logPerformance(operation: string, durationMs: number, meta?: any) {
    const level = durationMs > 1000 ? 'warn' : 'info'; // Warn if over 1 second

    this.winstonLogger.log(
      level,
      `Performance: ${operation} took ${durationMs}ms`,
      {
        category: 'performance',
        operation,
        durationMs,
        ...meta,
      },
    );
  }

  /**
   * ✅ LOG BUSINESS EVENT: For important business operations
   */
  logBusinessEvent(
    event: string,
    amount?: number,
    currency?: string,
    meta?: any,
  ) {
    this.winstonLogger.info(`Business: ${event}`, {
      category: 'business',
      event,
      amount,
      currency,
      ...meta,
    });
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * ✅ GET RAW WINSTON LOGGER: For advanced usage
   */
  getWinstonLogger(): winston.Logger {
    return this.winstonLogger;
  }

  /**
   * ✅ CREATE LOG DIRECTORY: Ensure logs folder exists
   */

  private ensureLogDirectory() {
    const logDir = 'logs';

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      this.nestLogger.log(`📁 Created logs directory: ${logDir}`);
    }
  }
}

/**
 * ✅ USAGE EXAMPLES:
 *
 * // In your services:
 * constructor(private readonly logger: ProductionLoggerService) {}
 *
 * // Log audit events:
 * this.logger.logAuditEvent('order.create', userId, true, 25);
 *
 * // Log errors:
 * this.logger.error('Failed to save audit log', error, { orderId: 123 });
 *
 * // Log security events:
 * this.logger.logSecurityEvent('suspicious_login', 'high', { ip: '1.2.3.4' });
 *
 * // Log performance:
 * this.logger.logPerformance('database_query', 150, { query: 'SELECT...' });
 */
