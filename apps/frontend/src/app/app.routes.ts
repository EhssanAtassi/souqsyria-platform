import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

/**
 * Application routing configuration
 *
 * Defines all routes for the SouqSyria e-commerce application
 * Supports lazy loading for better performance
 * Routes are in English with Arabic support
 *
 * @swagger
 * components:
 *   schemas:
 *     AppRoutes:
 *       type: object
 *       properties:
 *         routes:
 *           type: array
 *           description: Syrian marketplace route definitions
 */
export const routes: Routes = [
  // Homepage route - Refactored with Blueprint Pattern
  {
    path: '',
    loadComponent: () => import('./features/homepage/component/homepage.component').then(m => m.HomepageComponent),
    title: 'SouqSyria - Syrian Marketplace | سوق سوريا'
  },

  // Authentication routes (login, register, OTP, password reset)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
    title: 'Authentication - SouqSyria'
  },

  // Direct login/register aliases for convenience
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: 'auth/register',
    pathMatch: 'full'
  },

  // Slider Demo Route (for development/testing)
  {
    path: 'slider-demo',
    loadComponent: () => import('./slider-demo.component').then(m => m.SliderDemoComponent),
    title: 'Slider Demo - SouqSyria'
  },

  // Widget Test Page (for development/testing - Phase 1 template widgets)
  {
    path: 'test-widgets',
    loadComponent: () => import('./features/test-pages/widget-test-page.component').then(m => m.WidgetTestPageComponent),
    title: 'Widget Test Page - SouqSyria'
  },

  // Offer routes
  {
    path: 'offer/:offerId',
    loadComponent: () => import('./features/offers/offer-page.component').then(m => m.OfferPageComponent),
    title: 'Special Offer - SouqSyria'
  },
  {
    path: 'offers/:offerId',
    redirectTo: 'offer/:offerId',
    pathMatch: 'full'
  },

  // Category routes (both singular and plural) - Refactored with Blueprint Pattern
  {
    path: 'category/:categorySlug',
    loadComponent: () => import('./features/category/component/category.component').then(m => m.CategoryComponent),
    title: 'Category - SouqSyria'
  },
  {
    path: 'categories/:categorySlug',
    redirectTo: 'category/:categorySlug',
    pathMatch: 'full'
  },

  // Legacy Turkish route redirect
  {
    path: 'kategori/:categorySlug',
    redirectTo: 'category/:categorySlug',
    pathMatch: 'full'
  },

  // Legacy generic category redirects to authentic Syrian categories
  {
    path: 'category/electronics',
    redirectTo: 'category/damascus-steel',
    pathMatch: 'full'
  },
  {
    path: 'categories/electronics',
    redirectTo: 'category/damascus-steel',
    pathMatch: 'full'
  },
  {
    path: 'category/fashion',
    redirectTo: 'category/textiles-fabrics',
    pathMatch: 'full'
  },
  {
    path: 'categories/fashion',
    redirectTo: 'category/textiles-fabrics',
    pathMatch: 'full'
  },
  {
    path: 'category/home-garden',
    redirectTo: 'category/traditional-crafts',
    pathMatch: 'full'
  },
  {
    path: 'categories/home-garden',
    redirectTo: 'category/traditional-crafts',
    pathMatch: 'full'
  },
  {
    path: 'category/beauty',
    redirectTo: 'category/beauty-wellness',
    pathMatch: 'full'
  },
  {
    path: 'categories/beauty',
    redirectTo: 'category/beauty-wellness',
    pathMatch: 'full'
  },
  {
    path: 'category/sports',
    redirectTo: 'category/traditional-crafts',
    pathMatch: 'full'
  },
  {
    path: 'categories/sports',
    redirectTo: 'category/traditional-crafts',
    pathMatch: 'full'
  },

  // Product detail routes - redirect to /products/:slug
  {
    path: 'product/:productSlug',
    redirectTo: 'products/:productSlug',
    pathMatch: 'full'
  },

  // Legacy Turkish route redirect
  {
    path: 'urun/:productSlug',
    redirectTo: 'product/:productSlug',
    pathMatch: 'full'
  },

  // Campaign routes
  {
    path: 'campaigns/:campaignSlug',
    loadComponent: () => import('./features/campaign/campaign.component').then(m => m.CampaignComponent),
    title: 'Campaign - SouqSyria'
  },

  // Legacy Turkish route redirect
  {
    path: 'kampanya/:campaignSlug',
    redirectTo: 'campaigns/:campaignSlug',
    pathMatch: 'full'
  },

  // Search results
  {
    path: 'search',
    loadComponent: () => import('./features/search/search-results.component').then(m => m.SearchResultsComponent),
    title: 'Search Results - SouqSyria'
  },

  // Legacy Turkish route redirect
  {
    path: 'arama',
    redirectTo: 'search',
    pathMatch: 'full'
  },

  // Product catalog with server-side pagination (SS-PROD-001)
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes),
    title: 'Products - SouqSyria | المنتجات'
  },

  // User account routes (protected by auth guard)
  {
    path: 'account',
    canActivate: [authGuard],
    loadChildren: () => import('./features/account/account.routes').then(m => m.accountRoutes),
    title: 'My Account - SouqSyria'
  },


  /**
   * Admin Panel Routes (Enterprise)
   *
   * @description
   * Lazy-loaded admin panel with comprehensive RBAC protection.
   * Authentication and permission checks are handled within admin.routes.ts.
   *
   * Guard Layers:
   * - AdminGuard: Session validation and authentication
   * - permissionGuard: Route-specific permission checks
   *
   * Protected Features:
   * - /admin/dashboard     -> Main overview (all admins)
   * - /admin/users         -> User management (manage_users)
   * - /admin/roles         -> Role management (manage_roles)
   * - /admin/routes        -> Route mapping (manage_routes)
   * - /admin/security      -> Security audit (view_audit_logs)
   *
   * @see admin.routes.ts for detailed route configuration
   */
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    title: 'SouqSyria Admin Panel',
    data: {
      breadcrumb: 'Admin',
      preload: false, // Admin module loaded on-demand for better initial load
    },
  },


  // Legacy Turkish route redirect
  {
    path: 'hesabim',
    redirectTo: 'account',
    pathMatch: 'full'
  },

  // Shopping cart
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
    title: 'Shopping Cart - SouqSyria'
  },

  // Legacy Turkish route redirect
  {
    path: 'sepet',
    redirectTo: 'cart',
    pathMatch: 'full'
  },

  // Wishlist
  {
    path: 'wishlist',
    loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent),
    title: 'My Wishlist - SouqSyria | قائمة الأمنيات'
  },

  // Legacy Turkish route redirect
  {
    path: 'favoriler',
    redirectTo: 'wishlist',
    pathMatch: 'full'
  },

  // Checkout
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    title: 'Checkout - SouqSyria'
  },

  // Order Confirmation
  {
    path: 'checkout/confirmation',
    loadComponent: () => import('./features/checkout/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
    title: 'Order Confirmed - SouqSyria'
  },

  // Legacy Turkish route redirect
  {
    path: 'odeme',
    redirectTo: 'checkout',
    pathMatch: 'full'
  },

  // Static pages
  {
    path: 'about',
    loadComponent: () => import('./features/pages/about.component').then(m => m.AboutComponent),
    title: 'About Us - SouqSyria'
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/pages/contact.component').then(m => m.ContactComponent),
    title: 'Contact Us - SouqSyria'
  },
  {
    path: 'help',
    loadComponent: () => import('./features/pages/help.component').then(m => m.HelpComponent),
    title: 'Help Center - SouqSyria'
  },

  // Legacy Turkish route redirects
  {
    path: 'hakkimizda',
    redirectTo: 'about',
    pathMatch: 'full'
  },
  {
    path: 'iletisim',
    redirectTo: 'contact',
    pathMatch: 'full'
  },
  {
    path: 'yardim',
    redirectTo: 'help',
    pathMatch: 'full'
  },

  // Legal pages
  {
    path: 'privacy',
    loadComponent: () => import('./features/pages/privacy.component').then(m => m.PrivacyComponent),
    title: 'Privacy Policy - SouqSyria | سياسة الخصوصية'
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/pages/terms.component').then(m => m.TermsComponent),
    title: 'Terms of Service - SouqSyria | شروط الخدمة'
  },

  // 404 fallback
  {
    path: '**',
    loadComponent: () => import('./features/pages/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - SouqSyria'
  }
];
