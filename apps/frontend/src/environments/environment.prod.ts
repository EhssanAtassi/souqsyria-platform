/**
 * @file environment.prod.ts
 * @description Production environment configuration optimized for performance
 * @module Environment
 */

export const environment = {
  production: true,

  // API Configuration
  apiUrl: 'https://api.souqsyria.com',
  productApiUrl: 'https://api.souqsyria.com/products',
  userApiUrl: 'https://api.souqsyria.com/users',
  apiVersion: 'v1',

  // Performance Configuration
  performance: {
    // Enable performance monitoring
    enableMonitoring: true,
    // Core Web Vitals tracking
    enableWebVitals: true,
    // Bundle analysis in production (for monitoring)
    enableBundleAnalysis: false,
    // Memory leak detection
    enableMemoryMonitoring: true,
    // Network request monitoring
    enableNetworkMonitoring: true,
  },

  // Caching Configuration
  cache: {
    // Service Worker enabled
    serviceWorker: true,
    // API cache duration (minutes)
    apiCacheDuration: {
      dashboard: 5,
      analytics: 10,
      users: 2,
      orders: 2,
      products: 5,
      vendors: 5
    },
    // Static asset cache (hours)
    staticAssetCacheDuration: 24,
    // Font cache duration (days)
    fontCacheDuration: 7
  },

  // Feature Flags
  features: {
    // Enable advanced BI dashboard
    advancedAnalytics: true,
    // Enable real-time updates
    realTimeUpdates: true,
    // Enable offline functionality
    offlineSupport: true,
    // Enable progressive loading
    progressiveLoading: true,
    // Enable image optimization
    imageOptimization: true,
    // Enable lazy loading
    lazyLoading: true,
    // Enable virtual scrolling
    virtualScrolling: true
  },

  // Chart Configuration
  charts: {
    // Maximum data points per chart
    maxDataPoints: 1000,
    // Animation duration (ms)
    animationDuration: 300,
    // Enable GPU acceleration
    gpuAcceleration: true,
    // Enable data virtualization
    dataVirtualization: true,
    // Chart library lazy loading
    lazyLoadLibrary: true
  },

  // Table Configuration
  tables: {
    // Virtual scrolling threshold
    virtualScrollThreshold: 100,
    // Default page size
    defaultPageSize: 20,
    // Maximum page size
    maxPageSize: 100,
    // Enable row recycling
    rowRecycling: true
  },

  // Material Design Configuration
  materialDesign: {
    // Use outlined icons (lighter weight)
    useOutlinedIcons: true,
    // Preload critical icons
    preloadCriticalIcons: true,
    // Fast animations
    fastAnimations: true,
    // Dense typography
    denseTypography: false
  },

  // Security Configuration
  security: {
    // JWT token expiry (minutes)
    jwtExpiryMinutes: 60,
    // Refresh token expiry (hours)
    refreshTokenExpiryHours: 24,
    // CSRF protection
    csrfProtection: true,
    // Content Security Policy
    contentSecurityPolicy: true
  },

  // Logging Configuration
  logging: {
    // Log level: 'error' | 'warn' | 'info' | 'debug'
    level: 'warn',
    // Enable console logging
    console: false,
    // Enable remote logging
    remote: true,
    // Remote logging endpoint
    remoteEndpoint: 'https://logs.souqsyria.com/admin',
    // Performance logs
    performance: true
  },

  // Error Handling
  errorHandling: {
    // Global error handler enabled
    globalHandler: true,
    // Show user-friendly error messages
    userFriendlyMessages: true,
    // Error reporting endpoint
    reportingEndpoint: 'https://errors.souqsyria.com/admin',
    // Retry failed requests
    retryFailedRequests: true,
    // Maximum retry attempts
    maxRetryAttempts: 3
  },

  // Internationalization
  i18n: {
    // Default language
    defaultLanguage: 'en',
    // Supported languages
    supportedLanguages: ['en', 'ar'],
    // RTL support
    rtlSupport: true,
    // Lazy load translations
    lazyLoadTranslations: true
  },

  // Analytics & Tracking
  analytics: {
    // Google Analytics
    googleAnalyticsId: 'GA_TRACKING_ID',
    // Enable user analytics
    userAnalytics: true,
    // Enable performance analytics
    performanceAnalytics: true,
    // Custom event tracking
    customEvents: true
  },

  // CDN Configuration
  cdn: {
    // Use CDN for static assets
    enabled: true,
    // CDN base URL
    baseUrl: 'https://cdn.souqsyria.com',
    // Image CDN
    imageUrl: 'https://images.souqsyria.com',
    // Font CDN
    fontUrl: 'https://fonts.souqsyria.com'
  },

  // Compression Configuration
  compression: {
    // Gzip compression
    gzip: true,
    // Brotli compression (if supported)
    brotli: true,
    // Image compression quality
    imageQuality: 80,
    // WebP support
    webpSupport: true
  }
};

/**
 * Performance monitoring configuration
 */
export const performanceConfig = {
  // Core Web Vitals thresholds
  webVitals: {
    lcp: { good: 2500, needsImprovement: 4000 }, // ms
    fid: { good: 100, needsImprovement: 300 },   // ms
    cls: { good: 0.1, needsImprovement: 0.25 },  // score
    fcp: { good: 1800, needsImprovement: 3000 }, // ms
    ttfb: { good: 800, needsImprovement: 1800 }  // ms
  },

  // Bundle size thresholds
  bundleSize: {
    initial: { warning: 400, error: 800 }, // KB
    vendor: { warning: 500, error: 1000 }, // KB
    main: { warning: 300, error: 600 }     // KB
  },

  // Memory usage thresholds
  memory: {
    baseline: 50,  // MB
    warning: 100,  // MB
    critical: 150  // MB
  }
};

/**
 * Build optimization hints
 */
export const buildOptimization = {
  // Tree shaking configuration
  treeShaking: {
    // Aggressive tree shaking
    aggressive: true,
    // Dead code elimination
    deadCodeElimination: true,
    // Unused variable removal
    unusedVariableRemoval: true
  },

  // Code splitting configuration
  codeSplitting: {
    // Split vendor chunks
    splitVendorChunks: true,
    // Split by route
    splitByRoute: true,
    // Split by feature
    splitByFeature: true,
    // Minimum chunk size (KB)
    minChunkSize: 30
  },

  // Optimization strategies
  optimization: {
    // Minification
    minify: true,
    // Terser options
    terser: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_getters: true,
        unsafe_arrows: true,
        unsafe_methods: true
      },
      mangle: {
        properties: false
      }
    },
    // CSS optimization
    css: {
      minify: true,
      autoprefixer: true,
      purgeCss: false // Disabled due to Material Design dynamic classes
    }
  }
};
