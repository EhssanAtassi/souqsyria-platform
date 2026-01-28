/**
 * Enhanced Logging Configuration for Development
 *
 * Provides structured logging with Winston for better debugging
 * and development experience
 */

import * as winston from 'winston';

/**
 * Custom log format for development
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
    let log = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    // Add stack trace if present
    if (trace) {
      log += `\n${trace}`;
    }

    return log;
  }),
);

/**
 * Production-optimized JSON format
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

/**
 * Winston logger configuration
 * Use explicit typing for transports array to allow both Console and File transports
 */
const transports: winston.transport[] = [
  new winston.transports.Console({
    stderrLevels: ['error'],
  }),
];

/**
 * Add file transports in production
 */
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports,
};

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger(loggerConfig);

/**
 * Custom Logger Service for NestJS integration
 */
export class CustomLogger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  log(message: string, ...optionalParams: any[]) {
    logger.info(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  error(message: string, trace?: string, ...optionalParams: any[]) {
    logger.error(message, {
      context: this.context,
      trace,
      ...this.parseParams(optionalParams),
    });
  }

  warn(message: string, ...optionalParams: any[]) {
    logger.warn(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  debug(message: string, ...optionalParams: any[]) {
    logger.debug(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  verbose(message: string, ...optionalParams: any[]) {
    logger.verbose(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  /**
   * Parse optional parameters into metadata object
   */
  private parseParams(params: any[]): Record<string, any> {
    if (params.length === 0) return {};

    if (params.length === 1 && typeof params[0] === 'object') {
      return params[0];
    }

    return { additionalData: params };
  }
}
