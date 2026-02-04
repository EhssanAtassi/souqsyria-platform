/**
 * @file index.ts
 * @description Barrel export for all Search module DTOs.
 *
 * Provides a single import point for all search-related DTOs
 * used across controllers, services, and tests.
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

export { SearchSuggestionsQueryDto } from './search-suggestions-query.dto';
export {
  SearchSuggestionsResponseDto,
  ProductSuggestionDto,
  CategorySuggestionDto,
} from './search-suggestions-response.dto';
export { CreateRecentSearchDto } from './create-recent-search.dto';
export { RecentSearchQueryDto } from './recent-search-query.dto';
