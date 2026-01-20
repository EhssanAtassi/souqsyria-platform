/**
 * @file attribute-types.enum.ts
 * @description Enumeration for different attribute input types
 *
 * Defines the various types of product attributes supported
 * in the SouqSyria platform for flexible product configuration.
 */

export enum AttributeType {
  SELECT = 'select', // Single dropdown selection (Color, Brand)
  MULTISELECT = 'multiselect', // Multiple selection checkboxes (Features, Tags)
  TEXT = 'text', // Free text input (Custom engraving)
  NUMBER = 'number', // Numeric input (Weight, Dimensions)
  BOOLEAN = 'boolean', // Yes/No toggle (Wireless, Waterproof)
  COLOR = 'color', // Color picker with hex values
  DATE = 'date', // Date picker (Expiry, Warranty)
  RANGE = 'range', // Range slider (Price range, Size range)
  FILE = 'file', // File upload (Documents, Images)
  EMAIL = 'email', // Email input validation
  URL = 'url', // URL input validation
  PHONE = 'phone', // Phone number validation
}
