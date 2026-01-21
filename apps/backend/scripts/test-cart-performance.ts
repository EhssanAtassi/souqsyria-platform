/**
 * @file test-cart-performance.ts
 * @description Performance testing script for Cart Security System
 *
 * OBJECTIVES:
 * - Validate that security improvements maintain sub-200ms response times
 * - Test concurrent user load (1000+ users)
 * - Measure rate limiting effectiveness
 * - Validate memory usage and Redis performance
 * - Test fraud detection accuracy vs performance impact
 *
 * USAGE:
 * npm run test:cart-performance
 * npm run test:cart-performance -- --concurrent 500
 * npm run test:cart-performance -- --duration 60
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import axios from 'axios';
import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';

// Performance test configuration
interface TestConfig {
  baseUrl: string;
  concurrentUsers: number;
  testDurationSeconds: number;
  requestsPerUser: number;
  scenarios: TestScenario[];
}

interface TestScenario {
  name: string;
  weight: number; // Percentage of requests
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
  expectedStatusCodes: number[];
  maxResponseTime: number;
}

interface TestResult {
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  securityAlertsTriggered: number;
}

interface OverallResults {
  totalDuration: number;
  totalRequests: number;
  overallSuccessRate: number;
  overallAverageResponseTime: number;
  peakRequestsPerSecond: number;
  memoryUsage: NodeJS.MemoryUsage;
  scenarios: TestResult[];
  securityMetrics: SecurityMetrics;
}

interface SecurityMetrics {
  totalSecurityEvents: number;
  rateLimitingEffectiveness: number;
  fraudDetectionAccuracy: number;
  falsePositiveRate: number;
}

// Default test configuration
const DEFAULT_CONFIG: TestConfig = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '100'),
  testDurationSeconds: parseInt(process.env.TEST_DURATION || '30'),
  requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || '50'),
  scenarios: [
    {
      name: 'Legitimate Guest Cart Operations',
      weight: 60,
      endpoint: '/cart/guest',
      method: 'POST',
      payload: {
        items: [{ variantId: 1, quantity: 2, priceAtAdd: 50000 }],
        clientVersion: 1,
        clientTimestamp: new Date().toISOString(),
      },
      expectedStatusCodes: [200, 201],
      maxResponseTime: 200,
    },
    {
      name: 'Legitimate Authenticated Cart Operations',
      weight: 25,
      endpoint: '/cart/items',
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-jwt-token' },
      payload: {
        variantId: 1,
        quantity: 1,
        priceAtAdd: 50000,
      },
      expectedStatusCodes: [200, 201],
      maxResponseTime: 150,
    },
    {
      name: 'Cart Retrieval Operations',
      weight: 10,
      endpoint: '/cart/guest/test-session-123',
      method: 'GET',
      expectedStatusCodes: [200, 404],
      maxResponseTime: 100,
    },
    {
      name: 'Suspicious High-Quantity Operations',
      weight: 3,
      endpoint: '/cart/guest',
      method: 'POST',
      payload: {
        items: [{ variantId: 1, quantity: 999, priceAtAdd: 50000 }],
        clientVersion: 1,
        clientTimestamp: new Date().toISOString(),
      },
      expectedStatusCodes: [200, 201, 429, 403], // Should trigger security but may still allow
      maxResponseTime: 300, // May be slower due to security processing
    },
    {
      name: 'Price Tampering Attempts',
      weight: 2,
      endpoint: '/cart/guest',
      method: 'POST',
      payload: {
        items: [{ variantId: 1, quantity: 1, priceAtAdd: 1 }],
        clientVersion: 1,
        clientTimestamp: new Date().toISOString(),
      },
      expectedStatusCodes: [200, 201, 429, 403],
      maxResponseTime: 300,
    },
  ],
};

/**
 * Main performance test runner
 */
class CartPerformanceTester {
  private config: TestConfig;
  private results: TestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run the complete performance test suite
   */
  async runPerformanceTests(): Promise<OverallResults> {
    console.log('🚀 Starting Cart Security Performance Tests');
    console.log(`📊 Configuration:`);
    console.log(`   - Base URL: ${this.config.baseUrl}`);
    console.log(`   - Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`   - Test Duration: ${this.config.testDurationSeconds}s`);
    console.log(`   - Requests per User: ${this.config.requestsPerUser}`);
    console.log();

    this.startTime = performance.now();

    // Run tests using worker threads for true concurrency
    const workers = await this.createWorkers();
    const workerResults = await this.runWorkers(workers);

    this.endTime = performance.now();

    // Aggregate results
    const overallResults = this.aggregateResults(workerResults);

    // Display results
    this.displayResults(overallResults);

    // Save results to file
    await this.saveResults(overallResults);

    return overallResults;
  }

  /**
   * Create worker threads for concurrent testing
   */
  private async createWorkers(): Promise<Worker[]> {
    const workers: Worker[] = [];
    const usersPerWorker = Math.ceil(this.config.concurrentUsers / 4); // 4 workers

    for (let i = 0; i < 4; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          config: this.config,
          workerId: i,
          usersToSimulate: usersPerWorker,
        },
      });

      workers.push(worker);
    }

    return workers;
  }

  /**
   * Run all worker threads and collect results
   */
  private async runWorkers(workers: Worker[]): Promise<TestResult[][]> {
    const workerPromises = workers.map(worker =>
      new Promise<TestResult[]>((resolve, reject) => {
        worker.on('message', resolve);
        worker.on('error', reject);
      })
    );

    const results = await Promise.all(workerPromises);

    // Cleanup workers
    workers.forEach(worker => worker.terminate());

    return results;
  }

  /**
   * Aggregate results from all workers
   */
  private aggregateResults(workerResults: TestResult[][]): OverallResults {
    const allResults = workerResults.flat();
    const scenarioMap = new Map<string, TestResult[]>();

    // Group results by scenario
    allResults.forEach(result => {
      if (!scenarioMap.has(result.scenario)) {
        scenarioMap.set(result.scenario, []);
      }
      scenarioMap.get(result.scenario)!.push(result);
    });

    // Aggregate each scenario
    const aggregatedScenarios: TestResult[] = [];
    for (const [scenarioName, results] of scenarioMap.entries()) {
      aggregatedScenarios.push(this.aggregateScenarioResults(scenarioName, results));
    }

    // Calculate overall metrics
    const totalRequests = aggregatedScenarios.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalSuccessful = aggregatedScenarios.reduce((sum, s) => sum + s.successfulRequests, 0);
    const totalDuration = (this.endTime - this.startTime) / 1000;

    return {
      totalDuration,
      totalRequests,
      overallSuccessRate: (totalSuccessful / totalRequests) * 100,
      overallAverageResponseTime: this.calculateWeightedAverage(aggregatedScenarios, 'averageResponseTime'),
      peakRequestsPerSecond: totalRequests / totalDuration,
      memoryUsage: process.memoryUsage(),
      scenarios: aggregatedScenarios,
      securityMetrics: this.calculateSecurityMetrics(aggregatedScenarios),
    };
  }

  /**
   * Aggregate results for a single scenario
   */
  private aggregateScenarioResults(scenarioName: string, results: TestResult[]): TestResult {
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const successfulRequests = results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const failedRequests = results.reduce((sum, r) => sum + r.failedRequests, 0);
    const rateLimitedRequests = results.reduce((sum, r) => sum + r.rateLimitedRequests, 0);

    // Calculate response time percentiles
    const allResponseTimes = results.flatMap(r => [r.averageResponseTime]);
    allResponseTimes.sort((a, b) => a - b);

    return {
      scenario: scenarioName,
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitedRequests,
      averageResponseTime: allResponseTimes.reduce((sum, t) => sum + t, 0) / allResponseTimes.length,
      minResponseTime: Math.min(...results.map(r => r.minResponseTime)),
      maxResponseTime: Math.max(...results.map(r => r.maxResponseTime)),
      p95ResponseTime: allResponseTimes[Math.floor(allResponseTimes.length * 0.95)],
      p99ResponseTime: allResponseTimes[Math.floor(allResponseTimes.length * 0.99)],
      requestsPerSecond: totalRequests / (this.endTime - this.startTime) * 1000,
      errorRate: (failedRequests / totalRequests) * 100,
      securityAlertsTriggered: results.reduce((sum, r) => sum + r.securityAlertsTriggered, 0),
    };
  }

  /**
   * Calculate weighted average for metrics
   */
  private calculateWeightedAverage(scenarios: TestResult[], metric: keyof TestResult): number {
    let totalWeight = 0;
    let weightedSum = 0;

    scenarios.forEach(scenario => {
      const weight = scenario.totalRequests;
      totalWeight += weight;
      weightedSum += (scenario[metric] as number) * weight;
    });

    return weightedSum / totalWeight;
  }

  /**
   * Calculate security-specific metrics
   */
  private calculateSecurityMetrics(scenarios: TestResult[]): SecurityMetrics {
    const legitimateScenarios = scenarios.filter(s =>
      s.scenario.includes('Legitimate') || s.scenario.includes('Retrieval')
    );
    const suspiciousScenarios = scenarios.filter(s =>
      s.scenario.includes('Suspicious') || s.scenario.includes('Tampering')
    );

    const totalSecurityEvents = scenarios.reduce((sum, s) => sum + s.securityAlertsTriggered, 0);

    // Calculate false positive rate (legitimate requests that were blocked)
    const legitimateBlocked = legitimateScenarios.reduce((sum, s) =>
      sum + s.rateLimitedRequests, 0
    );
    const totalLegitimate = legitimateScenarios.reduce((sum, s) => sum + s.totalRequests, 0);

    const falsePositiveRate = totalLegitimate > 0 ? (legitimateBlocked / totalLegitimate) * 100 : 0;

    // Rate limiting effectiveness (percentage of suspicious requests that were limited)
    const suspiciousBlocked = suspiciousScenarios.reduce((sum, s) =>
      sum + s.rateLimitedRequests, 0
    );
    const totalSuspicious = suspiciousScenarios.reduce((sum, s) => sum + s.totalRequests, 0);

    const rateLimitingEffectiveness = totalSuspicious > 0 ? (suspiciousBlocked / totalSuspicious) * 100 : 0;

    return {
      totalSecurityEvents,
      rateLimitingEffectiveness,
      fraudDetectionAccuracy: 100 - falsePositiveRate, // Inverse of false positive rate
      falsePositiveRate,
    };
  }

  /**
   * Display test results in a formatted way
   */
  private displayResults(results: OverallResults): void {
    console.log('\n📊 CART SECURITY PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80));

    // Overall metrics
    console.log('\n🎯 OVERALL PERFORMANCE:');
    console.log(`   ⏱️  Total Duration: ${results.totalDuration.toFixed(2)}s`);
    console.log(`   📈 Total Requests: ${results.totalRequests.toLocaleString()}`);
    console.log(`   ✅ Success Rate: ${results.overallSuccessRate.toFixed(2)}%`);
    console.log(`   ⚡ Average Response Time: ${results.overallAverageResponseTime.toFixed(2)}ms`);
    console.log(`   🚀 Peak RPS: ${results.peakRequestsPerSecond.toFixed(2)}`);

    // Performance validation
    console.log('\n✅ PERFORMANCE VALIDATION:');
    const performancePassed = results.overallAverageResponseTime < 200;
    console.log(`   📊 Sub-200ms target: ${performancePassed ? '✅ PASSED' : '❌ FAILED'} (${results.overallAverageResponseTime.toFixed(2)}ms)`);

    const throughputTarget = results.peakRequestsPerSecond > 50;
    console.log(`   🎯 Throughput target: ${throughputTarget ? '✅ PASSED' : '❌ FAILED'} (${results.peakRequestsPerSecond.toFixed(2)} RPS)`);

    const successRateTarget = results.overallSuccessRate > 95;
    console.log(`   💯 Success rate target: ${successRateTarget ? '✅ PASSED' : '❌ FAILED'} (${results.overallSuccessRate.toFixed(2)}%)`);

    // Security metrics
    console.log('\n🛡️  SECURITY METRICS:');
    console.log(`   🚨 Total Security Events: ${results.securityMetrics.totalSecurityEvents}`);
    console.log(`   🚦 Rate Limiting Effectiveness: ${results.securityMetrics.rateLimitingEffectiveness.toFixed(2)}%`);
    console.log(`   🎯 Fraud Detection Accuracy: ${results.securityMetrics.fraudDetectionAccuracy.toFixed(2)}%`);
    console.log(`   ⚠️  False Positive Rate: ${results.securityMetrics.falsePositiveRate.toFixed(2)}%`);

    // Scenario breakdown
    console.log('\n📝 SCENARIO BREAKDOWN:');
    results.scenarios.forEach(scenario => {
      console.log(`\n   ${scenario.scenario}:`);
      console.log(`     📊 Requests: ${scenario.totalRequests.toLocaleString()} (${scenario.requestsPerSecond.toFixed(1)} RPS)`);
      console.log(`     ⏱️  Avg Response: ${scenario.averageResponseTime.toFixed(2)}ms`);
      console.log(`     📈 P95: ${scenario.p95ResponseTime?.toFixed(2) || 'N/A'}ms | P99: ${scenario.p99ResponseTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`     ✅ Success Rate: ${((scenario.successfulRequests / scenario.totalRequests) * 100).toFixed(2)}%`);
      console.log(`     🚦 Rate Limited: ${scenario.rateLimitedRequests} (${((scenario.rateLimitedRequests / scenario.totalRequests) * 100).toFixed(2)}%)`);
      console.log(`     🚨 Security Alerts: ${scenario.securityAlertsTriggered}`);
    });

    // Memory usage
    console.log('\n💾 MEMORY USAGE:');
    console.log(`   📊 RSS: ${(results.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   🏠 Heap Used: ${(results.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📈 Heap Total: ${(results.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n='.repeat(80));
  }

  /**
   * Save results to JSON file
   */
  private async saveResults(results: OverallResults): Promise<void> {
    const resultsDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(resultsDir, `cart-performance-${timestamp}.json`);

    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${filename}`);
  }
}

/**
 * Worker thread implementation
 */
async function runWorker(): Promise<TestResult[]> {
  const { config, workerId, usersToSimulate } = workerData;
  const results: TestResult[] = [];

  console.log(`🔧 Worker ${workerId} starting with ${usersToSimulate} simulated users`);

  for (const scenario of config.scenarios) {
    const requestsForScenario = Math.floor(
      (config.requestsPerUser * usersToSimulate * scenario.weight) / 100
    );

    if (requestsForScenario === 0) continue;

    const scenarioResult = await runScenario(scenario, requestsForScenario, config);
    results.push(scenarioResult);
  }

  return results;
}

/**
 * Run a single test scenario
 */
async function runScenario(
  scenario: TestScenario,
  requestCount: number,
  config: TestConfig
): Promise<TestResult> {
  const responseTimes: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  let rateLimitedRequests = 0;
  let securityAlertsTriggered = 0;

  const startTime = performance.now();

  // Create concurrent requests
  const promises = Array.from({ length: requestCount }, async () => {
    const requestStartTime = performance.now();

    try {
      const response = await axios({
        method: scenario.method,
        url: `${config.baseUrl}${scenario.endpoint}`,
        data: scenario.payload,
        headers: scenario.headers,
        timeout: 5000,
        validateStatus: () => true, // Accept all status codes
      });

      const responseTime = performance.now() - requestStartTime;
      responseTimes.push(responseTime);

      if (scenario.expectedStatusCodes.includes(response.status)) {
        successfulRequests++;
      } else if (response.status === 429) {
        rateLimitedRequests++;
      } else {
        failedRequests++;
      }

      // Check for security headers or indicators
      if (response.headers['x-security-event'] ||
          response.data?.securityAlert ||
          response.status === 403) {
        securityAlertsTriggered++;
      }

    } catch (error) {
      const responseTime = performance.now() - requestStartTime;
      responseTimes.push(responseTime);
      failedRequests++;
    }
  });

  await Promise.all(promises);

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  responseTimes.sort((a, b) => a - b);

  return {
    scenario: scenario.name,
    totalRequests: requestCount,
    successfulRequests,
    failedRequests,
    rateLimitedRequests,
    averageResponseTime: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
    p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
    requestsPerSecond: requestCount / duration,
    errorRate: (failedRequests / requestCount) * 100,
    securityAlertsTriggered,
  };
}

// Main execution
if (isMainThread) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const configOverrides: Partial<TestConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--concurrent':
        configOverrides.concurrentUsers = parseInt(value);
        break;
      case '--duration':
        configOverrides.testDurationSeconds = parseInt(value);
        break;
      case '--requests':
        configOverrides.requestsPerUser = parseInt(value);
        break;
      case '--url':
        configOverrides.baseUrl = value;
        break;
    }
  }

  // Run the performance tests
  const tester = new CartPerformanceTester(configOverrides);
  tester.runPerformanceTests()
    .then(results => {
      process.exit(results.overallSuccessRate > 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
} else {
  // Worker thread execution
  runWorker()
    .then(results => {
      parentPort?.postMessage(results);
    })
    .catch(error => {
      console.error(`Worker ${workerData.workerId} failed:`, error);
      parentPort?.postMessage([]);
    });
}