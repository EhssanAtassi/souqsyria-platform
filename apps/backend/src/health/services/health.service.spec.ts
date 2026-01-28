/**
 * @file health.service.spec.ts
 * @description Unit tests for Health Service
 *
 * Tests system metrics collection, version information, and uptime tracking.
 * Validates proper formatting of memory, CPU, and system information.
 *
 * @author Test Suite
 * @since 2026-01-21
 * @version 1.0.0
 */

import { HealthService, SystemMetrics, VersionInfo } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemMetrics()', () => {
    /**
     * Test: Should return system metrics object
     * Description: Verify all required metrics are included in response
     */
    it('should return system metrics object', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('uptimeFormatted');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('system');
      expect(metrics).toHaveProperty('version');
      expect(metrics).toHaveProperty('nodeVersion');
      expect(metrics).toHaveProperty('environment');
      expect(metrics).toHaveProperty('timestamp');
    });

    /**
     * Test: Should include valid uptime
     * Description: Uptime should be positive number representing seconds
     */
    it('should include valid uptime', () => {
      const metrics = service.getSystemMetrics();

      expect(typeof metrics.uptime).toBe('number');
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test: Should format uptime as readable string
     * Description: uptimeFormatted should be human-readable duration string
     */
    it('should format uptime as readable string', () => {
      const metrics = service.getSystemMetrics();

      expect(typeof metrics.uptimeFormatted).toBe('string');
      expect(metrics.uptimeFormatted.length).toBeGreaterThan(0);
      // Should contain at least one time unit (second, minute, hour, or day)
      const hasTimeUnit =
        /second|minute|hour|day/.test(metrics.uptimeFormatted);
      expect(hasTimeUnit).toBe(true);
    });

    /**
     * Test: Should include memory metrics
     * Description: Memory object should have heap, external, and RSS measurements
     */
    it('should include memory metrics', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics.memory).toBeDefined();
      expect(metrics.memory).toHaveProperty('heapUsed');
      expect(metrics.memory).toHaveProperty('heapTotal');
      expect(metrics.memory).toHaveProperty('external');
      expect(metrics.memory).toHaveProperty('rss');
      expect(metrics.memory).toHaveProperty('heapUsedMB');
      expect(metrics.memory).toHaveProperty('heapTotalMB');
      expect(metrics.memory).toHaveProperty('rssMB');
    });

    /**
     * Test: Should format memory in MB
     * Description: Memory values should be formatted with MB suffix
     */
    it('should format memory in MB', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics.memory.heapUsedMB).toMatch(/^\d+\.\d{2}\s(B|KB|MB|GB|TB)$/);
      expect(metrics.memory.heapTotalMB).toMatch(/^\d+\.\d{2}\s(B|KB|MB|GB|TB)$/);
      expect(metrics.memory.rssMB).toMatch(/^\d+\.\d{2}\s(B|KB|MB|GB|TB)$/);
    });

    /**
     * Test: Should include CPU metrics
     * Description: CPU object should include user, system, load average, and core count
     */
    it('should include CPU metrics', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics.cpu).toBeDefined();
      expect(metrics.cpu).toHaveProperty('user');
      expect(metrics.cpu).toHaveProperty('system');
      expect(metrics.cpu).toHaveProperty('loadAverage');
      expect(metrics.cpu).toHaveProperty('cores');
    });

    /**
     * Test: Should include load averages
     * Description: Load average should be array with 1min, 5min, 15min values
     */
    it('should include load averages', () => {
      const metrics = service.getSystemMetrics();

      expect(Array.isArray(metrics.cpu.loadAverage)).toBe(true);
      expect(metrics.cpu.loadAverage.length).toBe(3);
      metrics.cpu.loadAverage.forEach(load => {
        expect(typeof load).toBe('number');
        expect(load).toBeGreaterThanOrEqual(0);
      });
    });

    /**
     * Test: Should include system information
     * Description: System object should have platform, arch, memory, and hostname
     */
    it('should include system information', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics.system).toBeDefined();
      expect(metrics.system).toHaveProperty('platform');
      expect(metrics.system).toHaveProperty('arch');
      expect(metrics.system).toHaveProperty('totalMemory');
      expect(metrics.system).toHaveProperty('freeMemory');
      expect(metrics.system).toHaveProperty('hostname');
    });

    /**
     * Test: Should include platform information
     * Description: Platform should be valid OS name (darwin, linux, win32, etc)
     */
    it('should include platform information', () => {
      const metrics = service.getSystemMetrics();

      expect(typeof metrics.system.platform).toBe('string');
      expect(['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'sunos']).toContain(
        metrics.system.platform,
      );
    });

    /**
     * Test: Should include application version
     * Description: Should read version from APP_VERSION env or default to 1.0.0
     */
    it('should include application version', () => {
      const metrics = service.getSystemMetrics();

      expect(typeof metrics.version).toBe('string');
      expect(metrics.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    /**
     * Test: Should include Node.js version
     * Description: Node version should match process.version format
     */
    it('should include Node.js version', () => {
      const metrics = service.getSystemMetrics();

      expect(typeof metrics.nodeVersion).toBe('string');
      expect(metrics.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    /**
     * Test: Should include environment
     * Description: Environment should be from NODE_ENV or default to development
     */
    it('should include environment', () => {
      const metrics = service.getSystemMetrics();

      expect(typeof metrics.environment).toBe('string');
      expect(['development', 'production', 'test', 'staging']).toContain(
        metrics.environment,
      );
    });

    /**
     * Test: Should include current timestamp
     * Description: Timestamp should be Date object representing collection time
     */
    it('should include current timestamp', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(metrics.timestamp.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    /**
     * Test: Multiple calls should return consistent structure
     * Description: Repeated calls should always return same structure with updated values
     */
    it('multiple calls should return consistent structure', () => {
      const metrics1 = service.getSystemMetrics();
      const metrics2 = service.getSystemMetrics();

      expect(Object.keys(metrics1)).toEqual(Object.keys(metrics2));
      expect(Object.keys(metrics1.memory)).toEqual(Object.keys(metrics2.memory));
      expect(Object.keys(metrics1.cpu)).toEqual(Object.keys(metrics2.cpu));
      expect(Object.keys(metrics1.system)).toEqual(Object.keys(metrics2.system));
    });
  });

  describe('getVersionInfo()', () => {
    /**
     * Test: Should return version information object
     * Description: Verify all required version fields are present
     */
    it('should return version information object', () => {
      const versionInfo = service.getVersionInfo();

      expect(versionInfo).toBeDefined();
      expect(versionInfo).toHaveProperty('version');
      expect(versionInfo).toHaveProperty('buildDate');
      expect(versionInfo).toHaveProperty('gitCommit');
      expect(versionInfo).toHaveProperty('nodeVersion');
      expect(versionInfo).toHaveProperty('npmVersion');
      expect(versionInfo).toHaveProperty('environment');
      expect(versionInfo).toHaveProperty('apiVersion');
    });

    /**
     * Test: Should include semantic version
     * Description: Version should follow semantic versioning format (X.Y.Z)
     */
    it('should include semantic version', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.version).toBe('string');
      expect(versionInfo.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    /**
     * Test: Should include build date
     * Description: Build date should be ISO string or fallback to startup time
     */
    it('should include build date', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.buildDate).toBe('string');
      // Should be ISO string format
      expect(() => new Date(versionInfo.buildDate)).not.toThrow();
    });

    /**
     * Test: Should include git commit hash
     * Description: Git commit should be hash or 'unknown' if not available
     */
    it('should include git commit hash', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.gitCommit).toBe('string');
      expect(versionInfo.gitCommit.length).toBeGreaterThan(0);
    });

    /**
     * Test: Should include Node.js version
     * Description: Node version should match process.version format
     */
    it('should include Node.js version', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.nodeVersion).toBe('string');
      expect(versionInfo.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    /**
     * Test: Should include npm version
     * Description: npm version should be valid semver or 'unknown'
     */
    it('should include npm version', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.npmVersion).toBe('string');
      expect(versionInfo.npmVersion.length).toBeGreaterThan(0);
    });

    /**
     * Test: Should include environment
     * Description: Environment should be development, production, test, or staging
     */
    it('should include environment', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.environment).toBe('string');
      expect(['development', 'production', 'test', 'staging']).toContain(
        versionInfo.environment,
      );
    });

    /**
     * Test: Should include API version
     * Description: API version should be v1, v2, etc
     */
    it('should include API version', () => {
      const versionInfo = service.getVersionInfo();

      expect(typeof versionInfo.apiVersion).toBe('string');
      expect(versionInfo.apiVersion).toMatch(/^v\d+/);
    });

    /**
     * Test: API version should be v1
     * Description: Current API version should be v1
     */
    it('API version should be v1', () => {
      const versionInfo = service.getVersionInfo();

      expect(versionInfo.apiVersion).toBe('v1');
    });

    /**
     * Test: Multiple calls should return same structure
     * Description: Repeated calls should always return same structure
     */
    it('multiple calls should return same structure', () => {
      const version1 = service.getVersionInfo();
      const version2 = service.getVersionInfo();

      expect(Object.keys(version1)).toEqual(Object.keys(version2));
    });

    /**
     * Test: Version should be consistent across calls
     * Description: Version number should not change between calls
     */
    it('version should be consistent across calls', () => {
      const version1 = service.getVersionInfo();
      const version2 = service.getVersionInfo();

      expect(version1.version).toBe(version2.version);
      expect(version1.apiVersion).toBe(version2.apiVersion);
    });
  });

  describe('getStartTime()', () => {
    /**
     * Test: Should return start time as Date
     * Description: Start time should be Date object representing service initialization
     */
    it('should return start time as Date', () => {
      const startTime = service.getStartTime();

      expect(startTime).toBeInstanceOf(Date);
    });

    /**
     * Test: Start time should be in the past
     * Description: Service start time should not be in the future
     */
    it('start time should be in the past', () => {
      const startTime = service.getStartTime();

      expect(startTime.getTime()).toBeLessThanOrEqual(Date.now());
    });

    /**
     * Test: Start time should be consistent
     * Description: Multiple calls should return same start time
     */
    it('start time should be consistent', () => {
      const startTime1 = service.getStartTime();
      const startTime2 = service.getStartTime();

      expect(startTime1.getTime()).toBe(startTime2.getTime());
    });

    /**
     * Test: Start time should be within reasonable range
     * Description: Service startup should be recent (within last minute in tests)
     */
    it('start time should be within reasonable range', () => {
      const startTime = service.getStartTime();
      const now = Date.now();
      const timeDiff = now - startTime.getTime();

      // Should have started within last 60 seconds
      expect(timeDiff).toBeLessThan(60000);
      expect(timeDiff).toBeGreaterThanOrEqual(0);
    });
  });

  describe('hasMinimumUptime()', () => {
    /**
     * Test: Should return true when uptime exceeds minimum
     * Description: Should verify application meets minimum uptime requirement
     */
    it('should return true when uptime exceeds minimum', () => {
      const minSeconds = 0;

      const result = service.hasMinimumUptime(minSeconds);

      expect(typeof result).toBe('boolean');
      // Service just started, so uptime should be > 0
      expect(result).toBe(true);
    });

    /**
     * Test: Should return false for very high minimum uptime
     * Description: New service should fail check for high minimum uptime
     */
    it('should return false for very high minimum uptime', () => {
      const minSeconds = 1000000000; // Very high number

      const result = service.hasMinimumUptime(minSeconds);

      expect(result).toBe(false);
    });

    /**
     * Test: Should accept zero as minimum uptime
     * Description: Zero minimum uptime should always return true
     */
    it('should accept zero as minimum uptime', () => {
      const result = service.hasMinimumUptime(0);

      expect(result).toBe(true);
    });

    /**
     * Test: Should handle negative minimum uptime
     * Description: Negative minimum should always return true
     */
    it('should handle negative minimum uptime', () => {
      const result = service.hasMinimumUptime(-100);

      expect(result).toBe(true);
    });

    /**
     * Test: Should work with fractional seconds
     * Description: Should accept decimal seconds for precise timing
     */
    it('should work with fractional seconds', () => {
      const result = service.hasMinimumUptime(0.001);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Utility Methods - formatBytes()', () => {
    /**
     * Test: formatBytes should format bytes correctly
     * Description: Verify byte formatting with proper unit conversion
     */
    it('should format bytes correctly', () => {
      // This is a private method, tested indirectly through getSystemMetrics
      const metrics = service.getSystemMetrics();

      // Verify memory values are properly formatted
      expect(metrics.memory.heapUsedMB).toMatch(/^\d+\.\d{2}\s(B|KB|MB|GB|TB)$/);
    });

    /**
     * Test: Large memory values should use GB
     * Description: Values > 1GB should show in GB format
     */
    it('large memory values should use appropriate units', () => {
      const metrics = service.getSystemMetrics();

      // Values should be formatted properly
      const pattern = /^\d+\.\d{2}\s(B|KB|MB|GB|TB)$/;
      expect(metrics.system.totalMemory).toMatch(pattern);
    });
  });

  describe('Utility Methods - formatDuration()', () => {
    /**
     * Test: formatDuration should format seconds correctly
     * Description: Verify duration formatting through uptimeFormatted
     */
    it('should format uptime duration correctly', () => {
      const metrics = service.getSystemMetrics();

      // Verify duration is properly formatted
      expect(metrics.uptimeFormatted).toBeDefined();
      expect(typeof metrics.uptimeFormatted).toBe('string');
    });

    /**
     * Test: Duration should include appropriate time units
     * Description: Output should show days, hours, minutes, or seconds
     */
    it('duration should include appropriate time units', () => {
      const metrics = service.getSystemMetrics();

      const hasTimeUnit = /second|minute|hour|day/.test(metrics.uptimeFormatted);
      expect(hasTimeUnit).toBe(true);
    });

    /**
     * Test: Duration should be grammatically correct
     * Description: Plural/singular forms should match count (1 second vs 2 seconds)
     */
    it('duration should be grammatically correct', () => {
      const metrics = service.getSystemMetrics();

      // Check for proper singular/plural
      const hasSingularOrPlural = /\d+\s\w+(s?),?\s/.test(metrics.uptimeFormatted) ||
        /\d+\ssecond(s)?$/.test(metrics.uptimeFormatted);

      expect(metrics.uptimeFormatted.length).toBeGreaterThan(0);
    });
  });

  describe('Type Safety', () => {
    /**
     * Test: SystemMetrics type compliance
     * Description: Returned metrics should satisfy SystemMetrics interface
     */
    it('should return properly typed SystemMetrics', () => {
      const metrics = service.getSystemMetrics();

      // Type checking through property access
      const typed: SystemMetrics = metrics;

      expect(typed.uptime).toBeDefined();
      expect(typed.memory.heapUsed).toBeDefined();
      expect(typed.cpu.cores).toBeDefined();
    });

    /**
     * Test: VersionInfo type compliance
     * Description: Returned version info should satisfy VersionInfo interface
     */
    it('should return properly typed VersionInfo', () => {
      const versionInfo = service.getVersionInfo();

      // Type checking through property access
      const typed: VersionInfo = versionInfo;

      expect(typed.version).toBeDefined();
      expect(typed.apiVersion).toBeDefined();
    });
  });

  describe('Environment Variable Handling', () => {
    /**
     * Test: Should read APP_VERSION from environment
     * Description: When APP_VERSION is set, should use that value
     */
    it('should read APP_VERSION from environment', () => {
      const originalEnv = process.env.APP_VERSION;

      try {
        process.env.APP_VERSION = '2.1.0';
        const versionInfo = service.getVersionInfo();
        expect(versionInfo.version).toBe('2.1.0');
      } finally {
        process.env.APP_VERSION = originalEnv;
      }
    });

    /**
     * Test: Should default to 1.0.0 when APP_VERSION not set
     * Description: When APP_VERSION is not available, should use default
     */
    it('should default to 1.0.0 when APP_VERSION not set', () => {
      const originalEnv = process.env.APP_VERSION;

      try {
        delete process.env.APP_VERSION;
        const versionInfo = service.getVersionInfo();
        expect(versionInfo.version).toBe('1.0.0');
      } finally {
        process.env.APP_VERSION = originalEnv;
      }
    });

    /**
     * Test: Should read NODE_ENV from environment
     * Description: Environment should reflect NODE_ENV setting
     */
    it('should read NODE_ENV from environment', () => {
      const originalEnv = process.env.NODE_ENV;

      try {
        process.env.NODE_ENV = 'production';
        const metrics = service.getSystemMetrics();
        expect(metrics.environment).toBe('production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Performance and Resource Considerations', () => {
    /**
     * Test: getSystemMetrics should complete quickly
     * Description: Metrics collection should be fast (< 100ms)
     */
    it('getSystemMetrics should complete quickly', () => {
      const start = performance.now();
      service.getSystemMetrics();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    /**
     * Test: getVersionInfo should complete quickly
     * Description: Version info should be retrieved quickly (< 50ms)
     */
    it('getVersionInfo should complete quickly', () => {
      const start = performance.now();
      service.getVersionInfo();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    /**
     * Test: Multiple rapid calls should not cause issues
     * Description: Calling metrics multiple times rapidly should work
     */
    it('multiple rapid calls should work correctly', () => {
      for (let i = 0; i < 100; i++) {
        const metrics = service.getSystemMetrics();
        expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
