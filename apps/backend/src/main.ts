/**
 * @file main.ts
 * @description Bootstrap function for SouqSyria API backend. Configures Swagger for API documentation.
 */

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeFirebase } from './config/firebase.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuditLogService } from './audit-log/service/audit-log.service';
import { BackwardCompatibilityMiddleware } from './common/versioning/backward-compatibility.middleware';

async function bootstrap() {
  initializeFirebase();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS for frontend access
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow all localhost origins for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Allow production domains
      const allowedDomains = [
        'https://souqsyria.com',
        'https://admin.souqsyria.com',
        'https://vendor.souqsyria.com',
      ];

      if (allowedDomains.includes(origin)) {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  app.setGlobalPrefix('api');
  // const app = await NestFactory.create(AppModule);
  // await app.listen(3000);
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('SouqSyria API')
    .setDescription(
      'Backend API Documentation for SouqSyria E-commerce Platform',
    )
    .setVersion('1.0')
    .addBearerAuth() // 🔒 Add Authorization Bearer Token (JWT)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Access at /api/docs
  // ========================================
  // GLOBAL FILTERS, PIPES & INTERCEPTORS
  // ========================================
  
  // Global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
      transform: true,           // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
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

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
