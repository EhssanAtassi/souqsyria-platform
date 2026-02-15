import { Component, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UserService } from '../../shared';
import {
  User,
  AccountDashboardConfig,
  AccountDashboardItem,
  UserStats,
  RecentActivity,
  Announcement
} from '../../shared/interfaces/user.interface';

/**
 * Enhanced Account Dashboard Component for Syrian Marketplace
 *
 * Comprehensive navigation hub for user profile management
 * Features Syrian marketplace cultural styling, bilingual support,
 * responsive layout, and enterprise-ready architecture
 *
 * @swagger
 * components:
 *   schemas:
 *     AccountDashboardComponent:
 *       type: object
 *       description: User account dashboard navigation hub
 *       properties:
 *         dashboardConfig:
 *           $ref: '#/components/schemas/AccountDashboardConfig'
 *         currentLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 */
@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './account-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './account-dashboard.component.scss'
})
export class AccountDashboardComponent implements OnInit {
  // Component state using signals
  private readonly dashboardConfigSignal = signal<AccountDashboardConfig | null>(null);
  private readonly isLoadingSignal = signal<boolean>(true);
  private readonly currentLanguageSignal = signal<'en' | 'ar'>('ar');

  // Public readonly signals for template
  readonly dashboardConfig = this.dashboardConfigSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  // Computed properties
  readonly getDisplayName = computed(() => {
    const user = this.dashboardConfig()?.user;
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  });

  constructor(private userService: UserService) {}

  /**
   * Component initialization
   * Loads dashboard configuration and sets up reactive state
   */
  ngOnInit(): void {
    this.loadDashboardData();
    this.initializeLanguage();
  }

  /**
   * Load dashboard configuration from user service
   * Handles loading state and error scenarios
   */
  private loadDashboardData(): void {
    this.isLoadingSignal.set(true);

    this.userService.getAccountDashboardConfig().subscribe({
      next: (config) => {
        this.dashboardConfigSignal.set(config);
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.isLoadingSignal.set(false);
      }
    });
  }

  /**
   * Initialize language based on user preference
   */
  private initializeLanguage(): void {
    const userLang = this.userService.preferredLanguage();
    this.currentLanguageSignal.set(userLang);
  }

  /**
   * Toggle between Arabic and English languages
   */
  toggleLanguage(): void {
    const currentLang = this.currentLanguageSignal();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';

    this.currentLanguageSignal.set(newLang);
    this.userService.updatePreferredLanguage(newLang).subscribe();
  }

  /**
   * Get appropriate greeting based on current language
   */
  getGreeting(): string {
    const lang = this.currentLanguageSignal();
    const hour = new Date().getHours();

    if (lang === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 18) return 'مساء الخير';
      return 'مساء الخير';
    } else {
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    }
  }

  /**
   * Get membership tier label in current language
   */
  getMembershipLabel(): string {
    const user = this.dashboardConfig()?.user;
    const lang = this.currentLanguageSignal();

    if (!user) return '';

    const labels = {
      'ar': {
        'bronze': 'برونزي',
        'silver': 'فضي',
        'gold': 'ذهبي',
        'platinum': 'بلاتيني'
      },
      'en': {
        'bronze': 'Bronze',
        'silver': 'Silver',
        'gold': 'Gold',
        'platinum': 'Platinum'
      }
    };

    return labels[lang][user.membershipTier] || user.membershipTier;
  }

  /**
   * Format currency in Syrian Pounds
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date based on current language locale
   */
  formatDate(date: Date): string {
    const lang = this.currentLanguageSignal();
    const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Get CSS class for tile color
   */
  getTileColorClass(color: string): string {
    const colorMap = {
      'primary': 'bg-blue-500',
      'accent': 'bg-pink-500',
      'warn': 'bg-red-500',
      'damascus-gold': 'bg-gradient-to-br from-yellow-400 to-amber-500',
      'aleppo-green': 'bg-gradient-to-br from-green-400 to-green-600'
    };

    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500';
  }

  /**
   * Get icon for activity type
   */
  getActivityIcon(type: string): string {
    const icons = {
      'order': 'shopping_bag',
      'review': 'star',
      'wishlist': 'favorite',
      'address': 'location_on',
      'profile': 'person'
    };

    return icons[type as keyof typeof icons] || 'info';
  }

  /**
   * Get CSS class for activity icon
   */
  getActivityIconClass(type: string): string {
    const classes = {
      'order': 'text-green-500',
      'review': 'text-yellow-500',
      'wishlist': 'text-pink-500',
      'address': 'text-blue-500',
      'profile': 'text-gray-500'
    };

    return classes[type as keyof typeof classes] || 'text-gray-400';
  }

  /**
   * Get CSS class for announcement type
   */
  getAnnouncementClass(type: string): string {
    const classes = {
      'info': 'bg-blue-50 text-blue-800 border border-blue-200',
      'warning': 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      'success': 'bg-green-50 text-green-800 border border-green-200',
      'promotion': 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border border-amber-200'
    };

    return classes[type as keyof typeof classes] || 'bg-gray-50 text-gray-800';
  }

  /**
   * Track by function for activities
   */
  trackByActivityId(index: number, activity: RecentActivity): string {
    return activity.id;
  }

  /**
   * Track by function for announcements
   */
  trackByAnnouncementId(index: number, announcement: Announcement): string {
    return announcement.id;
  }

  /**
   * @description Navigate to profile edit page
   * @returns {void}
   */
  editProfile(): void {
    // TODO: Wire up navigation to /account/profile/edit when ready
  }

  /**
   * @description Navigate to settings page
   * @returns {void}
   */
  viewSettings(): void {
    // TODO: Wire up navigation to /account/preferences when ready
  }

  /**
   * Logout user and redirect to homepage
   */
  logout(): void {
    this.userService.logout().subscribe({
      next: () => {
        // Navigate to homepage after logout
        window.location.href = '/';
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }
}
