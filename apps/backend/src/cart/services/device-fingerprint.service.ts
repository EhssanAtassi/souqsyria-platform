import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Device Fingerprint Validation Service
 *
 * Provides sophisticated device fingerprinting and validation capabilities
 * for fraud detection and session security. Generates unique device
 * identifiers and validates device consistency across sessions.
 *
 * **Fingerprint Components:**
 * - User Agent (browser, OS, device type)
 * - Screen resolution and color depth
 * - Timezone and language preferences
 * - Installed plugins and fonts
 * - Canvas fingerprinting
 * - WebGL renderer information
 * - Audio context fingerprinting
 * - Hardware concurrency (CPU cores)
 * - Device memory
 * - Platform details
 *
 * **Validation Features:**
 * - Device consistency checking across sessions
 * - Anomaly detection for device switching
 * - Emulator and virtual machine detection
 * - Bot and headless browser identification
 * - Device reputation scoring
 *
 * **Security Benefits:**
 * - Session hijacking detection
 * - Account takeover prevention
 * - Bot traffic identification
 * - Fraud pattern recognition
 *
 * @swagger
 * components:
 *   schemas:
 *     DeviceFingerprint:
 *       type: object
 *       properties:
 *         fingerprintId:
 *           type: string
 *           description: Unique device fingerprint hash
 *         components:
 *           type: object
 *           description: Individual fingerprint components
 *         trustScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Device trust score
 *         isVirtualDevice:
 *           type: boolean
 *           description: Whether device appears to be virtualized
 *         isBotLike:
 *           type: boolean
 *           description: Whether device shows bot-like characteristics
 */
@Injectable()
export class DeviceFingerprintService {
  private readonly logger = new Logger(DeviceFingerprintService.name);

  /**
   * Suspicious user agent patterns
   */
  private readonly SUSPICIOUS_USER_AGENTS = [
    'headless',
    'phantom',
    'selenium',
    'webdriver',
    'puppeteer',
    'playwright',
    'bot',
    'crawler',
    'spider',
    'scraper',
  ];

  /**
   * Virtual machine indicators
   */
  private readonly VM_INDICATORS = [
    'virtualbox',
    'vmware',
    'parallels',
    'qemu',
    'xen',
    'hyper-v',
  ];

  /**
   * Generates comprehensive device fingerprint
   *
   * Creates unique identifier from multiple device characteristics
   * Combines various data points to create robust fingerprint
   *
   * @param deviceData - Raw device data from client
   * @returns Complete device fingerprint with validation
   */
  generateFingerprint(deviceData: DeviceData): DeviceFingerprint {
    this.logger.debug('Generating device fingerprint');

    // Extract and normalize components
    const components = this.extractComponents(deviceData);

    // Generate unique fingerprint ID
    const fingerprintId = this.generateFingerprintId(components);

    // Calculate trust score
    const trustScore = this.calculateTrustScore(components, deviceData);

    // Detect virtual devices
    const isVirtualDevice = this.detectVirtualDevice(components, deviceData);

    // Detect bot-like behavior
    const isBotLike = this.detectBotBehavior(components, deviceData);

    const fingerprint: DeviceFingerprint = {
      fingerprintId,
      components,
      trustScore,
      isVirtualDevice,
      isBotLike,
      metadata: {
        generatedAt: new Date(),
        version: '2.0',
      },
    };

    this.logger.log(
      `Fingerprint generated: ${fingerprintId} (trust: ${trustScore})`,
    );

    return fingerprint;
  }

  /**
   * Validates device fingerprint consistency
   *
   * Compares current fingerprint with historical fingerprints
   * to detect anomalies or suspicious changes
   *
   * @param currentFingerprint - Current device fingerprint
   * @param historicalFingerprints - Past device fingerprints for user/session
   * @returns Validation result with consistency score
   */
  validateFingerprint(
    currentFingerprint: DeviceFingerprint,
    historicalFingerprints: DeviceFingerprint[],
  ): FingerprintValidation {
    this.logger.debug(
      `Validating fingerprint against ${historicalFingerprints.length} historical records`,
    );

    if (historicalFingerprints.length === 0) {
      return {
        isValid: true,
        consistencyScore: 100,
        anomalies: [],
        riskLevel: 'low',
        recommendation: 'allow',
      };
    }

    // Find matching fingerprints
    const exactMatch = historicalFingerprints.find(
      (fp) => fp.fingerprintId === currentFingerprint.fingerprintId,
    );

    if (exactMatch) {
      return {
        isValid: true,
        consistencyScore: 100,
        anomalies: [],
        riskLevel: 'low',
        recommendation: 'allow',
      };
    }

    // Calculate similarity with most recent fingerprint
    const mostRecent = historicalFingerprints[historicalFingerprints.length - 1];
    const similarity = this.calculateSimilarity(
      currentFingerprint,
      mostRecent,
    );

    // Detect anomalies
    const anomalies = this.detectAnomalies(currentFingerprint, mostRecent);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(similarity, anomalies.length);

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskLevel, similarity);

    return {
      isValid: similarity > 50,
      consistencyScore: similarity,
      anomalies,
      riskLevel,
      recommendation,
    };
  }

  /**
   * Extracts and normalizes device components
   *
   * @param deviceData - Raw device data
   * @returns Normalized device components
   */
  private extractComponents(deviceData: DeviceData): DeviceComponents {
    return {
      userAgent: this.normalizeUserAgent(deviceData.userAgent),
      screen: {
        width: deviceData.screen?.width || 0,
        height: deviceData.screen?.height || 0,
        colorDepth: deviceData.screen?.colorDepth || 0,
        pixelRatio: deviceData.screen?.pixelRatio || 1,
      },
      timezone: deviceData.timezone || 'UTC',
      language: deviceData.language || 'en',
      platform: deviceData.platform || 'unknown',
      hardwareConcurrency: deviceData.hardwareConcurrency || 0,
      deviceMemory: deviceData.deviceMemory || 0,
      plugins: deviceData.plugins || [],
      canvas: deviceData.canvas || '',
      webgl: deviceData.webgl || '',
      audio: deviceData.audio || '',
    };
  }

  /**
   * Generates unique fingerprint ID from components
   *
   * Uses SHA256 hash of component data
   *
   * @param components - Device components
   * @returns Unique fingerprint ID
   */
  private generateFingerprintId(components: DeviceComponents): string {
    const data = JSON.stringify(components);
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculates trust score for device
   *
   * Higher score = more trustworthy device
   *
   * @param components - Device components
   * @param deviceData - Raw device data
   * @returns Trust score (0-100)
   */
  private calculateTrustScore(
    components: DeviceComponents,
    deviceData: DeviceData,
  ): number {
    let score = 100;

    // Check user agent
    const userAgentLower = components.userAgent.toLowerCase();
    for (const pattern of this.SUSPICIOUS_USER_AGENTS) {
      if (userAgentLower.includes(pattern)) {
        score -= 30;
        break;
      }
    }

    // Check for missing or suspicious screen data
    if (components.screen.width === 0 || components.screen.height === 0) {
      score -= 20;
    }

    // Check for uncommon screen resolutions (bots often have default values)
    if (
      components.screen.width === 800 &&
      components.screen.height === 600
    ) {
      score -= 15;
    }

    // Check for missing hardware info
    if (components.hardwareConcurrency === 0) {
      score -= 10;
    }

    // Check for very low or very high hardware (suspicious)
    if (
      components.hardwareConcurrency > 0 &&
      (components.hardwareConcurrency < 2 || components.hardwareConcurrency > 32)
    ) {
      score -= 10;
    }

    // Check for canvas fingerprint
    if (!components.canvas || components.canvas.length < 10) {
      score -= 15;
    }

    // Check for WebGL data
    if (!components.webgl || components.webgl.length < 10) {
      score -= 10;
    }

    // Check for missing or suspicious plugins
    if (!components.plugins || components.plugins.length === 0) {
      score -= 10;
    }

    return Math.max(score, 0);
  }

  /**
   * Detects virtual device/emulator
   *
   * @param components - Device components
   * @param deviceData - Raw device data
   * @returns True if virtual device detected
   */
  private detectVirtualDevice(
    components: DeviceComponents,
    deviceData: DeviceData,
  ): boolean {
    const userAgentLower = components.userAgent.toLowerCase();
    const platformLower = components.platform.toLowerCase();

    // Check for VM indicators in user agent or platform
    for (const indicator of this.VM_INDICATORS) {
      if (
        userAgentLower.includes(indicator) ||
        platformLower.includes(indicator)
      ) {
        return true;
      }
    }

    // Check for suspicious WebGL renderer (common in VMs)
    if (components.webgl) {
      const webglLower = components.webgl.toLowerCase();
      if (
        webglLower.includes('swiftshader') ||
        webglLower.includes('llvmpipe') ||
        webglLower.includes('software rasterizer')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detects bot-like behavior
   *
   * @param components - Device components
   * @param deviceData - Raw device data
   * @returns True if bot-like characteristics detected
   */
  private detectBotBehavior(
    components: DeviceComponents,
    deviceData: DeviceData,
  ): boolean {
    const userAgentLower = components.userAgent.toLowerCase();

    // Check for bot patterns in user agent
    for (const pattern of this.SUSPICIOUS_USER_AGENTS) {
      if (userAgentLower.includes(pattern)) {
        return true;
      }
    }

    // Check for headless browser indicators
    if (
      deviceData.webdriver ||
      userAgentLower.includes('headlesschrome') ||
      userAgentLower.includes('headless')
    ) {
      return true;
    }

    // Check for missing browser features (bots often lack these)
    const missingFeatures =
      (!components.canvas || components.canvas.length < 10) &&
      (!components.webgl || components.webgl.length < 10) &&
      (!components.audio || components.audio.length < 10);

    if (missingFeatures) {
      return true;
    }

    return false;
  }

  /**
   * Calculates similarity between two fingerprints
   *
   * @param fp1 - First fingerprint
   * @param fp2 - Second fingerprint
   * @returns Similarity score (0-100)
   */
  private calculateSimilarity(
    fp1: DeviceFingerprint,
    fp2: DeviceFingerprint,
  ): number {
    let matchingComponents = 0;
    let totalComponents = 0;

    // Compare user agents (partial match allowed for browser updates)
    totalComponents++;
    const ua1 = fp1.components.userAgent.split('/')[0]; // Browser name
    const ua2 = fp2.components.userAgent.split('/')[0];
    if (ua1 === ua2) matchingComponents += 0.8;

    // Compare screen resolution (exact match required)
    totalComponents++;
    if (
      fp1.components.screen.width === fp2.components.screen.width &&
      fp1.components.screen.height === fp2.components.screen.height
    ) {
      matchingComponents++;
    }

    // Compare timezone
    totalComponents++;
    if (fp1.components.timezone === fp2.components.timezone) {
      matchingComponents++;
    }

    // Compare language
    totalComponents++;
    if (fp1.components.language === fp2.components.language) {
      matchingComponents++;
    }

    // Compare platform
    totalComponents++;
    if (fp1.components.platform === fp2.components.platform) {
      matchingComponents++;
    }

    // Compare hardware concurrency (allows ±2 difference)
    totalComponents++;
    const hardwareDiff = Math.abs(
      fp1.components.hardwareConcurrency - fp2.components.hardwareConcurrency,
    );
    if (hardwareDiff <= 2) {
      matchingComponents++;
    }

    // Compare canvas (partial match for minor rendering differences)
    totalComponents++;
    if (fp1.components.canvas && fp2.components.canvas) {
      const canvasSimilarity = this.stringSimilarity(
        fp1.components.canvas,
        fp2.components.canvas,
      );
      matchingComponents += canvasSimilarity;
    }

    return (matchingComponents / totalComponents) * 100;
  }

  /**
   * Detects anomalies between fingerprints
   *
   * @param current - Current fingerprint
   * @param previous - Previous fingerprint
   * @returns List of detected anomalies
   */
  private detectAnomalies(
    current: DeviceFingerprint,
    previous: DeviceFingerprint,
  ): string[] {
    const anomalies: string[] = [];

    // Check for browser change
    const currentBrowser = current.components.userAgent.split('/')[0];
    const previousBrowser = previous.components.userAgent.split('/')[0];
    if (currentBrowser !== previousBrowser) {
      anomalies.push('browser_change');
    }

    // Check for platform change
    if (current.components.platform !== previous.components.platform) {
      anomalies.push('platform_change');
    }

    // Check for screen resolution change
    if (
      current.components.screen.width !== previous.components.screen.width ||
      current.components.screen.height !== previous.components.screen.height
    ) {
      anomalies.push('screen_resolution_change');
    }

    // Check for timezone change
    if (current.components.timezone !== previous.components.timezone) {
      anomalies.push('timezone_change');
    }

    // Check for significant hardware change
    const hardwareDiff = Math.abs(
      current.components.hardwareConcurrency -
        previous.components.hardwareConcurrency,
    );
    if (hardwareDiff > 4) {
      anomalies.push('hardware_change');
    }

    // Check for canvas change
    if (
      current.components.canvas &&
      previous.components.canvas &&
      current.components.canvas !== previous.components.canvas
    ) {
      const similarity = this.stringSimilarity(
        current.components.canvas,
        previous.components.canvas,
      );
      if (similarity < 0.8) {
        anomalies.push('canvas_fingerprint_change');
      }
    }

    return anomalies;
  }

  /**
   * Determines risk level from similarity and anomalies
   *
   * @param similarity - Fingerprint similarity score
   * @param anomalyCount - Number of detected anomalies
   * @returns Risk level
   */
  private determineRiskLevel(
    similarity: number,
    anomalyCount: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (similarity > 90 && anomalyCount === 0) return 'low';
    if (similarity > 70 && anomalyCount <= 1) return 'medium';
    if (similarity > 50 && anomalyCount <= 3) return 'high';
    return 'critical';
  }

  /**
   * Generates recommendation based on risk assessment
   *
   * @param riskLevel - Determined risk level
   * @param similarity - Fingerprint similarity
   * @returns Recommended action
   */
  private generateRecommendation(
    riskLevel: string,
    similarity: number,
  ): 'allow' | 'challenge' | 'block' {
    if (riskLevel === 'critical' || similarity < 30) return 'block';
    if (riskLevel === 'high' || similarity < 50) return 'challenge';
    return 'allow';
  }

  /**
   * Calculates string similarity (Levenshtein-based)
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1)
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const maxLength = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);

    return 1 - distance / maxLength;
  }

  /**
   * Calculates Levenshtein distance between strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Normalizes user agent string
   *
   * @param userAgent - Raw user agent
   * @returns Normalized user agent
   */
  private normalizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    return userAgent.trim().toLowerCase();
  }
}

/**
 * Device data interface (from client)
 */
export interface DeviceData {
  userAgent?: string;
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timezone?: string;
  language?: string;
  platform?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  plugins?: string[];
  canvas?: string;
  webgl?: string;
  audio?: string;
  webdriver?: boolean;
}

/**
 * Device components interface
 */
export interface DeviceComponents {
  userAgent: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  plugins: string[];
  canvas: string;
  webgl: string;
  audio: string;
}

/**
 * Device fingerprint interface
 */
export interface DeviceFingerprint {
  fingerprintId: string;
  components: DeviceComponents;
  trustScore: number;
  isVirtualDevice: boolean;
  isBotLike: boolean;
  metadata: {
    generatedAt: Date;
    version: string;
  };
}

/**
 * Fingerprint validation result interface
 */
export interface FingerprintValidation {
  isValid: boolean;
  consistencyScore: number;
  anomalies: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'allow' | 'challenge' | 'block';
}
