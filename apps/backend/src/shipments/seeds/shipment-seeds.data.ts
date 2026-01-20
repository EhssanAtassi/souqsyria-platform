/**
 * @file shipment-seeds.data.ts
 * @description Comprehensive seed data for Syrian shipment system
 *
 * FEATURES:
 * - Syrian shipping companies (Damascus Express, Aleppo Speed, etc.)
 * - Complete shipment workflows with realistic scenarios
 * - Multi-currency support (SYP primary)
 * - Arabic/English localization
 * - Enterprise-grade test data for 15-state workflow
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import {
  SyrianShippingType,
  DeliveryService,
  CoverageArea,
  PerformanceMetrics,
} from '../entities/syrian-shipping-company.entity';
import { ShipmentStatus } from '../entities/shipment.entity';

/**
 * Syrian Shipping Companies Seed Data
 */
export const SYRIAN_SHIPPING_COMPANIES_SEED = [
  {
    nameEn: 'Damascus Express Delivery',
    nameAr: 'شركة دمشق للتوصيل السريع',
    descriptionEn:
      'Fast and reliable delivery service across Damascus and surrounding areas with 24/7 customer support',
    descriptionAr:
      'خدمة توصيل سريعة وموثوقة في دمشق والمناطق المحيطة مع دعم عملاء على مدار 24 ساعة',
    companyType: SyrianShippingType.EXPRESS_DELIVERY,
    contactInfo: {
      phone: '+963-11-1234567',
      mobile: '+963-987-654321',
      whatsapp: '+963-987-654321',
      email: 'info@damascusexpress.sy',
      website: 'https://damascusexpress.sy',
      address: '123 Mazzeh Street, Damascus',
      addressAr: 'شارع المزة 123، دمشق',
      emergencyContact: '+963-988-123456',
    },
    coverageAreas: [
      {
        governorateId: 1,
        governorateName: 'Damascus',
        governorateNameAr: 'دمشق',
        cities: [
          {
            cityId: 1,
            cityName: 'Damascus City',
            cityNameAr: 'مدينة دمشق',
            deliveryFee: 2000,
            estimatedHours: 2,
            isActive: true,
            specialInstructions: 'Same day delivery available',
            specialInstructionsAr: 'التوصيل في نفس اليوم متاح',
          },
          {
            cityId: 2,
            cityName: 'Jaramana',
            cityNameAr: 'جرمانا',
            deliveryFee: 2500,
            estimatedHours: 3,
            isActive: true,
          },
        ],
        baseFee: 1500,
        isActive: true,
      },
    ] as CoverageArea[],
    services: [
      {
        id: 'same_day',
        nameEn: 'Same Day Delivery',
        nameAr: 'التوصيل في نفس اليوم',
        description:
          'Delivery within the same day for orders placed before 2 PM',
        descriptionAr:
          'التوصيل في نفس اليوم للطلبات المقدمة قبل الساعة الثانية ظهراً',
        baseCostSYP: 3000,
        costPerKmSYP: 500,
        estimatedDeliveryHours: 6,
        maxWeightKg: 10,
        isActive: true,
        workingHours: {
          start: '09:00',
          end: '18:00',
          days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        },
      },
      {
        id: 'express',
        nameEn: 'Express Delivery',
        nameAr: 'التوصيل السريع',
        description: 'Priority delivery within 2-4 hours',
        descriptionAr: 'التوصيل ذو الأولوية خلال 2-4 ساعات',
        baseCostSYP: 5000,
        costPerKmSYP: 800,
        estimatedDeliveryHours: 3,
        maxWeightKg: 5,
        isActive: true,
        workingHours: {
          start: '08:00',
          end: '20:00',
          days: [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
          ],
        },
      },
    ] as DeliveryService[],
    pricing: {
      baseFee: 1500,
      perKmRate: 300,
      weightRates: [
        { maxKg: 5, rateSYP: 0 },
        { maxKg: 10, rateSYP: 500 },
        { maxKg: 20, rateSYP: 1500 },
        { maxKg: 50, rateSYP: 3000 },
      ],
      expressFee: 2000,
      weekendFee: 1000,
      holidayFee: 1500,
      codFee: 500,
      insuranceFee: 200,
      fuelSurcharge: 300,
    },
    schedule: {
      workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: { start: '09:00', end: '18:00' },
      breakTime: { start: '13:00', end: '14:00' },
      weekendService: true,
      holidayService: false,
      emergencyService: true,
      emergencyHours: { start: '19:00', end: '22:00' },
      timeZone: 'Asia/Damascus',
    },
    performanceMetrics: {
      deliverySuccessRate: 96.5,
      averageDeliveryTime: 4.2,
      customerRating: 4.7,
      totalDeliveries: 15420,
      onTimeDeliveries: 14890,
      lastUpdated: new Date('2025-08-20T10:00:00.000Z'),
      monthlyStats: [
        {
          month: '2025-07',
          deliveries: 1250,
          successRate: 97.2,
          averageTime: 4.1,
        },
        {
          month: '2025-06',
          deliveries: 1180,
          successRate: 95.8,
          averageTime: 4.3,
        },
        {
          month: '2025-05',
          deliveries: 1320,
          successRate: 96.1,
          averageTime: 4.0,
        },
      ],
    } as PerformanceMetrics,
    capabilities: {
      codSupported: true,
      signatureRequired: true,
      photoProofAvailable: true,
      trackingAvailable: true,
      smsNotifications: true,
      whatsappNotifications: true,
      specialHandling: ['fragile', 'electronics', 'documents', 'jewelry'],
      vehicleTypes: ['motorcycle', 'car', 'van'],
      maxWeight: 50,
      maxDimensions: { length: 100, width: 80, height: 60 },
    },
    integration: {
      apiEndpoint: 'https://api.damascusexpress.sy/v1',
      apiKey: 'dx_api_key_2025_encrypted',
      webhookUrl: 'https://souqsyria.com/webhooks/damascus-express',
      trackingUrl: 'https://track.damascusexpress.sy/{trackingNumber}',
      autoStatusUpdate: true,
      testMode: false,
      lastSync: new Date('2025-08-20T09:00:00.000Z'),
    },
    companyStatus: {
      isVerified: true,
      verificationDate: new Date('2025-01-15T00:00:00.000Z'),
      licenseNumber: 'SY-SHIP-2025-001',
      insuranceValid: true,
      contractStatus: 'active',
      paymentTerms: 'monthly',
      commission: 8.5,
    },
    isActive: true,
    displayPriority: 10,
  },
  {
    nameEn: 'Aleppo Speed Couriers',
    nameAr: 'سرعة حلب للتوصيل',
    descriptionEn:
      'Northern Syria specialist delivery service covering Aleppo and surrounding regions',
    descriptionAr: 'خدمة توصيل متخصصة في شمال سوريا تغطي حلب والمناطق المحيطة',
    companyType: SyrianShippingType.LOCAL_COURIER,
    contactInfo: {
      phone: '+963-21-7654321',
      mobile: '+963-988-123456',
      whatsapp: '+963-988-123456',
      email: 'contact@aleppospeed.sy',
      website: 'https://aleppospeed.sy',
      address: 'Al-Aziziyah District, Aleppo',
      addressAr: 'حي العزيزية، حلب',
      emergencyContact: '+963-989-456789',
    },
    coverageAreas: [
      {
        governorateId: 2,
        governorateName: 'Aleppo',
        governorateNameAr: 'حلب',
        cities: [
          {
            cityId: 10,
            cityName: 'Aleppo City',
            cityNameAr: 'مدينة حلب',
            deliveryFee: 1800,
            estimatedHours: 2,
            isActive: true,
          },
          {
            cityId: 11,
            cityName: 'Afrin',
            cityNameAr: 'عفرين',
            deliveryFee: 3000,
            estimatedHours: 4,
            isActive: true,
            specialInstructions: 'Rural delivery available',
            specialInstructionsAr: 'التوصيل الريفي متاح',
          },
        ],
        baseFee: 1200,
        isActive: true,
      },
    ] as CoverageArea[],
    services: [
      {
        id: 'standard',
        nameEn: 'Standard Delivery',
        nameAr: 'التوصيل العادي',
        description: 'Standard delivery within 24-48 hours',
        descriptionAr: 'التوصيل العادي خلال 24-48 ساعة',
        baseCostSYP: 2000,
        costPerKmSYP: 300,
        estimatedDeliveryHours: 36,
        maxWeightKg: 25,
        isActive: true,
        workingHours: {
          start: '08:00',
          end: '17:00',
          days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        },
      },
    ] as DeliveryService[],
    pricing: {
      baseFee: 1200,
      perKmRate: 250,
      weightRates: [
        { maxKg: 5, rateSYP: 0 },
        { maxKg: 15, rateSYP: 800 },
        { maxKg: 30, rateSYP: 2000 },
      ],
      expressFee: 1500,
      weekendFee: 800,
      holidayFee: 1200,
      codFee: 400,
      insuranceFee: 150,
      fuelSurcharge: 200,
    },
    schedule: {
      workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: { start: '08:00', end: '17:00' },
      breakTime: { start: '12:30', end: '13:30' },
      weekendService: false,
      holidayService: false,
      emergencyService: false,
      timeZone: 'Asia/Damascus',
    },
    performanceMetrics: {
      deliverySuccessRate: 94.2,
      averageDeliveryTime: 28.5,
      customerRating: 4.3,
      totalDeliveries: 8750,
      onTimeDeliveries: 8245,
      lastUpdated: new Date('2025-08-20T10:00:00.000Z'),
      monthlyStats: [
        {
          month: '2025-07',
          deliveries: 720,
          successRate: 95.1,
          averageTime: 27.2,
        },
        {
          month: '2025-06',
          deliveries: 680,
          successRate: 93.8,
          averageTime: 29.1,
        },
        {
          month: '2025-05',
          deliveries: 750,
          successRate: 94.5,
          averageTime: 28.8,
        },
      ],
    } as PerformanceMetrics,
    capabilities: {
      codSupported: true,
      signatureRequired: false,
      photoProofAvailable: true,
      trackingAvailable: true,
      smsNotifications: true,
      whatsappNotifications: false,
      specialHandling: ['fragile', 'documents'],
      vehicleTypes: ['motorcycle', 'car'],
      maxWeight: 30,
      maxDimensions: { length: 80, width: 60, height: 50 },
    },
    integration: {
      apiEndpoint: 'https://api.aleppospeed.sy/v1',
      apiKey: 'as_api_key_2025_encrypted',
      webhookUrl: 'https://souqsyria.com/webhooks/aleppo-speed',
      trackingUrl: 'https://track.aleppospeed.sy/{trackingNumber}',
      autoStatusUpdate: false,
      testMode: false,
      lastSync: new Date('2025-08-19T15:30:00.000Z'),
    },
    companyStatus: {
      isVerified: true,
      verificationDate: new Date('2025-02-20T00:00:00.000Z'),
      licenseNumber: 'SY-SHIP-2025-002',
      insuranceValid: true,
      contractStatus: 'active',
      paymentTerms: 'weekly',
      commission: 12.0,
    },
    isActive: true,
    displayPriority: 20,
  },
];

/**
 * Legacy shipping companies for backward compatibility
 */
export const LEGACY_SHIPPING_COMPANIES_SEED = [
  {
    name: 'DHL Express Syria',
    type: 'external' as const,
    active: true,
    tracking_url_template:
      'https://www.dhl.com/sy-en/home/tracking.html?tracking-id={trackingNumber}',
    contact_info: '+963-11-2345678',
  },
  {
    name: 'Aramex Syria',
    type: 'external' as const,
    active: true,
    tracking_url_template:
      'https://www.aramex.com/tracking?shipmentNumber={trackingNumber}',
    contact_info: '+963-11-3456789',
  },
  {
    name: 'Internal Delivery Team',
    type: 'internal' as const,
    active: true,
    tracking_url_template: null,
    contact_info: 'internal@souqsyria.com',
  },
];

/**
 * Sample shipments for testing workflows
 */
export const SAMPLE_SHIPMENTS_SEED = [
  {
    // Express delivery in progress
    status: ShipmentStatus.OUT_FOR_DELIVERY,
    tracking_code: 'SY-SHIP-2025-001234',
    external_tracking_ref: 'DX-20250820-5678',
    tracking_url: 'https://track.damascusexpress.sy/DX-20250820-5678',
    external_status: 'out_for_delivery',
    proof_type: 'photo' as const,
    scheduled_pickup_at: new Date('2025-08-20T09:00:00.000Z'),
    picked_up_at: new Date('2025-08-20T09:30:00.000Z'),
    estimated_delivery_at: new Date('2025-08-20T15:00:00.000Z'),
    cost_breakdown: {
      baseFee: 1500,
      distanceFee: 1200,
      weightFee: 500,
      expressFee: 2000,
      codFee: 500,
      insuranceFee: 200,
      totalCost: 5900,
      currency: 'SYP',
      calculatedAt: new Date('2025-08-20T08:00:00.000Z'),
    },
    total_cost_syp: 5900.0,
    package_details: {
      weightKg: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      declaredValue: 150000,
      isFragile: true,
      requiresColdStorage: false,
      specialInstructions: 'Handle with care - electronics',
      specialInstructionsAr: 'تعامل بحذر - إلكترونيات',
      contents: [
        {
          item: 'Samsung Galaxy S24',
          itemAr: 'سامسونج غالاكسي إس24',
          quantity: 1,
          value: 150000,
        },
      ],
    },
    service_options: {
      serviceType: 'express',
      serviceName: 'Express Delivery',
      serviceNameAr: 'التوصيل السريع',
      isExpress: true,
      requiresSignature: true,
      cashOnDelivery: true,
      codAmount: 150000,
      insuranceRequired: true,
      callBeforeDelivery: true,
      smsNotifications: true,
      whatsappNotifications: true,
      deliveryInstructions: 'Call 30 minutes before arrival',
      deliveryInstructionsAr: 'اتصل قبل الوصول بـ 30 دقيقة',
      preferredDeliveryTime: '14:00-16:00',
      alternativeContact: '+963-987-123456',
    },
    sla_tracking: {
      slaHours: 6,
      expectedDeliveryTime: new Date('2025-08-20T15:00:00.000Z'),
      isOverdue: false,
      hoursOverdue: 0,
      escalationLevel: 0,
      performanceRating: 4.8,
      onTimeDelivery: true,
      delayReasons: [],
    },
    internal_notes: 'High priority customer - VIP delivery',
    internal_notes_ar: 'عميل عالي الأولوية - توصيل مميز',
    customer_notes: 'Please handle with care',
    customer_notes_ar: 'يرجى التعامل بحذر',
  },
  {
    // Standard delivery completed
    status: ShipmentStatus.DELIVERED,
    tracking_code: 'SY-SHIP-2025-001235',
    external_tracking_ref: 'AS-20250819-9876',
    tracking_url: 'https://track.aleppospeed.sy/AS-20250819-9876',
    external_status: 'delivered',
    proof_type: 'signature' as const,
    proof_data: {
      signatureData: 'base64_signature_data_here',
      recipientName: 'Ahmad Al-Customer',
      recipientNameAr: 'أحمد العميل',
      recipientPhone: '+963-987-654321',
      deliveryNotes: 'Delivered to front door as requested',
      deliveryNotesAr: 'تم التوصيل للباب الأمامي كما طُلب',
      gpsCoordinates: { lat: 33.5138, lng: 36.2765 },
    },
    scheduled_pickup_at: new Date('2025-08-19T10:00:00.000Z'),
    picked_up_at: new Date('2025-08-19T10:15:00.000Z'),
    estimated_delivery_at: new Date('2025-08-20T14:00:00.000Z'),
    delivered_at: new Date('2025-08-20T13:45:00.000Z'),
    confirmed_at: new Date('2025-08-20T13:50:00.000Z'),
    cost_breakdown: {
      baseFee: 1200,
      distanceFee: 800,
      weightFee: 0,
      codFee: 400,
      insuranceFee: 150,
      totalCost: 2550,
      currency: 'SYP',
      calculatedAt: new Date('2025-08-19T09:00:00.000Z'),
    },
    total_cost_syp: 2550.0,
    package_details: {
      weightKg: 1.2,
      dimensions: { length: 25, width: 18, height: 10 },
      declaredValue: 75000,
      isFragile: false,
      requiresColdStorage: false,
      specialInstructions: 'Standard delivery',
      specialInstructionsAr: 'توصيل عادي',
      contents: [
        {
          item: 'Cotton T-Shirt',
          itemAr: 'قميص قطني',
          quantity: 2,
          value: 75000,
        },
      ],
    },
    service_options: {
      serviceType: 'standard',
      serviceName: 'Standard Delivery',
      serviceNameAr: 'التوصيل العادي',
      isExpress: false,
      requiresSignature: true,
      cashOnDelivery: true,
      codAmount: 75000,
      insuranceRequired: false,
      callBeforeDelivery: false,
      smsNotifications: true,
      whatsappNotifications: false,
      deliveryInstructions: 'Leave at door if no answer',
      deliveryInstructionsAr: 'اترك عند الباب في حالة عدم الإجابة',
      preferredDeliveryTime: 'any',
    },
    sla_tracking: {
      slaHours: 48,
      expectedDeliveryTime: new Date('2025-08-20T14:00:00.000Z'),
      isOverdue: false,
      hoursOverdue: 0,
      escalationLevel: 0,
      performanceRating: 4.2,
      onTimeDelivery: true,
      delayReasons: [],
    },
    internal_notes: 'Standard delivery completed successfully',
    internal_notes_ar: 'تم إكمال التوصيل العادي بنجاح',
    customer_notes: 'Thank you for choosing our service',
    customer_notes_ar: 'شكراً لاختياركم خدمتنا',
  },
];

/**
 * Shipment status logs for workflow testing
 */
export const SHIPMENT_STATUS_LOGS_SEED = [
  {
    status: ShipmentStatus.CREATED,
    notes: 'Shipment created and assigned tracking code',
    notes_ar: 'تم إنشاء الشحنة وتعيين رقم التتبع',
    created_by_user_id: 1,
    metadata: {
      source: 'api',
      userAgent: 'SouqSyria Mobile App v1.2.0',
      ipAddress: '192.168.1.100',
    },
  },
  {
    status: ShipmentStatus.ASSIGNED_COMPANY,
    notes: 'Assigned to Damascus Express Delivery',
    notes_ar: 'تم التعيين لشركة دمشق للتوصيل السريع',
    created_by_user_id: 1,
    metadata: {
      assignedCompany: 'Damascus Express Delivery',
      estimatedPickup: '2025-08-20T09:00:00.000Z',
    },
  },
  {
    status: ShipmentStatus.PICKED_UP,
    notes: 'Package picked up by delivery agent Ahmad',
    notes_ar: 'تم استلام الطرد بواسطة عامل التوصيل أحمد',
    created_by_user_id: 2,
    metadata: {
      agentName: 'Ahmad Al-Delivery',
      agentPhone: '+963-987-123456',
      vehicleType: 'motorcycle',
      pickupTime: '2025-08-20T09:30:00.000Z',
    },
  },
];
