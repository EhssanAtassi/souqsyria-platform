/**
 * API Response Models
 * Defines standard response structures from the backend API
 *
 * @module ApiResponseModel
 */

/**
 * Paginated response wrapper for list endpoints
 * Provides data along with pagination metadata
 *
 * @interface PaginatedResponse
 * @template T - Type of data items in the response
 */
export interface PaginatedResponse<T> {
  /** Array of data items for the current page */
  data: T[];

  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;

    /** Number of items per page */
    limit: number;

    /** Total number of items across all pages */
    totalCount: number;

    /** Total number of pages */
    totalPages: number;

    /** Whether there is a next page available */
    hasNextPage: boolean;

    /** Whether there is a previous page available */
    hasPrevPage: boolean;
  };
}

/**
 * Standard API response wrapper for single item or non-paginated data
 *
 * @interface ApiResponse
 * @template T - Type of data in the response
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data payload */
  data: T;

  /** Optional message (often used for errors or confirmations) */
  message?: string;

  /** Timestamp when the response was generated */
  timestamp: Date;
}

/**
 * Error response structure from the backend
 *
 * @interface ApiErrorResponse
 */
export interface ApiErrorResponse {
  /** Always false for error responses */
  success: false;

  /** Error message */
  message: string;

  /** HTTP status code */
  statusCode: number;

  /** Detailed error information (only in development) */
  error?: string;

  /** Validation errors if applicable */
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;

  /** Request ID for debugging */
  requestId?: string;

  /** Timestamp when the error occurred */
  timestamp: Date;
}

/**
 * Type guard to check if response is an error
 *
 * @param response - Response to check
 * @returns True if response is an error response
 */
export function isApiError(
  response: ApiResponse<any> | ApiErrorResponse
): response is ApiErrorResponse {
  return !response.success;
}

/**
 * Helper to create an empty paginated response
 *
 * @template T - Type of data items
 * @returns Empty paginated response
 */
export function createEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    data: [],
    pagination: {
      page: 1,
      limit: 50,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

/**
 * Helper to extract error message from response
 *
 * @param error - Error response or error object
 * @returns User-friendly error message
 */
export function extractErrorMessage(error: any): string {
  if (error?.error?.message) {
    return error.error.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Helper to check if paginated response has data
 *
 * @param response - Paginated response
 * @returns True if response contains data
 */
export function hasData<T>(response: PaginatedResponse<T>): boolean {
  return response.data.length > 0;
}

/**
 * Helper to calculate page range for pagination UI
 *
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show
 * @returns Array of page numbers to display
 */
export function calculatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = currentPage - halfVisible;
  let end = currentPage + halfVisible;

  if (start < 1) {
    start = 1;
    end = maxVisible;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
