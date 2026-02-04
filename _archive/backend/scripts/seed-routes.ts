/**
 * @file seed-routes.ts
 * @description Standalone script to discover and seed all NestJS routes with their permission mappings
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-routes.ts [options]
 * 
 * Options:
 *   --overwrite    Overwrite existing route-permission mappings
 *   --report       Generate detailed mapping report
 *   --validate     Validate existing mappings
 *   --help         Show help message
 * 
 * Examples:
 *   npx ts-node src/scripts/seed-routes.ts
 *   npx ts-node src/scripts/seed-routes.ts --overwrite
 *   npx ts-node src/scripts/seed-routes.ts --report
 *   npx ts-node src/scripts/seed-routes.ts --validate
 * 
 * @swagger
 * @tags Route Seeding Scripts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AccessControlSeederService } from '../access-control/seeds/access-control.seeder.service';
import { Logger } from '@nestjs/common';

/**
 * Parse command line arguments
 */
function parseArgs(): {
  overwrite: boolean;
  report: boolean;
  validate: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);

  return {
    overwrite: args.includes('--overwrite'),
    report: args.includes('--report'),
    validate: args.includes('--validate'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   SouqSyria Route Seeder                      ║
╚════════════════════════════════════════════════════════════════╝

DESCRIPTION:
  Discovers all NestJS routes using reflection and seeds them into
  the database with automatic permission mapping.

USAGE:
  npx ts-node src/scripts/seed-routes.ts [options]

OPTIONS:
  --overwrite     Update existing route-permission mappings
  --report        Generate detailed route mapping report
  --validate      Validate existing mappings for gaps
  --help, -h      Show this help message

EXAMPLES:
  # Seed all routes (idempotent)
  npx ts-node src/scripts/seed-routes.ts

  # Update existing mappings
  npx ts-node src/scripts/seed-routes.ts --overwrite

  # Generate mapping report
  npx ts-node src/scripts/seed-routes.ts --report

  # Validate mappings
  npx ts-node src/scripts/seed-routes.ts --validate

MAPPING CONVENTIONS:
  Method Name          →  Permission
  ─────────────────────────────────────
  findAll, getAll      →  view_{resource}
  findOne, getById     →  view_{resource}
  create, store        →  create_{resource}
  update, patch        →  edit_{resource}
  remove, delete       →  delete_{resource}
  approve              →  approve_{resource}
  reject               →  reject_{resource}

PUBLIC ROUTES:
  Routes decorated with @Public() are marked as public and don't
  require permission mapping.

EXPLICIT PERMISSIONS:
  Use @RequirePermission('permission_name') decorator to explicitly
  define permissions instead of auto-mapping.

OUTPUT:
  - Total routes discovered
  - Public routes (no permission needed)
  - Explicitly mapped routes
  - Auto-mapped routes
  - Unmapped routes (need manual attention)

  `);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const logger = new Logger('RouteSeeder');
  const args = parseArgs();

  // Show help if requested
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  logger.log('🚀 Starting Route Seeder...');
  logger.log('════════════════════════════════════════');

  try {
    // Bootstrap NestJS application
    logger.log('📦 Bootstrapping NestJS application...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get seeder service
    const seederService = app.get(AccessControlSeederService);

    // Execute based on flags
    if (args.validate) {
      // Validation mode
      logger.log('\n🔍 Validating route-permission mappings...\n');
      const validation = await seederService.validateRouteMappings();

      if (validation.valid) {
        logger.log('✅ All route mappings are valid!\n');
      } else {
        logger.warn(`⚠️  Found ${validation.issues.length} validation issues:\n`);
        validation.issues.forEach((issue, index) => {
          logger.warn(`   ${index + 1}. ${issue}`);
        });
        logger.warn('');
      }
    } else if (args.report) {
      // Report generation mode
      logger.log('\n📋 Generating route mapping report...\n');
      const report = await seederService.generateRouteMappingReport();

      logger.log('📊 Route Mapping Summary:');
      logger.log(`   Total Routes:       ${report.summary.totalRoutes}`);
      logger.log(`   Public Routes:      ${report.summary.publicRoutes}`);
      logger.log(`   Explicitly Mapped:  ${report.summary.explicitlyMapped}`);
      logger.log(`   Auto-Mapped:        ${report.summary.autoMapped}`);
      logger.log(`   Unmapped:           ${report.summary.unmapped}\n`);

      if (report.summary.unmapped > 0) {
        logger.warn('⚠️  Unmapped Routes (need manual attention):');
        report.unmappedRoutes.forEach((route: any) => {
          logger.warn(
            `   ${route.method} ${route.path} (${route.controller}.${route.handler})`,
          );
        });
        logger.warn('');
      }

      // Show grouped routes by resource
      logger.log('🗂️  Routes by Resource:\n');
      for (const [resource, routes] of Object.entries(report.byResource)) {
        logger.log(`   ${resource}:`);
        (routes as any[]).forEach((route: any) => {
          const status = route.isPublic
            ? '[PUBLIC]'
            : route.mappingType === 'explicit'
              ? `[EXPLICIT: ${route.permission}]`
              : route.mappingType === 'auto'
                ? `[AUTO: ${route.permission}]`
                : '[UNMAPPED]';

          logger.log(`      ${route.method.padEnd(6)} ${route.path.padEnd(50)} ${status}`);
        });
        logger.log('');
      }
    } else {
      // Seeding mode
      logger.log('\n🌱 Seeding routes...\n');
      const result = await seederService.seedRoutes({
        overwriteExisting: args.overwrite,
        logLevel: 'info',
      });

      logger.log('\n✅ Route seeding completed!');
      logger.log('════════════════════════════════════════');
      logger.log(`   Routes Created:   ${result.created}`);
      logger.log(`   Routes Updated:   ${result.updated}`);
      logger.log(`   Routes Mapped:    ${result.mapped}`);
      logger.log(`   Routes Unmapped:  ${result.unmapped}`);

      if (result.unmapped > 0) {
        logger.warn(
          `\n⚠️  ${result.unmapped} routes could not be auto-mapped.`,
        );
        logger.warn('   Run with --report to see which routes need attention.');
        logger.warn('   Add missing permissions to permissions.seed.ts or use');
        logger.warn('   @RequirePermission() decorator for explicit mapping.\n');
      } else {
        logger.log('\n🎉 All routes successfully mapped!\n');
      }
    }

    // Show next steps
    logger.log('💡 Next Steps:');
    logger.log('   • Run --validate to check for mapping gaps');
    logger.log('   • Run --report for detailed mapping analysis');
    logger.log('   • Review unmapped routes and add missing permissions');
    logger.log('   • Use @Public() for routes that don\'t need auth');
    logger.log('   • Use @RequirePermission() for explicit mapping\n');

    // Close application
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Route seeding failed!');
    logger.error((error as Error).message);
    logger.error((error as Error).stack);
    process.exit(1);
  }
}

// Execute main function
main();
