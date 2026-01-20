/**
 * ✅ SENTRY ERROR TRACKING FOR SOUQSYRIA
 *
 * Purpose: Get real-time alerts when errors happen
 * What it does:
 * - Sends errors to Sentry dashboard
 * - Alerts you via email/Slack when things break
 * - Tracks error frequency and user impact
 */

import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  constructor() {
    // Only initialize in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
      });
      this.logger.log('✅ Sentry error tracking initialized');
    } else {
      this.logger.log('📝 Sentry disabled (development mode)');
    }
  }

  // Report errors to Sentry
  captureError(error: Error, context?: any) {
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error);
    }
    this.logger.error(`Sentry: ${error.message}`, error.stack);
  }
}
