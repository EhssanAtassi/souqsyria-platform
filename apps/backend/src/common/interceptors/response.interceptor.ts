/**
 * @file response.interceptor.ts
 * @description Global response interceptor for standardized API responses.
 *
 * This interceptor wraps all successful responses in a consistent format,
 * making it easier for frontend clients to handle API responses.
 *
 * Features:
 * - Standardized success response format
 * - Automatic pagination metadata extraction
 * - Request timing information
 * - Path and timestamp inclusion
 * - Excludes certain paths (health checks, swagger)
 *
 * Response Format:
 * {
 *   success: true,
 *   data: <response data>,
 *   meta?: { pagination, timing },
 *   timestamp: "ISO date string",
 *   path: "/api/endpoint"
 * }
 *
 * @author SouqSyria Development Team
 * @since 2026-01-20
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';

/**
 * Decorator key for skipping response transformation
 */
export const SKIP_RESPONSE_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * Standard API success response interface
 */
export interface ApiResponse<T> {
  /** Always true for success responses */
  success: true;

  /** The response data */
  data: T;

  /** Optional metadata (pagination, timing, etc.) */
  meta?: {
    /** Pagination information if applicable */
    pagination?: PaginationMeta;

    /** Request timing information */
    timing?: {
      /** Time taken to process the request in milliseconds */
      processingTimeMs: number;
    };

    /** Additional metadata from the response */
    [key: string]: any;
  };

  /** ISO timestamp of the response */
  timestamp: string;

  /** The request path */
  path: string;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  limit: number;

  /** Total number of items */
  total: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Paginated response interface (for services to return)
 */
export interface PaginatedResponse<T> {
  /** The items for the current page */
  items: T[];

  /** Total count of all items */
  total: number;

  /** Current page number */
  page: number;

  /** Items per page */
  limit: number;
}

/**
 * Global Response Interceptor
 *
 * Transforms all successful API responses into a standardized format.
 * This ensures consistency across all endpoints and simplifies
 * frontend error handling and data extraction.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  /**
   * Paths to exclude from response transformation
   * These endpoints may need raw responses (e.g., file downloads, health checks)
   */
  private readonly excludePaths = [
    '/health',
    '/metrics',
    '/api/docs',
    '/swagger',
    '/favicon.ico',
    '/robots.txt',
  ];

  constructor(private readonly reflector: Reflector) {}

  /**
   * Intercepts the response and wraps it in a standard format
   *
   * @param context - The execution context
   * @param next - The call handler for the next interceptor/handler
   * @returns Observable with the transformed response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    // Check if this endpoint should skip transformation
    if (this.shouldSkipTransform(context, request)) {
      return next.handle();
    }

    return next
      .handle()
      .pipe(map((data) => this.transformResponse(data, request, startTime)));
  }

  /**
   * Determines if the response transformation should be skipped
   *
   * @param context - The execution context
   * @param request - The HTTP request
   * @returns True if transformation should be skipped
   */
  private shouldSkipTransform(
    context: ExecutionContext,
    request: Request,
  ): boolean {
    // Check decorator
    const skipTransform = this.reflector.get<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      context.getHandler(),
    );
    if (skipTransform) {
      return true;
    }

    // Check excluded paths
    const url = request.url || '';
    return this.excludePaths.some((path) => url.includes(path));
  }

  /**
   * Transforms the response data into the standard format
   *
   * @param data - The original response data
   * @param request - The HTTP request
   * @param startTime - The timestamp when the request started
   * @returns The transformed response
   */
  private transformResponse(
    data: any,
    request: Request,
    startTime: number,
  ): ApiResponse<T> {
    const processingTimeMs = Date.now() - startTime;

    // Handle null/undefined responses
    if (data === null || data === undefined) {
      return {
        success: true,
        data: null as any,
        meta: {
          timing: { processingTimeMs },
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // Check if data is already in API response format
    if (this.isAlreadyWrapped(data)) {
      // Just add timing info if missing
      if (!data.meta?.timing) {
        data.meta = data.meta || {};
        data.meta.timing = { processingTimeMs };
      }
      return data;
    }

    // Check for paginated response pattern
    if (this.isPaginatedResponse(data)) {
      return this.transformPaginatedResponse(data, request, processingTimeMs);
    }

    // Standard response wrapping
    return {
      success: true,
      data: data,
      meta: {
        timing: { processingTimeMs },
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  /**
   * Checks if the data is already in API response format
   *
   * @param data - The response data
   * @returns True if already wrapped
   */
  private isAlreadyWrapped(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      typeof data.success === 'boolean' &&
      'data' in data
    );
  }

  /**
   * Checks if the data follows the paginated response pattern
   *
   * @param data - The response data
   * @returns True if paginated response
   */
  private isPaginatedResponse(data: any): data is PaginatedResponse<any> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      Array.isArray(data.items) &&
      'total' in data &&
      typeof data.total === 'number'
    );
  }

  /**
   * Transforms a paginated response
   *
   * @param data - The paginated response data
   * @param request - The HTTP request
   * @param processingTimeMs - Processing time in milliseconds
   * @returns The transformed paginated response
   */
  private transformPaginatedResponse(
    data: PaginatedResponse<any>,
    request: Request,
    processingTimeMs: number,
  ): ApiResponse<any> {
    const page = data.page || 1;
    const limit = data.limit || 20;
    const total = data.total;
    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      success: true,
      data: data.items,
      meta: {
        pagination,
        timing: { processingTimeMs },
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }
}

/**
 * Decorator to skip response transformation for specific endpoints
 * Use this for endpoints that need raw responses (e.g., file downloads)
 */
export function SkipResponseTransform(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true, descriptor.value);
    return descriptor;
  };
}
