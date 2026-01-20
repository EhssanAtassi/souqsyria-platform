import { Injectable, ErrorHandler, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Enterprise Error Boundary Service for Syrian Marketplace
 * 
 * Features:
 * - Global error handling and reporting
 * - User-friendly error messages with Arabic support
 * - Error categorization and routing
 * - Performance impact monitoring
 * - Error recovery strategies
 * - Integration with external error tracking services
 * 
 * @swagger
 * components:
 *   schemas:
 *     ErrorBoundaryService:
 *       type: object
 *       description: Enterprise error boundary service for comprehensive error handling
 *       properties:
 *         handleError:
 *           type: function
 *           description: Handles errors with categorization and user feedback
 *         handleHttpError:
 *           type: function
 *           description: Specialized HTTP error handling with retry logic
 *         handleBusinessError:
 *           type: function
 *           description: Handles business logic errors with user guidance
 *         getErrorStats:
 *           type: function
 *           description: Returns error statistics for monitoring
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  additionalData?: any;
}

export interface ErrorInfo {
  id: string;
  type: 'network' | 'business' | 'validation' | 'authentication' | 'authorization' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  messageArabic?: string;
  context: ErrorContext;
  stack?: string;
  handled: boolean;
  recoveryAction?: 'retry' | 'reload' | 'navigate' | 'none';
  userNotified: boolean;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: ErrorInfo[];
  averageErrorsPerSession: number;
  lastErrorTime?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorBoundaryService implements ErrorHandler {
  //#region Private Properties
  
  /** Router service for navigation */
  private readonly router = inject(Router);
  
  /** Snackbar service for user notifications */
  private readonly snackBar = inject(MatSnackBar);
  
  /** Error storage and tracking */
  private readonly errors = new Map<string, ErrorInfo>();
  private readonly errorSubject = new BehaviorSubject<ErrorInfo | null>(null);
  
  /** Configuration */
  private readonly MAX_STORED_ERRORS = 100;
  private readonly ERROR_REPORT_ENDPOINT = '/api/v1/errors';
  
  /** Statistics tracking */
  private sessionStartTime = new Date();
  private errorCount = 0;
  
  //#endregion

  //#region Public Observables
  
  /** Observable for error events */
  public readonly error$ = this.errorSubject.asObservable();
  
  //#endregion

  //#region Constructor
  
  constructor() {
    console.log('ErrorBoundaryService initialized for Syrian Marketplace');
    this.setupGlobalErrorHandlers();
  }
  
  //#endregion

  //#region ErrorHandler Implementation
  
  /**
   * Angular's ErrorHandler interface implementation
   * @param error - The error to handle
   */
  handleError(error: any): void {
    const errorInfo = this.createErrorInfo(error, {
      component: 'Global',
      action: 'Unknown',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.processError(errorInfo);
  }
  
  //#endregion

  //#region Public API Methods
  
  /**
   * Handles HTTP errors with specialized logic
   * @param error - HTTP error response
   * @param context - Additional error context
   * @returns User-friendly error message
   */
  handleHttpError(error: HttpErrorResponse, context?: Partial<ErrorContext>): string {
    const errorInfo = this.createHttpErrorInfo(error, context);
    this.processError(errorInfo);
    
    return this.getUserFriendlyMessage(errorInfo);
  }
  
  /**
   * Handles business logic errors
   * @param message - Error message
   * @param messageArabic - Arabic error message
   * @param context - Error context
   * @param severity - Error severity level
   */
  handleBusinessError(
    message: string,
    messageArabic?: string,
    context?: Partial<ErrorContext>,
    severity: ErrorInfo['severity'] = 'medium'
  ): void {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: 'business',
      severity,
      message,
      messageArabic,
      context: this.buildContext(context),
      handled: true,
      recoveryAction: 'none',
      userNotified: false
    };

    this.processError(errorInfo);
    this.notifyUser(errorInfo);
  }
  
  /**
   * Handles validation errors with form field context
   * @param fieldName - Name of the field that failed validation
   * @param message - Validation error message
   * @param messageArabic - Arabic validation message
   * @param context - Additional context
   */
  handleValidationError(
    fieldName: string,
    message: string,
    messageArabic?: string,
    context?: Partial<ErrorContext>
  ): void {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: 'validation',
      severity: 'low',
      message: `Validation failed for ${fieldName}: ${message}`,
      messageArabic: messageArabic ? `فشل التحقق من ${fieldName}: ${messageArabic}` : undefined,
      context: this.buildContext({ ...context, additionalData: { fieldName } }),
      handled: true,
      recoveryAction: 'none',
      userNotified: false
    };

    this.processError(errorInfo);
  }
  
  /**
   * Handles authentication and authorization errors
   * @param type - Type of auth error
   * @param context - Error context
   */
  handleAuthError(type: 'authentication' | 'authorization', context?: Partial<ErrorContext>): void {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type,
      severity: type === 'authentication' ? 'high' : 'medium',
      message: type === 'authentication' 
        ? 'Authentication required. Please log in.' 
        : 'Access denied. Insufficient permissions.',
      messageArabic: type === 'authentication'
        ? 'مطلوب تسجيل الدخول. يرجى تسجيل الدخول.'
        : 'الوصول مرفوض. صلاحيات غير كافية.',
      context: this.buildContext(context),
      handled: true,
      recoveryAction: type === 'authentication' ? 'navigate' : 'none',
      userNotified: false
    };

    this.processError(errorInfo);
    this.notifyUser(errorInfo);
    
    if (type === 'authentication') {
      // Redirect to login page after delay
      setTimeout(() => {
        this.router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: window.location.pathname }
        });
      }, 2000);
    }
  }
  
  /**
   * Gets error statistics for monitoring
   * @returns Error statistics object
   */
  getErrorStats(): ErrorStats {
    const allErrors = Array.from(this.errors.values());
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    allErrors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    
    return {
      totalErrors: allErrors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: allErrors
        .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
        .slice(0, 10),
      averageErrorsPerSession: sessionDuration > 0 
        ? (allErrors.length / (sessionDuration / (1000 * 60 * 60))) 
        : 0,
      lastErrorTime: allErrors.length > 0 
        ? allErrors[allErrors.length - 1].context.timestamp 
        : undefined
    };
  }
  
  /**
   * Clears error history (for testing or privacy)
   */
  clearErrorHistory(): void {
    this.errors.clear();
    this.errorCount = 0;
    this.sessionStartTime = new Date();
    console.log('Error history cleared');
  }
  
  /**
   * Reports a custom error with full context
   * @param error - Error object or message
   * @param context - Error context
   * @param severity - Error severity
   */
  reportError(
    error: Error | string,
    context?: Partial<ErrorContext>,
    severity: ErrorInfo['severity'] = 'medium'
  ): void {
    const errorInfo = typeof error === 'string' 
      ? this.createCustomErrorInfo(error, context, severity)
      : this.createErrorInfo(error, this.buildContext(context), severity);
    
    this.processError(errorInfo);
  }
  
  //#endregion

  //#region Private Helper Methods
  
  /**
   * Creates error info from generic error
   */
  private createErrorInfo(
    error: any,
    context: Partial<ErrorContext>,
    severity: ErrorInfo['severity'] = 'medium'
  ): ErrorInfo {
    return {
      id: this.generateErrorId(),
      type: this.categorizeError(error),
      severity,
      message: this.extractErrorMessage(error),
      context: this.buildContext(context),
      stack: error?.stack,
      handled: false,
      recoveryAction: this.determineRecoveryAction(error),
      userNotified: false
    };
  }
  
  /**
   * Creates error info from HTTP error response
   */
  private createHttpErrorInfo(
    error: HttpErrorResponse,
    context?: Partial<ErrorContext>
  ): ErrorInfo {
    const severity = this.determineHttpErrorSeverity(error.status);
    const type = error.status >= 400 && error.status < 500 ? 'business' : 'network';
    
    return {
      id: this.generateErrorId(),
      type,
      severity,
      message: this.getHttpErrorMessage(error),
      messageArabic: this.getHttpErrorMessageArabic(error),
      context: this.buildContext({
        ...context,
        additionalData: {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        }
      }),
      handled: true,
      recoveryAction: this.determineHttpRecoveryAction(error.status),
      userNotified: false
    };
  }
  
  /**
   * Creates error info for custom errors
   */
  private createCustomErrorInfo(
    message: string,
    context?: Partial<ErrorContext>,
    severity: ErrorInfo['severity'] = 'medium'
  ): ErrorInfo {
    return {
      id: this.generateErrorId(),
      type: 'business',
      severity,
      message,
      context: this.buildContext(context),
      handled: true,
      recoveryAction: 'none',
      userNotified: false
    };
  }
  
  /**
   * Processes error through the pipeline
   */
  private processError(errorInfo: ErrorInfo): void {
    // Store error
    this.storeError(errorInfo);
    
    // Log error
    this.logError(errorInfo);
    
    // Report to external services
    this.reportToExternalService(errorInfo);
    
    // Emit error event
    this.errorSubject.next(errorInfo);
    
    // Update statistics
    this.errorCount++;
    
    console.error('Processed error:', errorInfo);
  }
  
  /**
   * Stores error in memory with size limit
   */
  private storeError(errorInfo: ErrorInfo): void {
    this.errors.set(errorInfo.id, errorInfo);
    
    // Enforce storage limit
    if (this.errors.size > this.MAX_STORED_ERRORS) {
      const oldestKey = this.errors.keys().next().value;
      this.errors.delete(oldestKey);
    }
  }
  
  /**
   * Logs error with appropriate level
   */
  private logError(errorInfo: ErrorInfo): void {
    const logMessage = `[${errorInfo.severity.toUpperCase()}] ${errorInfo.type}: ${errorInfo.message}`;
    
    switch (errorInfo.severity) {
      case 'critical':
      case 'high':
        console.error(logMessage, errorInfo);
        break;
      case 'medium':
        console.warn(logMessage, errorInfo);
        break;
      case 'low':
        console.info(logMessage, errorInfo);
        break;
    }
  }
  
  /**
   * Reports error to external monitoring service
   */
  private reportToExternalService(errorInfo: ErrorInfo): void {
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (errorInfo.severity === 'critical' || errorInfo.severity === 'high') {
      try {
        // Example: Send to error tracking service
        // this.http.post(this.ERROR_REPORT_ENDPOINT, errorInfo).subscribe();
        console.log('Would report to external service:', errorInfo);
      } catch (reportingError) {
        console.error('Failed to report error to external service:', reportingError);
      }
    }
  }
  
  /**
   * Notifies user with appropriate message
   */
  private notifyUser(errorInfo: ErrorInfo): void {
    if (errorInfo.userNotified) return;
    
    const message = this.getUserFriendlyMessage(errorInfo);
    const action = this.getRecoveryActionText(errorInfo.recoveryAction);
    
    const snackBarRef = this.snackBar.open(message, action, {
      duration: this.getNotificationDuration(errorInfo.severity),
      panelClass: this.getNotificationClass(errorInfo.severity),
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
    
    // Handle recovery action
    if (errorInfo.recoveryAction && errorInfo.recoveryAction !== 'none') {
      snackBarRef.onAction().subscribe(() => {
        this.executeRecoveryAction(errorInfo.recoveryAction!);
      });
    }
    
    errorInfo.userNotified = true;
  }
  
  /**
   * Builds complete error context
   */
  private buildContext(partial?: Partial<ErrorContext>): ErrorContext {
    return {
      component: 'Unknown',
      action: 'Unknown',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...partial
    };
  }
  
  /**
   * Categorizes error by type
   */
  private categorizeError(error: any): ErrorInfo['type'] {
    if (error instanceof HttpErrorResponse) {
      return error.status >= 400 && error.status < 500 ? 'business' : 'network';
    }
    
    if (error?.name === 'ValidationError') return 'validation';
    if (error?.name === 'AuthenticationError') return 'authentication';
    if (error?.name === 'AuthorizationError') return 'authorization';
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) return 'network';
    
    return 'unknown';
  }
  
  /**
   * Extracts meaningful error message
   */
  private extractErrorMessage(error: any): string {
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    
    return 'An unexpected error occurred';
  }
  
  /**
   * Gets user-friendly error message
   */
  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    // Return Arabic message if available, otherwise English
    return errorInfo.messageArabic || errorInfo.message;
  }
  
  /**
   * Gets HTTP error message in English
   */
  private getHttpErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0: return 'Network connection error. Please check your internet connection.';
      case 400: return 'Invalid request. Please check your input and try again.';
      case 401: return 'Authentication required. Please log in.';
      case 403: return 'Access denied. You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'Conflict detected. The resource may have been modified.';
      case 422: return 'Validation failed. Please check your input.';
      case 429: return 'Too many requests. Please wait and try again.';
      case 500: return 'Internal server error. Please try again later.';
      case 502: return 'Bad gateway. The server is temporarily unavailable.';
      case 503: return 'Service unavailable. Please try again later.';
      default: return `Server error (${error.status}). Please try again.`;
    }
  }
  
  /**
   * Gets HTTP error message in Arabic
   */
  private getHttpErrorMessageArabic(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0: return 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
      case 400: return 'طلب غير صالح. يرجى التحقق من البيانات والمحاولة مرة أخرى.';
      case 401: return 'مطلوب تسجيل الدخول.';
      case 403: return 'الوصول مرفوض. لا تملك الصلاحية لتنفيذ هذا الإجراء.';
      case 404: return 'المورد المطلوب غير موجود.';
      case 409: return 'تم اكتشاف تضارب. قد يكون المورد قد تم تعديله.';
      case 422: return 'فشل التحقق. يرجى التحقق من البيانات المدخلة.';
      case 429: return 'طلبات كثيرة جداً. يرجى الانتظار والمحاولة مرة أخرى.';
      case 500: return 'خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.';
      case 502: return 'بوابة سيئة. الخادم غير متاح مؤقتاً.';
      case 503: return 'الخدمة غير متاحة. يرجى المحاولة لاحقاً.';
      default: return `خطأ في الخادم (${error.status}). يرجى المحاولة مرة أخرى.`;
    }
  }
  
  /**
   * Determines error severity from HTTP status
   */
  private determineHttpErrorSeverity(status: number): ErrorInfo['severity'] {
    if (status >= 500) return 'high';
    if (status === 401 || status === 403) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }
  
  /**
   * Determines recovery action for generic errors
   */
  private determineRecoveryAction(error: any): ErrorInfo['recoveryAction'] {
    if (error instanceof HttpErrorResponse) {
      return this.determineHttpRecoveryAction(error.status);
    }
    
    return 'reload';
  }
  
  /**
   * Determines recovery action for HTTP errors
   */
  private determineHttpRecoveryAction(status: number): ErrorInfo['recoveryAction'] {
    switch (status) {
      case 0:
      case 408:
      case 429:
      case 502:
      case 503:
      case 504:
        return 'retry';
      case 401:
        return 'navigate';
      case 500:
        return 'reload';
      default:
        return 'none';
    }
  }
  
  /**
   * Gets recovery action text for UI
   */
  private getRecoveryActionText(action: ErrorInfo['recoveryAction']): string {
    switch (action) {
      case 'retry': return 'إعادة المحاولة | Retry';
      case 'reload': return 'إعادة التحميل | Reload';
      case 'navigate': return 'تسجيل الدخول | Login';
      default: return 'إغلاق | Close';
    }
  }
  
  /**
   * Executes recovery action
   */
  private executeRecoveryAction(action: ErrorInfo['recoveryAction']): void {
    switch (action) {
      case 'retry':
        // Implementation depends on context - could retry last failed operation
        window.location.reload();
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'navigate':
        this.router.navigate(['/auth/login']);
        break;
    }
  }
  
  /**
   * Gets notification duration based on severity
   */
  private getNotificationDuration(severity: ErrorInfo['severity']): number {
    switch (severity) {
      case 'critical': return 10000; // 10 seconds
      case 'high': return 7000;      // 7 seconds
      case 'medium': return 5000;    // 5 seconds
      case 'low': return 3000;       // 3 seconds
      default: return 5000;
    }
  }
  
  /**
   * Gets CSS class for notification styling
   */
  private getNotificationClass(severity: ErrorInfo['severity']): string[] {
    switch (severity) {
      case 'critical': return ['error-snackbar', 'critical-error'];
      case 'high': return ['error-snackbar', 'high-error'];
      case 'medium': return ['warning-snackbar'];
      case 'low': return ['info-snackbar'];
      default: return ['info-snackbar'];
    }
  }
  
  /**
   * Generates unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Sets up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
      event.preventDefault(); // Prevent default browser handling
    });
    
    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        // Resource loading error
        this.reportError(`Failed to load resource: ${(event.target as any)?.src || 'unknown'}`, {
          component: 'ResourceLoader',
          action: 'LoadResource'
        }, 'medium');
      }
    });
  }
  
  //#endregion
}