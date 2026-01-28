/**
 * @file encryption.util.ts
 * @description AES-256-GCM encryption utility for securing sensitive data like OAuth tokens.
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption (confidentiality + integrity)
 * - Random IV per encryption operation
 * - Authentication tag for tamper detection
 * - Key rotation support via key versioning
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */

import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Encrypted data structure containing all components needed for decryption
 */
export interface EncryptedData {
  /** Initialization vector (random per encryption) */
  iv: string;
  /** The encrypted ciphertext */
  encryptedData: string;
  /** GCM authentication tag for integrity verification */
  authTag: string;
  /** Key version for rotation support */
  keyVersion: number;
}

/**
 * AES-256-GCM Encryption Service
 *
 * Provides secure encryption for sensitive data like OAuth tokens.
 * Uses authenticated encryption to ensure both confidentiality and integrity.
 *
 * @example
 * ```typescript
 * const encrypted = encryptionService.encrypt('sensitive-token');
 * const decrypted = encryptionService.decrypt(encrypted);
 * ```
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  /** AES-256-GCM algorithm identifier */
  private readonly algorithm = 'aes-256-gcm';

  /** IV length in bytes (96 bits recommended for GCM) */
  private readonly ivLength = 12;

  /** Authentication tag length in bytes */
  private readonly authTagLength = 16;

  /** Current key version for rotation support */
  private readonly currentKeyVersion = 1;

  /** Encryption key derived from environment configuration */
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Get encryption key from environment or generate warning
    const keyString = this.configService.get<string>('OAUTH_ENCRYPTION_KEY');

    if (!keyString) {
      this.logger.error(
        '⚠️ OAUTH_ENCRYPTION_KEY not configured! Using fallback key. ' +
          'Set OAUTH_ENCRYPTION_KEY in environment for production.',
      );
      // Fallback key for development only - NEVER use in production
      this.encryptionKey = crypto.scryptSync(
        'souqsyria-dev-key-change-in-production',
        'salt',
        32,
      );
    } else {
      // Derive a 256-bit key from the configured secret
      this.encryptionKey = crypto.scryptSync(keyString, 'souqsyria-oauth', 32);
    }

    this.logger.log('Encryption service initialized with AES-256-GCM');
  }

  /**
   * Encrypts plaintext data using AES-256-GCM authenticated encryption.
   *
   * @param plaintext - The data to encrypt
   * @returns Encrypted data object containing ciphertext, IV, and auth tag
   * @throws Error if encryption fails
   *
   * @example
   * ```typescript
   * const encrypted = service.encrypt('oauth-access-token-12345');
   * // Returns: { iv: '...', encryptedData: '...', authTag: '...', keyVersion: 1 }
   * ```
   */
  encrypt(plaintext: string): EncryptedData {
    if (!plaintext) {
      return null;
    }

    try {
      // Generate random IV for each encryption (critical for GCM security)
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher with AES-256-GCM
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
        { authTagLength: this.authTagLength },
      );

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag for integrity verification
      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex'),
        keyVersion: this.currentKeyVersion,
      };
    } catch (error: unknown) {
      this.logger.error(`Encryption failed: ${(error as Error).message}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data that was encrypted with the encrypt() method.
   *
   * @param encryptedData - The encrypted data object
   * @returns Decrypted plaintext string
   * @throws Error if decryption fails or authentication tag is invalid (tampered data)
   *
   * @example
   * ```typescript
   * const plaintext = service.decrypt(encryptedData);
   * // Returns: 'oauth-access-token-12345'
   * ```
   */
  decrypt(encryptedData: EncryptedData): string {
    if (!encryptedData || !encryptedData.encryptedData) {
      return null;
    }

    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Create decipher with AES-256-GCM
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
        { authTagLength: this.authTagLength },
      );

      // Set auth tag for integrity verification
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: unknown) {
      // Authentication failure indicates tampered data
      if ((error as Error).message.includes('Unsupported state')) {
        this.logger.error('Data integrity check failed - possible tampering detected');
        throw new Error('Data integrity verification failed');
      }
      this.logger.error(`Decryption failed: ${(error as Error).message}`);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypts data and returns a single base64-encoded string for storage.
   * More convenient for database storage than the object format.
   *
   * @param plaintext - The data to encrypt
   * @returns Base64-encoded encrypted string
   */
  encryptToString(plaintext: string): string {
    if (!plaintext) {
      return null;
    }

    const encrypted = this.encrypt(plaintext);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  /**
   * Decrypts data from the base64-encoded string format.
   *
   * @param encryptedString - Base64-encoded encrypted string
   * @returns Decrypted plaintext string
   */
  decryptFromString(encryptedString: string): string {
    if (!encryptedString) {
      return null;
    }

    try {
      const encryptedData = JSON.parse(
        Buffer.from(encryptedString, 'base64').toString('utf8'),
      ) as EncryptedData;
      return this.decrypt(encryptedData);
    } catch (error: unknown) {
      this.logger.error(`Failed to parse encrypted string: ${(error as Error).message}`);
      throw new Error('Invalid encrypted data format');
    }
  }

  /**
   * Generates a secure random token for use in password resets, OTPs, etc.
   *
   * @param length - Length of the token in bytes (default: 32)
   * @returns Hex-encoded random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hashes a token using SHA-256 for secure storage.
   * Used for password reset tokens where we don't need to decrypt.
   *
   * @param token - The token to hash
   * @returns SHA-256 hash of the token
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
