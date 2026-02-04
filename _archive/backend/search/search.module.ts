/**
 * @file search.module.ts
 * @description Search Module for SouqSyria E-commerce Platform
 *
 * Provides header search bar functionality including:
 * - Real-time search suggestions (products, categories, popular queries)
 * - User recent search history management (CRUD)
 * - Popular search aggregation from user behavior
 *
 * ARCHITECTURE:
 * - SearchController: HTTP endpoints for frontend consumption
 * - SearchService: Business logic for search operations
 * - RecentSearch entity: TypeORM entity for search history persistence
 *
 * DEPENDENCIES:
 * - ProductEntity: For product search suggestions
 * - Category: For category search suggestions
 * - RecentSearch: For user search history
 *
 * SECURITY:
 * - Suggestions endpoint is public (anonymous access)
 * - Recent search endpoints require JWT authentication
 *
 * @swagger
 * tags:
 *   name: Search Suggestions
 *   description: Header search bar autocomplete and recent searches API
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Local components
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { RecentSearch } from './entities/recent-search.entity';

// External entities for search queries
import { ProductEntity } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

// Import UsersModule for RolesGuard dependency
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecentSearch,    // Search history storage
      ProductEntity,   // Product search suggestions
      Category,        // Category search suggestions
    ]),
    UsersModule, // Import for RolesGuard dependency resolution
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {
  private readonly logger = new Logger(SearchModule.name);

  constructor() {
    this.logger.log('🔍 SearchModule initialized — autocomplete & recent searches ready');
  }
}
