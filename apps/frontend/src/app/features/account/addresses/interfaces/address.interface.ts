/**
 * @fileoverview Address management interfaces for Syrian address system
 * @description Defines TypeScript interfaces for governorates, cities, districts,
 * and address entities in the SouqSyria Syrian marketplace.
 * Supports bilingual (English/Arabic) address data.
 *
 * @swagger
 * components:
 *   schemas:
 *     Governorate:
 *       type: object
 *       description: Syrian governorate (محافظة)
 *       properties:
 *         id:
 *           type: number
 *         code:
 *           type: string
 *         nameEn:
 *           type: string
 *         nameAr:
 *           type: string
 *         displayOrder:
 *           type: number
 *         status:
 *           type: object
 */

/**
 * @description Syrian governorate (محافظة) response from API
 */
export interface Governorate {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  status?: {
    deliverySupported: boolean;
    accessibilityLevel: string;
  };
}

/**
 * @description Syrian city response from API
 */
export interface City {
  id: number;
  nameEn: string;
  nameAr: string;
  governorate?: Governorate;
  displayOrder: number;
}

/**
 * @description Syrian district response from API
 */
export interface District {
  id: number;
  nameEn: string;
  nameAr: string;
  city?: City;
  postalCode?: string;
  displayOrder: number;
}

/**
 * @description Address response from backend
 */
export interface AddressResponse {
  id: number;
  fullName: string;
  phone: string;
  label?: string;
  /** Sent as 'street' in create/update requests. Backend maps the 'street' DTO field to this entity field. */
  addressLine1: string;
  building?: string;
  floor?: string;
  additionalDetails?: string;
  isDefault: boolean;
  governorate?: Governorate;
  syrianCity?: City;
  district?: District;
  createdAt: string;
  updatedAt: string;
}

/**
 * @description Create address request payload
 */
export interface CreateAddressRequest {
  fullName: string;
  phone: string;
  governorateId: number;
  cityId: number;
  districtId?: number;
  /** Maps to `addressLine1` in the AddressResponse. Backend maps this to the address entity's addressLine1 field. */
  street: string;
  building?: string;
  floor?: string;
  additionalDetails?: string;
  isDefault?: boolean;
  label?: string;
}

/**
 * @description Update address request payload (all fields optional)
 */
export type UpdateAddressRequest = Partial<CreateAddressRequest>;
