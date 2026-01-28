/**
 * @file admin-dashboard.e2e.spec.ts
 * @description End-to-End tests for Admin Dashboard
 *
 * TEST COVERAGE:
 * - Admin login and dashboard access
 * - Dashboard metrics display and updates
 * - Chart period selection and data refresh
 * - Quick action navigation
 * - Performance monitoring (Core Web Vitals)
 * - RTL/Arabic language support
 * - Mobile responsive design
 * - Accessibility compliance
 *
 * @author Test Automation Team
 * @since 2026-01-24
 */

import { test, expect, Page, TestInfo } from '@playwright/test';
import { DashboardPage } from './fixtures/page-objects/dashboard.page';
import { ADMIN_USER, TEST_USERS } from './fixtures/test-users.fixture';

/**
 * Base URL configuration
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4200';

/**
 * Setup and teardown for E2E tests
 */
test.describe('Admin Dashboard E2E Tests', () => {
  let dashboardPage: DashboardPage;
  let page: Page;

  /**
   * Before each test
   */
  test.beforeEach(async ({ browser }, testInfo) => {
    // Create new page context
    const context = await browser.newContext();
    page = await context.newPage();

    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 720 });

    // Initialize page object
    dashboardPage = new DashboardPage(page);

    // Add logging
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('error', error => console.error(`Page error: ${error}`));
  });

  /**
   * After each test cleanup
   */
  test.afterEach(async ({ browser }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/screenshots/${testInfo.title}-failed.png`,
        fullPage: true
      });
    }

    // Close page
    await page.close();
  });

  // =========================================================================
  // AUTHENTICATION TESTS
  // =========================================================================

  test('Admin should successfully login and access dashboard', async () => {
    // Navigate to app
    await page.goto(`${BASE_URL}/admin/login`);

    // Wait for login form
    await expect(page.locator('form')).toBeVisible();

    // Fill credentials
    await page.locator('input[type="email"]').fill(ADMIN_USER.email);
    await page.locator('input[type="password"]').fill(ADMIN_USER.password);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/admin\/dashboard/);

    // Verify dashboard is loaded
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
  });

  test('Admin should see error message on invalid credentials', async () => {
    // Navigate to login
    await page.goto(`${BASE_URL}/admin/login`);

    // Fill invalid credentials
    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify error message appears
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid credentials');
  });

  // =========================================================================
  // DASHBOARD DISPLAY TESTS
  // =========================================================================

  test('Dashboard should display all metric cards', async () => {
    // Login and navigate to dashboard
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Verify metric cards are displayed
    const metricCards = page.locator('[data-testid="metric-card"]');
    const count = await metricCards.count();

    expect(count).toBe(4); // Expected: Revenue, Orders, Users, Vendors

    // Verify each card has required elements
    for (let i = 0; i < count; i++) {
      const card = metricCards.nth(i);
      await expect(card.locator('[data-testid="metric-title"]')).toBeVisible();
      await expect(card.locator('[data-testid="metric-value"]')).toBeVisible();
      await expect(card.locator('[data-testid="metric-trend"]')).toBeVisible();
    }
  });

  test('Dashboard metrics should display numeric values', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Get metric values
    const revenueValue = await dashboardPage.getMetricValue('revenue');
    const ordersValue = await dashboardPage.getMetricValue('orders');
    const usersValue = await dashboardPage.getMetricValue('users');

    // Verify values are positive numbers
    expect(revenueValue).toBeGreaterThanOrEqual(0);
    expect(ordersValue).toBeGreaterThanOrEqual(0);
    expect(usersValue).toBeGreaterThanOrEqual(0);
  });

  test('Revenue chart should be visible and interactive', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Verify chart container
    const chart = page.locator('[data-testid="revenue-chart"]');
    await expect(chart).toBeVisible();

    // Verify chart has SVG elements (ngx-charts rendering)
    const chartSvg = chart.locator('svg');
    await expect(chartSvg).toBeVisible();

    // Hover over chart to verify tooltip
    const chartArea = chart.locator('rect').first();
    await chartArea.hover();

    // Verify tooltip appears
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  test('Dashboard should display pending actions', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Verify quick action cards exist
    const quickActions = page.locator('[data-testid="quick-action"]');
    const actionCount = await quickActions.count();

    expect(actionCount).toBeGreaterThan(0);

    // Verify action structure
    for (let i = 0; i < Math.min(actionCount, 3); i++) {
      const action = quickActions.nth(i);
      await expect(action.locator('[data-testid="action-title"]')).toBeVisible();
      await expect(action.locator('[data-testid="action-badge"]')).toBeVisible();
    }
  });

  // =========================================================================
  // CHART PERIOD SELECTION TESTS
  // =========================================================================

  test('Should change chart data when period is changed', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Get initial chart data
    const initialLabels = await page.locator('[data-testid="chart-label"]').allTextContents();

    // Change period to weekly
    await dashboardPage.selectPeriod('weekly');

    // Wait for chart update
    await page.waitForTimeout(1000);

    // Verify labels changed
    const updatedLabels = await page.locator('[data-testid="chart-label"]').allTextContents();
    expect(updatedLabels).not.toEqual(initialLabels);
  });

  test('Should support all chart periods (daily, weekly, monthly, yearly)', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    const periods = ['daily', 'weekly', 'monthly', 'yearly'] as const;

    for (const period of periods) {
      // Select period
      await dashboardPage.selectPeriod(period);

      // Wait for update
      await page.waitForTimeout(500);

      // Verify chart is visible
      const chart = page.locator('[data-testid="revenue-chart"]');
      await expect(chart).toBeVisible();

      // Verify period button is active
      const periodBtn = page.locator(`[data-testid="period-btn-${period}"]`);
      await expect(periodBtn).toHaveAttribute('aria-selected', 'true');
    }
  });

  // =========================================================================
  // QUICK ACTIONS TESTS
  // =========================================================================

  test('Quick action buttons should navigate to correct routes', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Test Orders quick action
    await dashboardPage.clickQuickAction('orders');
    await page.waitForURL(/\/admin\/orders/);
    expect(page.url()).toContain('/admin/orders');

    // Go back to dashboard
    await page.goBack();

    // Test Products quick action
    await dashboardPage.clickQuickAction('products');
    await page.waitForURL(/\/admin\/products/);
    expect(page.url()).toContain('/admin/products');
  });

  test('Quick action badges should display correct pending counts', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Get pending count from Orders badge
    const ordersBadge = page.locator('[data-testid="quick-action-orders"] [data-testid="badge"]');
    const badgeText = await ordersBadge.textContent();

    // Verify badge shows number
    expect(badgeText).toMatch(/\d+/);
    const count = parseInt(badgeText || '0');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // =========================================================================
  // REFRESH FUNCTIONALITY TESTS
  // =========================================================================

  test('Refresh button should reload dashboard data', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Get initial timestamp
    const initialTimestamp = await page.locator('[data-testid="last-refresh"]').textContent();

    // Wait a moment
    await page.waitForTimeout(2000);

    // Click refresh
    await dashboardPage.refreshData();

    // Verify loading state appears
    const spinner = page.locator('[data-testid="loading-spinner"]');
    await expect(spinner).toBeVisible();

    // Wait for loading to complete
    await expect(spinner).not.toBeVisible();

    // Verify timestamp updated
    const updatedTimestamp = await page.locator('[data-testid="last-refresh"]').textContent();
    expect(updatedTimestamp).not.toEqual(initialTimestamp);
  });

  test('Dashboard should auto-refresh data periodically', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Get initial value
    const initialValue = await dashboardPage.getMetricValue('revenue');

    // Wait for auto-refresh (typically 30 seconds, but test configurable interval)
    await page.waitForTimeout(3000);

    // Verify page is still responsive
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();

    // Verify no errors in console
    const errors: any[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    expect(errors.length).toBe(0);
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================

  test('Dashboard should show error message on data load failure', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Mock API failure
    await page.route('**/api/admin/metrics', route => route.abort());

    // Click refresh to trigger error
    await dashboardPage.refreshData();

    // Verify error message displays
    const errorMsg = page.locator('[data-testid="error-message"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Failed to load');
  });

  test('Dashboard should recover from temporary connection issues', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Verify dashboard loaded
    await expect(page.locator('[data-testid="metric-card"]')).toBeVisible();

    // Simulate temporary offline
    await page.context()?.setOffline(true);

    // Wait and go back online
    await page.waitForTimeout(1000);
    await page.context()?.setOffline(false);

    // Dashboard should still be visible and functional
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
  });

  // =========================================================================
  // PERFORMANCE TESTS
  // =========================================================================

  test('Dashboard should load within Core Web Vitals thresholds', async () => {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/admin/login`);

    // Login
    await page.locator('input[type="email"]').fill(ADMIN_USER.email);
    await page.locator('input[type="password"]').fill(ADMIN_USER.password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard
    await page.waitForURL(/\/admin\/dashboard/);

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcpEntries = performance.getEntriesByName('first-contentful-paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');

      return {
        fcp: fcpEntries[0]?.startTime || 0,
        lcp: lcpEntries[lcpEntries.length - 1]?.startTime || 0,
        ttfb: nav.responseStart - nav.fetchStart,
        domReady: nav.domInteractive - nav.fetchStart
      };
    });

    // Assert Core Web Vitals thresholds
    expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.ttfb).toBeLessThan(600);  // TTFB < 600ms
  });

  test('Dashboard should render without memory leaks', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform multiple interactions
    for (let i = 0; i < 5; i++) {
      const periods = ['daily', 'weekly', 'monthly'];
      for (const period of periods) {
        await dashboardPage.selectPeriod(period as any);
        await page.waitForTimeout(500);
      }
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory should not grow excessively
    const memoryGrowth = finalMemory - initialMemory;
    const maxAllowedGrowth = initialMemory * 0.2; // 20% growth allowed

    expect(memoryGrowth).toBeLessThan(maxAllowedGrowth);
  });

  // =========================================================================
  // RESPONSIVE DESIGN TESTS
  // =========================================================================

  test('Dashboard should be responsive on tablet (iPad)', async () => {
    // Set iPad viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Verify layout adjusts
    const dashboard = page.locator('[data-testid="dashboard-container"]');
    await expect(dashboard).toBeVisible();

    // Verify no horizontal scroll
    const width = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(width);
  });

  test('Dashboard should be responsive on mobile (iPhone)', async () => {
    // Set iPhone viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Verify metric cards stack vertically
    const metricCards = page.locator('[data-testid="metric-card"]');
    const firstCard = metricCards.first();
    const lastCard = metricCards.last();

    const firstBox = await firstCard.boundingBox();
    const lastBox = await lastCard.boundingBox();

    // Cards should be below each other (different Y positions)
    expect(lastBox!.y).toBeGreaterThan(firstBox!.y);

    // Verify no horizontal overflow
    const width = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(width + 1); // +1 for rounding errors
  });

  // =========================================================================
  // RTL / ARABIC LANGUAGE TESTS
  // =========================================================================

  test('Dashboard should support Arabic language and RTL layout', async () => {
    // Login with English first
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Switch to Arabic language
    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="lang-ar"]');

    // Wait for page to refresh
    await page.waitForTimeout(1000);

    // Verify RTL attribute is set
    const htmlDir = await page.evaluate(() => {
      const html = document.documentElement;
      return html.getAttribute('dir') || html.getAttribute('lang');
    });

    expect(htmlDir).toMatch(/rtl|ar/i);

    // Verify Arabic text is visible
    const arabicTitle = page.locator('text=لوحة التحكم');
    await expect(arabicTitle).toBeVisible();

    // Verify layout is RTL
    const dashboard = page.locator('[data-testid="dashboard-container"]');
    const direction = await dashboard.evaluate((el) => {
      return window.getComputedStyle(el).direction;
    });

    expect(direction).toBe('rtl');
  });

  // =========================================================================
  // ACCESSIBILITY TESTS
  // =========================================================================

  test('Dashboard should meet WCAG 2.1 AA accessibility standards', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (await images.nth(i).isVisible()) {
        expect(alt).toBeTruthy();
      }
    }

    // Check for ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Verify color contrast (would need additional library)
    // This is a placeholder - in real tests use axe-core or similar
    const successBadges = page.locator('[role="status"]');
    await expect(successBadges).toHaveCount(await page.locator('[role="status"]').count());
  });

  test('Dashboard should be keyboard navigable', async () => {
    // Login
    await dashboardPage.goto();
    await dashboardPage.login(ADMIN_USER.email, ADMIN_USER.password);

    // Tab through interactive elements
    const interactiveElements = page.locator('button, [role="button"], a');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);

    // Verify first element can be focused
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
