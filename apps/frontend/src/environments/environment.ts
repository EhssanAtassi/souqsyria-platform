/**
 * Environment configuration for SouqSyria Syrian Marketplace
 * Development environment settings
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3006/api',
  campaignApiUrl: 'http://localhost:3006/api/campaigns',
  productApiUrl: 'http://localhost:3006/api/products',
  userApiUrl: 'http://localhost:3006/api/users',

  // Feature flags
  enableCampaigns: true,
  enableAnalytics: false,
  enableABTesting: false,

  // Cache settings
  cacheTimeout: 300000, // 5 minutes
  campaignCacheTimeout: 600000, // 10 minutes

  // API settings
  apiTimeout: 30000, // 30 seconds
  retryAttempts: 3,

  // Syrian marketplace specific
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'SYP'],
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar'],

  // Campaign settings
  defaultCampaignDuration: 86400000, // 24 hours
  maxCampaignsPerPage: 20,
  autoRefreshInterval: 300000, // 5 minutes

  // Development/Debug settings
  enableMockData: false,  // ✅ DISABLED - Using live API integration (Phase 2: T020)
  forceOfflineMode: false,
  logLevel: 'debug',
  enableDevTools: true
};
