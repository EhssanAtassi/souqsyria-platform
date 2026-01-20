/**
 * @description Generic DTO to wrap paginated responses
 */
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
