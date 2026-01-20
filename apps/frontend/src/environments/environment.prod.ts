/**
 * Environment configuration for SouqSyria Syrian Marketplace
 * Production environment settings
 */

export const environment = {
  production: true,
  apiUrl: 'https://api.souqsyria.com/api',
  campaignApiUrl: 'https://api.souqsyria.com/api/campaigns',
  productApiUrl: 'https://api.souqsyria.com/api/products',
  userApiUrl: 'https://api.souqsyria.com/api/users',

  // Feature flags
  enableCampaigns: true,
  enableAnalytics: true,
  enableABTesting: true,

  // Cache settings
  cacheTimeout: 600000, // 10 minutes
  campaignCacheTimeout: 1800000, // 30 minutes

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
  autoRefreshInterval: 900000, // 15 minutes

  // Production settings
  enableMockData: false,
  logLevel: 'error',
  enableDevTools: false
};