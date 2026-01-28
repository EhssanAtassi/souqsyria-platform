/**
 * Standard pagination metadata returned by API
 */
export interface PaginationMeta {
  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items across all pages
   */
  totalCount: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there is a next page
   */
  hasNextPage: boolean;

  /**
   * Whether there is a previous page
   */
  hasPrevPage: boolean;
}

/**
 * Paginated API response wrapper
 * Used for list endpoints with pagination
 */
export interface PaginatedResponse<T> {
  /**
   * Array of data items for current page
   */
  data: T[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;
}

/**
 * Standard API response wrapper
 * Used for single-item and operation responses
 */
export interface ApiResponse<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Response data (type varies by endpoint)
   */
  data: T;

  /**
   * Optional message (success/error description)
   */
  message?: string;

  /**
   * Optional error details (for debugging)
   */
  error?: ApiError;

  /**
   * Timestamp of response
   */
  timestamp?: Date;
}

/**
 * API error details
 */
export interface ApiError {
  /**
   * Error code (e.g., 'ROUTE_NOT_FOUND')
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Additional error context
   */
  details?: Record<string, any>;

  /**
   * Validation errors (for form submissions)
   */
  validationErrors?: ValidationError[];
}

/**
 * Validation error for form fields
 */
export interface ValidationError {
  /**
   * Field name that failed validation
   */
  field: string;

  /**
   * Validation rule that failed
   */
  rule: string;

  /**
   * Error message for this field
   */
  message: string;

  /**
   * Invalid value provided
   */
  value?: any;
}

/**
 * Batch operation response
 * Used when multiple items are processed
 */
export interface BatchOperationResponse {
  /**
   * Number of successful operations
   */
  successCount: number;

  /**
   * Number of failed operations
   */
  failureCount: number;

  /**
   * Total operations attempted
   */
  totalAttempted: number;

  /**
   * Detailed results for each item
   */
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Export operation response
 * Returned when exporting data
 */
export interface ExportResponse {
  /**
   * Export file URL or blob
   */
  fileUrl?: string;

  /**
   * File name
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * MIME type
   */
  mimeType: string;

  /**
   * Number of records exported
   */
  recordCount: number;

  /**
   * Timestamp when export was generated
   */
  generatedAt: Date;
}

/**
 * Empty response for operations with no return data
 */
export type EmptyResponse = Record<string, never>;

/**
 * Type guard to check if response is successful
 * @param response API response to check
 * @returns True if success flag is true
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

/**
 * Type guard to check if response has error
 * @param response API response to check
 * @returns True if response contains error
 */
export function hasApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ApiError } {
  return response.error !== undefined;
}

/**
 * Extract data from successful response or throw error
 * @param response API response
 * @returns Data payload
 * @throws Error if response is not successful
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!isSuccessResponse(response)) {
    throw new Error(response.message || 'Operation failed');
  }
  return response.data;
}

/**
 * Create a default pagination meta object
 * @returns Empty pagination metadata
 */
export function createDefaultPaginationMeta(): PaginationMeta {
  return {
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  };
}
