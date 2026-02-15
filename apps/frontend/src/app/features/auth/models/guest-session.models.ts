/**
 * Guest Session models for SouqSyria marketplace
 *
 * @description TypeScript interfaces matching the NestJS backend guest session
 * API contracts. Covers guest session initialization, validation, and state management.
 *
 * @swagger
 * components:
 *   schemas:
 *     GuestSessionModels:
 *       type: object
 *       description: Frontend guest session model definitions for SouqSyria
 */

// ─── Guest Session State ─────────────────────────────────────

/**
 * Guest session data structure
 *
 * @description Represents an active guest session with UUID and expiry
 */
export interface GuestSession {
  /** Unique session identifier (UUID v4) */
  sessionUUID: string;
  /** ISO 8601 expiry timestamp */
  expiresAt: string;
  /** Optional metadata for session tracking */
  metadata?: Record<string, any>;
}

// ─── Session Initialization ──────────────────────────────────

/**
 * Guest session initialization response
 *
 * @description Returned from POST /auth/guest-session/init
 */
export interface GuestSessionInitResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
  /** Guest session data */
  session: GuestSession;
}

// ─── Session Validation ──────────────────────────────────────

/**
 * Guest session validation response
 *
 * @description Returned from GET /auth/guest-session/validate
 */
export interface GuestSessionValidateResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
  /** Whether the session is valid and active */
  isValid: boolean;
  /** Guest session data (if valid) */
  session?: GuestSession;
}

// ─── Error Response ──────────────────────────────────────────

/**
 * Backend error response structure
 *
 * @description Standard NestJS error response format for guest session errors
 */
export interface GuestSessionErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Error message (string or array) */
  message: string | string[];
  /** Error type identifier */
  error: string;
}
