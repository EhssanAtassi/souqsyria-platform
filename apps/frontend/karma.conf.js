// Karma configuration file for Syrian Marketplace Angular Enterprise Application
// Supports comprehensive testing including unit tests, integration tests, and coverage reporting

module.exports = function(config) {
  /**
   * Karma Test Configuration for Syrian Marketplace
   *
   * Provides comprehensive testing setup with:
   * - Unit test execution with Jasmine
   * - Code coverage reporting with Istanbul
   * - Multi-browser testing support
   * - Syrian marketplace specific test configurations
   * - Performance benchmarking and reporting
   *
   * @swagger
   * components:
   *   schemas:
   *     KarmaTestConfiguration:
   *       type: object
   *       description: Karma test runner configuration for Syrian marketplace
   *       properties:
   *         frameworks:
   *           type: array
   *           description: Testing frameworks (Jasmine, Angular testing utilities)
   *         browsers:
   *           type: array
   *           description: Target browsers for testing
   *         coverage:
   *           type: object
   *           description: Code coverage configuration and thresholds
   *         reporters:
   *           type: array
   *           description: Test result reporters and coverage tools
   */
  config.set({

    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // Frameworks to use - Angular testing utilities with Jasmine
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    // List of plugins to load
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-spec-reporter'),
      require('karma-junit-reporter')
    ],

    // Syrian Marketplace specific test configuration
    client: {
      clearContext: false, // Leave Jasmine Spec Runner output visible in browser
      jasmine: {
        // Jasmine configuration for Syrian marketplace tests
        random: true, // Run tests in random order
        seed: '12345', // Seed for reproducible random order
        stopOnFailure: false, // Continue running tests even if some fail
        timeoutInterval: 10000, // 10 second timeout for async tests

        // Custom matchers for Syrian marketplace testing
        customMatchers: {
          // Custom matcher for Arabic text validation
          toContainArabicText: function() {
            return {
              compare: function(actual) {
                const arabicRegex = /[\u0600-\u06FF]/;
                const result = {
                  pass: arabicRegex.test(actual)
                };
                if (result.pass) {
                  result.message = `Expected '${actual}' not to contain Arabic text`;
                } else {
                  result.message = `Expected '${actual}' to contain Arabic text`;
                }
                return result;
              }
            };
          },

          // Custom matcher for Syrian currency validation
          toBeValidSyrianCurrency: function() {
            return {
              compare: function(actual) {
                const validCurrencies = ['USD', 'SYP', 'EUR'];
                const result = {
                  pass: validCurrencies.includes(actual)
                };
                if (result.pass) {
                  result.message = `Expected '${actual}' not to be a valid Syrian marketplace currency`;
                } else {
                  result.message = `Expected '${actual}' to be a valid Syrian marketplace currency (${validCurrencies.join(', ')})`;
                }
                return result;
              }
            };
          }
        }
      }
    },

    // Coverage configuration for Syrian marketplace
    coverageReporter: {
      // Output directory for coverage reports
      dir: require('path').join(__dirname, './coverage/souq-syria-storefront'),

      // Coverage report formats
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcov', subdir: 'lcov' },
        { type: 'json', subdir: 'json', file: 'coverage.json' },
        { type: 'text-summary' },
        { type: 'cobertura', subdir: 'cobertura', file: 'coverage.xml' }
      ],

      // Coverage thresholds for Syrian marketplace quality standards
      check: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        },
        each: {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70,
          excludes: [
            // Exclude generated files and mocks
            'src/**/*.mock.ts',
            'src/**/*.spec.ts',
            'src/**/*.e2e.ts',
            'src/test/**/*',
            'src/environments/**/*'
          ]
        }
      },

      // Watermarks for coverage visualization
      watermarks: {
        statements: [70, 80],
        functions: [70, 80],
        branches: [65, 75],
        lines: [70, 80]
      }
    },

    // Coverage Istanbul reporter configuration
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/souq-syria-storefront'),
      reports: ['html', 'lcovonly', 'text-summary', 'json'],
      fixWebpackSourcePaths: true,
      thresholds: {
        emitWarning: false,
        global: {
          statements: 80,
          lines: 80,
          branches: 75,
          functions: 80
        },
        each: {
          statements: 70,
          lines: 70,
          branches: 65,
          functions: 70
        }
      }
    },

    // Test result reporters
    reporters: ['progress', 'kjhtml', 'coverage', 'coverage-istanbul', 'spec', 'junit'],

    // JUnit reporter configuration for CI/CD integration
    junitReporter: {
      outputDir: 'coverage/junit',
      outputFile: 'test-results.xml',
      suite: 'Syrian Marketplace Admin Tests',
      useBrowserName: false,
      nameFormatter: undefined,
      classNameFormatter: undefined,
      properties: {
        project: 'Syrian Marketplace',
        version: '1.0.0',
        environment: 'test'
      }
    },

    // Spec reporter configuration for detailed console output
    specReporter: {
      maxLogLines: 5,
      suppressErrorSummary: false,
      suppressFailed: false,
      suppressPassed: false,
      suppressSkipped: true,
      showSpecTiming: true,
      failFast: false,
      prefixes: {
        success: '✓ ',
        failure: '✗ ',
        skipped: '○ '
      }
    },

    // Web server port
    port: 9876,

    // Enable/disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // Possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable/disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'ChromeHeadless'],

    // Custom browser configurations for Syrian marketplace testing
    customLaunchers: {
      ChromeHeadlessCustom: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--remote-debugging-port=9222'
        ]
      },
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9222',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless']
      }
    },

    // Browser timeout configurations
    browserDisconnectTimeout: 30000,
    browserDisconnectTolerance: 5,
    browserNoActivityTimeout: 120000,
    captureTimeout: 120000,

    // Continuous Integration mode
    // If true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level - how many browser will be started simultaneously
    concurrency: Infinity,

    // Preprocess matching files before serving them to the browser
    preprocessors: {
      'src/**/*.ts': ['coverage']
    },

    // Test files and patterns
    files: [
      // Include test setup files
      'src/test.ts',

      // Include all test files
      'src/**/*.spec.ts',
      'src/**/*.test.ts',

      // Include Syrian marketplace test data
      'src/assets/test-data/**/*.json',

      // Include Arabic font files for testing
      { pattern: 'src/assets/fonts/**/*', watched: false, included: false, served: true }
    ],

    // List of files/patterns to exclude
    exclude: [
      'src/**/*.e2e.ts',
      'e2e/**/*',
      'node_modules/**/*'
    ],

    // Proxies for serving static assets during tests
    proxies: {
      '/assets/': '/base/src/assets/',
      '/images/': '/base/src/assets/images/',
      '/fonts/': '/base/src/assets/fonts/'
    },

    // MIME type configuration for Syrian marketplace assets
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },

    // Custom configuration for Syrian marketplace testing
    customContextFile: 'src/karma-context.html',

    // Performance monitoring configuration
    performance: {
      budget: [
        {
          type: 'initial',
          maximumWarning: '500kb',
          maximumError: '1mb'
        },
        {
          type: 'anyComponentStyle',
          maximumWarning: '2kb',
          maximumError: '4kb'
        }
      ]
    },

    // Environment-specific configurations
    env: {
      NODE_ENV: 'test',
      SYRIAN_MARKETPLACE_ENV: 'test',
      API_BASE_URL: 'http://localhost:3000/api',
      COVERAGE_ENABLED: true
    }
  });

  // Environment-specific overrides
  if (process.env.CI) {
    // CI environment configuration
    config.set({
      browsers: ['ChromeHeadlessCustom'],
      singleRun: true,
      autoWatch: false,
      reporters: ['progress', 'coverage-istanbul', 'junit'],
      logLevel: config.LOG_ERROR,
      concurrency: 1
    });
  }

  // Performance testing configuration
  if (process.env.PERFORMANCE_TEST) {
    config.set({
      browsers: ['ChromeHeadlessCustom'],
      singleRun: true,
      browserNoActivityTimeout: 120000,
      captureTimeout: 120000,
      customLaunchers: {
        ChromeHeadlessPerformance: {
          base: 'ChromeHeadless',
          flags: [
            '--no-sandbox',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
          ]
        }
      }
    });
  }

  // Debug configuration for Syrian marketplace development
  if (process.env.DEBUG_TESTS) {
    config.set({
      browsers: ['ChromeDebugging'],
      singleRun: false,
      autoWatch: true,
      logLevel: config.LOG_DEBUG,
      client: {
        clearContext: false,
        captureConsole: true
      }
    });
  }
};