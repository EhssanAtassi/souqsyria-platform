import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

/**
 * Connectivity Service
 *
 * Monitors network connectivity status and provides real-time updates.
 * Listens to browser online/offline events and navigator.onLine state.
 *
 * Features:
 * - Real-time connectivity monitoring
 * - Observable stream of online/offline status
 * - Offline event detection for unreliable Syrian internet
 * - Automatic reconnection detection
 *
 * Usage:
 * ```typescript
 * constructor(private connectivity: ConnectivityService) {
 *   this.connectivity.isOnline$.subscribe(online => {
 *     if (online) {
 *       console.log('Connected - syncing cart...');
 *       this.queueService.processQueue();
 *     } else {
 *       console.log('Offline - queueing operations...');
 *     }
 *   });
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ConnectivityService:
 *       type: object
 *       description: Service for monitoring network connectivity status
 *       properties:
 *         isOnline$:
 *           type: Observable<boolean>
 *           description: Observable stream of connectivity status
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  /**
   * Connectivity Status Observable
   *
   * Emits true when online, false when offline.
   * Combines navigator.onLine with window online/offline events.
   */
  public readonly isOnline$: Observable<boolean>;

  /**
   * Current connectivity status (synchronous access)
   */
  private readonly onlineSubject: BehaviorSubject<boolean>;

  constructor() {
    // Initialize with current online status
    this.onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

    // Create observable from window events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    // Merge online and offline events, start with current status
    this.isOnline$ = merge(online$, offline$).pipe(
      startWith(navigator.onLine),
      distinctUntilChanged(),
      map(status => {
        console.log(`Connectivity status changed: ${status ? 'ONLINE' : 'OFFLINE'}`);
        this.onlineSubject.next(status);
        return status;
      })
    );

    // Subscribe to keep internal subject updated
    this.isOnline$.subscribe();

    // Log initial status
    console.log(`Initial connectivity status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`);
  }

  /**
   * Get Current Online Status (Synchronous)
   *
   * Returns current connectivity status without subscribing.
   *
   * @returns True if online, false if offline
   */
  public isCurrentlyOnline(): boolean {
    return this.onlineSubject.value;
  }

  /**
   * Wait for Online Connection
   *
   * Returns a promise that resolves when connection is restored.
   * Useful for waiting to sync after offline period.
   *
   * @returns Promise that resolves when online
   */
  public waitForOnline(): Promise<void> {
    if (this.isCurrentlyOnline()) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const subscription = this.isOnline$.subscribe(online => {
        if (online) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Check Effective Connection Type (Experimental)
   *
   * Returns connection type if available via Network Information API.
   * Useful for determining if connection is strong enough for large operations.
   *
   * @returns Connection type ('4g', '3g', '2g', 'slow-2g') or 'unknown'
   */
  public getConnectionType(): string {
    const nav = navigator as any;
    if ('connection' in nav) {
      return nav.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Check if Connection is Fast
   *
   * Determines if connection is fast enough for heavy operations.
   *
   * @returns True if connection is 4G or WiFi, false otherwise
   */
  public isFastConnection(): boolean {
    const connectionType = this.getConnectionType();
    return connectionType === '4g' || connectionType === 'unknown';
  }

  /**
   * Estimate Download Speed (Experimental)
   *
   * Returns estimated downlink speed in Mbps if available.
   *
   * @returns Download speed in Mbps or null if unavailable
   */
  public getDownlinkSpeed(): number | null {
    const nav = navigator as any;
    if ('connection' in nav && 'downlink' in nav.connection) {
      return nav.connection.downlink;
    }
    return null;
  }
}
