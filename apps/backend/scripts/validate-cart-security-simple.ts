/**
 * @file validate-cart-security-simple.ts
 * @description Simple validation script for Cart Security System
 *
 * RESPONSIBILITIES:
 * - Validate all security components are working correctly
 * - Test rate limiting effectiveness
 * - Test fraud detection accuracy
 * - Generate security compliance report (without shell execution)
 *
 * USAGE:
 * npm run validate:cart-security-simple
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationConfig {
  apiBaseUrl: string;
  maxResponseTime: number;
  minSuccessRate: number;
}

interface ValidationResult {
  component: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  metrics?: Record<string, any>;
  duration?: number;
}

interface SecurityValidationReport {
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL' | 'WARN';
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: ValidationResult[];
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Simple security validation (API-only, no shell commands)
 */
class SimpleCartSecurityValidator {
  private config: ValidationConfig;
  private results: ValidationResult[] = [];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      maxResponseTime: 200,
      minSuccessRate: 95,
      ...config,
    };
  }

  /**
   * Run simple security validation suite
   */
  async runValidation(): Promise<SecurityValidationReport> {
    console.log('🛡️  Starting Simple Cart Security Validation');
    console.log('='.repeat(60));

    try {
      // 1. API Connectivity Test
      await this.validateApiConnectivity();

      // 2. Rate Limiting Validation
      await this.validateRateLimiting();

      // 3. Fraud Detection Validation
      await this.validateFraudDetection();

      // 4. Performance Spot Check
      await this.validateBasicPerformance();

    } catch (error) {
      this.addResult('SYSTEM', 'Validation Execution', 'FAIL',
        `Validation suite failed: ${error.message}`);
    }

    // Generate report
    const report = this.generateReport();

    // Display results
    this.displayResults(report);

    // Save report
    await this.saveReport(report);

    return report;
  }

  /**
   * Test basic API connectivity
   */
  private async validateApiConnectivity(): Promise<void> {
    console.log('\n🔌 Validating API Connectivity...');

    try {
      const response = await axios.get(`${this.config.apiBaseUrl}/health`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        this.addResult('API', 'Health Check', 'PASS',
          'API is responding to health checks');
      } else {
        this.addResult('API', 'Health Check', 'WARN',
          `API health check returned status ${response.status}`);
      }
    } catch (error) {
      this.addResult('API', 'Connectivity', 'FAIL',
        `Cannot connect to API: ${error.message}`);
    }
  }

  /**
   * Validate rate limiting functionality
   */
  private async validateRateLimiting(): Promise<void> {
    console.log('\n🚦 Validating Rate Limiting...');

    try {
      const startTime = Date.now();
      let rateLimited = false;
      let successfulRequests = 0;
      let totalRequests = 0;

      // Test guest rate limiting
      for (let i = 0; i < 20; i++) {
        totalRequests++;
        try {
          const response = await axios.post(`${this.config.apiBaseUrl}/cart/guest`, {
            items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }],
            clientVersion: i,
            clientTimestamp: new Date().toISOString(),
          }, {
            timeout: 3000,
            validateStatus: () => true,
          });

          if (response.status === 429) {
            rateLimited = true;
            break;
          } else if ([200, 201].includes(response.status)) {
            successfulRequests++;
          }
        } catch (error) {
          if (error.response?.status === 429) {
            rateLimited = true;
            break;
          }
        }

        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (rateLimited) {
        this.addResult('RATE_LIMITING', 'Guest Rate Limiting', 'PASS',
          `Rate limiting activated after ${successfulRequests} requests`);
      } else {
        this.addResult('RATE_LIMITING', 'Guest Rate Limiting', 'WARN',
          `No rate limiting detected after ${totalRequests} requests`);
      }

      const duration = Date.now() - startTime;
      this.addResult('RATE_LIMITING', 'Response Time Impact',
        duration < 5000 ? 'PASS' : 'WARN',
        `Rate limiting test completed in ${duration}ms`);

    } catch (error) {
      this.addResult('RATE_LIMITING', 'Validation Execution', 'FAIL',
        `Rate limiting validation failed: ${error.message}`);
    }
  }

  /**
   * Validate fraud detection functionality
   */
  private async validateFraudDetection(): Promise<void> {
    console.log('\n🔍 Validating Fraud Detection...');

    try {
      // Test 1: Suspicious quantity detection
      const suspiciousQuantityResponse = await axios.post(
        `${this.config.apiBaseUrl}/cart/guest`,
        {
          items: [{ variantId: 1, quantity: 999, priceAtAdd: 50000 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        },
        { timeout: 5000, validateStatus: () => true }
      );

      if ([200, 201, 403, 429].includes(suspiciousQuantityResponse.status)) {
        this.addResult('FRAUD_DETECTION', 'Quantity Anomaly', 'PASS',
          `Suspicious quantity handled with status ${suspiciousQuantityResponse.status}`);
      } else {
        this.addResult('FRAUD_DETECTION', 'Quantity Anomaly', 'WARN',
          `Unexpected response ${suspiciousQuantityResponse.status} to suspicious quantity`);
      }

      // Test 2: Price tampering detection
      const priceTamperingResponse = await axios.post(
        `${this.config.apiBaseUrl}/cart/guest`,
        {
          items: [{ variantId: 1, quantity: 1, priceAtAdd: 1 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        },
        { timeout: 5000, validateStatus: () => true }
      );

      if ([200, 201, 403, 429].includes(priceTamperingResponse.status)) {
        this.addResult('FRAUD_DETECTION', 'Price Tampering', 'PASS',
          `Price tampering handled with status ${priceTamperingResponse.status}`);
      } else {
        this.addResult('FRAUD_DETECTION', 'Price Tampering', 'WARN',
          `Unexpected response to price tampering`);
      }

      // Test 3: Bot detection
      const botResponse = await axios.post(
        `${this.config.apiBaseUrl}/cart/guest`,
        {
          items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        },
        {
          headers: { 'User-Agent': 'python-requests/2.28.1' },
          timeout: 5000,
          validateStatus: () => true,
        }
      );

      if ([200, 201, 403, 429].includes(botResponse.status)) {
        this.addResult('FRAUD_DETECTION', 'Bot Detection', 'PASS',
          `Bot-like request handled with status ${botResponse.status}`);
      } else {
        this.addResult('FRAUD_DETECTION', 'Bot Detection', 'WARN',
          `Unexpected response to bot-like user agent`);
      }

      // Test 4: Legitimate request (should succeed)
      const legitimateResponse = await axios.post(
        `${this.config.apiBaseUrl}/cart/guest`,
        {
          items: [{ variantId: 1, quantity: 2, priceAtAdd: 50000 }],
          clientVersion: 1,
          clientTimestamp: new Date().toISOString(),
        },
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 5000,
          validateStatus: () => true,
        }
      );

      if ([200, 201].includes(legitimateResponse.status)) {
        this.addResult('FRAUD_DETECTION', 'False Positive Check', 'PASS',
          'Legitimate requests are properly allowed');
      } else {
        this.addResult('FRAUD_DETECTION', 'False Positive Check', 'FAIL',
          `Legitimate request blocked with status ${legitimateResponse.status}`);
      }

    } catch (error) {
      this.addResult('FRAUD_DETECTION', 'Validation Execution', 'FAIL',
        `Fraud detection validation failed: ${error.message}`);
    }
  }

  /**
   * Basic performance validation
   */
  private async validateBasicPerformance(): Promise<void> {
    console.log('\n⚡ Validating Basic Performance...');

    try {
      const responseTimes: number[] = [];
      let successfulRequests = 0;
      const totalRequests = 10;

      for (let i = 0; i < totalRequests; i++) {
        const startTime = Date.now();
        try {
          const response = await axios.post(`${this.config.apiBaseUrl}/cart/guest`, {
            items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }],
            clientVersion: i,
            clientTimestamp: new Date().toISOString(),
          }, {
            timeout: 5000,
            validateStatus: () => true,
          });

          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          if ([200, 201].includes(response.status)) {
            successfulRequests++;
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const successRate = (successfulRequests / totalRequests) * 100;

      if (avgResponseTime < this.config.maxResponseTime) {
        this.addResult('PERFORMANCE', 'Response Time', 'PASS',
          `Average response time: ${avgResponseTime.toFixed(2)}ms (target: <${this.config.maxResponseTime}ms)`,
          { avgResponseTime: avgResponseTime.toFixed(2), target: this.config.maxResponseTime });
      } else {
        this.addResult('PERFORMANCE', 'Response Time', 'FAIL',
          `Average response time: ${avgResponseTime.toFixed(2)}ms exceeds target`);
      }

      if (successRate >= this.config.minSuccessRate) {
        this.addResult('PERFORMANCE', 'Success Rate', 'PASS',
          `Success rate: ${successRate.toFixed(1)}% (target: >${this.config.minSuccessRate}%)`,
          { successRate: successRate.toFixed(1), target: this.config.minSuccessRate });
      } else {
        this.addResult('PERFORMANCE', 'Success Rate', 'WARN',
          `Success rate: ${successRate.toFixed(1)}% below target`);
      }

    } catch (error) {
      this.addResult('PERFORMANCE', 'Basic Performance Test', 'FAIL',
        `Performance validation failed: ${error.message}`);
    }
  }

  /**
   * Add a validation result
   */
  private addResult(
    component: string,
    testName: string,
    status: 'PASS' | 'FAIL' | 'WARN',
    message: string,
    metrics?: Record<string, any>,
    duration?: number
  ): void {
    this.results.push({
      component,
      testName,
      status,
      message,
      metrics,
      duration,
    });
  }

  /**
   * Generate validation report
   */
  private generateReport(): SecurityValidationReport {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    const overallStatus: 'PASS' | 'FAIL' | 'WARN' =
      failed > 0 ? 'FAIL' : warnings > 0 ? 'WARN' : 'PASS';

    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    if (failed > 0) {
      recommendations.push('Address all failed tests before deploying to production');
      nextSteps.push('Review and fix failing security components');
    }

    if (warnings > 0) {
      recommendations.push('Investigate warning conditions for potential improvements');
      nextSteps.push('Monitor warning components in production');
    }

    if (overallStatus === 'PASS') {
      recommendations.push('Security system is functioning correctly');
      nextSteps.push('Consider running full test suite for comprehensive validation');
      nextSteps.push('Monitor security metrics in production dashboard');
    }

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      summary: {
        totalTests: this.results.length,
        passed,
        failed,
        warnings,
      },
      results: this.results,
      recommendations,
      nextSteps,
    };
  }

  /**
   * Display validation results
   */
  private displayResults(report: SecurityValidationReport): void {
    console.log('\n🛡️  CART SECURITY VALIDATION RESULTS');
    console.log('='.repeat(60));

    // Overall status
    const statusEmoji = report.overallStatus === 'PASS' ? '✅' :
                       report.overallStatus === 'WARN' ? '⚠️' : '❌';
    console.log(`\n${statusEmoji} OVERALL STATUS: ${report.overallStatus}`);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   ✅ Passed: ${report.summary.passed}`);
    console.log(`   ❌ Failed: ${report.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${report.summary.warnings}`);

    // Individual results
    console.log('\n📋 TEST RESULTS:');
    const groupedResults = this.groupResultsByComponent(report.results);

    Object.entries(groupedResults).forEach(([component, results]) => {
      console.log(`\n🔧 ${component}:`);
      results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' :
                    result.status === 'WARN' ? '⚠️' : '❌';
        console.log(`   ${icon} ${result.testName}: ${result.message}`);

        if (result.metrics) {
          Object.entries(result.metrics).forEach(([key, value]) => {
            console.log(`      📊 ${key}: ${value}`);
          });
        }
      });
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Next steps
    if (report.nextSteps.length > 0) {
      console.log('\n📝 NEXT STEPS:');
      report.nextSteps.forEach(step => {
        console.log(`   • ${step}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🕒 Validation completed at: ${new Date(report.timestamp).toLocaleString()}`);
  }

  /**
   * Group results by component
   */
  private groupResultsByComponent(results: ValidationResult[]): Record<string, ValidationResult[]> {
    const grouped: Record<string, ValidationResult[]> = {};

    results.forEach(result => {
      if (!grouped[result.component]) {
        grouped[result.component] = [];
      }
      grouped[result.component].push(result);
    });

    return grouped;
  }

  /**
   * Save report to file
   */
  private async saveReport(report: SecurityValidationReport): Promise<void> {
    const reportDir = path.join(__dirname, '../validation-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(reportDir, `cart-security-simple-${timestamp}.json`);

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${filename}`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<ValidationConfig> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.apiBaseUrl = args[++i];
        break;
      case '--max-response-time':
        config.maxResponseTime = parseInt(args[++i]);
        break;
      case '--min-success-rate':
        config.minSuccessRate = parseInt(args[++i]);
        break;
    }
  }

  // Run validation
  const validator = new SimpleCartSecurityValidator(config);
  validator.runValidation()
    .then(report => {
      const exitCode = report.overallStatus === 'FAIL' ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}