/**
 * @file index.ts
 * @description E2E Test Helpers Index
 *
 * Exports all E2E testing helper utilities for easy import.
 *
 * @example
 * ```typescript
 * import {
 *   E2EAuthHelper,
 *   E2EApiHelper,
 *   E2ESeedHelper,
 *   createE2EAuthHelper,
 *   createE2EApiHelper,
 *   createE2ESeedHelper
 * } from './helpers';
 * ```
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

// Authentication helpers
export {
  E2EAuthHelper,
  createE2EAuthHelper,
  LoginCredentials,
  AuthTokens,
  JwtPayload,
} from './e2e-auth.helper';

// API helpers
export {
  E2EApiHelper,
  createE2EApiHelper,
  CreateRoleDto,
  Role,
  CreateUserDto,
  User,
  SecurityAuditLog,
} from './e2e-api.helper';

// Database seeding helpers
export {
  E2ESeedHelper,
  createE2ESeedHelper,
  SeededTestData,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLES,
  DEFAULT_TEST_USERS,
} from './e2e-seed.helper';
