/**
 * @fileoverview Address data models for address book management
 * @description Interfaces matching backend Address entity and DTOs
 */

/**
 * @description Location entity returned by backend (country, region, city)
 * @interface LocationRef
 */
export interface LocationRef {
  /** Location identifier */
  id: number;
  /** Location name */
  name: string;
}

/**
 * @description Backend address response shape matching Address entity
 * @interface BackendAddress
 */
export interface BackendAddress {
  /** Address identifier */
  id: number;
  /** Human-readable label (e.g. "Home", "Work") */
  label: string;
  /** Address type: shipping or billing */
  addressType: 'shipping' | 'billing';
  /** Main address line */
  addressLine1: string;
  /** Secondary address line (optional) */
  addressLine2?: string;
  /** Postal code (optional) */
  postalCode?: string;
  /** Contact phone for delivery */
  phone: string;
  /** Delivery notes (optional) */
  notes?: string;
  /** Whether this is the default address for its type */
  isDefault: boolean;
  /** GPS latitude (optional) */
  latitude?: number;
  /** GPS longitude (optional) */
  longitude?: number;
  /** Country relation */
  country: LocationRef;
  /** Region/governorate relation (optional) */
  region?: LocationRef;
  /** City relation (optional) */
  city?: LocationRef;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * @description Request body for POST /addresses
 * @interface CreateAddressRequest
 */
export interface CreateAddressRequest {
  /** Human-readable label */
  label?: string;
  /** Address type */
  addressType?: 'shipping' | 'billing';
  /** Country ID (defaults to Syria = 1) */
  countryId: number;
  /** Region/governorate ID */
  regionId?: number;
  /** City ID */
  cityId?: number;
  /** Main address line */
  addressLine1: string;
  /** Secondary address line */
  addressLine2?: string;
  /** Postal code */
  postalCode?: string;
  /** Contact phone */
  phone: string;
  /** Delivery notes */
  notes?: string;
  /** Set as default address */
  isDefault?: boolean;
}

/**
 * @description Request body for PUT /addresses/:id (all fields optional)
 * @interface UpdateAddressRequest
 */
export type UpdateAddressRequest = Partial<CreateAddressRequest>;

/**
 * @description Maps a backend address to a display-friendly format
 * @param {BackendAddress} addr - Backend address response
 * @returns Formatted address string
 */
export function formatBackendAddress(addr: BackendAddress): string {
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.city?.name,
    addr.region?.name,
    addr.country?.name,
  ].filter(Boolean);
  return parts.join(', ');
}
