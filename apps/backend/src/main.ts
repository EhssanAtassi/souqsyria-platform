/**
 * @file main.ts
 * @description Bootstrap function for SouqSyria API backend.
 */

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeFirebase } from './config/firebase.config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuditLogService } from './audit-log/service/audit-log.service';
import { BackwardCompatibilityMiddleware } from './common/versioning/backward-compatibility.middleware';

async function bootstrap() {
  initializeFirebase();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // SEC-H04 FIX: Strict CORS configuration
  // Removed null origin bypass which allowed cross-origin attacks
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Cookie parser middleware for guest session management (SS-AUTH-009)
  // Must be applied BEFORE other middleware that depend on cookies
  app.use(cookieParser());

  // Security headers via Helmet (X-Content-Type-Options, HSTS, X-Frame-Options, etc.)
  // Explicit CSP configuration for the SouqSyria REST API
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: [
            "'self'",
            ...(isDevelopment
              ? ['http://localhost:4200']
              : ['https://souqsyria.com', 'https://www.souqsyria.com']),
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    }),
  );

  // CSRF note: Not applicable for this API — authentication is JWT Bearer-token only.
  // JWT tokens are not automatically attached by browsers (unlike cookies), so CSRF
  // attacks cannot forge authenticated requests. No CSRF middleware is needed.

  app.enableCors({
    origin: (origin, callback) => {
      // SEC-H04: REMOVED the !origin bypass that allowed null origins
      // Null origins can be exploited by attackers using data: URLs or sandboxed iframes

      // In development, allow localhost with explicit origin check
      if (isDevelopment) {
        if (!origin) {
          // Only allow no-origin requests from truly trusted sources in development
          // Log these requests for monitoring
          const logger = new Logger('CORS');
          logger.warn('Request with no origin received - allowing only in development');
          return callback(null, true);
        }

        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
      }

      // Production: Strict whitelist only
      const allowedDomains = [
        'https://souqsyria.com',
        'https://www.souqsyria.com',
        'https://admin.souqsyria.com',
        'https://vendor.souqsyria.com',
        'https://api.souqsyria.com',
      ];

      // Also allow from environment configuration for flexibility
      const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
      const allAllowedOrigins = [...allowedDomains, ...additionalOrigins.map(o => o.trim())];

      if (origin && allAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject other origins with proper error
      const logger = new Logger('CORS');
      logger.warn(`Blocked CORS request from origin: ${origin || 'null'}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // Cache preflight requests for 24 hours
  });
  
  app.setGlobalPrefix('api');
  // ========================================
  // GLOBAL FILTERS, PIPES & INTERCEPTORS
  // ========================================
  
  // Global validation pipe with detailed error messages
  // SECURITY: enableImplicitConversion disabled to prevent prototype pollution
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
      transform: true,           // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // SECURITY: Prevent prototype pollution attacks
        // Use explicit @Type() decorators in DTOs instead
      },
      validationError: {
        target: false,            // Don't include target object in errors
        value: false,             // Don't include value in errors (security)
      },
    }),
  );
  
  // Global exception filter for standardized error responses
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Global interceptors for response transformation and audit logging
  const reflector = app.get(Reflector);
  const auditLogService = app.get(AuditLogService);
  app.useGlobalInterceptors(
    new ResponseInterceptor(reflector),      // Standardize success responses
    new AuditInterceptor(auditLogService, reflector), // Audit logging
  );

  // Configure backward compatibility middleware for legacy endpoints
  app.use(
    new BackwardCompatibilityMiddleware().use.bind(
      new BackwardCompatibilityMiddleware(),
    ),
  );

  const port = configService.get<number>('PORT') || 3002;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
