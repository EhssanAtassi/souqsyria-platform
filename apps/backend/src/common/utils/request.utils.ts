/**
 * @file request.utils.ts
 * @description Request utility functions for SouqSyria backend
 *
 * FEATURES:
 * - IP address extraction from Express requests
 * - Proxy and load balancer support
 * - Standardized request parsing utilities
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import { Request } from 'express';

/**
 * Extract client IP address from Express request
 *
 * Handles various deployment scenarios:
 * - Direct connections
 * - Reverse proxies (nginx, Apache)
 * - Load balancers (AWS ELB, GCP Load Balancer)
 * - CDNs (CloudFlare, Fastly)
 *
 * Priority order:
 * 1. X-Forwarded-For header (most common proxy header)
 * 2. X-Real-IP header (nginx and some proxies)
 * 3. Socket remote address (direct connection)
 * 4. 'unknown' fallback
 *
 * @param req - Express Request object
 * @returns IP address string (IPv4 or IPv6)
 *
 * @example
 * ```typescript
 * const ip = extractIpAddress(req);
 * // Returns: '192.168.1.100' or '2001:db8::1'
 * ```
 */
export function extractIpAddress(req: Request): string {
  // Check for X-Forwarded-For header (most common in proxied environments)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can be an array or comma-separated string
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    // Take the first IP (client IP) from the comma-separated list
    return ips.split(',')[0].trim();
  }

  // Check for X-Real-IP header (used by nginx and some proxies)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket remote address (direct connection)
  return req.ip || req.socket.remoteAddress || 'unknown';
}
