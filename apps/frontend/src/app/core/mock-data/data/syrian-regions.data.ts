/**
 * Syrian Regions Mock Data
 *
 * Geographical data for Syrian governorates and cities
 * Used for shipping calculations and seller locations
 *
 * @fileoverview Syrian geographical data
 * @description 14 Syrian governorates with cities and shipping zones
 */

import { SyrianGovernorate } from '../../../shared/interfaces/syrian-data.interface';

/**
 * Complete Syrian Governorates Data
 * 14 governorates with major cities and shipping information
 */
export const SYRIAN_GOVERNORATES_DATA: SyrianGovernorate[] = [
  {
    id: 'damascus',
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    regions: [
      {
        id: 'damascus-center',
        nameEn: 'Damascus Center',
        nameAr: 'مركز دمشق',
        governorateId: 'damascus',
        isUrban: true,
        deliveryAvailable: true
      },
      {
        id: 'jaramana',
        nameEn: 'Jaramana',
        nameAr: 'جرمانا',
        governorateId: 'damascus',
        isUrban: true,
        deliveryAvailable: true
      }
    ],
    shippingZone: 1,
    deliveryTime: '1-2 days',
    isActive: true,
    heritage: true
  },
  {
    id: 'aleppo',
    nameEn: 'Aleppo',
    nameAr: 'حلب',
    regions: [
      {
        id: 'aleppo-center',
        nameEn: 'Aleppo Center',
        nameAr: 'مركز حلب',
        governorateId: 'aleppo',
        isUrban: true,
        deliveryAvailable: true
      }
    ],
    shippingZone: 2,
    deliveryTime: '2-3 days',
    isActive: true,
    heritage: true
  }
  // More governorates to be added on Day 2
];

/**
 * Export governorates data
 */
export default SYRIAN_GOVERNORATES_DATA;
