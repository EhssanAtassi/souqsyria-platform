/**
 * @file jest.backend.config.js
 * @description Jest configuration for backend unit tests
 *
 * Configuration for NestJS backend testing including:
 * - TypeScript support via ts-jest
 * - Test module transformation
 * - Coverage collection
 * - Test environment setup
 *
 * @author Test Automation Team
 * @since 2026-01-24
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Node environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/src/**/__tests__/**/*.spec.ts',
    '**/src/**/*.spec.ts'
  ],

  // Root directory
  rootDir: 'apps/backend',

  // Module paths
  moduleFileExtensions: ['ts', 'js', 'json'],

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        // Include test files in compilation
        types: ['jest', 'node']
      }
    }
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.decorator.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.d.ts',
    '!src/database/**',
    '!src/**/migrations/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/business-intelligence/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/admin-dashboard/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'json',
    'lcov',
    'json-summary'
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/../../coverage/backend',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Display individual test results
  bail: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(exponential-backoff)/)'
  ],

  // Snapshot serializer
  snapshotSerializers: [],

  // Notification settings
  notify: false,

  // Reporter options
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/../../test-results/backend',
        outputName: 'junit.xml',
        suiteName: 'Backend Unit Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: false
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/../../test-results/backend',
        filename: 'test-report.html',
        pageTitle: 'Backend Unit Tests Report'
      }
    ]
  ]
};
