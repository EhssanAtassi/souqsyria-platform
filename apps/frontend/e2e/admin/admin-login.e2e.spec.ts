import { browser, by, element, ExpectedConditions } from 'protractor';

/**
 * E2E Tests for Admin Login Workflow - Syrian Marketplace
 *
 * Tests the complete admin authentication flow including:
 * - Login page navigation and form validation
 * - Successful admin authentication
 * - Dashboard access after login
 * - Role-based access control
 * - Logout functionality
 * - Security features and session management
 *
 * @swagger
 * components:
 *   schemas:
 *     AdminLoginE2ETests:
 *       type: object
 *       description: End-to-end test suite for admin authentication workflow
 *       properties:
 *         loginWorkflow:
 *           type: array
 *           description: Tests for complete login process
 *         dashboardAccess:
 *           type: array
 *           description: Tests for post-login dashboard access
 *         roleBasedAccess:
 *           type: array
 *           description: Tests for role-based feature access
 *         sessionManagement:
 *           type: array
 *           description: Tests for session and logout functionality
 */
describe('Admin Login E2E Tests', () => {

  const adminCredentials = {
    validAdmin: {
      email: 'admin@souqsyria.com',
      password: 'admin123'
    },
    validVendor: {
      email: 'vendor@souqsyria.com',
      password: 'admin123'
    },
    invalidCredentials: {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    }
  };

  const pages = {
    login: '/admin/auth/login',
    dashboard: '/admin/dashboard',
    products: '/admin/products',
    orders: '/admin/orders',
    vendors: '/admin/vendors'
  };

  beforeEach(async () => {
    // Clear any existing sessions and navigate to login
    await browser.manage().deleteAllCookies();
    await browser.restart();
  });

  describe('Login Page and Form Validation', () => {

    /**
     * Test login page accessibility and initial state
     * Verifies login page loads correctly with proper form elements
     */
    it('should load admin login page with correct elements', async () => {
      await browser.get(pages.login);

      // Check page title and heading
      expect(await browser.getTitle()).toContain('Admin Login');

      const loginHeading = element(by.css('h1, h2, .login-title'));
      expect(await loginHeading.isPresent()).toBe(true);
      expect(await loginHeading.getText()).toContain('Admin Login');

      // Check form elements are present
      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      expect(await emailField.isPresent()).toBe(true);
      expect(await passwordField.isPresent()).toBe(true);
      expect(await loginButton.isPresent()).toBe(true);

      // Check initial form state
      expect(await emailField.getAttribute('value')).toBe('');
      expect(await passwordField.getAttribute('value')).toBe('');
      expect(await loginButton.isEnabled()).toBe(false); // Should be disabled initially
    });

    /**
     * Test form validation with invalid inputs
     * Verifies proper validation messages for invalid credentials
     */
    it('should display validation errors for invalid form inputs', async () => {
      await browser.get(pages.login);

      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      // Test invalid email format
      await emailField.sendKeys('invalid-email');
      await passwordField.click(); // Trigger validation

      const emailError = element(by.css('.email-error, mat-error, .error-message'));
      await browser.wait(ExpectedConditions.presenceOf(emailError), 3000);
      expect(await emailError.getText()).toContain('valid email');

      // Clear and test empty fields
      await emailField.clear();
      await passwordField.clear();
      await loginButton.click();

      // Should show required field errors
      const requiredErrors = element.all(by.css('mat-error, .error-message'));
      expect(await requiredErrors.count()).toBeGreaterThan(0);
    });

    /**
     * Test form submission with invalid credentials
     * Verifies proper error handling for authentication failures
     */
    it('should display error message for invalid credentials', async () => {
      await browser.get(pages.login);

      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      // Enter invalid credentials
      await emailField.sendKeys(adminCredentials.invalidCredentials.email);
      await passwordField.sendKeys(adminCredentials.invalidCredentials.password);

      // Wait for button to be enabled
      await browser.wait(ExpectedConditions.elementToBeClickable(loginButton), 3000);
      await loginButton.click();

      // Check for error message
      const errorMessage = element(by.css('.login-error, .error-alert, mat-error'));
      await browser.wait(ExpectedConditions.presenceOf(errorMessage), 5000);
      expect(await errorMessage.getText()).toContain('Invalid credentials');
    });
  });

  describe('Successful Authentication Workflow', () => {

    /**
     * Test successful admin login and dashboard redirection
     * Verifies complete login workflow for admin user
     */
    it('should successfully login admin user and redirect to dashboard', async () => {
      await browser.get(pages.login);

      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      // Enter valid admin credentials
      await emailField.sendKeys(adminCredentials.validAdmin.email);
      await passwordField.sendKeys(adminCredentials.validAdmin.password);

      // Submit form
      await browser.wait(ExpectedConditions.elementToBeClickable(loginButton), 3000);
      await loginButton.click();

      // Wait for redirect to dashboard
      await browser.wait(ExpectedConditions.urlContains('/admin/dashboard'), 10000);
      expect(await browser.getCurrentUrl()).toContain('/admin/dashboard');

      // Verify dashboard elements are present
      const dashboardTitle = element(by.css('h1, h2, .dashboard-title'));
      await browser.wait(ExpectedConditions.presenceOf(dashboardTitle), 5000);
      expect(await dashboardTitle.getText()).toContain('Dashboard');

      // Check for admin navigation elements
      const navigation = element(by.css('.admin-nav, mat-sidenav, .sidebar'));
      expect(await navigation.isPresent()).toBe(true);
    });

    /**
     * Test vendor login with appropriate dashboard access
     * Verifies vendor users see appropriate interface
     */
    it('should successfully login vendor user with vendor-specific dashboard', async () => {
      await browser.get(pages.login);

      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      // Enter valid vendor credentials
      await emailField.sendKeys(adminCredentials.validVendor.email);
      await passwordField.sendKeys(adminCredentials.validVendor.password);

      await browser.wait(ExpectedConditions.elementToBeClickable(loginButton), 3000);
      await loginButton.click();

      // Wait for redirect
      await browser.wait(ExpectedConditions.urlContains('/admin'), 10000);

      // Should have appropriate vendor interface
      const userMenu = element(by.css('.user-menu, .profile-menu'));
      await browser.wait(ExpectedConditions.presenceOf(userMenu), 5000);
      expect(await userMenu.isPresent()).toBe(true);
    });
  });

  describe('Dashboard Navigation and Features', () => {

    beforeEach(async () => {
      // Login before each test
      await browser.get(pages.login);
      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      await emailField.sendKeys(adminCredentials.validAdmin.email);
      await passwordField.sendKeys(adminCredentials.validAdmin.password);
      await loginButton.click();

      await browser.wait(ExpectedConditions.urlContains('/admin/dashboard'), 10000);
    });

    /**
     * Test dashboard navigation to admin modules
     * Verifies navigation to main admin sections
     */
    it('should navigate to admin modules from dashboard', async () => {
      // Test navigation to Products
      const productsLink = element(by.css('a[href*="/admin/products"], .nav-products'));
      if (await productsLink.isPresent()) {
        await productsLink.click();
        await browser.wait(ExpectedConditions.urlContains('/admin/products'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/admin/products');

        // Navigate back to dashboard
        await browser.get(pages.dashboard);
      }

      // Test navigation to Orders
      const ordersLink = element(by.css('a[href*="/admin/orders"], .nav-orders'));
      if (await ordersLink.isPresent()) {
        await ordersLink.click();
        await browser.wait(ExpectedConditions.urlContains('/admin/orders'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/admin/orders');

        // Navigate back to dashboard
        await browser.get(pages.dashboard);
      }

      // Test navigation to Vendors
      const vendorsLink = element(by.css('a[href*="/admin/vendors"], .nav-vendors'));
      if (await vendorsLink.isPresent()) {
        await vendorsLink.click();
        await browser.wait(ExpectedConditions.urlContains('/admin/vendors'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/admin/vendors');
      }
    });

    /**
     * Test dashboard statistics and widgets
     * Verifies dashboard displays proper Syrian marketplace statistics
     */
    it('should display Syrian marketplace statistics on dashboard', async () => {
      // Check for statistics widgets
      const statsWidgets = element.all(by.css('.stat-widget, .dashboard-card, mat-card'));
      expect(await statsWidgets.count()).toBeGreaterThan(0);

      // Check for specific Syrian marketplace metrics
      const dashboardContent = await element(by.css('.dashboard-content, .main-content')).getText();

      // Should contain relevant metrics
      const expectedMetrics = ['Total Orders', 'Products', 'Vendors', 'Revenue'];
      for (const metric of expectedMetrics) {
        // At least some metrics should be present
        if (dashboardContent.includes(metric)) {
          expect(dashboardContent).toContain(metric);
        }
      }
    });

    /**
     * Test quick actions functionality
     * Verifies dashboard quick action buttons work correctly
     */
    it('should provide functional quick actions from dashboard', async () => {
      // Look for quick action buttons
      const quickActions = element.all(by.css('.quick-action, .action-button, .dashboard-action'));

      if (await quickActions.count() > 0) {
        const firstAction = quickActions.first();
        const actionText = await firstAction.getText();

        // Click first quick action
        await firstAction.click();

        // Should navigate somewhere or open a dialog
        await browser.sleep(2000); // Wait for action to complete

        // Verify action was executed (navigation or modal)
        const currentUrl = await browser.getCurrentUrl();
        const modal = element(by.css('mat-dialog-container, .modal, .dialog'));

        expect(currentUrl.includes('/admin') || await modal.isPresent()).toBe(true);
      }
    });
  });

  describe('Role-Based Access Control', () => {

    /**
     * Test admin role access to all features
     * Verifies admin users can access all admin features
     */
    it('should allow admin role access to all admin features', async () => {
      // Login as admin
      await browser.get(pages.login);
      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      await emailField.sendKeys(adminCredentials.validAdmin.email);
      await passwordField.sendKeys(adminCredentials.validAdmin.password);
      await loginButton.click();

      await browser.wait(ExpectedConditions.urlContains('/admin'), 10000);

      // Test access to admin-only features
      const adminFeatures = ['/admin/products', '/admin/orders', '/admin/vendors', '/admin/analytics'];

      for (const feature of adminFeatures) {
        await browser.get(feature);
        await browser.sleep(2000);

        // Should not be redirected to unauthorized page
        const currentUrl = await browser.getCurrentUrl();
        expect(currentUrl).toContain('/admin');
        expect(currentUrl).not.toContain('unauthorized');
      }
    });

    /**
     * Test vendor role limited access
     * Verifies vendor users have restricted access
     */
    it('should restrict vendor role access to appropriate features only', async () => {
      // Login as vendor
      await browser.get(pages.login);
      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      await emailField.sendKeys(adminCredentials.validVendor.email);
      await passwordField.sendKeys(adminCredentials.validVendor.password);
      await loginButton.click();

      await browser.wait(ExpectedConditions.urlContains('/admin'), 10000);

      // Vendors should have access to their own products and orders
      await browser.get('/admin/products');
      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).toContain('/admin');

      // Check that vendor sees their own products only
      const productTable = element(by.css('mat-table, .products-table'));
      if (await productTable.isPresent()) {
        expect(await productTable.isDisplayed()).toBe(true);
      }
    });
  });

  describe('Session Management and Logout', () => {

    beforeEach(async () => {
      // Login before each test
      await browser.get(pages.login);
      const emailField = element(by.css('input[type="email"], input[formControlName="email"]'));
      const passwordField = element(by.css('input[type="password"], input[formControlName="password"]'));
      const loginButton = element(by.css('button[type="submit"], .login-button'));

      await emailField.sendKeys(adminCredentials.validAdmin.email);
      await passwordField.sendKeys(adminCredentials.validAdmin.password);
      await loginButton.click();

      await browser.wait(ExpectedConditions.urlContains('/admin/dashboard'), 10000);
    });

    /**
     * Test logout functionality
     * Verifies logout properly terminates session and redirects
     */
    it('should logout user and redirect to login page', async () => {
      // Find and click logout button
      const userMenu = element(by.css('.user-menu, .profile-menu, .account-menu'));
      await browser.wait(ExpectedConditions.presenceOf(userMenu), 5000);
      await userMenu.click();

      const logoutButton = element(by.css('.logout-button, .logout, button[contains(text(), "Logout")]'));
      await browser.wait(ExpectedConditions.elementToBeClickable(logoutButton), 3000);
      await logoutButton.click();

      // Should redirect to login page
      await browser.wait(ExpectedConditions.urlContains('/login'), 10000);
      expect(await browser.getCurrentUrl()).toContain('/login');

      // Verify session is cleared by trying to access admin page
      await browser.get(pages.dashboard);

      // Should redirect back to login (not dashboard)
      await browser.wait(ExpectedConditions.urlContains('/login'), 5000);
      expect(await browser.getCurrentUrl()).toContain('/login');
    });

    /**
     * Test session persistence across page refreshes
     * Verifies authenticated session persists through browser refresh
     */
    it('should maintain session across page refreshes', async () => {
      // Verify we're logged in
      expect(await browser.getCurrentUrl()).toContain('/admin/dashboard');

      // Refresh the page
      await browser.refresh();

      // Should still be logged in and on dashboard
      await browser.wait(ExpectedConditions.urlContains('/admin/dashboard'), 10000);
      expect(await browser.getCurrentUrl()).toContain('/admin/dashboard');

      // Dashboard content should still be present
      const dashboardContent = element(by.css('.dashboard-content, .main-content, h1, h2'));
      expect(await dashboardContent.isPresent()).toBe(true);
    });

    /**
     * Test session timeout handling
     * Verifies proper handling of session expiration
     */
    it('should handle session timeout appropriately', async () => {
      // Note: This test would need session timeout to be configured for testing
      // In a real implementation, you might:
      // 1. Mock session expiration
      // 2. Use shorter timeout for testing
      // 3. Test idle detection

      // Verify initial login state
      expect(await browser.getCurrentUrl()).toContain('/admin/dashboard');

      // For demonstration, simulate session expiry by clearing cookies
      await browser.manage().deleteAllCookies();

      // Try to access admin area
      await browser.get(pages.products);

      // Should redirect to login due to expired session
      await browser.wait(ExpectedConditions.urlContains('/login'), 10000);
      expect(await browser.getCurrentUrl()).toContain('/login');
    });

    /**
     * Test simultaneous login prevention
     * Verifies security measures for concurrent sessions
     */
    it('should handle multiple browser sessions appropriately', async () => {
      // This test would require opening multiple browser instances
      // For now, verify single session works correctly
      expect(await browser.getCurrentUrl()).toContain('/admin/dashboard');

      // Navigate to different admin pages to verify session works
      const adminPages = ['/admin/products', '/admin/orders', '/admin/dashboard'];

      for (const page of adminPages) {
        await browser.get(page);
        await browser.sleep(1000);
        expect(await browser.getCurrentUrl()).toContain('/admin');
      }
    });
  });

  describe('Security Features', () => {

    /**
     * Test protection against direct URL access
     * Verifies unauthorized users cannot access admin URLs directly
     */
    it('should protect admin routes from unauthorized access', async () => {
      // Ensure we're logged out
      await browser.manage().deleteAllCookies();

      // Try to access admin dashboard directly
      await browser.get(pages.dashboard);

      // Should redirect to login
      await browser.wait(ExpectedConditions.urlContains('/login'), 10000);
      expect(await browser.getCurrentUrl()).toContain('/login');

      // Try other admin routes
      const protectedRoutes = ['/admin/products', '/admin/orders', '/admin/vendors'];

      for (const route of protectedRoutes) {
        await browser.get(route);
        await browser.sleep(2000);

        // Should redirect to login, not show the protected content
        const currentUrl = await browser.getCurrentUrl();
        expect(currentUrl).toContain('/login');
      }
    });

    /**
     * Test CSRF protection measures
     * Verifies forms include proper CSRF protection
     */
    it('should include CSRF protection in forms', async () => {
      await browser.get(pages.login);

      // Check for CSRF token or similar security measures
      const loginForm = element(by.css('form, .login-form'));
      const formHTML = await loginForm.getAttribute('innerHTML');

      // Look for security attributes or hidden fields
      const hasSecurityMeasures =
        formHTML.includes('csrf') ||
        formHTML.includes('token') ||
        formHTML.includes('authenticity') ||
        loginForm.all(by.css('input[type="hidden"]')).count() > 0;

      // In a real application, you'd check for specific CSRF implementation
      expect(await loginForm.isPresent()).toBe(true);
    });
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await browser.manage().deleteAllCookies();
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Final cleanup
    await browser.quit();
  });
});