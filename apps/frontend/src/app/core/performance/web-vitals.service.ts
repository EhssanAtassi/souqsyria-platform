/**
 * @file web-vitals.service.ts
 * @description Core Web Vitals monitoring service for performance tracking
 * @module Core/Performance
 */

import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment, performanceConfig } from '../../../environments/environment.prod';

/**
 * Core Web Vitals metrics interface
 */
export interface WebVitalsMetrics {
  /** Largest Contentful Paint (ms) */
  lcp: number | null;
  /** First Input Delay (ms) */
  fid: number | null;
  /** Cumulative Layout Shift */
  cls: number | null;
  /** First Contentful Paint (ms) */
  fcp: number | null;
  /** Time to First Byte (ms) */
  ttfb: number | null;
  /** Total Blocking Time (ms) */
  tbt: number | null;
  /** Time to Interactive (ms) */
  tti: number | null;
}

/**
 * Performance score interface
 */
export interface PerformanceScore {
  /** Overall score (0-100) */
  overall: number;
  /** Individual metric scores */
  metrics: {
    lcp: { score: number; status: 'good' | 'needs-improvement' | 'poor' };
    fid: { score: number; status: 'good' | 'needs-improvement' | 'poor' };
    cls: { score: number; status: 'good' | 'needs-improvement' | 'poor' };
    fcp: { score: number; status: 'good' | 'needs-improvement' | 'poor' };
    ttfb: { score: number; status: 'good' | 'needs-improvement' | 'poor' };
  };
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  /** Timestamp of the report */
  timestamp: number;
  /** Page URL */
  url: string;
  /** User agent */
  userAgent: string;
  /** Connection type */
  connection: string;
  /** Device type */
  deviceType: 'mobile' | 'tablet' | 'desktop';
  /** Core Web Vitals metrics */
  metrics: WebVitalsMetrics;
  /** Performance score */
  score: PerformanceScore;
  /** Bundle information */
  bundleInfo: {
    mainSize: number;
    vendorSize: number;
    totalSize: number;
  };
  /** Memory usage (MB) */
  memoryUsage: number;
  /** Additional context */
  context: {
    route: string;
    component: string;
    userInteraction: boolean;
  };
}

/**
 * Web Vitals monitoring service
 */
@Injectable({
  providedIn: 'root'
})
export class WebVitalsService {
  private readonly document = inject(DOCUMENT);
  
  /**
   * Current metrics observable
   */
  private readonly metricsSubject = new BehaviorSubject<WebVitalsMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    tbt: null,
    tti: null
  });

  /**
   * Performance observer instances
   */
  private observers: PerformanceObserver[] = [];

  /**
   * Collected metrics
   */
  private metrics: WebVitalsMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    tbt: null,
    tti: null
  };

  /**
   * Layout shift tracking
   */
  private clsValue = 0;
  private sessionValue = 0;
  private sessionEntries: PerformanceEntry[] = [];

  /**
   * First input tracking
   */
  private fidValue: number | null = null;

  /**
   * Initialize monitoring
   */
  initialize(): void {
    if (!environment.performance.enableWebVitals) return;

    this.initializeLCP();
    this.initializeFID();
    this.initializeCLS();
    this.initializeFCP();
    this.initializeTTFB();
    this.initializeTBT();
    
    // Start TTI measurement
    this.measureTTI();
    
    // Report metrics periodically
    this.startPeriodicReporting();
  }

  /**
   * Get current metrics
   */
  getMetrics(): Observable<WebVitalsMetrics> {
    return this.metricsSubject.asObservable();
  }

  /**
   * Get performance score
   */
  getPerformanceScore(): PerformanceScore {
    const metrics = this.metrics;
    const thresholds = performanceConfig.webVitals;

    const scores = {
      lcp: this.calculateMetricScore(metrics.lcp, thresholds.lcp),
      fid: this.calculateMetricScore(metrics.fid, thresholds.fid),
      cls: this.calculateMetricScore(metrics.cls, thresholds.cls),
      fcp: this.calculateMetricScore(metrics.fcp, thresholds.fcp),
      ttfb: this.calculateMetricScore(metrics.ttfb, thresholds.ttfb)
    };

    const validScores = Object.values(scores)
      .map(s => s.score)
      .filter(score => score !== null);

    const overall = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, score) => sum + score!, 0) / validScores.length)
      : 0;

    return {
      overall,
      metrics: scores
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(context?: {
    route?: string;
    component?: string;
    userInteraction?: boolean;
  }): Promise<PerformanceReport> {
    const bundleInfo = await this.getBundleInfo();
    const memoryUsage = this.getMemoryUsage();
    const deviceInfo = this.getDeviceInfo();

    return {
      timestamp: Date.now(),
      url: this.document.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionType(),
      deviceType: deviceInfo.type,
      metrics: { ...this.metrics },
      score: this.getPerformanceScore(),
      bundleInfo,
      memoryUsage,
      context: {
        route: context?.route || this.document.location.pathname,
        component: context?.component || 'unknown',
        userInteraction: context?.userInteraction || false
      }
    };
  }

  /**
   * Send performance report
   */
  async sendReport(context?: any): Promise<void> {
    if (!environment.logging.performance) return;

    try {
      const report = await this.generateReport(context);
      
      // Send to analytics
      if (environment.analytics.performanceAnalytics) {
        this.sendToAnalytics(report);
      }

      // Send to logging endpoint
      if (environment.logging.remote) {
        await this.sendToLoggingEndpoint(report);
      }

      console.log('Performance Report:', report);
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  // =========================================================================
  // METRIC INITIALIZATION
  // =========================================================================

  /**
   * Initialize Largest Contentful Paint monitoring
   */
  private initializeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          this.metrics.lcp = Math.round(lastEntry.startTime);
          this.updateMetrics();
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP monitoring not supported:', error);
    }
  }

  /**
   * Initialize First Input Delay monitoring
   */
  private initializeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            this.metrics.fid = Math.round(fid);
            this.updateMetrics();
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      // Fallback: measure first input manually
      this.measureFIDFallback();
    }
  }

  /**
   * Initialize Cumulative Layout Shift monitoring
   */
  private initializeCLS(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            this.clsValue += entry.value;
            this.sessionValue += entry.value;
            this.sessionEntries.push(entry);
          }
        });

        this.metrics.cls = Math.round(this.clsValue * 10000) / 10000;
        this.updateMetrics();
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
  }

  /**
   * Initialize First Contentful Paint monitoring
   */
  private initializeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = Math.round(entry.startTime);
            this.updateMetrics();
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP monitoring not supported:', error);
    }
  }

  /**
   * Initialize Time to First Byte monitoring
   */
  private initializeTTFB(): void {
    try {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        this.metrics.ttfb = Math.round(navEntry.responseStart - navEntry.fetchStart);
        this.updateMetrics();
      }
    } catch (error) {
      console.warn('TTFB monitoring not supported:', error);
    }
  }

  /**
   * Initialize Total Blocking Time monitoring
   */
  private initializeTBT(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        let totalBlockingTime = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.duration > 50) {
            totalBlockingTime += entry.duration - 50;
          }
        });

        this.metrics.tbt = Math.round(totalBlockingTime);
        this.updateMetrics();
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('TBT monitoring not supported:', error);
    }
  }

  /**
   * Measure Time to Interactive
   */
  private measureTTI(): void {
    // Simplified TTI calculation
    const checkTTI = () => {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        const tti = navEntry.domInteractive - navEntry.fetchStart;
        this.metrics.tti = Math.round(tti);
        this.updateMetrics();
      }
    };

    // Check TTI when page is fully loaded
    if (this.document.readyState === 'complete') {
      checkTTI();
    } else {
      window.addEventListener('load', checkTTI, { once: true });
    }
  }

  // =========================================================================
  // FALLBACK METHODS
  // =========================================================================

  /**
   * Fallback FID measurement using event listeners
   */
  private measureFIDFallback(): void {
    let firstInputTime: number | null = null;

    const eventTypes = ['keydown', 'click', 'touchstart', 'pointerdown'];

    const onFirstInput = (event: Event) => {
      if (firstInputTime === null) {
        firstInputTime = performance.now();
        
        // Measure processing time
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const processingTime = performance.now() - firstInputTime!;
            this.metrics.fid = Math.round(processingTime);
            this.updateMetrics();
          });
        });

        // Remove listeners
        eventTypes.forEach(type => {
          this.document.removeEventListener(type, onFirstInput);
        });
      }
    };

    eventTypes.forEach(type => {
      this.document.addEventListener(type, onFirstInput, { passive: true, once: true });
    });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Update metrics and notify subscribers
   */
  private updateMetrics(): void {
    this.metricsSubject.next({ ...this.metrics });
  }

  /**
   * Calculate metric score
   */
  private calculateMetricScore(
    value: number | null, 
    thresholds: { good: number; needsImprovement: number }
  ): { score: number | null; status: 'good' | 'needs-improvement' | 'poor' } {
    if (value === null) {
      return { score: null, status: 'poor' };
    }

    let score: number;
    let status: 'good' | 'needs-improvement' | 'poor';

    if (value <= thresholds.good) {
      score = 100;
      status = 'good';
    } else if (value <= thresholds.needsImprovement) {
      // Linear interpolation between 50 and 100
      const ratio = (thresholds.needsImprovement - value) / (thresholds.needsImprovement - thresholds.good);
      score = 50 + (50 * ratio);
      status = 'needs-improvement';
    } else {
      // Linear interpolation between 0 and 50
      const ratio = Math.min(value / (thresholds.needsImprovement * 2), 1);
      score = 50 * (1 - ratio);
      status = 'poor';
    }

    return { score: Math.round(score), status };
  }

  /**
   * Get bundle information
   */
  private async getBundleInfo(): Promise<{ mainSize: number; vendorSize: number; totalSize: number }> {
    try {
      // Estimate bundle sizes from loaded resources
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let mainSize = 0;
      let vendorSize = 0;
      let totalSize = 0;

      resources.forEach(resource => {
        if (resource.name.includes('.js')) {
          const size = resource.transferSize || 0;
          totalSize += size;

          if (resource.name.includes('main')) {
            mainSize += size;
          } else if (resource.name.includes('vendor') || resource.name.includes('polyfills')) {
            vendorSize += size;
          }
        }
      });

      return {
        mainSize: Math.round(mainSize / 1024), // KB
        vendorSize: Math.round(vendorSize / 1024), // KB
        totalSize: Math.round(totalSize / 1024) // KB
      };
    } catch (error) {
      return { mainSize: 0, vendorSize: 0, totalSize: 0 };
    }
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / (1024 * 1024)); // MB
    }
    return 0;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): { type: 'mobile' | 'tablet' | 'desktop' } {
    const width = window.innerWidth;
    
    if (width < 768) {
      return { type: 'mobile' };
    } else if (width < 1024) {
      return { type: 'tablet' };
    } else {
      return { type: 'desktop' };
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    
    return 'unknown';
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    // Report every 30 seconds for the first 5 minutes
    let reportCount = 0;
    const maxReports = 10;

    const reportInterval = setInterval(() => {
      this.sendReport();
      reportCount++;

      if (reportCount >= maxReports) {
        clearInterval(reportInterval);
        
        // Switch to less frequent reporting (every 5 minutes)
        setInterval(() => {
          this.sendReport();
        }, 5 * 60 * 1000);
      }
    }, 30 * 1000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendReport({ userInteraction: false });
    });

    // Report on visibility change
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.hidden) {
        this.sendReport({ userInteraction: false });
      }
    });
  }

  /**
   * Send to analytics
   */
  private sendToAnalytics(report: PerformanceReport): void {
    // Send to Google Analytics or custom analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'performance_metrics', {
        lcp: report.metrics.lcp,
        fid: report.metrics.fid,
        cls: report.metrics.cls,
        fcp: report.metrics.fcp,
        overall_score: report.score.overall
      });
    }
  }

  /**
   * Send to logging endpoint
   */
  private async sendToLoggingEndpoint(report: PerformanceReport): Promise<void> {
    try {
      await fetch(environment.logging.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.warn('Failed to send performance report to logging endpoint:', error);
    }
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}