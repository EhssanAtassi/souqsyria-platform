#!/usr/bin/env node

/**
 * Test Coverage Report Generator for Syrian Marketplace
 *
 * Generates comprehensive test coverage reports with:
 * - Coverage analysis by module and feature
 * - Syrian marketplace specific metrics
 * - Quality gate validation
 * - Performance benchmarking
 * - CI/CD integration support
 *
 * @swagger
 * components:
 *   schemas:
 *     TestCoverageReport:
 *       type: object
 *       description: Comprehensive test coverage analysis for Syrian marketplace
 *       properties:
 *         overall:
 *           type: object
 *           description: Overall coverage statistics
 *         byModule:
 *           type: object
 *           description: Coverage breakdown by admin modules
 *         qualityGates:
 *           type: object
 *           description: Quality gate validation results
 *         recommendations:
 *           type: array
 *           description: Improvement recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SyrianMarketplaceCoverageAnalyzer {
  constructor() {
    this.coverageDir = path.join(__dirname, '../coverage/souq-syria-storefront');
    this.reportDir = path.join(__dirname, '../reports');
    this.thresholds = {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    };

    this.syrianModules = [
      'admin-product.service',
      'admin-order.service',
      'admin-vendor.service',
      'admin-inventory.service',
      'syrian-data.service',
      'admin-auth.service'
    ];

    this.ensureDirectories();
  }

  /**
   * Ensure report directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive test coverage reports
   */
  async generateCoverageReport() {
    console.log('🧪 Generating Syrian Marketplace Test Coverage Report...\n');

    try {
      // Run tests with coverage
      console.log('📊 Running tests with coverage collection...');
      execSync('npm run test:coverage', { stdio: 'inherit' });

      // Analyze coverage data
      const coverageData = this.loadCoverageData();
      const analysis = this.analyzeCoverage(coverageData);

      // Generate reports
      await this.generateHTMLReport(analysis);
      await this.generateJSONReport(analysis);
      await this.generateMarkdownSummary(analysis);
      await this.generateQualityGateReport(analysis);

      // Display summary
      this.displaySummary(analysis);

      console.log('\n✅ Coverage report generation completed!');
      console.log(`📁 Reports available in: ${this.reportDir}`);

      return analysis;

    } catch (error) {
      console.error('❌ Coverage report generation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Load coverage data from Istanbul reports
   */
  loadCoverageData() {
    const coverageFile = path.join(this.coverageDir, 'coverage.json');

    if (!fs.existsSync(coverageFile)) {
      throw new Error('Coverage data not found. Run tests with coverage first.');
    }

    return JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  }

  /**
   * Analyze coverage data for Syrian marketplace modules
   */
  analyzeCoverage(coverageData) {
    const analysis = {
      timestamp: new Date().toISOString(),
      overall: {
        statements: { covered: 0, total: 0, percentage: 0 },
        branches: { covered: 0, total: 0, percentage: 0 },
        functions: { covered: 0, total: 0, percentage: 0 },
        lines: { covered: 0, total: 0, percentage: 0 }
      },
      byModule: {},
      syrianFeatures: {
        adminServices: {},
        culturalFeatures: {},
        bilingualSupport: {}
      },
      qualityGates: {
        passed: true,
        failures: [],
        warnings: []
      },
      recommendations: [],
      uncoveredAreas: []
    };

    // Calculate overall metrics
    Object.keys(coverageData).forEach(file => {
      const fileCoverage = coverageData[file];

      // Overall totals
      analysis.overall.statements.covered += fileCoverage.s ? Object.values(fileCoverage.s).filter(Boolean).length : 0;
      analysis.overall.statements.total += fileCoverage.s ? Object.keys(fileCoverage.s).length : 0;

      analysis.overall.branches.covered += fileCoverage.b ? Object.values(fileCoverage.b).flat().filter(Boolean).length : 0;
      analysis.overall.branches.total += fileCoverage.b ? Object.values(fileCoverage.b).flat().length : 0;

      analysis.overall.functions.covered += fileCoverage.f ? Object.values(fileCoverage.f).filter(Boolean).length : 0;
      analysis.overall.functions.total += fileCoverage.f ? Object.keys(fileCoverage.f).length : 0;

      // Module-specific analysis
      const moduleName = this.getModuleName(file);
      if (moduleName) {
        analysis.byModule[moduleName] = this.analyzeModule(fileCoverage, file);
      }

      // Syrian marketplace specific analysis
      if (this.isSyrianFeature(file)) {
        this.analyzeSyrianFeatures(file, fileCoverage, analysis);
      }
    });

    // Calculate percentages
    Object.keys(analysis.overall).forEach(metric => {
      const data = analysis.overall[metric];
      data.percentage = data.total > 0 ? Math.round((data.covered / data.total) * 100) : 0;
    });

    // Quality gate validation
    this.validateQualityGates(analysis);

    // Generate recommendations
    this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Get module name from file path
   */
  getModuleName(filePath) {
    const fileName = path.basename(filePath, '.ts');
    return this.syrianModules.find(module => fileName.includes(module.replace('.service', '')));
  }

  /**
   * Check if file contains Syrian marketplace features
   */
  isSyrianFeature(filePath) {
    const syrianKeywords = [
      'syrian', 'damascus', 'aleppo', 'arabic', 'heritage', 'unesco',
      'governorate', 'traditional', 'cultural'
    ];
    return syrianKeywords.some(keyword =>
      filePath.toLowerCase().includes(keyword)
    );
  }

  /**
   * Analyze individual module coverage
   */
  analyzeModule(fileCoverage, filePath) {
    const statements = fileCoverage.s || {};
    const branches = fileCoverage.b || {};
    const functions = fileCoverage.f || {};

    const statementsCovered = Object.values(statements).filter(Boolean).length;
    const statementsTotal = Object.keys(statements).length;

    const branchesCovered = Object.values(branches).flat().filter(Boolean).length;
    const branchesTotal = Object.values(branches).flat().length;

    const functionsCovered = Object.values(functions).filter(Boolean).length;
    const functionsTotal = Object.keys(functions).length;

    return {
      filePath,
      statements: {
        covered: statementsCovered,
        total: statementsTotal,
        percentage: statementsTotal > 0 ? Math.round((statementsCovered / statementsTotal) * 100) : 0
      },
      branches: {
        covered: branchesCovered,
        total: branchesTotal,
        percentage: branchesTotal > 0 ? Math.round((branchesCovered / branchesTotal) * 100) : 0
      },
      functions: {
        covered: functionsCovered,
        total: functionsTotal,
        percentage: functionsTotal > 0 ? Math.round((functionsCovered / functionsTotal) * 100) : 0
      },
      uncoveredLines: this.getUncoveredLines(fileCoverage),
      complexity: this.calculateComplexity(fileCoverage)
    };
  }

  /**
   * Analyze Syrian marketplace specific features
   */
  analyzeSyrianFeatures(filePath, fileCoverage, analysis) {
    if (filePath.includes('admin')) {
      const serviceName = path.basename(filePath, '.ts');
      analysis.syrianFeatures.adminServices[serviceName] = this.analyzeModule(fileCoverage, filePath);
    }

    if (filePath.includes('arabic') || filePath.includes('bilingual')) {
      analysis.syrianFeatures.bilingualSupport[path.basename(filePath, '.ts')] =
        this.analyzeModule(fileCoverage, filePath);
    }

    if (filePath.includes('heritage') || filePath.includes('cultural')) {
      analysis.syrianFeatures.culturalFeatures[path.basename(filePath, '.ts')] =
        this.analyzeModule(fileCoverage, filePath);
    }
  }

  /**
   * Get uncovered lines for a file
   */
  getUncoveredLines(fileCoverage) {
    const uncovered = [];
    const statements = fileCoverage.s || {};
    const statementMap = fileCoverage.statementMap || {};

    Object.keys(statements).forEach(statementId => {
      if (statements[statementId] === 0) {
        const location = statementMap[statementId];
        if (location && location.start) {
          uncovered.push(location.start.line);
        }
      }
    });

    return uncovered.sort((a, b) => a - b);
  }

  /**
   * Calculate code complexity score
   */
  calculateComplexity(fileCoverage) {
    const branches = fileCoverage.b || {};
    const functions = fileCoverage.f || {};

    const branchCount = Object.keys(branches).length;
    const functionCount = Object.keys(functions).length;

    // Simple complexity calculation
    return Math.round((branchCount * 2 + functionCount) / Math.max(functionCount, 1));
  }

  /**
   * Validate quality gates
   */
  validateQualityGates(analysis) {
    const { overall, qualityGates } = analysis;

    Object.keys(this.thresholds).forEach(metric => {
      const threshold = this.thresholds[metric];
      const actual = overall[metric]?.percentage || 0;

      if (actual < threshold) {
        qualityGates.passed = false;
        qualityGates.failures.push({
          metric,
          threshold,
          actual,
          message: `${metric} coverage (${actual}%) is below threshold (${threshold}%)`
        });
      } else if (actual < threshold + 5) {
        qualityGates.warnings.push({
          metric,
          threshold,
          actual,
          message: `${metric} coverage (${actual}%) is close to threshold (${threshold}%)`
        });
      }
    });
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(analysis) {
    const { overall, byModule, qualityGates } = analysis;

    // Overall coverage recommendations
    if (overall.statements.percentage < 80) {
      analysis.recommendations.push({
        priority: 'high',
        category: 'coverage',
        message: 'Increase statement coverage by adding unit tests for uncovered code paths',
        target: 'Overall statement coverage'
      });
    }

    if (overall.branches.percentage < 75) {
      analysis.recommendations.push({
        priority: 'high',
        category: 'coverage',
        message: 'Improve branch coverage by testing conditional logic and error paths',
        target: 'Overall branch coverage'
      });
    }

    // Module-specific recommendations
    Object.keys(byModule).forEach(moduleName => {
      const module = byModule[moduleName];

      if (module.statements.percentage < 70) {
        analysis.recommendations.push({
          priority: 'medium',
          category: 'module',
          message: `Add more unit tests for ${moduleName}`,
          target: moduleName,
          details: `Current coverage: ${module.statements.percentage}%`
        });
      }

      if (module.complexity > 10) {
        analysis.recommendations.push({
          priority: 'medium',
          category: 'complexity',
          message: `Consider refactoring ${moduleName} to reduce complexity`,
          target: moduleName,
          details: `Current complexity score: ${module.complexity}`
        });
      }
    });

    // Syrian marketplace specific recommendations
    const syrianServices = ['admin-product.service', 'admin-order.service', 'syrian-data.service'];
    syrianServices.forEach(service => {
      if (byModule[service] && byModule[service].statements.percentage < 85) {
        analysis.recommendations.push({
          priority: 'high',
          category: 'syrian-features',
          message: `Critical Syrian marketplace service needs better test coverage`,
          target: service,
          details: 'Core admin services should have >85% coverage'
        });
      }
    });
  }

  /**
   * Generate HTML coverage report
   */
  async generateHTMLReport(analysis) {
    const htmlContent = this.generateHTMLContent(analysis);
    const htmlFile = path.join(this.reportDir, 'coverage-report.html');
    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`📄 HTML report: ${htmlFile}`);
  }

  /**
   * Generate HTML content for coverage report
   */
  generateHTMLContent(analysis) {
    const { overall, byModule, qualityGates, recommendations } = analysis;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syrian Marketplace - Test Coverage Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #988561; }
        .logo { color: #988561; font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 1.2em; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: linear-gradient(135deg, #988561, #b9a779); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .metric-value { font-size: 3em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { font-size: 1.1em; opacity: 0.9; }
        .progress-bar { background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-top: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: white; border-radius: 4px; transition: width 0.3s ease; }
        .quality-gates { margin-bottom: 40px; }
        .status-badge { padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 0.9em; }
        .status-pass { background: #d4edda; color: #155724; }
        .status-fail { background: #f8d7da; color: #721c24; }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .module-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: white; }
        .module-name { font-weight: bold; font-size: 1.1em; margin-bottom: 15px; color: #988561; }
        .module-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .module-metric { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        .recommendation { margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #988561; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ Syrian Marketplace</div>
            <div class="subtitle">Test Coverage Report</div>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${overall.statements.percentage}%</div>
                <div class="metric-label">Statements</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${overall.statements.percentage}%"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overall.branches.percentage}%</div>
                <div class="metric-label">Branches</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${overall.branches.percentage}%"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overall.functions.percentage}%</div>
                <div class="metric-label">Functions</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${overall.functions.percentage}%"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overall.lines.percentage}%</div>
                <div class="metric-label">Lines</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${overall.lines.percentage}%"></div>
                </div>
            </div>
        </div>

        <div class="quality-gates">
            <h2>Quality Gates</h2>
            <div class="status-badge ${qualityGates.passed ? 'status-pass' : 'status-fail'}">
                ${qualityGates.passed ? '✅ PASSED' : '❌ FAILED'}
            </div>
            ${qualityGates.failures.length > 0 ? `
                <h3>Failures:</h3>
                <ul>
                    ${qualityGates.failures.map(f => `<li>${f.message}</li>`).join('')}
                </ul>
            ` : ''}
        </div>

        <div class="modules-section">
            <h2>Module Coverage</h2>
            <div class="modules-grid">
                ${Object.keys(byModule).map(moduleName => {
                    const module = byModule[moduleName];
                    return `
                        <div class="module-card">
                            <div class="module-name">${moduleName}</div>
                            <div class="module-metrics">
                                <div class="module-metric">
                                    <strong>${module.statements.percentage}%</strong><br>
                                    Statements
                                </div>
                                <div class="module-metric">
                                    <strong>${module.branches.percentage}%</strong><br>
                                    Branches
                                </div>
                                <div class="module-metric">
                                    <strong>${module.functions.percentage}%</strong><br>
                                    Functions
                                </div>
                                <div class="module-metric">
                                    <strong>Score: ${module.complexity}</strong><br>
                                    Complexity
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        ${recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>Recommendations</h2>
                ${recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority}">
                        <strong>${rec.category.toUpperCase()}</strong>: ${rec.message}
                        ${rec.target ? `<br><small>Target: ${rec.target}</small>` : ''}
                        ${rec.details ? `<br><small>${rec.details}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="timestamp">
            Generated on ${new Date(analysis.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(analysis) {
    const jsonFile = path.join(this.reportDir, 'coverage-analysis.json');
    fs.writeFileSync(jsonFile, JSON.stringify(analysis, null, 2));
    console.log(`📊 JSON report: ${jsonFile}`);
  }

  /**
   * Generate markdown summary
   */
  async generateMarkdownSummary(analysis) {
    const { overall, qualityGates, recommendations } = analysis;

    const markdown = `
# Syrian Marketplace Test Coverage Report

Generated on: ${new Date(analysis.timestamp).toLocaleString()}

## 📊 Overall Coverage

| Metric | Coverage | Status |
|--------|----------|---------|
| Statements | ${overall.statements.percentage}% | ${overall.statements.percentage >= 80 ? '✅' : '❌'} |
| Branches | ${overall.branches.percentage}% | ${overall.branches.percentage >= 75 ? '✅' : '❌'} |
| Functions | ${overall.functions.percentage}% | ${overall.functions.percentage >= 80 ? '✅' : '❌'} |
| Lines | ${overall.lines.percentage}% | ${overall.lines.percentage >= 80 ? '✅' : '❌'} |

## 🎯 Quality Gates

**Status:** ${qualityGates.passed ? '✅ PASSED' : '❌ FAILED'}

${qualityGates.failures.length > 0 ? `
### Failures:
${qualityGates.failures.map(f => `- ${f.message}`).join('\n')}
` : ''}

${qualityGates.warnings.length > 0 ? `
### Warnings:
${qualityGates.warnings.map(w => `- ${w.message}`).join('\n')}
` : ''}

## 🏛️ Syrian Marketplace Modules

${Object.keys(analysis.byModule).map(moduleName => {
    const module = analysis.byModule[moduleName];
    return `
### ${moduleName}
- Statements: ${module.statements.percentage}%
- Branches: ${module.branches.percentage}%
- Functions: ${module.functions.percentage}%
- Complexity: ${module.complexity}
    `;
}).join('')}

## 💡 Recommendations

${recommendations.map(rec => `
### ${rec.priority.toUpperCase()} Priority: ${rec.category}
${rec.message}
${rec.target ? `**Target:** ${rec.target}` : ''}
${rec.details ? `**Details:** ${rec.details}` : ''}
`).join('')}

---
*Report generated by Syrian Marketplace Test Coverage Analyzer*
    `;

    const markdownFile = path.join(this.reportDir, 'coverage-summary.md');
    fs.writeFileSync(markdownFile, markdown);
    console.log(`📝 Markdown summary: ${markdownFile}`);
  }

  /**
   * Generate quality gate report for CI/CD
   */
  async generateQualityGateReport(analysis) {
    const report = {
      timestamp: analysis.timestamp,
      passed: analysis.qualityGates.passed,
      overall: analysis.overall,
      thresholds: this.thresholds,
      failures: analysis.qualityGates.failures,
      warnings: analysis.qualityGates.warnings
    };

    const ciFile = path.join(this.reportDir, 'quality-gate.json');
    fs.writeFileSync(ciFile, JSON.stringify(report, null, 2));
    console.log(`🔍 Quality gate report: ${ciFile}`);

    // Create exit code file for CI/CD
    const exitCode = analysis.qualityGates.passed ? 0 : 1;
    fs.writeFileSync(path.join(this.reportDir, 'exit-code.txt'), exitCode.toString());
  }

  /**
   * Display summary in console
   */
  displaySummary(analysis) {
    const { overall, qualityGates } = analysis;

    console.log('\n' + '='.repeat(60));
    console.log('🏛️  SYRIAN MARKETPLACE TEST COVERAGE SUMMARY');
    console.log('='.repeat(60));

    console.log('\n📊 OVERALL COVERAGE:');
    console.log(`   Statements: ${overall.statements.percentage}% (${overall.statements.covered}/${overall.statements.total})`);
    console.log(`   Branches:   ${overall.branches.percentage}% (${overall.branches.covered}/${overall.branches.total})`);
    console.log(`   Functions:  ${overall.functions.percentage}% (${overall.functions.covered}/${overall.functions.total})`);
    console.log(`   Lines:      ${overall.lines.percentage}% (${overall.lines.covered}/${overall.lines.total})`);

    console.log('\n🎯 QUALITY GATES:');
    console.log(`   Status: ${qualityGates.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (qualityGates.failures.length > 0) {
      console.log('   Failures:');
      qualityGates.failures.forEach(f => {
        console.log(`   - ${f.message}`);
      });
    }

    if (qualityGates.warnings.length > 0) {
      console.log('   Warnings:');
      qualityGates.warnings.forEach(w => {
        console.log(`   - ${w.message}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    analysis.recommendations.slice(0, 3).forEach(rec => {
      console.log(`   ${rec.priority.toUpperCase()}: ${rec.message}`);
    });

    if (analysis.recommendations.length > 3) {
      console.log(`   ... and ${analysis.recommendations.length - 3} more recommendations`);
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new SyrianMarketplaceCoverageAnalyzer();
  analyzer.generateCoverageReport().catch(error => {
    console.error('Coverage analysis failed:', error);
    process.exit(1);
  });
}

module.exports = SyrianMarketplaceCoverageAnalyzer;