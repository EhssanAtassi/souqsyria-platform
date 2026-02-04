import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  User,
  UserPreferences,
  NotificationPreferences,
  PrivacySettings,
  AccountDashboardConfig,
  AccountDashboardItem,
  UserStats,
  RecentActivity,
  Announcement,
  WishlistItem,
  WishlistConfig,
  PriceHistoryPoint,
  Order,
  OrderHistoryConfig,
  OrderHistoryFilters,
  OrderStatus,
  OrderItem,
  OrderTrackingEvent,
  ShippingAddress,
  UserAddress,
  AddressBookConfig,
  AddressFormData,
  AddressValidationResult,
  AddressType,
  GeoCoordinates
} from '../interfaces/user.interface';
import { SYRIAN_GOVERNORATES } from '../interfaces/category-filter.interface';
import { TokenService } from '../../features/auth/services/token.service';
import { selectUser, selectIsAuthenticated } from '../../features/auth/store/auth.selectors';
import { AuthUser } from '../../features/auth/models/auth.models';

/**
 * User service for Syrian marketplace
 * 
 * Manages user authentication, profile data, and account dashboard configuration
 * Provides mock data for MVP stage with enterprise-ready structure
 * Supports bilingual content and Syrian marketplace specific features
 * 
 * @swagger
 * components:
 *   schemas:
 *     UserService:
 *       type: object
 *       description: User management service for Syrian marketplace
 *       properties:
 *         currentUser:
 *           $ref: '#/components/schemas/User'
 *         dashboardConfig:
 *           $ref: '#/components/schemas/AccountDashboardConfig'
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Reactive state management using signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _preferredLanguage = signal<'en' | 'ar'>('en');

  // Legacy BehaviorSubject for components that need observables
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  
  // Public readonly signals
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();
  public readonly preferredLanguage = this._preferredLanguage.asReadonly();
  
  // Observable for backward compatibility
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  /** @description NgRx Store instance for reading auth state */
  private readonly store = inject(Store);

  /** @description Token service for checking persisted JWT tokens */
  private readonly tokenService = inject(TokenService);

  /** @description DestroyRef for automatic subscription cleanup */
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.syncWithAuthStore();
  }

  /**
   * Synchronize UserService signals with NgRx auth store
   *
   * @description Subscribes to the NgRx auth state and updates the local
   * signals that guards and other components depend on. This bridges NgRx
   * store state to the signal-based API consumed by auth guards.
   */
  private syncWithAuthStore(): void {
    this.store.select(selectIsAuthenticated).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isAuth => {
      this._isAuthenticated.set(isAuth);
    });

    this.store.select(selectUser).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(authUser => {
      if (authUser) {
        const user = this.mapAuthUserToUser(authUser);
        this._currentUser.set(user);
        this.currentUserSubject.next(user);
        if (user.preferredLanguage) {
          this._preferredLanguage.set(user.preferredLanguage);
        }
      } else {
        this._currentUser.set(null);
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Map backend AuthUser to frontend User interface
   *
   * @description Converts the minimal AuthUser from JWT/API responses
   * into the full User interface expected by frontend components.
   * Missing fields are populated with sensible defaults.
   * @param authUser - Authenticated user data from NgRx store
   * @returns User object compatible with the frontend User interface
   */
  private mapAuthUserToUser(authUser: AuthUser): User {
    const nameParts = (authUser.fullName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: String(authUser.id),
      email: authUser.email,
      firstName,
      lastName,
      firstNameEn: firstName,
      lastNameEn: lastName,
      firstNameAr: firstName,
      lastNameAr: lastName,
      preferredLanguage: 'en',
      preferredCurrency: 'SYP',
      isEmailVerified: authUser.isVerified,
      isPhoneVerified: false,
      loyaltyPoints: 0,
      membershipTier: 'bronze',
      lastLoginAt: authUser.lastLoginAt ? new Date(authUser.lastLoginAt) : new Date(),
      createdAt: authUser.createdAt ? new Date(authUser.createdAt) : new Date(),
    };
  }

  /**
   * Get account dashboard configuration
   * Returns navigation items, user stats, and dashboard content
   * 
   * @returns Observable<AccountDashboardConfig> Complete dashboard configuration
   */
  getAccountDashboardConfig(): Observable<AccountDashboardConfig> {
    const navigationItems: AccountDashboardItem[] = [
      {
        id: 'profile',
        titleEn: 'My Profile',
        titleAr: 'ملفي الشخصي',
        descriptionEn: 'Manage your personal information',
        descriptionAr: 'إدارة معلوماتك الشخصية',
        icon: 'person',
        route: '/account/profile',
        isAvailable: true,
        color: 'primary'
      },
      {
        id: 'orders',
        titleEn: 'My Orders',
        titleAr: 'طلباتي',
        descriptionEn: 'Track and manage your orders',
        descriptionAr: 'تتبع وإدارة طلباتك',
        icon: 'shopping_bag',
        route: '/account/orders',
        badge: 3,
        isAvailable: true,
        color: 'damascus-gold'
      },
      {
        id: 'wishlist',
        titleEn: 'My Wishlist',
        titleAr: 'قائمة الرغبات',
        descriptionEn: 'Save your favorite Syrian products',
        descriptionAr: 'احفظ منتجاتك السورية المفضلة',
        icon: 'favorite',
        route: '/account/wishlist',
        badge: 12,
        isAvailable: true,
        color: 'accent'
      },
      {
        id: 'addresses',
        titleEn: 'My Addresses',
        titleAr: 'عناويني',
        descriptionEn: 'Manage delivery addresses',
        descriptionAr: 'إدارة عناوين التوصيل',
        icon: 'location_on',
        route: '/account/addresses',
        badge: 2,
        isAvailable: true,
        color: 'aleppo-green'
      },
      {
        id: 'offers',
        titleEn: 'Special Offers',
        titleAr: 'العروض الخاصة',
        descriptionEn: 'Exclusive deals for you',
        descriptionAr: 'عروض حصرية لك',
        icon: 'local_offer',
        route: '/account/offers',
        badge: 5,
        isAvailable: true,
        color: 'warn'
      },
      {
        id: 'loyalty',
        titleEn: 'Loyalty Points',
        titleAr: 'نقاط الولاء',
        descriptionEn: 'Earn and redeem rewards',
        descriptionAr: 'اكسب واستبدل المكافآت',
        icon: 'stars',
        route: '/account/loyalty',
        isAvailable: true,
        color: 'damascus-gold'
      }
    ];

    const userStats: UserStats = {
      totalOrders: 24,
      totalSpent: 485000, // Syrian Pounds
      wishlistCount: 12,
      reviewsCount: 8,
      rewardPoints: 1250,
      addressesCount: 2
    };

    const recentActivity: RecentActivity[] = [
      {
        id: 'activity_001',
        type: 'order',
        titleEn: 'Order #SY-2024-001 delivered',
        titleAr: 'تم توصيل الطلب #SY-2024-001',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        link: '/account/orders/SY-2024-001'
      },
      {
        id: 'activity_002',
        type: 'wishlist',
        titleEn: 'Added Damascus Steel Knife to wishlist',
        titleAr: 'أضفت سكين دمشقي إلى قائمة الرغبات',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'activity_003',
        type: 'review',
        titleEn: 'Reviewed Aleppo Laurel Soap',
        titleAr: 'قيمت صابون الغار الحلبي',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];

    const announcements: Announcement[] = [
      {
        id: 'ann_001',
        titleEn: 'Free Shipping on Syrian Traditional Products',
        titleAr: 'شحن مجاني على المنتجات التراثية السورية',
        messageEn: 'Get free shipping on all orders above 50,000 SYP',
        messageAr: 'احصل على شحن مجاني على كل الطلبات فوق 50,000 ليرة سورية',
        type: 'promotion',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ann_002',
        titleEn: 'New Damascus Steel Collection',
        titleAr: 'مجموعة جديدة من الفولاذ الدمشقي',
        messageEn: 'Discover our latest authentic Damascus steel products',
        messageAr: 'اكتشف أحدث منتجاتنا من الفولاذ الدمشقي الأصيل',
        type: 'info',
        isActive: true
      }
    ];

    const config: AccountDashboardConfig = {
      user: this._currentUser()!,
      navigationItems,
      userStats,
      recentActivity,
      announcements
    };

    // Simulate API delay
    return of(config).pipe(delay(300));
  }

  /**
   * Update user preferred language
   * Updates both signal and propagates to user profile
   * 
   * @param language - New preferred language ('en' | 'ar')
   */
  updatePreferredLanguage(language: 'en' | 'ar'): Observable<boolean> {
    this._preferredLanguage.set(language);
    
    const currentUser = this._currentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, preferredLanguage: language };
      this._currentUser.set(updatedUser);
      this.currentUserSubject.next(updatedUser);
    }
    
    // Simulate API call success
    return of(true).pipe(delay(200));
  }

  /**
   * Get user stats for dashboard display
   * 
   * @returns Observable<UserStats> User engagement statistics
   */
  getUserStats(): Observable<UserStats> {
    const stats: UserStats = {
      totalOrders: 24,
      totalSpent: 485000,
      wishlistCount: 12,
      reviewsCount: 8,
      rewardPoints: 1250,
      addressesCount: 2
    };

    return of(stats).pipe(delay(150));
  }

  /**
   * Get current user data
   * Returns the authenticated user's complete profile
   * 
   * @returns Observable<User> Current user data
   */
  getCurrentUser(): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    return of(currentUser).pipe(delay(200));
  }

  /**
   * Update personal information
   * Updates user's basic profile information
   * 
   * @param personalData - Updated personal information
   * @returns Observable<User> Updated user object
   */
  updatePersonalInfo(personalData: Partial<User>): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const updatedUser = { ...currentUser, ...personalData };
    this._currentUser.set(updatedUser);
    this.currentUserSubject.next(updatedUser);

    return of(updatedUser).pipe(delay(300));
  }

  /**
   * Update user preferences (language, currency, theme)
   * 
   * @param preferenceData - Updated preference data
   * @returns Observable<User> Updated user object
   */
  updatePreferences(preferenceData: {
    preferredLanguage?: 'en' | 'ar';
    preferredCurrency?: 'SYP' | 'USD' | 'EUR';
    theme?: 'light' | 'dark' | 'auto';
  }): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const updatedPreferences: UserPreferences = {
      notifications: currentUser.preferences?.notifications || {
        orderUpdates: true,
        promotions: true,
        newsletter: true,
        sms: false,
        push: true
      },
      privacy: currentUser.preferences?.privacy || {
        profileVisibility: 'public',
        showReviews: true,
        showPurchaseHistory: false,
        dataCollection: true,
        analyticsOptOut: false
      },
      theme: preferenceData.theme || currentUser.preferences?.theme || 'light',
      twoFactorAuth: currentUser.preferences?.twoFactorAuth || false
    };

    const updatedUser = {
      ...currentUser,
      preferredLanguage: preferenceData.preferredLanguage || currentUser.preferredLanguage,
      preferredCurrency: preferenceData.preferredCurrency || currentUser.preferredCurrency,
      preferences: updatedPreferences
    };

    this._currentUser.set(updatedUser);
    this.currentUserSubject.next(updatedUser);

    // Update language signal if changed
    if (preferenceData.preferredLanguage) {
      this._preferredLanguage.set(preferenceData.preferredLanguage);
    }

    return of(updatedUser).pipe(delay(300));
  }

  /**
   * Update notification preferences
   * 
   * @param notificationData - Updated notification preferences
   * @returns Observable<User> Updated user object
   */
  updateNotificationPreferences(notificationData: NotificationPreferences): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const updatedPreferences: UserPreferences = {
      notifications: notificationData,
      privacy: currentUser.preferences?.privacy || {
        profileVisibility: 'public',
        showReviews: true,
        showPurchaseHistory: false,
        dataCollection: true,
        analyticsOptOut: false
      },
      theme: currentUser.preferences?.theme || 'light',
      twoFactorAuth: currentUser.preferences?.twoFactorAuth || false
    };

    const updatedUser = {
      ...currentUser,
      preferences: updatedPreferences
    };

    this._currentUser.set(updatedUser);
    this.currentUserSubject.next(updatedUser);

    return of(updatedUser).pipe(delay(300));
  }

  /**
   * Change user password
   * 
   * @param passwordData - Current and new password
   * @returns Observable<boolean> Success status
   */
  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<boolean> {
    // Simulate password validation and update
    // In real implementation, this would make secure API call
    
    if (passwordData.currentPassword === 'wrongpassword') {
      throw new Error('Current password is incorrect');
    }

    return of(true).pipe(delay(500));
  }

  /**
   * Update two-factor authentication status
   * 
   * @param enabled - Whether 2FA should be enabled
   * @returns Observable<User> Updated user object
   */
  updateTwoFactorAuth(enabled: boolean): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const updatedPreferences: UserPreferences = {
      notifications: currentUser.preferences?.notifications || {
        orderUpdates: true,
        promotions: true,
        newsletter: true,
        sms: false,
        push: true
      },
      privacy: currentUser.preferences?.privacy || {
        profileVisibility: 'public',
        showReviews: true,
        showPurchaseHistory: false,
        dataCollection: true,
        analyticsOptOut: false
      },
      theme: currentUser.preferences?.theme || 'light',
      twoFactorAuth: enabled
    };

    const updatedUser = {
      ...currentUser,
      preferences: updatedPreferences
    };

    this._currentUser.set(updatedUser);
    this.currentUserSubject.next(updatedUser);

    return of(updatedUser).pipe(delay(400));
  }

  /**
   * Update privacy settings
   * 
   * @param privacyData - Updated privacy settings
   * @returns Observable<User> Updated user object
   */
  updatePrivacySettings(privacyData: PrivacySettings): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const updatedPreferences: UserPreferences = {
      notifications: currentUser.preferences?.notifications || {
        orderUpdates: true,
        promotions: true,
        newsletter: true,
        sms: false,
        push: true
      },
      privacy: privacyData,
      theme: currentUser.preferences?.theme || 'light',
      twoFactorAuth: currentUser.preferences?.twoFactorAuth || false
    };

    const updatedUser = {
      ...currentUser,
      preferences: updatedPreferences
    };

    this._currentUser.set(updatedUser);
    this.currentUserSubject.next(updatedUser);

    return of(updatedUser).pipe(delay(300));
  }

  /**
   * Upload and update profile picture
   * 
   * @param file - Selected image file
   * @returns Observable<User> Updated user object with new profile picture
   */
  uploadProfilePicture(file: File): Observable<User> {
    const currentUser = this._currentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    // Simulate file upload and return updated user
    // In real implementation, this would upload to cloud storage
    const mockImageUrl = `https://i.pravatar.cc/150?u=${Date.now()}`;

    const updatedUser = {
      ...currentUser,
      profilePicture: mockImageUrl
    };

    this._currentUser.set(updatedUser);
    this.currentUserSubject.next(updatedUser);

    return of(updatedUser).pipe(delay(800)); // Simulate upload time
  }

  /**
   * Logout user
   * Clears user state and redirects to homepage
   */
  logout(): Observable<boolean> {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.currentUserSubject.next(null);
    
    return of(true).pipe(delay(100));
  }

  /**
   * Get user's wishlist configuration
   * Returns complete wishlist with items, categories, and statistics
   * 
   * @returns Observable<WishlistConfig> Complete wishlist configuration
   */
  getWishlistConfig(): Observable<WishlistConfig> {
    // Mock Syrian marketplace wishlist items
    const mockWishlistItems: WishlistItem[] = [
      {
        id: 'wishlist_001',
        productId: 'prod_damascus_knife_001',
        nameEn: 'Premium Damascus Steel Chef Knife',
        nameAr: 'سكين طبخ دمشقي مميز',
        descriptionEn: 'Handcrafted Damascus steel chef knife with ergonomic handle',
        descriptionAr: 'سكين طبخ من الفولاذ الدمشقي المصنوع يدوياً بمقبض مريح',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
        ],
        price: 85000,
        originalPrice: 95000,
        priceUSD: 340,
        category: 'Damascus Steel',
        categorySlug: 'damascus-steel',
        productSlug: 'damascus-steel-chef-knife',
        isAvailable: true,
        isOnSale: true,
        stockQuantity: 12,
        priceHistory: [
          {
            price: 95000,
            priceUSD: 380,
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            priceChange: 0
          },
          {
            price: 85000,
            priceUSD: 340,
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            priceChange: -10.5
          }
        ],
        addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        craftOrigin: 'Damascus',
        artisanInfo: 'Master craftsman Abu Ahmad',
        culturalSignificance: 'Damascus steel represents centuries of Syrian metalworking tradition'
      },
      {
        id: 'wishlist_002',
        productId: 'prod_aleppo_soap_001',
        nameEn: 'Premium Aleppo Laurel Soap',
        nameAr: 'صابون الغار الحلبي الفاخر',
        descriptionEn: 'Traditional Aleppo soap with 40% laurel oil, handmade using ancient methods',
        descriptionAr: 'صابون حلبي تقليدي بزيت الغار 40% مصنوع يدوياً بالطرق القديمة',
        image: 'https://images.unsplash.com/photo-1609798926022-e005b80b2fc0?w=400&h=300&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1609798926022-e005b80b2fc0?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1556228578-dd527c518e44?w=400&h=300&fit=crop'
        ],
        price: 2500,
        priceUSD: 10,
        category: 'Beauty & Wellness',
        categorySlug: 'beauty-wellness',
        productSlug: 'premium-aleppo-laurel-soap',
        isAvailable: true,
        isOnSale: false,
        stockQuantity: 45,
        priceHistory: [
          {
            price: 2500,
            priceUSD: 10,
            timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            priceChange: 0
          }
        ],
        addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        craftOrigin: 'Aleppo',
        artisanInfo: 'Traditional soap makers family',
        culturalSignificance: 'Aleppo soap has been made for over 3,000 years using traditional methods'
      },
      {
        id: 'wishlist_003',
        productId: 'prod_brocade_fabric_001',
        nameEn: 'Syrian Brocade Fabric - Gold Pattern',
        nameAr: 'قماش البروكار السوري - نقشة ذهبية',
        descriptionEn: 'Luxurious Syrian brocade fabric with intricate gold threading',
        descriptionAr: 'قماش بروكار سوري فاخر بخيوط ذهبية معقدة',
        image: 'https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=400&h=300&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1571064817181-905d5d951a6c?w=400&h=300&fit=crop'
        ],
        price: 45000,
        priceUSD: 180,
        category: 'Textiles & Fabrics',
        categorySlug: 'textiles-fabrics',
        productSlug: 'syrian-brocade-fabric-gold',
        isAvailable: false,
        isOnSale: false,
        stockQuantity: 0,
        priceHistory: [
          {
            price: 45000,
            priceUSD: 180,
            timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            priceChange: 0
          }
        ],
        addedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        craftOrigin: 'Damascus',
        culturalSignificance: 'Syrian brocade represents the pinnacle of traditional textile artistry'
      },
      {
        id: 'wishlist_004',
        productId: 'prod_seven_spice_001',
        nameEn: 'Damascus Seven Spice Mix',
        nameAr: 'بهار السبع دمشقي',
        descriptionEn: 'Traditional Syrian seven spice blend with cardamom, cinnamon, and cloves',
        descriptionAr: 'خلطة البهار السبع السورية التقليدية بالهيل والقرفة والقرنفل',
        image: 'https://images.unsplash.com/photo-1596040033229-a33a0d8c56e4?w=400&h=300&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1596040033229-a33a0d8c56e4?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1587132117651-3b14ed11b5d8?w=400&h=300&fit=crop'
        ],
        price: 1200,
        originalPrice: 1500,
        priceUSD: 5,
        category: 'Food & Spices',
        categorySlug: 'food-spices',
        productSlug: 'damascus-seven-spice-mix',
        isAvailable: true,
        isOnSale: true,
        stockQuantity: 8,
        priceHistory: [
          {
            price: 1500,
            priceUSD: 6,
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            priceChange: 0
          },
          {
            price: 1200,
            priceUSD: 5,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            priceChange: -20
          }
        ],
        addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        craftOrigin: 'Damascus',
        culturalSignificance: 'Essential spice blend used in traditional Syrian cuisine for centuries'
      }
    ];

    const config: WishlistConfig = {
      wishlistItems: mockWishlistItems,
      totalItems: mockWishlistItems.length,
      categories: [
        'Damascus Steel',
        'Beauty & Wellness', 
        'Textiles & Fabrics',
        'Food & Spices',
        'Traditional Crafts',
        'Jewelry & Accessories'
      ],
      priceDropAlerts: mockWishlistItems.filter(item => 
        item.priceHistory.length > 1 && 
        item.priceHistory[item.priceHistory.length - 1].priceChange! < -5
      ).length,
      stockAlerts: mockWishlistItems.filter(item => !item.isAvailable || item.stockQuantity === 0).length
    };

    return of(config).pipe(delay(400));
  }

  /**
   * Add product to shopping cart with quantity
   * 
   * @param productId - ID of the product to add to cart
   * @param quantity - Quantity to add
   * @returns Observable<boolean> Success status
   */
  addToCart(productId: string, quantity: number = 1): Observable<boolean> {
    // Simulate API call to add item to cart
    console.log('Adding product to cart:', productId, 'Quantity:', quantity);
    return of(true).pipe(delay(300));
  }

  /**
   * Add multiple products to shopping cart
   * 
   * @param items - Array of items with productId and quantity
   * @returns Observable<boolean> Success status
   */
  addMultipleToCart(items: Array<{productId: string; quantity: number}>): Observable<boolean> {
    // Simulate API call to add multiple items to cart
    console.log('Adding multiple products to cart:', items);
    return of(true).pipe(delay(500));
  }

  /**
   * Remove item from wishlist
   * 
   * @param wishlistItemId - ID of the wishlist item to remove
   * @returns Observable<boolean> Success status
   */
  removeFromWishlist(wishlistItemId: string): Observable<boolean> {
    // Simulate API call to remove item from wishlist
    console.log('Removing item from wishlist:', wishlistItemId);
    return of(true).pipe(delay(200));
  }

  /**
   * Remove multiple items from wishlist
   * 
   * @param wishlistItemIds - Array of wishlist item IDs to remove
   * @returns Observable<boolean> Success status
   */
  removeMultipleFromWishlist(wishlistItemIds: string[]): Observable<boolean> {
    // Simulate API call to remove multiple items from wishlist
    console.log('Removing multiple items from wishlist:', wishlistItemIds);
    return of(true).pipe(delay(400));
  }

  /**
   * Add product to wishlist
   * 
   * @param productId - ID of the product to add to wishlist
   * @returns Observable<boolean> Success status
   */
  addToWishlist(productId: string): Observable<boolean> {
    // Simulate API call to add item to wishlist
    console.log('Adding product to wishlist:', productId);
    return of(true).pipe(delay(300));
  }

  /**
   * Toggle wishlist status for a product
   * 
   * @param productId - ID of the product to toggle wishlist status
   * @returns Observable<boolean> New wishlist status (true if added, false if removed)
   */
  toggleWishlist(productId: string): Observable<boolean> {
    // Simulate API call to toggle wishlist status
    console.log('Toggling wishlist status for product:', productId);
    // For demo purposes, randomly return true or false
    const isAdded = Math.random() > 0.5;
    return of(isAdded).pipe(delay(250));
  }

  /**
   * Check if product is in user's wishlist
   * 
   * @param productId - ID of the product to check
   * @returns Observable<boolean> Whether product is in wishlist
   */
  isInWishlist(productId: string): Observable<boolean> {
    // Simulate API call to check wishlist status
    // For demo purposes, return true for some specific products
    const wishlistedProducts = [
      'prod_damascus_knife_001',
      'prod_aleppo_soap_001',
      'prod_brocade_fabric_001',
      'prod_seven_spice_001'
    ];
    
    const isWishlisted = wishlistedProducts.includes(productId);
    return of(isWishlisted).pipe(delay(150));
  }

  /**
   * Get wishlist items count
   * 
   * @returns Observable<number> Number of items in wishlist
   */
  getWishlistCount(): Observable<number> {
    // Return current wishlist count from mock data
    return of(4).pipe(delay(100));
  }

  /**
   * Enable price drop notifications for wishlist item
   * 
   * @param wishlistItemId - ID of the wishlist item
   * @param enabled - Whether to enable or disable notifications
   * @returns Observable<boolean> Success status
   */
  togglePriceDropNotification(wishlistItemId: string, enabled: boolean): Observable<boolean> {
    console.log('Toggling price drop notification for item:', wishlistItemId, enabled);
    return of(true).pipe(delay(200));
  }

  /**
   * Share wishlist with others
   * 
   * @param shareData - Sharing configuration (email, message, etc.)
   * @returns Observable<boolean> Success status
   */
  shareWishlist(shareData: { email?: string; message?: string; platform?: string }): Observable<boolean> {
    console.log('Sharing wishlist:', shareData);
    return of(true).pipe(delay(300));
  }

  /**
   * Export wishlist to PDF or other formats
   * 
   * @param format - Export format ('pdf', 'csv', 'json')
   * @returns Observable<Blob> Exported file as blob
   */
  exportWishlist(format: 'pdf' | 'csv' | 'json'): Observable<Blob> {
    // Simulate file generation
    console.log('Exporting wishlist to format:', format);
    const mockData = JSON.stringify({ wishlist: 'mock data' });
    const blob = new Blob([mockData], { type: 'application/json' });
    return of(blob).pipe(delay(800));
  }

  /**
   * Get current user ID
   * 
   * @returns string Current user ID or empty string
   */
  getCurrentUserId(): string {
    return this._currentUser()?.id || '';
  }

  // ==============================================
  // ORDER HISTORY & TRACKING METHODS
  // ==============================================

  /**
   * Get user's order history configuration
   * Returns complete order history with statistics and filtering options
   * 
   * @returns Observable<OrderHistoryConfig> Complete order history configuration
   */
  getOrderHistoryConfig(): Observable<OrderHistoryConfig> {
    const mockOrders = this.generateMockOrders();
    
    const config: OrderHistoryConfig = {
      orders: mockOrders,
      totalOrders: mockOrders.length,
      totalSpent: mockOrders.reduce((sum, order) => sum + order.total, 0),
      totalSpentUSD: mockOrders.reduce((sum, order) => sum + order.totalUSD, 0),
      ordersByStatus: this.groupOrdersByStatus(mockOrders),
      recentDeliveries: mockOrders.filter(order => 
        order.status === 'delivered' && 
        this.isWithinDays(order.updatedAt, 30)
      ).length,
      pendingOrders: mockOrders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'in_transit_domestic', 'in_transit_international'].includes(order.status)
      ).length,
      favoriteProducts: ['damascus-steel-chef-knife', 'premium-aleppo-laurel-soap', 'syrian-brocade-fabric-gold']
    };

    return of(config).pipe(delay(600));
  }

  /**
   * Get filtered and sorted orders
   * 
   * @param filters - Filter and sort criteria
   * @returns Observable<Order[]> Filtered orders
   */
  getFilteredOrders(filters: OrderHistoryFilters): Observable<Order[]> {
    let orders = this.generateMockOrders();

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      orders = orders.filter(order => filters.status!.includes(order.status));
    }

    // Apply date range filter
    if (filters.dateRange) {
      orders = orders.filter(order => 
        order.placedAt >= filters.dateRange!.startDate &&
        order.placedAt <= filters.dateRange!.endDate
      );
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      orders = orders.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(item => 
          item.nameEn.toLowerCase().includes(query) ||
          item.nameAr.toLowerCase().includes(query)
        )
      );
    }

    // Apply sorting
    orders = this.sortOrders(orders, filters.sortBy);

    // Apply pagination
    const startIndex = (filters.currentPage - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    orders = orders.slice(startIndex, endIndex);

    return of(orders).pipe(delay(400));
  }

  /**
   * Get detailed order information by ID
   * 
   * @param orderId - Order identifier
   * @returns Observable<Order | null> Order details or null if not found
   */
  getOrderDetails(orderId: string): Observable<Order | null> {
    const orders = this.generateMockOrders();
    const order = orders.find(o => o.id === orderId) || null;
    return of(order).pipe(delay(300));
  }

  /**
   * Cancel an order (if allowed)
   * 
   * @param orderId - Order identifier
   * @param reason - Cancellation reason
   * @returns Observable<boolean> Success status
   */
  cancelOrder(orderId: string, reason?: string): Observable<boolean> {
    console.log('Cancelling order:', orderId, 'Reason:', reason);
    return of(true).pipe(delay(500));
  }

  /**
   * Request order return/exchange
   * 
   * @param orderId - Order identifier
   * @param itemIds - Items to return/exchange
   * @param reason - Return reason
   * @param requestType - 'return' or 'exchange'
   * @returns Observable<boolean> Success status
   */
  requestReturn(
    orderId: string, 
    itemIds: string[], 
    reason: string, 
    requestType: 'return' | 'exchange'
  ): Observable<boolean> {
    console.log('Requesting', requestType, 'for order:', orderId, 'Items:', itemIds, 'Reason:', reason);
    return of(true).pipe(delay(600));
  }

  /**
   * Reorder items from previous order
   * 
   * @param orderId - Original order identifier
   * @param itemIds - Optional specific items to reorder (all if not provided)
   * @returns Observable<boolean> Success status
   */
  reorderItems(orderId: string, itemIds?: string[]): Observable<boolean> {
    console.log('Reordering items from order:', orderId, 'Items:', itemIds);
    return of(true).pipe(delay(400));
  }

  /**
   * Download order invoice
   * 
   * @param orderId - Order identifier
   * @param language - Invoice language ('en' | 'ar')
   * @returns Observable<Blob> PDF invoice as blob
   */
  downloadInvoice(orderId: string, language: 'en' | 'ar' = 'ar'): Observable<Blob> {
    console.log('Downloading invoice for order:', orderId, 'Language:', language);
    const mockPdfData = `Invoice for order ${orderId} in ${language}`;
    const blob = new Blob([mockPdfData], { type: 'application/pdf' });
    return of(blob).pipe(delay(800));
  }

  /**
   * Leave review for ordered product
   * 
   * @param orderId - Order identifier
   * @param productId - Product identifier
   * @param reviewData - Review data (rating, comment, etc.)
   * @returns Observable<boolean> Success status
   */
  leaveProductReview(
    orderId: string, 
    productId: string, 
    reviewData: { rating: number; comment: string; language: 'en' | 'ar' }
  ): Observable<boolean> {
    console.log('Leaving review for product:', productId, 'Order:', orderId, reviewData);
    return of(true).pipe(delay(500));
  }

  /**
   * Export order history
   * 
   * @param format - Export format ('pdf', 'csv', 'json')
   * @param filters - Optional filters to apply
   * @returns Observable<Blob> Exported file as blob
   */
  exportOrderHistory(format: 'pdf' | 'csv' | 'json', filters?: OrderHistoryFilters): Observable<Blob> {
    console.log('Exporting order history to format:', format, 'Filters:', filters);
    const mockData = JSON.stringify({ orderHistory: 'mock data' });
    const blob = new Blob([mockData], { type: 'application/json' });
    return of(blob).pipe(delay(1000));
  }

  // ==============================================
  // PRIVATE HELPER METHODS FOR ORDER HISTORY
  // ==============================================

  /**
   * Generate mock orders for development
   * Creates realistic Syrian marketplace orders with tracking
   */
  private generateMockOrders(): Order[] {
    const currentDate = new Date();
    
    return [
      {
        id: 'order_001',
        orderNumber: 'SQ-2024-001234',
        userId: 'user_syria_001',
        status: 'delivered',
        items: [
          {
            id: 'item_001',
            productId: 'damascus-steel-chef-knife',
            nameEn: 'Damascus Steel Chef Knife',
            nameAr: 'سكين طبخ من فولاذ دمشق',
            image: '/assets/products/damascus-knife.jpg',
            quantity: 1,
            unitPrice: 450000,
            unitPriceUSD: 180,
            totalPrice: 450000,
            totalPriceUSD: 180,
            productSlug: 'damascus-steel-chef-knife',
            craftOrigin: 'Damascus',
            artisanInfo: 'Master Ahmed Al-Hadad'
          },
          {
            id: 'item_002',
            productId: 'premium-aleppo-laurel-soap',
            nameEn: 'Premium Aleppo Laurel Soap',
            nameAr: 'صابون الغار الحلبي الفاخر',
            image: '/assets/products/aleppo-soap.jpg',
            quantity: 3,
            unitPrice: 75000,
            unitPriceUSD: 30,
            totalPrice: 225000,
            totalPriceUSD: 90,
            productSlug: 'premium-aleppo-laurel-soap',
            craftOrigin: 'Aleppo',
            artisanInfo: 'Aleppo Soap Co-op'
          }
        ],
        subtotal: 675000,
        subtotalUSD: 270,
        shippingCost: 125000,
        shippingCostUSD: 50,
        tax: 67500,
        taxUSD: 27,
        total: 867500,
        totalUSD: 347,
        currency: 'SYP',
        paymentMethod: 'Credit Card',
        paymentStatus: 'completed',
        shippingAddress: {
          id: 'addr_001',
          recipientName: 'Ahmad Al-Dimashqi',
          recipientPhone: '+971-50-123-4567',
          addressLine1: 'Sheikh Zayed Road, Building 123',
          addressLine2: 'Apartment 4B',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '12345',
          country: 'United Arab Emirates',
          countryCode: 'AE',
          isDefault: true
        },
        tracking: this.generateMockTracking('delivered'),
        trackingNumber: 'DHL1234567890',
        estimatedDelivery: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        placedAt: new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Handle with care - artisan products',
        isGift: false,
        canCancel: false,
        canReturn: true,
        returnWindow: 30
      },
      {
        id: 'order_002',
        orderNumber: 'SQ-2024-001235',
        userId: 'user_syria_001',
        status: 'in_transit_international',
        items: [
          {
            id: 'item_003',
            productId: 'syrian-brocade-fabric-gold',
            nameEn: 'Syrian Brocade Fabric - Gold Pattern',
            nameAr: 'نسيج الديباج السوري - نقشة ذهبية',
            image: '/assets/products/brocade-fabric.jpg',
            quantity: 2,
            unitPrice: 320000,
            unitPriceUSD: 128,
            totalPrice: 640000,
            totalPriceUSD: 256,
            productSlug: 'syrian-brocade-fabric-gold',
            craftOrigin: 'Damascus',
            artisanInfo: 'Al-Sharq Textile Workshop'
          }
        ],
        subtotal: 640000,
        subtotalUSD: 256,
        shippingCost: 150000,
        shippingCostUSD: 60,
        tax: 64000,
        taxUSD: 26,
        total: 854000,
        totalUSD: 342,
        currency: 'SYP',
        paymentMethod: 'PayPal',
        paymentStatus: 'completed',
        shippingAddress: {
          id: 'addr_001',
          recipientName: 'Ahmad Al-Dimashqi',
          recipientPhone: '+971-50-123-4567',
          addressLine1: 'Sheikh Zayed Road, Building 123',
          addressLine2: 'Apartment 4B',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '12345',
          country: 'United Arab Emirates',
          countryCode: 'AE',
          isDefault: true
        },
        tracking: this.generateMockTracking('in_transit_international'),
        trackingNumber: 'FDX9876543210',
        estimatedDelivery: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        placedAt: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        isGift: true,
        giftMessage: 'Traditional Syrian craftsmanship for special occasions',
        canCancel: false,
        canReturn: true,
        returnWindow: 30
      },
      {
        id: 'order_003',
        orderNumber: 'SQ-2024-001236',
        userId: 'user_syria_001',
        status: 'preparing',
        items: [
          {
            id: 'item_004',
            productId: 'assorted-syrian-baklava-gift-box',
            nameEn: 'Assorted Syrian Baklava Gift Box',
            nameAr: 'علبة هدايا البقلاوة السورية المشكلة',
            image: '/assets/products/baklava-box.jpg',
            quantity: 1,
            unitPrice: 180000,
            unitPriceUSD: 72,
            totalPrice: 180000,
            totalPriceUSD: 72,
            productSlug: 'assorted-syrian-baklava-gift-box',
            craftOrigin: 'Damascus',
            artisanInfo: 'Damascus Sweets House'
          },
          {
            id: 'item_005',
            productId: 'premium-aleppo-pistachios',
            nameEn: 'Premium Aleppo Pistachios',
            nameAr: 'فستق حلبي فاخر',
            image: '/assets/products/aleppo-pistachios.jpg',
            quantity: 2,
            unitPrice: 125000,
            unitPriceUSD: 50,
            totalPrice: 250000,
            totalPriceUSD: 100,
            productSlug: 'premium-aleppo-pistachios',
            craftOrigin: 'Aleppo',
            artisanInfo: 'Aleppo Nut Cooperative'
          }
        ],
        subtotal: 430000,
        subtotalUSD: 172,
        shippingCost: 100000,
        shippingCostUSD: 40,
        tax: 43000,
        taxUSD: 17,
        total: 573000,
        totalUSD: 229,
        currency: 'SYP',
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'completed',
        shippingAddress: {
          id: 'addr_001',
          recipientName: 'Ahmad Al-Dimashqi',
          recipientPhone: '+971-50-123-4567',
          addressLine1: 'Sheikh Zayed Road, Building 123',
          addressLine2: 'Apartment 4B',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '12345',
          country: 'United Arab Emirates',
          countryCode: 'AE',
          isDefault: true
        },
        tracking: this.generateMockTracking('preparing'),
        estimatedDelivery: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000),
        placedAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Rush order for special occasion',
        isGift: false,
        canCancel: true,
        canReturn: true,
        returnWindow: 30
      }
    ];
  }

  /**
   * Generate mock tracking events for order status
   */
  private generateMockTracking(currentStatus: OrderStatus): OrderTrackingEvent[] {
    const baseEvents: OrderTrackingEvent[] = [
      {
        id: 'track_001',
        status: 'pending',
        titleEn: 'Order Placed',
        titleAr: 'تم تقديم الطلب',
        descriptionEn: 'Your order has been received and is being processed',
        descriptionAr: 'تم استلام طلبك وهو قيد المعالجة',
        location: 'SouqSyria Damascus',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        isCompleted: true
      },
      {
        id: 'track_002',
        status: 'confirmed',
        titleEn: 'Order Confirmed',
        titleAr: 'تم تأكيد الطلب',
        descriptionEn: 'Payment processed successfully, order confirmed',
        descriptionAr: 'تم معالجة الدفع بنجاح، تم تأكيد الطلب',
        location: 'SouqSyria Damascus',
        timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        isCompleted: true
      }
    ];

    // Add status-specific events
    switch (currentStatus) {
      case 'preparing':
        baseEvents.push({
          id: 'track_003',
          status: 'preparing',
          titleEn: 'Preparing Order',
          titleAr: 'تحضير الطلب',
          descriptionEn: 'Your items are being carefully prepared by our artisans',
          descriptionAr: 'يتم تحضير طلبك بعناية من قبل حرفيينا',
          location: 'Damascus Workshop',
          isCompleted: false,
          estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        });
        break;
      
      case 'in_transit_international':
        baseEvents.push(
          {
            id: 'track_003',
            status: 'preparing',
            titleEn: 'Order Prepared',
            titleAr: 'تم تحضير الطلب',
            descriptionEn: 'Items prepared and packaged',
            descriptionAr: 'تم تحضير وتغليف المنتجات',
            location: 'Damascus Workshop',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            isCompleted: true
          },
          {
            id: 'track_004',
            status: 'in_transit_domestic',
            titleEn: 'In Transit (Domestic)',
            titleAr: 'في الطريق (محلي)',
            descriptionEn: 'Package is in transit within Syria',
            descriptionAr: 'الطرد في الطريق داخل سوريا',
            location: 'Damascus to Latakia',
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            isCompleted: true
          },
          {
            id: 'track_005',
            status: 'in_transit_international',
            titleEn: 'International Transit',
            titleAr: 'في الطريق دولياً',
            descriptionEn: 'Package has left Syria and is in international transit',
            descriptionAr: 'غادر الطرد سوريا وهو في الطريق دولياً',
            location: 'International Shipping Hub',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isCompleted: false,
            estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        );
        break;
      
      case 'delivered':
        // Add full delivery chain
        baseEvents.push(
          {
            id: 'track_003',
            status: 'preparing',
            titleEn: 'Order Prepared',
            titleAr: 'تم تحضير الطلب',
            descriptionEn: 'Items prepared and packaged',
            descriptionAr: 'تم تحضير وتغليف المنتجات',
            location: 'Damascus Workshop',
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            isCompleted: true
          },
          {
            id: 'track_004',
            status: 'in_transit_international',
            titleEn: 'International Shipping',
            titleAr: 'الشحن الدولي',
            descriptionEn: 'Package is being shipped internationally',
            descriptionAr: 'يتم شحن الطرد دولياً',
            location: 'Damascus to Dubai',
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            isCompleted: true
          },
          {
            id: 'track_005',
            status: 'out_for_delivery',
            titleEn: 'Out for Delivery',
            titleAr: 'خرج للتوصيل',
            descriptionEn: 'Package is out for final delivery',
            descriptionAr: 'الطرد خرج للتوصيل النهائي',
            location: 'Dubai Distribution Center',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            isCompleted: true
          },
          {
            id: 'track_006',
            status: 'delivered',
            titleEn: 'Delivered',
            titleAr: 'تم التوصيل',
            descriptionEn: 'Package successfully delivered',
            descriptionAr: 'تم توصيل الطرد بنجاح',
            location: 'Dubai, UAE',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isCompleted: true
          }
        );
        break;
    }

    return baseEvents;
  }

  /**
   * Group orders by status for statistics
   */
  private groupOrdersByStatus(orders: Order[]): { [key in OrderStatus]?: number } {
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as { [key in OrderStatus]?: number });
  }

  /**
   * Sort orders based on criteria
   */
  private sortOrders(orders: Order[], sortBy: string): Order[] {
    return [...orders].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.placedAt.getTime() - a.placedAt.getTime();
        case 'oldest':
          return a.placedAt.getTime() - b.placedAt.getTime();
        case 'amount_high':
          return b.total - a.total;
        case 'amount_low':
          return a.total - b.total;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }

  /**
   * Check if date is within specified number of days
   */
  private isWithinDays(date: Date, days: number): boolean {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  // ===== ADDRESS BOOK MANAGEMENT METHODS =====

  /**
   * Get user's address book configuration with all saved addresses
   * Includes statistics and organization data for comprehensive address management
   * 
   * @returns Observable<AddressBookConfig> Complete address book configuration
   * 
   * @swagger
   * /api/user/address-book:
   *   get:
   *     tags: [Address Management]
   *     summary: Get user address book
   *     description: Retrieve complete address book with addresses and statistics
   *     responses:
   *       200:
   *         description: Address book retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AddressBookConfig'
   */
  getAddressBookConfig(): Observable<AddressBookConfig> {
    // Mock address data for Syrian marketplace
    const mockAddresses: UserAddress[] = [
      {
        id: 'addr_001',
        userId: 'user_syria_001',
        type: 'home',
        titleEn: 'Home Address',
        titleAr: 'عنوان المنزل',
        recipientName: 'Ahmad Al-Dimashqi',
        recipientNameAr: 'أحمد الدمشقي',
        phoneNumber: '+963944123456',
        alternatePhone: '+963911987654',
        addressLine1: 'Al-Mazzeh Street, Building 15, Apartment 3',
        addressLine1Ar: 'شارع المزة، بناء 15، شقة 3',
        addressLine2: 'Near Al-Mazzeh Mosque',
        addressLine2Ar: 'قرب جامع المزة',
        neighborhood: 'Al-Mazzeh',
        neighborhoodAr: 'المزة',
        city: 'Damascus',
        cityAr: 'دمشق',
        governorate: 'Damascus',
        postalCode: '11111',
        country: 'Syria',
        countryCode: 'SY',
        isDefault: true,
        isDefaultBilling: true,
        isActive: true,
        instructions: 'Ring the bell twice, blue door on the right',
        instructionsAr: 'اضغط الجرس مرتين، الباب الأزرق على اليمين',
        landmark: 'Next to Al-Mazzeh Park',
        landmarkAr: 'بجانب حديقة المزة',
        coordinates: {
          latitude: 33.5024,
          longitude: 36.2813,
          accuracy: 10
        },
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isVerified: true,
        verifiedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'addr_002',
        userId: 'user_syria_001',
        type: 'work',
        titleEn: 'Office',
        titleAr: 'المكتب',
        recipientName: 'Ahmad Al-Dimashqi',
        recipientNameAr: 'أحمد الدمشقي',
        phoneNumber: '+963944123456',
        addressLine1: 'Souq Al-Hamidiyah, Shop 42',
        addressLine1Ar: 'سوق الحميدية، محل 42',
        addressLine2: 'Traditional Crafts Section',
        addressLine2Ar: 'قسم الحرف التقليدية',
        neighborhood: 'Old City',
        neighborhoodAr: 'البلدة القديمة',
        city: 'Damascus',
        cityAr: 'دمشق',
        governorate: 'Damascus',
        postalCode: '11112',
        country: 'Syria',
        countryCode: 'SY',
        isDefault: false,
        isDefaultBilling: false,
        isActive: true,
        instructions: 'Enter from the main gate, follow the traditional market path',
        instructionsAr: 'ادخل من البوابة الرئيسية، اتبع مسار السوق التقليدي',
        landmark: 'Near Umayyad Mosque entrance',
        landmarkAr: 'قرب مدخل الجامع الأموي',
        coordinates: {
          latitude: 33.5114,
          longitude: 36.3067,
          accuracy: 15
        },
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        isVerified: true,
        verifiedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'addr_003',
        userId: 'user_syria_001',
        type: 'family',
        titleEn: 'Parents House',
        titleAr: 'بيت الوالدين',
        recipientName: 'Mohammed Al-Dimashqi',
        recipientNameAr: 'محمد الدمشقي',
        phoneNumber: '+963933987654',
        addressLine1: 'Bab Touma Street, House 28',
        addressLine1Ar: 'شارع باب توما، بيت 28',
        addressLine2: 'Second floor, wooden door',
        addressLine2Ar: 'الطابق الثاني، باب خشبي',
        neighborhood: 'Bab Touma',
        neighborhoodAr: 'باب توما',
        city: 'Damascus',
        cityAr: 'دمشق',
        governorate: 'Damascus',
        postalCode: '11113',
        country: 'Syria',
        countryCode: 'SY',
        isDefault: false,
        isDefaultBilling: false,
        isActive: true,
        instructions: 'Ask for Abu Ahmad, traditional stone house',
        instructionsAr: 'اسأل عن أبو أحمد، البيت الحجري التقليدي',
        landmark: 'Opposite St. Ananias Chapel',
        landmarkAr: 'مقابل كنيسة حنانيا',
        coordinates: {
          latitude: 33.5138,
          longitude: 36.3089,
          accuracy: 20
        },
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        isVerified: false
      }
    ];

    const config: AddressBookConfig = {
      addresses: mockAddresses,
      totalAddresses: mockAddresses.length,
      defaultShippingId: 'addr_001',
      defaultBillingId: 'addr_001',
      recentlyUsed: ['addr_001', 'addr_002'],
      unverifiedCount: mockAddresses.filter(addr => !addr.isVerified).length,
      addressTypes: ['home', 'work', 'family', 'pickup_point', 'temporary']
    };

    return of(config).pipe(delay(400));
  }

  /**
   * Create a new address for the user
   * Validates address data and saves to user's address book
   * 
   * @param addressData - Address form data to create
   * @returns Observable<UserAddress> Created address with generated ID
   * 
   * @swagger
   * /api/user/addresses:
   *   post:
   *     tags: [Address Management]
   *     summary: Create new address
   *     description: Add new address to user's address book
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddressFormData'
   *     responses:
   *       201:
   *         description: Address created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserAddress'
   */
  createAddress(addressData: AddressFormData): Observable<UserAddress> {
    const newAddress: UserAddress = {
      id: `addr_${Date.now()}`,
      userId: this._currentUser()?.id || 'user_syria_001',
      type: addressData.type,
      titleEn: addressData.titleEn,
      titleAr: addressData.titleAr,
      recipientName: addressData.recipientName,
      recipientNameAr: addressData.recipientNameAr,
      phoneNumber: addressData.phoneNumber,
      alternatePhone: addressData.alternatePhone,
      addressLine1: addressData.addressLine1,
      addressLine1Ar: addressData.addressLine1Ar,
      addressLine2: addressData.addressLine2,
      addressLine2Ar: addressData.addressLine2Ar,
      neighborhood: addressData.neighborhood,
      neighborhoodAr: addressData.neighborhoodAr,
      city: addressData.city,
      cityAr: addressData.cityAr,
      governorate: addressData.governorate,
      postalCode: addressData.postalCode,
      country: addressData.country,
      countryCode: addressData.countryCode,
      isDefault: addressData.isDefault,
      isDefaultBilling: addressData.isDefaultBilling,
      isActive: true,
      instructions: addressData.instructions,
      instructionsAr: addressData.instructionsAr,
      landmark: addressData.landmark,
      landmarkAr: addressData.landmarkAr,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false
    };

    // Simulate API call
    return of(newAddress).pipe(delay(500));
  }

  /**
   * Update existing address
   * Modifies address data and maintains verification status
   * 
   * @param addressId - ID of address to update
   * @param addressData - Updated address form data
   * @returns Observable<UserAddress> Updated address data
   * 
   * @swagger
   * /api/user/addresses/{addressId}:
   *   put:
   *     tags: [Address Management]
   *     summary: Update address
   *     description: Modify existing address in user's address book
   *     parameters:
   *       - name: addressId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddressFormData'
   *     responses:
   *       200:
   *         description: Address updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserAddress'
   */
  updateAddress(addressId: string, addressData: AddressFormData): Observable<UserAddress> {
    const updatedAddress: UserAddress = {
      id: addressId,
      userId: this._currentUser()?.id || 'user_syria_001',
      type: addressData.type,
      titleEn: addressData.titleEn,
      titleAr: addressData.titleAr,
      recipientName: addressData.recipientName,
      recipientNameAr: addressData.recipientNameAr,
      phoneNumber: addressData.phoneNumber,
      alternatePhone: addressData.alternatePhone,
      addressLine1: addressData.addressLine1,
      addressLine1Ar: addressData.addressLine1Ar,
      addressLine2: addressData.addressLine2,
      addressLine2Ar: addressData.addressLine2Ar,
      neighborhood: addressData.neighborhood,
      neighborhoodAr: addressData.neighborhoodAr,
      city: addressData.city,
      cityAr: addressData.cityAr,
      governorate: addressData.governorate,
      postalCode: addressData.postalCode,
      country: addressData.country,
      countryCode: addressData.countryCode,
      isDefault: addressData.isDefault,
      isDefaultBilling: addressData.isDefaultBilling,
      isActive: true,
      instructions: addressData.instructions,
      instructionsAr: addressData.instructionsAr,
      landmark: addressData.landmark,
      landmarkAr: addressData.landmarkAr,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Mock created date
      updatedAt: new Date(),
      isVerified: true, // Assume existing addresses are verified
      verifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };

    // Simulate API call
    return of(updatedAddress).pipe(delay(400));
  }

  /**
   * Delete address from user's address book
   * Removes address and updates default settings if needed
   * 
   * @param addressId - ID of address to delete
   * @returns Observable<boolean> Deletion success status
   * 
   * @swagger
   * /api/user/addresses/{addressId}:
   *   delete:
   *     tags: [Address Management]
   *     summary: Delete address
   *     description: Remove address from user's address book
   *     parameters:
   *       - name: addressId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Address deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   */
  deleteAddress(addressId: string): Observable<boolean> {
    // Simulate API call with success
    return of(true).pipe(delay(300));
  }

  /**
   * Set address as default shipping address
   * Updates user's default shipping preference
   * 
   * @param addressId - ID of address to set as default
   * @returns Observable<boolean> Update success status
   */
  setDefaultShippingAddress(addressId: string): Observable<boolean> {
    // Simulate API call
    return of(true).pipe(delay(200));
  }

  /**
   * Set address as default billing address
   * Updates user's default billing preference
   * 
   * @param addressId - ID of address to set as default
   * @returns Observable<boolean> Update success status
   */
  setDefaultBillingAddress(addressId: string): Observable<boolean> {
    // Simulate API call
    return of(true).pipe(delay(200));
  }

  /**
   * Toggle address active status
   * Activates or deactivates address without deleting
   * 
   * @param addressId - ID of address to toggle
   * @returns Observable<boolean> Toggle success status
   */
  toggleAddressStatus(addressId: string): Observable<boolean> {
    // Simulate API call
    return of(true).pipe(delay(200));
  }

  /**
   * Validate address using Syrian postal system
   * Checks address format, postal codes, and provides suggestions
   * 
   * @param addressData - Address data to validate
   * @returns Observable<AddressValidationResult> Validation result with suggestions
   * 
   * @swagger
   * /api/user/addresses/validate:
   *   post:
   *     tags: [Address Management]
   *     summary: Validate address
   *     description: Validate address format and Syrian postal requirements
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddressFormData'
   *     responses:
   *       200:
   *         description: Address validation completed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AddressValidationResult'
   */
  validateAddress(addressData: AddressFormData): Observable<AddressValidationResult> {
    // Mock validation logic for Syrian addresses
    const errors: Array<{field: string; messageEn: string; messageAr: string; severity: 'error' | 'warning'}> = [];
    const suggestions: Array<{field: string; originalValue: string; suggestedValue: string; confidence: number}> = [];

    // Check Syrian phone number format
    if (addressData.phoneNumber && !addressData.phoneNumber.match(/^\+963[0-9]{8,9}$/)) {
      errors.push({
        field: 'phoneNumber',
        messageEn: 'Phone number must be in Syrian format (+963XXXXXXXXX)',
        messageAr: 'يجب أن يكون رقم الهاتف بالصيغة السورية (+963XXXXXXXXX)',
        severity: 'error'
      });
    }

    // Check if governorate is valid
    if (addressData.governorate && !SYRIAN_GOVERNORATES.includes(addressData.governorate as any)) {
      errors.push({
        field: 'governorate',
        messageEn: 'Please select a valid Syrian governorate',
        messageAr: 'يرجى اختيار محافظة سورية صحيحة',
        severity: 'error'
      });
    }

    // Check postal code format (optional but if provided should be valid)
    if (addressData.postalCode && !addressData.postalCode.match(/^[0-9]{4,6}$/)) {
      errors.push({
        field: 'postalCode',
        messageEn: 'Postal code should be 4-6 digits',
        messageAr: 'الرمز البريدي يجب أن يكون 4-6 أرقام',
        severity: 'warning'
      });
    }

    // Generate suggestions based on common patterns
    if (addressData.city.toLowerCase().includes('damask')) {
      suggestions.push({
        field: 'city',
        originalValue: addressData.city,
        suggestedValue: 'Damascus',
        confidence: 0.9
      });
    }

    if (addressData.city.toLowerCase().includes('aleppo') || addressData.city.toLowerCase().includes('halep')) {
      suggestions.push({
        field: 'city',
        originalValue: addressData.city,
        suggestedValue: 'Aleppo',
        confidence: 0.9
      });
    }

    // Calculate estimated delivery days based on governorate
    let estimatedDeliveryDays = 3; // Default for Damascus
    switch (addressData.governorate) {
      case 'Damascus':
      case 'Damascus Countryside':
        estimatedDeliveryDays = 2;
        break;
      case 'Aleppo':
      case 'Homs':
      case 'Lattakia':
        estimatedDeliveryDays = 3;
        break;
      case 'Deir ez-Zor':
      case 'Ar-Raqqa':
      case 'Al-Hasakah':
        estimatedDeliveryDays = 5;
        break;
      default:
        estimatedDeliveryDays = 4;
    }

    const result: AddressValidationResult = {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      suggestions,
      postalCodeValid: !addressData.postalCode || /^[0-9]{4,6}$/.test(addressData.postalCode),
      coordinatesFound: true, // Mock GPS coordinates found
      estimatedDeliveryDays
    };

    // Simulate API delay
    return of(result).pipe(delay(1500));
  }

  /**
   * Get address by ID
   * Retrieves specific address from user's address book
   * 
   * @param addressId - ID of address to retrieve
   * @returns Observable<UserAddress | null> Address data or null if not found
   */
  getAddressById(addressId: string): Observable<UserAddress | null> {
    // This would normally fetch from the addresses returned by getAddressBookConfig
    // For mock purposes, return null and let the component handle
    return of(null).pipe(delay(200));
  }

  /**
   * Get addresses by type
   * Filters user's addresses by specific type
   * 
   * @param addressType - Type of addresses to retrieve
   * @returns Observable<UserAddress[]> Filtered addresses
   */
  getAddressesByType(addressType: AddressType): Observable<UserAddress[]> {
    return this.getAddressBookConfig().pipe(
      delay(300),
      map(config => config.addresses.filter(address => address.type === addressType))
    );
  }

  /**
   * Search addresses
   * Search through user's addresses by text query
   * 
   * @param query - Search query string
   * @returns Observable<UserAddress[]> Matching addresses
   */
  searchAddresses(query: string): Observable<UserAddress[]> {
    // Mock search functionality
    return of([]).pipe(delay(300));
  }
}