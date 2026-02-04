/**
 * @file dashboard-seeds.data.ts
 * @description Comprehensive seed data for Syrian Dashboard and Analytics system
 * 
 * FEATURES:
 * - Syrian market analytics test data with SYP currency support
 * - Multi-governorate performance metrics with Arabic localization
 * - KYC, Manufacturer, and Shipment analytics integration
 * - Real-time performance indicators and system alerts
 * - Economic indicators with exchange rate data
 * - User behavior analytics and demographic insights
 * - Seasonal trends and product performance data
 * - Business intelligence metrics for Syrian market
 * 
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

// Note: Governorate data uses direct values rather than enum imports for simplicity

/**
 * Sample Syrian market overview data
 */
export const SAMPLE_SYRIAN_MARKET_OVERVIEW = {
  totalRevenueSyp: 1250000000, // 1.25 billion SYP
  totalRevenueUsd: 83333.33, // At 15,000 SYP per USD
  totalOrders: 8500,
  activeUsers: 25600,
  verifiedVendors: 145,
  verifiedManufacturers: 78,
  completedKycDocuments: 567,
  averageOrderValueSyp: 147058.82,
  monthlyGrowthRate: 18.5,
  marketPenetrationByGovernorate: [
    {
      governorateId: 1,
      nameEn: 'Damascus',
      nameAr: 'دمشق',
      orderCount: 3200,
      revenueSyp: 520000000,
      userCount: 12500,
      penetrationRate: 8.7,
    },
    {
      governorateId: 2,
      nameEn: 'Aleppo',
      nameAr: 'حلب',
      orderCount: 2850,
      revenueSyp: 425000000,
      userCount: 9800,
      penetrationRate: 6.2,
    },
    {
      governorateId: 3,
      nameEn: 'Homs',
      nameAr: 'حمص',
      orderCount: 1200,
      revenueSyp: 165000000,
      userCount: 4200,
      penetrationRate: 4.1,
    },
    {
      governorateId: 4,
      nameEn: 'Lattakia',
      nameAr: 'اللاذقية',
      orderCount: 950,
      revenueSyp: 95000000,
      userCount: 3100,
      penetrationRate: 3.8,
    },
    {
      governorateId: 5,
      nameEn: 'Hama',
      nameAr: 'حماة',
      orderCount: 300,
      revenueSyp: 45000000,
      userCount: 1200,
      penetrationRate: 2.1,
    },
  ],
};

/**
 * Sample business intelligence metrics
 */
export const SAMPLE_BUSINESS_INTELLIGENCE = {
  kycCompliance: {
    totalDocuments: 890,
    approvedDocuments: 567,
    pendingDocuments: 234,
    rejectedDocuments: 89,
    complianceRate: 63.7,
    averageProcessingTime: 42.5,
    documentTypeDistribution: {
      'syrian_id': 423,
      'business_license': 187,
      'tax_certificate': 156,
      'chamber_of_commerce': 89,
      'bank_statement': 35,
    },
  },
  manufacturerEcosystem: {
    totalManufacturers: 78,
    verifiedManufacturers: 52,
    localManufacturers: 45,
    internationalBrands: 33,
    averageQualityScore: 87.3,
    topPerformingManufacturers: [
      {
        id: 1,
        nameEn: 'Damascus Steel Industries',
        nameAr: 'صناعات دمشق للفولاذ',
        qualityScore: 95.8,
        totalProducts: 156,
        averageRating: 4.7,
      },
      {
        id: 2,
        nameEn: 'Aleppo Textile Group',
        nameAr: 'مجموعة حلب للنسيج',
        qualityScore: 92.4,
        totalProducts: 234,
        averageRating: 4.5,
      },
      {
        id: 3,
        nameEn: 'Syrian Tech Solutions',
        nameAr: 'الحلول التقنية السورية',
        qualityScore: 91.2,
        totalProducts: 89,
        averageRating: 4.6,
      },
    ],
  },
  shippingInsights: {
    totalShipments: 8500,
    deliveredShipments: 7650,
    deliverySuccessRate: 90.0,
    averageDeliveryTime: 3.2,
    shippingCompanyPerformance: [
      {
        companyId: 1,
        nameEn: 'Damascus Express Delivery',
        nameAr: 'دمشق للتوصيل السريع',
        deliveryRate: 94.5,
        averageTime: 2.8,
        orderCount: 3200,
      },
      {
        companyId: 2,
        nameEn: 'Aleppo Speed Logistics',
        nameAr: 'حلب للخدمات اللوجستية السريعة',
        deliveryRate: 91.2,
        averageTime: 3.1,
        orderCount: 2850,
      },
      {
        companyId: 3,
        nameEn: 'Syrian National Courier',
        nameAr: 'البريد الوطني السوري',
        deliveryRate: 88.7,
        averageTime: 3.8,
        orderCount: 2450,
      },
    ],
  },
  regionalPerformance: {
    topPerformingGovernorates: [
      {
        governorateId: 1,
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        revenueSyp: 520000000,
        orderCount: 3200,
        growthRate: 25.3,
        userEngagement: 8.7,
      },
      {
        governorateId: 2,
        nameEn: 'Aleppo',
        nameAr: 'حلب',
        revenueSyp: 425000000,
        orderCount: 2850,
        growthRate: 18.9,
        userEngagement: 7.2,
      },
      {
        governorateId: 3,
        nameEn: 'Homs',
        nameAr: 'حمص',
        revenueSyp: 165000000,
        orderCount: 1200,
        growthRate: 12.4,
        userEngagement: 5.8,
      },
    ],
    emergingMarkets: [
      {
        governorateId: 6,
        nameEn: 'Tartus',
        nameAr: 'طرطوس',
        potentialScore: 78.5,
        currentPenetration: 1.2,
        recommendedInvestment: 850000,
      },
      {
        governorateId: 7,
        nameEn: 'Daraa',
        nameAr: 'درعا',
        potentialScore: 72.3,
        currentPenetration: 0.8,
        recommendedInvestment: 650000,
      },
    ],
  },
};

/**
 * Sample real-time performance metrics
 */
export const SAMPLE_REALTIME_METRICS = {
  currentHourMetrics: {
    orderCount: 47,
    revenueSyp: 6920000,
    activeUsers: 1840,
    conversionRate: 4.2,
  },
  todayVsYesterday: {
    orderChange: 15.8,
    revenueChange: 22.4,
    userChange: 8.7,
    performanceIndicator: 'up' as const,
  },
  systemHealth: {
    apiResponseTime: 127,
    databasePerformance: 96.8,
    cacheHitRate: 91.2,
    errorRate: 0.18,
    systemStatus: 'excellent' as const,
  },
  alerts: [
    {
      type: 'revenue' as const,
      severity: 'low' as const,
      messageEn: 'Revenue trending 22% higher than yesterday',
      messageAr: 'الإيرادات تتجه للأعلى بنسبة 22% مقارنة بالأمس',
      timestamp: new Date(),
      actionRequired: false,
    },
    {
      type: 'orders' as const,
      severity: 'medium' as const,
      messageEn: 'Order volume spike detected in Damascus region',
      messageAr: 'تم اكتشاف ارتفاع في حجم الطلبات في منطقة دمشق',
      timestamp: new Date(),
      actionRequired: true,
    },
    {
      type: 'system' as const,
      severity: 'low' as const,
      messageEn: 'Cache hit rate optimal at 91.2%',
      messageAr: 'معدل إصابة التخزين المؤقت مثالي عند 91.2%',
      timestamp: new Date(),
      actionRequired: false,
    },
  ],
};

/**
 * Sample Syrian market trends
 */
export const SAMPLE_MARKET_TRENDS = {
  seasonalTrends: {
    currentSeason: 'winter' as const,
    seasonalImpact: 18.5,
    topSeasonalCategories: [
      'Electronics and Gadgets',
      'Winter Clothing',
      'Home Heating Equipment',
      'Holiday Decorations',
    ],
    expectedGrowth: 15.2,
  },
  productTrends: {
    trendingCategories: [
      {
        categoryId: 1,
        nameEn: 'Electronics',
        nameAr: 'الإلكترونيات',
        growthRate: 32.5,
        orderVolume: 1580,
      },
      {
        categoryId: 2,
        nameEn: 'Fashion & Clothing',
        nameAr: 'الأزياء والملابس',
        growthRate: 24.8,
        orderVolume: 2240,
      },
      {
        categoryId: 3,
        nameEn: 'Home & Kitchen',
        nameAr: 'المنزل والمطبخ',
        growthRate: 19.6,
        orderVolume: 1890,
      },
    ],
    decliningCategories: [
      {
        categoryId: 4,
        nameEn: 'Sports Equipment',
        nameAr: 'المعدات الرياضية',
        declineRate: -12.3,
        actionRecommended: 'Consider seasonal promotions and partnerships with local sports clubs',
      },
      {
        categoryId: 5,
        nameEn: 'Garden & Outdoor',
        nameAr: 'الحديقة والهواء الطلق',
        declineRate: -8.7,
        actionRecommended: 'Focus on indoor gardening and seasonal preparation products',
      },
    ],
  },
  userBehaviorAnalytics: {
    averageSessionTime: 324,
    bounceRate: 28.7,
    conversionFunnel: {
      visitors: 128500,
      productViews: 89600,
      cartAdditions: 23400,
      checkouts: 12800,
      completedOrders: 8500,
    },
    demographicInsights: {
      ageDistribution: {
        '18-24': 18.5,
        '25-34': 34.2,
        '35-44': 28.7,
        '45-54': 12.4,
        '55-64': 4.8,
        '65+': 1.4,
      },
      genderDistribution: {
        'male': 58.3,
        'female': 41.7,
      },
      governorateDistribution: {
        'damascus': 38.2,
        'aleppo': 24.6,
        'homs': 12.8,
        'lattakia': 8.4,
        'hama': 6.2,
        'others': 9.8,
      },
    },
  },
  economicIndicators: {
    sypExchangeRate: 15000,
    inflationImpact: 12.8,
    purchasingPowerIndex: 68.4,
    economicSentiment: 'neutral' as const,
    recommendedPricing: {
      adjustmentPercentage: 8.5,
      reasoning: 'Gradual price adjustment recommended to account for inflation while maintaining competitiveness',
      reasoningAr: 'يُوصى بتعديل تدريجي للأسعار لمراعاة التضخم مع الحفاظ على القدرة التنافسية',
    },
  },
};

/**
 * Sample historical analytics data for trend analysis
 */
export const SAMPLE_HISTORICAL_ANALYTICS = [
  {
    date: '2025-01-01',
    dateAr: '1 كانون الثاني 2025',
    revenue: 45000000,
    orders: 320,
    users: 2400,
    conversionRate: 3.2,
    averageOrderValue: 140625,
  },
  {
    date: '2025-02-01',
    dateAr: '1 شباط 2025',
    revenue: 52000000,
    orders: 380,
    users: 2850,
    conversionRate: 3.6,
    averageOrderValue: 136842,
  },
  {
    date: '2025-03-01',
    dateAr: '1 آذار 2025',
    revenue: 48500000,
    orders: 340,
    users: 2650,
    conversionRate: 3.4,
    averageOrderValue: 142647,
  },
  {
    date: '2025-04-01',
    dateAr: '1 نيسان 2025',
    revenue: 61000000,
    orders: 425,
    users: 3200,
    conversionRate: 3.8,
    averageOrderValue: 143529,
  },
  {
    date: '2025-05-01',
    dateAr: '1 أيار 2025',
    revenue: 67500000,
    orders: 470,
    users: 3600,
    conversionRate: 4.1,
    averageOrderValue: 143617,
  },
  {
    date: '2025-06-01',
    dateAr: '1 حزيران 2025',
    revenue: 73000000,
    orders: 520,
    users: 3950,
    conversionRate: 4.3,
    averageOrderValue: 140385,
  },
];

/**
 * Sample KPI targets and benchmarks for Syrian market
 */
export const SAMPLE_KPI_TARGETS = {
  revenueTargets: {
    monthlyTargetSyp: 85000000,
    quarterlyTargetSyp: 255000000,
    annualTargetSyp: 1020000000,
    currentProgressPercentage: 73.5,
  },
  operationalTargets: {
    orderVolumeTarget: 600,
    userAcquisitionTarget: 4500,
    conversionRateTarget: 4.8,
    customerRetentionTarget: 78.5,
    currentOrderProgress: 86.7,
    currentUserProgress: 88.0,
    currentConversionProgress: 87.5,
    currentRetentionProgress: 82.3,
  },
  qualityTargets: {
    customerSatisfactionTarget: 90.0,
    deliverySuccessRateTarget: 95.0,
    systemUptimeTarget: 99.5,
    responseTimeTarget: 150, // milliseconds
    currentSatisfactionScore: 87.2,
    currentDeliveryRate: 90.0,
    currentUptime: 99.2,
    currentResponseTime: 127,
  },
  complianceTargets: {
    kycComplianceTarget: 85.0,
    manufacturerVerificationTarget: 75.0,
    vendorOnboardingTarget: 90.0,
    currentKycCompliance: 63.7,
    currentManufacturerVerification: 66.7,
    currentVendorOnboarding: 92.4,
  },
};

/**
 * Configuration for bulk analytics data generation
 */
export const BULK_ANALYTICS_GENERATION_CONFIG = {
  timeRanges: ['1h', '1d', '1w', '1m', '3m', '6m', '1y'],
  metrics: [
    'revenue',
    'orders',
    'users',
    'conversion_rate',
    'average_order_value',
    'customer_satisfaction',
    'delivery_rate',
    'response_time',
  ],
  governorates: [
    'damascus',
    'aleppo',
    'homs',
    'lattakia',
    'hama',
    'tartus',
    'daraa',
    'as_suwayda',
    'quneitra',
    'rif_dimashq',
    'idlib',
    'deir_ez_zor',
    'al_raqqa',
    'al_hasakah',
  ],
  categories: [
    'electronics',
    'fashion',
    'home_kitchen',
    'sports',
    'books',
    'beauty',
    'automotive',
    'garden',
    'toys',
    'health',
  ],
  alertTypes: ['revenue', 'orders', 'users', 'system', 'quality', 'compliance'],
  severityLevels: ['low', 'medium', 'high', 'critical'],
  systemStatuses: ['excellent', 'good', 'warning', 'critical'],
  performanceIndicators: ['up', 'down', 'stable'],
  economicSentiments: ['positive', 'neutral', 'negative'],
  seasons: ['spring', 'summer', 'autumn', 'winter'],
};

/**
 * Sample dashboard widget configurations
 */
export const SAMPLE_DASHBOARD_WIDGETS = [
  {
    id: 'revenue_overview',
    titleEn: 'Revenue Overview',
    titleAr: 'نظرة عامة على الإيرادات',
    type: 'chart',
    size: 'large',
    position: { row: 1, col: 1 },
    config: {
      chartType: 'line',
      timeRange: '30d',
      currency: 'SYP',
      showTrend: true,
      showComparison: true,
    },
    isActive: true,
  },
  {
    id: 'order_metrics',
    titleEn: 'Order Metrics',
    titleAr: 'مقاييس الطلبات',
    type: 'metrics',
    size: 'medium',
    position: { row: 1, col: 2 },
    config: {
      showGrowthRate: true,
      comparisonPeriod: 'previous_month',
      includeProjection: true,
    },
    isActive: true,
  },
  {
    id: 'geographic_distribution',
    titleEn: 'Geographic Distribution',
    titleAr: 'التوزيع الجغرافي',
    type: 'map',
    size: 'large',
    position: { row: 2, col: 1 },
    config: {
      mapType: 'syrian_governorates',
      metric: 'revenue',
      showHeatmap: true,
      includeLabels: true,
    },
    isActive: true,
  },
  {
    id: 'real_time_alerts',
    titleEn: 'Real-time Alerts',
    titleAr: 'التنبيهات المباشرة',
    type: 'alerts',
    size: 'medium',
    position: { row: 2, col: 2 },
    config: {
      maxAlerts: 5,
      autoRefresh: true,
      refreshInterval: 30000,
      showTimestamp: true,
    },
    isActive: true,
  },
];

/**
 * Sample export templates for reports
 */
export const SAMPLE_EXPORT_TEMPLATES = {
  executive_summary: {
    templateId: 'executive_summary',
    nameEn: 'Executive Summary Report',
    nameAr: 'تقرير ملخص تنفيذي',
    description: 'High-level overview for executives and stakeholders',
    descriptionAr: 'نظرة عامة رفيعة المستوى للمديرين التنفيذيين وأصحاب المصلحة',
    sections: [
      'market_overview',
      'key_metrics',
      'performance_trends',
      'growth_opportunities',
      'risk_assessment',
    ],
    formats: ['pdf', 'excel'],
    frequency: 'monthly',
  },
  operational_dashboard: {
    templateId: 'operational_dashboard',
    nameEn: 'Operational Dashboard Report',
    nameAr: 'تقرير لوحة التحكم التشغيلية',
    description: 'Detailed operational metrics and KPIs',
    descriptionAr: 'المقاييس التشغيلية التفصيلية ومؤشرات الأداء الرئيسية',
    sections: [
      'daily_operations',
      'shipping_performance',
      'inventory_status',
      'vendor_performance',
      'customer_satisfaction',
    ],
    formats: ['pdf', 'excel', 'csv'],
    frequency: 'weekly',
  },
  financial_analysis: {
    templateId: 'financial_analysis',
    nameEn: 'Financial Analysis Report',
    nameAr: 'تقرير التحليل المالي',
    description: 'Comprehensive financial performance and forecasting',
    descriptionAr: 'الأداء المالي الشامل والتنبؤات',
    sections: [
      'revenue_analysis',
      'profit_margins',
      'cost_breakdown',
      'financial_ratios',
      'forecasting',
    ],
    formats: ['excel', 'pdf'],
    frequency: 'monthly',
  },
};