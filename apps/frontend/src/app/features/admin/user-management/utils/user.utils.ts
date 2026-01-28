/**
 * User Management Utility Functions
 *
 * @description
 * Helper functions for user data manipulation and formatting.
 * Used across user management components.
 *
 * @module UserManagement/Utils
 */

/**
 * Get initials from full name
 *
 * @description
 * Extracts the first letter of the first name and first letter of the last name.
 * Handles various name formats and edge cases.
 *
 * @param name - Full name string (e.g., "John Doe")
 * @returns Uppercase initials (e.g., "JD")
 *
 * @example
 * ```typescript
 * getInitials("John Doe")        // "JD"
 * getInitials("Ahmad Al-Hassan")  // "AA"
 * getInitials("Mary")             // "M"
 * getInitials("")                 // "?"
 * getInitials("  ")               // "?"
 * ```
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  // Trim and normalize whitespace
  const trimmed = name.trim().replace(/\s+/g, ' ');

  if (trimmed.length === 0) {
    return '?';
  }

  // Split by space
  const parts = trimmed.split(' ').filter(part => part.length > 0);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    // Single name - take first character
    return parts[0][0].toUpperCase();
  }

  // Multiple parts - take first character of first and last part
  const firstInitial = parts[0][0].toUpperCase();
  const lastInitial = parts[parts.length - 1][0].toUpperCase();

  return `${firstInitial}${lastInitial}`;
}

/**
 * Generate consistent color from name hash
 *
 * @description
 * Generates a deterministic color hex code from a string (name).
 * Same name always produces the same color.
 * Uses a simple hash function to ensure consistent results.
 *
 * Color palette is designed to be:
 * - Visually distinct
 * - Accessible (WCAG AA compliant with white text)
 * - Pleasant and professional
 *
 * @param name - Name string to hash
 * @returns Hex color code (e.g., "#4caf50")
 *
 * @example
 * ```typescript
 * getAvatarColor("John Doe")        // Always returns same color for "John Doe"
 * getAvatarColor("Jane Smith")      // Different color from "John Doe"
 * getAvatarColor("John Doe")        // Same as first call
 * ```
 */
export function getAvatarColor(name: string): string {
  // Material Design color palette (500 shades)
  // All colors have good contrast ratio with white text (WCAG AA compliant)
  const colors = [
    '#f44336', // Red 500
    '#e91e63', // Pink 500
    '#9c27b0', // Purple 500
    '#673ab7', // Deep Purple 500
    '#3f51b5', // Indigo 500
    '#2196f3', // Blue 500
    '#03a9f4', // Light Blue 500
    '#00bcd4', // Cyan 500
    '#009688', // Teal 500
    '#4caf50', // Green 500
    '#8bc34a', // Light Green 500
    '#ff9800', // Orange 500
    '#ff5722', // Deep Orange 500
    '#795548', // Brown 500
    '#607d8b', // Blue Grey 500
  ];

  // Handle edge cases
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return colors[0]; // Default to first color
  }

  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) + hash + name.charCodeAt(i); // hash * 33 + c
  }

  // Ensure positive integer
  const absHash = Math.abs(hash);

  // Map hash to color index
  const colorIndex = absHash % colors.length;

  return colors[colorIndex];
}

/**
 * Format last login timestamp
 *
 * @description
 * Converts a date to a human-readable "last seen" format.
 * Uses relative time for recent logins, absolute date for older ones.
 *
 * Format rules:
 * - Less than 1 minute: "Just now"
 * - Less than 1 hour: "X minutes ago"
 * - Less than 24 hours: "X hours ago"
 * - Less than 7 days: "X days ago"
 * - Less than 30 days: "X weeks ago"
 * - Older: Absolute date (e.g., "Jan 15, 2024")
 * - Never logged in: "Never"
 *
 * @param date - Last login date or null
 * @returns Formatted string (e.g., "Last seen 5 minutes ago")
 *
 * @example
 * ```typescript
 * formatLastLogin(null)                          // "Never"
 * formatLastLogin(new Date())                    // "Last seen just now"
 * formatLastLogin(new Date(Date.now() - 300000)) // "Last seen 5 minutes ago"
 * formatLastLogin(new Date(Date.now() - 7200000))// "Last seen 2 hours ago"
 * ```
 */
export function formatLastLogin(date: Date | null | undefined): string {
  if (!date) {
    return 'Never';
  }

  // Ensure date is a Date object
  const loginDate = date instanceof Date ? date : new Date(date);

  // Check if valid date
  if (isNaN(loginDate.getTime())) {
    return 'Never';
  }

  const now = new Date();
  const diffMs = now.getTime() - loginDate.getTime();

  // Handle future dates (clock skew)
  if (diffMs < 0) {
    return 'Just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  // Less than 1 minute
  if (seconds < 60) {
    return 'Last seen just now';
  }

  // Less than 1 hour
  if (minutes < 60) {
    return `Last seen ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than 24 hours
  if (hours < 24) {
    return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Less than 7 days
  if (days < 7) {
    return `Last seen ${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  // Less than 30 days
  if (weeks < 4) {
    return `Last seen ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // Less than 1 year - use abbreviated format
  if (months < 12) {
    return `Last seen ${loginDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  }

  // Older than 1 year - include year
  return `Last seen ${loginDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}`;
}

/**
 * Format date with time ago
 *
 * @description
 * Converts a date to relative time format for general use.
 * Similar to formatLastLogin but without "Last seen" prefix.
 *
 * @param date - Date to format
 * @returns Relative time string (e.g., "5 minutes ago")
 *
 * @example
 * ```typescript
 * formatTimeAgo(new Date())                    // "Just now"
 * formatTimeAgo(new Date(Date.now() - 300000)) // "5 minutes ago"
 * ```
 */
export function formatTimeAgo(date: Date | null | undefined): string {
  if (!date) {
    return 'Never';
  }

  const loginDate = date instanceof Date ? date : new Date(date);

  if (isNaN(loginDate.getTime())) {
    return 'Never';
  }

  const now = new Date();
  const diffMs = now.getTime() - loginDate.getTime();

  if (diffMs < 0) {
    return 'Just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;

  if (months < 12) {
    return loginDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return loginDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Validate email format
 *
 * @description
 * Simple email validation using regex.
 * Not comprehensive but covers most common cases.
 *
 * @param email - Email string to validate
 * @returns True if valid email format
 *
 * @example
 * ```typescript
 * isValidEmail("user@example.com")     // true
 * isValidEmail("invalid.email")        // false
 * isValidEmail("")                     // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Format phone number for display
 *
 * @description
 * Formats phone number with proper spacing for readability.
 * Handles various phone formats.
 *
 * @param phone - Phone number string
 * @returns Formatted phone number
 *
 * @example
 * ```typescript
 * formatPhoneNumber("+963115551234")    // "+963-11-555-1234"
 * formatPhoneNumber("05551234")         // "0555-1234"
 * ```
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '-';
  }

  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.length === 0) {
    return '-';
  }

  // If starts with +, format as international
  if (cleaned.startsWith('+')) {
    // Simple formatting: +XXX-XX-XXX-XXXX
    if (cleaned.length > 8) {
      const country = cleaned.substring(0, 4);
      const rest = cleaned.substring(4);
      const groups = rest.match(/.{1,3}/g) || [];
      return `${country}-${groups.join('-')}`;
    }
  }

  // Otherwise just return as-is
  return cleaned;
}

/**
 * Truncate text with ellipsis
 *
 * @description
 * Shortens text to specified length, adding ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 *
 * @example
 * ```typescript
 * truncateText("Long text here", 10)  // "Long text..."
 * truncateText("Short", 10)           // "Short"
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get full name from first and last name
 *
 * @description
 * Combines first and last name with proper spacing.
 * Handles missing names gracefully.
 *
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full name string
 *
 * @example
 * ```typescript
 * getFullName("John", "Doe")       // "John Doe"
 * getFullName("John", "")          // "John"
 * getFullName("", "Doe")           // "Doe"
 * getFullName("", "")              // ""
 * ```
 */
export function getFullName(firstName?: string, lastName?: string): string {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  if (!first && !last) {
    return '';
  }

  if (!first) {
    return last;
  }

  if (!last) {
    return first;
  }

  return `${first} ${last}`;
}
