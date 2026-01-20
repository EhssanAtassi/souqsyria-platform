import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { CartOfflineQueueService } from '../../../store/cart/cart-offline-queue.service';
import { QueueStatistics } from '../../interfaces/sync-queue.interface';

/**
 * Offline Banner Component
 *
 * Displays a banner at the top of the cart page indicating:
 * - Offline status
 * - Number of pending sync operations
 * - Sync progress during reconnection
 *
 * States:
 * - Online + No pending: Hidden
 * - Offline + Pending: Yellow warning banner
 * - Online + Syncing: Blue progress banner
 * - Sync success: Green success banner (auto-hide after 3s)
 * - Sync failed: Red error banner with retry button
 *
 * @example
 * <app-offline-banner />
 */
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offline-banner.component.html',
  styleUrls: ['./offline-banner.component.scss']
})
export class OfflineBannerComponent implements OnInit {
  private connectivityService = inject(ConnectivityService);
  private queueService = inject(CartOfflineQueueService);

  isOnline$: Observable<boolean> = this.connectivityService.isOnline$;
  queueStats$: Observable<QueueStatistics> = this.queueService.stats$;

  /**
   * Banner visibility and state
   */
  bannerState$: Observable<BannerState> = combineLatest([
    this.isOnline$,
    this.queueStats$
  ]).pipe(
    map(([isOnline, stats]) => {
      const hasPending = stats.pendingCount > 0;
      const isSyncing = stats.syncingCount > 0;
      const hasFailed = stats.failedCount > 0;

      if (!isOnline && hasPending) {
        return {
          show: true,
          type: 'warning',
          message: `Working offline - ${stats.pendingCount} change(s) pending sync`,
          messageAr: `العمل بدون إنترنت - ${stats.pendingCount} تغيير(ات) في انتظار المزامنة`,
          icon: 'cloud_off',
          showRetry: false
        };
      } else if (isOnline && isSyncing) {
        return {
          show: true,
          type: 'info',
          message: `Syncing... ${stats.syncingCount}/${stats.pendingCount + stats.syncingCount} changes`,
          messageAr: `جارٍ المزامنة... ${stats.syncingCount}/${stats.pendingCount + stats.syncingCount} تغيير`,
          icon: 'sync',
          showRetry: false
        };
      } else if (isOnline && hasFailed) {
        return {
          show: true,
          type: 'error',
          message: `${stats.failedCount} change(s) failed to sync`,
          messageAr: `فشلت مزامنة ${stats.failedCount} تغيير(ات)`,
          icon: 'error',
          showRetry: true
        };
      } else if (isOnline && !hasPending && !isSyncing) {
        return {
          show: false,
          type: 'success',
          message: 'All changes synced',
          messageAr: 'تمت مزامنة جميع التغييرات',
          icon: 'check_circle',
          showRetry: false
        };
      }

      return { show: false, type: 'info', message: '', messageAr: '', icon: '', showRetry: false };
    })
  );

  ngOnInit(): void {
    // Subscribe to connectivity changes to trigger sync
    this.connectivityService.isOnline$.subscribe(online => {
      if (online) {
        console.log('Connection restored - processing offline queue...');
        this.queueService.processQueueOnReconnect();
      }
    });
  }

  /**
   * Retry Failed Operations
   *
   * User-triggered retry for failed sync operations.
   */
  retrySync(): void {
    console.log('User requested retry of failed operations');
    this.queueService.retryFailed();
  }
}

interface BannerState {
  show: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  messageAr: string;
  icon: string;
  showRetry: boolean;
}
