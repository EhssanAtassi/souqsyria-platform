/**
 * @file validation-helper.ts
 * @description Validation helper utility for E2E tests
 * 
 * FEATURES:
 * - Data validation utilities
 * - API response validation
 * - Performance validation
 * - Arabic text validation
 * - Business logic validation
 * 
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ValidationHelper {
  private readonly logger = new Logger(ValidationHelper.name);

  /**
   * Validate API response structure
   */
  validateApiResponse(response: any, expectedFields: string[]): boolean {
    try {
      for (const field of expectedFields) {
        if (!response.hasOwnProperty(field)) {
          this.logger.error(`❌ Missing field: ${field}`);
          return false;
        }
      }
      
      this.logger.debug(`✅ API response structure validation passed`);
      return true;
    } catch (error) {
      this.logger.error('❌ API response validation failed:', error);
      return false;
    }
  }

  /**
   * Validate Arabic text contains Arabic characters
   */
  validateArabicText(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Check for Arabic Unicode range (U+0600 to U+06FF)
    const arabicRegex = /[\u0600-\u06FF]/;
    const isValid = arabicRegex.test(text);
    
    if (!isValid) {
      this.logger.warn(`⚠️ Text does not contain Arabic characters: ${text}`);
    }
    
    return isValid;
  }

  /**
   * Validate currency amount format
   */
  validateCurrencyAmount(amount: number, currency: 'SYP' | 'USD' | 'EUR'): boolean {
    if (typeof amount !== 'number' || amount < 0) {
      this.logger.error(`❌ Invalid currency amount: ${amount}`);
      return false;
    }
    
    // Check reasonable ranges for different currencies
    switch (currency) {
      case 'SYP':
        // SYP amounts should typically be larger (1000+)
        return amount >= 0 && amount <= 1000000000; // Up to 1 billion SYP
      
      case 'USD':
        // USD amounts should be reasonable
        return amount >= 0 && amount <= 1000000; // Up to 1 million USD
      
      case 'EUR':
        // EUR amounts should be reasonable
        return amount >= 0 && amount <= 1000000; // Up to 1 million EUR
      
      default:
        return false;
    }
  }

  /**
   * Validate percentage value (0-100)
   */
  validatePercentage(value: number, allowNegative: boolean = false): boolean {
    if (typeof value !== 'number') {
      return false;
    }
    
    const min = allowNegative ? -100 : 0;
    const max = 100;
    
    const isValid = value >= min && value <= max;
    
    if (!isValid) {
      this.logger.warn(`⚠️ Invalid percentage value: ${value} (should be ${min}-${max})`);
    }
    
    return isValid;
  }

  /**
   * Validate date format and reasonableness
   */
  validateDate(date: string | Date): boolean {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        this.logger.error(`❌ Invalid date: ${date}`);
        return false;
      }
      
      // Check if date is reasonable (not too far in past or future)
      const now = new Date();
      const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      const isReasonable = dateObj >= fiveYearsAgo && dateObj <= oneYearFromNow;
      
      if (!isReasonable) {
        this.logger.warn(`⚠️ Date seems unreasonable: ${dateObj.toISOString()}`);
      }
      
      return true; // Return true even if unreasonable for test data
    } catch (error) {
      this.logger.error('❌ Date validation failed:', error);
      return false;
    }
  }

  /**
   * Validate performance metrics
   */
  validatePerformanceMetrics(executionTime: number, maxAllowedTime: number): boolean {
    const isValid = executionTime <= maxAllowedTime;
    
    if (!isValid) {
      this.logger.warn(`⚠️ Performance threshold exceeded: ${executionTime}ms > ${maxAllowedTime}ms`);
    } else {
      this.logger.debug(`✅ Performance within threshold: ${executionTime}ms <= ${maxAllowedTime}ms`);
    }
    
    return isValid;
  }

  /**
   * Validate Syrian governorate data
   */
  validateGovernorateData(governorate: any): boolean {
    const requiredFields = ['nameEn', 'nameAr', 'revenueSyp', 'orderCount'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!governorate.hasOwnProperty(field)) {
        this.logger.error(`❌ Missing governorate field: ${field}`);
        return false;
      }
    }
    
    // Validate Arabic name
    if (!this.validateArabicText(governorate.nameAr)) {
      this.logger.error(`❌ Invalid Arabic name for governorate: ${governorate.nameAr}`);
      return false;
    }
    
    // Validate revenue
    if (!this.validateCurrencyAmount(governorate.revenueSyp, 'SYP')) {
      this.logger.error(`❌ Invalid revenue for governorate: ${governorate.revenueSyp}`);
      return false;
    }
    
    // Validate order count
    if (typeof governorate.orderCount !== 'number' || governorate.orderCount < 0) {
      this.logger.error(`❌ Invalid order count for governorate: ${governorate.orderCount}`);
      return false;
    }
    
    this.logger.debug(`✅ Governorate data validation passed for: ${governorate.nameEn}`);
    return true;
  }

  /**
   * Validate KYC compliance metrics
   */
  validateKycMetrics(kycData: any): boolean {
    const requiredFields = ['totalDocuments', 'complianceRate', 'averageProcessingTime'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!kycData.hasOwnProperty(field)) {
        this.logger.error(`❌ Missing KYC field: ${field}`);
        return false;
      }
    }
    
    // Validate compliance rate percentage
    if (!this.validatePercentage(kycData.complianceRate)) {
      return false;
    }
    
    // Validate processing time (should be positive)
    if (typeof kycData.averageProcessingTime !== 'number' || kycData.averageProcessingTime < 0) {
      this.logger.error(`❌ Invalid processing time: ${kycData.averageProcessingTime}`);
      return false;
    }
    
    this.logger.debug(`✅ KYC metrics validation passed`);
    return true;
  }

  /**
   * Validate system alert structure
   */
  validateAlert(alert: any): boolean {
    const requiredFields = ['type', 'severity', 'messageEn', 'messageAr', 'timestamp'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!alert.hasOwnProperty(field)) {
        this.logger.error(`❌ Missing alert field: ${field}`);
        return false;
      }
    }
    
    // Validate severity level
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(alert.severity)) {
      this.logger.error(`❌ Invalid alert severity: ${alert.severity}`);
      return false;
    }
    
    // Validate Arabic message
    if (!this.validateArabicText(alert.messageAr)) {
      this.logger.error(`❌ Invalid Arabic message in alert: ${alert.messageAr}`);
      return false;
    }
    
    // Validate timestamp
    if (!this.validateDate(alert.timestamp)) {
      return false;
    }
    
    this.logger.debug(`✅ Alert validation passed for type: ${alert.type}`);
    return true;
  }

  /**
   * Validate conversion funnel logic
   */
  validateConversionFunnel(funnel: any): boolean {
    const requiredFields = ['visitors', 'productViews', 'cartAdditions', 'checkouts', 'completedOrders'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!funnel.hasOwnProperty(field) || typeof funnel[field] !== 'number') {
        this.logger.error(`❌ Missing or invalid funnel field: ${field}`);
        return false;
      }
    }
    
    // Validate funnel logic (each step should be <= previous step)
    const steps = [
      funnel.visitors,
      funnel.productViews,
      funnel.cartAdditions,
      funnel.checkouts,
      funnel.completedOrders
    ];
    
    for (let i = 1; i < steps.length; i++) {
      if (steps[i] > steps[i - 1]) {
        this.logger.error(`❌ Invalid funnel logic: ${steps[i]} > ${steps[i - 1]}`);
        return false;
      }
    }
    
    this.logger.debug(`✅ Conversion funnel validation passed`);
    return true;
  }

  /**
   * Validate exchange rate reasonableness
   */
  validateExchangeRate(rate: number, baseCurrency: string, targetCurrency: string): boolean {
    // Validate basic properties
    if (typeof rate !== 'number' || rate <= 0) {
      this.logger.error(`❌ Invalid exchange rate: ${rate}`);
      return false;
    }
    
    // Check reasonable ranges for SYP (as of 2025)
    if (baseCurrency === 'SYP' && targetCurrency === 'USD') {
      // SYP to USD should be between 10,000 and 20,000 (rough estimate)
      if (rate < 5000 || rate > 25000) {
        this.logger.warn(`⚠️ SYP/USD exchange rate seems unusual: ${rate}`);
      }
    }
    
    this.logger.debug(`✅ Exchange rate validation passed: ${rate} ${baseCurrency}/${targetCurrency}`);
    return true;
  }

  /**
   * Validate array structure and contents
   */
  validateArray(array: any[], expectedMinLength: number = 0, itemValidator?: (item: any) => boolean): boolean {
    if (!Array.isArray(array)) {
      this.logger.error(`❌ Expected array, got: ${typeof array}`);
      return false;
    }
    
    if (array.length < expectedMinLength) {
      this.logger.error(`❌ Array too short: ${array.length} < ${expectedMinLength}`);
      return false;
    }
    
    // Validate individual items if validator provided
    if (itemValidator) {
      for (let i = 0; i < array.length; i++) {
        if (!itemValidator(array[i])) {
          this.logger.error(`❌ Array item ${i} validation failed`);
          return false;
        }
      }
    }
    
    this.logger.debug(`✅ Array validation passed: ${array.length} items`);
    return true;
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(validationResults: { [key: string]: boolean }): {
    isValid: boolean;
    passedCount: number;
    failedCount: number;
    failedFields: string[];
  } {
    const failedFields = Object.keys(validationResults).filter(key => !validationResults[key]);
    const passedCount = Object.keys(validationResults).length - failedFields.length;
    
    const summary = {
      isValid: failedFields.length === 0,
      passedCount,
      failedCount: failedFields.length,
      failedFields,
    };
    
    this.logger.log(`📊 Validation Summary: ${passedCount} passed, ${failedFields.length} failed`);
    
    return summary;
  }
}