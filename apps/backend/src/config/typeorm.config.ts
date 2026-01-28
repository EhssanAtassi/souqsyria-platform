// src/config/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Disabled - entities have duplicate index issues; use SQL migrations instead
  dropSchema: false, // Disable schema dropping to prevent duplicate index errors
  logging: ['error', 'warn'], // Reduce logging to only show errors and warnings
  cache: false,
  // Add connection options to handle duplicate index errors gracefully
  extra: {
    acquireTimeout: 10000,
    timeout: 10000,
    reconnect: true,
  },
};
