/**
 * @file disk.health.ts
 * @description Disk Health Indicator for storage monitoring
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import * as os from 'os';
import * as fs from 'fs';

/**
 * DiskHealthIndicator
 * @description Checks disk storage availability
 *
 * @example
 * // In health controller:
 * () => this.diskHealth.checkStorage('disk')
 */
@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  /**
   * Format bytes to human readable
   * @param bytes - Number of bytes
   * @returns Formatted string
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
   * Check if sufficient disk space is available
   * @param key - Health indicator key
   * @returns Health indicator result
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check the root/home directory based on platform
      const checkPath = os.platform() === 'win32' ? 'C:\\' : '/';

      // Get disk stats using fs.statfs (Node.js 18+)
      const stats = await fs.promises.statfs(checkPath);

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bfree * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const usagePercent = ((usedSpace / totalSpace) * 100).toFixed(2);

      // Consider unhealthy if more than 90% used
      const isHealthy = usedSpace / totalSpace < 0.9;

      const result = this.getStatus(key, isHealthy, {
        path: checkPath,
        total: this.formatBytes(totalSpace),
        free: this.formatBytes(freeSpace),
        used: this.formatBytes(usedSpace),
        usagePercent: `${usagePercent}%`,
      });

      if (!isHealthy) {
        throw new HealthCheckError(
          `Disk usage critical: ${usagePercent}% used`,
          result,
        );
      }

      return result;
    } catch (error: unknown) {
      // If statfs is not available, return a basic healthy status
      if (error instanceof HealthCheckError) {
        throw error;
      }

      return this.getStatus(key, true, {
        message: 'Disk stats not available on this platform',
        status: 'unknown',
      });
    }
  }

  /**
   * Check storage at a specific path
   * @param key - Health indicator key
   * @param path - Path to check
   * @param thresholdPercent - Usage threshold (0-1)
   * @returns Health indicator result
   */
  async checkPath(
    key: string,
    path: string,
    thresholdPercent: number = 0.9,
  ): Promise<HealthIndicatorResult> {
    try {
      const stats = await fs.promises.statfs(path);

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bfree * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const usageRatio = usedSpace / totalSpace;

      const isHealthy = usageRatio < thresholdPercent;

      const result = this.getStatus(key, isHealthy, {
        path,
        total: this.formatBytes(totalSpace),
        free: this.formatBytes(freeSpace),
        used: this.formatBytes(usedSpace),
        usagePercent: `${(usageRatio * 100).toFixed(2)}%`,
        threshold: `${(thresholdPercent * 100).toFixed(0)}%`,
      });

      if (!isHealthy) {
        throw new HealthCheckError(
          `Disk usage at ${path} exceeds ${thresholdPercent * 100}% threshold`,
          result,
        );
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error
          ? (error as Error).message
          : 'Unknown disk error';

      throw new HealthCheckError(
        'Disk health check failed',
        this.getStatus(key, false, {
          message: errorMessage,
          path,
        }),
      );
    }
  }

  /**
   * Get detailed disk statistics
   * @returns Disk statistics
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    try {
      const checkPath = os.platform() === 'win32' ? 'C:\\' : '/';
      const stats = await fs.promises.statfs(checkPath);

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bfree * stats.bsize;
      const availableSpace = stats.bavail * stats.bsize;

      return {
        path: checkPath,
        total: this.formatBytes(totalSpace),
        free: this.formatBytes(freeSpace),
        available: this.formatBytes(availableSpace),
        usagePercent: `${(((totalSpace - freeSpace) / totalSpace) * 100).toFixed(2)}%`,
        blockSize: stats.bsize,
      };
    } catch {
      return {
        error: 'Failed to get disk statistics',
      };
    }
  }
}
