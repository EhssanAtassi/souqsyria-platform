/**
 * @fileoverview Shared Interfaces Index
 * @description Central export for all shared interfaces in the Syrian marketplace
 * @swagger
 * components:
 *   schemas:
 *     SharedInterfaces:
 *       type: object
 *       description: Collection of all shared TypeScript interfaces for Syrian marketplace
 */

// Navigation interfaces
export * from './navigation.interface';

// Admin interfaces
export * from './admin.interface';

// Product interfaces
export * from './product.interface';

// Cart interfaces
export * from './cart.interface';

// Category filter interfaces
export * from './category-filter.interface';

// Mega menu interfaces
export * from './mega-menu.interface';

// User interfaces
export * from './user.interface';


// Type utilities for better type checking
export type SyrianCurrency = 'USD' | 'EUR' | 'SYP';
export type SupportedLanguage = 'en' | 'ar';
export type DeliveryRegion = 'damascus' | 'aleppo' | 'homs' | 'lattakia' | 'tartous' | 'daraa' | 'deir-ez-zor';

/**
 * Common utility types for the Syrian marketplace
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sort?: string;
  search?: string;
  category?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  code: string;
  timestamp: Date;
}

export interface LoadingState {
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}
