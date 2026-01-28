/**
 * @file jest.backend.integration.config.js
 * @description Jest configuration for backend integration tests
 *
 * Configuration for NestJS backend integration testing including:
 * - Database setup and teardown
 * - Service integration testing
 * - API endpoint validation
 * - E2E-like controller tests
 *
 * @author Test Automation Team
 * @since 2026-01-24
 */

module.exports = {
  // Use ts-jest preset
  preset: 'ts-jest',

  // Node environment
  testEnvironment: 'node',

  // Test file patterns for integration tests
  testMatch: [
    '**/src/**/__tests__/**/*.integration.spec.ts',
    '**/src/**/**/*.integration.spec.ts'
  ],

  // Root directory
  rootDir: 'apps/backend',

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['jest', 'node', '@types/express']
      }
    }
  },

  // Module name mapper
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/../../test-infrastructure/$1'
  },

  // Setup files for test database
  setupFilesAfterEnv: [
    '<rootDir>/jest.integration.setup.ts'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts'
  ],

  // Coverage thresholds (slightly lower for integration tests)
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/business-intelligence/services/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
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
  coverageDirectory: '<rootDir>/../../coverage/backend-integration',

  // Test timeout (longer for integration tests)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Don't bail on first failure
  bail: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Notification settings
  notify: false,

  // Reporter options
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/../../test-results/backend-integration',
        outputName: 'junit.xml',
        suiteName: 'Backend Integration Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: false
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/../../test-results/backend-integration',
        filename: 'test-report.html',
        pageTitle: 'Backend Integration Tests Report'
      }
    ]
  ],

  // Max workers (limit parallel test execution for integration tests)
  maxWorkers: '50%',

  // Slow test threshold (ms)
  slowTestThreshold: 5
};
