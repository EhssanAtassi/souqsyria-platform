/**
 * @file address-enums.ts
 * @description Shared enums for Syrian address system
 *
 * This file contains common enums used across different address entities
 * to maintain consistency and avoid duplication.
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Property types for different use cases
 *
 * Classifies the property at an address based on its primary purpose
 * and usage patterns. This helps in delivery optimization and service
 * customization. Renamed from AddressType to avoid collision with
 * the DTO-level AddressType (SHIPPING/BILLING) enum.
 */
export enum PropertyType {
  /** Standard residential address for homes and apartments */
  RESIDENTIAL = 'residential',

  /** Commercial address for businesses and shops */
  COMMERCIAL = 'commercial',

  /** Industrial address for factories and manufacturing */
  INDUSTRIAL = 'industrial',

  /** Government buildings and offices */
  GOVERNMENTAL = 'governmental',

  /** Schools, universities, and educational institutions */
  EDUCATIONAL = 'educational',

  /** Hospitals, clinics, and medical facilities */
  MEDICAL = 'medical',

  /** Embassies, consulates, and diplomatic missions */
  DIPLOMATIC = 'diplomatic',
}

/**
 * Address status for validation and verification
 *
 * Tracks the verification and validation status of addresses
 * to ensure data quality and delivery success.
 */
export enum AddressStatus {
  /** Address is verified and actively used */
  ACTIVE = 'active',

  /** Address exists but not currently in use */
  INACTIVE = 'inactive',

  /** Address needs verification before use */
  PENDING_VERIFICATION = 'pending_verification',

  /** Address has been verified by official sources */
  VERIFIED = 'verified',

  /** Address information is disputed or questionable */
  DISPUTED = 'disputed',
}

/**
 * Delivery accessibility levels
 *
 * Indicates the level of delivery service availability
 * based on security, infrastructure, and logistics factors.
 */
export enum AccessibilityLevel {
  /** Full delivery service available */
  FULL = 'full',

  /** Limited delivery with some restrictions */
  PARTIAL = 'partial',

  /** Delivery available but with significant limitations */
  LIMITED = 'limited',

  /** Delivery not currently available */
  RESTRICTED = 'restricted',
}

/**
 * Economic activity levels
 *
 * Describes the current level of economic activity
 * in a particular area or region.
 */
export enum EconomicStatus {
  /** High economic activity and business operations */
  ACTIVE = 'active',

  /** Recovering from previous disruptions */
  RECOVERING = 'recovering',

  /** Limited economic activity */
  LIMITED = 'limited',
}

/**
 * Infrastructure quality levels
 *
 * Assesses the quality of infrastructure including
 * roads, utilities, and services.
 */
export enum InfrastructureLevel {
  /** High-quality infrastructure */
  GOOD = 'good',

  /** Adequate infrastructure with some issues */
  FAIR = 'fair',

  /** Poor infrastructure requiring improvement */
  POOR = 'poor',
}

/**
 * Delivery options for last-mile logistics
 *
 * Different delivery methods available for final
 * delivery to the customer.
 */
export enum LastMileOptions {
  /** Standard delivery to address */
  STANDARD = 'standard',

  /** Express/fast delivery */
  EXPRESS = 'express',

  /** Delivery to pickup point for customer collection */
  PICKUP_POINT = 'pickup_point',
}

/**
 * Verification methods for address validation
 *
 * Different methods used to verify address accuracy
 * and validity.
 */
export enum VerificationMethod {
  /** Automatically verified using databases */
  AUTOMATED = 'automated',

  /** Manually verified by staff */
  MANUAL = 'manual',

  /** Verified by customer confirmation */
  CUSTOMER = 'customer',
}

/**
 * Contact preferences for delivery coordination
 *
 * Customer preferences for delivery coordination
 * and communication.
 */
export enum ContactPreference {
  /** Phone call */
  CALL = 'call',

  /** SMS text message */
  SMS = 'sms',

  /** WhatsApp message */
  WHATSAPP = 'whatsapp',
}
