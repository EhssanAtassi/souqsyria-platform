/**
 * @description Syrian Governorate Shipping Rates
 *
 * Temporary hardcoded shipping costs by governorate code.
 * These rates represent the delivery fee in Syrian Pounds (SYP) for each governorate.
 *
 * TODO: Replace with backend API call to GET /addresses/governorates/:id/delivery-info
 * The backend should provide dynamic shipping rates based on:
 * - Governorate distance from distribution centers
 * - Current fuel prices
 * - Delivery partner availability
 * - Promotional/seasonal rates
 *
 * @swagger
 * components:
 *   schemas:
 *     ShippingRates:
 *       type: object
 *       description: Map of governorate codes to shipping costs in SYP
 *       additionalProperties:
 *         type: number
 *       example:
 *         DAM: 5000
 *         RIF: 7500
 *         ALE: 10000
 */
export const SYRIAN_SHIPPING_RATES: Record<string, number> = {
  /** Damascus City - Main hub, lowest shipping cost */
  'DAM': 5000,

  /** Damascus Countryside - Near main hub */
  'RIF': 7500,

  /** Aleppo - Northern major city */
  'ALE': 10000,

  /** Homs - Central region */
  'HOM': 8000,

  /** Hama - Central region */
  'HAM': 8500,

  /** Latakia - Coastal region */
  'LAT': 12000,

  /** Tartus - Coastal region */
  'TAR': 12000
};

/**
 * @description Default shipping rate for governorates not in the map
 * Applied to remote or less common governorates
 */
export const DEFAULT_SHIPPING_RATE = 15000;
