/**
 * @file seed-runner.ts
 * @description Standalone script to run Syrian address seeds
 *
 * PURPOSE:
 * Provides a command-line interface to seed the database with
 * Syrian administrative divisions (governorates, cities, districts).
 *
 * USAGE:
 * ```bash
 * # From project root
 * npx ts-node apps/backend/src/addresses/seeds/seed-runner.ts
 *
 * # Or with environment
 * NODE_ENV=development npx ts-node apps/backend/src/addresses/seeds/seed-runner.ts
 * ```
 *
 * REQUIREMENTS:
 * - Database connection configured in environment variables
 * - TypeORM entities properly registered
 * - Required tables created (run migrations first)
 *
 * FEATURES:
 * - Idempotent (safe to run multiple times)
 * - Transaction-based (all-or-nothing)
 * - Colored console output
 * - Error handling with rollback
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { seedSyrianDivisions } from './syrian-divisions.seed';
import { SyrianGovernorateEntity } from '../entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../entities/syrian-city.entity';
import { SyrianDistrictEntity } from '../entities/syrian-district.entity';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Main seed runner function
 */
async function runSeeds() {
  console.log(
    `\n${colors.cyan}${colors.bright}╔═══════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}║    🌍  SOUQSYRIA ADDRESS SEED RUNNER  🇸🇾        ║${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}╚═══════════════════════════════════════════════════╝${colors.reset}\n`,
  );

  // Load environment variables
  const envPath = resolve(__dirname, '../../../../../.env');
  config({ path: envPath });

  console.log(
    `${colors.yellow}📝 Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`,
  );
  console.log(
    `${colors.yellow}📝 Database: ${process.env.DB_NAME || 'souqsyria'}${colors.reset}\n`,
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DATABASE CONNECTION
  // ═══════════════════════════════════════════════════════════════════════

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'souqsyria',
    entities: [
      SyrianGovernorateEntity,
      SyrianCityEntity,
      SyrianDistrictEntity,
    ],
    synchronize: false, // Never auto-sync in seed scripts
    logging: false, // Disable SQL logging for cleaner output
  });

  console.log(
    `${colors.yellow}🔌 Connecting to database...${colors.reset}`,
  );

  try {
    // Initialize connection
    await dataSource.initialize();

    console.log(
      `${colors.green}✅ Database connection established${colors.reset}\n`,
    );

    // ═══════════════════════════════════════════════════════════════════
    // RUN SEEDS
    // ═══════════════════════════════════════════════════════════════════

    console.log(
      `${colors.cyan}${colors.bright}🌱 Running Syrian address seeds...${colors.reset}\n`,
    );

    const startTime = Date.now();

    // Run the seed function
    await seedSyrianDivisions(dataSource);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // ═══════════════════════════════════════════════════════════════════
    // SUCCESS
    // ═══════════════════════════════════════════════════════════════════

    console.log(
      `\n${colors.green}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(
      `${colors.green}${colors.bright}✨ ALL SEEDS COMPLETED SUCCESSFULLY! ✨${colors.reset}`,
    );
    console.log(
      `${colors.green}   ⏱️  Completed in ${duration}s${colors.reset}`,
    );
    console.log(
      `${colors.green}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    // Close connection
    await dataSource.destroy();

    console.log(
      `${colors.yellow}🔌 Database connection closed${colors.reset}\n`,
    );

    process.exit(0);
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════

    console.error(
      `\n${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.error(
      `${colors.red}${colors.bright}❌ SEED FAILED WITH ERROR${colors.reset}`,
    );
    console.error(
      `${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    if (error instanceof Error) {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      console.error(`${colors.red}${error.stack}${colors.reset}\n`);
    } else {
      console.error(error);
    }

    // Close connection if open
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log(
        `${colors.yellow}🔌 Database connection closed${colors.reset}\n`,
      );
    }

    process.exit(1);
  }
}

/**
 * Execute the seed runner
 */
if (require.main === module) {
  runSeeds().catch((error) => {
    console.error(
      `${colors.red}${colors.bright}Fatal error:${colors.reset}`,
      error,
    );
    process.exit(1);
  });
}

export { runSeeds };
