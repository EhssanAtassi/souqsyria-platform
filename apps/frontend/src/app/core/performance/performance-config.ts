/**
 * @file performance-config.ts
 * @description Core performance configuration and optimization utilities
 * @module Core/Performance
 */

import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enableMonitoring: boolean;
  /** Monitor Core Web Vitals */
  monitorCoreWebVitals: boolean;
  /** Bundle size threshold warnings (KB) */
  bundleSizeThresholds: {
    warning: number;
    error: number;
  };
  /** Image optimization settings */
  imageOptimization: {
    enableLazyLoading: boolean;
    enableWebP: boolean;
    qualityThreshold: number;
  };
  /** Chart rendering optimization */
  chartOptimization: {
    enableVirtualization: boolean;
    maxDataPoints: number;
    animationDuration: number;
    debounceTime: number;
  };
  /** Memory management */
  memoryManagement: {
    enableLeakDetection: boolean;
    maxMemoryUsage: number; // MB
    cleanupInterval: number; // ms
  };
}

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableMonitoring: true,
  monitorCoreWebVitals: true,
  bundleSizeThresholds: {
    warning: 400, // 400KB
    error: 800    // 800KB (reduced from 1MB)
  },
  imageOptimization: {
    enableLazyLoading: true,
    enableWebP: true,
    qualityThreshold: 0.8
  },
  chartOptimization: {
    enableVirtualization: true,
    maxDataPoints: 1000,
    animationDuration: 300, // Reduced from default
    debounceTime: 100
  },
  memoryManagement: {
    enableLeakDetection: true,
    maxMemoryUsage: 50, // MB
    cleanupInterval: 30000 // 30 seconds
  }
};

/**
 * Core Web Vitals metrics interface
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint (ms) */
  lcp: number;
  /** First Input Delay (ms) */
  fid: number;
  /** Cumulative Layout Shift */
  cls: number;
  /** First Contentful Paint (ms) */
  fcp: number;
  /** Total Blocking Time (ms) */
  tbt: number;
  /** Time to Interactive (ms) */
  tti: number;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  /** Core Web Vitals */
  vitals: CoreWebVitals;
  /** Bundle sizes by chunk */
  bundleSizes: Record<string, number>;
  /** Memory usage (MB) */
  memoryUsage: number;
  /** Component render times */
  componentMetrics: Record<string, {
    renderTime: number;
    reRenderCount: number;
  }>;
  /** Network request timings */
  networkMetrics: {
    averageResponseTime: number;
    cacheHitRate: number;
    totalRequests: number;
  };
}

/**
 * Performance monitoring service
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private readonly document = inject(DOCUMENT);
  private readonly config = DEFAULT_PERFORMANCE_CONFIG;
  private metrics: PerformanceMetrics | null = null;
  private observer: PerformanceObserver | null = null;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (!this.config.enableMonitoring) return;

    this.initializeCoreWebVitalsMonitoring();
    this.initializeMemoryMonitoring();
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeCoreWebVitalsMonitoring(): void {
    if (!this.config.monitorCoreWebVitals) return;

    // Use Web Vitals library if available, fallback to Performance Observer
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe different entry types
      const entryTypes = ['navigation', 'measure', 'paint', 'largest-contentful-paint'];
      entryTypes.forEach(type => {
        try {
          this.observer?.observe({ entryTypes: [type] });
        } catch (e) {
          // Silently handle unsupported entry types
        }
      });
    }
  }

  /**
   * Process performance entry
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.handlePaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.handleLCPEntry(entry as any);
        break;
    }
  }

  /**
   * Handle navigation timing entry
   */
  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const fcp = entry.responseStart - entry.fetchStart;
    const tti = entry.loadEventEnd - entry.fetchStart;
    
    console.log('Navigation Metrics:', {
      fcp,
      tti,
      loadTime: entry.loadEventEnd - entry.startTime
    });
  }

  /**
   * Handle paint timing entry
   */
  private handlePaintEntry(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      console.log('FCP:', entry.startTime, 'ms');
    }
  }

  /**
   * Handle LCP entry
   */
  private handleLCPEntry(entry: any): void {
    console.log('LCP:', entry.startTime, 'ms');
  }

  /**
   * Initialize memory monitoring
   */
  private initializeMemoryMonitoring(): void {
    if (!this.config.memoryManagement.enableLeakDetection) return;

    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;

        if (memoryUsageMB > this.config.memoryManagement.maxMemoryUsage) {
          console.warn(`Memory usage exceeded threshold: ${memoryUsageMB}MB`);
          this.triggerMemoryCleanup();
        }
      }
    }, this.config.memoryManagement.cleanupInterval);
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor XMLHttpRequest and Fetch API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const response = await originalFetch.apply(window, args);
      const end = performance.now();
      
      this.recordNetworkMetric(args[0], end - start, response.ok);
      return response;
    };
  }

  /**
   * Record network metric
   */
  private recordNetworkMetric(url: any, duration: number, success: boolean): void {
    // Implementation for recording network metrics
    console.log(`Network request to ${url}: ${duration}ms`, success ? 'success' : 'failed');
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup(): void {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Emit cleanup event for components to respond to
    this.document.dispatchEvent(new CustomEvent('memory-pressure'));
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  /**
   * Destroy monitoring
   */
  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceUtils {
  /**
   * Debounce function for performance optimization
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Lazy load function with intersection observer
   */
  static lazyLoad(
    target: Element,
    callback: () => void,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(target);
    return observer;
  }

  /**
   * Preload image with WebP fallback
   */
  static async preloadImage(src: string, webpSrc?: string): Promise<HTMLImageElement> {
    const img = new Image();
    
    // Check WebP support
    const supportsWebP = await this.checkWebPSupport();
    const actualSrc = supportsWebP && webpSrc ? webpSrc : src;
    
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = actualSrc;
    });
  }

  /**
   * Check WebP support
   */
  private static checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Calculate component complexity score
   */
  static calculateComplexity(component: {
    templateSize: number;
    inputCount: number;
    outputCount: number;
    childrenCount: number;
  }): number {
    const { templateSize, inputCount, outputCount, childrenCount } = component;
    
    // Weight factors
    const weights = {
      templateSize: 0.3,
      inputs: 0.2,
      outputs: 0.2,
      children: 0.3
    };

    return (
      (templateSize / 1000) * weights.templateSize +
      inputCount * weights.inputs +
      outputCount * weights.outputs +
      childrenCount * weights.children
    );
  }

  /**
   * Optimize array operations
   */
  static optimizeArrayOperations<T>(
    array: T[],
    operation: (item: T) => any,
    chunkSize = 100
  ): Promise<any[]> {
    return new Promise((resolve) => {
      const results: any[] = [];
      let index = 0;

      const processChunk = () => {
        const endIndex = Math.min(index + chunkSize, array.length);
        
        for (let i = index; i < endIndex; i++) {
          results.push(operation(array[i]));
        }

        index = endIndex;

        if (index < array.length) {
          // Process next chunk asynchronously
          setTimeout(processChunk, 0);
        } else {
          resolve(results);
        }
      };

      processChunk();
    });
  }

  /**
   * Check if device is low-end
   */
  static isLowEndDevice(): boolean {
    // Check various indicators of low-end device
    const navigator = window.navigator as any;
    
    // Check memory (if available)
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
      return true;
    }

    // Check number of logical processors
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      return true;
    }

    // Check connection speed
    if (navigator.connection && navigator.connection.effectiveType) {
      const slowConnections = ['slow-2g', '2g', '3g'];
      if (slowConnections.includes(navigator.connection.effectiveType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get optimized animation duration based on device capability
   */
  static getOptimizedAnimationDuration(baseDuration: number): number {
    if (this.isLowEndDevice()) {
      return 0; // Disable animations on low-end devices
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return baseDuration * 0.3; // Significantly reduce animation duration
    }

    return baseDuration;
  }
}

/**
 * Bundle optimization utilities
 */
export class BundleOptimizationUtils {
  /**
   * Dynamic import with error handling
   */
  static async dynamicImport<T>(importFn: () => Promise<T>): Promise<T> {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      throw error;
    }
  }

  /**
   * Preload critical chunks
   */
  static preloadCriticalChunks(): void {
    // Preload critical admin chunks
    const criticalChunks = [
      () => import('../../features/admin/dashboard/admin-dashboard.component'),
      () => import('../../features/admin/shared/components')
    ];

    // Use requestIdleCallback to preload during idle time
    if ('requestIdleCallback' in window) {
      criticalChunks.forEach((chunk, index) => {
        (window as any).requestIdleCallback(() => {
          this.dynamicImport(chunk).catch(() => {
            // Silent fail for preloading
          });
        }, { timeout: 1000 + index * 500 });
      });
    }
  }

  /**
   * Get optimal chunk loading strategy
   */
  static getChunkLoadingStrategy(): 'eager' | 'lazy' {
    const connection = (navigator as any).connection;
    
    if (connection) {
      // Load eagerly on fast connections
      const fastConnections = ['4g'];
      if (fastConnections.includes(connection.effectiveType)) {
        return 'eager';
      }
    }

    return 'lazy';
  }
}