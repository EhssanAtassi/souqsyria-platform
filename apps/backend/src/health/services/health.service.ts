/**
 * @file health.service.ts
 * @description Health Service for system metrics and version information
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import * as os from 'os';

/**
 * System metrics interface
 */
export interface SystemMetrics {
  /** Process uptime in seconds */
  uptime: number;
  /** Formatted uptime string */
  uptimeFormatted: string;
  /** Memory usage */
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: string;
    heapTotalMB: string;
    rssMB: string;
  };
  /** CPU usage */
  cpu: {
    user: number;
    system: number;
    loadAverage: number[];
    cores: number;
  };
  /** System info */
  system: {
    platform: string;
    arch: string;
    totalMemory: string;
    freeMemory: string;
    hostname: string;
  };
  /** Application info */
  version: string;
  nodeVersion: string;
  environment: string;
  /** Timestamp of metrics collection */
  timestamp: Date;
}

/**
 * Version information interface
 */
export interface VersionInfo {
  version: string;
  buildDate: string;
  gitCommit: string;
  nodeVersion: string;
  npmVersion: string;
  environment: string;
  apiVersion: string;
}

/**
 * HealthService
 * @description Provides system metrics and health information
 */
@Injectable()
export class HealthService {
  private readonly startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  /**
   * Format bytes to human readable string
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "1.5 GB")
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format seconds to human readable duration
   * @param seconds - Number of seconds
   * @returns Formatted duration string
   */
  private formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (secs > 0 || parts.length === 0)
      parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);

    return parts.join(', ');
  }

  /**
   * Get comprehensive system metrics
   * @returns System metrics including memory, CPU, and uptime
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      uptime,
      uptimeFormatted: this.formatDuration(uptime),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        heapUsedMB: this.formatBytes(memoryUsage.heapUsed),
        heapTotalMB: this.formatBytes(memoryUsage.heapTotal),
        rssMB: this.formatBytes(memoryUsage.rss),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: this.formatBytes(os.totalmem()),
        freeMemory: this.formatBytes(os.freemem()),
        hostname: os.hostname(),
      },
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date(),
    };
  }

  /**
   * Get application version information
   * @returns Version and build information
   */
  getVersionInfo(): VersionInfo {
    return {
      version: process.env.APP_VERSION || '1.0.0',
      buildDate: process.env.BUILD_DATE || this.startTime.toISOString(),
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      nodeVersion: process.version,
      npmVersion: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      apiVersion: 'v1',
    };
  }

  /**
   * Get application start time
   * @returns Application start timestamp
   */
  getStartTime(): Date {
    return this.startTime;
  }

  /**
   * Check if application has been running for minimum duration
   * @param minSeconds - Minimum seconds of uptime
   * @returns True if uptime exceeds minimum
   */
  hasMinimumUptime(minSeconds: number): boolean {
    return process.uptime() >= minSeconds;
  }
}
