/**
 * @file global-exception.filter.ts
 * @description Global exception filter for standardized error responses across the API.
 *
 * This filter catches all exceptions and transforms them into a consistent
 * response format, making error handling predictable for frontend clients.
 *
 * Features:
 * - Standardized error response format
 * - Detailed error codes for client handling
 * - Environment-aware stack traces (dev only)
 * - Request metadata for debugging
 * - Integration with audit logging
 * - Syrian market error messages (Arabic/English support)
 *
 * @author SouqSyria Development Team
 * @since 2026-01-20
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * Standard error codes for client-side handling
 * These codes help frontend applications display appropriate error messages
 */
export enum ErrorCodes {
  // Validation errors (400)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED = 'ACCOUNT_BANNED',

  // Resource errors (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  VENDOR_NOT_FOUND = 'VENDOR_NOT_FOUND',

  // Conflict errors (409)
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Business logic errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  COMMISSION_ERROR = 'COMMISSION_ERROR',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * Standard API error response interface
 * Ensures consistent error response format across all endpoints
 */
export interface ApiErrorResponse {
  /** Always false for error responses */
  success: false;

  /** Error details */
  error: {
    /** Machine-readable error code from ErrorCodes enum */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Arabic translation of error message (for Syrian market) */
    messageAr?: string;

    /** Additional error details (validation errors, field-specific errors) */
    details?: any;

    /** Path to the field that caused the error (for validation errors) */
    field?: string;
  };

  /** ISO timestamp of when the error occurred */
  timestamp: string;

  /** Request path that caused the error */
  path: string;

  /** Unique request ID for tracking in logs */
  requestId: string;

  /** Stack trace (only in development mode) */
  stack?: string;
}

/**
 * Global Exception Filter
 *
 * Catches all exceptions thrown in the application and transforms them
 * into a standardized error response format. This ensures consistent
 * error handling across all API endpoints.
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * Map of HTTP status codes to default error codes
   */
  private readonly statusToErrorCode: Record<number, ErrorCodes> = {
    [HttpStatus.BAD_REQUEST]: ErrorCodes.VALIDATION_FAILED,
    [HttpStatus.UNAUTHORIZED]: ErrorCodes.UNAUTHORIZED,
    [HttpStatus.FORBIDDEN]: ErrorCodes.FORBIDDEN,
    [HttpStatus.NOT_FOUND]: ErrorCodes.RESOURCE_NOT_FOUND,
    [HttpStatus.CONFLICT]: ErrorCodes.RESOURCE_CONFLICT,
    [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCodes.BUSINESS_RULE_VIOLATION,
    [HttpStatus.TOO_MANY_REQUESTS]: ErrorCodes.RATE_LIMIT_EXCEEDED,
    [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCodes.INTERNAL_ERROR,
  };

  /**
   * Arabic error messages for Syrian market support
   */
  private readonly errorMessagesAr: Record<string, string> = {
    [ErrorCodes.VALIDATION_FAILED]: 'البيانات المدخلة غير صالحة',
    [ErrorCodes.UNAUTHORIZED]: 'يرجى تسجيل الدخول للمتابعة',
    [ErrorCodes.FORBIDDEN]: 'ليس لديك صلاحية للوصول إلى هذا المورد',
    [ErrorCodes.RESOURCE_NOT_FOUND]: 'المورد المطلوب غير موجود',
    [ErrorCodes.INSUFFICIENT_STOCK]: 'الكمية المطلوبة غير متوفرة في المخزون',
    [ErrorCodes.PAYMENT_FAILED]: 'فشلت عملية الدفع',
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'تم تجاوز الحد الأقصى للطلبات',
    [ErrorCodes.INTERNAL_ERROR]: 'حدث خطأ داخلي. يرجى المحاولة لاحقاً',
    [ErrorCodes.DUPLICATE_ENTRY]: 'هذا العنصر موجود بالفعل',
    [ErrorCodes.ACCOUNT_SUSPENDED]: 'تم تعليق حسابك مؤقتاً',
    [ErrorCodes.ACCOUNT_BANNED]: 'تم حظر حسابك',
  };

  /**
   * Catches and handles all exceptions
   *
   * @param exception - The thrown exception
   * @param host - The arguments host containing request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorCode, message, details } =
      this.extractErrorInfo(exception);
    const requestId = this.generateRequestId();

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: message,
        messageAr: this.errorMessagesAr[errorCode],
        details: details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: requestId,
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log the error with appropriate severity
    this.logError(exception, request, status, requestId);

    response.status(status).json(errorResponse);
  }

  /**
   * Extracts error information from various exception types
   *
   * @param exception - The thrown exception
   * @returns Extracted error information
   */
  private extractErrorInfo(exception: unknown): {
    status: number;
    errorCode: string;
    message: string;
    details?: any;
  } {
    // Handle HTTP exceptions (NestJS built-in exceptions)
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Handle TypeORM QueryFailedError (database errors)
    if (exception instanceof QueryFailedError) {
      return this.handleQueryFailedError(exception);
    }

    // Handle TypeORM EntityNotFoundError
    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: 'The requested resource was not found',
      };
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCodes.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === 'development'
            ? exception.message
            : 'An internal server error occurred',
      };
    }

    // Handle unknown exceptions
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    };
  }

  /**
   * Handles NestJS HTTP exceptions
   *
   * @param exception - The HTTP exception
   * @returns Extracted error information
   */
  private handleHttpException(exception: HttpException): {
    status: number;
    errorCode: string;
    message: string;
    details?: any;
  } {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string;
    let details: any;
    let errorCode = this.statusToErrorCode[status] || ErrorCodes.INTERNAL_ERROR;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object') {
      const responseObj = response as any;

      // Handle class-validator validation errors
      if (responseObj.message && Array.isArray(responseObj.message)) {
        message = 'Validation failed';
        details = {
          validationErrors: responseObj.message.map((msg: string) => ({
            message: msg,
            field: this.extractFieldFromValidationMessage(msg),
          })),
        };
        errorCode = ErrorCodes.VALIDATION_FAILED;
      } else {
        message =
          responseObj.message || responseObj.error || 'An error occurred';
        if (responseObj.error && responseObj.error !== message) {
          details = { error: responseObj.error };
        }
      }

      // Use custom error code if provided
      if (responseObj.errorCode) {
        errorCode = responseObj.errorCode;
      }
    } else {
      message = 'An error occurred';
    }

    return { status, errorCode, message, details };
  }

  /**
   * Handles TypeORM QueryFailedError
   *
   * @param exception - The query failed error
   * @returns Extracted error information
   */
  private handleQueryFailedError(exception: QueryFailedError): {
    status: number;
    errorCode: string;
    message: string;
    details?: any;
  } {
    const message = exception.message;

    // Handle duplicate entry errors (MySQL error code 1062)
    if (
      message.includes('Duplicate entry') ||
      message.includes('ER_DUP_ENTRY')
    ) {
      return {
        status: HttpStatus.CONFLICT,
        errorCode: ErrorCodes.DUPLICATE_ENTRY,
        message: 'A resource with this identifier already exists',
        details:
          process.env.NODE_ENV === 'development'
            ? { originalError: message }
            : undefined,
      };
    }

    // Handle foreign key constraint errors
    if (
      message.includes('foreign key constraint') ||
      message.includes('ER_NO_REFERENCED_ROW')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.BUSINESS_RULE_VIOLATION,
        message: 'Referenced resource does not exist',
        details:
          process.env.NODE_ENV === 'development'
            ? { originalError: message }
            : undefined,
      };
    }

    // Generic database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCodes.DATABASE_ERROR,
      message:
        process.env.NODE_ENV === 'development'
          ? `Database error: ${message}`
          : 'A database error occurred',
    };
  }

  /**
   * Extracts field name from validation error message
   *
   * @param message - The validation error message
   * @returns The field name if found
   */
  private extractFieldFromValidationMessage(
    message: string,
  ): string | undefined {
    // Common patterns: "email must be...", "price should not be..."
    const match = message.match(/^(\w+)\s+(must|should|is|cannot)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Generates a unique request ID for tracking
   *
   * @returns Unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logs the error with appropriate severity
   *
   * @param exception - The thrown exception
   * @param request - The HTTP request
   * @param status - The HTTP status code
   * @param requestId - The unique request ID
   */
  private logError(
    exception: unknown,
    request: Request,
    status: number,
    requestId: string,
  ): void {
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id,
    };

    // Determine log level based on status code
    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.log(
        `[${requestId}] ${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    }
  }
}

/**
 * Custom exception class for business logic violations
 * Use this when business rules prevent an operation from completing
 */
export class BusinessRuleException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCodes = ErrorCodes.BUSINESS_RULE_VIOLATION,
    details?: any,
  ) {
    super(
      {
        message,
        errorCode,
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Custom exception for insufficient stock scenarios
 */
export class InsufficientStockException extends BusinessRuleException {
  constructor(productId: number, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      ErrorCodes.INSUFFICIENT_STOCK,
      { productId, requested, available },
    );
  }
}

/**
 * Custom exception for payment failures
 */
export class PaymentFailedException extends BusinessRuleException {
  constructor(message: string, paymentDetails?: any) {
    super(message, ErrorCodes.PAYMENT_FAILED, paymentDetails);
  }
}
